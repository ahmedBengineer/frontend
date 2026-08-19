import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import ProtectedRoute from "@/components/protected-route"
import { Paywall } from "@/components/paywall"
import { SubscriptionInterceptor } from "@/components/subscription-interceptor"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["company", "user"]}>
    <SubscriptionInterceptor />
    <Paywall />
    <div className="flex h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
    </ProtectedRoute>
  )
}
