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
    <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h3 className="text-lg font-bold mb-4 text-gray-800">権限申請</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">サービス</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">希望権限</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所属部署を選択 (ツリー形式)
            </label>
            <DepartmentTree
              departments={departments}
              selectedId={departmentId}
              onSelect={(id) => setDepartmentId(id)}
            />
            {departmentId && (
              <p className="mt-2 text-xs text-blue-600 font-medium">
                選択中: {findDepartmentName(departments, departmentId)}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !departmentId}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-gray-300"
        >
          {loading ? "送信中..." : departmentId ? "申請する" : "部署を選択してください"}
        </button>
        {message && <p className="text-sm text-center text-blue-600 mt-2">{message}</p>}
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
