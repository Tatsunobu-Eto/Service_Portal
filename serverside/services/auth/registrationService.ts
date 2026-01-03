import { prisma } from "@/serverside/db/prisma";
import { RegistrationApprovalResult } from "@/serverside/types";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { sendRegistrationEmail } from "../mailService";

/**
 * ユーザー登録・アカウント申請管理サービス
 */

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
