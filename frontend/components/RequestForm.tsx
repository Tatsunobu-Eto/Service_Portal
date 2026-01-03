"use client"

import { useState } from "react"
import { submitRequest } from "@/frontend/actions/permissionActions"
import { DepartmentWithChildren } from "@/serverside/types"
import { DepartmentTree } from "./DepartmentTree"

type Props = {
  services: { id: string; name: string }[]
  roles: { id: string; name: string }[]
  departments: DepartmentWithChildren[]
  pendingServiceIds: string[]
}

export function RequestForm({ services, roles, departments, pendingServiceIds }: Props) {
  const [serviceId, setServiceId] = useState(services.find(s => !pendingServiceIds.includes(s.id))?.id || "")
  const [roleId, setRoleId] = useState(roles[0]?.id || "")
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const selectedDepartmentName = departmentId ? findDepartmentName(departments, departmentId) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await submitRequest(serviceId, roleId, departmentId || undefined)
      if (result.success) {
        setMessage("申請を送信しました。")
      } else {
        setMessage(`エラー: ${result.error}`)
      }
    } catch (error) {
      setMessage("エラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-[calc(100vh-140px)] bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-gray-800">権限申請システム</h3>
        {selectedDepartmentName && (
          <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-100 animate-in fade-in slide-in-from-right-4 duration-300">
            選択中: {selectedDepartmentName}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
          <div className="lg:col-span-1 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">サービス</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all"
              >
                {services.map((s) => {
                  const isPending = pendingServiceIds.includes(s.id)
                  return (
                    <option key={s.id} value={s.id} disabled={isPending}>
                      {s.name} {isPending ? "(申請中)" : ""}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">希望権限</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-6 border-t border-gray-100 mt-auto">
              <button
                type="submit"
                disabled={loading || !departmentId}
                className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition shadow-lg shadow-blue-200 disabled:bg-gray-300 disabled:shadow-none text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    送信中...
                  </>
                ) : departmentId ? (
                  "この内容で申請する"
                ) : (
                  "部署を選択してください"
                )}
              </button>
              {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm text-center font-bold ${message.startsWith('エラー') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col min-h-0 border-l border-gray-50 pl-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              組織図から所属部署を選択
            </label>
            <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-gray-100">
              <DepartmentTree
                departments={departments}
                selectedId={departmentId}
                onSelect={(id) => setDepartmentId(id)}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

function findDepartmentName(depts: DepartmentWithChildren[], id: string): string | null {
  for (const dept of depts) {
    if (dept.id === id) return dept.name
    if (dept.children) {
      const found = findDepartmentName(dept.children, id)
      if (found) return found
    }
  }
  return null
}
