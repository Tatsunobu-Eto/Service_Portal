# API / Service Reference

本システムで定義されているバックエンドサービス（API）の一覧です。
すべてのロジックは `serverside/services` 配下にドメインごとに整理されています。

## 1. 認証・ユーザー登録 (`services/auth/`)

### `registrationService.ts`
ユーザーのアカウント作成申請と本登録に関するロジック。

| 関数名 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `createRegistrationRequest` | `data: any` | `Promise<RegistrationRequest>` | 新規登録申請を作成（パスワードハッシュ化を含む）。 |
| `getPendingRegistrationRequests` | なし | `Promise<RegistrationRequest[]>` | 承認待ちの登録申請一覧を取得。 |
| `getPendingVerificationRequests` | なし | `Promise<RegistrationRequest[]>` | 承認済み・メール確認待ちの一覧を取得。 |
| `approveRegistration` | `requestId: string` | `Promise<RegistrationApprovalResult>` | 申請を承認し、本登録トークン発行とメール送信を行う。 |
| `verifyRegistrationToken` | `token: string` | `Promise<User>` | トークンを検証し、正規ユーザーを作成。 |
| `rejectRegistration` | `requestId: string` | `Promise<void>` | 登録申請を却下（削除）する。 |

---

## 2. 権限・認可 (`services/permission/`)

### `permissionService.ts`
権限の状態確認や検証に関するコアロジック。

| 関数名 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `getUserPermissions` | `userId: string` | `Promise<UserPermissionInfo[]>` | ユーザーが現在保有している全権限を取得。 |
| `hasPermission` | `userId, service, role?` | `Promise<boolean>` | 指定した権限を保有しているか検証（システム管理者は常にtrue）。 |

### `requestService.ts`
サービスの利用権限申請に関するフロー。

| 関数名 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `createPermissionRequest` | `userId, service, role, dept?` | `Promise<PermissionRequest>` | 新しい権限申請を作成。 |
| `getPendingRequests` | なし | `Promise<PermissionRequestWithDetails[]>` | 未承認の権限申請一覧を取得。 |
| `getUserPendingRequests` | `userId: string` | `Promise<PermissionRequest[]>` | 特定ユーザーの未承認申請を取得。 |
| `approveRequest` | `requestId: string` | `Promise<UserPermission>` | 申請を承認し、権限を付与（トランザクション実行）。 |
| `rejectRequest` | `requestId: string` | `Promise<void>` | 権理申請を却下する。 |
| `promoteToSystemAdmin` | `email: string` | `Promise<void>` | ユーザーを「システム管理者」に昇格させる。 |
| `getAllUsers` | なし | `Promise<UserWithPermissions[]>` | 全ユーザーとそれぞれの保有権限を取得。 |
| `deleteUser` | `userId: string` | `Promise<void>` | ユーザーアカウントを削除する。 |

---

## 3. 組織・構造 (`services/organization/`)

### `departmentService.ts`
組織構造（部署）のマスター管理。

| 関数名 | 引数 | 戻り値 | 説明 |
| :--- | :--- | :--- | :--- |
| `getAllServices` | なし | `Promise<Service[]>` | 登録されている全サービスを取得。 |
| `getAllRoles` | なし | `Promise<Role[]>` | 全ロールを取得（システム管理者を除く）。 |
| `getDepartmentTree` | なし | `Promise<DepartmentWithChildren[]>` | 全部署を階層構造（ツリー形式）で取得。 |

---

## 4. フロントエンド通信 (Server Actions)

`frontend/actions/permissionActions.ts` を通じて、上記のサービスがフロントエンドから呼び出されます。

| Action名 | 対応サービス関数 | 権限チェック |
| :--- | :--- | :--- |
| `submitRegistration` | `createRegistrationRequest` | なし |
| `handleApproveRegistration` | `approveRegistration` | システム管理者のみ |
| `handleRejectRegistration` | `rejectRegistration` | システム管理者のみ |
| `submitRequest` | `createPermissionRequest` | ログイン済みユーザー |
| `handleApprove` | `approveRequest` | システム管理者のみ |
| `handleReject` | `rejectRequest` | システム管理者のみ |
| `handleDeleteUser` | `deleteUser` | システム管理者のみ |
