"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { assignPlan, getAdminHeaders } from "@/lib/admin-billing-api"
import type { SubscriptionPlan } from "@/lib/billing-types"
import { Loader2 } from "lucide-react"

const API_BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/billing`

type Company = { id: number; name: string }

export default function EditCompanyBilling() {
  const params = useParams()
  const companyId = Number(params.id)
  const { toast } = useToast()

  const [company, setCompany] = useState<Company | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [planId, setPlanId] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const headers = getAdminHeaders()
        const [companyRes, plansRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyId}/`, { headers }),
          fetch(`${API_BASE}/plans/`, { headers }),
        ])

        if (companyRes.ok) setCompany(await companyRes.json())
        if (plansRes.ok) setPlans(await plansRes.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (companyId) load()
  }, [companyId])

  const handleAssign = async () => {
    if (!planId) {
      toast({ title: "Select a plan", variant: "destructive" })
      return
    }

    setAssigning(true)
    try {
      const res = await assignPlan({ company_id: companyId, plan_id: planId })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail || err?.message || "Failed to assign plan")
      }

      toast({
        title: "Plan assigned",
        description: "Company users must complete Stripe checkout to unlock access.",
      })
    } catch (err: unknown) {
      toast({
        title: "Assignment failed",
        description: err instanceof Error ? err.message : "Failed to assign plan",
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-light text-slate-800">Assign Subscription Plan</h2>
        <p className="text-slate-500 text-sm mt-1">
          {company ? `Assign a plan to ${company.name}.` : "Select the plan this company must pay for."}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plan_id">Plan</Label>
          <select
            id="plan_id"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            value={planId || ""}
            onChange={(e) => setPlanId(Number(e.target.value))}
          >
            <option value="">Select a plan…</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — ${plan.price}/mo
                {plan.is_default ? " (catalog)" : ""}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-slate-500">
          Any plan can be assigned. The company pays only for this plan via Stripe — they cannot choose a different catalog plan.
        </p>

        <Button
          onClick={handleAssign}
          disabled={assigning || !planId}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
        >
          {assigning ? "Assigning…" : "Assign Plan"}
        </Button>
      </div>
    </div>
  )
}
