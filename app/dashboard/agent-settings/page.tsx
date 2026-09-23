"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Square, ChevronUp, Copy, History, WrapText, Plus, Upload, FileText, Trash2, X, CheckCircle2, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"
import { UploadCloud, Loader2 } from "lucide-react"
import CustomToolsForm from "@/components/CustomToolsForm"
import { DialogTrigger } from "@/components/ui/dialog"

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';




import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { UnansweredQuestionsPanel } from "@/components/unanswered-questions-panel"
import { useRouter } from 'next/navigation';

type AgentConfigTabProps = { agentId: string }


const tabs = [
  { id: "voiceprint", label: "Voiceprint" },
  { id: "voice-prompts", label: "Voice Prompts" },
  { id: "agent-prompts", label: "Agent Prompts" },
  { id: "voice-settings", label: "Voice Settings" },
  { id: "tools", label: "Tools & Numbers" }, 
  { id: "faq", label: "FAQ" },
  { id: "unanswered", label: "Unanswered" },
  { id: "additional-settings", label: "Additional Settings" },
]

import { Sparkles, ArrowRight, Circle, ChevronLeft, ChevronRight, Search, ArrowDownUp, ArrowUpAZ, ArrowDownAZ, CalendarArrowDown, CalendarArrowUp } from "lucide-react"


// Agent Selection Component
function AgentSelection({ onSelectAgent }: { onSelectAgent: (agent: any) => void }) {
  const [agents, setAgents] = useState<any[]>([])
   const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL")
  const [sortOrder, setSortOrder] = useState<"date_desc" | "date_asc" | "alpha_asc" | "alpha_desc">("date_desc")
  const { toast } = useToast()

  const itemsPerPage = 12
  
  // Filter + sort agents
  const filteredAgents = agents
    .filter((a) => statusFilter === "ALL" || a.status === statusFilter)
    .filter((agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.persona.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.instructions.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortOrder === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortOrder === "alpha_asc") return a.name.localeCompare(b.name)
      if (sortOrder === "alpha_desc") return b.name.localeCompare(a.name)
      return 0
    })
  
  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAgents = filteredAgents.slice(startIndex, endIndex)

  useEffect(() => {
    fetchAgents()
  }, [])

  // Reset to page 1 when filters/sort change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, sortOrder])
// Fetch agents from API and enrich data
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
      })
      const data = await response.json()
      console.log(data)
      const enriched = Array.isArray(data)
        ? data.map((agent) => ({
            id: agent.id,
            name: agent.name,
            status: agent.status === "Active" || agent.status === "active" ? "Active" : "Inactive",
            persona: agent.persona || "Unknown",
            description: agent.description || "No description available",
            instructions: agent.instructions || "No instructions available",
            created_at: agent.created_at || "",
          }))
        : []
      setAgents(enriched)
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Cinematic Header */}
        <div className="mb-16 relative">
          {/* Decorative elements */}
          <div className="absolute -left-4 top-0 w-1 h-32 bg-gradient-to-b from-slate-900 via-slate-400 to-transparent rounded-full" />
          
          <div className="space-y-6 pl-8">
            {/* Title with subtle animation on hover */}
            <div className="group inline-block">
              <h2 className="text-6xl font-extralight tracking-tight text-slate-900 mb-2 transition-all duration-300 group-hover:tracking-wide">
                Select an Agent
              </h2>
              <div className="h-0.5 bg-gradient-to-r from-slate-900 via-slate-400 to-transparent transform origin-left transition-transform duration-500 scale-x-0 group-hover:scale-x-100" />
            </div>
            
            <p className="text-lg text-slate-500 font-light tracking-wide max-w-2xl">
              Choose an agent to configure its settings and unlock its full potential
            </p>
          </div>

          {/* Floating decoration */}
          <div className="absolute -top-8 right-0 flex gap-2 opacity-30">
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-10 space-y-4">
          {/* Search bar */}
          <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 focus-within:border-slate-400 focus-within:shadow-sm">
            <div className="pl-5 pr-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search agents by name, persona, or instructions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-3.5 pr-5 text-slate-900 placeholder-slate-400 bg-transparent outline-none font-light text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="pr-5 text-slate-400 hover:text-slate-700 transition-colors text-xs font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters + Sort row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {(["ALL", "Active", "Inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === f
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {f === "ALL" ? "All" : f}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              <ArrowDownUp className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              {([
                { value: "date_desc",  label: "Newest", icon: CalendarArrowDown },
                { value: "date_asc",   label: "Oldest", icon: CalendarArrowUp },
                { value: "alpha_asc",  label: "A\u2192Z",   icon: ArrowUpAZ },
                { value: "alpha_desc", label: "Z\u2192A",   icon: ArrowDownAZ },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSortOrder(value)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sortOrder === value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <span className="ml-auto w-20 h-4 rounded-full bg-slate-200 animate-pulse inline-block" />
            ) : (
              <span className="ml-auto text-xs text-slate-400">
                {filteredAgents.length} {filteredAgents.length === 1 ? "agent" : "agents"}
              </span>
            )}
          </div>
        </div>

        {/* Agent Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden animate-pulse">
                <div className="h-0.5 w-full bg-slate-100" />
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-100" />
                    <div className="w-16 h-6 rounded-full bg-slate-100" />
                  </div>
                  <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded-lg w-full" />
                    <div className="h-3 bg-slate-100 rounded-lg w-5/6" />
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : currentAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentAgents.map((agent: any, index: any) => (
              <div
                key={agent.id}
                onClick={() => router.push(`/dashboard/agent-settings/${agent.id}`)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.06}s both` }}
              >
                {/* Status bar */}
                <div className={`h-0.5 w-full flex-shrink-0 ${
                  agent.status === "Active"
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    : "bg-gradient-to-r from-slate-300 to-slate-400"
                }`} />

                <div className="flex flex-col flex-1 p-6 gap-4">
                  {/* Top row: avatar + status badge */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-light flex-shrink-0 ${
                      agent.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      agent.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        agent.status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                      }`} />
                      {agent.status}
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-base font-medium text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem]">
                    {agent.name}
                  </h3>

                  {/* Instructions snippet */}
                  <p className="text-slate-500 text-sm font-light leading-relaxed line-clamp-2 flex-1">
                    {agent.instructions}
                  </p>

                  {/* Configure button — always at bottom */}
                  <button className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-light tracking-wide transition-colors duration-200 group-hover:shadow-md">
                    Configure
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
              <Search className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-light text-slate-900 mb-2 tracking-tight">No agents found</h3>
            <p className="text-slate-500 font-light tracking-wide">Try adjusting your search query</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-4">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="px-6 py-6 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl font-light transition-all duration-300 ${
                    currentPage === page
                      ? "bg-slate-900 text-white shadow-lg"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="px-6 py-6 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Bottom decoration */}
        <div className="mt-32 flex items-center justify-center gap-3 opacity-20">
          <div className="w-1 h-1 bg-slate-400 rounded-full" />
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
          <div className="w-1 h-1 bg-slate-400 rounded-full" />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

function ToolsTab({ agentId }: { agentId: string }) {
  const { toast } = useToast()
  const [companyNumbers, setCompanyNumbers] = useState<string[]>([])
  const [assignedNumbers, setAssignedNumbers] = useState<string[]>([])
  const [originalNumbers, setOriginalNumbers] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [assignedTools, setAssignedTools] = useState<any[]>([])
  const [usedNumbers, setUsedNumbers] = useState<string[]>([]) // <-- union of numbers
  const [loadingNumbers, setLoadingNumbers] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState<{ [key: string]: boolean }>({})


  // ===========================
  // Tools List Component
  // ===========================
  function ToolsList() {
    const [tools, setTools] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      const fetchTools = async () => {
        try {
          setLoading(true)
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/`,
            {
              headers: { Authorization: `Token ${Cookies.get("Token") || ""}` },
            }
          )
          const data = await res.json()
          setTools(Array.isArray(data) ? data : [])
        } catch (err) {
          console.error("Error fetching tools:", err)
        } finally {
          setLoading(false)
        }
      }

      fetchTools()
    }, [])

    const toggleTool = async (tool: any, isAssigned: boolean) => {
      try {
        const updatedObjects = isAssigned
          ? assignedTools.filter((t) => t.id !== tool.id)
          : [...assignedTools, tool]

        const updatedIds = updatedObjects.map((t) => String(t.id))

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
            body: JSON.stringify({ custom_features_id: updatedIds }),
          }
        )

        const data = await res.json()
        if (!res.ok) throw new Error("Failed to update tools")

        setAssignedTools(data.custom_features || updatedObjects)

        toast({
          title: "Success",
          description: `Tool ${isAssigned ? "unassigned" : "assigned"} successfully.`,
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update tools.",
          variant: "destructive",
        })
      }
    }

    if (loading) {
      return <div className="text-center text-slate-500 italic animate-pulse">Loading tools...</div>
    }

    if (tools.length === 0) {
      return <div className="text-center text-slate-500 italic">No tools available</div>
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool) => {
          const isAssigned = assignedTools.some((t) => t.id === tool.id)
          return (
            <Card
              key={tool.id}
              className={`relative rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border 
              transition-all duration-500 shadow-lg hover:shadow-2xl hover:scale-[1.03] ${
                isAssigned ? "border-indigo-500 ring-2 ring-indigo-300" : "border-slate-200"
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg font-semibold">
                  <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                    {tool.name}
                  </span>
                  {isAssigned && (
                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                      Assigned
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {tool.description || "No description"}
                </p>
                <Button
                  variant={isAssigned ? "destructive" : "default"}
                  className="w-full rounded-full py-2 shadow-md hover:shadow-xl transition"
                  onClick={() => toggleTool(tool, isAssigned)}
                >
                  {isAssigned ? "Unassign" : "Assign"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // ===========================
  // Fetch Agent + Company + All Agents
  // ===========================
  const fetchAgentAndCompany = async () => {
  try {
    setLoadingNumbers(true) // start loader

    const agentRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
      {
        headers: { Authorization: `Token ${Cookies.get("Token") || ""}` },
      }
    )
    const agentData = await agentRes.json()

    const companyRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/public/company/get-twilio-phones`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
      }
    )
    const companyData = await companyRes.json()

    const allAgentsRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`,
      {
        headers: { Authorization: `Token ${Cookies.get("Token") || ""}` },
      }
    )
    const allAgents = await allAgentsRes.json()

    // build union of all twilio numbers
    let union: string[] = []
    if (Array.isArray(allAgents)) {
      union = allAgents.flatMap((a) => a.twilio_phone_numbers || [])
    }
    setUsedNumbers(union)

    if (Array.isArray(companyData.twilio_phone_numbers)) {
      setCompanyNumbers(companyData.twilio_phone_numbers)
    }

    if (Array.isArray(agentData.twilio_phone_numbers)) {
      setAssignedNumbers(agentData.twilio_phone_numbers || [])
      setOriginalNumbers(agentData.twilio_phone_numbers || [])
    }

    if (Array.isArray(agentData.custom_features)) {
      setAssignedTools(agentData.custom_features)
    }

    setDirty(false)
  } catch {
    toast({
      description: "Error fetching Twilio/Tools data.",
      variant: "destructive",
    })
  } finally {
    setLoadingNumbers(false) // stop loader
  }
}

  useEffect(() => {
    fetchAgentAndCompany()
  }, [agentId])

  const toggleNumber = async (num: string, isAssignedToThisAgent: boolean) => {
  setLoadingAssignments((prev) => ({ ...prev, [num]: true }))

  try {
    // Prepare updated numbers list
    const updated = isAssignedToThisAgent
      ? assignedNumbers.filter((n) => n !== num)
      : [...assignedNumbers, num]

    // Optimistic UI update
    setAssignedNumbers(updated)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({ twilio_phone_numbers: updated }),
      }
    )

    if (!res.ok) throw new Error("Failed to update numbers")

    toast({
      title: "Success",
      description: `Number ${isAssignedToThisAgent ? "unassigned" : "assigned"} successfully.`,
    })

    await fetchAgentAndCompany()
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to update numbers.",
      variant: "destructive",
    })
  } finally {
    setLoadingAssignments((prev) => ({ ...prev, [num]: false }))
  }
}



  const handleSave = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
          body: JSON.stringify({ twilio_phone_numbers: assignedNumbers }),
        }
      )

      if (!res.ok) throw new Error("Failed to save assigned numbers")

      toast({
        title: "Success",
        description: "Twilio numbers updated successfully.",
      })
      await fetchAgentAndCompany()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update numbers.",
        variant: "destructive",
      })
    }
  }

  // ===========================
  // Render
  // ===========================
  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
          Agent Tools & Numbers
        </h2>
        <p className="text-slate-500 text-lg">
          Seamlessly manage Twilio numbers & custom tools for your agent
        </p>
      </div>

            {loadingNumbers ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
        </div>
      ) : companyNumbers.length > 0 ? (
        <>
          {/* Numbers Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companyNumbers.map((num) => {
              const isAssignedToThisAgent = assignedNumbers.includes(num)
              const isUsedElsewhere =
                usedNumbers.includes(num) && !isAssignedToThisAgent

              return (
                <Card
                  key={num}
                  className={`rounded-2xl p-2 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 transition-all duration-500 
                  shadow-md hover:shadow-2xl hover:scale-[1.03] ${
                    isAssignedToThisAgent
                      ? "border-green-400 ring-2 ring-green-300"
                      : isUsedElsewhere
                      ? "border-red-400 ring-2 ring-red-300"
                      : "border border-slate-200"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-xl font-semibold">
                      <span>{num}</span>
                      {isAssignedToThisAgent && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Assigned
                        </span>
                      )}
                      {isUsedElsewhere && !isAssignedToThisAgent && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          Unavailable
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                      {isAssignedToThisAgent
                        ? "Currently linked to this agent."
                        : isUsedElsewhere
                        ? "Already assigned to another agent."
                        : "Assign this number to your agent."}
                    </p>
                    <Button
                      disabled={isUsedElsewhere || loadingAssignments[num]}
                      variant={isAssignedToThisAgent ? "destructive" : "default"}
                      className="w-full rounded-full shadow-md hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => toggleNumber(num, isAssignedToThisAgent)}
                    >
                      {loadingAssignments[num] ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        </div>
                      ) : isAssignedToThisAgent ? (
                        "Unassign"
                      ) : isUsedElsewhere ? (
                        "Unavailable"
                      ) : (
                        "Assign"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Tools Modal */}
          <div className="flex justify-center mt-10">
            <Button
              className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition"
              onClick={() => setShowDialog(true)}
            >
              Manage Custom Tools
            </Button>
          </div>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="max-w-5xl rounded-3xl backdrop-blur-md bg-white/80 dark:bg-slate-900/80 shadow-2xl 
              max-h-[80vh] overflow-y-auto">
              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                  Custom Tools
                </DialogTitle>
              </DialogHeader>

              <ToolsList />
            </DialogContent>

          </Dialog>

          {/* Save Button */}
          {dirty && (
            <div className="flex justify-end pt-10">
              <Button
                className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-700 text-white px-10 py-3 rounded-full shadow-lg transition-transform transform hover:scale-105"
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-slate-500 italic">
          No Twilio numbers available for this company.
        </div>
      )}
    </div>
  )
}

// function ToolsTab({ agentId }: { agentId: string }) {
//   const { toast } = useToast()
//   const [companyNumbers, setCompanyNumbers] = useState<string[]>([])
//   const [assignedNumbers, setAssignedNumbers] = useState<string[]>([])
//   const [originalNumbers, setOriginalNumbers] = useState<string[]>([])
//   const [dirty, setDirty] = useState(false)
//   const [showDialog, setShowDialog] = useState(false)
//   const [assignedTools, setAssignedTools] = useState<any[]>([])

//   // ===========================
//   // Tools List Component
//   // ===========================
//   function ToolsList() {
//     const [tools, setTools] = useState<any[]>([])
//     const [loading, setLoading] = useState(false)

//     useEffect(() => {
//       const fetchTools = async () => {
//         try {
//           setLoading(true)
//           const res = await fetch(
//             `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/`,
//             {
//               headers: {
//                 Authorization: `Token ${Cookies.get("Token") || ""}`,
//               },
//             }
//           )
//           const data = await res.json()
//           setTools(Array.isArray(data) ? data : [])
//         } catch (err) {
//           console.error("Error fetching tools:", err)
//         } finally {
//           setLoading(false)
//         }
//       }

//       fetchTools()
//     }, [])

//     const toggleTool = async (tool: any, isAssigned: boolean) => {
//       try {
//         const updatedObjects = isAssigned
//           ? assignedTools.filter((t) => t.id !== tool.id)
//           : [...assignedTools, tool]

//         const updatedIds = updatedObjects.map((t) => String(t.id))

//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
//           {
//             method: "PATCH",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Token ${Cookies.get("Token") || ""}`,
//             },
//             body: JSON.stringify({ custom_features_id: updatedIds }),
//           }
//         )

//         const data = await res.json()
//         if (!res.ok) throw new Error("Failed to update tools")

//         setAssignedTools(data.custom_features || updatedObjects)

//         toast({
//           title: "Success",
//           description: `Tool ${isAssigned ? "unassigned" : "assigned"} successfully.`,
//         })
//       } catch (error: any) {
//         toast({
//           title: "Error",
//           description: error.message || "Failed to update tools.",
//           variant: "destructive",
//         })
//       }
//     }

//     if (loading) {
//       return <div className="text-center text-slate-500 italic animate-pulse">Loading tools...</div>
//     }

//     if (tools.length === 0) {
//       return <div className="text-center text-slate-500 italic">No tools available</div>
//     }

//     return (
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//         {tools.map((tool) => {
//           const isAssigned = assignedTools.some((t) => t.id === tool.id)
//           return (
//             <Card
//               key={tool.id}
//               className={`relative rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border 
//               transition-all duration-500 shadow-lg hover:shadow-2xl hover:scale-[1.03] ${
//                 isAssigned ? "border-indigo-500 ring-2 ring-indigo-300" : "border-slate-200"
//               }`}
//             >
//               <CardHeader>
//                 <CardTitle className="flex items-center justify-between text-lg font-semibold">
//                   <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
//                     {tool.name}
//                   </span>
//                   {isAssigned && (
//                     <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
//                       Assigned
//                     </span>
//                   )}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
//                   {tool.description || "No description"}
//                 </p>
//                 <Button
//                   variant={isAssigned ? "destructive" : "default"}
//                   className="w-full rounded-full py-2 shadow-md hover:shadow-xl transition"
//                   onClick={() => toggleTool(tool, isAssigned)}
//                 >
//                   {isAssigned ? "Unassign" : "Assign"}
//                 </Button>
//               </CardContent>
//             </Card>
//           )
//         })}
//       </div>
//     )
//   }

//   // ===========================
//   // Fetch Agent + Company
//   // ===========================
//   const fetchAgentAndCompany = async () => {
//     try {
//       const agentRes = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
//         {
//           headers: { Authorization: `Token ${Cookies.get("Token") || ""}` },
//         }
//       )
//       const agentData = await agentRes.json()

//       const companyRes = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/public/company/get-twilio-phones`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${Cookies.get("Token") || ""}`,
//           },
//         }
//       )
//       const companyData = await companyRes.json()

//       if (Array.isArray(companyData.twilio_phone_numbers)) {
//         setCompanyNumbers(companyData.twilio_phone_numbers)
//       }

//       if (Array.isArray(agentData.twilio_phone_numbers)) {
//         setAssignedNumbers(agentData.twilio_phone_numbers || [])
//         setOriginalNumbers(agentData.twilio_phone_numbers || [])
//       }

//       if (Array.isArray(agentData.custom_features)) {
//         setAssignedTools(agentData.custom_features)
//       }

//       setDirty(false)
//     } catch {
//       toast({
//         description: "Error fetching Twilio/Tools data.",
//         variant: "destructive",
//       })
//     }
//   }

//   useEffect(() => {
//     fetchAgentAndCompany()
//   }, [agentId])

//   const toggleNumber = (num: string) => {
//     setAssignedNumbers((prev) => {
//       const updated = prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
//       setDirty(true)
//       return updated
//     })
//   }

//   const handleSave = async () => {
//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${Cookies.get("Token") || ""}`,
//           },
//           body: JSON.stringify({ twilio_phone_numbers: assignedNumbers }),
//         }
//       )

//       if (!res.ok) throw new Error("Failed to save assigned numbers")

//       toast({
//         title: "Success",
//         description: "Twilio numbers updated successfully.",
//       })
//       await fetchAgentAndCompany()
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.message || "Failed to update numbers.",
//         variant: "destructive",
//       })
//     }
//   }

//   // ===========================
//   // Render
//   // ===========================
//   return (
//     <div className="space-y-12">
//       {/* Hero Header */}
//       <div className="text-center space-y-3">
//         <h2 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
//           Agent Tools & Numbers
//         </h2>
//         <p className="text-slate-500 text-lg">
//           Seamlessly manage Twilio numbers & custom tools for your agent
//         </p>
//       </div>

//       {companyNumbers.length > 0 ? (
//         <>
//           {/* Numbers Section */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {companyNumbers.map((num) => {
//               const isAssigned = assignedNumbers.includes(num)
//               return (
//                 <Card
//                   key={num}
//                   className={`rounded-2xl p-2 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 transition-all duration-500 
//                   shadow-md hover:shadow-2xl hover:scale-[1.03] ${
//                     isAssigned ? "border-green-400 ring-2 ring-green-300" : "border border-slate-200"
//                   }`}
//                 >
//                   <CardHeader>
//                     <CardTitle className="flex items-center justify-between text-xl font-semibold">
//                       <span>{num}</span>
//                       {isAssigned && (
//                         <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
//                           Assigned
//                         </span>
//                       )}
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
//                       {isAssigned
//                         ? "Currently linked to this agent."
//                         : "Assign this number to your agent."}
//                     </p>
//                     <Button
//                       variant={isAssigned ? "destructive" : "default"}
//                       className="w-full rounded-full shadow-md hover:shadow-xl transition"
//                       onClick={() => toggleNumber(num)}
//                     >
//                       {isAssigned ? "Unassign" : "Assign"}
//                     </Button>
//                   </CardContent>
//                 </Card>
//               )
//             })}
//           </div>

//           {/* Tools Modal */}
//           <div className="flex justify-center mt-10">
//             <Button
//               className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition"
//               onClick={() => setShowDialog(true)}
//             >
//               Manage Custom Tools
//             </Button>
//           </div>

//           <Dialog open={showDialog} onOpenChange={setShowDialog}>
//             <DialogContent className="max-w-5xl rounded-3xl backdrop-blur-md bg-white/80 dark:bg-slate-900/80 shadow-2xl">
//               <DialogHeader className="text-center">
//                 <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
//                   Custom Tools
//                 </DialogTitle>
//               </DialogHeader>

//               {assignedNumbers.length === 0 ? (
//                 <div className="text-center text-slate-500 italic">
//                   No number assigned → tools hidden
//                 </div>
//               ) : (
//                 <ToolsList />
//               )}
//             </DialogContent>
//           </Dialog>

//           {/* Save Button */}
//           {dirty && (
//             <div className="flex justify-end pt-10">
//               <Button
//                 className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-700 text-white px-10 py-3 rounded-full shadow-lg transition-transform transform hover:scale-105"
//                 onClick={handleSave}
//               >
//                 Save Changes
//               </Button>
//             </div>
//           )}
//         </>
//       ) : (
//         <div className="text-center text-slate-500 italic">
//           No Twilio numbers available for this company.
//         </div>
//       )}
//     </div>
//   )
// }



function FAQTab({ agentId }: { agentId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [faqs, setFaqs] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const token = Cookies.get("Token") || ""
  const [scrapLoading, setScrapLoading] = useState(false)

  const { toast } = useToast()
  



  const [scrapWebsites, setScrapWebsites] = useState<string[]>([])
  const [showScrapDialog, setShowScrapDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  // 🧠 Fetch scrapping websites from backend
  const fetchScrappingWebsites = async () => {
    try {

      setScrapLoading(true) 

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
        headers: {
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
      })
      if (!res.ok) throw new Error("Failed to fetch agent details")
      const data = await res.json()
 
      setScrapWebsites(data.scraping_websites || [])
    } catch (error) {
    console.error("Error fetching scraping websites:", error)
    toast({
      title: "Error",
      description: "Failed to load scraping URLs.",
      variant: "destructive",
    })
  } finally {
    setScrapLoading(false)
  }
}

  // 💾 Save updated scrapping websites
  const handleSaveScrapping = async () => {
  try {
    setSaving(true)

    // ✅ Basic URL validation
    const invalidUrls = scrapWebsites.filter(
      (url) => url.trim() && !/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url)
    )

    if (invalidUrls.length > 0) {
      toast({
        title: "Invalid URLs",
        description: "Please enter valid URLs starting with http:// or https://",
        variant: "destructive",
      })
      setSaving(false)
      return
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${Cookies.get("Token") || ""}`,
      },
      body: JSON.stringify({
        scraping_websites: scrapWebsites,
      }),
    })

    if (!res.ok) throw new Error("Failed to save scraping websites")

    toast({
      title: "Success",
      description: "Scraping URLs saved successfully.",
    })

    setShowScrapDialog(false)
  } catch (error) {
    console.error("Save failed:", error)
    toast({
      title: "Save failed",
      description: "Failed to save URLs. Please ensure they are valid URLs.",
      variant: "destructive",
    })
  } finally {
    setSaving(false)
  }
}



  // ➕ Add new URL field
  const handleAddUrl = () => setScrapWebsites((prev) => [...prev, ""])

  // ❌ Remove URL
  const handleRemoveUrl = (index: number) =>
    setScrapWebsites((prev) => prev.filter((_, i) => i !== index))

  // ✏️ Edit URL
  const handleEditUrl = (index: number, value: string) =>
    setScrapWebsites((prev) => prev.map((url, i) => (i === index ? value : url)))


  useEffect(() => {
    fetchFAQs()
    fetchDocuments()
  }, [agentId])

  const fetchFAQs = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/faqs`)
      const data = await response.json()
      setFaqs(data)
    } catch (error) {
      console.error("Error fetching FAQs:", error)
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/?agent_id=${agentId}`, {
        headers: { Authorization: `Token ${token}` }
      })
      const data = await res.json()
      setDocs(Array.isArray(data) ? data : data?.results ?? [])
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setErrorMessage("Please select a file.")
      setTimeout(() => setErrorMessage(""), 4000)
      return
    }

    setUploading(true)
    try {
      const presignedRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/s3/presigned-url/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type
        })
      })

      const presignedData = await presignedRes.json()
      const uploadUrl = presignedData.url
      const s3Key = presignedData.file_key

      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      })

      if (!s3Res.ok) throw new Error("S3 upload failed")

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: file.name,
          description: "FAQ Document",
          s3_url: uploadUrl.split("?")[0],
          file_key: s3Key,
          agent_id: agentId,
        })
      })

      if (response.ok) {
        setSuccessMessage("File uploaded successfully!")
        setTimeout(() => setSuccessMessage(""), 3000)
        fetchDocuments()
      } else {
        setErrorMessage("Upload metadata failed")
      }
    } catch (err) {
      console.error("Upload failed:", err)
      setErrorMessage("Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const handleAddFAQ = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return
    try {
      const res = await fetch(`/api/agents/${agentId}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer })
      })
      if (res.ok) {
        setNewQuestion("")
        setNewAnswer("")
        setShowAddForm(false)
        fetchFAQs()
      }
    } catch (err) {
      console.error("Error adding FAQ:", err)
    }
  }

  const handleDeleteFAQ = async (id: string) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/faqs/${id}`, { method: "DELETE" })
      if (res.ok) fetchFAQs()
    } catch (err) {
      console.error("Error deleting FAQ:", err)
    }
  }

  const [deletingDocId, setDeletingDocId] = useState<number | null>(null)
  const [docToDelete, setDocToDelete] = useState<{ id: number; title: string } | null>(null)

  const handleDeleteDocument = async (docId: number) => {
    setDeletingDocId(docId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/${docId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      if (res.ok || res.status === 204) {
        setDocs((prev) => prev.filter((d) => d.id !== docId))
      } else {
        console.error("Delete failed:", res.status)
      }
    } catch (err) {
      console.error("Error deleting document:", err)
    } finally {
      setDeletingDocId(null)
    }
  }

  if (loading) return <div className="text-center p-10 text-slate-600">Loading FAQ data...</div>

  return (
    <div className="space-y-6">

      {/* Delete confirmation dialog */}
      {docToDelete && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDocToDelete(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900">Delete Document</h3>
                  <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 truncate">
                {docToDelete.title}
              </p>
            </div>
            <div className="flex items-center gap-2 px-6 pb-5">
              <button
                onClick={() => setDocToDelete(null)}
                className="flex-1 px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = docToDelete.id
                  setDocToDelete(null)
                  await handleDeleteDocument(id)
                }}
                disabled={deletingDocId !== null}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50"
              >
                {deletingDocId !== null ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showScrapDialog} onOpenChange={setShowScrapDialog}>
  <DialogTrigger asChild>
    <Button
      className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
      onClick={fetchScrappingWebsites}
    >
      🌐 Scrap & Save
    </Button>
  </DialogTrigger>

  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">Manage Scrapping URLs</DialogTitle>
    </DialogHeader>

    <div className="space-y-4 mt-4">
  {scrapLoading ? (
    <div className="flex items-center justify-center py-8 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      Loading URLs...
    </div>
  ) : scrapWebsites.length === 0 ? (
    <p className="text-sm text-slate-500">No URLs added yet. Start by adding one below.</p>
  ) : (
    scrapWebsites.map((url, index) => (
      <div key={index} className="flex items-center gap-3">
        <Input
          value={url}
          onChange={(e) => handleEditUrl(index, e.target.value)}
          placeholder="Enter website URL"
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600"
          onClick={() => handleRemoveUrl(index)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    ))
  )}

  {!scrapLoading && (
    <Button
      variant="outline"
      onClick={handleAddUrl}
      className="flex items-center gap-2 text-sm text-cyan-700 border-cyan-600 hover:bg-cyan-50"
    >
      <Plus className="w-4 h-4" /> Add URL
    </Button>
  )}
</div>


    <div className="flex justify-end gap-3 mt-6">
      <Button variant="ghost" onClick={() => setShowScrapDialog(false)}>Cancel</Button>
      <Button
        onClick={handleSaveScrapping}
        disabled={saving}
        className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
      >
        {saving ? "Saving..." : "Done"}
      </Button>
    </div>
  </DialogContent>
</Dialog>



      {successMessage && <div className="p-4 bg-green-50 border border-green-200 text-green-700">{successMessage}</div>}
      {errorMessage && <div className="p-4 bg-red-50 border border-red-200 text-red-700">{errorMessage}</div>}

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📁 Upload FAQ Documents</h2>
        <input type="file" ref={fileInputRef} className="mb-4" />
        <Button onClick={handleUpload} disabled={uploading} className="mb-2">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />} Upload
        </Button>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-slate-800 mb-2">Uploaded Files</h3>
          {docs.length === 0 ? <p className="text-slate-500">No documents uploaded yet.</p> : (
            <ul className="space-y-2">
              {docs.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate text-left"
                      onClick={async () => {
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/presigned-view-url/?file_key=${encodeURIComponent(doc.title)}`, {
                            headers: { Authorization: `Token ${token}` }
                          })
                          const data = await res.json()
                          window.open(data.presigned_url, "_blank")
                        } catch {
                          alert("Could not open document.")
                        }
                      }}
                    >
                      {doc.title}
                    </button>
                  </div>
                  <button
                    onClick={() => setDocToDelete({ id: doc.id, title: doc.title })}
                    disabled={deletingDocId === doc.id}
                    className="flex-shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Delete document"
                  >
                    {deletingDocId === doc.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

  
    </div>
  )
}

// // Tools Tab (Cinematic UI)
// function ToolsTab({ agentId }: { agentId: string }) {
//   const { toast } = useToast()
//   const [companyNumbers, setCompanyNumbers] = useState<string[]>([])
//   const [assignedNumbers, setAssignedNumbers] = useState<string[]>([])
//   const [originalNumbers, setOriginalNumbers] = useState<string[]>([]) // keep track of original for dirty check
//   const [showForm, setShowForm] = useState(false)
//   const [dirty, setDirty] = useState(false)

//   // Fetch agent + company data
//   const fetchAgentAndCompany = async () => {
//     try {
//       // 1) Fetch agent data first
//       const agentRes = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
//         {
//           headers: {
//             Authorization: `Token ${Cookies.get("Token") || ""}`,
//           },
//         }
//       )
//       const agentData = await agentRes.json()

//       // 2) Fetch company numbers
//       const companyRes = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/public/company/get-twilio-phones`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${Cookies.get("Token") || ""}`,
//           },
//         }
//       )
//       const companyData = await companyRes.json()

//       console.log("Company Numbers API Response:", companyData)
//       console.log("Agent API Response:", agentData)

//       if (Array.isArray(companyData.twilio_phone_numbers)) {
//         setCompanyNumbers(companyData.twilio_phone_numbers)
//       }

//       if (
//         Array.isArray(agentData.twilio_phone_numbers) &&
//         agentData.twilio_phone_numbers.length > 0
//       ) {
//         setAssignedNumbers(agentData.twilio_phone_numbers)
//         setOriginalNumbers(agentData.twilio_phone_numbers)
//         setShowForm(true)
//       } else {
//         setAssignedNumbers([])
//         setOriginalNumbers([])
//         setShowForm(false)
//       }

//       setDirty(false) // reset dirty after fetching fresh data
//     } catch (error) {
//       console.error("Error fetching data:", error)
//       toast({
//         description: "Error fetching Twilio data.",
//         variant: "destructive",
//       })
//     }
//   }

//   useEffect(() => {
//     fetchAgentAndCompany()
//   }, [agentId])

//   // Toggle assignment (marks dirty)
//   const toggleNumber = (num: string) => {
//     setAssignedNumbers((prev) => {
//       const updated = prev.includes(num)
//         ? prev.filter((n) => n !== num) // remove on Unassign
//         : [...prev, num] // add on Assign

//       // mark dirty if different from original
//       setDirty(true)
//       return updated
//     })
//   }

//   // Save changes (PATCH request + re-fetch agent data)
//   const handleSave = async () => {
//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${Cookies.get("Token") || ""}`,
//           },
//           body: JSON.stringify({
//             twilio_phone_numbers: assignedNumbers,
//           }),
//         }
//       )

//       if (!res.ok) throw new Error("Failed to save assigned numbers")

//       toast({
//         title: "Success",
//         description: "Twilio numbers updated successfully.",
//       })

//       // Re-fetch to sync latest state & decide form visibility
//       await fetchAgentAndCompany()
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.message || "Failed to update numbers.",
//         variant: "destructive",
//       })
//     }
//   }

//   return (
//     <div className="space-y-10">
//       <div className="text-center space-y-2">
//         <h2 className="text-3xl font-bold text-slate-900">Tools</h2>
//         <p className="text-slate-500">
//           Manage Twilio numbers and link them to your agent
//         </p>
//       </div>

//       {companyNumbers.length === 0 && (
//         <div className="text-center text-slate-600 italic">
//           No Twilio numbers available for this company.
//         </div>
//       )}

//       {companyNumbers.length > 0 && (
//         <>
//           {/* Numbers grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {companyNumbers.map((num) => {
//               const isAssigned = assignedNumbers.includes(num)
//               return (
//                 <Card
//                   key={num}
//                   className={`transition-all duration-300 shadow-md hover:shadow-xl rounded-2xl ${
//                     isAssigned ? "border-green-500" : "border-slate-200"
//                   }`}
//                 >
//                   <CardHeader>
//                     <CardTitle className="text-lg font-semibold flex items-center justify-between">
//                       {num}
//                       {isAssigned && (
//                         <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
//                           Assigned
//                         </span>
//                       )}
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-slate-600 mb-4">
//                       {isAssigned
//                         ? "This number is currently linked to the agent."
//                         : "Click below to assign this number to the agent."}
//                     </p>
//                     <Button
//                       variant={isAssigned ? "destructive" : "default"}
//                       className="w-full"
//                       onClick={() => toggleNumber(num)}
//                     >
//                       {isAssigned ? "Unassign" : "Assign"}
//                     </Button>
//                   </CardContent>
//                 </Card>
//               )
//             })}
//           </div>

//           {/* Show form only if agent has assigned numbers (backend decides) */}
//           {showForm && (
//             <div className="space-y-6 border border-slate-200 p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 shadow-inner mt-10">
//               <h3 className="text-2xl font-semibold text-slate-800 text-center">
//                 Agent Configuration Form
//               </h3>
//               <p className="text-center text-slate-500">
//                 Fill out the details below for the assigned numbers
//               </p>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {Array.from({ length: 10 }).map((_, i) => (
//                   <div key={i} className="space-y-1">
//                     <label className="block text-sm text-slate-700 font-medium">
//                       Field {i + 1}
//                     </label>
//                     <Input
//                       placeholder={`Enter value for Field ${i + 1}`}
//                       className="rounded-xl border-slate-300"
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Save button (always show if user made changes) */}
//           {dirty && (
//             <div className="flex justify-end pt-6">
//               <Button
//                 className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-2 rounded-xl shadow-lg transition-transform transform hover:scale-105"
//                 onClick={handleSave}
//               >
//                 Save Changes
//               </Button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   )
// }







// Voiceprint Tab (keeping existing)
function VoiceprintTab({ agentId }: { agentId: string }) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Here's where you can manage the voice sample for your AI agent. Please select a default sample or upload your
          own!
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          <strong>Active Voice:</strong> Marissa - Friendly and Sociable - american/casual/young/female/conversational
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-800">Select Voice</h3>
        <div className="flex items-center space-x-4">
          <Select defaultValue="marissa">
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marissa">
                Marissa - Friendly and Sociable - american/casual/young/female/conversational
              </SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline">
            <Play className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Square className="w-4 h-4" />
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">Activate</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Voice Sample */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Upload a Voice Sample</h3>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <div className="space-y-4">
              <div className="text-slate-400">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <p className="text-slate-600">
                  Drag & drop files or <span className="text-blue-600 underline cursor-pointer">Browse</span>
                </p>
                <p className="text-sm text-slate-500 mt-2">Suggested format: Mp3. Maximum duration: 5 minute</p>
              </div>
            </div>
          </div>
          <Button className="w-full bg-slate-500 hover:bg-slate-600 text-white">Upload</Button>
        </div>

        {/* Create Voice Snippet */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Create Voice Snippet</h3>
          <p className="text-slate-600">Generate an example sound file with the selected voice.</p>
          <Textarea placeholder="Type text to say..." className="min-h-[200px]" />
          <Button className="w-full bg-slate-500 hover:bg-slate-600 text-white">Submit</Button>
        </div>
      </div>
    </div>
  )
}

// Voice Prompts Tab (keeping existing)
function VoicePromptsTab({ agentId }: { agentId: string }) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["welcome", "processing"])
  const { toast } = useToast()

  const [welcomePhrase, setWelcomePhrase] = useState("This is a virtual agent.")
  const [processingPhrases, setProcessingPhrases] = useState(`Okay, give me just a minute.
Great, just one second.
Hold on a moment.`)
  const [voicemailPhrase, setVoicemailPhrase] = useState("Okay, please start your voicemail, and hangup when you're done.")
  const [silencePhrase, setSilencePhrase] = useState("Are you still there? Maybe I missed what you said.")
  const DEFAULTS = {
  welcome: "This is a virtual agent.",
  processing: `Okay, give me just a minute.\nGreat, just one second.\nHold on a moment.`,
  voicemail: "Okay, please start your voicemail, and hangup when you're done.",
  silence: "Are you still there? Maybe I missed what you said.",
}
  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )
  }

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
          headers: {
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })

        if (!res.ok) throw new Error("Failed to fetch voice prompts")

        const data = await res.json()

        if (data.welcome_phrase) setWelcomePhrase(data.welcome_phrase)
        if (Array.isArray(data.processing_phrases)) setProcessingPhrases(data.processing_phrases.join("\n"))
        if (data.voicemail_phrase) setVoicemailPhrase(data.voicemail_phrase)
        if (data.silence_phrase) setSilencePhrase(data.silence_phrase)

      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to load voice prompts." })
      }
    }

    if (agentId) fetchPrompts()
  }, [agentId])


  const handleSave = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({
          welcome_phrase: welcomePhrase,
          processing_phrases: processingPhrases.split("\n").filter(p => p.trim() !== ""), // assuming backend expects an array
          voicemail_phrase: voicemailPhrase,
          silence_phrase: silencePhrase,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update voice prompts")
      }

      toast({ title: "Success", description: "Voice prompts updated successfully." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message })
    }
  }

  const handleReset = async () => {
  setWelcomePhrase(DEFAULTS.welcome)
  setProcessingPhrases(DEFAULTS.processing)
  setVoicemailPhrase(DEFAULTS.voicemail)
  setSilencePhrase(DEFAULTS.silence)

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${Cookies.get("Token") || ""}`,
      },
      body: JSON.stringify({
        welcome_phrase: DEFAULTS.welcome,
        processing_phrases: DEFAULTS.processing.split("\n"),
        voicemail_phrase: DEFAULTS.voicemail,
        silence_phrase: DEFAULTS.silence,
      }),
    })

    if (!res.ok) {
      throw new Error("Failed to reset to default")
    }

    toast({ title: "Success", description: "Voice prompts reset to default." })
  } catch (err: any) {
    toast({ title: "Error", description: err.message })
  }
}


  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          When your agent interacts with a caller, we have some standard phrases that we utilize throughout the
          conversation. You can change these here.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-medium text-slate-800">Manage Voice Phrases</h2>

        {/* Welcome Phrase */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-800">Welcome Phrase</h3>
              <p className="text-sm text-slate-600">The greeting your agent uses when it answers a call.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="icon" variant="outline"><Play className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline"><Square className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline" onClick={() => toggleSection("welcome")}>
                <ChevronUp className={`w-4 h-4 transition-transform ${expandedSections.includes("welcome") ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <Textarea
              value={welcomePhrase}
              onChange={(e) => setWelcomePhrase(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        {/* Processing Phrases */}
        {/* <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-800">Processing Phrases</h3>
              <p className="text-sm text-slate-600">
                What the agent says when it's processing something the caller has said. It will choose one at random
                from the list.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="icon" variant="outline"><Play className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline"><Square className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline" onClick={() => toggleSection("processing")}>
                <ChevronUp className={`w-4 h-4 transition-transform ${expandedSections.includes("processing") ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <Textarea
              value={processingPhrases}
              onChange={(e) => setProcessingPhrases(e.target.value)}
              className="min-h-[120px]"
            />
            <Button variant="outline" onClick={handleReset}>Reset to default</Button>
          </div>
        </div> */}

        {/* Voicemail Phrase */}
        {/* <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-800">Voicemail Phrase</h3>
              <p className="text-sm text-slate-600">
                The agent will say this after the caller has asked to leave a voicemail.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="icon" variant="outline"><Play className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline"><Square className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline" onClick={() => toggleSection("voicemail")}>
                <ChevronUp className={`w-4 h-4 transition-transform ${expandedSections.includes("voicemail") ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <Textarea
              value={voicemailPhrase}
              onChange={(e) => setVoicemailPhrase(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div> */}

        {/* Extended Silence Phrase */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-800">Extended Silence Phrase</h3>
              <p className="text-sm text-slate-600">The agent will say this after 15 seconds of silence.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="icon" variant="outline"><Play className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline"><Square className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline" onClick={() => toggleSection("silence")}>
                <ChevronUp className={`w-4 h-4 transition-transform ${expandedSections.includes("silence") ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <Textarea
              value={silencePhrase}
              onChange={(e) => setSilencePhrase(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>Reset to default</Button>

          <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  )
}

function AgentConfigTab({ agentId }: AgentConfigTabProps) {
  const [agentConfig, setAgentConfig] = useState<any>(null)
  const { toast } = useToast()

  // Fetch agent_config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
          headers: {
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })

        if (!res.ok) throw new Error("Failed to fetch agent config")
        const data = await res.json()

        if (data.agent_config) setAgentConfig(data.agent_config)
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to load agent config." })
      }
    }

    if (agentId) fetchConfig()
  }, [agentId])

  // Update field value
  const handleChange = (path: string[], value: any) => {
    setAgentConfig((prev: any) => {
      const updated = { ...prev }
      let obj = updated
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]]
      }
      obj[path[path.length - 1]] = value
      return updated
    })
  }

  // Save changes
  const handleSave = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({ agent_config: agentConfig }),
      })

      if (!res.ok) throw new Error("Failed to save agent config")

      toast({ title: "Success", description: "Agent config saved successfully." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message })
    }
  }

  // Render form fields with different UI based on type
  const renderField = (path: string[], key: string, value: any) => {
    const fullPath = [...path, key]

    if (typeof value === "boolean") {
      return (
        <div key={fullPath.join(".")} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl shadow-sm">
          <Label className="text-slate-700 font-medium">{key}</Label>
          <Switch
            checked={value}
            onCheckedChange={(val) => handleChange(fullPath, val)}
          />
        </div>
      )
    }

    if (typeof value === "number") {
      return (
        <div key={fullPath.join(".")} className="p-4 bg-white rounded-xl shadow-sm border space-y-3">
          <Label className="block text-slate-700 font-semibold">{key}</Label>
          <Slider
            value={[value]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={(val) => handleChange(fullPath, val[0])}
            className="w-full"
          />
          <div className="text-right text-xs text-slate-500">Current: {value}</div>
        </div>
      )
    }

    if (typeof value === "string" || value === null) {
      return (
        <div key={fullPath.join(".")} className="p-4 bg-white rounded-xl shadow-sm border space-y-2">
          <Label className="block text-slate-700 font-semibold">{key}</Label>
          <Input
            value={value || ""}
            placeholder="Enter value"
            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
            onChange={(e) => handleChange(fullPath, e.target.value)}
          />
        </div>
      )
    }

    if (typeof value === "object" && value !== null) {
      return (
        <div key={fullPath.join(".")} className="p-6 bg-gradient-to-br from-slate-50 to-white border rounded-2xl shadow-md space-y-5">
          <h4 className="text-lg font-semibold text-slate-800 tracking-tight capitalize">{key}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(value).map(([subKey, subVal]) =>
              renderField(fullPath, subKey, subVal)
            )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
  <div className="space-y-8">
    {/* Header */}
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-bold text-slate-800">⚙️ Manage Agent Config</h2>
      <p className="text-slate-500 text-sm">
        Fine-tune your agent with corporate-grade precision and aesthetics.
      </p>
    </div>

    {!agentConfig ? (
      <div className="flex justify-center items-center py-20">
        <p className="text-slate-600 animate-pulse">Loading configuration...</p>
      </div>
    ) : (
      <Accordion
        type="single"
        collapsible
        className="w-full space-y-6"
      >
        {Object.entries(agentConfig).map(([key, val]) => (
          <AccordionItem
            key={key}
            value={key}
            className="border rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm bg-white/80"
          >
            <AccordionTrigger className="px-6 py-4 font-semibold text-slate-800 bg-gradient-to-r from-slate-100 to-slate-50 hover:from-indigo-50 hover:to-blue-50 transition-colors duration-200">
              {key.toUpperCase()}
            </AccordionTrigger>
            <AccordionContent className="p-8 bg-gradient-to-br from-white via-slate-50 to-white space-y-8">
              {renderField([], key, val)}
            </AccordionContent>
          </AccordionItem>
        ))}

        <div className="flex justify-end pt-6">
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-white px-10 py-3 text-sm font-semibold rounded-xl transition-all duration-200"
            onClick={handleSave}
          >
            💾 Save All Changes
          </Button>
        </div>
      </Accordion>
    )}
  </div>
)

}



// AI Refine skeleton — Samsung-style scanning shimmer
function RefineSkeletonLoader() {
  const lines = [
    { w: "92%", delay: 0 },
    { w: "78%", delay: 0.07 },
    { w: "85%", delay: 0.14 },
    { w: "60%", delay: 0.21 },
    { w: "90%", delay: 0.28 },
    { w: "70%", delay: 0.35 },
    { w: "88%", delay: 0.42 },
    { w: "55%", delay: 0.49 },
    { w: "82%", delay: 0.56 },
    { w: "75%", delay: 0.63 },
    { w: "93%", delay: 0.70 },
    { w: "65%", delay: 0.77 },
    { w: "80%", delay: 0.84 },
    { w: "45%", delay: 0.91 },
  ]
  return (
    <div className="relative overflow-hidden px-14 py-6 min-h-[400px] bg-slate-50">
      {/* Scanning beam */}
      <motion.div
        className="absolute inset-x-0 top-0 h-full pointer-events-none z-10"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(99,102,241,0.06) 48%, rgba(139,92,246,0.10) 50%, rgba(99,102,241,0.06) 52%, transparent 100%)",
        }}
        animate={{ y: ["-100%", "200%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
      />
      {/* Glow border pulse */}
      <motion.div
        className="absolute inset-0 rounded-b-lg pointer-events-none z-10"
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ boxShadow: "inset 0 0 40px rgba(99,102,241,0.15)" }}
      />
      {/* Skeleton lines */}
      <div className="space-y-3">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 text-xs text-slate-300 font-mono select-none text-right">{i + 1}</div>
            <motion.div
              className="relative h-4 rounded-md overflow-hidden bg-slate-200"
              style={{ width: line.w }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: line.delay }}
            >
              <motion.div
                className="absolute inset-y-0 w-1/3 rounded-md"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.35) 50%, transparent 100%)",
                }}
                animate={{ x: ["-100%", "400%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: line.delay }}
              />
            </motion.div>
          </div>
        ))}
      </div>
      {/* AI label */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </motion.div>
        AI is refining…
      </div>
    </div>
  )
}

// Minimal line-by-line diff for prompt comparison
function diffPromptLines(oldStr: string, newStr: string) {
  const a = oldStr.split('\n')
  const b = newStr.split('\n')
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
  const result: { type: 'same' | 'add' | 'remove'; line: string }[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { result.unshift({ type: 'same', line: a[i - 1] }); i--; j-- }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { result.unshift({ type: 'add', line: b[j - 1] }); j-- }
    else { result.unshift({ type: 'remove', line: a[i - 1] }); i-- }
  }
  return result
}

// Agent Prompts Tab (keeping existing)
function AgentPromptsTab({ agentId }: { agentId: string }) {
  const [agentPrompt, setAgentPrompt] = useState("")
  const [loading, setLoading] = useState(true)
  const [isRefineDialogOpen, setIsRefineDialogOpen] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [promptDiff, setPromptDiff] = useState<{ oldPrompt: string; newPrompt: string } | null>(null)
  const [isPromptDiffOpen, setIsPromptDiffOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  // ── Guardrails ──
  const [guardrail, setGuardrail] = useState<Record<string, string>>({})
  const [isGuardrailOpen, setIsGuardrailOpen] = useState(false)
  const [guardrailDraft, setGuardrailDraft] = useState<{ id: number; key: string; value: string }[]>([])
  const [guardrailSaving, setGuardrailSaving] = useState(false)

  const openGuardrail = () => {
    setGuardrailDraft(
      Object.entries(guardrail).map(([k, v], i) => ({ id: i, key: k, value: String(v) }))
    )
    setIsGuardrailOpen(true)
  }

  const handleSaveGuardrail = async () => {
    const cleaned = guardrailDraft.filter(r => r.key.trim() !== "")
    const dict = Object.fromEntries(cleaned.map(r => [r.key.trim(), r.value]))
    setGuardrailSaving(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
        body: JSON.stringify({ guardrail: dict }),
      })
      if (!res.ok) throw new Error("Failed to save guardrails")
      setGuardrail(dict)
      setIsGuardrailOpen(false)
      toast({ title: "Saved", description: "Guardrails updated successfully." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message })
    } finally {
      setGuardrailSaving(false)
    }
  }

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
          headers: {
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })

        if (!res.ok) throw new Error("Failed to fetch agent prompt")
        const data = await res.json()

        if (data.instructions) setAgentPrompt(data.instructions)
        if (data.guardrail && typeof data.guardrail === "object") setGuardrail(data.guardrail)
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to load agent prompt." })
      } finally {
        setLoading(false)
      }
    }

    if (agentId) fetchPrompt()
  }, [agentId])

  // scroll line numbers along with textarea
  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({
          instructions: agentPrompt,
        }),
      })

      if (!res.ok) throw new Error("Failed to save agent prompt")

      toast({ title: "Success", description: "Agent prompt saved successfully." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message })
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(agentPrompt)
      toast({ title: "Copied", description: "Prompt copied to clipboard." })
    } catch {
      toast({ title: "Error", description: "Failed to copy prompt." })
    }
  }

  const handleRefinePrompt = async () => {
    setIsRefineDialogOpen(false)
    setIsRefining(true)
    const oldPrompt = agentPrompt
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/refine-prompt/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({ request: agentPrompt }),
      })
      if (!res.ok) throw new Error("Failed to refine prompt")
      const data = await res.json()
      if (data.refined_prompt) {
        setAgentPrompt(data.refined_prompt)
        setPromptDiff({ oldPrompt, newPrompt: data.refined_prompt })
        setIsPromptDiffOpen(true)
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to refine prompt." })
    } finally {
      setIsRefining(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-slate-800">Manage Agent Prompt</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-800">Agent Content Prompt</h3>
        <p className="text-slate-600">
          Let's give your virtual agent some personality. You'll tell the virtual agent how you want it to respond and
          with what additional context.
        </p>

        {/* ── Guardrail portal ── */}
        {mounted && isGuardrailOpen && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }}
            onClick={() => setIsGuardrailOpen(false)}
          >
            <div
              className="relative w-full max-w-xl flex flex-col rounded-2xl bg-white overflow-hidden"
              style={{ maxHeight: "85vh", boxShadow: "0 32px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <ShieldCheck className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div>
                    <h2 className="text-slate-900 font-semibold text-sm tracking-tight">Guardrails</h2>
                    <p className="text-slate-400 text-xs font-light mt-0.5">Key-value rules enforced at runtime</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {guardrailDraft.filter(r => r.key.trim()).length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      {guardrailDraft.filter(r => r.key.trim()).length} rule{guardrailDraft.filter(r => r.key.trim()).length !== 1 ? "s" : ""}
                    </span>
                  )}
                  <button
                    onClick={() => setIsGuardrailOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2.5">
                {guardrailDraft.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-slate-200" />
                    </div>
                    <p className="text-slate-400 text-sm font-light">No guardrails yet</p>
                    <p className="text-slate-300 text-xs">Add rules below to control agent behaviour</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-[1fr_1.5fr_32px] gap-2 px-1 pb-1">
                      <p className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Key</p>
                      <p className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Value</p>
                      <span />
                    </div>
                    {guardrailDraft.map((row, i) => (
                      <div key={row.id} className="grid grid-cols-[1fr_1.5fr_32px] gap-2 items-center group">
                        <input
                          value={row.key}
                          onChange={e => setGuardrailDraft(d => d.map((r, j) => j === i ? { ...r, key: e.target.value } : r))}
                          placeholder="e.g. topic"
                          className="h-9 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all font-mono placeholder:text-slate-300 text-slate-800"
                        />
                        <input
                          value={row.value}
                          onChange={e => setGuardrailDraft(d => d.map((r, j) => j === i ? { ...r, value: e.target.value } : r))}
                          placeholder="e.g. finance only"
                          className="h-9 px-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all placeholder:text-slate-300 text-slate-800"
                        />
                        <button
                          onClick={() => setGuardrailDraft(d => d.filter((_, j) => j !== i))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Add row */}
              <div className="px-6 pb-3">
                <button
                  onClick={() => setGuardrailDraft(d => [...d, { id: Date.now(), key: "", value: "" }])}
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium px-3 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors w-full"
                >
                  <Plus className="w-4 h-4" />
                  Add rule
                </button>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
                <p className="text-xs text-slate-400 font-light">Saved as JSON on the agent record.</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsGuardrailOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGuardrail}
                    disabled={guardrailSaving}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {guardrailSaving
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                      : <><CheckCircle2 className="w-3.5 h-3.5" /> Save Guardrails</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Prompt diff overlay — portal to document.body to escape framer-motion transform */}
        {mounted && isPromptDiffOpen && promptDiff && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setIsPromptDiffOpen(false); setPromptDiff(null) }}
          >
            <div
              className="relative w-full max-w-3xl flex flex-col rounded-2xl overflow-hidden border border-white/[0.08]"
              style={{ background: '#0d1117', maxHeight: '80vh', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-white font-medium text-sm">Prompt Changes</span>
                  <span className="text-xs text-slate-500 font-light">— review what AI changed</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500/50" />
                      removed
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
                      added
                    </span>
                  </div>
                  <button
                    onClick={() => { setIsPromptDiffOpen(false); setPromptDiff(null) }}
                    className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/[0.05]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Diff body */}
              <div className="overflow-y-auto font-mono text-xs flex-1">
                {(() => {
                  const lines = diffPromptLines(promptDiff.oldPrompt, promptDiff.newPrompt)
                  let lineNumOld = 0
                  let lineNumNew = 0
                  return lines.map((ln, idx) => {
                    if (ln.type === 'remove') lineNumOld++
                    else if (ln.type === 'add') lineNumNew++
                    else { lineNumOld++; lineNumNew++ }
                    const numOld = ln.type !== 'add' ? lineNumOld : ''
                    const numNew = ln.type !== 'remove' ? lineNumNew : ''
                    return (
                      <div
                        key={idx}
                        className={`flex min-w-0 ${
                          ln.type === 'remove'
                            ? 'bg-rose-500/[0.08]'
                            : ln.type === 'add'
                            ? 'bg-emerald-500/[0.08]'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="select-none w-10 text-right pr-2 py-0.5 text-slate-600 shrink-0 border-r border-white/[0.05]">
                          {numOld}
                        </span>
                        <span className="select-none w-10 text-right pr-2 py-0.5 text-slate-600 shrink-0 border-r border-white/[0.05]">
                          {numNew}
                        </span>
                        <span className={`select-none w-6 text-center py-0.5 shrink-0 ${
                          ln.type === 'remove' ? 'text-rose-400' : ln.type === 'add' ? 'text-emerald-400' : 'text-slate-700'
                        }`}>
                          {ln.type === 'remove' ? '-' : ln.type === 'add' ? '+' : ' '}
                        </span>
                        <span className={`px-2 py-0.5 whitespace-pre-wrap break-all leading-5 flex-1 ${
                          ln.type === 'remove' ? 'text-rose-300' : ln.type === 'add' ? 'text-emerald-300' : 'text-slate-400'
                        }`}>
                          {ln.line || ' '}
                        </span>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.07] bg-white/[0.02] shrink-0">
                <p className="text-xs text-slate-500 font-light">The refined prompt has been applied to the editor.</p>
                <button
                  onClick={() => { setIsPromptDiffOpen(false); setPromptDiff(null) }}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08] transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Confirmation dialog */}
        <Dialog open={isRefineDialogOpen} onOpenChange={setIsRefineDialogOpen}>
          <DialogContent className="max-w-sm rounded-2xl border border-slate-100 shadow-2xl p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <button
                  onClick={() => setIsRefineDialogOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <DialogHeader>
                <DialogTitle className="text-slate-900 text-lg font-semibold">Refine with AI?</DialogTitle>
                <DialogDescription className="text-slate-500 text-sm mt-1 font-light leading-relaxed">
                  Your current prompt will be analysed and rewritten by AI to be clearer, more structured, and more effective.
                </DialogDescription>
              </DialogHeader>
            </div>
            <DialogFooter className="px-6 py-4 bg-white flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setIsRefineDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-md shadow-indigo-200 px-5"
                onClick={handleRefinePrompt}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Refine
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={isRefining}>
                <Copy className="w-4 h-4 mr-2" />
                COPY
              </Button>
              <button
                onClick={openGuardrail}
                disabled={loading}
                className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Guardrails
                {Object.keys(guardrail).length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-semibold leading-none">
                    {Object.keys(guardrail).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsRefineDialogOpen(true)}
                disabled={isRefining || loading || !agentPrompt.trim()}
                className="
                  inline-flex items-center gap-1.5 px-3.5 py-1.5
                  rounded-lg text-sm font-medium
                  bg-gradient-to-r from-indigo-500 to-violet-500
                  hover:from-indigo-600 hover:to-violet-600
                  text-white shadow-md shadow-indigo-200
                  transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed
                  group
                "
              >
                <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200" />
                Refine Prompt
              </button>
            </div>
            <div className="text-sm text-slate-500">
              {isRefining ? (
                <span className="text-indigo-500 font-medium">AI refining…</span>
              ) : (
                <>{agentPrompt.split("\n").length} lines, {agentPrompt.length} characters</>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mb-3 text-cyan-600" />
              <p>Loading prompt...</p>
            </div>
          ) : isRefining ? (
            <RefineSkeletonLoader />
          ) : (
            <div className="relative">
              {/* Line numbers */}
              <div
                ref={lineNumbersRef}
                className="absolute left-0 top-0 bottom-0 w-12 bg-slate-50 border-r border-slate-200 overflow-hidden text-xs text-slate-400 pt-4"
              >
                {Array.from({ length: agentPrompt.split("\n").length || 1 }, (_, i) => (
                  <div key={i + 1} className="h-6 flex items-center justify-center">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                onScroll={handleScroll}
                className="pl-14 min-h-[400px] border-0 resize-none focus:ring-0 font-mono text-sm overflow-y-auto"
                style={{ lineHeight: "1.5rem" }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-8"
            onClick={handleSave}
            disabled={loading || isRefining}
          >
            SAVE ALL
          </Button>
        </div>
      </div>
    </div>
  )
}


// Voice Settings Tab (keeping existing)
function VoiceSettingsTab({ agentId }: { agentId: string }) {
  const { toast } = useToast()
  const [stability, setStability] = useState(50)
  const [clarity, setClarity] = useState(50)
  const [styleExaggeration, setStyleExaggeration] = useState(50)
  const [voiceSpeed, setVoiceSpeed] = useState(50)
  const [speakerBoost, setSpeakerBoost] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })
        const data = await res.json()
        setStability(data.voice_stability ?? 50)
        setClarity(data.voice_clarity ?? 50)
        setStyleExaggeration(data.voice_style ?? 50)
        // setVoiceSpeed(Math.round(((2 - data.voice_speed) / 1.5) * 100) ?? 50)
        setVoiceSpeed(data.voice_speed ?? 50)
        setSpeakerBoost(data.speaker_boost ?? true)
      } catch (error) {
        console.error("Failed to load voice settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [agentId])

  const handleSave = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({
          voice_stability: stability,
          voice_clarity: clarity,
          voice_style: styleExaggeration,
          // voice_speed: -1 * ((voiceSpeed * (1.5 / 100)) - 2),
          voice_speed: voiceSpeed,
          speaker_boost: speakerBoost,
        }),
      })

      if (res.ok) {
        toast({ title: "Voice settings updated", description: "Preferences saved." })
      } else throw new Error("Failed to update")
    } catch {
      toast({ title: "Update failed", description: "Could not save settings.", variant: "destructive" })
    }
  }

  const handleReset = () => {
    setStability(50)
    setClarity(50)
    setStyleExaggeration(50)
    setVoiceSpeed(50)
    setSpeakerBoost(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-8 rounded-lg border border-gray-200 bg-white text-gray-900">
      <h2 className="text-lg font-medium mb-6 text-center">Voice Settings</h2>

      <div className="space-y-6">
        {[
          { label: "Stability", value: stability, set: setStability },
          { label: "Clarity", value: clarity, set: setClarity },
          { label: "Style", value: styleExaggeration, set: setStyleExaggeration },
          { label: "Speed", value: voiceSpeed, set: setVoiceSpeed },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-700">{label}</span>
              <span className="text-sm text-gray-500">{value}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg accent-gray-700 cursor-pointer"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center mt-6">
        <input
          type="checkbox"
          id="speaker-boost"
          checked={speakerBoost}
          onChange={(e) => setSpeakerBoost(e.target.checked)}
          className="w-4 h-4 accent-gray-700"
        />
        <label htmlFor="speaker-boost" className="ml-2 text-sm text-gray-700">
          Speaker Boost
        </label>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handleReset} className="text-gray-700 border-gray-300">
          Reset
        </Button>
        <Button onClick={handleSave} className="bg-gray-800 text-white hover:bg-gray-700">
          Save
        </Button>
      </div>
    </div>
  )
}

// Additional Settings Tab
function AdditionalSettings() {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "location",
    "business-hours",
    "agent-settings",
    "outbound-call",
    "post-call",
  ])
  const [businessClosed, setBusinessClosed] = useState(false)
  const [removeBusiness, setRemoveBusiness] = useState(false)
  const [alwaysSendText, setAlwaysSendText] = useState(true)
  const [enableTemplate, setEnableTemplate] = useState(false)
  const [autogenerate, setAutogenerate] = useState(true)
  const [enableInterruptions, setEnableInterruptions] = useState(false)
  const [enableSMS, setEnableSMS] = useState(false)
  const [enableHearDTMF, setEnableHearDTMF] = useState(false)
  const [enableSendDTMF, setEnableSendDTMF] = useState(false)
  const [allowContentSearch, setAllowContentSearch] = useState(false)
  const [disableVoicemail, setDisableVoicemail] = useState(true)
  const [disableSMSAgent, setDisableSMSAgent] = useState(true)
  const [enableAnsweringMachine, setEnableAnsweringMachine] = useState(false)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium text-slate-800 text-center">Additional Settings</h2>

      {/* Location Settings */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-blue-600 font-medium">Location settings</h3>
          <Button size="icon" variant="outline" onClick={() => toggleSection("location")}>
            <ChevronUp
              className={`w-4 h-4 transition-transform ${expandedSections.includes("location") ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
        {expandedSections.includes("location") && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Agent Locale*</label>
              <Select defaultValue="english-us">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english-us">English (United States)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Agent Location (street address or city & state)</label>
              <Input placeholder="" />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Agent Timezone (automatically set by Agent Location)</label>
              <Select defaultValue="utc">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">Etc/UTC: Coordinated Universal Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Business Hours */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-blue-600 font-medium">Business Hours</h3>
          <Button size="icon" variant="outline" onClick={() => toggleSection("business-hours")}>
            <ChevronUp
              className={`w-4 h-4 transition-transform ${expandedSections.includes("business-hours") ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
        {expandedSections.includes("business-hours") && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Current Generated business hours.</label>
              <Textarea className="min-h-[120px]" />
            </div>

            <p className="text-slate-600 text-sm">This represents the agent's understanding of your business hours</p>

            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Business Hours Source</label>
              <Select defaultValue="plain-text">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain-text">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Business Hours Description</label>
              <Textarea className="min-h-[120px]" />
            </div>

            <p className="text-slate-600 text-sm">Holidays/Special Dates should be specified with the full date.</p>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="business-closed"
                checked={businessClosed}
                onChange={(e) => setBusinessClosed(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="business-closed" className="text-slate-700">
                Toggle to enforce business as closed.
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Days business is closed.</label>
              <Input defaultValue="0" />
              <p className="text-slate-600 text-sm">If set to zero, a manual update is required to re-open.</p>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="remove-business"
                checked={removeBusiness}
                onChange={(e) => setRemoveBusiness(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remove-business" className="text-slate-700">
                Remove Business Hours
              </label>
            </div>
            <p className="text-slate-600 text-sm">Removes all business hour data from agent and sets to default.</p>
          </div>
        )}
      </div>

      {/* Agent Settings */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-blue-600 font-medium">Agent Settings</h3>
          <Button size="icon" variant="outline" onClick={() => toggleSection("agent-settings")}>
            <ChevronUp
              className={`w-4 h-4 transition-transform ${expandedSections.includes("agent-settings") ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
        {expandedSections.includes("agent-settings") && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Pronunciation Dictionaries</label>
              <Input />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Initial Trigger</label>
              <Input defaultValue="Start the goal" />
              <p className="text-slate-600 text-sm">
                Instead of waiting for first response, this can trigger a specific task for each conversation.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="always-send-text"
                checked={alwaysSendText}
                onChange={(e) => setAlwaysSendText(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="always-send-text" className="text-slate-700">
                Always send opening text
              </label>
            </div>
            <p className="text-slate-600 text-sm">
              If unchecked, opening texts still be triggered by 'openingsms:true' in API metadata. If no message
              provided below, no text will be sent.
            </p>

            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Text message to send when call is answered.</label>
              <Textarea className="min-h-[80px]" />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enable-template"
                checked={enableTemplate}
                onChange={(e) => setEnableTemplate(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enable-template" className="text-slate-700">
                Enable Template Library
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="autogenerate"
                checked={autogenerate}
                onChange={(e) => setAutogenerate(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autogenerate" className="text-slate-700">
                Autogenerate next action phrases
              </label>
            </div>
            <p className="text-slate-600 text-sm">
              The Agent will naturally generate phrases to continue the conversation.
            </p>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enable-interruptions"
                checked={enableInterruptions}
                onChange={(e) => setEnableInterruptions(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enable-interruptions" className="text-slate-700">
                Enable Interruptions.
              </label>
            </div>
            <p className="text-slate-600 text-sm">Allow the agent to be interrupted mid-sentence.</p>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enable-sms"
                checked={enableSMS}
                onChange={(e) => setEnableSMS(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enable-sms" className="text-slate-700">
                Enable SMS Channel During Calls
              </label>
            </div>
            <p className="text-slate-600 text-sm">Allow agent to receive and read text messages during the call.</p>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enable-hear-dtmf"
                checked={enableHearDTMF}
                onChange={(e) => setEnableHearDTMF(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enable-hear-dtmf" className="text-slate-700">
                Enable Agent to hear DTMF (dial tones)
              </label>
            </div>
            <p className="text-slate-600 text-sm">
              DTMF tones will be sent to the Agent. This is not necessary for tasks that are triggered by DTMF
            </p>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enable-send-dtmf"
                checked={enableSendDTMF}
                onChange={(e) => setEnableSendDTMF(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enable-send-dtmf" className="text-slate-700">
                Enable Agent to send DTMF (dial tones)
              </label>
            </div>
            <p className="text-slate-600 text-sm">
              Agent can send DTMF tones when contextually relevant, i.e. responding to an answering machine.
            </p>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="allow-content-search"
                checked={allowContentSearch}
                onChange={(e) => setAllowContentSearch(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="allow-content-search" className="text-slate-700">
                Allow Agent to independently search Content Library
              </label>
            </div>
            <p className="text-slate-600 text-sm">
              If checked, the Agent can search content library when deemed necessary. If unchecked, content library will
              be searched for every response.
            </p>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="disable-voicemail"
                checked={disableVoicemail}
                onChange={(e) => setDisableVoicemail(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="disable-voicemail" className="text-slate-700">
                Disable voicemail request detection.
              </label>
            </div>
            <p className="text-slate-600 text-sm">Prevent the agent from automatically offering to take a voicemail</p>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="disable-sms-agent"
                checked={disableSMSAgent}
                onChange={(e) => setDisableSMSAgent(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="disable-sms-agent" className="text-slate-700">
                Disable SMS.
              </label>
            </div>
            <p className="text-slate-600 text-sm">Prevent the agent from being able to send SMS messages.</p>
          </div>
        )}
      </div>

      {/* Outbound Call Settings */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-blue-600 font-medium">Outbound Call Settings</h3>
          <Button size="icon" variant="outline" onClick={() => toggleSection("outbound-call")}>
            <ChevronUp
              className={`w-4 h-4 transition-transform ${expandedSections.includes("outbound-call") ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
        {expandedSections.includes("outbound-call") && (
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enable-answering-machine"
                checked={enableAnsweringMachine}
                onChange={(e) => setEnableAnsweringMachine(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enable-answering-machine" className="text-slate-700">
                Enable answering machine detection
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-medium">Greeting Delay</label>
              <Input defaultValue="0" />
              <p className="text-slate-600 text-sm">
                The delay, in seconds, the agent will wait before saying its Hello Prompt. Set to 0 to allow agent to
                determine if human or machine answered.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Post Call Settings */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-blue-600 font-medium">Post Call Settings</h3>
          <Button size="icon" variant="outline" onClick={() => toggleSection("post-call")}>
            <ChevronUp
              className={`w-4 h-4 transition-transform ${expandedSections.includes("post-call") ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
        {expandedSections.includes("post-call") && (
          <div className="p-4">
            <p className="text-slate-600">Post call settings will be configured here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AdditionalSettingsTab({ agentId }: { agentId: string }) {
  const [agentName, setAgentName] = useState("")
  const [agentPersona, setAgentPersona] = useState("")
  const [agentGoals, setAgentGoals] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch Agent details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
          headers: {
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })

        if (!res.ok) throw new Error("Failed to fetch agent details")
        const data = await res.json()

        setAgentName(data.name || "")
        setAgentPersona(data.persona || "")
        setAgentGoals(data.goals || "")
      } catch (err: any) {
        toast({ title: "❌ Error", description: err.message || "Could not load agent settings." })
      } finally {
        setLoading(false)
      }
    }

    if (agentId) fetchDetails()
  }, [agentId])

  // Save changes
  const handleSave = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({
          name: agentName,
          persona: agentPersona,
          goals: agentGoals,
        }),
      })

      if (!res.ok) throw new Error("Failed to save changes")

      toast({ title: "Success", description: "Agent settings updated successfully." })
    } catch (err: any) {
      toast({ title: "❌ Error", description: err.message })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-slate-600 animate-pulse">Loading agent data...</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="max-w-3xl mx-auto p-10 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-2xl backdrop-blur-xl border border-indigo-100 space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-extrabold text-slate-800 tracking-tight"
        >
          Additional Settings
        </motion.h2>
        <p className="text-slate-500 text-sm">
          Fine-tune your agent’s <span className="font-semibold">identity</span>,{" "}
          <span className="font-semibold">persona</span>, and{" "}
          <span className="font-semibold">goals</span>.
        </p>
      </div>

      {/* Agent Name */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <label className="block text-slate-700 font-semibold">Agent Name</label>
        <Input
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="Enter a cinematic agent name"
          className="rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
        />
      </motion.div>

      {/* Agent Persona */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <label className="block text-slate-700 font-semibold">Agent Persona</label>
        <Textarea
          value={agentPersona}
          onChange={(e) => setAgentPersona(e.target.value)}
          placeholder="Describe your agent’s persona (aesthetic, role, tone...)"
          rows={4}
          className="rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
        />
      </motion.div>

      {/* Agent Goals */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <label className="block text-slate-700 font-semibold">Agent Goals</label>
        <Textarea
          value={agentGoals}
          onChange={(e) => setAgentGoals(e.target.value)}
          placeholder="Define the strategic goals your agent should achieve"
          rows={4}
          className="rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
        />
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-end"
      >
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200"
        >
          Save Changes
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default function AgentSettingsPage() {
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("voiceprint")

  const handleSelectAgent = (agent: any) => {
    setSelectedAgent(agent)
  }

  const handleBackToAgents = () => {
    setSelectedAgent(null)
    setActiveTab("voiceprint")
  }

  const renderTabContent = () => {
    if (!selectedAgent) return null

    switch (activeTab) {
      case "voiceprint":
        return <VoiceprintTab agentId={selectedAgent.id} />
      case "voice-prompts":
        return <VoicePromptsTab agentId={selectedAgent.id} />
      case "agent-prompts":
        return <AgentPromptsTab agentId={selectedAgent.id}/>
      case "voice-settings":
        return <VoiceSettingsTab agentId={selectedAgent.id} />
      case "tools":
        return <ToolsTab agentId={selectedAgent.id} />
      case "agent-config":
        return <AgentConfigTab agentId={selectedAgent.id} />
      case "faq":
        return <FAQTab agentId={selectedAgent.id} />
      case "unanswered":
        return <UnansweredQuestionsPanel agentId={selectedAgent.id} />
      case "additional-settings":
        return <AdditionalSettingsTab agentId={selectedAgent.id} />
      default:
        return <VoiceprintTab agentId={selectedAgent.id} />
    }
  }

  if (!selectedAgent) {
    return (
      <div className="p-6">
        <AgentSelection onSelectAgent={handleSelectAgent} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBackToAgents}>
            ← Back to Agents
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Agent Settings</h1>
            <p className="text-slate-600">Configuring: {selectedAgent.name}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab.id === activeTab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  )
}
