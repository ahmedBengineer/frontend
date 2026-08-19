"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import Cookies from "js-cookie"

import type {
  MySubscription,
  SubscriptionBilling,
  SubscriptionLimits,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionUsage,
} from "@/lib/billing-types"
import { DEFAULT_SUBSCRIPTION, normalizeSubscription } from "@/lib/billing-utils"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL

export type {
  MySubscription,
  SubscriptionBilling,
  SubscriptionLimits,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionUsage,
}

/** @alias MySubscription */
export type SubscriptionData = MySubscription

interface SubscriptionContextType {
  subscription: SubscriptionData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// ── Context ─────────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// Cache TTL in ms (30 seconds)
const CACHE_TTL = 30_000

// Paths that don't need subscription checks
const BYPASS_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password-confirm", "/first-time-setup", "/billing/success", "/billing/cancel", "/oauth"]

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastFetchRef = useRef<number>(0)
  const pathname = usePathname()

  const shouldBypass = BYPASS_PATHS.some((p) => pathname.startsWith(p))

  const fetchSubscription = useCallback(async (force = false) => {
    const token = Cookies.get("Token")
    if (!token) {
      setSubscription(null)
      setIsLoading(false)
      return
    }

    // Skip if within cache TTL (unless forced)
    const now = Date.now()
    if (!force && now - lastFetchRef.current < CACHE_TTL && subscription) {
      return
    }

    try {
      const res = await fetch(`${API_BASE}/billing/subscriptions/my-subscription/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          setSubscription(null)
          return
        }
        // 403 often includes subscription payload for unpaid / new accounts
        if (res.status === 403) {
          try {
            const body = await res.json()
            if (body && typeof body === "object") {
              setSubscription(normalizeSubscription(body))
              setError(null)
              lastFetchRef.current = Date.now()
              return
            }
          } catch {
            /* fall through */
          }
        }
        throw new Error("Failed to fetch subscription status")
      }

      const data: SubscriptionData = normalizeSubscription(await res.json())
      setSubscription(data)
      setError(null)
      lastFetchRef.current = Date.now()
    } catch (err: any) {
      console.error("Subscription fetch error:", err)
      setError(err.message)
      // On error, don't block the app — keep previous state or use defaults
      if (!subscription) {
        setSubscription(DEFAULT_SUBSCRIPTION)
      }
    } finally {
      setIsLoading(false)
    }
  }, [subscription])

  // Fetch on mount + when path changes (if not bypass)
  useEffect(() => {
    if (shouldBypass) {
      setIsLoading(false)
      return
    }
    fetchSubscription()
  }, [pathname, shouldBypass]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when window regains focus
  useEffect(() => {
    if (shouldBypass) return

    const handleFocus = () => {
      fetchSubscription()
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [shouldBypass, fetchSubscription])

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        error,
        refetch: () => fetchSubscription(true),
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}
