"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Building2, Bot, CreditCard, Phone, ChevronRight } from "lucide-react"

interface DashboardData {
  companies: { total: number; active: number; pending: number; inactive: number; recent: any[] }
  agents: { total: number; active: number; outbound: number }
  subscriptions: { total: number; active: number; pending_payment: number }
  plans: { total: number }
  numbers: { total: number; companiesWithNumbers: number }
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = Cookies.get("adminToken")
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Token ${token || ""}`,
      }
      const BASE = process.env.NEXT_PUBLIC_BASE_URL

      try {
        const [companiesRes, agentsRes, subscriptionsRes, plansRes] = await Promise.all([
          fetch(`${BASE}/companies/`, { headers }),
          fetch(`${BASE}/agents/agents/`, { headers }),
          fetch(`${BASE}/billing/subscriptions/`, { headers }),
          fetch(`${BASE}/billing/plans/`, { headers }),
        ])

        const companiesRaw = await companiesRes.json()
        const agentsRaw = await agentsRes.json()
        const subscriptionsRaw = await subscriptionsRes.json()
        const plansRaw = await plansRes.json()

        const companies = Array.isArray(companiesRaw) ? companiesRaw : companiesRaw?.results || []
        const agents = Array.isArray(agentsRaw) ? agentsRaw : agentsRaw?.results || []
        const subscriptions = Array.isArray(subscriptionsRaw) ? subscriptionsRaw : subscriptionsRaw?.results || []
        const plans = Array.isArray(plansRaw) ? plansRaw : plansRaw?.results || []

        const activeCompanies = companies.filter((c: any) => c.status === "active")
        const pendingCompanies = companies.filter((c: any) => c.status === "pending")
        const inactiveCompanies = companies.filter((c: any) => c.status === "inactive")
        const recentCompanies = [...companies]
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        const activeAgents = agents.filter((a: any) => a.status === "active")
        const outboundAgents = agents.filter((a: any) => a.type === "Outbound")

        const activeSubscriptions = subscriptions.filter((s: any) => s.is_active)
        const pendingPayment = subscriptions.filter((s: any) => !s.is_active && s.plan)

        const companiesWithNumbers = companies.filter((c: any) => c.twilio_phone_numbers?.length > 0)
        const totalNumbers = companies.reduce((sum: number, c: any) => sum + (c.twilio_phone_numbers?.length || 0), 0)

        setData({
          companies: {
            total: companies.length,
            active: activeCompanies.length,
            pending: pendingCompanies.length,
            inactive: inactiveCompanies.length,
            recent: recentCompanies,
          },
          agents: {
            total: agents.length,
            active: activeAgents.length,
            outbound: outboundAgents.length,
          },
          subscriptions: {
            total: subscriptions.length,
            active: activeSubscriptions.length,
            pending_payment: pendingPayment.length,
          },
          plans: { total: plans.length },
          numbers: { total: totalNumbers, companiesWithNumbers: companiesWithNumbers.length },
        })
      } catch (err) {
        console.error("Dashboard fetch failed", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-8 py-10">
            <div className="flex items-center gap-4">
              <div className="w-1 h-14 bg-slate-200 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="w-48 h-7 bg-slate-200 rounded animate-pulse" />
                <div className="w-64 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-200" />
                  <div className="w-16 h-5 bg-slate-100 rounded" />
                </div>
                <div className="w-20 h-8 bg-slate-200 rounded mt-2" />
                <div className="w-32 h-3 bg-slate-100 rounded mt-2" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse">
                <div className="w-32 h-5 bg-slate-200 rounded mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex justify-between">
                      <div className="w-24 h-4 bg-slate-100 rounded" />
                      <div className="w-10 h-4 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="w-1 h-14 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
            <div>
              <h1 className="text-3xl font-extralight tracking-tight text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500 font-light mt-1">Platform overview and key metrics</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => router.push("/admin/dashboard/companies")}
            className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              {data.companies.pending > 0 && (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  {data.companies.pending} pending
                </span>
              )}
            </div>
            <p className="text-3xl font-extralight text-slate-900">{data.companies.total}</p>
            <p className="text-xs text-slate-500 mt-1">Companies</p>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-emerald-500" />{data.companies.active} active</span>
              <span className="inline-flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-slate-400" />{data.companies.inactive} inactive</span>
            </div>
          </div>

          <div
            onClick={() => router.push("/admin/dashboard/agent-settings")}
            className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              {data.agents.outbound > 0 && (
                <span className="text-[10px] font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                  {data.agents.outbound} outbound
                </span>
              )}
            </div>
            <p className="text-3xl font-extralight text-slate-900">{data.agents.total}</p>
            <p className="text-xs text-slate-500 mt-1">Total Agents</p>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-emerald-500" />{data.agents.active} active</span>
            </div>
          </div>

          <div
            onClick={() => router.push("/admin/dashboard/billing/subscriptions")}
            className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              {data.subscriptions.pending_payment > 0 && (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  {data.subscriptions.pending_payment} unpaid
                </span>
              )}
            </div>
            <p className="text-3xl font-extralight text-slate-900">{data.subscriptions.total}</p>
            <p className="text-xs text-slate-500 mt-1">Subscriptions</p>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-emerald-500" />{data.subscriptions.active} active</span>
            </div>
          </div>

          <div
            onClick={() => router.push("/admin/dashboard/numbers")}
            className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-extralight text-slate-900">{data.numbers.total}</p>
            <p className="text-xs text-slate-500 mt-1">Phone Numbers</p>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
              <span>{data.numbers.companiesWithNumbers} companies with numbers</span>
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Companies */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Recent Companies</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest registrations</p>
              </div>
              <button
                onClick={() => router.push("/admin/dashboard/companies")}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-0.5 transition-colors"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {data.companies.recent.map((company: any) => (
                <div
                  key={company.id}
                  onClick={() => router.push(`/admin/dashboard/companies/${company.id}/view/profile`)}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                      {(company.name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{company.name}</p>
                      <p className="text-[10px] text-slate-400">{company.industry || "No industry"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      company.status === "active" ? "text-emerald-700 bg-emerald-50" :
                      company.status === "pending" ? "text-amber-700 bg-amber-50" :
                      "text-slate-600 bg-slate-50"
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        company.status === "active" ? "bg-emerald-500" :
                        company.status === "pending" ? "bg-amber-500" : "bg-slate-400"
                      }`} />
                      {company.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(company.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
              {data.companies.recent.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-slate-400">No companies yet</div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            {/* Plans */}
            <div
              onClick={() => router.push("/admin/dashboard/billing/plans")}
              className="cursor-pointer bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Billing Plans</h3>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-extralight text-slate-900">{data.plans.total}</p>
              <p className="text-xs text-slate-400 mt-1">Plans configured</p>
            </div>

            {/* Platform Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Platform Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Active companies</span>
                  <span className="text-xs font-medium text-slate-800">{data.companies.active}/{data.companies.total}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${data.companies.total ? (data.companies.active / data.companies.total) * 100 : 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">Active subscriptions</span>
                  <span className="text-xs font-medium text-slate-800">{data.subscriptions.active}/{data.subscriptions.total}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${data.subscriptions.total ? (data.subscriptions.active / data.subscriptions.total) * 100 : 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">Active agents</span>
                  <span className="text-xs font-medium text-slate-800">{data.agents.active}/{data.agents.total}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${data.agents.total ? (data.agents.active / data.agents.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
