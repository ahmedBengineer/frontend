import type React from "react"
import ProtectedRoute from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SubscriptionInterceptor } from "@/components/subscription-interceptor"

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["company", "user"]}>
      <SubscriptionInterceptor />
      <div className="flex h-screen bg-slate-50">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
