import Cookies from "js-cookie"
import type { AssignPlanPayload, CancelSubscriptionPayload, PlanFormPayload } from "@/lib/billing-types"

const BILLING_BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/billing`
const API_BASE = process.env.NEXT_PUBLIC_BASE_URL

export type AdminCompany = { id: number; name: string }

export function normalizeApiList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results
  }
  return []
}

export function parseApiBool(value: unknown): boolean {
  return value === true || value === 1 || value === "true" || value === "1"
}

/** API may return company as id or nested { id, name } */
export function companyIdFromValue(value: unknown): number | null {
  if (value == null || value === "") return null
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  if (typeof value === "object" && value !== null && "id" in value) {
    const id = Number((value as { id: unknown }).id)
    return Number.isFinite(id) ? id : null
  }
  return null
}

export function getAdminHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Token ${Cookies.get("adminToken") || ""}`,
  }
}

/** Exact body for POST/PATCH — always includes is_default, is_custom, company */
export function toPlanPayload(data: Partial<PlanFormPayload>): PlanFormPayload {
  const isCustom = parseApiBool(data.is_custom)
  const companyId = companyIdFromValue(data.company)
  return {
    name: String(data.name ?? "").trim(),
    price: String(data.price ?? ""),
    cost_per_minute: String(data.cost_per_minute ?? ""),
    max_agents: Number(data.max_agents ?? 0),
    max_minutes_per_month: Number(data.max_minutes_per_month ?? 0),
    threshold_minutes: Number(data.threshold_minutes ?? 0),
    is_default: isCustom ? false : parseApiBool(data.is_default),
    is_custom: isCustom,
    company: isCustom ? companyId : null,
  }
}

export async function fetchPlanById(id: number) {
  return fetch(`${BILLING_BASE}/plans/${id}/`, {
    method: "GET",
    headers: getAdminHeaders(),
  })
}

export async function createPlan(payload: PlanFormPayload) {
  return fetch(`${BILLING_BASE}/plans/`, {
    method: "POST",
    headers: getAdminHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function updatePlan(id: number, payload: PlanFormPayload) {
  return fetch(`${BILLING_BASE}/plans/${id}/`, {
    method: "PATCH",
    headers: getAdminHeaders(),
    body: JSON.stringify(payload),
  })
}

/** DRF may return a plain array or { results: [...] } */
export async function fetchAdminCompanies(): Promise<AdminCompany[]> {
  const res = await fetch(`${API_BASE}/companies/`, { headers: getAdminHeaders() })
  if (!res.ok) return []
  return normalizeApiList<AdminCompany>(await res.json())
}

export function formatApiError(err: unknown): string {
  if (!err || typeof err !== "object") return "Request failed"
  const body = err as Record<string, unknown>
  if (typeof body.detail === "string") return body.detail
  if (Array.isArray(body.detail)) return body.detail.map(String).join(", ")
  const fieldMessages = Object.entries(body)
    .filter(([key]) => key !== "detail")
    .map(([key, val]) => {
      const msg = Array.isArray(val) ? val.join(", ") : String(val)
      return `${key}: ${msg}`
    })
  if (fieldMessages.length) return fieldMessages.join("; ")
  if (typeof body.message === "string") return body.message
  return "Request failed"
}

export async function assignPlan(payload: AssignPlanPayload) {
  return fetch(`${BILLING_BASE}/subscriptions/assign-plan/`, {
    method: "POST",
    headers: getAdminHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function cancelSubscription(payload: CancelSubscriptionPayload) {
  return fetch(`${BILLING_BASE}/subscriptions/cancel-subscription/`, {
    method: "POST",
    headers: getAdminHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function removeSubscription(id: number) {
  return fetch(`${BILLING_BASE}/subscriptions/${id}/`, {
    method: "DELETE",
    headers: getAdminHeaders(),
  })
}
