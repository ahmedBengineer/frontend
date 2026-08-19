"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const adminAuth = localStorage.getItem("adminAuth")

    if (pathname === "/admin" && adminAuth === "true") {
      router.push("/admin/dashboard")
      return
    }

    if (pathname !== "/admin" && adminAuth !== "true") {
      router.push("/admin")
      return
    }

    setIsAuthenticated(adminAuth === "true")
    setLoading(false)
  }, [pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
