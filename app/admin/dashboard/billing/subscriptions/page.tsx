"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Plus, Pencil, Trash2, Search, Ban } from "lucide-react"
import { CardGridSkeleton } from "@/components/page-skeletons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  assignPlan,
  cancelSubscription,
  formatApiError,
  getAdminHeaders,
  normalizeApiList,
  removeSubscription,
} from "@/lib/admin-billing-api"
import type { AdminSubscription, AssignPlanPayload } from "@/lib/billing-types"

const API_BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/billing`
const PAGE_SIZE = 10

type Company = { id: number; name: string }
type Plan = { id: number; name: string }

const EMPTY_ASSIGN: AssignPlanPayload = { company_id: 0, plan_id: 0 }

function getSubscriptionStatus(sub: AdminSubscription): { label: string; className: string } {
  const hasStripe = Boolean(sub.stripe_subscription_id)
  const hasPlan = Boolean(sub.plan)

  if (sub.is_active && hasStripe) {
    return { label: "Paid / Active", className: "text-emerald-700 bg-emerald-50" }
  }
  if (hasPlan && !hasStripe) {
    return { label: "Awaiting payment", className: "text-amber-700 bg-amber-50" }
  }
  if (!sub.is_active && hasStripe) {
    return { label: "Cancelled / Inactive", className: "text-slate-600 bg-slate-100" }
  }
  if (!sub.is_active && !hasStripe && hasPlan) {
    return { label: "Cancelled (can re-pay)", className: "text-slate-600 bg-slate-100" }
  }
  return { label: "Inactive", className: "text-slate-400 bg-slate-50" }
}

function canCancelSubscription(sub: AdminSubscription): boolean {
  return sub.is_active && Boolean(sub.stripe_subscription_id)
}

export default function SubscriptionsPage() {
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [assignForm, setAssignForm] = useState<AssignPlanPayload>(EMPTY_ASSIGN)
  const [assigning, setAssigning] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [removeId, setRemoveId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AdminSubscription | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // API Calls
  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/subscriptions/`, { headers: getAdminHeaders() })
      if (!res.ok) throw new Error("Failed to fetch subscriptions")
      setSubscriptions(normalizeApiList<AdminSubscription>(await res.json()))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/`, {
        headers: getAdminHeaders(),
      })
      if (res.ok) setCompanies(await res.json())
    } catch (err) {
      console.error("Failed to fetch companies", err)
    }
  }

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_BASE}/plans/`, { headers: getAdminHeaders() })
      if (res.ok) setPlans(await res.json())
    } catch (err) {
      console.error("Failed to fetch plans", err)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  useEffect(() => {
    if (isDialogOpen) {
      fetchCompanies()
      fetchPlans()
    }
  }, [isDialogOpen])

  const handleAssignPlan = async () => {
    const { company_id, plan_id } = assignForm
    if (!company_id || !plan_id) {
      toast({ title: "Select a company and plan", variant: "destructive" })
      return
    }

    setAssigning(true)
    try {
      const res = await assignPlan({ company_id, plan_id })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail || err?.message || "Failed to assign plan")
      }

      setIsDialogOpen(false)
      setAssignForm(EMPTY_ASSIGN)
      fetchSubscriptions()
      toast({
        title: "Plan assigned",
        description: "The company will see pending payment on next login.",
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

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const res = await cancelSubscription({ company_id: cancelTarget.company })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(formatApiError(err))
      }
      const data = await res.json().catch(() => ({}))
      await fetchSubscriptions()
      toast({
        title: "Subscription cancelled",
        description:
          data?.message ||
          "Stripe auto-renewal stopped. The company is locked but can pay again later.",
      })
    } catch (err: unknown) {
      toast({
        title: "Cancel failed",
        description: err instanceof Error ? err.message : "Failed to cancel subscription",
        variant: "destructive",
      })
    } finally {
      setCancelling(false)
      setIsCancelConfirmOpen(false)
      setCancelTarget(null)
    }
  }

  const handleRemove = async () => {
    if (!removeId) return
    setRemoving(true)
    try {
      const res = await removeSubscription(removeId)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(formatApiError(err))
      }
      await fetchSubscriptions()
      toast({ title: "Removed", description: "Subscription assignment permanently removed." })
    } catch (err: unknown) {
      toast({
        title: "Remove failed",
        description: err instanceof Error ? err.message : "Failed to remove subscription",
        variant: "destructive",
      })
    } finally {
      setRemoving(false)
      setIsRemoveConfirmOpen(false)
      setRemoveId(null)
    }
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
                <h1 className="text-3xl font-extralight tracking-tight text-slate-900">Subscriptions</h1>
                <p className="text-sm text-slate-500 font-light mt-1">Assign plans to companies and manage billing</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setAssignForm(EMPTY_ASSIGN)}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 shadow-md"
                >
                  <Plus className="mr-2 h-4 w-4" /> Assign Plan
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl border-0">
            <div className="bg-slate-900 px-6 pt-6 pb-5">
              <DialogTitle className="text-base font-medium text-white tracking-tight">
                Assign Plan to Company
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-1">
                Company users pay for the assigned plan via Stripe checkout.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="company_id" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</Label>
                <select
                  id="company_id"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-400 transition-colors"
                  value={assignForm.company_id || ""}
                  onChange={(e) => setAssignForm({ ...assignForm, company_id: Number(e.target.value) })}
                >
                  <option value="">Select a company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan_id" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</Label>
                <select
                  id="plan_id"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-400 transition-colors"
                  value={assignForm.plan_id || ""}
                  onChange={(e) => setAssignForm({ ...assignForm, plan_id: Number(e.target.value) })}
                >
                  <option value="">Select a plan…</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignPlan}
                disabled={assigning}
                className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md"
              >
                {assigning ? "Assigning…" : "Assign Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by Stripe ID..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
          className="pl-10 rounded-lg border-slate-200 bg-white h-9 text-sm focus:border-slate-300 transition-all"
        />
      </div>

      {/* Subscriptions Grid */}
      {loading ? (
        <CardGridSkeleton cards={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
      ) : (() => {
        const filteredSubs = subscriptions.filter(sub =>
          sub.stripe_subscription_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(sub.id).includes(searchTerm)
        )
        const totalPages = Math.ceil(filteredSubs.length / PAGE_SIZE)
        const pagedSubs = filteredSubs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
        return (
          <>
            <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pagedSubs.map((sub) => {
                const status = getSubscriptionStatus(sub)
                const planLabel = sub.plan_details?.name ?? `Plan #${sub.plan}`
                return (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800">Sub #{sub.id}</h3>
                        <span className={`inline-flex items-center text-xs font-medium mt-1 px-2 py-0.5 rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Re-assign plan"
                          onClick={() => {
                            setAssignForm({ company_id: sub.company, plan_id: sub.plan })
                            setIsDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove subscription"
                          onClick={() => {
                            setRemoveId(sub.id)
                            setIsRemoveConfirmOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-5 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Company</span><span className="font-medium text-slate-800">{sub.company}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="font-medium text-slate-800">{planLabel}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Start</span><span className="font-medium text-slate-800">{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">End</span><span className="font-medium text-slate-800">{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "Ongoing"}</span></div>
                      <p className="text-xs text-slate-400 pt-1 truncate" title={sub.stripe_subscription_id ?? undefined}>
                        Stripe: {sub.stripe_subscription_id || "—"}
                      </p>
                    </div>
                    {canCancelSubscription(sub) && (
                      <div className="px-5 pb-5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                          onClick={() => {
                            setCancelTarget(sub)
                            setIsCancelConfirmOpen(true)
                          }}
                        >
                          <Ban className="mr-2 h-3.5 w-3.5" />
                          Cancel subscription
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )})}
            </motion.div>

            {filteredSubs.length === 0 && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm">No subscriptions found.</p>
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

      {/* Cancel Confirm */}
      <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This stops auto-renewal and locks the company&apos;s access. They can pay again later.
          </p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelConfirmOpen(false)
                setCancelTarget(null)
              }}
              disabled={cancelling}
            >
              Keep active
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel subscription"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm */}
      <Dialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Remove subscription</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Permanently remove subscription assignment? This also cancels Stripe billing if the subscription is paid.
          </p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsRemoveConfirmOpen(false)
                setRemoveId(null)
              }}
              disabled={removing}
            >
              Keep
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing}>
              {removing ? "Removing…" : "Remove permanently"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  )
}



// "use client"

// import { useEffect, useState } from "react"
// import Cookies from "js-cookie"
// import { motion } from "framer-motion"
// import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// const API_BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/billing`

// type Subscription = {
//   id: number
//   company: number
//   plan: number
//   start_date: string
//   end_date: string | null
//   is_active: boolean
//   stripe_subscription_id: string
// }

// type Company = { // ⭐ NEW
//   id: number
//   name: string
// }

// // helper headers
// const getHeaders = () => ({
//   "Content-Type": "application/json",
//   Authorization: `Token ${Cookies.get("adminToken") || ""}`,
// })

// export default function SubscriptionsPage() {
//   const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
//   const [loading, setLoading] = useState(true)
//   const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
//   const [formData, setFormData] = useState<Partial<Subscription>>({})
//   const [isDialogOpen, setIsDialogOpen] = useState(false)
//   const [companies, setCompanies] = useState<Company[]>([]) // ⭐ NEW

//   // List all subscriptions
//   const fetchSubscriptions = async () => {
//     try {
//       setLoading(true)
//       const res = await fetch(`${API_BASE}/subscriptions/`, {
//         headers: getHeaders(),
//       })
//       if (!res.ok) throw new Error("Failed to fetch subscriptions")
//       const data = await res.json()
//       setSubscriptions(data)
//     } catch (err) {
//       console.error(err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Fetch companies ⭐ NEW
//   const fetchCompanies = async () => {
//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/`, {
//         headers: getHeaders(),
//       })
//       if (res.ok) {
//         const data = await res.json()
//         setCompanies(data)
//       }
//     } catch (err) {
//       console.error("Failed to fetch companies", err)
//     }
//   }

//   // Get by ID (for edit)
//   const fetchSubscriptionById = async (id: number) => {
//     try {
//       const res = await fetch(`${API_BASE}/subscriptions/${id}/`, {
//         headers: getHeaders(),
//       })
//       if (res.ok) {
//         const sub = await res.json()
//         setSelectedSub(sub)
//         setFormData(sub)
//         setIsDialogOpen(true)
//         fetchCompanies() // ⭐ fetch companies when editing too
//       } else {
//         console.error("Failed to fetch subscription", await res.text())
//       }
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   useEffect(() => {
//     fetchSubscriptions()
//   }, [])

//   // ⭐ Fetch companies whenever dialog opens
//   useEffect(() => {
//     if (isDialogOpen) fetchCompanies()
//   }, [isDialogOpen])

//   // Create / Update
//   const handleSubmit = async () => {
//     const method = selectedSub ? "PUT" : "POST"
//     const url = selectedSub
//       ? `${API_BASE}/subscriptions/${selectedSub.id}/`
//       : `${API_BASE}/subscriptions/`

//     const res = await fetch(url, {
//       method,
//       headers: getHeaders(),
//       body: JSON.stringify(formData),
//     })

//     if (res.ok) {
//       setIsDialogOpen(false)
//       setFormData({})
//       setSelectedSub(null)
//       fetchSubscriptions()
//     } else {
//       console.error("Failed to save subscription", await res.text())
//     }
//   }

//   // Delete
//   const handleDelete = async (id: number) => {
//     if (!confirm("Are you sure you want to delete this subscription?")) return
//     const res = await fetch(`${API_BASE}/subscriptions/${id}/`, {
//       method: "DELETE",
//       headers: getHeaders(),
//     })
//     if (res.ok) fetchSubscriptions()
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold text-slate-800">Subscriptions</h1>
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button
//               onClick={() => {
//                 setSelectedSub(null)
//                 setFormData({})
//               }}
//             >
//               <Plus className="mr-2 h-4 w-4" /> New Subscription
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="sm:max-w-lg">
//             <DialogHeader>
//               <DialogTitle>
//                 {selectedSub ? "Edit Subscription" : "Create Subscription"}
//               </DialogTitle>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               {/* Company dropdown ⭐ NEW */}
//               <div className="grid grid-cols-4 items-center gap-4">
//                 <Label htmlFor="company" className="text-right">Company</Label>
//                 <select
//                   id="company"
//                   className="col-span-3 border rounded p-2"
//                   value={formData.company ?? ""}
//                   onChange={(e) =>
//                     setFormData({ ...formData, company: Number(e.target.value) })
//                   }
//                 >
//                   <option value="">Select a company</option>
//                   {companies.map((c) => (
//                     <option key={c.id} value={c.id}>
//                       {c.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Other fields remain Input */}
//               {["plan", "start_date", "end_date", "is_active", "stripe_subscription_id"].map((field) => (
//                 <div key={field} className="grid grid-cols-4 items-center gap-4">
//                   <Label htmlFor={field} className="text-right capitalize">
//                     {field.replace(/_/g, " ")}
//                   </Label>
//                   <Input
//                     id={field}
//                     type={
//                       field.includes("date")
//                         ? "date"
//                         : field === "is_active"
//                         ? "checkbox"
//                         : "text"
//                     }
//                     checked={
//                       field === "is_active"
//                         ? (formData as any)[field] ?? false
//                         : undefined
//                     }
//                     value={
//                       field === "is_active"
//                         ? undefined
//                         : (formData as any)[field] ?? ""
//                     }
//                     onChange={(e) =>
//                       setFormData({
//                         ...formData,
//                         [field]:
//                           field === "is_active"
//                             ? e.target.checked
//                             : e.target.value,
//                       })
//                     }
//                     className="col-span-3"
//                   />
//                 </div>
//               ))}
//             </div>
//             <Button onClick={handleSubmit} className="w-full">
//               {selectedSub ? "Update" : "Create"}
//             </Button>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Subscriptions grid (unchanged) */}
//       {loading ? (
//         <div className="flex justify-center py-20">
//           <Loader2 className="animate-spin h-8 w-8 text-slate-500" />
//         </div>
//       ) : (
//         <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//           {subscriptions.map((sub) => (
//             <motion.div key={sub.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//               <Card className="shadow-md hover:shadow-xl transition-all rounded-2xl">
//                 <CardHeader className="flex flex-row items-center justify-between">
//                   <CardTitle className="text-xl font-semibold">Sub #{sub.id}</CardTitle>
//                   <div className="flex space-x-2">
//                     <Button variant="ghost" size="sm" onClick={() => fetchSubscriptionById(sub.id)}>
//                       <Pencil className="h-4 w-4" />
//                     </Button>
//                     <Button variant="ghost" size="sm" onClick={() => handleDelete(sub.id)}>
//                       <Trash2 className="h-4 w-4 text-red-500" />
//                     </Button>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="space-y-2 text-sm text-slate-600">
//                   <p><strong>Company:</strong> {sub.company}</p>
//                   <p><strong>Plan:</strong> {sub.plan}</p>
//                   <p><strong>Start:</strong> {new Date(sub.start_date).toLocaleDateString()}</p>
//                   <p><strong>End:</strong> {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "Ongoing"}</p>
//                   <p><strong>Active:</strong> {sub.is_active ? "Yes" : "No"}</p>
//                   <p className="text-xs text-slate-400">Stripe ID: {sub.stripe_subscription_id}</p>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           ))}
//         </motion.div>
//       )}
//     </div>
//   )
// }
