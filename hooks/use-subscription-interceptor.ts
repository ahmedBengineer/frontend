"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSubscription } from "@/components/subscription-provider"
import { BILLING_HOME, isBillingRoute } from "@/lib/billing-paths"

function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.href
  return input.url
}

/**
 * Global 403 interceptor for subscription_payment_required errors.
 *
 * Wraps the native fetch to detect 403 responses with the
 * "subscription_payment_required" error code from any API call.
 * When detected, forces a subscription refetch which triggers the Paywall.
 *
 * Mount this once inside a layout that has SubscriptionProvider.
 */
export function useSubscriptionInterceptor() {
  const { refetch } = useSubscription()
  const pathname = usePathname()
  const router = useRouter()
  const refetchingRef = useRef(false)

  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      // Only intercept 403s from non-subscription endpoints (avoid refetch loops)
      if (response.status === 403) {
        const url = getFetchUrl(args[0])
        if (url.includes("/my-subscription/")) {
          return response
        }

        try {
          const cloned = response.clone()
          const body = await cloned.json()

          if (body?.error === "subscription_payment_required" && !refetchingRef.current) {
            refetchingRef.current = true
            try {
              await refetch()
            } finally {
              refetchingRef.current = false
            }

            if (!isBillingRoute(pathname)) {
              router.push(BILLING_HOME)
            }
          }
        } catch {
          // Not JSON or parse error — ignore
        }
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [refetch, pathname, router])
}
