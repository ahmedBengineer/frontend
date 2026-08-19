"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { AddAgentWizard } from "@/components/add-agent-wizard"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Bot, Plus, Users, Activity, FileText, Settings, Loader2, Search, ChevronLeft, ChevronRight, Wrench, Eye, SlidersHorizontal, ArrowDownUp, ArrowUpAZ, ArrowDownAZ, CalendarArrowDown, CalendarArrowUp, Pencil, Globe, ChevronDown, ChevronUp, Clipboard, Bell } from "lucide-react"
import { CardGridSkeleton } from "@/components/page-skeletons"
import CustomToolsForm from "@/components/CustomToolsForm"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/components/subscription-provider";
import { useTutorial } from "@/components/tutorial/TutorialProvider";
import {
  matchesAgentRuntime,
  normalizeAgentRuntime,
  type AgentRuntime,
  type AgentRuntimeFilter,
} from "@/lib/agents/runtime"

interface Agent {
  id: number
  name: string
  status: "Active" | "Inactive"
  persona: string
  instructions: string
  primary: boolean
  created_at: string
  type: "Inbound" | "Outbound"
  runtime: AgentRuntime
}

function normalizePersona(value: unknown): string {
  if (value == null) return "Unknown"
  const s = String(value).trim()
  return s.length > 0 ? s : "Unknown"
}

function jsonPretty(obj: any) {
  return JSON.stringify(obj, null, 2)
}

function normalizeToolShape(tool: any) {
  return {
    ...tool,
    request_parameters: tool?.request_parameters ?? tool?.parameters ?? {},
    response_parameters: tool?.response_parameters ?? {},
    response_payload: tool?.response_payload ?? {},
    auth_header_name: tool?.auth_header_name ?? "",
    auth_token: tool?.auth_token ?? "",
  }
}

function ToolMethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-50 text-green-700 border border-green-200",
    POST: "bg-blue-50 text-blue-700 border border-blue-200",
    PUT: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    PATCH: "bg-purple-50 text-purple-700 border border-purple-200",
    DELETE: "bg-rose-50 text-rose-700 border border-rose-200",
  }
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-light ${
        colors[method] || "bg-slate-50 text-slate-700 border border-slate-200"
      }`}
    >
      {method}
    </span>
  )
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true) // 👈 Loading state
  const [isAddAgentWizardOpen, setIsAddAgentWizardOpen] = useState(false)
  const [expandedPersonas, setExpandedPersonas] = useState<Set<number>>(new Set())
  const [primaryDialogOpen, setPrimaryDialogOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [agentToDeleteId, setAgentToDeleteId] = useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { subscription } = useSubscription();
  const { currentStep, nextStep, createdAgentId, markCheckpoint } = useTutorial();
  const canCreateAgent = subscription?.limits?.can_create_agent === true
  const isPendingPayment = subscription?.status === "pending_payment"

  const [toolsDialogOpen, setToolsDialogOpen] = useState(false)
  const [selectedAgentTools, setSelectedAgentTools] = useState<string[]>([])
const [assignedTools, setAssignedTools] = useState<any[]>([])
const [loadingTools, setLoadingTools] = useState(false)
  const [viewTool, setViewTool] = useState<any>(null)
  const [editTool, setEditTool] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null)
  const [selectedAgentForTools, setSelectedAgentForTools] = useState<number | null>(null)

  // Appointment reminder config
  const [isApptReminderOpen, setIsApptReminderOpen] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)
  const [reminderSaving, setReminderSaving] = useState(false)
  const [reminderForm, setReminderForm] = useState({
    enabled: false,
    agent_name: "",
    webhook_agent_name: "",
    minutes_before: 30,
    grace_minutes: 60,
    reminder_timezone: "",
  })
  const [outboundAgents, setOutboundAgents] = useState<Agent[]>([])

  // Search, filter, pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL")
  const [typeFilter, setTypeFilter] = useState<"ALL" | "Inbound" | "Outbound">("ALL")
  const [runtimeFilter, setRuntimeFilter] = useState<AgentRuntimeFilter>("ALL")
  const [sortOrder, setSortOrder] = useState<"date_desc" | "date_asc" | "alpha_asc" | "alpha_desc">("date_desc")
  const [currentPage, setCurrentPage] = useState(1)
  const agentsPerPage = 9


  const fetchAgents = () => {
   
    setLoading(true) // start loading
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${Cookies.get("Token") || ""}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data)
        const rawList = Array.isArray(data) ? data : data?.results
        const list = Array.isArray(rawList) ? rawList : []
        const enriched: Agent[] = list.map((agent: Record<string, unknown>) => ({
          id: Number(agent.id),
          name: typeof agent.name === "string" && agent.name.trim() ? agent.name.trim() : "Unnamed",
          status:
            agent.status === "Active" || agent.status === "active" ? "Active" : "Inactive",
          persona: normalizePersona(agent.persona),
          instructions: typeof agent.instructions === "string" ? agent.instructions.trim() : "",
          primary: Boolean(agent.primary),
          created_at: typeof agent.created_at === "string" ? agent.created_at : "",
          type: agent.type === "Outbound" ? "Outbound" : "Inbound",
          runtime: normalizeAgentRuntime(agent.agent_type),
        }))
        setAgents(enriched)
        // If the tutorial is waiting for the agents list to spotlight the settings gear,
        // dispatch an event so the overlay can restart its search immediately.
        window.dispatchEvent(new CustomEvent("tutorial:agents-loaded"))
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to fetch agents",
          variant: "destructive",
        })
      })
      .finally(() => setLoading(false)) // stop loading
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const handleToggleAgentStatus = async (id: number) => {
    const token = Cookies.get("Token") || ""
    const agentToUpdate = agents.find((agent) => agent.id === id)
    if (!agentToUpdate) return

    if (agentToUpdate.primary) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot deactivate the primary agent.",
        variant: "destructive",
      })
      return
    }

    const newStatus = agentToUpdate.status === "Active" ? "Inactive" : "Active"

    setAgents((prev) => prev.map((agent) => (agent.id === id ? { ...agent, status: newStatus } : agent)))

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ status: newStatus.toLowerCase() }),
      })

      if (!res.ok) throw new Error("Failed to update agent status")

      toast({
        title: "Agent Status Updated",
        description: `Agent status changed to ${newStatus}.`,
      })
    } catch (error) {
      setAgents((prev) =>
        prev.map((agent) => (agent.id === id ? { ...agent, status: agentToUpdate.status } : agent))
      )
      toast({
        title: "Error",
        description: "Failed to update agent status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAgent = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
      })

      if (res.ok) {
        setAgents((prev) => prev.filter((agent) => agent.id !== id))
        toast({
          title: "Agent Deleted",
          description: "The agent has been successfully deleted.",
          variant: "destructive",
        })
      } else throw new Error("Delete failed")
    } catch {
      toast({ title: "Error", description: "Failed to delete agent", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
      setAgentToDeleteId(null)
    }
  }

  const confirmDelete = (id: number) => {
    setAgentToDeleteId(id)
    setDeleteDialogOpen(true)
  }

  const handleMakePrimaryClick = (id: number) => {
    setSelectedAgentId(id)
    setPrimaryDialogOpen(true)
  }

  const handleMakePrimary = async () => {
    if (!selectedAgentId) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${selectedAgentId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({ primary: true }),
      })

      if (res.ok) {
        setAgents((prevAgents) =>
          prevAgents.map((agent) =>
            agent.id === selectedAgentId ? { ...agent, primary: true } : { ...agent, primary: false }
          )
        )

        toast({
          title: "Primary Agent Set",
          description: "The agent has been set as primary.",
        })
      } else throw new Error("Failed to set primary agent")
    } catch {
      toast({
        title: "Error",
        description: "Failed to set primary agent",
        variant: "destructive",
      })
    } finally {
      setPrimaryDialogOpen(false)
      setSelectedAgentId(null)
    }
  }

  const togglePersonaExpansion = (agentId: number) => {
    setExpandedPersonas((prev) => {
      const newSet = new Set(prev)
      newSet.has(agentId) ? newSet.delete(agentId) : newSet.add(agentId)
      return newSet
    })
  }

  const truncatePersona = (persona: string, maxLength = 60) => {
    const text = persona ?? ""
    return text.length <= maxLength ? text : text.substring(0, maxLength) + "..."
  }

  const displayAgents = useMemo(() => {
    if (!Array.isArray(agents)) return [] as Agent[]
    return agents.map((a) => ({
      ...a,
      name: typeof a?.name === "string" && a.name.trim() ? a.name.trim() : "Unnamed",
      persona: normalizePersona(a?.persona),
      instructions: typeof a?.instructions === "string" ? a.instructions.trim() : "",
      created_at: a?.created_at ?? "",
      type: a?.type === "Outbound" ? "Outbound" : "Inbound",
      runtime: normalizeAgentRuntime(a?.runtime),
    }))
  }, [agents])

  const safeAssignedTools = useMemo(
    () => (Array.isArray(assignedTools) ? assignedTools : []),
    [assignedTools]
  )

  const activeAgents = displayAgents.filter((agent) => agent.status === "Active").length
  const totalAgents = displayAgents.length
const fetchToolDetails = async (id: string | number) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/${id}/`,
    { headers: { Authorization: `Token ${Cookies.get("Token") || ""}` } }
  )
  if (!res.ok) throw new Error("Failed to fetch tool details")
  return normalizeToolShape(await res.json())
}

const handleViewTools = async (agentId: number) => {
  try {
    setLoadingTools(true)
    setAssignedTools([])
    setToolsDialogOpen(true)
    setSelectedAgentForTools(agentId)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
      }
    )

    if (!res.ok) throw new Error("Failed to fetch agent tools")

    const data = await res.json()

    // The backend returns an array of custom features / tools assigned
    const tools = Array.isArray(data.custom_features)
      ? data.custom_features.map(normalizeToolShape)
      : []

    setAssignedTools(tools)
  } catch (err) {
    console.error("Error fetching tools:", err)
    toast({
      title: "Error",
      description: "Failed to fetch tools for this agent.",
      variant: "destructive",
    })
  } finally {
    setLoadingTools(false)
  }
}

const confirmDeleteTool = (id: string) => {
  toast({
    title: "Confirm Deletion",
    description: "This action cannot be undone.",
    variant: "destructive",
    action: (
      <Button variant="destructive" size="sm" onClick={() => handleDeleteTool(id)}>
        Delete
      </Button>
    ),
  })
}

const handleDeleteTool = async (id: string) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/${id}/`,
      {
        method: "DELETE",
        headers: { Authorization: `Token ${Cookies.get("Token") || ""}` },
      }
    )
    if (!res.ok) throw new Error("Failed to delete tool")
    toast({ title: "Deleted", description: "Tool removed successfully." })
    setAssignedTools((prev) => prev.filter((t) => t.id !== id))
  } catch {
    toast({ title: "Error", description: "Could not delete tool.", variant: "destructive" })
  }
}

const handleToolEditSuccess = async () => {
  toast({ title: "Success", description: "Tool updated successfully." })
  setShowEditDialog(false)
  setEditTool(null)
  if (selectedAgentForTools) {
    try {
      setLoadingTools(true)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${selectedAgentForTools}/`,
        { headers: { Authorization: `Token ${Cookies.get("Token") || ""}` } }
      )
      const data = await res.json()
      const tools = Array.isArray(data.custom_features) ? data.custom_features.map(normalizeToolShape) : []
      setAssignedTools(tools)
    } finally {
      setLoadingTools(false)
    }
  }
}

const openApptReminderDialog = async () => {
  setIsApptReminderOpen(true)
  setReminderLoading(true)
  try {
    const token = Cookies.get("Token") || ""
    const [configRes, agentsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/hms/appointment-reminders/config/`, {
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      }),
    ])
    if (configRes.ok) {
      const cfg = await configRes.json()
      setReminderForm({
        enabled: cfg.enabled ?? false,
        agent_name: cfg.agent_name ?? "",
        webhook_agent_name: cfg.webhook_agent_name ?? "",
        minutes_before: cfg.minutes_before ?? 30,
        grace_minutes: cfg.grace_minutes ?? 60,
        reminder_timezone: cfg.reminder_timezone ?? "",
      })
    }
    if (agentsRes.ok) {
      const data = await agentsRes.json()
      const list: Agent[] = (Array.isArray(data) ? data : data?.results ?? []).map((a: any) => ({
        id: Number(a.id),
        name: typeof a.name === "string" && a.name.trim() ? a.name.trim() : "Unnamed",
        status: a.status === "Active" || a.status === "active" ? "Active" : "Inactive",
        persona: normalizePersona(a.persona),
        instructions: typeof a.instructions === "string" ? a.instructions.trim() : "",
        primary: Boolean(a.primary),
        created_at: typeof a.created_at === "string" ? a.created_at : "",
        type: a.type === "Outbound" ? "Outbound" : "Inbound",
      }))
      setOutboundAgents(list.filter((a) => a.type === "Outbound"))
    }
  } catch {
    toast({ title: "Error", description: "Failed to load reminder config.", variant: "destructive" })
  } finally {
    setReminderLoading(false)
  }
}

const handleSaveReminderConfig = async () => {
  setReminderSaving(true)
  try {
    const token = Cookies.get("Token") || ""
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/hms/appointment-reminders/config/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      body: JSON.stringify(reminderForm),
    })
    if (!res.ok) throw new Error("Failed to save")
    toast({ title: "Saved", description: "Appointment reminder config updated." })
    setIsApptReminderOpen(false)
  } catch {
    toast({ title: "Error", description: "Failed to save reminder config.", variant: "destructive" })
  } finally {
    setReminderSaving(false)
  }
}

  // Filtered & paginated agents
  const filteredAgents = useMemo(() => {
    return displayAgents
      .filter((a) => statusFilter === "ALL" || a.status === statusFilter)
      .filter((a) => typeFilter === "ALL" || a.type === typeFilter)
      .filter((a) => matchesAgentRuntime(a.runtime, runtimeFilter))
      .filter((a) => {
        if (!searchTerm.trim()) return true
        const q = searchTerm.toLowerCase()
        return a.name.toLowerCase().includes(q) || a.persona.toLowerCase().includes(q) || a.instructions.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (sortOrder === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortOrder === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (sortOrder === "alpha_asc") return a.name.localeCompare(b.name)
        if (sortOrder === "alpha_desc") return b.name.localeCompare(a.name)
        return 0
      })
  }, [displayAgents, statusFilter, typeFilter, runtimeFilter, searchTerm, sortOrder])

  const filteredPrimary = filteredAgents.find((a) => a.primary) ?? null
  const filteredSecondary = filteredAgents.filter((a) => !a.primary)

  const totalFilteredAgents = filteredAgents.length
  const totalPages = Math.ceil(filteredSecondary.length / agentsPerPage)
  const currentAgents = filteredSecondary.slice((currentPage - 1) * agentsPerPage, currentPage * agentsPerPage)

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [searchTerm, statusFilter, typeFilter, runtimeFilter, sortOrder])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50" />
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1 h-20 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
              <div>
                <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">Agents</h1>
                <p className="text-lg text-slate-500 font-light tracking-wide">Manage and monitor your AI agents in one centralized dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
            <button
              onClick={openApptReminderDialog}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl shadow-sm transition-all duration-200"
            >
              <Bell className="w-4 h-4 text-slate-500" />
              Appointment Reminders
            </button>
            <Dialog open={isAddAgentWizardOpen} onOpenChange={setIsAddAgentWizardOpen}>
              <DialogTrigger asChild>
                <div className="relative group/btn">
                  <Button
                    size="lg"
                    disabled={!canCreateAgent}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 text-sm font-medium shadow-md rounded-xl create-agent-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      if (!canCreateAgent) return
                      setIsAddAgentWizardOpen(true)
                      if (currentStep === "click-add-agent") {
                        nextStep()
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" /> Add New Agent
                  </Button>
                  {!canCreateAgent && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md bg-slate-800 text-white text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none z-10">
                      {isPendingPayment ? "Complete payment first" : "Agent limit reached"}
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <AddAgentWizard
                isOpen={isAddAgentWizardOpen}
                onClose={() => setIsAddAgentWizardOpen(false)}
                onAgentAdded={(newAgent) => {
                  // Optimistically prepend the new agent so it appears immediately (no network wait)
                  setAgents((prev) => [newAgent, ...prev])
                  // Then sync with the server in the background
                  fetchAgents()
                }}
              />
            </Dialog>
            </div>
          </div>

          {/* ── Stats ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total</span>
                <Users className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              {loading ? (
                <div className="h-10 w-12 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <p className="text-4xl font-extralight text-slate-900">{totalAgents}</p>
              )}
            </div>
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active</span>
                <Activity className="w-4 h-4 text-emerald-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              {loading ? (
                <div className="h-10 w-12 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <p className="text-4xl font-extralight text-emerald-600">{activeAgents}</p>
              )}
            </div>
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Inactive</span>
                <Bot className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              {loading ? (
                <div className="h-10 w-12 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <p className="text-4xl font-extralight text-slate-400">{totalAgents - activeAgents}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* ── Search & Filters ─────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search agents by name or persona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["ALL", "Active", "Inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                  statusFilter === f
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {f === "ALL" ? "All" : f}
              </button>
            ))}
          </div>

          {/* Ultra-Modern Type Filter */}
          <div className="relative inline-flex items-center gap-0.5 p-0.5 bg-slate-100/60 rounded-lg">
            {(["ALL", "Inbound", "Outbound"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  typeFilter === f
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === "Inbound" && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    {f}
                  </span>
                )}
                {f === "Outbound" && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-violet-500" />
                    {f}
                  </span>
                )}
                {f === "ALL" && f}
              </button>
            ))}
          </div>

          {/* Runtime Filter */}
          <div className="relative inline-flex items-center gap-0.5 p-0.5 bg-slate-100/60 rounded-lg">
            {([
              { value: "ALL", label: "All runtimes" },
              { value: "standard", label: "Prompt" },
              { value: "workflow", label: "Workflow" },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setRuntimeFilter(value)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  runtimeFilter === value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {([
              { value: "date_desc", label: "Newest", icon: CalendarArrowDown },
              { value: "date_asc",  label: "Oldest", icon: CalendarArrowUp },
              { value: "alpha_asc", label: "A→Z",    icon: ArrowUpAZ },
              { value: "alpha_desc",label: "Z→A",    icon: ArrowDownAZ },
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
          <div className="md:ml-auto">
            {loading ? (
              <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
            ) : (
              <span className="text-xs text-slate-400">
                {totalFilteredAgents} {totalFilteredAgents === 1 ? "agent" : "agents"} found
              </span>
            )}
          </div>
        </div>

        {/* ── Agent Grid ───────────────────────────────────────── */}
        {loading ? (
          <CardGridSkeleton cards={9} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
        ) : filteredAgents.length === 0 ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                <Bot className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="text-slate-700 font-medium mb-1">{searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL" || runtimeFilter !== "ALL" ? "No matching agents" : "No agents yet"}</p>
                <p className="text-sm text-slate-400">
                  {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL" || runtimeFilter !== "ALL"
                    ? "Try adjusting your search or filters."
                    : "Get started by creating your first AI agent."}
                </p>
              </div>
              {!searchTerm && statusFilter === "ALL" && typeFilter === "ALL" && runtimeFilter === "ALL" && (
                <Dialog open={isAddAgentWizardOpen} onOpenChange={setIsAddAgentWizardOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={!canCreateAgent}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Create Agent
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ── Primary Agent (featured) ──────────────────────── */}
            {filteredPrimary && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-amber-500">Primary Agent</span>
                  <div className="flex-1 h-px bg-amber-100" />
                </div>

                <div className="group relative bg-gradient-to-br from-amber-50 via-white to-orange-50 border border-amber-200 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                  {/* top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400" />

                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                      {/* Avatar + meta */}
                      <div className="flex items-center gap-4 sm:flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                          {(filteredPrimary.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{filteredPrimary.name}</h3>
                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Primary</span>
                            {filteredPrimary.type === "Outbound" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-violet-700 bg-violet-50/80 rounded-md border border-violet-200/50">
                                <span className="w-1 h-1 rounded-full bg-violet-500" />
                                Outbound
                              </span>
                            )}
                            {filteredPrimary.runtime === "workflow" && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-indigo-700 bg-indigo-50 rounded-md border border-indigo-200/60">
                                Workflow
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${filteredPrimary.status === "Active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                            <span className={`text-xs font-medium ${filteredPrimary.status === "Active" ? "text-emerald-600" : "text-slate-400"}`}>
                              {filteredPrimary.status}
                            </span>
                            <span className="text-xs text-slate-300">·</span>
                            <span className="text-xs text-slate-400">#{filteredPrimary.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FileText className="w-3 h-3 text-amber-400" />
                          <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wider">Instructions</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {filteredPrimary.instructions
                            ? filteredPrimary.instructions.length > 200
                              ? filteredPrimary.instructions.slice(0, 200) + "…"
                              : filteredPrimary.instructions
                            : <span className="italic text-slate-400">No instructions set</span>}
                        </p>
                      </div>

                      {/* Right: toggle + actions */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-4 sm:flex-shrink-0">
                        <Switch
                          id={`status-toggle-${filteredPrimary.id}`}
                          checked={filteredPrimary.status === "Active"}
                          onCheckedChange={() => handleToggleAgentStatus(filteredPrimary.id)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost"
                            onClick={() => {
                              if (currentStep === "click-agent-settings-btn" && filteredPrimary.id.toString() === createdAgentId) {
                                markCheckpoint("settings")
                                nextStep()
                              }
                              router.push(`/dashboard/agent-settings/${filteredPrimary.id}`)
                            }}
                            className={`w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-white/80 rounded-lg${currentStep === "click-agent-settings-btn" && filteredPrimary.id.toString() === createdAgentId ? " tutorial-first-agent-settings" : ""}`} title="Settings">
                            <Settings className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost"
                            onClick={() => handleViewTools(filteredPrimary.id)}
                            className="w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-white/80 rounded-lg" title="View Tools">
                            <Wrench className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost"
                            onClick={() => router.push(`/dashboard/agents/${filteredPrimary.id}/configs`)}
                            className="w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-white/80 rounded-lg" title="Configs">
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost"
                            onClick={() => confirmDelete(filteredPrimary.id)}
                            className="w-8 h-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Delete Agent">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Other Agents ─────────────────────────────────── */}
            {currentAgents.length > 0 && (
              <>
                {filteredPrimary && (
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400">All Agents</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentAgents.map((agent, agentIndex) => (
                    <div
                      key={agent.id}
                      className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5"
                    >
                      <div className="p-6">
                        {/* Top row: avatar + name + status toggle */}
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {(agent.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className="text-base font-semibold text-slate-900 truncate">{agent.name}</h3>
                                {agent.type === "Outbound" && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-medium text-violet-700 bg-violet-50/80 rounded border border-violet-200/50 flex-shrink-0">
                                    <span className="w-0.5 h-0.5 rounded-full bg-violet-500" />
                                    Out
                                  </span>
                                )}
                                {agent.runtime === "workflow" && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium text-indigo-700 bg-indigo-50 rounded border border-indigo-200/60 flex-shrink-0">
                                    Workflow
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400">#{agent.id}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${agent.status === "Active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                            <Switch
                              id={`status-toggle-${agent.id}`}
                              checked={agent.status === "Active"}
                              onCheckedChange={() => handleToggleAgentStatus(agent.id)}
                              className="data-[state=checked]:bg-emerald-500 scale-90"
                            />
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="mb-5">
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center gap-1.5 mb-2">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Instructions</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {agent.instructions
                                ? agent.instructions.length > 120
                                  ? agent.instructions.slice(0, 120) + "…"
                                  : agent.instructions
                                : <span className="italic text-slate-400">No instructions set</span>}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 pt-4 border-t border-slate-100">
                          <Button size="icon" variant="ghost"
                            onClick={() => {
                              const isTutorialTarget = currentStep === "click-agent-settings-btn" &&
                                (agent.id.toString() === createdAgentId || (agentIndex === 0 && !filteredPrimary && !createdAgentId))
                              if (isTutorialTarget) {
                                markCheckpoint("settings")
                                nextStep()
                              }
                              router.push(`/dashboard/agent-settings/${agent.id}`)
                            }}
                            className={`w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg${currentStep === "click-agent-settings-btn" && agentIndex === 0 && !filteredPrimary ? " tutorial-first-agent-settings" : currentStep === "click-agent-settings-btn" && agent.id.toString() === createdAgentId ? " tutorial-first-agent-settings" : ""}`} title="Settings">
                            <Settings className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost"
                            onClick={() => handleViewTools(agent.id)}
                            className="w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg" title="View Tools">
                            <Wrench className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost"
                            onClick={() => router.push(`/dashboard/agents/${agent.id}/configs`)}
                            className="w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg" title="Configs">
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </Button>
                          <div className="flex-1" />
                          <Button size="icon" variant="ghost"
                            onClick={() => handleMakePrimaryClick(agent.id)}
                            className="w-8 h-8 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Make Primary">
                            <span className="text-sm leading-none">★</span>
                          </Button>
                          <Button size="icon" variant="ghost"
                            onClick={() => confirmDelete(agent.id)}
                            className="w-8 h-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Delete Agent">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Pagination ──────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  page === currentPage
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── View Tools Dialog ───────────────────────────────────── */}
      <Dialog open={toolsDialogOpen} onOpenChange={setToolsDialogOpen}>
        <DialogContent className="max-w-5xl rounded-2xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-2xl font-light text-slate-900">Assigned Tools</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Tools currently assigned to this agent.</DialogDescription>
          </DialogHeader>

          {loadingTools ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin" />
              </div>
            </div>
          ) : safeAssignedTools.length === 0 ? (
            <div className="text-center py-16">
              <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No tools assigned to this agent.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {safeAssignedTools.map((tool: any) => (
                <div
                  key={tool.id}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col"
                >
                  <div
                    onClick={() => setExpandedToolId(expandedToolId === tool.id ? null : tool.id)}
                    className="cursor-pointer p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-light text-slate-900 truncate flex-1">
                        {tool.name || "Unnamed Tool"}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ToolMethodBadge method={tool.method} />
                        {expandedToolId === tool.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 font-light line-clamp-2">
                      {tool.description || "No description"}
                    </p>
                  </div>

                  {expandedToolId === tool.id && (
                    <div className="px-5 pb-4">
                      <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Globe className="w-4 h-4 text-slate-500" />
                          <span className="truncate font-mono text-xs">{tool.url}</span>
                        </div>
                        <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto font-mono">
                          {jsonPretty({
                            headers: tool.headers,
                            query_template: tool.query_template,
                            body_template: tool.body_template,
                            request_parameters: tool.request_parameters ?? tool.parameters,
                            response_payload: tool.response_payload,
                            response_parameters: tool.response_parameters,
                            timeout: tool.timeout_ms,
                            speak_during_execution: tool.speak_during_execution,
                          })}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="px-5 pb-5 flex flex-wrap gap-2 mt-auto">
                    <button
                      onClick={async () => {
                        try {
                          const full = await fetchToolDetails(tool.id)
                          setViewTool(full)
                        } catch {
                          setViewTool(tool)
                        }
                      }}
                      className="flex-1 min-w-[80px] px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-1.5 text-sm font-light"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const full = await fetchToolDetails(tool.id)
                          setEditTool(full)
                          setShowEditDialog(true)
                        } catch {
                          toast({ title: "Error", description: "Could not load tool details.", variant: "destructive" })
                        }
                      }}
                      className="flex-1 min-w-[80px] px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-1.5 text-sm font-light"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => confirmDeleteTool(tool.id)}
                      className="flex-1 min-w-[80px] px-3 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-all duration-200 flex items-center justify-center gap-1.5 text-sm font-light border border-rose-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setToolsDialogOpen(false)} className="text-sm">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tool View Dialog ──────────────────────────────────────── */}
      <Dialog open={!!viewTool} onOpenChange={() => setViewTool(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900">
              Tool Preview: {viewTool?.name}
            </DialogTitle>
          </DialogHeader>
          {viewTool && (
            <div className="relative max-h-[70vh] overflow-y-auto">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jsonPretty(viewTool))
                  toast({ title: "Copied", description: "Tool JSON copied to clipboard." })
                }}
                className="absolute top-2 right-2 z-10 w-10 h-10 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-all duration-200"
              >
                <Clipboard className="h-4 w-4" />
              </button>
              <pre className="bg-slate-900 text-slate-100 p-6 rounded-xl text-sm overflow-x-auto font-mono">
                {jsonPretty(viewTool)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Tool Edit Dialog ──────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) { setShowEditDialog(false); setEditTool(null) } }}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-slate-900">Edit Tool</DialogTitle>
          </DialogHeader>
          <CustomToolsForm tool={editTool} onSuccess={handleToolEditSuccess} />
        </DialogContent>
      </Dialog>

      {/* ── Make Primary Confirmation Dialog ──────────────────── */}
      <Dialog open={primaryDialogOpen} onOpenChange={setPrimaryDialogOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-slate-900">Make Agent Primary</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">This will set the selected agent as the primary agent. The current primary will be demoted.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPrimaryDialogOpen(false)} className="text-sm">Cancel</Button>
            <Button onClick={handleMakePrimary} className="bg-slate-900 hover:bg-slate-800 text-white text-sm">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Appointment Reminder Config Dialog ───────────────────── */}
      <Dialog open={isApptReminderOpen} onOpenChange={setIsApptReminderOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-white shadow-2xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-2xl font-light text-slate-900">Appointment Reminders</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Configure HMS appointment reminder settings.</DialogDescription>
          </DialogHeader>

          {reminderLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin" />
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {/* Enabled toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-800">Enabled</p>
                  <p className="text-xs text-slate-400 mt-0.5">Turn appointment reminders on or off</p>
                </div>
                <Switch
                  checked={reminderForm.enabled}
                  onCheckedChange={(val) => setReminderForm((p) => ({ ...p, enabled: val }))}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {/* Agent Name dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Agent Name</label>
                <select
                  value={reminderForm.agent_name}
                  onChange={(e) => setReminderForm((p) => ({ ...p, agent_name: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all text-slate-800"
                >
                  <option value="">— Select outbound agent —</option>
                  {outboundAgents.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Webhook Agent Name dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Webhook Agent Name</label>
                <select
                  value={reminderForm.webhook_agent_name}
                  onChange={(e) => setReminderForm((p) => ({ ...p, webhook_agent_name: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all text-slate-800"
                >
                  <option value="">— Select outbound agent —</option>
                  {outboundAgents.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Minutes Before + Grace Minutes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Minutes Before</label>
                  <input
                    type="number"
                    min={1}
                    value={reminderForm.minutes_before}
                    onChange={(e) => setReminderForm((p) => ({ ...p, minutes_before: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Grace Minutes</label>
                  <input
                    type="number"
                    min={0}
                    value={reminderForm.grace_minutes}
                    onChange={(e) => setReminderForm((p) => ({ ...p, grace_minutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reminder Timezone</label>
                <select
                  value={reminderForm.reminder_timezone}
                  onChange={(e) => setReminderForm((p) => ({ ...p, reminder_timezone: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all text-slate-800"
                >
                  <option value="">— Select timezone —</option>
                  <optgroup label="Africa">
                    <option value="Africa/Abidjan">Africa/Abidjan</option>
                    <option value="Africa/Cairo">Africa/Cairo</option>
                    <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                    <option value="Africa/Lagos">Africa/Lagos</option>
                    <option value="Africa/Nairobi">Africa/Nairobi</option>
                  </optgroup>
                  <optgroup label="America">
                    <option value="America/Anchorage">America/Anchorage</option>
                    <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</option>
                    <option value="America/Bogota">America/Bogota</option>
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="America/Denver">America/Denver</option>
                    <option value="America/Halifax">America/Halifax</option>
                    <option value="America/Lima">America/Lima</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="America/Mexico_City">America/Mexico_City</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Phoenix">America/Phoenix</option>
                    <option value="America/Santiago">America/Santiago</option>
                    <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                    <option value="America/Toronto">America/Toronto</option>
                    <option value="America/Vancouver">America/Vancouver</option>
                  </optgroup>
                  <optgroup label="Asia">
                    <option value="Asia/Almaty">Asia/Almaty</option>
                    <option value="Asia/Baghdad">Asia/Baghdad</option>
                    <option value="Asia/Bangkok">Asia/Bangkok</option>
                    <option value="Asia/Colombo">Asia/Colombo</option>
                    <option value="Asia/Dhaka">Asia/Dhaka</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                    <option value="Asia/Hong_Kong">Asia/Hong_Kong</option>
                    <option value="Asia/Jakarta">Asia/Jakarta</option>
                    <option value="Asia/Jerusalem">Asia/Jerusalem</option>
                    <option value="Asia/Kabul">Asia/Kabul</option>
                    <option value="Asia/Karachi">Asia/Karachi</option>
                    <option value="Asia/Kathmandu">Asia/Kathmandu</option>
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur</option>
                    <option value="Asia/Kuwait">Asia/Kuwait</option>
                    <option value="Asia/Manila">Asia/Manila</option>
                    <option value="Asia/Muscat">Asia/Muscat</option>
                    <option value="Asia/Riyadh">Asia/Riyadh</option>
                    <option value="Asia/Seoul">Asia/Seoul</option>
                    <option value="Asia/Shanghai">Asia/Shanghai</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                    <option value="Asia/Taipei">Asia/Taipei</option>
                    <option value="Asia/Tashkent">Asia/Tashkent</option>
                    <option value="Asia/Tehran">Asia/Tehran</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </optgroup>
                  <optgroup label="Atlantic">
                    <option value="Atlantic/Azores">Atlantic/Azores</option>
                    <option value="Atlantic/Cape_Verde">Atlantic/Cape_Verde</option>
                  </optgroup>
                  <optgroup label="Australia">
                    <option value="Australia/Adelaide">Australia/Adelaide</option>
                    <option value="Australia/Brisbane">Australia/Brisbane</option>
                    <option value="Australia/Darwin">Australia/Darwin</option>
                    <option value="Australia/Melbourne">Australia/Melbourne</option>
                    <option value="Australia/Perth">Australia/Perth</option>
                    <option value="Australia/Sydney">Australia/Sydney</option>
                  </optgroup>
                  <optgroup label="Europe">
                    <option value="Europe/Amsterdam">Europe/Amsterdam</option>
                    <option value="Europe/Athens">Europe/Athens</option>
                    <option value="Europe/Belgrade">Europe/Belgrade</option>
                    <option value="Europe/Berlin">Europe/Berlin</option>
                    <option value="Europe/Brussels">Europe/Brussels</option>
                    <option value="Europe/Bucharest">Europe/Bucharest</option>
                    <option value="Europe/Budapest">Europe/Budapest</option>
                    <option value="Europe/Copenhagen">Europe/Copenhagen</option>
                    <option value="Europe/Dublin">Europe/Dublin</option>
                    <option value="Europe/Helsinki">Europe/Helsinki</option>
                    <option value="Europe/Istanbul">Europe/Istanbul</option>
                    <option value="Europe/Kiev">Europe/Kiev</option>
                    <option value="Europe/Lisbon">Europe/Lisbon</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Madrid">Europe/Madrid</option>
                    <option value="Europe/Moscow">Europe/Moscow</option>
                    <option value="Europe/Oslo">Europe/Oslo</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Europe/Prague">Europe/Prague</option>
                    <option value="Europe/Rome">Europe/Rome</option>
                    <option value="Europe/Stockholm">Europe/Stockholm</option>
                    <option value="Europe/Vienna">Europe/Vienna</option>
                    <option value="Europe/Warsaw">Europe/Warsaw</option>
                    <option value="Europe/Zurich">Europe/Zurich</option>
                  </optgroup>
                  <optgroup label="Pacific">
                    <option value="Pacific/Auckland">Pacific/Auckland</option>
                    <option value="Pacific/Fiji">Pacific/Fiji</option>
                    <option value="Pacific/Honolulu">Pacific/Honolulu</option>
                    <option value="Pacific/Port_Moresby">Pacific/Port_Moresby</option>
                  </optgroup>
                  <optgroup label="UTC">
                    <option value="UTC">UTC</option>
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 pt-4 gap-2">
            <button
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-light"
              onClick={() => setIsApptReminderOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all text-sm font-light disabled:opacity-60"
              onClick={handleSaveReminderConfig}
              disabled={reminderSaving || reminderLoading}
            >
              {reminderSaving ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900">Delete Agent</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              This action cannot be undone. The agent and all its configuration will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="text-sm rounded-xl flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => agentToDeleteId !== null && handleDeleteAgent(agentToDeleteId)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-xl flex-1"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


// "use client"

// import { useEffect, useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import {
//   Dialog,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog"
// import { AddAgentWizard } from "@/components/add-agent-wizard"
// import { Switch } from "@/components/ui/switch"
// import { Label } from "@/components/ui/label"
// import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// import { useToast } from "@/hooks/use-toast"
// import { Trash2, Bot, Plus, Users, Activity, FileText, Settings, Loader2 } from "lucide-react"
// import Cookies from "js-cookie"
// import { useRouter } from "next/navigation"

// interface Agent {
//   id: number
//   name: string
//   status: "Active" | "Inactive"
//   persona: string
//   primary: boolean
// }

// export default function AgentsPage() {
//   const [agents, setAgents] = useState<Agent[]>([])
//   const [loading, setLoading] = useState(true)
//   const [isAddAgentWizardOpen, setIsAddAgentWizardOpen] = useState(false)
//   const [expandedPersonas, setExpandedPersonas] = useState<Set<number>>(new Set())
//   const { toast } = useToast()
//   const router = useRouter()

//   const fetchAgents = () => {
//     setLoading(true)
//     fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Token ${Cookies.get("Token") || ""}`,
//       },
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         const enriched = Array.isArray(data)
//           ? data.map((agent) => ({
//               id: agent.id,
//               name: agent.name,
//               status: agent.status === "Active" || agent.status === "active" ? "Active" : "Inactive",
//               persona: agent.persona || "Unknown",
//               primary: agent.primary || false,
//             }))
//           : []
//         setAgents(enriched)
//       })
//       .catch(() => {
//         toast({
//           title: "Error",
//           description: "Failed to fetch agents",
//           variant: "destructive",
//         })
//       })
//       .finally(() => setLoading(false))
//   }

//   useEffect(() => {
//     fetchAgents()
//   }, [])

//   const handleToggleAgentStatus = async (id: number) => {
//     const token = Cookies.get("Token") || ""
//     const agentToUpdate = agents.find((agent) => agent.id === id)
//     if (!agentToUpdate) return

//     if (agentToUpdate.primary) {
//       toast({
//         title: "Action Not Allowed",
//         description: "You cannot deactivate the primary agent.",
//         variant: "destructive",
//       })
//       return
//     }

//     const newStatus = agentToUpdate.status === "Active" ? "Inactive" : "Active"
//     setAgents((prev) => prev.map((agent) => (agent.id === id ? { ...agent, status: newStatus } : agent)))

//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${id}/`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Token ${token}`,
//         },
//         body: JSON.stringify({ status: newStatus.toLowerCase() }),
//       })
//       if (!res.ok) throw new Error("Failed to update agent status")

//       toast({
//         title: "Agent Status Updated",
//         description: `Agent status changed to ${newStatus}.`,
//       })
//     } catch {
//       setAgents((prev) =>
//         prev.map((agent) => (agent.id === id ? { ...agent, status: agentToUpdate.status } : agent))
//       )
//       toast({
//         title: "Error",
//         description: "Failed to update agent status",
//         variant: "destructive",
//       })
//     }
//   }

//   const handleDeleteAgent = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this agent?")) return

//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${id}/`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Token ${Cookies.get("Token") || ""}`,
//         },
//       })

//       if (res.ok) {
//         setAgents((prev) => prev.filter((agent) => agent.id !== id))
//         toast({
//           title: "Agent Deleted",
//           description: "The agent has been successfully deleted.",
//           variant: "destructive",
//         })
//       } else throw new Error("Delete failed")
//     } catch {
//       toast({ title: "Error", description: "Failed to delete agent", variant: "destructive" })
//     }
//   }

//   const togglePersonaExpansion = (agentId: number) => {
//     setExpandedPersonas((prev) => {
//       const newSet = new Set(prev)
//       newSet.has(agentId) ? newSet.delete(agentId) : newSet.add(agentId)
//       return newSet
//     })
//   }

//   const truncatePersona = (persona: string, maxLength = 60) => {
//     return persona.length <= maxLength ? persona : persona.substring(0, maxLength) + "..."
//   }

//   const activeAgents = agents.filter((agent) => agent.status === "Active").length
//   const totalAgents = agents.length

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <div className="container mx-auto px-6 py-8 max-w-7xl">
//         {/* Header */}
//         <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//           <div className="space-y-2">
//             <h1 className="text-4xl font-bold text-slate-900">Agents Management</h1>
//             <p className="text-slate-600 text-lg">Manage and monitor your AI agents in one centralized dashboard</p>
//           </div>
//           <Dialog open={isAddAgentWizardOpen} onOpenChange={setIsAddAgentWizardOpen}>
//             <DialogTrigger asChild>
//               <Button
//                 size="lg"
//                 className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
//               >
//                 <Plus className="w-5 h-5 mr-2" />
//                 Create Primary Agent
//               </Button>
//             </DialogTrigger>
//             <AddAgentWizard
//               isOpen={isAddAgentWizardOpen}
//               onClose={() => setIsAddAgentWizardOpen(false)}
//               onAgentAdded={fetchAgents}
//             />
//           </Dialog>
//         </div>

//         {/* Agents Grid */}
//         <div className="space-y-6">
//           {loading ? (
//             <div className="flex justify-center items-center py-20">
//               <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
//             </div>
//           ) : agents.length === 0 ? (
//             <Card className="bg-white border-2 border-dashed border-slate-200 shadow-lg">
//               <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
//                 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
//                   <Bot className="w-10 h-10 text-slate-400" />
//                 </div>
//                 <h3 className="text-xl font-semibold text-slate-700 mb-2">No agents found</h3>
//                 <p className="text-slate-500 mb-6 max-w-md">
//                   Get started by creating your first AI agent. Click the "Create Primary Agent" button to begin.
//                 </p>
//               </CardContent>
//             </Card>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {agents.map((agent) => (
//                 <Card
//                   key={agent.id}
//                   className={`group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden min-w-[320px] ${
//                     agent.primary ? "ring-2 ring-amber-400 bg-gradient-to-br from-amber-50 to-white" : ""
//                   }`}
//                 >
//                   {agent.primary && (
//                     <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold px-3 py-1 text-center">
//                       ⭐ PRIMARY AGENT
//                     </div>
//                   )}
//                   <CardHeader className="pb-4">
//                     <div className="flex items-start justify-between">
//                       <div className="flex items-center space-x-3 flex-1 min-w-0">
//                         <Avatar className="w-12 h-12 bg-blue-500 flex-shrink-0">
//                           <AvatarFallback className="bg-blue-500 text-white font-semibold">
//                             {agent.name.charAt(0).toUpperCase()}
//                           </AvatarFallback>
//                         </Avatar>
//                         <div className="min-w-0 flex-1">
//                           <CardTitle className="text-lg font-semibold text-slate-800 group-hover:text-slate-900 truncate">
//                             {agent.name}
//                           </CardTitle>
//                           <p className="text-sm text-slate-500">AI Assistant</p>
//                         </div>
//                       </div>
//                       <div className="flex flex-row items-center space-x-2 flex-shrink-0">
//                         {/* Manage Worker Agents */}
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() => router.push(`/dashboard/agents/workers/${agent.id}/`)}
//                           className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs px-2 py-1 h-6"
//                         >
//                           Manage Worker Agents
//                         </Button>

//                         {/* Settings Button */}
//                         <Button
//                           size="icon"
//                           variant="ghost"
//                           onClick={() => router.push(`/dashboard/agent-settings`)}
//                           className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg h-6 w-6"
//                           title="Agent Settings"
//                         >
//                           <Settings className="h-3 w-3" />
//                         </Button>

//                         {/* Delete Button */}
//                         <Button
//                           size="icon"
//                           variant="ghost"
//                           onClick={() => handleDeleteAgent(agent.id)}
//                           className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg h-6 w-6"
//                           title="Delete Agent"
//                         >
//                           <Trash2 className="h-3 w-3" />
//                         </Button>
//                       </div>
//                     </div>
//                   </CardHeader>

//                   <CardContent className="pt-0 space-y-4">
//                     {/* Status Section */}
//                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
//                       <div className="flex items-center space-x-3">
//                         <div
//                           className={`w-3 h-3 rounded-full ${
//                             agent.status === "Active" ? "bg-green-500" : "bg-slate-400"
//                           }`}
//                         />
//                         <Label className="text-sm font-medium text-slate-700 cursor-pointer">
//                           {agent.status}
//                         </Label>
//                       </div>
//                       <Switch
//                         checked={agent.status === "Active"}
//                         onCheckedChange={() => handleToggleAgentStatus(agent.id)}
//                         className="data-[state=checked]:bg-green-500"
//                       />
//                     </div>

//                     {/* Agent Details */}
//                     <div className="space-y-3">
//                       <div className="flex justify-between items-center text-sm">
//                         <span className="text-slate-500">Agent ID</span>
//                         <Badge variant="outline" className="text-xs">
//                           #{agent.id}
//                         </Badge>
//                       </div>
//                       <div className="flex justify-between items-center text-sm">
//                         <span className="text-slate-500">Type</span>
//                         <span className="text-slate-700 font-medium">Conversational AI</span>
//                       </div>

//                       {/* Persona */}
//                       <div className="space-y-2">
//                         <div className="flex items-center justify-between">
//                           <span className="text-slate-500 text-sm">Persona</span>
//                           <FileText className="w-4 h-4 text-slate-400" />
//                         </div>
//                         <div className="bg-slate-50 rounded-lg p-3 border-l-4 border-blue-500">
//                           <p className="text-sm text-slate-700 leading-relaxed">
//                             {expandedPersonas.has(agent.id) ? agent.persona : truncatePersona(agent.persona)}
//                           </p>
//                           {agent.persona.length > 60 && (
//                             <button
//                               onClick={() => togglePersonaExpansion(agent.id)}
//                               className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
//                             >
//                               {expandedPersonas.has(agent.id) ? "Show less" : "Read more"}
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }
