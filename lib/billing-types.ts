export type SubscriptionStatus = "unassigned" | "pending_payment" | "active" | "inactive"

export interface SubscriptionPlan {
  id: number
  name: string
  price: number | string
  cost_per_minute: number | string
  max_agents: number
  max_minutes_per_month: number
  threshold_minutes: number
  is_default?: boolean
  is_custom?: boolean
  company?: number | null
  created_at?: string
}

export interface SubscriptionLimits {
  agents_used?: number
  agents_max?: number
  agents_remaining?: number
  minutes_used?: number
  minutes_max?: number
  minutes_remaining?: number
  can_create_agent: boolean
}

export interface SubscriptionUsage {
  company?: number
  current_agents?: number
  current_minutes_used?: number
  remaining_minutes?: number
  extra_minutes?: number
  extra_cost?: number
  last_reset?: string | null
}

export interface SubscriptionBilling {
  monthly_amount?: number | null
  currency?: string
  billing_cycle?: string
  next_billing?: string | null
  auto_renewal?: boolean
}

export interface SubscriptionRecord {
  id: number
  stripe_subscription_id?: string | null
  start_date?: string | null
  end_date?: string | null
  last_billed_at?: string | null
  created_at?: string
}

export interface MySubscription {
  has_subscription?: boolean
  status: SubscriptionStatus
  is_active?: boolean
  is_paid?: boolean
  requires_payment: boolean
  software_access_enabled: boolean
  can_checkout: boolean
  subscription?: SubscriptionRecord | null
  plan: SubscriptionPlan | null
  limits: SubscriptionLimits
  usage: SubscriptionUsage
  billing: SubscriptionBilling
}

/** POST/PATCH /api/billing/plans/ — all fields required in body */
export interface PlanFormPayload {
  name: string
  price: string
  cost_per_minute: string
  max_agents: number
  max_minutes_per_month: number
  threshold_minutes: number
  is_custom: boolean
  company: number | null
  is_default: boolean
}

export interface AssignPlanPayload {
  company_id: number
  plan_id: number
}

export interface CancelSubscriptionPayload {
  company_id: number
}

/** Admin list row from GET /api/billing/subscriptions/ */
export interface AdminSubscription {
  id: number
  company: number
  plan: number
  plan_details?: SubscriptionPlan | null
  is_active: boolean
  stripe_subscription_id?: string | null
  start_date?: string | null
  end_date?: string | null
}
