"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { LogOut, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useSubscription } from "@/components/subscription-provider"

export function BillingShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth()
  const { subscription } = useSubscription()
  const router = useRouter()
  const hasAccess = subscription?.software_access_enabled === true

  const handleLogout = () => {
    Cookies.remove("Token")
    Cookies.remove("adminToken")
    Cookies.remove("TempToken")
    localStorage.removeItem("user")
    localStorage.removeItem("userAuth")
    localStorage.removeItem("loginType")
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <Link href={hasAccess ? "/dashboard" : "/billing"} className="flex items-center gap-3">
            <Image src="/Logo.png" alt="SmartConvo" width={120} height={32} className="object-contain" priority />
          </Link>
          <div className="flex items-center gap-2">
            {hasAccess && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
