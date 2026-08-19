"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Cookies from "js-cookie"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { useSubscription } from "@/components/subscription-provider"
import { formatMonthlyAmount, getMonthlyAmount, getSubscribeLabel, normalizeApiList, normalizePlan, formatCount, toNumber } from "@/lib/billing-utils"
import {
  CheckCircle2,
  Users,
  Clock,
  CreditCard,
  Zap,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Star,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL

interface Plan {
  id: number
  name: string
  price: number | string
  cost_per_minute: number | string
  max_agents: number
  max_minutes_per_month: number
  threshold_minutes: number
  is_custom: boolean
  is_default?: boolean
}

const CARD_GRADIENTS = [
  "from-blue-50 to-indigo-50",
  "from-violet-50 to-purple-50",
  "from-emerald-50 to-teal-50",
  "from-amber-50 to-orange-50",
  "from-rose-50 to-pink-50",
]

function PlanCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-slate-100 rounded-full" />
        <div className="h-8 w-32 bg-slate-100 rounded-xl" />
        <div className="h-10 w-20 bg-slate-100 rounded-xl" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 w-full bg-slate-100 rounded-full" />
        ))}
      </div>
      <div className="h-11 w-full bg-slate-100 rounded-2xl" />
    </div>
  )
}

function formatPrice(price: number | string) {
  const n = typeof price === "number" ? price : parseFloat(price)
  return Number.isFinite(n) ? n.toFixed(n % 1 === 0 ? 0 : 2) : String(price)
}

export default function PlansPage() {
  const { subscription, refetch } = useSubscription()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = Cookies.get("Token") || ""
  const assignedPlanId = subscription?.plan?.id ?? null
  const isActive = subscription?.status === "active"
  const canCheckout = subscription?.can_checkout === true
  const assignedPlan = subscription?.plan
  const monthlyAmount = getMonthlyAmount(subscription)
  const subscribeLabel = getSubscribeLabel(subscription)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_BASE}/billing/plans/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        })
        if (!res.ok) throw new Error("Failed to load plans")
        setPlans(
          normalizeApiList<unknown>(await res.json())
            .map(normalizePlan)
            .filter((p): p is Plan => p != null)
        )
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
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
        const errCode = errData?.error || errData?.code || ""

        if (errCode === "no_plan_assigned") {
          toast({
            title: "No plan assigned",
            description: "Contact your administrator to assign a plan.",
            variant: "destructive",
          })
          setCheckingOut(false)
          return
        }

        if (errData?.detail?.includes?.("already active") || errData?.message?.includes?.("already active")) {
          window.location.href = "/dashboard"
          return
        }

        throw new Error(errData?.detail || errData?.error || "Failed to create checkout session")
      }

      const { checkout_url } = await res.json()
      window.location.href = checkout_url
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message,
        variant: "destructive",
      })
      setCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="relative bg-white border-b border-slate-100 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-50/70 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-50/70 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 pt-10 pb-12">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-light mb-6">
            <Link
              href="/billing"
              className="hover:text-slate-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Billing
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600">Plans</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-light mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Plan Catalog
            </div>
            <h1 className="text-4xl md:text-5xl font-extralight text-slate-900 tracking-tight">
              Available Plans
            </h1>
            <p className="text-slate-400 font-light mt-2 text-sm max-w-lg">
              Browse default plans below. Your administrator assigns the plan your company subscribes to — only that plan can be purchased.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
        {subscription?.status === "unassigned" && (
          <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-slate-600 text-sm font-light">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800">No plan assigned yet</p>
              <p className="mt-1">Contact your administrator to assign a subscription plan before checkout.</p>
            </div>
          </div>
        )}

        {assignedPlan && !isActive && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-indigo-900">Your assigned plan: {assignedPlan.name}</p>
              <p className="text-xs text-indigo-600/80 font-light mt-1">
                Complete payment for this plan to unlock SmartConvo.
              </p>
            </div>
            {canCheckout && (
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-light disabled:opacity-60"
              >
                {checkingOut ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    {subscribeLabel}
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {error ? (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-6 py-5 text-rose-600 text-sm font-light max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <PlanCardSkeleton key={i} />)}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-light text-sm">
            No plans available at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, idx) => {
              const isAssigned = assignedPlanId === plan.id
              const isCurrentActive = isAssigned && isActive
              const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length]

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  className={`relative flex flex-col bg-white rounded-3xl border-2 overflow-hidden shadow-sm transition-all duration-300
                    ${isAssigned
                      ? "border-indigo-300 shadow-indigo-100 shadow-md ring-2 ring-indigo-100"
                      : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                    }`}
                >
                  <div className={`bg-gradient-to-br ${gradient} px-8 pt-8 pb-6`}>
                    <div className="flex items-center gap-2 mb-4 min-h-[24px] flex-wrap">
                      {isAssigned && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-medium">
                          <Star className="w-3 h-3 fill-indigo-500 text-indigo-500" />
                          {isCurrentActive ? "Your Plan" : "Assigned to You"}
                        </span>
                      )}
                      {plan.is_custom && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-medium">
                          Custom
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-light text-slate-800 mb-1">{plan.name}</h2>

                    <div className="flex items-end gap-1.5 mt-3">
                      <span className="text-5xl font-extralight text-slate-900 tracking-tight">
                        ${formatPrice(plan.price)}
                      </span>
                      <span className="text-slate-400 text-sm font-light pb-1.5">/month</span>
                    </div>
                  </div>

                  <div className="flex-1 px-8 py-6 space-y-3.5">
                    {[
                      { Icon: Users, label: "AI Agents", value: formatCount(plan.max_agents), color: "text-violet-500" },
                      { Icon: Clock, label: "Minutes / month", value: formatCount(plan.max_minutes_per_month), color: "text-blue-500" },
                      { Icon: CreditCard, label: "Overage rate", value: `$${toNumber(plan.cost_per_minute)}/min`, color: "text-amber-500" },
                      { Icon: Zap, label: "Threshold", value: `${formatCount(plan.threshold_minutes)} min`, color: "text-emerald-500" },
                    ].map(({ Icon, label, value, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <Icon className={`w-3.5 h-3.5 ${color}`} />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-light">{label}</span>
                          <span className="text-sm font-light text-slate-700">{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-8 pb-8">
                    {isCurrentActive ? (
                      <button
                        disabled
                        className="w-full h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 text-sm font-light cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Active Plan
                      </button>
                    ) : isAssigned && canCheckout ? (
                      <button
                        onClick={handleCheckout}
                        disabled={checkingOut}
                        className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-light transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {checkingOut ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Redirecting to Stripe…
                          </>
                        ) : (
                          <>
                            Complete Payment
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full h-11 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 text-sm font-light cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isAssigned ? "Payment unavailable" : "Catalog only"}
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {!loading && !error && plans.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-slate-400 font-light"
          >
            Plans shown are defaults plus your assigned plan. Contact your administrator to change assignments.
          </motion.p>
        )}
      </div>
    </div>
  )
}
