"use client"

import type React from "react"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const tabs = [
  { id: "profile", label: "Profile", href: "profile" },
  // { id: "agents", label: "Agent Info", href: "agents" },
  // { id: "agent-settings", label: "Agent Settings", href: "agent-settings" },
  // { id: "conversations", label: "Conversations", href: "conversations" },
  // { id: "integrations", label: "Integrations", href: "integrations" },
  // { id: "billing", label: "Billing Info", href: "billing" },
]

export default function EditCompanyLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const companyId = params.id

  const currentTab = pathname.split("/").pop()

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/dashboard/companies">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 hover:shadow-md transition-all duration-200">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-light text-slate-800 tracking-tight">Edit Company</h1>
          <p className="text-xs text-slate-500 font-light">Company ID: {companyId}</p>
        </div>
      </div>

      {/* Horizontal Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-1.5">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/admin/dashboard/companies/${companyId}/edit/${tab.href}`}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                currentTab === tab.href
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
