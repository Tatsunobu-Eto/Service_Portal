import { auth } from "@/auth"
import { AdminUserList } from "@/frontend/components/AdminUserList"
import { getAllUsers } from "@/serverside/services/permission/requestService"
import { redirect } from "next/navigation"

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session) redirect("/")

  const isSysAdmin = session.user.permissions.some((p) => p.role === "システム管理者")
  if (!isSysAdmin) {
    return (
      <div className="bg-red-50 p-8 rounded-2xl border border-red-100 text-center">
        <h2 className="text-xl font-bold text-red-900 mb-2">アクセス権限がありません</h2>
        <p className="text-red-700">このページはシステム管理者のみがアクセス可能です。</p>
      </div>
    )
  }

  const users = await getAllUsers()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">アカウント管理</h1>
        <p className="text-gray-500">システムに登録されている全ユーザーと権限を管理します</p>
      </header>

      <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">ユーザー一覧</h2>
              <p className="text-sm text-gray-500">現在 {users.length} 名のユーザーが登録されています</p>
            </div>
          </div>
        </div>

        <AdminUserList users={users} />
      </section>
    </div>
  )
}
