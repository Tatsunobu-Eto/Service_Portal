"use server";

import { auth } from "@/auth";
import {
  approveRegistration,
  createRegistrationRequest,
  rejectRegistration,
} from "@/serverside/services/auth/registrationService";
import {
  approveRequest,
  createPermissionRequest,
  deleteUser,
  getUserPendingRequests,
  rejectRequest,
} from "@/serverside/services/permission/requestService";
import { revalidatePath } from "next/cache";

/**
 * 権限チェックユーティリティ
 */
async function ensureSystemAdmin() {
  const session = await auth();
  const isSysAdmin = session?.user?.permissions.some(
    (p) => p.role === "システム管理者"
  );
  if (!isSysAdmin) {
    throw new Error("Unauthorized: System Admin role required.");
  }
  return session;
}

/**
 * アカウント登録申請の送信
 */
export async function submitRegistration(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      throw new Error("Missing required fields");
    }

    await createRegistrationRequest({ name, email, password });
    return { success: true };
  } catch (error: any) {
    console.error("submitRegistration error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 登録申請の承認
 */
export async function handleApproveRegistration(requestId: string) {
  try {
    await ensureSystemAdmin();
    const result = await approveRegistration(requestId);
    revalidatePath("/");
    return { success: true, result };
  } catch (error: any) {
    console.error("handleApproveRegistration error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 登録申請の却下
 */
export async function handleRejectRegistration(requestId: string) {
  try {
    await ensureSystemAdmin();
    await rejectRegistration(requestId);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("handleRejectRegistration error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * サービス権限申請の送信
 */
export async function submitRequest(
  serviceId: string,
  roleId: string,
  departmentId?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized: Please sign in.");
    }

    // 二重申請チェック
    const pendingRequests = await getUserPendingRequests(session.user.id);
    const alreadyPending = pendingRequests.some((r) => r.serviceId === serviceId);
    if (alreadyPending) {
      throw new Error("This service is already pending approval.");
    }

    await createPermissionRequest(session.user.id, serviceId, roleId, departmentId);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("submitRequest error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 権限申請の承認
 */
export async function handleApprove(requestId: string) {
  try {
    await ensureSystemAdmin();
    await approveRequest(requestId);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("handleApprove error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 権限申請の却下
 */
export async function handleReject(requestId: string) {
  try {
    await ensureSystemAdmin();
    await rejectRequest(requestId);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("handleReject error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * ユーザーの削除
 */
export async function handleDeleteUser(userId: string) {
  try {
    await ensureSystemAdmin();
    await deleteUser(userId);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("handleDeleteUser error:", error.message);
    return { success: false, error: error.message };
  }
}
