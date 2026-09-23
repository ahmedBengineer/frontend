"use client"

import { useSubscriptionInterceptor } from "@/hooks/use-subscription-interceptor"

/**
 * Invisible client component that mounts the global 403 interceptor.
 * Place inside any layout wrapped by SubscriptionProvider.
 */
export function SubscriptionInterceptor() {
  useSubscriptionInterceptor()
  return null
}
