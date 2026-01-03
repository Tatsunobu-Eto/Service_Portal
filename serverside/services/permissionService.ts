import { prisma } from "@/serverside/db/prisma";
import {
  DepartmentWithChildren,
  PermissionRequestWithDetails,
  RegistrationApprovalResult,
  UserPermissionInfo,
  UserWithPermissions,
} from "@/serverside/types";
import { Prisma, Role, Service } from "@prisma/client";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { sendRegistrationEmail } from "./mailService";

/**
 * 権限・認証関連のサービス
 * ユーザーの権限取得、申請、承認フローを管理します。
 */

// --- 権限取得・検証 ---

/**
 * 指定したユーザーの全権限情報を取得します。
 * @param userId ユーザーID
 * @returns サービス名とロール名の配列
 */
export async function getUserPermissions(
  userId: string
): Promise<UserPermissionInfo[]> {
  const permissions = await prisma.userPermission.findMany({
    where: { userId },
    include: {
      service: true,
      role: true,
    },
  });

  return permissions.map((p) => ({
    service: p.service.name,
    role: p.role.name,
  }));
}

/**
 * ユーザーが特定のサービス・ロールの権限を持っているか検証します。
 * システム管理者の場合は常に true を返します。
 * @param userId ユーザーID
 * @param serviceName サービス名
 * @param roleName ロール名（オプション）
 */
export async function hasPermission(
  userId: string,
  serviceName: string,
  roleName?: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);

  // システム管理者は全権限を持つ（特権ユーザー）
  if (permissions.some((p) => p.role === "システム管理者")) {
    return true;
  }

  if (roleName) {
    return permissions.some(
      (p) => p.service === serviceName && p.role === roleName
    );
  }

  return permissions.some((p) => p.service === serviceName);
}

// --- マスターデータ取得 ---

/**
 * 利用可能なすべてのサービスを取得します。
 */
export async function getAllServices(): Promise<Service[]> {
  return await prisma.service.findMany();
}

/**
 * 利用可能なロールを取得します（システム管理者を除く）。
 */
export async function getAllRoles(): Promise<Role[]> {
  return await prisma.role.findMany({
    where: {
      name: { not: "システム管理者" },
    },
  });
}

/**
 * 階層構造を持った全部署を取得します。
 */
export async function getDepartmentTree(): Promise<DepartmentWithChildren[]> {
  const allDepartments = await prisma.department.findMany();

  const buildTree = (parentId: string | null): DepartmentWithChildren[] => {
    return allDepartments
      .filter((dept) => dept.parentId === parentId)
      .map((dept) => ({
        ...dept,
        children: buildTree(dept.id),
      }));
  };

  return buildTree(null);
}

// --- 権限申請フロー ---

/**
 * サービス利用の権限申請を作成します。
 */
export async function createPermissionRequest(
  userId: string,
  serviceId: string,
  roleId: string,
  departmentId?: string
) {
  return await prisma.permissionRequest.create({
    data: {
      userId,
      serviceId,
      roleId,
      departmentId,
      status: "PENDING",
    },
  });
}

/**
 * 未承認の権限申請一覧を取得します。
 */
export async function getPendingRequests(): Promise<PermissionRequestWithDetails[]> {
  return (await prisma.permissionRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: true,
      service: true,
      role: true,
      department: true,
    },
    orderBy: { createdAt: "desc" },
  })) as unknown as PermissionRequestWithDetails[];
}

/**
 * 特定のユーザーの未承認申請を取得します。
 */
export async function getUserPendingRequests(userId: string) {
  return await prisma.permissionRequest.findMany({
    where: {
      userId,
      status: "PENDING",
    },
    include: {
      service: true,
      role: true,
      department: true,
    },
  });
}

/**
 * 権限申請を承認します。
 * 承認と同時に UserPermission テーブルにレコードを作成または更新します（トランザクション実行）。
 */
export async function approveRequest(requestId: string) {
  const request = await prisma.permissionRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Request not found");

  return await prisma.$transaction(async (tx) => {
    // 1. 申請ステータスを更新
    await tx.permissionRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });

    // 2. 実際の権限を付与 (upsertにより既存権限の上書きに対応)
    return await tx.userPermission.upsert({
      where: {
        userId_serviceId: {
          userId: request.userId,
          serviceId: request.serviceId,
        },
      },
      update: {
        roleId: request.roleId,
        departmentId: request.departmentId,
      },
      create: {
        userId: request.userId,
        serviceId: request.serviceId,
        roleId: request.roleId,
        departmentId: request.departmentId,
      },
    });
  });
}

/**
 * 権限申請を却下します。
 */
export async function rejectRequest(requestId: string) {
  return await prisma.permissionRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });
}

// --- アカウント登録フロー ---

/**
 * 新規アカウント登録の申請を作成します。
 * パスワードはハッシュ化して保存されます。
 */
export async function createRegistrationRequest(data: any) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) throw new Error("This email is already registered.");

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await prisma.registrationRequest.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("A registration request for this email already exists.");
    }
    throw error;
  }
}

/**
 * 未処理の登録申請一覧を取得します。
 */
export async function getPendingRegistrationRequests() {
  return await prisma.registrationRequest.findMany({
    where: { status: "PENDING", token: null },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 管理者による承認済み（本登録待ち）の申請一覧を取得します。
 */
export async function getPendingVerificationRequests() {
  return await prisma.registrationRequest.findMany({
    where: {
      status: "APPROVED",
      token: { not: null },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * 登録申請を承認し、本登録用のメールを送信します。
 */
export async function approveRegistration(
  requestId: string
): Promise<RegistrationApprovalResult> {
  const request = await prisma.registrationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Request not found");

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間

  await prisma.registrationRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      token,
      expiresAt,
    },
  });

  const verifyUrl = `${
    process.env.NEXTAUTH_URL || "http://localhost:3000"
  }/verify-registration?token=${token}`;

  // メール送信（失敗してもログに残して続行）
  try {
    await sendRegistrationEmail(request.email, verifyUrl);
    return { emailSent: true, email: request.email };
  } catch (error: any) {
    console.error("FAILED_TO_SEND_EMAIL:", error.message);
    return { emailSent: false, error: error.message, email: request.email };
  }
}

/**
 * 本登録トークンを検証し、正式なユーザーを作成します。
 */
export async function verifyRegistrationToken(token: string) {
  const request = (await prisma.registrationRequest.findUnique({
    where: { token },
  })) as any;

  if (!request || !request.expiresAt || new Date(request.expiresAt) < new Date()) {
    throw new Error("Invalid or expired token");
  }

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: request.name,
        email: request.email,
        password: request.password,
      },
    });

    await tx.registrationRequest.delete({
      where: { id: request.id },
    });

    return user;
  });
}

/**
 * 登録申請を却下（削除）します。
 */
export async function rejectRegistration(requestId: string) {
  return await prisma.registrationRequest.delete({
    where: { id: requestId },
  });
}

// --- ユーザー管理 ---

/**
 * システム管理者に昇格させます。
 */
export async function promoteToSystemAdmin(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const systemAdminRole = await prisma.role.findUnique({
    where: { name: "システム管理者" },
  });
  if (!systemAdminRole) throw new Error("System Admin role not found");

  const services = await prisma.service.findMany();

  // 全サービスに対してシステム管理者ロールを割り当て
  await Promise.all(
    services.map((service) =>
      prisma.userPermission.upsert({
        where: {
          userId_serviceId: {
            userId: user.id,
            serviceId: service.id,
          },
        },
        update: { roleId: systemAdminRole.id },
        create: {
          userId: user.id,
          serviceId: service.id,
          roleId: systemAdminRole.id,
        },
      })
    )
  );
}

/**
 * 全ユーザーの一覧（権限情報付き）を取得します。
 */
export async function getAllUsers(): Promise<UserWithPermissions[]> {
  return (await prisma.user.findMany({
    include: {
      permissions: {
        include: {
          service: true,
          role: true,
          department: true,
        },
      },
    },
    orderBy: { email: "asc" },
  })) as unknown as UserWithPermissions[];
}

/**
 * ユーザーを削除します。
 */
export async function deleteUser(userId: string) {
  return await prisma.user.delete({
    where: { id: userId },
  });
}
