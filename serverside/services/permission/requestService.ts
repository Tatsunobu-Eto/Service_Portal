import { prisma } from "@/serverside/db/prisma";
import {
  PermissionRequestWithDetails,
  UserWithPermissions,
} from "@/serverside/types";

/**
 * 権限利用申請・ユーザー管理サービス
 */

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
