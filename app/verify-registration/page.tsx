"use client"

import { useEffect, useState, useTransition, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { handleVerifyToken } from "@/frontend/actions/permissionActions"
import Link from "next/link"

function VerifyRegistrationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("登録トークンを検証しています...")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setStatus("error")
      setMessage("無効なリクエストです。トークンが見つかりません。")
      return
    }

    const verify = async () => {
      try {
        const result = await handleVerifyToken(token)
        if (result.success) {
          setStatus("success")
          setMessage("アカウントの本登録が完了しました！")
        } else {
          throw new Error(result.error)
        }
      } catch (error: any) {
        setStatus("error")
        setMessage(error.message || "トークンの検証に失敗しました。期限切れの可能性があります。")
      }
    }

    verify()
  }, [searchParams])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-8 flex justify-center">
          {status === "verifying" && (
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
          {status === "success" && (
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === "error" && (
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        <h1 className={`text-2xl font-black mb-4 ${
          status === "success" ? "text-green-700" : status === "error" ? "text-red-700" : "text-gray-900"
        }`}>
          {status === "success" ? "登録完了！" : status === "error" ? "エラー" : "検証中"}
        </h1>
        
        <p className="text-gray-500 mb-10 leading-relaxed font-medium">
          {message}
        </p>

        {status === "success" && (
          <Link
            href="/"
            className="inline-block w-full bg-blue-600 text-white font-bold py-4 px-8 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            ログイン画面へ
          </Link>
        )}

        {status === "error" && (
          <Link
            href="/"
            className="inline-block w-full bg-gray-900 text-white font-bold py-4 px-8 rounded-2xl hover:bg-gray-800 transition"
          >
            トップページへ戻る
          </Link>
        )}
      </div>
    </div>
  )
}

export default function VerifyRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-black mb-4 text-gray-900">準備中</h1>
          <p className="text-gray-500 mb-10 leading-relaxed font-medium">読み込んでいます...</p>
        </div>
      </div>
    }>
      <VerifyRegistrationContent />
    </Suspense>
  )
}
