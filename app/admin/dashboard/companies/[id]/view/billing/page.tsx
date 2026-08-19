// "use client"

// import { useParams } from "next/navigation"
// import { useEffect, useState } from "react"
// import Cookies from "js-cookie"
// import { motion } from "framer-motion"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { Loader2 } from "lucide-react"
// import { Badge } from "@/components/ui/badge"
// import { useToast } from "@/hooks/use-toast"

// const API_BASE = process.env.NEXT_PUBLIC_BASE_URL

// type Subscription = {
//   id: number
//   company: number
//   plan: number
//   start_date: string
//   end_date: string
//   is_active: boolean
//   stripe_subscription_id: string
// }

// type Company = { id: number; name: string }
// type Plan = {
//   id: number
//   name: string
//   price: string
//   cost_per_minute: string
//   max_agents: number
//   max_minutes_per_month: number
//   threshold_minutes: number
//   is_custom: boolean
//   company: number | null
//   created_at: string
// }

// const getHeaders = () => ({
//   "Content-Type": "application/json",
//   Authorization: `Token ${Cookies.get("adminToken") || ""}`,
// })

// export default function ViewCompanyBilling() {
//   const params = useParams()
//   const companyId = parseInt(params.id, 10)
//   const { toast } = useToast()

//   const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
//   const [plans, setPlans] = useState<Plan[]>([])
//   const [companies, setCompanies] = useState<Company[]>([])
//   const [companySub, setCompanySub] = useState<Subscription | null>(null)
//   const [companyPlan, setCompanyPlan] = useState<Plan | null>(null)
//   const [usage, setUsage] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true)
//         const [subsRes, plansRes, companiesRes, usageRes] = await Promise.all([
//           fetch(`${API_BASE}/billing/subscriptions/`, { headers: getHeaders() }),
//           fetch(`${API_BASE}/billing/plans/`, { headers: getHeaders() }),
//           fetch(`${API_BASE}/companies/`, { headers: getHeaders() }),
//           fetch(`${API_BASE}/billing/company_usage/?company_id=${companyId}`, { headers: getHeaders() }),
//         ])

//         if (!subsRes.ok || !plansRes.ok || !companiesRes.ok || !usageRes.ok) throw new Error("Failed to fetch data")

//         const subsData: Subscription[] = await subsRes.json()
//         const plansData: Plan[] = await plansRes.json()
//         const companiesData: Company[] = await companiesRes.json()
//         const usageDataArray = await usageRes.json()

//         setSubscriptions(subsData)
//         setPlans(plansData)
//         setCompanies(companiesData)
//         setUsage(usageDataArray.find((u: any) => u.company === companyId) || null)

//         const sub = subsData.find((s) => s.company === companyId) || null
//         setCompanySub(sub)
//         const planFound = plansData.find((p) => p.id === sub?.plan) || null
//         setCompanyPlan(planFound)

//         if (!sub) toast({ title: "No Subscription", description: "This company has no subscription assigned.", variant: "destructive" })
//       } catch (err: any) {
//         console.error(err)
//         setError(err.message)
//       } finally {
//         setLoading(false)
//       }
//     }

//     if (companyId) fetchData()
//   }, [companyId])

//   const formatPrice = (value: string | number | undefined) => {
//     const num = Number(value)
//     return isNaN(num) ? 0 : num.toFixed(2)
//   }

//   if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin h-10 w-10 text-slate-400" /></div>
//   if (error) return <p className="text-center py-20 text-red-500 text-lg">{error}</p>
//   if (!companySub) return <p className="text-center py-20 text-slate-500 text-lg">No subscription assigned for this company.</p>

//   return (
//     <motion.div 
//       initial={{ opacity: 0, y: 20 }} 
//       animate={{ opacity: 1, y: 0 }} 
//       className="space-y-10 max-w-4xl mx-auto px-6 py-10"
//     >
//       {/* Current Subscription */}
//       <Card className="rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-gray-100">
//         <CardHeader>
//           <CardTitle className="text-2xl font-semibold tracking-wide">Current Subscription</CardTitle>
//           <CardDescription className="text-slate-500">Active plan details for this company</CardDescription>
//         </CardHeader>
//         <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-slate-700">
//   <p><strong>Plan:</strong> {companyPlan?.name ?? "N/A"}</p>
//   <p><strong>Price:</strong> ${formatPrice(companyPlan?.price)}</p>
//   <p><strong>Max Agents:</strong> {companyPlan?.max_agents ?? "N/A"}</p>
//   <p><strong>Max Minutes:</strong> {companyPlan?.max_minutes_per_month ?? "N/A"}</p>
//   <p><strong>Cost per Minute:</strong> ${formatPrice(companyPlan?.cost_per_minute)}</p>
//   <p><strong>Threshold Minutes:</strong> {companyPlan?.threshold_minutes ?? "N/A"}</p>

//   {/* Fix: Use div instead of p */}
//   <div className="col-span-2 mt-2 flex items-center gap-2">
//     <strong>Status:</strong>
//     <Badge variant={companySub.is_active ? "default" : "destructive"} className="px-3 py-1">
//       {companySub.is_active ? "Active" : "Inactive"}
//     </Badge>
//   </div>
// </CardContent>

//       </Card>

//       {/* Subscription Timeline */}
//       <Card className="rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-gray-100">
//         <CardHeader>
//           <CardTitle className="text-2xl font-semibold tracking-wide">Subscription Timeline</CardTitle>
//         </CardHeader>
//         <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-slate-700">
//           <p><strong>Start Date:</strong> {companySub.start_date ? new Date(companySub.start_date).toLocaleDateString() : "N/A"}</p>
//           <p><strong>End Date:</strong> {companySub.end_date ? new Date(companySub.end_date).toLocaleDateString() : "N/A"}</p>
//           <p className="col-span-2"><strong>Stripe Subscription ID:</strong> {companySub.stripe_subscription_id ?? "N/A"}</p>
//         </CardContent>
//       </Card>

//       {/* Current Usage */}
//       <Card className="rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-gray-100">
//         <CardHeader>
//           <CardTitle className="text-2xl font-semibold tracking-wide">Current Usage</CardTitle>
//           <CardDescription className="text-slate-500">Breakdown of current consumption</CardDescription>
//         </CardHeader>
//         <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-slate-700">
//           {usage ? (
//             <>
//               <p><strong>Current Agents:</strong> {usage.current_agents}</p>
//               <p><strong>Minutes Used:</strong> {usage.current_minutes_used}</p>
//               <p><strong>Remaining Minutes:</strong> {usage.remaining_minutes}</p>
//               <p><strong>Extra Minutes Billed:</strong> {usage.extra_minutes_billed}</p>
//               <p><strong>Extra Cost Billed:</strong> ${formatPrice(usage.extra_cost_billed)}</p>
//               <p><strong>Last Reset:</strong> {usage.last_reset ? new Date(usage.last_reset).toLocaleDateString() : "N/A"}</p>
//             </>
//           ) : (
//             <p className="col-span-2 text-slate-400">No usage data available for this company.</p>
//           )}
//         </CardContent>
//       </Card>
//     </motion.div>
//   )
// }


"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import React from "react"
import Cookies from "js-cookie"
import { DollarSign, Clock, TrendingUp, Zap, Brain, Mic, Volume2, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL

type BillingEvent = {
  id: number
  conversation_id: string
  model_name: string
  minutes: number
  cost: string
  timestamp: string
  event_type: "llm" | "stt" | "tts"
  company: number
}

type ConversationGroup = {
  conversation_id: string
  llm_cost: number
  stt_cost: number
  tts_cost: number
  total_cost: number
  llm_minutes: number
  stt_minutes: number
  tts_minutes: number
  total_minutes: number
  timestamp: string
  events: BillingEvent[]
}

type Subscription = {
  id: number
  company: number
  plan: number
  start_date: string
  end_date: string
  is_active: boolean
  stripe_subscription_id: string
}

type Company = { id: number; name: string }
type Plan = {
  id: number
  name: string
  price: string
  cost_per_minute: string
  max_agents: number
  max_minutes_per_month: number
  threshold_minutes: number
  is_custom: boolean
  company: number | null
  created_at: string
}

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Token ${Cookies.get("adminToken") || ""}`,
})

export default function ViewCompanyBilling() {
  const params = useParams()
  const companyId = parseInt(params.id, 10)
  const { toast } = useToast()

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [companySub, setCompanySub] = useState<Subscription | null>(null)
  const [companyPlan, setCompanyPlan] = useState<Plan | null>(null)
  const [usage, setUsage] = useState<any>(null)
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [subsRes, plansRes, companiesRes, usageRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/billing/subscriptions/`, { headers: getHeaders() }),
          fetch(`${API_BASE}/billing/plans/`, { headers: getHeaders() }),
          fetch(`${API_BASE}/companies/`, { headers: getHeaders() }),
          fetch(`${API_BASE}/billing/company_usage/?company_id=${companyId}`, { headers: getHeaders() }),
          fetch(`${API_BASE}/billing/events/`, { headers: getHeaders() }),
        ])

        if (!subsRes.ok || !plansRes.ok || !companiesRes.ok || !usageRes.ok || !eventsRes.ok) 
          throw new Error("Failed to fetch data")

        const subsData: Subscription[] = await subsRes.json()
        const plansData: Plan[] = await plansRes.json()
        const companiesData: Company[] = await companiesRes.json()
        const usageDataArray = await usageRes.json()
        const eventsData: BillingEvent[] = await eventsRes.json()

        setSubscriptions(subsData)
        setPlans(plansData)
        setCompanies(companiesData)
        setUsage(usageDataArray.find((u: any) => u.company === companyId) || null)
        setBillingEvents(eventsData.filter((e: BillingEvent) => e.company === companyId))

        const sub = subsData.find((s) => s.company === companyId) || null
        setCompanySub(sub)
        const planFound = plansData.find((p) => p.id === sub?.plan) || null
        setCompanyPlan(planFound)

        if (!sub) toast({ title: "No Subscription", description: "This company has no subscription assigned.", variant: "destructive" })
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (companyId) fetchData()
  }, [companyId])

  const conversationGroups: ConversationGroup[] = useMemo(() => {
    const grouped: Record<string, BillingEvent[]> = {}
    
    billingEvents.forEach(event => {
      if (!grouped[event.conversation_id]) {
        grouped[event.conversation_id] = []
      }
      grouped[event.conversation_id].push(event)
    })

    return Object.entries(grouped).map(([conversation_id, events]) => {
      const llmEvent = events.find(e => e.event_type === "llm")
      const sttEvent = events.find(e => e.event_type === "stt")
      const ttsEvent = events.find(e => e.event_type === "tts")

      return {
        conversation_id,
        llm_cost: parseFloat(llmEvent?.cost || "0"),
        stt_cost: parseFloat(sttEvent?.cost || "0"),
        tts_cost: parseFloat(ttsEvent?.cost || "0"),
        total_cost: events.reduce((sum, e) => sum + parseFloat(e.cost), 0),
        llm_minutes: llmEvent?.minutes || 0,
        stt_minutes: sttEvent?.minutes || 0,
        tts_minutes: ttsEvent?.minutes || 0,
        total_minutes: events.reduce((sum, e) => sum + e.minutes, 0),
        timestamp: events[0]?.timestamp || "",
        events
      }
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [billingEvents])

  const totalStats = useMemo(() => {
    return {
      total_cost: conversationGroups.reduce((sum, c) => sum + c.total_cost, 0),
      total_minutes: conversationGroups.reduce((sum, c) => sum + c.total_minutes, 0),
      llm_cost: conversationGroups.reduce((sum, c) => sum + c.llm_cost, 0),
      stt_cost: conversationGroups.reduce((sum, c) => sum + c.stt_cost, 0),
      tts_cost: conversationGroups.reduce((sum, c) => sum + c.tts_cost, 0),
      conversation_count: conversationGroups.length
    }
  }, [conversationGroups])

  const formatPrice = (value: string | number | undefined) => {
    const num = Number(value)
    return isNaN(num) ? "0.00" : num.toFixed(2)
  }

  const totalPages = Math.max(1, Math.ceil(conversationGroups.length / PAGE_SIZE))
  const pagedConversations = conversationGroups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />
      <p className="text-sm text-slate-500">Loading billing data...</p>
    </div>
  )

  if (error) return <p className="text-center py-20 text-rose-500 text-base">{error}</p>
  if (!companySub) return <p className="text-center py-20 text-slate-500 text-base">No subscription assigned for this company.</p>

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Cost", value: `$${formatPrice(totalStats.total_cost)}`, icon: <DollarSign className="w-4 h-4" /> },
          { label: "Total Minutes", value: `${totalStats.total_minutes.toFixed(1)}m`, icon: <Clock className="w-4 h-4" /> },
          { label: "Conversations", value: `${totalStats.conversation_count}`, icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Avg per Call", value: `$${formatPrice(totalStats.total_cost / Math.max(totalStats.conversation_count, 1))}`, icon: <Zap className="w-4 h-4" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                {icon}
              </div>
            </div>
            <p className="text-2xl font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Cost Breakdown + Subscription side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Cost Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution across LLM, STT, and TTS</p>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: "LLM", icon: <Brain className="w-3.5 h-3.5" />, value: totalStats.llm_cost, color: "text-violet-600" },
              { label: "STT", icon: <Mic className="w-3.5 h-3.5" />, value: totalStats.stt_cost, color: "text-indigo-600" },
              { label: "TTS", icon: <Volume2 className="w-3.5 h-3.5" />, value: totalStats.tts_cost, color: "text-slate-600" },
            ].map(({ label, icon, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className={color}>{icon}</span>
                  {label}
                </div>
                <span className={`text-sm font-semibold ${color}`}>${formatPrice(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Subscription */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Current Subscription</h3>
                <p className="text-xs text-slate-500 mt-0.5">Active plan details</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${companySub.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
                {companySub.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              ["Plan", companyPlan?.name ?? "N/A"],
              ["Price", `$${formatPrice(companyPlan?.price)}`],
              ["Max Agents", companyPlan?.max_agents ?? "N/A"],
              ["Max Minutes", companyPlan?.max_minutes_per_month ?? "N/A"],
              ["Cost / Min", `$${formatPrice(companyPlan?.cost_per_minute)}`],
              ["Threshold", companyPlan?.threshold_minutes ?? "N/A"],
            ].map(([k, v]) => (
              <div key={k as string}>
                <p className="text-xs text-slate-500">{k}</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{v as React.ReactNode}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Current Usage</h3>
            <p className="text-xs text-slate-500 mt-0.5">Breakdown of current consumption</p>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {[
              ["Agents", usage.current_agents],
              ["Minutes Used", usage.current_minutes_used],
              ["Remaining", usage.remaining_minutes],
              ["Extra Minutes Billed", usage.extra_minutes_billed],
              ["Extra Cost Billed", `$${formatPrice(usage.extra_cost_billed)}`],
              ["Last Reset", usage.last_reset ? new Date(usage.last_reset).toLocaleDateString() : "N/A"],
            ].map(([k, v]) => (
              <div key={k as string}>
                <p className="text-xs text-slate-500">{k}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{v as React.ReactNode}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Conversation Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">Itemized billing per conversation</p>
          </div>
          <span className="text-xs text-slate-400">{conversationGroups.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Conversation ID</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cost</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Minutes</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedConversations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No billing events found.</td>
                </tr>
              )}
              {pagedConversations.map((conv) => (
                <React.Fragment key={conv.conversation_id}>
                  <tr
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedConversation(expandedConversation === conv.conversation_id ? null : conv.conversation_id)}
                  >
                    <td className="px-5 py-3.5">
                      <code className="px-2 py-0.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-600">
                        {conv.conversation_id.length > 20 ? `${conv.conversation_id.slice(0, 20)}…` : conv.conversation_id}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{new Date(conv.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800">${formatPrice(conv.total_cost)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{conv.total_minutes.toFixed(1)}m</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {expandedConversation === conv.conversation_id
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    </td>
                  </tr>

                  {expandedConversation === conv.conversation_id && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50 border-b border-slate-100 px-5 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {conv.events.map((event) => (
                            <div key={event.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                  event.event_type === "llm" ? "bg-violet-50 text-violet-700" :
                                  event.event_type === "stt" ? "bg-indigo-50 text-indigo-700" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
                                  {event.event_type.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">Model: <span className="text-slate-700 font-medium">{event.model_name}</span></p>
                              <p className="text-xs text-slate-500">Minutes: <span className="text-slate-700 font-medium">{event.minutes.toFixed(1)}</span></p>
                              <p className="text-sm font-semibold text-slate-800">${formatPrice(event.cost)}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Page {currentPage} of {totalPages} · {conversationGroups.length} conversations
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...")
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        currentPage === p
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
