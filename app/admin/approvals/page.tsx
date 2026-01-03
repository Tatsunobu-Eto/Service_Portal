import { auth } from "@/auth"
import { AdminRegistrationList } from "@/frontend/components/AdminRegistrationList"
import { AdminRequestList } from "@/frontend/components/AdminRequestList"
import { AdminPendingVerificationList } from "@/frontend/components/AdminPendingVerificationList"
import { 
  getPendingRegistrationRequests, 
  getPendingVerificationRequests 
} from "@/serverside/services/auth/registrationService"
import { getPendingRequests } from "@/serverside/services/permission/requestService"
import { redirect } from "next/navigation"

export default async function AdminApprovalsPage() {
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

  const [pendingPermissions, pendingRegistrations, pendingVerifications] = await Promise.all([
    getPendingRequests(),
    getPendingRegistrationRequests(),
    getPendingVerificationRequests(),
  ])

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">承認・申請管理</h1>
        <p className="text-gray-500">ユーザーからの各種申請をレビューして承認・却下を行います</p>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {/* 1. 権限申請 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">権限利用申請</h2>
              <p className="text-sm text-gray-500">サービスへのアクセス権限リクエスト</p>
            </div>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              {pendingPermissions.length}
            </span>
          </div>
          <AdminRequestList requests={pendingPermissions} />
        </section>

        {/* 2. アカウント登録申請 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">新規アカウント登録申請</h2>
              <p className="text-sm text-gray-500">システム利用開始のためのアカウント申請</p>
            </div>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
              {pendingRegistrations.length}
            </span>
          </div>
          <AdminRegistrationList requests={pendingRegistrations} />
        </section>

        {/* 3. メール確認待ち (本登録待ち) */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">本登録待ち（メール確認中）</h2>
              <p className="text-sm text-gray-500">承認済みでユーザーのメール確認を待っている状態</p>
            </div>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              {pendingVerifications.length}
            </span>
          </div>
          <AdminPendingVerificationList requests={pendingVerifications} />
        </section>
      </div>
    </div>
  )
}
