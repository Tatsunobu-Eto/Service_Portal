# データベース設計書 (Table Definitions)

このドキュメントでは、本プロジェクトで使用されている SQLite データベースのテーブル定義について記述します。

## ER図 (Entity Relationship Diagram)

```mermaid
erDiagram
    User ||--o{ Account : "has"
    User ||--o{ Session : "has"
    User ||--o{ UserPermission : "owns"
    User ||--o{ PermissionRequest : "submits"
    Service ||--o{ UserPermission : "assigned to"
    Service ||--o{ PermissionRequest : "target of"
    Role ||--o{ UserPermission : "assigned to"
    Role ||--o{ PermissionRequest : "requested as"
    Department ||--o{ UserPermission : "scoped to"
    Department ||--o{ PermissionRequest : "requested for"
    Department ||--o{ Department : "parent of"

    User {
        String id PK
        String name
        String email UK
        DateTime emailVerified
        String image
        String password
    }

    Account {
        String id PK
        String userId FK
        String type
        String provider
        String providerAccountId
        String refresh_token
        String access_token
        Int expires_at
        String token_type
        String scope
        String id_token
        String session_state
    }

    Session {
        String id PK
        String sessionToken UK
        String userId FK
        DateTime expires
    }

    RegistrationRequest {
        String id PK
        String name
        String email UK
        String password
        String status "PENDING, APPROVED, REJECTED"
        String token UK
        DateTime expiresAt
        DateTime createdAt
        DateTime updatedAt
    }

    Department {
        String id PK
        String name
        String parentId FK
    }

    Service {
        String id PK
        String name UK
        String description
    }

    Role {
        String id PK
        String name UK
    }

    UserPermission {
        String id PK
        String userId FK
        String serviceId FK
        String roleId FK
        String departmentId FK
    }

    PermissionRequest {
        String id PK
        String userId FK
        String serviceId FK
        String roleId FK
        String departmentId FK
        String status "PENDING, APPROVED, REJECTED"
        DateTime createdAt
        DateTime updatedAt
    }

    VerificationToken {
        String identifier
        String token UK
        DateTime expires
    }
```

## テーブル詳細

### 1. User (ユーザー)
認証されたユーザー情報を保持します。NextAuth の標準テーブルを拡張しています。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | String | PK, cuid() | ユーザーID |
| name | String? | | 氏名 |
| email | String? | Unique | メールアドレス |
| emailVerified | DateTime? | | メール確認日時 |
| image | String? | | プロフィール画像URL |
| password | String? | | ハッシュ化されたパスワード (Credentials用) |

### 2. RegistrationRequest (アカウント登録申請)
新規ユーザー登録の承認待ちデータを保持します。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | String | PK, cuid() | 申請ID |
| name | String | | 氏名 |
| email | String | Unique | メールアドレス |
| password | String | | ハッシュ化されたパスワード |
| status | String | Default: "PENDING" | 状態 (PENDING, APPROVED, REJECTED) |
| token | String? | Unique | 本登録用メールトークン |
| expiresAt | DateTime? | | トークン有効期限 |

### 3. Department (部署)
組織構造を定義するマスターデータです。自己参照による階層構造を持ちます。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | String | PK, cuid() | 部署ID |
| name | String | | 部署名 |
| parentId | String? | FK (Department.id) | 親部署ID (最上位は null) |

### 4. Service (サービス)
権限管理の対象となる各システムや機能のマスターデータです。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | String | PK, cuid() | サービスID |
| name | String | Unique | サービス名 (例: 在庫管理, 人事システム) |
| description | String? | | サービスの説明 |

### 5. Role (ロール)
サービス内での役割を定義するマスターデータです。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | String | PK, cuid() | ロールID |
| name | String | Unique | ロール名 (例: 一般, 管理者, システム管理者) |

### 6. UserPermission (ユーザー権限)
ユーザーがどのサービスに対してどのロールを持っているかを管理する中間テーブルです。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | String | PK, cuid() | 権限ID |
| userId | String | FK (User.id) | ユーザーID |
| serviceId | String | FK (Service.id) | サービスID |
| roleId | String | FK (Role.id) | ロールID |
| departmentId | String? | FK (Department.id) | 所属部署ID |

### 7. PermissionRequest (権限利用申請)
ユーザーからのサービス利用申請を管理します。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| id | String | PK, cuid() | 申請ID |
| userId | String | FK (User.id) | 申請者ID |
| serviceId | String | FK (Service.id) | 対象サービスID |
| roleId | String | FK (Role.id) | 申請ロールID |
| departmentId | String? | FK (Department.id) | 申請時の所属部署ID |
| status | String | Default: "PENDING" | 状態 (PENDING, APPROVED, REJECTED) |

### その他 (NextAuth 標準テーブル)
- **Account**: 外部プロバイダ (Google等) との連携情報
- **Session**: セッション情報
- **VerificationToken**: NextAuth 標準の確認トークン
