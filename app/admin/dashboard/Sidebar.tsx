"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  Home,
  Building2,
  LogOut,
  Phone,
  Bot,
  CreditCard,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"

const sidebarItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Companies", href: "/admin/dashboard/companies", icon: Building2 },
  { name: "Manage Numbers", href: "/admin/dashboard/numbers", icon: Phone },
  { name: "Agent Configuration", href: "/admin/dashboard/agent-settings", icon: Bot },
  {
    name: "Billing",
    icon: CreditCard,
    children: [
      { name: "Manage Plans", href: "/admin/dashboard/billing/plans", icon: CreditCard },
      { name: "Manage Subscriptions", href: "/admin/dashboard/billing/subscriptions", icon: CreditCard },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["Billing"])
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("adminAuth")
    router.push("/admin")
  }

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    )
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 transition-all duration-300",
        isCollapsed ? "w-[5.5rem]" : "w-[17.5rem]"
      )}
    >
      <div
        className={cn(
          isCollapsed ? "w-20" : "w-64",
          "bg-[#0f1525] flex flex-col rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-indigo-600/10 transition-all duration-300",
          "fixed top-4 left-4 h-[calc(100vh-2rem)] z-10"
        )}
      >
        {/* Logo & Collapse Toggle */}
        <div className="p-6 flex items-center justify-between select-none rounded-t-3xl">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">Admin</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-indigo-600/20 rounded-xl transition-colors"
          >
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                isCollapsed ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => !isCollapsed && toggleExpanded(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-all duration-200",
                      "text-slate-400 hover:bg-indigo-600/10 hover:text-white"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.name}</span>}
                    </div>
                    {!isCollapsed &&
                      (expandedItems.includes(item.name) ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      ))}
                  </button>
                  {!isCollapsed && expandedItems.includes(item.name) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 text-sm rounded-xl transition-all duration-200",
                            pathname === child.href
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:bg-indigo-600/10 hover:text-white"
                          )}
                        >
                          <child.icon className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">{child.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href!}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200",
                    pathname === item.href
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:bg-indigo-600/10 hover:text-white"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-indigo-600/20 rounded-b-3xl">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200",
              "text-slate-400 hover:bg-rose-600/10 hover:text-rose-400"
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
