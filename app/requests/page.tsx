import { auth } from "@/auth"
import { RequestForm } from "@/frontend/components/RequestForm"
import { getDepartmentTree } from "@/serverside/services/organization/departmentService"
import { getUserPendingRequests } from "@/serverside/services/permission/requestService"
import { getAllRoles, getAllServices } from "@/serverside/services/organization/departmentService"
import { redirect } from "next/navigation"

export default async function RequestsPage() {
  const session = await auth()
  if (!session) redirect("/")

  const services = await getAllServices()
  const roles = await getAllRoles()
  const departments = await getDepartmentTree()
  const userPendingRequests = await getUserPendingRequests(session.user.id)
  const pendingServiceIds = userPendingRequests.map(r => r.serviceId)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">権限申請</h1>
        <p className="text-gray-500">新しいサービスへのアクセス権を申請します</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4">申請にあたっての注意事項</h2>
            <ul className="text-sm text-gray-600 space-y-3 list-disc list-inside leading-relaxed">
              <li>申請後、IT部門のシステム管理者による承認が必要です。</li>
              <li>通常、承認には1〜2営業日ほどお時間をいただいております。</li>
              <li>「一般」権限は閲覧のみ、「管理者」権限はデータの編集が可能です。</li>
              <li>承認または却下された結果は、このポータル上で確認できます。</li>
            </ul>
          </section>

          {userPendingRequests.length > 0 && (
            <section className="bg-orange-50 p-8 rounded-2xl border border-orange-100">
              <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                現在申請中のサービス
              </h2>
              <div className="space-y-3">
                {userPendingRequests.map(req => (
                  <div key={req.id} className="bg-white px-4 py-3 rounded-lg border border-orange-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-bold text-gray-900">{(req as any).service?.name}</p>
                      <p className="text-xs text-gray-500">希望権限: {(req as any).role?.name}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-orange-100 text-orange-700 rounded uppercase">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="flex-1">
          <RequestForm 
            services={services} 
            roles={roles} 
            departments={departments}
            pendingServiceIds={pendingServiceIds}
          />
        </div>
      </div>
    </div>
  )
}
