/** Canonical billing URL (spec: /billing) */
export const BILLING_HOME = "/billing"

/** Routes that remain accessible when software_access_enabled is false */
export const BILLING_ALLOWED_PATHS = [
  BILLING_HOME,
  "/dashboard/account-settings/billing",
]

export function isBillingRoute(pathname: string): boolean {
  return BILLING_ALLOWED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}
