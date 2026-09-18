"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"
import { motion } from "framer-motion"
import Image from "next/image"
import { XCircle, CreditCard, LayoutDashboard, Headphones } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL

interface SubscriptionInfo {
  status: string
  software_access_enabled: boolean
  plan: { name: string; price: number } | null
}

export default function BillingCancelPage() {
  const router = useRouter()
  const token = Cookies.get("Token") || ""
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (!token) return

    fetch(`${API_BASE}/billing/subscriptions/my-subscription/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        // If already active, just go to dashboard
        if (data.status === "active" && data.software_access_enabled) {
          router.replace("/dashboard")
          return
        }
        setSub(data)
      })
      .catch(() => {})
  }, [token, router])

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
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-rose-50/70 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-slate-100/80 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* Top stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400" />

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

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center"
          >
            <XCircle className="w-10 h-10 text-rose-400" />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h1 className="text-2xl font-light text-slate-900 tracking-tight">Payment Cancelled</h1>
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              Your subscription is not active yet. No charges have been made. You can complete payment anytime to unlock the platform.
            </p>

            {/* Show plan info if loaded */}
            {sub?.plan && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-light mt-3">
                Plan: <span className="font-medium">{sub.plan.name}</span> — ${sub.plan.price}/month
              </div>
            )}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full space-y-3 pt-2"
          >
            <button
              onClick={handleTryAgain}
              disabled={retrying}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-light transition-colors duration-200 disabled:opacity-60"
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
            <Link
              href="/billing"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-sm font-light transition-colors duration-200"
            >
              <LayoutDashboard className="w-4 h-4" />
              Back to Billing
            </Link>
            <button
              onClick={() => window.open("mailto:support@smartconvo.com", "_blank")}
              className="flex items-center justify-center gap-2 w-full text-xs text-slate-400 hover:text-slate-600 font-light transition-colors pt-1"
            >
              <Headphones className="w-3 h-3" />
              Contact Support
            </button>
          </motion.div>
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
