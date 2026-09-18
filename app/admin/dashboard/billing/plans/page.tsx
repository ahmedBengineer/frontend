"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react"
import { CardGridSkeleton } from "@/components/page-skeletons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import type { PlanFormPayload, SubscriptionPlan } from "@/lib/billing-types"
import {
  companyIdFromValue,
  createPlan,
  fetchAdminCompanies,
  fetchPlanById,
  formatApiError,
  getAdminHeaders,
  normalizeApiList,
  parseApiBool,
  toPlanPayload,
  updatePlan,
  type AdminCompany,
} from "@/lib/admin-billing-api"

const API_BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/billing`
const PAGE_SIZE = 10

const EMPTY_FORM: PlanFormPayload = {
  name: "",
  price: "",
  cost_per_minute: "",
  max_agents: 0,
  max_minutes_per_month: 0,
  threshold_minutes: 0,
  is_custom: false,
  company: null,
  is_default: false,
}

const PLAN_FIELDS: {
  key: "name" | "price" | "cost_per_minute" | "max_agents" | "max_minutes_per_month" | "threshold_minutes"
  label: string
  type: "text" | "number"
}[] = [
  { key: "name", label: "Plan name", type: "text" },
  { key: "price", label: "Monthly price (USD)", type: "number" },
  { key: "cost_per_minute", label: "Overage rate ($/min)", type: "number" },
  { key: "max_agents", label: "Max agents", type: "number" },
  { key: "max_minutes_per_month", label: "Included minutes", type: "number" },
  { key: "threshold_minutes", label: "Free threshold (min)", type: "number" },
]

function parsePlan(raw: Record<string, unknown>): SubscriptionPlan {
  const company = companyIdFromValue(raw.company)
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    price: raw.price as number | string,
    cost_per_minute: raw.cost_per_minute as number | string,
    max_agents: Number(raw.max_agents ?? 0),
    max_minutes_per_month: Number(raw.max_minutes_per_month ?? 0),
    threshold_minutes: Number(raw.threshold_minutes ?? 0),
    is_custom: parseApiBool(raw.is_custom),
    is_default: parseApiBool(raw.is_default),
    company,
    created_at: raw.created_at as string | undefined,
  }
}

function planToForm(plan: SubscriptionPlan): PlanFormPayload {
  return {
    name: plan.name,
    price: String(plan.price),
    cost_per_minute: String(plan.cost_per_minute),
    max_agents: plan.max_agents,
    max_minutes_per_month: plan.max_minutes_per_month,
    threshold_minutes: plan.threshold_minutes,
    is_custom: parseApiBool(plan.is_custom),
    company: companyIdFromValue(plan.company),
    is_default: parseApiBool(plan.is_default),
  }
}

export default function PlansPage() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [formData, setFormData] = useState<PlanFormPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    setCompaniesLoading(true)
    try {
      setCompanies(await fetchAdminCompanies())
    } catch (err) {
      console.error("Failed to fetch companies", err)
      setCompanies([])
    } finally {
      setCompaniesLoading(false)
    }
  }

  const openEditPlan = async (plan: SubscriptionPlan, asCustom = false) => {
    setFormError(null)
    setIsDialogOpen(true)
    setSelectedPlan(plan)

    const [list, planRes] = await Promise.all([
      companies.length > 0 ? Promise.resolve(companies) : fetchAdminCompanies(),
      fetchPlanById(plan.id),
    ])
    setCompanies(list)

    let fresh = plan
    if (planRes.ok) {
      const body = await planRes.json()
      if (body && typeof body === "object") {
        fresh = parsePlan(body as Record<string, unknown>)
        setSelectedPlan(fresh)
      }
    }

    const next = planToForm(fresh)
    if (asCustom) {
      next.is_custom = true
      next.is_default = false
      const match = list.find(
        (c) => c.name.toLowerCase() === fresh.name.toLowerCase()
      )
      if (match) next.company = match.id
    }
    setFormData(next)
  }

  const openNewPlan = () => {
    setSelectedPlan(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
    setIsDialogOpen(true)
  }

  const companyName = (id: number | null | undefined) =>
    companies.find((c) => c.id === id)?.name ?? (id != null ? `Company #${id}` : "—")

  // Fetch all plans
  const fetchPlans = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/plans/`, {
        method: "GET",
        headers: getAdminHeaders(),
      })
      if (!res.ok) throw new Error("Failed to fetch plans")
      const data = await res.json()
      setPlans(normalizeApiList<Record<string, unknown>>(data).map(parsePlan))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (isDialogOpen) fetchCompanies()
  }, [isDialogOpen])

  const handleSubmit = async () => {
    setFormError(null)
    const payload = toPlanPayload(formData)
    if (!payload.name) {
      setFormError("Plan name is required")
      return
    }
    if (payload.is_custom && !payload.company) {
      setFormError("Select a company — custom plans must be linked to one company")
      return
    }

    setSaving(true)
    try {
      const res = selectedPlan
        ? await updatePlan(selectedPlan.id, payload)
        : await createPlan(payload)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(formatApiError(err))
      }

      const body = await res.json().catch(() => null)
      let saved: SubscriptionPlan | null = null
      if (body && typeof body === "object") {
        saved = parsePlan(body as Record<string, unknown>)
        setPlans((prev) => {
          const idx = prev.findIndex((p) => p.id === saved!.id)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = saved!
            return next
          }
          return [saved!, ...prev]
        })
      } else {
        await fetchPlans()
      }

      setIsDialogOpen(false)
      setFormData(EMPTY_FORM)
      setSelectedPlan(null)
      if (!saved) await fetchPlans()

      toast({
        title: `Plan ${selectedPlan ? "updated" : "created"}`,
        description: saved?.is_custom
          ? `Custom plan for ${companyName(saved.company)}`
          : saved?.is_default
            ? "Visible in catalog"
            : "Saved successfully",
      })
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save plan",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`${API_BASE}/plans/${deleteId}/`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    })
    if (res.ok) {
      fetchPlans()
      toast({ title: "Plan deleted successfully" })
    } else {
      console.error("Failed to delete plan", await res.text())
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive",
      })
    }
    setIsDeleteDialogOpen(false)
    setDeleteId(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1 h-14 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
              <div>
                <h1 className="text-3xl font-extralight tracking-tight text-slate-900">Subscription Plans</h1>
                <p className="text-sm text-slate-500 font-light mt-1">Create and manage billing plans</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={openNewPlan}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" /> New Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Plan create/edit — root level so edit from cards always opens */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setFormError(null)
            setSelectedPlan(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-light text-slate-800 tracking-tight">
              {selectedPlan ? `Edit Plan — ${selectedPlan.name}` : "Create Plan"}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            {PLAN_FIELDS.map(({ key, label, type }) => (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={key} className="text-right text-sm text-slate-600">
                  {label}
                </Label>
                <Input
                  id={key}
                  type={type}
                  step={type === "number" ? "any" : undefined}
                  value={formData[key] ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [key]: type === "number" ? Number(e.target.value) : e.target.value,
                    })
                  }
                  className="col-span-3 rounded-xl border-slate-200"
                />
              </div>
            ))}

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Plan visibility
              </p>

              {/* is_custom — always shown on create & edit */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="is_custom"
                  checked={formData.is_custom}
                  onCheckedChange={(checked) => {
                    const isCustom = checked === true
                    setFormError(null)
                    setFormData({
                      ...formData,
                      is_custom: isCustom,
                      company: isCustom ? formData.company : null,
                      is_default: isCustom ? false : formData.is_default,
                    })
                  }}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="is_custom" className="text-sm font-medium text-slate-800 cursor-pointer">
                    Custom plan
                  </Label>
                  <p className="text-xs text-slate-500">
                    One company only — never in catalog
                  </p>
                </div>
              </div>

              {/* company — required when is_custom */}
              <div className="space-y-2 pl-7">
                <Label htmlFor="company" className="text-sm text-slate-600">
                  Company {formData.is_custom && <span className="text-rose-500">*</span>}
                </Label>
                <select
                  id="company"
                  disabled={!formData.is_custom || companiesLoading}
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                    formError?.includes("company") ? "border-rose-300" : "border-slate-200"
                  }`}
                  value={formData.company != null ? String(formData.company) : ""}
                  onChange={(e) => {
                    setFormError(null)
                    setFormData({
                      ...formData,
                      company: e.target.value ? Number(e.target.value) : null,
                    })
                  }}
                >
                  <option value="">
                    {!formData.is_custom
                      ? "N/A — standard plan"
                      : companiesLoading
                        ? "Loading companies…"
                        : "Select a company…"}
                  </option>
                  {companies.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {formData.is_custom && !companiesLoading && companies.length === 0 && (
                  <p className="text-xs text-rose-600">Could not load companies.</p>
                )}
              </div>

              {/* is_default — standard plans only */}
              <div className="flex items-start gap-3 border-t border-slate-200/80 pt-4">
                <Checkbox
                  id="is_default"
                  checked={formData.is_default}
                  disabled={formData.is_custom}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_default: checked === true })
                  }
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor="is_default"
                    className={`text-sm font-medium cursor-pointer ${formData.is_custom ? "text-slate-400" : "text-slate-800"}`}
                  >
                    Show in catalog
                  </Label>
                  <p className="text-xs text-slate-500">
                    {formData.is_custom
                      ? "Disabled for custom plans"
                      : "All companies see this plan in the catalog"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
          >
            {saving ? "Saving…" : selectedPlan ? "Save changes" : "Create plan"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-light text-slate-800">Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Are you sure you want to delete this plan?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-8 pt-8">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search plans..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="pl-10 rounded-lg border-slate-200 bg-white h-9 text-sm focus:border-slate-300 transition-all"
          />
        </div>
      </div>

      {/* Plans grid */}
      <div className="max-w-7xl mx-auto px-8 py-6">
      {loading ? (
        <CardGridSkeleton cards={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
      ) : (() => {
        const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        const totalPages = Math.ceil(filteredPlans.length / PAGE_SIZE)
        const pagedPlans = filteredPlans.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
        return (
          <>
            <motion.div
              layout
              className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {pagedPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-slate-800 truncate">
                          {plan.name}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {plan.is_default && (
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                              Catalog
                            </span>
                          )}
                          {plan.is_custom && (
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          onClick={() => openEditPlan(plan)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          onClick={() => {
                            setDeleteId(plan.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-5 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Price</span><span className="font-medium text-slate-800">${plan.price}/mo</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Cost per min</span><span className="font-medium text-slate-800">${plan.cost_per_minute}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Agents</span><span className="font-medium text-slate-800">{plan.max_agents}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Minutes</span><span className="font-medium text-slate-800">{plan.max_minutes_per_month}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Threshold</span><span className="font-medium text-slate-800">{plan.threshold_minutes}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">In catalog</span><span className="font-medium text-slate-800">{plan.is_default ? "Yes" : "Assign only"}</span></div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-500">Custom</span>
                        <span className="font-medium text-slate-800">{plan.is_custom ? "Yes" : "No"}</span>
                      </div>
                      {plan.is_custom && plan.company != null && (
                        <div className="flex justify-between"><span className="text-slate-500">Company</span><span className="font-medium text-slate-800 truncate ml-2">{companyName(plan.company)}</span></div>
                      )}
                      {!plan.is_custom && (
                        <button
                          type="button"
                          onClick={() => openEditPlan(plan, true)}
                          className="w-full mt-2 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-100 rounded-xl py-2 transition-colors"
                        >
                          Make custom plan →
                        </button>
                      )}
                      {plan.created_at && (
                        <p className="text-xs text-slate-400 pt-1">
                          Created: {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {filteredPlans.length === 0 && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm">No plans found matching your search.</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…")
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === "…" ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          currentPage === p
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )
      })()}

      </div>
    </div>
  )
}
