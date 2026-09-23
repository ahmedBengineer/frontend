import type { MySubscription, SubscriptionPlan, SubscriptionStatus } from "@/lib/billing-types"

type SubscriptionData = MySubscription

export const DEFAULT_SUBSCRIPTION: MySubscription = {
  status: "unassigned",
  software_access_enabled: false,
  requires_payment: false,
  can_checkout: false,
  plan: null,
  limits: { can_create_agent: false },
  usage: {},
  billing: {},
}

/** DRF may return a plain array or { results: [...] } */
export function normalizeApiList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results
  }
  return []
}

export function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function formatCount(value: unknown, fallback = 0): string {
  return toNumber(value, fallback).toLocaleString()
}

export function normalizePlan(plan: unknown): SubscriptionPlan | null {
  if (!plan || typeof plan !== "object") return null
  const p = plan as Record<string, unknown>
  const id = toNumber(p.id, NaN)
  if (!Number.isFinite(id)) return null
  return {
    id,
    name: String(p.name ?? "Plan"),
    price: (p.price ?? 0) as number | string,
    cost_per_minute: (p.cost_per_minute ?? 0) as number | string,
    max_agents: toNumber(p.max_agents),
    max_minutes_per_month: toNumber(p.max_minutes_per_month),
    threshold_minutes: toNumber(p.threshold_minutes),
    is_custom: p.is_custom === true,
    company: p.company != null ? toNumber(p.company) : null,
    created_at: p.created_at != null ? String(p.created_at) : undefined,
  }
}

export function normalizeSubscription(data: unknown): MySubscription {
  if (!data || typeof data !== "object") return { ...DEFAULT_SUBSCRIPTION }
  const d = data as Record<string, unknown>
  const status = d.status as SubscriptionStatus | undefined
  return {
    ...DEFAULT_SUBSCRIPTION,
    ...(d as Partial<MySubscription>),
    status: status ?? DEFAULT_SUBSCRIPTION.status,
    software_access_enabled: d.software_access_enabled === true,
    requires_payment: d.requires_payment === true,
    can_checkout: d.can_checkout === true,
    plan: normalizePlan(d.plan),
    limits: {
      ...DEFAULT_SUBSCRIPTION.limits,
      ...(typeof d.limits === "object" && d.limits ? (d.limits as MySubscription["limits"]) : {}),
    },
    usage: typeof d.usage === "object" && d.usage ? (d.usage as MySubscription["usage"]) : {},
    billing: typeof d.billing === "object" && d.billing ? (d.billing as MySubscription["billing"]) : {},
  }
}

export interface ParsedCompanyUsage {
  id: number
  company: number
  current_agents: number
  current_minutes_used: number
  remaining_minutes: number
  last_reset: string
  extra_minutes: number
  extra_cost: number
}

/** Usage API may return an object, array, paginated list, or empty wrapper. */
export function parseCompanyUsage(data: unknown): ParsedCompanyUsage | null {
  if (data == null) return null
  if (Array.isArray(data)) return data.length > 0 ? parseCompanyUsage(data[0]) : null

  const paginated = normalizeApiList<Record<string, unknown>>(data)
  if (paginated.length > 0) return parseCompanyUsage(paginated[0])

  if (typeof data !== "object") return null
  const d = data as Record<string, unknown>
  if (!("company" in d) && !("current_minutes_used" in d)) return null

  return {
    id: toNumber(d.id, 0),
    company: toNumber(d.company),
    current_agents: toNumber(d.current_agents),
    current_minutes_used: toNumber(d.current_minutes_used),
    remaining_minutes: toNumber(d.remaining_minutes),
    last_reset: d.last_reset != null ? String(d.last_reset) : "",
    extra_minutes: toNumber(d.extra_minutes),
    extra_cost: toNumber(d.extra_cost),
  }
}

/** Price shown on Subscribe buttons — always from API, never hardcoded */
export function getMonthlyAmount(
  subscription: Pick<SubscriptionData, "billing" | "plan"> | null | undefined
): number | null {
  if (!subscription) return null
  const fromBilling = subscription.billing?.monthly_amount
  if (fromBilling != null && Number.isFinite(Number(fromBilling))) {
    return Number(fromBilling)
  }
  const fromPlan = subscription.plan?.price
  if (fromPlan != null && Number.isFinite(Number(fromPlan))) {
    return Number(fromPlan)
  }
  return null
}

export function formatMonthlyAmount(amount: number | null | undefined, currency = "USD"): string {
  if (amount == null || !Number.isFinite(amount)) return "—"
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`
  }
}

export function getSubscribeLabel(
  subscription: Pick<SubscriptionData, "billing" | "plan"> | null | undefined
): string {
  const amount = getMonthlyAmount(subscription)
  const formatted = formatMonthlyAmount(amount, subscription?.billing?.currency ?? "USD")
  return amount != null ? `Subscribe — ${formatted}/mo` : "Subscribe"
}

export function isSubscriptionUnlocked(data: {
  status?: string
  software_access_enabled?: boolean
}): boolean {
  return data.status === "active" && data.software_access_enabled === true
}
