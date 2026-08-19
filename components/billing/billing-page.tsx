"use client"


import { useEffect, useState } from "react"
import Link from "next/link"
import Cookies from "js-cookie"
import { motion, AnimatePresence } from "framer-motion"
import { useSubscription } from "@/components/subscription-provider"
import { formatMonthlyAmount, formatCount, getMonthlyAmount, getSubscribeLabel, normalizeApiList, normalizePlan, parseCompanyUsage, toNumber } from "@/lib/billing-utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  AlertTriangle, CheckCircle2, Clock, CreditCard, TrendingUp,
  Users, Zap, DollarSign, BarChart2, Calendar, Activity,
  ArrowUpRight, Cpu, Mic, MessageSquare,
} from "lucide-react"
import {
  ComposedChart, Area, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts"


const API_BASE = process.env.NEXT_PUBLIC_BASE_URL


// Types
interface CompanyUsage {
  id: number
  company: number
  current_agents: number
  current_minutes_used: number
  remaining_minutes: number
  last_reset: string
  extra_minutes: number
  extra_cost: number
}

interface Plan {
  id: number
  name: string
  price: number | string
  cost_per_minute: number | string
  max_agents: number
  max_minutes_per_month: number
  threshold_minutes: number
  is_custom: boolean
  company: number | null
  created_at: string
}


interface Subscription {
  id: number
  company: number
  plan: number
  is_active: boolean
  start_date: string
  end_date: string | null
  stripe_subscription_id: string
}


interface ChartSection {
  labels: string[]
  datasets: { label: string; data: number[] }[]
}

interface BillingChartResponse {
  by_day: ChartSection
  by_event_type: ChartSection
}


// ── Radial progress ring ──
function RadialRing({ value, max, color, size = 88 }: { value: number; max: number; color: string; size?: number }) {
  const radius = (size - 14) / 2
  const circumference = 2 * Math.PI * radius
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f1f5f9" strokeWidth={7} fill="none" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth={7} fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - pct) }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  )
}

export default function BillingPage() {
  const { subscription, refetch } = useSubscription()
  const [usage, setUsage] = useState<CompanyUsage | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [showCostWarning, setShowCostWarning] = useState(false)
  const [activeChartTab, setActiveChartTab] = useState<'day' | 'type'>('day')

  // Bar chart state
  const [chartResponse, setChartResponse] = useState<BillingChartResponse | null>(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(fmt(thirtyDaysAgo))
  const [endDate, setEndDate] = useState(fmt(today))


  const token = Cookies.get("Token") || ""


  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        }

        const [usageRes, plansRes, subsRes] = await Promise.all([
          fetch(`${API_BASE}/billing/usage/my_usage/`, { headers }),
          fetch(`${API_BASE}/billing/plans/`, { headers }),
          fetch(`${API_BASE}/billing/subscriptions/`, { headers }),
        ])

        if (plansRes.ok) {
          setPlans(
            normalizeApiList<unknown>(await plansRes.json())
              .map(normalizePlan)
              .filter((p): p is Plan => p != null)
          )
        }
        if (subsRes.ok) {
          setSubscriptions(normalizeApiList<Subscription>(await subsRes.json()))
        }
        if (usageRes.ok) {
          setUsage(parseCompanyUsage(await usageRes.json()))
        }

        if (!plansRes.ok && !usageRes.ok) {
          throw new Error("Failed to fetch billing data")
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    refetch()
  }, [token, refetch])

  const handleCheckout = async () => {
    setCheckingOut(true)
    try {
      const res = await fetch(`${API_BASE}/billing/checkout-session/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.detail || errData?.message || "Checkout failed")
      }

      const { checkout_url } = await res.json()
      window.location.href = checkout_url
    } catch (err: any) {
      setError(err.message)
      setCheckingOut(false)
    }
  }

  // Fetch bar chart data
  const fetchChartData = async () => {
    setChartLoading(true)
    setChartError(null)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      const res = await fetch(`${API_BASE}/billing/events/bar-chart/?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      })
      if (!res.ok) throw new Error('Failed to fetch chart data')
      const json = await res.json()
      setChartResponse(json as BillingChartResponse)
    } catch (err: any) {
      setChartError(err.message)
    } finally {
      setChartLoading(false)
    }
  }

  useEffect(() => { fetchChartData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (usage && usage.remaining_minutes === 0 && usage.extra_cost > 0) {
      const hasSeenWarning = localStorage.getItem("billingCostWarningAcknowledged")
      if (!hasSeenWarning) {
        setShowCostWarning(true)
      }
    }
  }, [usage])

  const handleAcknowledgeCostWarning = () => {
    localStorage.setItem("billingCostWarningAcknowledged", "true")
    setShowCostWarning(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-2 border-slate-200 rounded-full" />
            <div className="absolute inset-0 border-2 border-slate-900 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-light tracking-wider">Loading billing data…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8">
          <p className="text-red-600 font-light">{error}</p>
        </div>
      </div>
    )
  }

  const assignedPlan = subscription?.plan ? normalizePlan(subscription.plan) : null
  const assignedPlanId = assignedPlan?.id ?? null
  const subscriptionStatus = subscription?.status
  const isSubscriptionActive = subscriptionStatus === "active"
  const canCheckout = subscription?.can_checkout === true
  const monthlyAmount = getMonthlyAmount(subscription)
  const subscribeLabel = getSubscribeLabel(subscription)

  const activeSub = usage
    ? subscriptions.find((s) => s.company === usage.company && s.is_active)
    : subscriptions.find((s) => s.is_active)
  const activePlan =
    (isSubscriptionActive && assignedPlan
      ? plans.find((p) => p.id === assignedPlan.id) ?? assignedPlan
      : null) ??
    plans.find((p) => p.id === activeSub?.plan) ??
    (assignedPlanId ? plans.find((p) => p.id === assignedPlanId) ?? assignedPlan : null)

  const displayUsage: CompanyUsage | null = usage ?? (subscription?.usage?.company
    ? {
        id: 0,
        company: toNumber(subscription.usage.company),
        current_agents: toNumber(subscription.usage.current_agents ?? subscription.limits?.agents_used),
        current_minutes_used: toNumber(subscription.usage.current_minutes_used ?? subscription.limits?.minutes_used),
        remaining_minutes: toNumber(subscription.usage.remaining_minutes ?? subscription.limits?.minutes_remaining),
        last_reset: subscription.usage.last_reset ?? "",
        extra_minutes: toNumber(subscription.usage.extra_minutes),
        extra_cost: toNumber(subscription.usage.extra_cost),
      }
    : null)

  const hasUsageStats = displayUsage != null && displayUsage.company > 0

  const EVENT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6']
  const EVENT_ICONS: Record<string, React.ElementType> = { LLM: Cpu, STT: Mic, TTS: MessageSquare }

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ── Cost Warning Modal ── */}
      <AnimatePresence>
        {showCostWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-200"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-7 text-white">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                  </div>
                  <div>
                    <h2 className="text-xl font-light">Quota Exceeded</h2>
                    <p className="text-white/70 text-sm font-light">Overage charges will apply</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-5">
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                  <p className="text-slate-800 font-light leading-relaxed text-sm">
                    Your monthly quota has been fully utilized. Additional usage will incur charges based on per-minute pricing.
                  </p>
                  <div className="mt-4 bg-white rounded-xl p-4 border border-amber-200 text-center">
                    <p className="text-xs text-amber-600 uppercase tracking-widest font-medium mb-1">Overage Rate</p>
                    <p className="text-4xl font-extralight text-slate-900">
                      ${activePlan?.cost_per_minute ?? "0.10"}
                      <span className="text-base text-slate-400 font-light ml-1">/ min</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAcknowledgeCostWarning}
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all font-light flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  I Understand &amp; Acknowledge
                </button>
                <p className="text-center text-slate-400 text-xs font-light">This notice won&apos;t appear again once acknowledged</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── HERO ── */}
      <div className="relative bg-white border-b border-slate-100 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-50/60 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-8 pt-14 pb-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-light mb-5">
              <Activity className="w-3 h-3" />
              Billing &amp; Usage
            </div>
            <h1 className="text-5xl font-extralight text-slate-900 tracking-tight">
              {activePlan ? activePlan.name : "Billing"}
              <span className="text-slate-300 ml-3">Overview</span>
            </h1>
            <p className="text-slate-400 font-light mt-2 text-sm">
              {subscriptionStatus === "pending_payment"
                ? "Complete your subscription to unlock the platform"
                : subscriptionStatus === "unassigned"
                  ? "No plan assigned — contact your administrator"
                  : "Monitor spending, track usage, and manage your subscription"}
            </p>
          </motion.div>

          {subscriptionStatus === "pending_payment" && assignedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium text-amber-900">Payment required for {assignedPlan.name}</p>
                <p className="text-xs text-amber-700/80 font-light mt-1">
                  Subscribe at {formatMonthlyAmount(monthlyAmount, subscription?.billing?.currency)}/month to restore full access.
                </p>
              </div>
              {canCheckout && (
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-light disabled:opacity-60"
                >
                  <CreditCard className="w-4 h-4" />
                  {checkingOut ? "Redirecting…" : subscribeLabel}
                </button>
              )}
            </motion.div>
          )}

          {hasUsageStats && displayUsage && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {[
              { label: 'Minutes Used', value: formatCount(displayUsage.current_minutes_used), unit: 'min', Icon: Clock, bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', sub: 'text-blue-400' },
              { label: 'Remaining', value: formatCount(displayUsage.remaining_minutes), unit: 'min', Icon: Zap, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', sub: 'text-emerald-400' },
              {
                label: 'Extra Cost', value: `$${toNumber(displayUsage.extra_cost).toFixed(2)}`, unit: '', Icon: DollarSign,
                bg: displayUsage.extra_cost > 0 ? 'bg-amber-50' : 'bg-slate-50',
                border: displayUsage.extra_cost > 0 ? 'border-amber-100' : 'border-slate-200',
                text: displayUsage.extra_cost > 0 ? 'text-amber-600' : 'text-slate-400',
                sub: displayUsage.extra_cost > 0 ? 'text-amber-400' : 'text-slate-300',
              },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className={`${kpi.bg} border ${kpi.border} rounded-2xl px-6 py-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <kpi.Icon className={`w-4 h-4 ${kpi.text}`} />
                  <ArrowUpRight className={`w-3.5 h-3.5 ${kpi.sub}`} />
                </div>
                <p className={`text-3xl font-extralight ${kpi.text}`}>
                  {kpi.value}
                  {kpi.unit && <span className={`text-sm ml-1 ${kpi.sub}`}>{kpi.unit}</span>}
                </p>
                <p className={`${kpi.sub} text-xs font-light mt-1.5`}>{kpi.label}</p>
              </motion.div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-7">

        {/* No active plan — prompt to subscribe */}
        {!activePlan && subscriptionStatus !== "unassigned" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border-2 border-dashed border-indigo-200 p-10 flex flex-col items-center text-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-light text-slate-800">No Active Subscription</h3>
              <p className="text-slate-400 text-sm font-light mt-1">Choose a plan to unlock agents, minutes, and full platform access.</p>
            </div>
            <a
              href="/billing/plans"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-light transition-colors duration-200"
            >
              View Plans
            </a>
          </motion.div>
        )}

        {subscriptionStatus === "unassigned" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3"
          >
            <h3 className="text-lg font-light text-slate-800">No subscription plan assigned</h3>
            <p className="text-slate-400 text-sm font-light max-w-md mx-auto">
              Your administrator must assign a plan before you can subscribe. Browse available plans below.
            </p>
          </motion.div>
        )}

        {/* Plan catalog — defaults + assigned */}
        {plans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-light text-slate-900">Plan Catalog</h2>
                <p className="text-sm text-slate-400 font-light mt-1">
                  Default plans plus your assigned plan. Only the assigned plan can be purchased.
                </p>
              </div>
              <Link
                href="/billing/plans"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 text-sm font-light transition-colors"
              >
                View all plans
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isAssigned = plan.id === assignedPlanId
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-5 transition-colors ${
                      isAssigned
                        ? "border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-100"
                        : "border-slate-100 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-light text-slate-800">{plan.name}</h3>
                      {isAssigned && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                          Assigned
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-extralight text-slate-900">
                      ${plan.price}
                      <span className="text-xs text-slate-400 ml-1">/mo</span>
                    </p>
                    <p className="text-xs text-slate-400 font-light mt-2">
                      {formatCount(plan.max_agents)} agents · {formatCount(plan.max_minutes_per_month)} min/mo
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Plan + Usage row */}
        {activePlan && hasUsageStats && displayUsage && (activeSub || isSubscriptionActive) && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Plan card 3/5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-medium mb-3">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Plan
                    </div>
                    <h2 className="text-3xl font-light text-slate-900">{activePlan.name}</h2>
                    <p className="text-slate-400 text-sm font-light mt-1">Billed monthly · Stripe managed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-extralight text-slate-900">${activePlan.price}</p>
                    <p className="text-slate-400 text-sm font-light">/month</p>
                    <Link
                      href="/billing/plans"
                      className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 text-xs font-light transition-all duration-200"
                    >
                      View All Plans
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Max Agents', value: activePlan.max_agents, Icon: Users, bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-600' },
                    { label: 'Max Minutes', value: activePlan.max_minutes_per_month, Icon: Clock, bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
                    { label: 'Cost / Minute', value: `$${activePlan.cost_per_minute}`, Icon: CreditCard, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
                    { label: 'Threshold', value: `${activePlan.threshold_minutes} min`, Icon: Activity, bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center gap-3 ${item.bg} border ${item.border} rounded-2xl px-4 py-3.5`}>
                      <item.Icon className={`w-4 h-4 ${item.text} shrink-0`} />
                      <div>
                        <p className="text-xs text-slate-400 font-light">{item.label}</p>
                        <p className="text-base font-light text-slate-800">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {activeSub && (
                <div className="mt-7 pt-7 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400 font-light uppercase tracking-widest">Subscription Period</p>
                    {!activeSub.end_date && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 font-light">● Active</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: activeSub.end_date
                          ? `${Math.min(((new Date().getTime() - new Date(activeSub.start_date).getTime()) / (new Date(activeSub.end_date).getTime() - new Date(activeSub.start_date).getTime())) * 100, 100).toFixed(2)}%`
                          : '100%',
                      }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-light mt-2">
                    <span>{new Date(activeSub.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {activeSub.end_date && <span>{new Date(activeSub.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                  </div>
                  <p className="mt-3 text-xs text-slate-300 font-mono truncate">{activeSub.stripe_subscription_id}</p>
                </div>
                )}
              </div>
            </motion.div>

            {/* Usage rings 2/5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col"
            >
              <h3 className="text-lg font-light text-slate-900 mb-7">Usage This Month</h3>

              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <RadialRing value={displayUsage.current_minutes_used} max={activePlan.max_minutes_per_month} color="#6366f1" size={88} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-indigo-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extralight text-slate-900">{displayUsage.current_minutes_used}</span>
                      <span className="text-xs text-slate-400 font-light">/ {activePlan.max_minutes_per_month} min</span>
                    </div>
                    <p className="text-slate-500 text-xs font-light mt-0.5">Minutes Used</p>
                    <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((displayUsage.current_minutes_used / activePlan.max_minutes_per_month) * 100, 100)}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <RadialRing value={displayUsage.current_agents} max={activePlan.max_agents} color="#10b981" size={88} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extralight text-slate-900">{displayUsage.current_agents}</span>
                      <span className="text-xs text-slate-400 font-light">/ {activePlan.max_agents} agents</span>
                    </div>
                    <p className="text-slate-500 text-xs font-light mt-0.5">Active Agents</p>
                    <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((displayUsage.current_agents / activePlan.max_agents) * 100, 100)}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl px-4 py-3.5 border flex items-center gap-3 ${displayUsage.extra_cost > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                  <Zap className={`w-4 h-4 shrink-0 ${displayUsage.extra_cost > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <p className={`text-xs font-light ${displayUsage.extra_cost > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Extra Minutes</p>
                    <p className={`text-lg font-extralight ${displayUsage.extra_cost > 0 ? 'text-amber-800' : 'text-slate-600'}`}>{displayUsage.extra_minutes}</p>
                  </div>
                  {displayUsage.extra_cost > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-amber-600 font-light">Extra Cost</p>
                      <p className="text-lg font-extralight text-amber-800">${toNumber(displayUsage.extra_cost).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {displayUsage.last_reset && (
              <p className="text-xs text-slate-300 font-light mt-5">
                Last reset: {new Date(displayUsage.last_reset).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              )}
            </motion.div>
          </div>
        )}

        {/* ── Analytics ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden"
        >
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-light text-slate-900">Analytics</h2>
                <p className="text-sm text-slate-400 font-light mt-0.5">Billing event breakdown by time and service</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm text-slate-700 font-light bg-transparent outline-none cursor-pointer"
                  />
                </div>
                <span className="text-slate-300 text-xs">→</span>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm text-slate-700 font-light bg-transparent outline-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={fetchChartData}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-light rounded-xl transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mt-5">
              {(['day', 'type'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveChartTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-light transition-all duration-200 ${
                    activeChartTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'day' ? 'By Day' : 'By Event Type'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {chartLoading ? (
              <div className="flex items-center justify-center h-72">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border-2 border-slate-100 rounded-full" />
                  <div className="absolute inset-0 border-2 border-slate-900 rounded-full border-t-transparent animate-spin" />
                </div>
              </div>
            ) : chartError ? (
              <div className="flex items-center justify-center h-72">
                <p className="text-sm text-red-400 font-light">{chartError}</p>
              </div>
            ) : !chartResponse ? (
              <div className="flex flex-col items-center justify-center h-72 gap-3">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                  <BarChart2 className="w-6 h-6 text-slate-200" />
                </div>
                <p className="text-sm text-slate-300 font-light">No billing events in this range</p>
              </div>
            ) : activeChartTab === 'day' ? (
              (() => {
                const section = chartResponse.by_day
                if (!section?.labels || !section?.datasets) {
                  return (
                    <div className="flex flex-col items-center justify-center h-72 gap-3">
                      <p className="text-sm text-slate-300 font-light">No billing events in this range</p>
                    </div>
                  )
                }
                const { labels, datasets } = section
                const minutesDs = datasets.find((d: { label: string; data: number[] }) => d.label === 'Minutes')
                const costDs = datasets.find((d: { label: string; data: number[] }) => d.label === 'Cost (USD)')
                const data = labels.map((label: string, i: number) => ({
                  label,
                  Minutes: minutesDs?.data[i] ?? 0,
                  Cost: costDs?.data[i] ?? 0,
                }))
                const totalMinutes = minutesDs?.data.reduce((s: number, v: number) => s + v, 0) ?? 0
                const totalCost = costDs?.data.reduce((s: number, v: number) => s + v, 0) ?? 0
                return (
                  <div>
                    <div className="flex flex-wrap items-center gap-8 mb-8">
                      <div>
                        <p className="text-3xl font-extralight text-slate-900">{totalMinutes.toFixed(1)}</p>
                        <p className="text-xs text-slate-400 font-light uppercase tracking-widest mt-0.5">Total Minutes</p>
                      </div>
                      <div className="w-px h-10 bg-slate-100 hidden sm:block" />
                      <div>
                        <p className="text-3xl font-extralight text-slate-900">${totalCost.toFixed(4)}</p>
                        <p className="text-xs text-slate-400 font-light uppercase tracking-widest mt-0.5">Total Cost</p>
                      </div>
                      <div className="flex-1" />
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-2 text-xs text-slate-400 font-light">
                          <span className="inline-block w-6 h-0.5 bg-indigo-500 rounded-full" />
                          Minutes
                        </span>
                        <span className="flex items-center gap-2 text-xs text-slate-400 font-light">
                          <span className="inline-block w-6 border-t-2 border-dashed border-amber-400" />
                          Cost (USD)
                        </span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={data} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradMinutes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#f8fafc" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 300 }}
                          tickFormatter={(v) => { const d = new Date(v); return isNaN(d.getTime()) ? v : `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}` }}
                          interval="preserveStartEnd"
                        />
                        <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 300 }} tickFormatter={(v: number) => v.toFixed(0)} />
                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#fcd34d', fontWeight: 300 }} tickFormatter={(v: number) => `$${v.toFixed(3)}`} />
                        <Tooltip
                          cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 2' }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            const d = new Date(label ?? '')
                            const dl = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : label
                            return (
                              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-xl min-w-[170px]">
                                <p className="text-xs text-slate-400 font-light mb-2">{dl}</p>
                                {payload.map((p) => (
                                  <p key={p.name} className="text-sm font-light text-slate-900 flex justify-between gap-6">
                                    <span className="text-slate-400">{p.name}</span>
                                    <span className="font-medium">{p.name === 'Cost' ? `$${Number(p.value).toFixed(4)}` : Number(p.value).toFixed(2)}</span>
                                  </p>
                                ))}
                              </div>
                            )
                          }}
                        />
                        <Area yAxisId="left" type="monotone" dataKey="Minutes" stroke="#6366f1" strokeWidth={2} fill="url(#gradMinutes)" dot={false} activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Cost" stroke="#f59e0b" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} strokeDasharray="5 3" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )
              })()
            ) : (
              (() => {
                const section = chartResponse.by_event_type
                if (!section?.labels || !section?.datasets) {
                  return (
                    <div className="flex flex-col items-center justify-center h-72 gap-3">
                      <p className="text-sm text-slate-300 font-light">No billing events in this range</p>
                    </div>
                  )
                }
                const { labels, datasets } = section
                const minutesDs = datasets.find((d: { label: string; data: number[] }) => d.label === 'Minutes')
                const costDs = datasets.find((d: { label: string; data: number[] }) => d.label === 'Cost (USD)')
                const data = labels.map((label: string, i: number) => ({
                  label: label.toUpperCase(),
                  Minutes: minutesDs?.data[i] ?? 0,
                  Cost: costDs?.data[i] ?? 0,
                }))
                return (
                  <div>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {data.map((d: { label: string; Minutes: number; Cost: number }, i: number) => {
                        const Icon = EVENT_ICONS[d.label] ?? Activity
                        const color = EVENT_COLORS[i] ?? '#6366f1'
                        return (
                          <div
                            key={d.label}
                            className="rounded-2xl p-5 border"
                            style={{ backgroundColor: `${color}0d`, borderColor: `${color}33` }}
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <Icon className="w-4 h-4" style={{ color }} />
                              <span className="text-xs font-medium tracking-wide" style={{ color }}>{d.label}</span>
                            </div>
                            <p className="text-2xl font-extralight text-slate-900">
                              {d.Minutes.toFixed(1)}
                              <span className="text-xs text-slate-400 font-light ml-1">min</span>
                            </p>
                            <p className="text-xs text-slate-400 font-light mt-1">${d.Cost.toFixed(4)} cost</p>
                          </div>
                        )
                      })}
                    </div>
                    <ResponsiveContainer width="100%" height={data.length * 72 + 32}>
                      <BarChart data={data} layout="vertical" barCategoryGap="35%" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid horizontal={false} stroke="#f8fafc" />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 300 }} tickFormatter={(v: number) => v.toFixed(0)} />
                        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} width={42} />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-xl min-w-[160px]">
                                <p className="text-xs text-slate-400 font-light mb-2">{label}</p>
                                {payload.map((p) => (
                                  <p key={p.name} className="text-sm font-light text-slate-900 flex justify-between gap-6">
                                    <span className="text-slate-400">{p.name}</span>
                                    <span className="font-medium">{p.name === 'Cost' ? `$${Number(p.value).toFixed(4)}` : Number(p.value).toFixed(2)}</span>
                                  </p>
                                ))}
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="Minutes" radius={[0, 6, 6, 0]} maxBarSize={36}>
                          {data.map((_: unknown, i: number) => (
                            <Cell key={i} fill={EVENT_COLORS[i] ?? '#6366f1'} fillOpacity={0.85} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              })()
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
