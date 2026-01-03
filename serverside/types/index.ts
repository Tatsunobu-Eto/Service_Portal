import { User, Service, Role, UserPermission, PermissionRequest, RegistrationRequest, Department } from "@prisma/client";

/**
 * ユーザー権限情報の型定義
 */
export interface UserPermissionInfo {
  service: string;
  role: string;
}

/**
 * NextAuthのセッションユーザー型
 */
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  permissions: UserPermissionInfo[];
}

/**
 * サービスとロールを含む権限申請の型定義
 */
export interface PermissionRequestWithDetails extends PermissionRequest {
  user: User;
  service: Service;
  role: Role;
  department?: Department | null;
}

/**
 * 権限情報を含むユーザーの型定義
 */
export interface UserWithPermissions extends User {
  permissions: (UserPermission & {
    service: Service;
    role: Role;
    department?: Department | null;
  })[];
}

/**
 * 登録申請の結果型
 */
export interface RegistrationApprovalResult {
  emailSent: boolean;
  email: string;
  error?: string;
}

/**
 * 階層構造を持つ部署の型定義
 */
export type DepartmentWithChildren = Department & {
  children?: DepartmentWithChildren[];
};
