"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Play,
  Pause,
  Upload,
  Phone,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileSpreadsheet,
  ChevronRight,
  Trash2,
  Megaphone,
  AlertCircle,
  SkipForward,
} from "lucide-react"
import Cookies from "js-cookie"

interface Campaign {
  id: number
  name: string
  agent: number
  agent_name?: string
  trunk: string
  calls_per_minute: number
  status: string
  source_filename?: string
  total_contacts: number
  pending_count: number
  completed_count: number
  failed_count: number
  skipped_count: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface Contact {
  id: number
  row_number: number
  name: string
  phone: string
  extra_data: Record<string, any>
  status: string
  action_id: string
  error_message: string
  called_at: string | null
  created_at: string
  updated_at: string
}

interface OutboundAgent {
  id: number
  name: string
  status: string
  twilio_phone_numbers: string[]
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<OutboundAgent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const { toast } = useToast()

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [trunk, setTrunk] = useState<"auto" | "freepbx" | "twilio">("auto")
  const [callsPerMinute, setCallsPerMinute] = useState(6)

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadCampaignId, setUploadCampaignId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteCampaignId, setDeleteCampaignId] = useState<number | null>(null)

  // Detail view
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsCount, setContactsCount] = useState(0)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [contactFilter, setContactFilter] = useState<string>("all")

  // Polling
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Token ${Cookies.get("Token") || ""}`,
  })

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/campaigns/campaigns/`, {
        headers: getHeaders(),
      })
      if (!res.ok) throw new Error("Failed to fetch campaigns")
      const data = await res.json()
      const list = Array.isArray(data) ? data : data?.results || []
      setCampaigns(list)
    } catch {
      toast({ title: "Error", description: "Failed to load campaigns.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
        headers: getHeaders(),
      })
      if (!res.ok) return
      const data = await res.json()
      const list = Array.isArray(data) ? data : data?.results || []
      setAgents(
        list.filter((a: any) => a.type === "Outbound")
          .map((a: any) => ({ id: a.id, name: a.name, status: a.status, twilio_phone_numbers: a.twilio_phone_numbers || [] }))
      )
    } catch {} finally {
      setLoadingAgents(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
    fetchAgents()
  }, [])

  // Poll while any campaign is running
  useEffect(() => {
    const hasRunning = campaigns.some(c => c.status === "running")
    if (hasRunning) {
      pollRef.current = setInterval(fetchCampaigns, 8000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [campaigns, fetchCampaigns])

  const handleCreate = async () => {
    if (!newName.trim() || !selectedAgent) {
      toast({ title: "Missing fields", description: "Name and agent are required.", variant: "destructive" })
      return
    }
    try {
      setCreating(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/campaigns/campaigns/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: newName.trim(),
          agent: selectedAgent,
          trunk,
          calls_per_minute: callsPerMinute,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        const msg = err?.agent?.[0] || err?.detail || err?.name?.[0] || err?.calls_per_minute?.[0] || "Could not create campaign."
        throw new Error(msg)
      }
      toast({ title: "Campaign created", description: "Now upload contacts to get started." })
      setCreateOpen(false)
      setNewName("")
      setSelectedAgent(null)
      setTrunk("auto")
      setCallsPerMinute(6)
      fetchCampaigns()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleUpload = async (file: File) => {
    if (!uploadCampaignId) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/campaigns/campaigns/${uploadCampaignId}/upload/`, {
        method: "POST",
        headers: { Authorization: `Token ${Cookies.get("Token") || ""}` },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        const msg = err?.detail || err?.error || err?.file?.[0] || "Upload failed. Check your file format."
        throw new Error(msg)
      }
      const data = await res.json()
      toast({ title: "Contacts uploaded", description: `${data.imported || 0} leads imported successfully.` })
      setUploadOpen(false)
      fetchCampaigns()
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleStart = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/campaigns/campaigns/${id}/start/`, {
        method: "POST",
        headers: getHeaders(),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.detail || err?.message || "Cannot start campaign.")
      }
      toast({ title: "Campaign started", description: "Dialing is now in progress." })
      fetchCampaigns()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handlePause = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/campaigns/campaigns/${id}/pause/`, {
        method: "POST",
        headers: getHeaders(),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.detail || err?.message || "Cannot pause campaign.")
      }
      toast({ title: "Campaign paused", description: "Dialing has been paused." })
      fetchCampaigns()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!deleteCampaignId) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/campaigns/campaigns/${deleteCampaignId}/`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      if (!res.ok && res.status !== 204) throw new Error("Delete failed")
      toast({ title: "Campaign deleted" })
      setDeleteOpen(false)
      setDeleteCampaignId(null)
      fetchCampaigns()
    } catch {
      toast({ title: "Error", description: "Could not delete campaign.", variant: "destructive" })
    }
  }

  const openDetail = async (campaign: Campaign) => {
    setDetailCampaign(campaign)
    setContactFilter("all")
    fetchContacts(campaign.id, "all")
  }

  const fetchContacts = async (campaignId: number, status: string) => {
    setLoadingContacts(true)
    try {
      const query = status !== "all" ? `?status=${status}&limit=100` : "?limit=100"
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/campaigns/campaigns/${campaignId}/contacts/${query}`, {
        headers: getHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts || (Array.isArray(data) ? data : data?.results || []))
        setContactsCount(data.count ?? (data.contacts?.length || 0))
      }
    } catch {} finally {
      setLoadingContacts(false)
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "running": case "active": return "text-emerald-700 bg-emerald-50 border-emerald-200/50"
      case "paused": return "text-amber-700 bg-amber-50 border-amber-200/50"
      case "completed": case "done": return "text-blue-700 bg-blue-50 border-blue-200/50"
      case "ready": return "text-indigo-700 bg-indigo-50 border-indigo-200/50"
      case "failed": return "text-rose-700 bg-rose-50 border-rose-200/50"
      default: return "text-slate-600 bg-slate-50 border-slate-200/50"
    }
  }

  const totalContacts = (c: Campaign) => c.total_contacts || 0
  const progress = (c: Campaign) => {
    const total = totalContacts(c)
    if (!total) return 0
    return Math.round((c.completed_count / total) * 100)
  }

  const isRunning = (c: Campaign) => c.status?.toLowerCase() === "running"
  const canStart = (c: Campaign) => ["ready", "paused"].includes(c.status?.toLowerCase())
  const canUpload = (c: Campaign) => !isRunning(c)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">

      {/* Hero */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50" />
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1 h-20 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
              <div>
                <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">Campaigns</h1>
                <p className="text-lg text-slate-500 font-light tracking-wide">Create and manage outbound calling campaigns</p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => setCreateOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 text-sm font-medium shadow-md rounded-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Campaign
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total</span>
                <Megaphone className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <p className="text-4xl font-extralight text-slate-900">{campaigns.length}</p>
            </div>
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Running</span>
                <Play className="w-4 h-4 text-emerald-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <p className="text-4xl font-extralight text-emerald-600">{campaigns.filter(c => isRunning(c)).length}</p>
            </div>
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Calls Made</span>
                <CheckCircle2 className="w-4 h-4 text-blue-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <p className="text-4xl font-extralight text-blue-600">{campaigns.reduce((sum, c) => sum + (c.completed_count || 0), 0)}</p>
            </div>
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending</span>
                <Clock className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <p className="text-4xl font-extralight text-slate-400">{campaigns.reduce((sum, c) => sum + (c.pending_count || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                <Megaphone className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="text-slate-700 font-medium mb-1">No campaigns yet</p>
                <p className="text-sm text-slate-400">Create your first outbound campaign to start dialing.</p>
              </div>
              <Button onClick={() => setCreateOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white text-sm">
                <Plus className="w-4 h-4 mr-2" /> Create Campaign
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  {/* Left: Icon + Info */}
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 transition-colors">
                    <Megaphone className="w-5 h-5 text-slate-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-slate-900 truncate">{campaign.name}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${getStatusStyle(campaign.status)}`}>
                        {campaign.status || "draft"}
                      </span>
                      {isRunning(campaign) && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {campaign.calls_per_minute} calls/min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {totalContacts(campaign)} contacts
                      </span>
                      {campaign.agent_name && <span>Agent: {campaign.agent_name}</span>}
                      {campaign.trunk && <span>Trunk: {campaign.trunk}</span>}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-36 flex-shrink-0 hidden md:block">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>{progress(campaign)}%</span>
                      <span>{campaign.completed_count}/{totalContacts(campaign)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress(campaign)}%` }}
                      />
                    </div>
                    {campaign.failed_count > 0 && (
                      <p className="text-[9px] text-rose-500 mt-1">{campaign.failed_count} failed</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {canUpload(campaign) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => { setUploadCampaignId(campaign.id); setUploadOpen(true) }}
                        className="w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                        title="Upload contacts"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {isRunning(campaign) ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePause(campaign.id)}
                        className="w-8 h-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                        title="Pause"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </Button>
                    ) : canStart(campaign) ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStart(campaign.id)}
                        className="w-8 h-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                        title="Start"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                    ) : null}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openDetail(campaign)}
                      className="w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                      title="View details"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { setDeleteCampaignId(campaign.id); setDeleteOpen(true) }}
                      className="w-8 h-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg p-0 rounded-3xl overflow-hidden border-0 shadow-2xl">
          {/* Dialog Header with accent */}
          <div className="relative bg-slate-900 px-8 pt-8 pb-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-xl font-medium text-white tracking-tight">Create Campaign</DialogTitle>
                <DialogDescription className="text-sm text-slate-400">Configure your outbound calling campaign.</DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Dialog Body */}
          <div className="px-8 py-6 space-y-6">
            {/* Campaign Name */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campaign Name</label>
              <Input
                placeholder="e.g. July appointment reminders"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-2 h-11 bg-slate-50/50 border-slate-200 rounded-xl text-sm focus:bg-white focus:border-slate-400 transition-all"
              />
            </div>

            {/* Outbound Agent */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outbound Agent</label>
              <div className="mt-2">
                {loadingAgents ? (
                  <div className="flex items-center justify-center py-6 bg-slate-50/50 rounded-xl border border-slate-200">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-400">Loading agents...</span>
                  </div>
                ) : agents.length === 0 ? (
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">No outbound agents available</p>
                      <p className="text-xs text-slate-500 mt-0.5">Create an agent with type set to &quot;Outbound&quot; first, then come back to set up your campaign.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setSelectedAgent(agent.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                          selectedAgent === agent.id
                            ? "border-slate-900 bg-slate-900 text-white shadow-md"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedAgent === agent.id ? "bg-white/15" : "bg-slate-100"
                        }`}>
                          <Phone className={`w-3.5 h-3.5 ${selectedAgent === agent.id ? "text-white" : "text-slate-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedAgent === agent.id ? "text-white" : "text-slate-800"}`}>{agent.name}</p>
                          <p className={`text-[10px] ${selectedAgent === agent.id ? "text-white/60" : "text-slate-400"}`}>
                            {agent.twilio_phone_numbers?.length || 0} phone {agent.twilio_phone_numbers?.length === 1 ? "number" : "numbers"}
                          </p>
                        </div>
                        {selectedAgent === agent.id && (
                          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Trunk + Rate row */}
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trunk</label>
                <div className="mt-2 inline-flex items-center gap-0.5 p-1 bg-slate-100 rounded-xl w-full">
                  {(["auto", "freepbx", "twilio"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTrunk(t)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 capitalize ${
                        trunk === t
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Auto picks the best route for each number.</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</label>
                <div className="mt-2 relative">
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={callsPerMinute}
                    onChange={(e) => setCallsPerMinute(Math.min(30, Math.max(1, Number(e.target.value))))}
                    className="h-10 bg-slate-50/50 border-slate-200 rounded-xl text-sm pr-16 focus:bg-white focus:border-slate-400 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">calls/min</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">~{Math.round(60 / callsPerMinute)}s gap</p>
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="px-8 pb-6 flex items-center gap-3">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1 h-11 text-sm rounded-xl border-slate-200">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newName.trim() || !selectedAgent}
              className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-xl shadow-lg shadow-slate-900/10 disabled:opacity-40 disabled:shadow-none transition-all"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-slate-900">Upload Contacts</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Upload a CSV or Excel file with your leads.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50/50 transition-all"
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
              ) : (
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mb-3" />
              )}
              <p className="text-sm text-slate-600 font-medium">{uploading ? "Uploading..." : "Click to browse"}</p>
              <p className="text-xs text-slate-400 mt-1">CSV or Excel - requires a "phone" column</p>
              <p className="text-[10px] text-slate-400 mt-2">Optional: name, plus any extra columns for agent context</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                if (e.target) e.target.value = ""
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900">Delete Campaign</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              This will permanently delete the campaign and all its contacts. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="text-sm rounded-xl flex-1">Cancel</Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-xl flex-1">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
        <DialogContent className="max-w-3xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-medium text-slate-900">{detailCampaign?.name}</DialogTitle>
              {detailCampaign && (
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${getStatusStyle(detailCampaign.status)}`}>
                  {detailCampaign.status}
                </span>
              )}
            </div>
            <DialogDescription className="text-sm text-slate-500">
              {detailCampaign?.agent_name && `Agent: ${detailCampaign.agent_name}`}
              {detailCampaign?.trunk && ` • Trunk: ${detailCampaign.trunk}`}
              {detailCampaign?.calls_per_minute && ` • ${detailCampaign.calls_per_minute} calls/min`}
            </DialogDescription>
          </DialogHeader>
          {detailCampaign && (
            <div className="space-y-6 py-2">
              {/* Progress stats */}
              <div className="grid grid-cols-5 gap-2">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-light text-slate-700">{detailCampaign.total_contacts}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Total</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-light text-slate-700">{detailCampaign.pending_count}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pending</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-light text-emerald-700">{detailCampaign.completed_count}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Done</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-light text-rose-700">{detailCampaign.failed_count}</p>
                  <p className="text-[10px] text-rose-600 mt-0.5">Failed</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-light text-amber-700">{detailCampaign.skipped_count || 0}</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">Skipped</p>
                </div>
              </div>

              {/* Contact filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 mr-1">Filter:</span>
                {(["all", "pending", "completed", "failed", "skipped"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setContactFilter(s); fetchContacts(detailCampaign.id, s) }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      contactFilter === s
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Contacts table */}
              {loadingContacts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : contacts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No contacts found.</p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-slate-500 uppercase">#</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-slate-500 uppercase">Name</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-slate-500 uppercase">Phone</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-slate-500 uppercase">Status</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-slate-500 uppercase">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contacts.slice(0, 100).map((contact) => (
                        <tr key={contact.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 text-slate-400 text-xs">{contact.row_number}</td>
                          <td className="px-4 py-2.5 text-slate-700">{contact.name || "-"}</td>
                          <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{contact.phone}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${getStatusStyle(contact.status)}`}>
                              {contact.status || "pending"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-rose-500 max-w-[200px] truncate">{contact.error_message || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
