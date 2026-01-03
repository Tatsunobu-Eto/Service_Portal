import { prisma } from "@/serverside/db/prisma";
import { UserPermissionInfo } from "@/serverside/types";

/**
 * 権限検証・認可コアサービス
 * ユーザーの保有権限の取得および検証を担当します。
 */

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
