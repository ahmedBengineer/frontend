"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Cookies from "js-cookie"
import { useSubscription } from "@/components/subscription-provider"
import { useAuth } from "@/components/auth-provider"
import { BILLING_HOME, isBillingRoute } from "@/lib/billing-paths"
import { formatMonthlyAmount, formatCount, getMonthlyAmount, toNumber } from "@/lib/billing-utils"
import { toast } from "@/hooks/use-toast"
import {
  Lock,
  CreditCard,
  Users,
  Clock,
  Zap,
  ChevronRight,
  AlertCircle,
  PhoneOff,
  Sparkles,
  Headphones,
  LogOut,
  Receipt,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL

function PaywallSpinner() {
  return (
    <span className="relative inline-block w-4 h-4">
      <span className="absolute inset-0 border-2 border-white/30 rounded-full" />
      <span className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </span>
  )
}

export function Paywall() {
  const { subscription, isLoading } = useSubscription()
  const { logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [checkingOut, setCheckingOut] = useState(false)

  // Don't render anything while loading or if access is enabled
  if (isLoading || !subscription || subscription.software_access_enabled) {
    return null
  }

  // Billing routes stay fully accessible — user manages subscription there
  if (isBillingRoute(pathname)) {
    return null
  }

  const { status, can_checkout, plan } = subscription

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

  const handleGoToBilling = () => {
    router.push(BILLING_HOME)
  }

  const monthlyAmount = getMonthlyAmount(subscription)
  const monthlyLabel = formatMonthlyAmount(monthlyAmount, subscription.billing?.currency)

  const handleCheckout = async () => {
    setCheckingOut(true)
    try {
      const token = Cookies.get("Token") || ""
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

        throw new Error(errData?.detail || errData?.message || "Checkout failed")
      }

      const { checkout_url } = await res.json()
      window.location.href = checkout_url
    } catch (err: any) {
      toast({
        title: "Checkout error",
        description: err.message,
        variant: "destructive",
      })
      setCheckingOut(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col bg-slate-900/60 backdrop-blur-sm"
      >
        {/* Escape hatch — logout & billing always reachable */}
        <div className="relative z-[10000] flex items-center justify-between px-4 py-3 md:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-light">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Subscription required to access the platform</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoToBilling}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              Billing &amp; Plans
            </button>
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

        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-lg mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Gradient top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

          <div className="p-8 md:p-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center">
                {status === "unassigned" ? (
                  <Headphones className="w-7 h-7 text-indigo-400" />
                ) : status === "inactive" ? (
                  <PhoneOff className="w-7 h-7 text-rose-400" />
                ) : (
                  <Lock className="w-7 h-7 text-indigo-500" />
                )}
              </div>
            </div>

            {/* ── UNASSIGNED ── */}
            {status === "unassigned" && (
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-light text-slate-900 tracking-tight">
                  No Plan Assigned
                </h2>
                <p className="text-slate-400 text-sm font-light leading-relaxed max-w-sm mx-auto">
                  Your account does not have a subscription plan yet. Please contact your administrator to get started.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-light mt-4">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Reach out to support or your admin
                </div>
              </div>
            )}

            {/* ── PENDING PAYMENT ── */}
            {status === "pending_payment" && plan && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium mb-2">
                    <Sparkles className="w-3 h-3" />
                    Payment Required
                  </div>
                  <h2 className="text-2xl font-light text-slate-900 tracking-tight">
                    Activate Your Subscription
                  </h2>
                  <p className="text-slate-400 text-sm font-light leading-relaxed">
                    Your administrator has assigned the <span className="text-slate-600 font-medium">{plan.name}</span> plan.
                    Complete payment to unlock your account.
                  </p>
                </div>

                {/* Plan details card */}
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-light text-slate-800">{plan.name}</h3>
                    <div className="text-right">
                      <span className="text-3xl font-extralight text-slate-900">{monthlyLabel}</span>
                      <span className="text-slate-400 text-xs font-light ml-1">/mo</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { Icon: Users, label: "Agents", value: formatCount(plan.max_agents), color: "text-violet-500" },
                      { Icon: Clock, label: "Minutes", value: `${formatCount(plan.max_minutes_per_month)}/mo`, color: "text-blue-500" },
                      { Icon: CreditCard, label: "Overage", value: `$${toNumber(plan.cost_per_minute)}/min`, color: "text-amber-500" },
                      { Icon: Zap, label: "Threshold", value: `${formatCount(plan.threshold_minutes)} min`, color: "text-emerald-500" },
                    ].map(({ Icon, label, value, color }) => (
                      <div key={label} className="flex items-center gap-2.5 bg-white rounded-xl border border-slate-100 px-3 py-2.5">
                        <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                        <div>
                          <p className="text-[10px] text-slate-400 font-light">{label}</p>
                          <p className="text-xs font-light text-slate-700">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checkout button */}
                {can_checkout && (
                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-light transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                  >
                    {checkingOut ? (
                      <>
                        <PaywallSpinner />
                        Redirecting to Stripe…
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay Now — {monthlyLabel}/month
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* ── INACTIVE ── */}
            {status === "inactive" && (
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-light text-slate-900 tracking-tight">
                  Subscription Inactive
                </h2>
                <p className="text-slate-400 text-sm font-light leading-relaxed max-w-sm mx-auto">
                  Your subscription has expired or been deactivated. Renew to restore access.
                </p>

                {can_checkout ? (
                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-light transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 mt-4"
                  >
                    {checkingOut ? (
                      <>
                        <PaywallSpinner />
                        Redirecting to Stripe…
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Renew Subscription
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-light mt-4">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Contact support to renew
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 md:px-10 pb-6 space-y-3">
            <button
              type="button"
              onClick={handleGoToBilling}
              className="w-full text-center text-xs text-indigo-500 hover:text-indigo-700 font-light transition-colors"
            >
              View billing dashboard &amp; all plans →
            </button>
            <p className="text-center text-[10px] text-slate-300 font-light">
              Payments securely processed by Stripe · TLS encrypted
            </p>
          </div>
        </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
