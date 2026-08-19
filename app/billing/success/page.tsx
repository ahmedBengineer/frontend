"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  XCircle,
  RefreshCw,
  CreditCard,
  Headphones,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL
const POLL_INTERVAL_MS = 2000

type PageState = "loading" | "confirmed" | "timeout" | "failed"

function SpinnerIcon() {
  return (
    <span className="relative inline-block w-16 h-16">
      <span className="absolute inset-0 border-2 border-slate-200 rounded-full" />
      <span className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </span>
  )
}

function StatusIcon({ state }: { state: PageState }) {
  if (state === "loading") return <SpinnerIcon />

  const config = {
    confirmed: { bg: "bg-emerald-50", border: "border-emerald-200", Icon: CheckCircle2, color: "text-emerald-500" },
    timeout: { bg: "bg-amber-50", border: "border-amber-200", Icon: AlertCircle, color: "text-amber-500" },
    failed: { bg: "bg-rose-50", border: "border-rose-200", Icon: XCircle, color: "text-rose-500" },
  }[state]!

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`w-20 h-20 rounded-full ${config.bg} border-2 ${config.border} flex items-center justify-center`}
    >
      <config.Icon className={`w-10 h-10 ${config.color}`} />
    </motion.div>
  )
}

export default function BillingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")

  const [pageState, setPageState] = useState<PageState>("loading")
  const [retrying, setRetrying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deadlineRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneRef = useRef(false) // prevents double-state after cleanup

  const token = Cookies.get("Token") || ""

  const stopAll = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (deadlineRef.current) { clearTimeout(deadlineRef.current); deadlineRef.current = null }
  }

  // Broad check — accept any signal that the subscription is active
  const isActive = (data: any) =>
    data.software_access_enabled === true ||
    data.is_active === true ||
    data.is_paid === true ||
    data.status === "active"

  const activateAndRedirect = () => {
    doneRef.current = true
    stopAll()
    setPageState("confirmed")
    setTimeout(() => router.replace("/dashboard"), 3000)
  }

  const startPolling = () => {
    stopAll()
    doneRef.current = false
    setPageState("loading")

    const poll = async () => {
      if (doneRef.current) return
      const controller = new AbortController()
      const fetchTimeout = setTimeout(() => controller.abort(), 8000)

      try {
        const res = await fetch(`${API_BASE}/billing/subscriptions/my-subscription/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          signal: controller.signal,
        })
        clearTimeout(fetchTimeout)

        console.log("[billing/success] my-subscription status:", res.status)

        if (!res.ok) {
          console.warn("[billing/success] my-subscription non-ok:", res.status)
          return
        }

        const data = await res.json()
        console.log("[billing/success] my-subscription response:", data)
        if (doneRef.current) return

        if (isActive(data)) {
          console.log("[billing/success] Active detected — redirecting")
          activateAndRedirect()
          return
        }

        if (data.status === "inactive") {
          console.log("[billing/success] Status inactive — showing failed")
          doneRef.current = true
          stopAll()
          setPageState("failed")
          return
        }

        console.log("[billing/success] Not active yet, status:", data.status)
      } catch (err) {
        clearTimeout(fetchTimeout)
        console.warn("[billing/success] Poll error:", err)
      }
    }

    // Hard 30-second deadline
    deadlineRef.current = setTimeout(() => {
      if (!doneRef.current) {
        console.warn("[billing/success] 30s deadline reached — showing timeout")
        doneRef.current = true
        stopAll()
        setPageState("timeout")
      }
    }, 30_000)

    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
  }

  useEffect(() => {
    console.log("[billing/success] token:", token ? "present" : "MISSING", "| session_id:", sessionId)
    if (!token) {
      router.push("/login")
      return
    }

    const bootstrap = async () => {
      if (sessionId) {
        console.log("[billing/success] Calling confirm-checkout with session_id:", sessionId)
        try {
          const res = await fetch(`${API_BASE}/billing/confirm-checkout/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          })
          console.log("[billing/success] confirm-checkout status:", res.status)
          if (res.ok) {
            const data = await res.json()
            console.log("[billing/success] confirm-checkout response:", data)
            if (isActive(data)) {
              console.log("[billing/success] confirm-checkout → active, redirecting")
              activateAndRedirect()
              return
            }
          } else {
            console.warn("[billing/success] confirm-checkout failed:", res.status)
          }
        } catch (err) {
          console.warn("[billing/success] confirm-checkout error:", err)
        }
      }
      console.log("[billing/success] Starting polling loop")
      startPolling()
    }

    bootstrap()
    return stopAll
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    startPolling()
  }

  const handleTryAgain = async () => {
    setRetrying(true)
    try {
      const res = await fetch(`${API_BASE}/billing/checkout-session/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("Checkout failed")
      const { checkout_url } = await res.json()
      window.location.href = checkout_url
    } catch {
      setRetrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-6">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-50/80 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-emerald-50/80 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* Top stripe */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${
          pageState === "failed"
            ? "from-rose-400 via-pink-400 to-rose-500"
            : pageState === "timeout"
              ? "from-amber-400 via-orange-400 to-amber-500"
              : "from-indigo-500 via-violet-500 to-emerald-500"
        }`} />

        <div className="p-10 flex flex-col items-center text-center space-y-6">
          {/* Logo */}
          <Image
            src="/Logo.png"
            alt="SmartConvo"
            width={140}
            height={40}
            className="object-contain"
            priority
          />

          {/* Status icon */}
          <AnimatePresence mode="wait">
            <motion.div key={pageState} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StatusIcon state={pageState} />
            </motion.div>
          </AnimatePresence>

          {/* Text content */}
          <AnimatePresence mode="wait">
            {pageState === "loading" && (
              <motion.div key="loading-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                <h1 className="text-2xl font-light text-slate-900 tracking-tight">Activating Your Subscription</h1>
                <p className="text-slate-400 text-sm font-light leading-relaxed">
                  Payment successful — activating your subscription. This usually takes a few seconds.
                </p>
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {pageState === "confirmed" && (
              <motion.div key="confirmed-text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <h1 className="text-2xl font-light text-slate-900 tracking-tight">Subscription Activated!</h1>
                <p className="text-slate-400 text-sm font-light leading-relaxed">
                  Everything is ready. Redirecting you to the dashboard…
                </p>
                {sessionId && (
                  <p className="text-xs text-slate-300 font-mono pt-1 truncate max-w-xs">Session: {sessionId}</p>
                )}
              </motion.div>
            )}

            {pageState === "timeout" && (
              <motion.div key="timeout-text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <h1 className="text-2xl font-light text-slate-900 tracking-tight">Payment Received</h1>
                <p className="text-slate-400 text-sm font-light leading-relaxed">
                  Activation is taking longer than usual. Please try refreshing or contact support if this persists.
                </p>
              </motion.div>
            )}

            {pageState === "failed" && (
              <motion.div key="failed-text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <h1 className="text-2xl font-light text-slate-900 tracking-tight">Activation Failed</h1>
                <p className="text-slate-400 text-sm font-light leading-relaxed">
                  We could not activate your subscription. Please try again or contact support.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTAs */}
          <AnimatePresence>
            {pageState === "confirmed" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full space-y-3 pt-2">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-light transition-colors duration-200"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}

            {pageState === "timeout" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full space-y-3 pt-2">
                <button
                  onClick={handleRefresh}
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-light transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-sm font-light transition-colors duration-200"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => window.open("mailto:support@smartconvo.com", "_blank")}
                  className="flex items-center justify-center gap-2 w-full text-xs text-slate-400 hover:text-slate-600 font-light transition-colors pt-1"
                >
                  <Headphones className="w-3 h-3" />
                  Contact Support
                </button>
              </motion.div>
            )}

            {pageState === "failed" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full space-y-3 pt-2">
                <button
                  onClick={handleTryAgain}
                  disabled={retrying}
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-light transition-colors duration-200 disabled:opacity-60"
                >
                  {retrying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Try Again
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.open("mailto:support@smartconvo.com", "_blank")}
                  className="flex items-center justify-center gap-2 w-full text-xs text-slate-400 hover:text-slate-600 font-light transition-colors pt-1"
                >
                  <Headphones className="w-3 h-3" />
                  Contact Support
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-xs text-slate-400 font-light"
      >
        Powered by Stripe · Secured by TLS
      </motion.p>
    </div>
  )
}
