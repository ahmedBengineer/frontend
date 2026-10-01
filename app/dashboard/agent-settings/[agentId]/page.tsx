"use client"

import type React from "react"

import { use, useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Square, ChevronUp, Copy, History, WrapText, Plus, Upload, FileText, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"
import { UploadCloud, Loader2 } from "lucide-react"
import CustomToolsForm from "@/components/CustomToolsForm"
import { WorkflowTestPanel } from "@/components/workflow-test/WorkflowTestPanel"
import { DialogTrigger } from "@/components/ui/dialog"
import { Settings, User, MessageSquare, Target, Lock } from 'lucide-react'
import { useProtectedFetch } from '@/hooks/useProtectedFetch'
import PasswordPrompt from "@/components/password-prompt"
import { useRouter, useSearchParams } from 'next/navigation';


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

import { Phone, Wrench, Check, X, Minus, Circle, Zap, ChevronLeft, ChevronRight } from "lucide-react"

const DEFAULT_TOOLS = ["send_sms", "send_email", "end_call", "transfer_call"] as const
type DefaultTool = typeof DEFAULT_TOOLS[number]

function ToolsTab({ agentId }: { agentId: string }) {
  const { toast } = useToast()
  const passwordVerified = useRef(false)
  const { protectedFetch } = useProtectedFetch((pathKey) => {
    passwordVerified.current = false
    setPasswordDialogOpen(true)
    return new Promise((resolve) => {
      // The PasswordPrompt component will verify and set passwordVerified.current = true
    })
  })
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  // Watch for password verification from the PasswordPrompt component
  useEffect(() => {
    if (passwordVerified.current) {
      setPasswordDialogOpen(false)
      passwordVerified.current = false
    }
  }, [passwordVerified.current])
  const [companyNumbers, setCompanyNumbers] = useState<string[]>([])
  const [assignedNumbers, setAssignedNumbers] = useState<string[]>([])
  const [originalNumbers, setOriginalNumbers] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [assignedTools, setAssignedTools] = useState<any[]>([])
  const [usedNumbers, setUsedNumbers] = useState<string[]>([])
  const [loadingNumbers, setLoadingNumbers] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState<{ [key: string]: boolean }>({})

  // Default Tools state (committed / displayed on page)
  const [showDefaultToolsDialog, setShowDefaultToolsDialog] = useState(false)
  const [includeDefaultTools, setIncludeDefaultTools] = useState(false)
  const [selectedDefaultTools, setSelectedDefaultTools] = useState<string[]>([])
  const [updatingDefaultTools, setUpdatingDefaultTools] = useState(false)

  // Draft state — only applied when "Save Changes" is clicked
  const [draftIncludeDefaultTools, setDraftIncludeDefaultTools] = useState(false)
  const [draftSelectedDefaultTools, setDraftSelectedDefaultTools] = useState<string[]>([])

  // Startup Tool Calls state
  const [startupToolCalls, setStartupToolCalls] = useState<Record<string, Record<string, string>>>({})
  const [showStartupToolsDialog, setShowStartupToolsDialog] = useState(false)
  const [startupStep, setStartupStep] = useState<"list" | "form">("list")
  const [allCustomTools, setAllCustomTools] = useState<any[]>([])
  const [loadingCustomTools, setLoadingCustomTools] = useState(false)
  const [selectedStartupTool, setSelectedStartupTool] = useState<any | null>(null)
  const [startupFormValues, setStartupFormValues] = useState<Record<string, string>>({})
  const [savingStartupTools, setSavingStartupTools] = useState(false)
  const [removingStartupTool, setRemovingStartupTool] = useState<string | null>(null)
  const [startupSearch, setStartupSearch] = useState("")
  const [startupMethodFilter, setStartupMethodFilter] = useState<string>("all")
  // Tools List Component
  // ===========================
  function ToolsList() {
    const [tools, setTools] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      const fetchTools = async () => {
        try {
          setLoading(true)
          const token = Cookies.get("Token") || ""
          let allResults: any[] = []
          let nextUrl: string | null = `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/`
          
          while (nextUrl) {
            const res = await fetch(nextUrl, {
              headers: { Authorization: `Token ${token}` },
            })
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            
            const results = Array.isArray(data) ? data : (data?.results ?? [])
            allResults = allResults.concat(results)
            
            nextUrl = data?.next ?? null
          }
          
          setTools(allResults)
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

        const res = await protectedFetch(
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
        if (error.message.includes("Protected action cancelled")) return
        toast({
          title: "Error",
          description: error.message || "Failed to update tools.",
          variant: "destructive",
        })
      }
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
          <p className="text-slate-500 font-light">Loading tools...</p>
        </div>
      )
    }

    if (tools.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-light">No tools available</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const isAssigned = assignedTools.some((t) => t.id === tool.id)
          return (
            <Card
              key={tool.id}
              className={`group relative bg-white border transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden ${
                isAssigned ? "border-slate-900 shadow-md" : "border-slate-200"
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-light text-slate-900 truncate pr-2">
                    {tool.name}
                  </span>
                  {isAssigned && (
                    <div className="flex-shrink-0 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 text-sm font-light leading-relaxed line-clamp-2">
                  {tool.description || "No description"}
                </p>
                <Button
                  variant={isAssigned ? "outline" : "default"}
                  className={`w-full rounded-xl transition-all duration-200 ${
                    isAssigned
                      ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                  onClick={() => toggleTool(tool, isAssigned)}
                >
                  {isAssigned ? (
                    <span className="flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      Unassign
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Assign
                    </span>
                  )}
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
      setLoadingNumbers(true)

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

      setIncludeDefaultTools(agentData.include_default_tools ?? false)
      setSelectedDefaultTools(agentData.default_tool_names ?? [])

      if (agentData.startup_tool_calls && typeof agentData.startup_tool_calls === "object") {
        setStartupToolCalls(agentData.startup_tool_calls)
      } else {
        setStartupToolCalls({})
      }

      setDirty(false)
    } catch {
      toast({
        description: "Error fetching Twilio/Tools data.",
        variant: "destructive",
      })
    } finally {
      setLoadingNumbers(false)
    }
  }

  useEffect(() => {
    fetchAgentAndCompany()
  }, [agentId])

  const toggleNumber = async (num: string, isAssignedToThisAgent: boolean) => {
    setLoadingAssignments((prev) => ({ ...prev, [num]: true }))

    try {
      const updated = isAssignedToThisAgent
        ? assignedNumbers.filter((n) => n !== num)
        : [...assignedNumbers, num]

      setAssignedNumbers(updated)

      const res = await protectedFetch(
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
      if (error.message.includes("Protected action cancelled")) return
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
      const res = await protectedFetch(
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
      if (error.message.includes("Protected action cancelled")) return
      toast({
        title: "Error",
        description: error.message || "Failed to update numbers.",
        variant: "destructive",
      })
    }
  }

  const toggleDefaultTool = (tool: string) => {
    setDraftSelectedDefaultTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    )
  }

  const handleSaveDefaultTools = async () => {
    setUpdatingDefaultTools(true)
    try {
      const res = await protectedFetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
          body: JSON.stringify({
            include_default_tools: draftIncludeDefaultTools,
            default_tool_names: draftIncludeDefaultTools ? draftSelectedDefaultTools : [],
            tool_scope: draftIncludeDefaultTools ? "default_worker" : "standard",
          }),
        }
      )
      if (!res.ok) throw new Error("Failed to update default tools")
      // Commit draft to the displayed state only on success
      setIncludeDefaultTools(draftIncludeDefaultTools)
      setSelectedDefaultTools(draftIncludeDefaultTools ? draftSelectedDefaultTools : [])
      toast({ title: "Default Tools Updated", description: "Agent default tools have been saved." })
      setShowDefaultToolsDialog(false)
    } catch (error: any) {
      if (error.message.includes("Protected action cancelled")) return
      toast({
        title: "Error",
        description: error.message || "Failed to update default tools.",
        variant: "destructive",
      })
    } finally {
      setUpdatingDefaultTools(false)
    }
  }

  // ===========================
  // Startup Tools Handlers
  // ===========================
  const openStartupToolsDialog = async () => {
    setStartupStep("list")
    setSelectedStartupTool(null)
    setStartupFormValues({})
    setStartupSearch("")
    setStartupMethodFilter("all")
    setShowStartupToolsDialog(true)
    if (allCustomTools.length > 0) return
    setLoadingCustomTools(true)
    try {
      const token = Cookies.get("Token") || ""
      let allResults: any[] = []
      let nextUrl: string | null = `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/`
      
      while (nextUrl) {
        const res = await fetch(nextUrl, {
          headers: { Authorization: `Token ${token}` },
        })
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        
        const results = Array.isArray(data) ? data : (data?.results ?? [])
        allResults = allResults.concat(results)
        
        nextUrl = data?.next ?? null
      }
      
      setAllCustomTools(allResults)
    } catch {
      toast({ description: "Failed to load tools.", variant: "destructive" })
    } finally {
      setLoadingCustomTools(false)
    }
  }

  const selectStartupTool = (tool: any) => {
    setSelectedStartupTool(tool)
    const bodyKeys = Object.keys(tool.body_template ?? {})
    const existing = startupToolCalls[tool.name] ?? {}
    const prefilled: Record<string, string> = {}
    bodyKeys.forEach((k) => { prefilled[k] = existing[k] ?? "" })
    setStartupFormValues(prefilled)
    setStartupStep("form")
  }

  const handleSaveStartupTool = async () => {
    if (!selectedStartupTool) return
    setSavingStartupTools(true)
    try {
      const updated = {
        ...startupToolCalls,
        [selectedStartupTool.name]: startupFormValues,
      }
      const res = await protectedFetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
          body: JSON.stringify({ startup_tool_calls: updated }),
        }
      )
      if (!res.ok) throw new Error("Failed to save")
      setStartupToolCalls(updated)
      toast({ title: "Startup Tool Saved", description: `"${selectedStartupTool.name}" added to startup calls.` })
      setShowStartupToolsDialog(false)
      setSelectedStartupTool(null)
      setStartupFormValues({})
      setStartupStep("list")
    } catch (error: any) {
      if (error.message.includes("Protected action cancelled")) return
      toast({ title: "Error", description: error.message || "Failed to save startup tool.", variant: "destructive" })
    } finally {
      setSavingStartupTools(false)
    }
  }

  const handleRemoveStartupTool = async (toolName: string) => {
    setRemovingStartupTool(toolName)
    try {
      const updated = { ...startupToolCalls }
      delete updated[toolName]
      const res = await protectedFetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
          body: JSON.stringify({ startup_tool_calls: updated }),
        }
      )
      if (!res.ok) throw new Error("Failed to remove")
      setStartupToolCalls(updated)
      toast({ title: "Removed", description: `"${toolName}" removed from startup calls.` })
    } catch (error: any) {
      if (error.message.includes("Protected action cancelled")) return
      toast({ title: "Error", description: error.message || "Failed to remove startup tool.", variant: "destructive" })
    } finally {
      setRemovingStartupTool(null)
    }
  }

  // ===========================
  // Render
  // ===========================
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-16 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-1 h-20 bg-gradient-to-b from-slate-900 to-slate-400 rounded-full" />
            <div className="space-y-3">
              <h1 className="text-5xl font-extralight tracking-tight text-slate-900">
                Tools & Numbers
              </h1>
              <p className="text-lg text-slate-500 font-light tracking-wide">
                Manage Twilio numbers and custom tools for your agent
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 pl-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-slate-900">
                  {loadingNumbers ? (
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  ) : (
                    assignedNumbers.length
                  )}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Assigned Numbers
                </p>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-slate-900">
                  {loadingNumbers ? (
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  ) : (
                    assignedTools.length
                  )}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Active Tools
                </p>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                includeDefaultTools ? "bg-violet-100" : "bg-slate-100"
              }`}>
                <CheckCircle2 className={`w-6 h-6 ${
                  includeDefaultTools ? "text-violet-600" : "text-slate-400"
                }`} />
              </div>
              <div>
                <p className={`text-2xl font-light ${
                  includeDefaultTools ? "text-violet-700" : "text-slate-400"
                }`}>
                  {loadingNumbers ? (
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  ) : includeDefaultTools ? (
                    selectedDefaultTools.length
                  ) : (
                    "Off"
                  )}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Default Tools
                </p>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                Object.keys(startupToolCalls).length > 0 ? "bg-emerald-100" : "bg-slate-100"
              }`}>
                <Zap className={`w-6 h-6 ${
                  Object.keys(startupToolCalls).length > 0 ? "text-emerald-600" : "text-slate-400"
                }`} />
              </div>
              <div>
                <p className={`text-2xl font-light ${
                  Object.keys(startupToolCalls).length > 0 ? "text-emerald-700" : "text-slate-400"
                }`}>
                  {loadingNumbers ? (
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  ) : (
                    Object.keys(startupToolCalls).length
                  )}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Startup Tools
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Startup Tools Banner */}
        {!loadingNumbers && (
          <div className="mb-6">
            <button
              type="button"
              onClick={openStartupToolsDialog}
              className={`w-full group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 text-left ${
                Object.keys(startupToolCalls).length > 0
                  ? "border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 hover:from-emerald-100 hover:to-emerald-100 shadow-md hover:shadow-lg"
                  : "border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
              }`}
            >
              <div className="flex items-center justify-between px-8 py-5">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                    Object.keys(startupToolCalls).length > 0 ? "bg-emerald-600 shadow-lg shadow-emerald-200" : "bg-white border-2 border-slate-200"
                  }`}>
                    <Zap className={`w-7 h-7 ${
                      Object.keys(startupToolCalls).length > 0 ? "text-white" : "text-slate-400"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`text-lg font-semibold tracking-tight ${
                        Object.keys(startupToolCalls).length > 0 ? "text-emerald-900" : "text-slate-700"
                      }`}>
                        Startup Tool Calls
                      </h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        Object.keys(startupToolCalls).length > 0
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}>
                        {Object.keys(startupToolCalls).length > 0
                          ? `${Object.keys(startupToolCalls).length} CONFIGURED`
                          : "NONE"}
                      </span>
                    </div>
                    {Object.keys(startupToolCalls).length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {Object.keys(startupToolCalls).map((name) => (
                          <span key={name} className="text-xs font-mono px-2.5 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-lg shadow-sm">
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-light text-slate-500">
                        Click to configure tools that run automatically at conversation start
                      </p>
                    )}
                  </div>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium pr-1 ${
                  Object.keys(startupToolCalls).length > 0 ? "text-emerald-600" : "text-slate-400"
                } group-hover:translate-x-1 transition-transform duration-200`}>
                  {Object.keys(startupToolCalls).length > 0 ? "Manage" : "Configure"}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              {Object.keys(startupToolCalls).length > 0 && (
                <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 rounded-l-2xl" />
              )}
            </button>

            {/* Configured startup tools — inline chips with remove */}
            {Object.keys(startupToolCalls).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 pl-1">
                {Object.entries(startupToolCalls).map(([name, values]) => (
                  <div
                    key={name}
                    className="flex items-center gap-0 bg-white border border-emerald-200 rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* info side */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Zap className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs font-mono text-emerald-800">{name}</span>
                      <span className="text-[10px] text-slate-400 font-light">
                        {Object.keys(values).length} field{Object.keys(values).length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {/* remove side — full-height tap target */}
                    <button
                      type="button"
                      onClick={() => handleRemoveStartupTool(name)}
                      disabled={removingStartupTool === name}
                      className="flex items-center justify-center px-2.5 py-2 bg-slate-50 hover:bg-rose-50 border-l border-emerald-200 text-slate-400 hover:text-rose-500 transition-colors duration-150 disabled:opacity-50 h-full self-stretch"
                      title="Remove"
                    >
                      {removingStartupTool === name ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Default Tools Banner */}
        {!loadingNumbers && (
          <button
            type="button"
            onClick={() => {
              setDraftIncludeDefaultTools(includeDefaultTools)
              setDraftSelectedDefaultTools([...selectedDefaultTools])
              setShowDefaultToolsDialog(true)
            }}
            className={`w-full mb-10 group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 text-left ${
              includeDefaultTools
                ? "border-violet-300 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 hover:from-violet-100 hover:to-violet-100 shadow-md hover:shadow-lg"
                : "border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center justify-between px-8 py-5">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                  includeDefaultTools ? "bg-violet-600 shadow-lg shadow-violet-200" : "bg-white border-2 border-slate-200"
                }`}>
                  <CheckCircle2 className={`w-7 h-7 ${
                    includeDefaultTools ? "text-white" : "text-slate-400"
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`text-lg font-semibold tracking-tight ${
                      includeDefaultTools ? "text-violet-900" : "text-slate-700"
                    }`}>
                      Default Tools
                    </h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      includeDefaultTools
                        ? "bg-violet-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}>
                      {includeDefaultTools ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>
                  {includeDefaultTools && selectedDefaultTools.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedDefaultTools.map((t) => (
                        <span key={t} className="text-xs font-mono px-2.5 py-1 bg-white border border-violet-200 text-violet-700 rounded-lg shadow-sm">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm font-light ${
                      includeDefaultTools ? "text-violet-600" : "text-slate-500"
                    }`}>
                      {includeDefaultTools
                        ? "No tools selected — click to configure"
                        : "Click to enable built-in tools for this agent"}
                    </p>
                  )}
                </div>
              </div>
              <div className={`flex items-center gap-2 text-sm font-medium pr-1 ${
                includeDefaultTools ? "text-violet-600" : "text-slate-400"
              } group-hover:translate-x-1 transition-transform duration-200`}>
                Configure
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
            {includeDefaultTools && (
              <div className="absolute inset-y-0 left-0 w-1 bg-violet-500 rounded-l-2xl" />
            )}
          </button>
        )}

        {/* Content */}
        {loadingNumbers ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
            </div>
            <p className="text-slate-500 font-light">Loading resources...</p>
          </div>
        ) : companyNumbers.length > 0 ? (
          <div className="space-y-12">
            {/* Numbers Grid */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-slate-600" />
                </div>
                <h2 className="text-2xl font-light text-slate-900">Phone Numbers</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companyNumbers.map((num) => {
                  const isAssignedToThisAgent = assignedNumbers.includes(num)
                  const isUsedElsewhere = usedNumbers.includes(num) && !isAssignedToThisAgent

                  return (
                    <Card
                      key={num}
                      className={`group relative bg-white border transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden ${
                        isAssignedToThisAgent
                          ? "border-slate-900 shadow-md"
                          : isUsedElsewhere
                          ? "border-slate-300 opacity-60"
                          : "border-slate-200"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-lg font-mono font-light text-slate-900">
                            {num}
                          </span>
                          {isAssignedToThisAgent && (
                            <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          {isUsedElsewhere && (
                            <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center">
                              <X className="w-4 h-4 text-slate-600" />
                            </div>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-slate-600 text-sm font-light">
                          {isAssignedToThisAgent
                            ? "Currently linked to this agent"
                            : isUsedElsewhere
                            ? "Already assigned to another agent"
                            : "Available for assignment"}
                        </p>
                        <Button
                          disabled={isUsedElsewhere || loadingAssignments[num]}
                          variant={isAssignedToThisAgent ? "outline" : "default"}
                          className={`w-full rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                            isAssignedToThisAgent
                              ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                              : isUsedElsewhere
                              ? "bg-slate-300 text-slate-600"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                          onClick={() => toggleNumber(num, isAssignedToThisAgent)}
                        >
                          {loadingAssignments[num] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isAssignedToThisAgent ? (
                            <span className="flex items-center gap-2">
                              <Minus className="w-4 h-4" />
                              Unassign
                            </span>
                          ) : isUsedElsewhere ? (
                            "Unavailable"
                          ) : (
                            <span className="flex items-center gap-2">
                              <Plus className="w-4 h-4" />
                              Assign
                            </span>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Custom Tools Button */}
            <div className="flex justify-center pt-8">
              <Button
                onClick={() => setShowDialog(true)}
                className="group px-8 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
                  <span className="font-light tracking-wide">Manage Custom Tools</span>
                </div>
              </Button>
            </div>

            {/* Save Button */}
            {dirty && (
              <div className="flex justify-end pt-8">
                <Button
                  onClick={handleSave}
                  className="px-10 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span className="font-light tracking-wide">Save Changes</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
              <Phone className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-500 font-light">No Twilio numbers available for this company</p>
          </div>
        )}

        {/* Bottom Divider */}
        <div className="mt-24 pt-12 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* ── Startup Tools Dialog ── */}
      <Dialog
        open={showStartupToolsDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowStartupToolsDialog(false)
            setStartupStep("list")
            setSelectedStartupTool(null)
            setStartupFormValues({})
            setStartupSearch("")
            setStartupMethodFilter("all")
          }
        }}
      >
        <DialogContent className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col" style={{ maxHeight: '78vh' }}>

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 px-7 py-5 flex items-center gap-4 shrink-0">
            {startupStep === "form" && (
              <button
                type="button"
                onClick={() => { setStartupStep("list"); setSelectedStartupTool(null); setStartupFormValues({}) }}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
            )}
            <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-white tracking-tight leading-none">
                {startupStep === "list" ? "Startup Tool Calls" : selectedStartupTool?.name}
              </DialogTitle>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                {startupStep === "list"
                  ? "Tools executed automatically at conversation start"
                  : "Configure parameter values for this tool"}
              </p>
            </div>
            {/* breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-light shrink-0">
              <span className={`px-2.5 py-1 rounded-lg transition-colors ${startupStep === "list" ? "bg-white/15 text-white" : "text-slate-500"}`}>
                1 · Select
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className={`px-2.5 py-1 rounded-lg transition-colors ${startupStep === "form" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-500"}`}>
                2 · Configure
              </span>
            </div>
          </div>

          {/* ── Step 1: Tool List ── */}
          {startupStep === "list" && (() => {
            const methods = ["all", ...Array.from(new Set(allCustomTools.map(t => t.method).filter(Boolean)))]
            const filtered = allCustomTools.filter(t => {
              const matchSearch = !startupSearch.trim() ||
                t.name.toLowerCase().includes(startupSearch.toLowerCase()) ||
                (t.description ?? "").toLowerCase().includes(startupSearch.toLowerCase())
              const matchMethod = startupMethodFilter === "all" || t.method === startupMethodFilter
              return matchSearch && matchMethod
            })
            return (
              <div className="flex flex-col min-h-0 flex-1">

                {/* Search + filter bar */}
                <div className="px-6 pt-4 pb-3 border-b border-slate-100 space-y-3 shrink-0">
                  {/* Search */}
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <Input
                      value={startupSearch}
                      onChange={e => setStartupSearch(e.target.value)}
                      placeholder="Search tools by name or description…"
                      className="pl-10 h-9 rounded-xl border-slate-200 text-sm focus:border-emerald-400 focus:ring-emerald-400/20"
                    />
                    {startupSearch && (
                      <button type="button" onClick={() => setStartupSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {/* Method filter pills */}
                  {methods.length > 2 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {methods.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setStartupMethodFilter(m)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all duration-150 ${
                            startupMethodFilter === m
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                          }`}
                        >
                          {m === "all" ? "All methods" : m}
                        </button>
                      ))}
                      {/* configured quick filter */}
                      <button
                        type="button"
                        onClick={() => setStartupMethodFilter(startupMethodFilter === "__configured" ? "all" : "__configured")}
                        className={`ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all duration-150 flex items-center gap-1 ${
                          startupMethodFilter === "__configured"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        Configured only
                      </button>
                    </div>
                  )}
                  {/* result count */}
                  <p className="text-[11px] text-slate-400 font-light">
                    {filtered.length} of {allCustomTools.length} tool{allCustomTools.length !== 1 ? "s" : ""}
                    {startupSearch ? ` matching "${startupSearch}"` : ""}
                  </p>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-4 space-y-1.5">
                  {loadingCustomTools ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="relative w-9 h-9">
                        <div className="absolute inset-0 border-2 border-slate-100 rounded-full" />
                        <div className="absolute inset-0 border-2 border-emerald-500 rounded-full border-t-transparent animate-spin" />
                      </div>
                    </div>
                  ) : allCustomTools.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-400 font-light">No custom tools available</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      </div>
                      <p className="text-sm text-slate-400 font-light">No tools match your search</p>
                      <button type="button" onClick={() => { setStartupSearch(""); setStartupMethodFilter("all") }} className="text-xs text-emerald-600 hover:underline">Clear filters</button>
                    </div>
                  ) : (
                    filtered.map((tool) => {
                      const isConfigured = Object.prototype.hasOwnProperty.call(startupToolCalls, tool.name)
                      const bodyKeys = Object.keys(tool.body_template ?? {})
                      const methodColor =
                        tool.method === "POST"  ? "bg-blue-50 text-blue-600 border-blue-200" :
                        tool.method === "GET"   ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        tool.method === "PUT" || tool.method === "PATCH" ? "bg-amber-50 text-amber-600 border-amber-200" :
                        tool.method === "DELETE" ? "bg-rose-50 text-rose-600 border-rose-200" :
                        "bg-slate-100 text-slate-500 border-slate-200"
                      return (
                        <div
                          key={tool.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => selectStartupTool(tool)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectStartupTool(tool) }}
                          className={`group/tool w-full text-left rounded-2xl border px-4 py-3.5 transition-all duration-150 cursor-pointer ${
                            isConfigured
                              ? "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300 hover:bg-emerald-50"
                              : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Method badge */}
                            <span className={`shrink-0 text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg border ${methodColor}`}>
                              {tool.method}
                            </span>

                            {/* Name + description */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold truncate ${isConfigured ? "text-emerald-800" : "text-slate-800"}`}>
                                  {tool.name}
                                </span>
                                {isConfigured && (
                                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                    <Zap className="w-2.5 h-2.5" />
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-light truncate mt-0.5">
                                {tool.description || "No description"}
                              </p>
                            </div>

                            {/* Param count */}
                            {bodyKeys.length > 0 && (
                              <span className="shrink-0 text-[10px] text-slate-400 font-light bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
                                {bodyKeys.length} param{bodyKeys.length !== 1 ? "s" : ""}
                              </span>
                            )}

                            {/* Actions */}
                            <div className="shrink-0 flex items-center gap-1.5 opacity-0 group-hover/tool:opacity-100 transition-opacity duration-150">
                              {isConfigured && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleRemoveStartupTool(tool.name) }}
                                  disabled={removingStartupTool === tool.name}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors disabled:opacity-50"
                                  title="Remove from startup calls"
                                >
                                  {removingStartupTool === tool.name
                                    ? <Loader2 className="w-3 h-3 text-rose-500 animate-spin" />
                                    : <X className="w-3 h-3 text-rose-500" />}
                                </button>
                              )}
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isConfigured ? "bg-emerald-100" : "bg-slate-100"}`}>
                                {isConfigured
                                  ? <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                  : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-slate-100 px-6 py-3.5 flex items-center justify-between bg-slate-50/60">
                  <p className="text-xs text-slate-400 font-light">
                    {Object.keys(startupToolCalls).length > 0
                      ? `${Object.keys(startupToolCalls).length} tool${Object.keys(startupToolCalls).length !== 1 ? "s" : ""} configured`
                      : "No tools configured yet"}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowStartupToolsDialog(false)}
                    className="px-5 h-8 text-sm border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )
          })()}

          {/* ── Step 2: Form ── */}
          {startupStep === "form" && selectedStartupTool && (
            <div className="flex flex-col min-h-0 flex-1">

              {/* Fields — scrollable */}
              <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">
                {/* Tool meta card */}
                <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200/60 space-y-2">
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    {selectedStartupTool.description || "No description"}
                  </p>
                  <div className="flex items-start gap-2">
                    <span className={`shrink-0 text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg border ${
                      selectedStartupTool.method === "POST" ? "bg-blue-50 text-blue-600 border-blue-200" :
                      selectedStartupTool.method === "GET"  ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      "bg-amber-50 text-amber-600 border-amber-200"
                    }`}>
                      {selectedStartupTool.method}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 break-all leading-relaxed">{selectedStartupTool.url}</span>
                  </div>
                </div>

                {Object.keys(selectedStartupTool.body_template ?? {}).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                      <Check className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-sm text-slate-500 font-light">This tool has no input parameters.</p>
                    <p className="text-xs text-slate-400 font-light">It will be called as-is at conversation start.</p>
                  </div>
                ) : (
                  Object.entries(selectedStartupTool.body_template ?? {}).map(([key]) => {
                    const reqParams = selectedStartupTool.request_parameters ?? selectedStartupTool.parameters ?? {}
                    const paramMeta = reqParams[key] ?? {}
                    const isRequired = paramMeta.required !== false
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono font-semibold text-slate-700">{key}</span>
                          {isRequired ? (
                            <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">required</span>
                          ) : (
                            <span className="text-[10px] font-light text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">optional</span>
                          )}
                          {paramMeta.type && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{paramMeta.type}</span>
                          )}
                        </div>
                        <Input
                          value={startupFormValues[key] ?? ""}
                          onChange={(e) => setStartupFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder={`Enter ${key}…`}
                          className="rounded-xl border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 font-mono text-sm h-10"
                        />
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-slate-100 px-7 py-4 flex items-center justify-between gap-3 bg-white">
                <button
                  type="button"
                  onClick={() => { setStartupStep("list"); setSelectedStartupTool(null); setStartupFormValues({}) }}
                  className="flex items-center gap-1.5 text-sm font-light text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowStartupToolsDialog(false)}
                    disabled={savingStartupTools}
                    className="px-5 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveStartupTool}
                    disabled={savingStartupTools}
                    className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50"
                  >
                    {savingStartupTools ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Save Startup Call
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Default Tools Dialog */}
      <Dialog open={showDefaultToolsDialog} onOpenChange={(open) => {
        if (open) {
          // Initialize draft from committed state when opening
          setDraftIncludeDefaultTools(includeDefaultTools)
          setDraftSelectedDefaultTools([...selectedDefaultTools])
        }
        setShowDefaultToolsDialog(open)
      }}>
        <DialogContent className="max-w-lg bg-white rounded-3xl shadow-2xl border-0 p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-extralight text-white tracking-tight">
                  Default Tools
                </DialogTitle>
                <p className="text-sm text-slate-300 font-light mt-0.5">
                  Configure built-in tools for this agent
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
              draftIncludeDefaultTools
                ? "border-violet-200 bg-violet-50"
                : "border-slate-200 bg-white"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                  draftIncludeDefaultTools ? "bg-violet-100" : "bg-slate-100"
                }`}>
                  <Wrench className={`w-5 h-5 transition-colors duration-200 ${
                    draftIncludeDefaultTools ? "text-violet-600" : "text-slate-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Include default tools</p>
                  <p className="text-xs text-slate-500 font-light">Grant this agent access to built-in tools</p>
                </div>
              </div>
              <Switch
                checked={draftIncludeDefaultTools}
                onCheckedChange={(v) => {
                  setDraftIncludeDefaultTools(v)
                  if (!v) setDraftSelectedDefaultTools([])
                }}
                className="data-[state=checked]:bg-violet-600"
              />
            </div>

            {/* Tool chips */}
            {draftIncludeDefaultTools && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Select tools
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_TOOLS.map((tool) => {
                    const isSelected = draftSelectedDefaultTools.includes(tool)
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleDefaultTool(tool)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                          isSelected
                            ? "border-violet-500 bg-violet-50"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-violet-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        )}
                        <span className={`text-sm font-mono ${
                          isSelected ? "text-violet-700 font-medium" : "text-slate-600"
                        }`}>
                          {tool}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {draftSelectedDefaultTools.length === 0 && (
                  <p className="text-xs text-amber-600 font-light px-1">
                    Select at least one tool, or disable the toggle.
                  </p>
                )}
              </div>
            )}

            {/* Current status (read-only preview when disabled) */}
            {!draftIncludeDefaultTools && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <Circle className="w-5 h-5 text-slate-400" />
                <p className="text-sm text-slate-500 font-light">
                  No default tools are enabled for this agent.
                </p>
              </div>
            )}
          </div>

          <div className="px-8 pb-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDefaultToolsDialog(false)}
              disabled={updatingDefaultTools}
              className="px-6 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDefaultTools}
              disabled={updatingDefaultTools || (draftIncludeDefaultTools && draftSelectedDefaultTools.length === 0)}
              className="px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-xl disabled:opacity-50"
            >
              {updatingDefaultTools ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tools Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl border-0 p-0">
          <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-slate-100">
            <DialogHeader className="px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-extralight text-slate-900 tracking-tight">
                    Custom Tools
                  </DialogTitle>
                  <p className="text-sm text-slate-500 font-light mt-1">
                    Assign tools to enhance agent capabilities
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            <ToolsList />
          </div>

          <div className="flex-shrink-0 bg-gradient-to-t from-white to-white/95 backdrop-blur-sm border-t border-slate-100 px-8 py-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setShowDialog(false)}
                variant="outline"
                className="px-6 py-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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



// ============================================================
// OLD FAQTab — commented out, do not remove
// ============================================================
// function FAQTab({ agentId }: { agentId: string }) {
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const [faqs, setFaqs] = useState<any[]>([])
//   const [docs, setDocs] = useState<any[]>([])
//   const [newQuestion, setNewQuestion] = useState("")
//   const [newAnswer, setNewAnswer] = useState("")
//   const [showAddForm, setShowAddForm] = useState(false)
//   const [uploading, setUploading] = useState(false)
//   const [loading, setLoading] = useState(true)
//   const [successMessage, setSuccessMessage] = useState("")
//   const [errorMessage, setErrorMessage] = useState("")
//   const token = Cookies.get("Token") || ""
//   const [scrapLoading, setScrapLoading] = useState(false)
//   const { toast } = useToast()
//   const [scrapWebsites, setScrapWebsites] = useState<string[]>([])
//   const [showScrapDialog, setShowScrapDialog] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const fetchScrappingWebsites = async () => {
//     try {
//       setScrapLoading(true)
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
//         headers: { Authorization: `Token ${Cookies.get("Token") || ""}` },
//       })
//       if (!res.ok) throw new Error("Failed to fetch agent details")
//       const data = await res.json()
//       setScrapWebsites(data.scraping_websites || [])
//     } catch (error) {
//       console.error("Error fetching scraping websites:", error)
//       toast({ title: "Error", description: "Failed to load scraping URLs.", variant: "destructive" })
//     } finally {
//       setScrapLoading(false)
//     }
//   }
//   const handleSaveScrapping = async () => {
//     try {
//       setSaving(true)
//       const invalidUrls = scrapWebsites.filter(
//         (url) => url.trim() && !/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url)
//       )
//       if (invalidUrls.length > 0) {
//         toast({ title: "Invalid URLs", description: "Please enter valid URLs starting with http:// or https://", variant: "destructive" })
//         setSaving(false)
//         return
//       }
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
//         body: JSON.stringify({ scraping_websites: scrapWebsites }),
//       })
//       if (!res.ok) throw new Error("Failed to save scraping websites")
//       toast({ title: "Success", description: "Scraping URLs saved successfully." })
//       setShowScrapDialog(false)
//     } catch (error) {
//       console.error("Save failed:", error)
//       toast({ title: "Save failed", description: "Failed to save URLs. Please ensure they are valid URLs.", variant: "destructive" })
//     } finally {
//       setSaving(false)
//     }
//   }
//   const handleAddUrl = () => setScrapWebsites((prev) => [...prev, ""])
//   const handleRemoveUrl = (index: number) => setScrapWebsites((prev) => prev.filter((_, i) => i !== index))
//   const handleEditUrl = (index: number, value: string) =>
//     setScrapWebsites((prev) => prev.map((url, i) => (i === index ? value : url)))
//   useEffect(() => { fetchFAQs(); fetchDocuments() }, [agentId])
//   const fetchFAQs = async () => {
//     try {
//       const response = await fetch(`/api/agents/${agentId}/faqs`)
//       const data = await response.json()
//       setFaqs(data)
//     } catch (error) { console.error("Error fetching FAQs:", error) }
//   }
//   const fetchDocuments = async () => {
//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/?agent_id=${agentId}`, {
//         headers: { Authorization: `Token ${token}` }
//       })
//       const data = await res.json()
//       setDocs(data)
//     } catch (error) { console.error("Failed to fetch documents:", error) } finally { setLoading(false) }
//   }
//   const handleUpload = async () => {
//     const file = fileInputRef.current?.files?.[0]
//     if (!file) { setErrorMessage("Please select a file."); setTimeout(() => setErrorMessage(""), 4000); return }
//     setUploading(true)
//     try {
//       const presignedRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/s3/presigned-url/`, {
//         method: "POST",
//         headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
//         body: JSON.stringify({ file_name: file.name, content_type: file.type })
//       })
//       const presignedData = await presignedRes.json()
//       const uploadUrl = presignedData.url
//       const s3Key = presignedData.file_key
//       const s3Res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
//       if (!s3Res.ok) throw new Error("S3 upload failed")
//       const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/`, {
//         method: "POST",
//         headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
//         body: JSON.stringify({ title: file.name, description: "FAQ Document", s3_url: uploadUrl.split("?")[0], file_key: s3Key, agent_id: agentId })
//       })
//       if (response.ok) { setSuccessMessage("File uploaded successfully!"); setTimeout(() => setSuccessMessage(""), 3000); fetchDocuments() }
//       else { setErrorMessage("Upload metadata failed") }
//     } catch (err) { console.error("Upload failed:", err); setErrorMessage("Upload failed.") } finally { setUploading(false) }
//   }
//   const handleAddFAQ = async () => {
//     if (!newQuestion.trim() || !newAnswer.trim()) return
//     try {
//       const res = await fetch(`/api/agents/${agentId}/faqs`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: newQuestion, answer: newAnswer })
//       })
//       if (res.ok) { setNewQuestion(""); setNewAnswer(""); setShowAddForm(false); fetchFAQs() }
//     } catch (err) { console.error("Error adding FAQ:", err) }
//   }
//   const handleDeleteFAQ = async (id: string) => {
//     try {
//       const res = await fetch(`/api/agents/${agentId}/faqs/${id}`, { method: "DELETE" })
//       if (res.ok) fetchFAQs()
//     } catch (err) { console.error("Error deleting FAQ:", err) }
//   }
//   const [deletingDocId, setDeletingDocId] = useState<number | null>(null)
//   const [docToDelete, setDocToDelete] = useState<{ id: number; title: string } | null>(null)
//   const handleDeleteDocument = async (docId: number) => {
//     setDeletingDocId(docId)
//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/${docId}/`, {
//         method: "DELETE",
//         headers: { Authorization: `Token ${token}` },
//       })
//       if (res.ok || res.status === 204) { setDocs((prev) => prev.filter((d) => d.id !== docId)) }
//       else { console.error("Delete failed:", res.status) }
//     } catch (err) { console.error("Error deleting document:", err) } finally { setDeletingDocId(null) }
//   }
//   if (loading) return <div className="text-center p-10 text-slate-600">Loading FAQ data...</div>
//   return (
//     <div className="space-y-6">
//       {docToDelete && (
//         <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
//           <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDocToDelete(null)} />
//           <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
//             <div className="px-6 pt-6 pb-4">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
//                   <Trash2 className="w-5 h-5 text-red-500" />
//                 </div>
//                 <div>
//                   <h3 className="text-sm font-medium text-slate-900">Delete Document</h3>
//                   <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone</p>
//                 </div>
//               </div>
//               <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 truncate">{docToDelete.title}</p>
//             </div>
//             <div className="flex items-center gap-2 px-6 pb-5">
//               <button onClick={() => setDocToDelete(null)} className="flex-1 px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
//               <button onClick={async () => { const id = docToDelete.id; setDocToDelete(null); await handleDeleteDocument(id) }} disabled={deletingDocId !== null} className="flex-1 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50">{deletingDocId !== null ? 'Deleting…' : 'Delete'}</button>
//             </div>
//           </div>
//         </div>
//       )}
//       <Dialog open={showScrapDialog} onOpenChange={setShowScrapDialog}>
//         <DialogTrigger asChild>
//           <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white" onClick={fetchScrappingWebsites}>🌐 Scrap & Save</Button>
//         </DialogTrigger>
//         <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl">
//           <DialogHeader><DialogTitle className="text-xl font-semibold">Manage Scrapping URLs</DialogTitle></DialogHeader>
//           <div className="space-y-4 mt-4">
//             {scrapLoading ? (
//               <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading URLs...</div>
//             ) : scrapWebsites.length === 0 ? (
//               <p className="text-sm text-slate-500">No URLs added yet. Start by adding one below.</p>
//             ) : (
//               scrapWebsites.map((url, index) => (
//                 <div key={index} className="flex items-center gap-3">
//                   <Input value={url} onChange={(e) => handleEditUrl(index, e.target.value)} placeholder="Enter website URL" className="flex-1" />
//                   <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleRemoveUrl(index)}><Trash2 className="w-4 h-4" /></Button>
//                 </div>
//               ))
//             )}
//             {!scrapLoading && (
//               <Button variant="outline" onClick={handleAddUrl} className="flex items-center gap-2 text-sm text-cyan-700 border-cyan-600 hover:bg-cyan-50"><Plus className="w-4 h-4" /> Add URL</Button>
//             )}
//           </div>
//           <div className="flex justify-end gap-3 mt-6">
//             <Button variant="ghost" onClick={() => setShowScrapDialog(false)}>Cancel</Button>
//             <Button onClick={handleSaveScrapping} disabled={saving} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">{saving ? "Saving..." : "Done"}</Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//       {successMessage && <div className="p-4 bg-green-50 border border-green-200 text-green-700">{successMessage}</div>}
//       {errorMessage && <div className="p-4 bg-red-50 border border-red-200 text-red-700">{errorMessage}</div>}
//       <div className="bg-white p-6 rounded-lg border border-gray-200">
//         <h2 className="text-xl font-semibold text-gray-800 mb-4">📁 Upload FAQ Documents</h2>
//         <input type="file" ref={fileInputRef} className="mb-4" />
//         <Button onClick={handleUpload} disabled={uploading} className="mb-2">
//           {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />} Upload
//         </Button>
//         <div className="mt-6">
//           <h3 className="text-lg font-medium text-slate-800 mb-2">Uploaded Files</h3>
//           {docs.length === 0 ? <p className="text-slate-500">No documents uploaded yet.</p> : (
//             <ul className="space-y-2">
//               {docs.map((doc) => (
//                 <li key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group">
//                   <div className="flex items-center gap-2.5 min-w-0">
//                     <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
//                     <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate text-left" onClick={async () => {
//                       try {
//                         const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/presigned-view-url/?file_key=${encodeURIComponent(doc.title)}`, { headers: { Authorization: `Token ${token}` } })
//                         const data = await res.json()
//                         window.open(data.presigned_url, "_blank")
//                       } catch { alert("Could not open document.") }
//                     }}>{doc.title}</button>
//                   </div>
//                   <button onClick={() => setDocToDelete({ id: doc.id, title: doc.title })} disabled={deletingDocId === doc.id} className="flex-shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50" title="Delete document">
//                     {deletingDocId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }
// ============================================================
// END OF OLD FAQTab
// ============================================================

function FAQTab({ agentId }: { agentId: string }) {
  const { toast } = useToast()
  const token = Cookies.get("Token") || ""

  type SubFAQ = { id?: number; question: string; answer: string; order: number; is_published: boolean }
  type FAQ = {
    id: number; question: string; answer: string; order: number; is_published: boolean
    company_id: number; agent_id: number; parent: number | null
    sub_faqs: SubFAQ[]; created_at: string; updated_at: string
  }

  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Pagination
  const FAQS_PER_PAGE = 40
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const totalPages = Math.max(1, Math.ceil(faqs.length / FAQS_PER_PAGE))
  const paginatedFaqs = faqs.slice((currentPage - 1) * FAQS_PER_PAGE, currentPage * FAQS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [totalPages, currentPage])

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (/^\d*$/.test(e.target.value)) setPageInput(e.target.value)
  }

  const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return
    const pageNum = parseInt(pageInput, 10)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) setCurrentPage(pageNum)
    setPageInput("")
  }

  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addQuestion, setAddQuestion] = useState("")
  const [addAnswer, setAddAnswer] = useState("")
  const [addOrder, setAddOrder] = useState(0)
  const [addIsPublished, setAddIsPublished] = useState(true)
  const [addSubFaqs, setAddSubFaqs] = useState<SubFAQ[]>([])
  const [adding, setAdding] = useState(false)

  // Edit dialog
  const [editFaq, setEditFaq] = useState<FAQ | null>(null)
  const [editQuestion, setEditQuestion] = useState("")
  const [editAnswer, setEditAnswer] = useState("")
  const [editOrder, setEditOrder] = useState(0)
  const [editIsPublished, setEditIsPublished] = useState(true)
  const [editSubFaqs, setEditSubFaqs] = useState<SubFAQ[]>([])
  const [editing, setEditing] = useState(false)

  // Delete dialog
  const [deleteFaq, setDeleteFaq] = useState<FAQ | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Fetch ────────────────────────────────────────────
  const fetchFAQs = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/faq/faqs/?agent_id=${agentId}&parent=none`,
        { headers: { Authorization: `Token ${token}` } }
      )
      const data = await res.json()
      setFaqs(Array.isArray(data) ? data : (data.results ?? []))
    } catch (err) {
      console.error("Error fetching FAQs:", err)
      toast({ title: "Error", description: "Failed to load FAQs.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFAQs(); setCurrentPage(1) }, [agentId])

  // ── Add ──────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addQuestion.trim() || !addAnswer.trim()) {
      toast({ title: "Fields required", description: "Please fill in both question and answer.", variant: "destructive" })
      return
    }
    try {
      setAdding(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/faq/faqs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify({
          question: addQuestion.trim(),
          answer: addAnswer.trim(),
          order: addOrder,
          is_published: addIsPublished,
          agent_id: Number(agentId),
          sub_faqs: addSubFaqs.filter(s => s.question.trim() && s.answer.trim()).map(s => ({
            question: s.question.trim(),
            answer: s.answer.trim(),
            order: s.order,
            is_published: s.is_published,
          })),
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "FAQ added", description: "New Q&A pair saved successfully." })
      setAddQuestion(""); setAddAnswer(""); setAddOrder(0); setAddIsPublished(true); setAddSubFaqs([]); setShowAddDialog(false)
      fetchFAQs()
    } catch {
      toast({ title: "Error", description: "Failed to add FAQ. Please try again.", variant: "destructive" })
    } finally {
      setAdding(false)
    }
  }

  // ── Edit ─────────────────────────────────────────────
  const openEdit = (faq: FAQ) => {
    setEditFaq(faq)
    setEditQuestion(faq.question)
    setEditAnswer(faq.answer)
    setEditOrder(faq.order)
    setEditIsPublished(faq.is_published)
    setEditSubFaqs(faq.sub_faqs?.map(s => ({ ...s })) ?? [])
  }

  const handleEdit = async () => {
    if (!editFaq) return
    if (!editQuestion.trim() || !editAnswer.trim()) {
      toast({ title: "Fields required", description: "Both fields are required.", variant: "destructive" })
      return
    }
    try {
      setEditing(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/faq/faqs/${editFaq.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify({
          question: editQuestion.trim(),
          answer: editAnswer.trim(),
          order: editOrder,
          is_published: editIsPublished,
          sub_faqs: editSubFaqs.filter(s => s.question.trim() && s.answer.trim()).map(s => ({
            question: s.question.trim(),
            answer: s.answer.trim(),
            order: s.order,
            is_published: s.is_published,
          })),
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "FAQ updated", description: "Changes saved successfully." })
      setEditFaq(null)
      fetchFAQs()
    } catch {
      toast({ title: "Error", description: "Failed to update FAQ.", variant: "destructive" })
    } finally {
      setEditing(false)
    }
  }

  // ── Delete ───────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteFaq) return
    try {
      setDeleting(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/faq/faqs/${deleteFaq.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      })
      if (!res.ok && res.status !== 204) throw new Error()
      toast({ title: "FAQ deleted", description: "The entry has been removed." })
      setDeleteFaq(null)
      fetchFAQs()
    } catch {
      toast({ title: "Error", description: "Failed to delete FAQ.", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  // ── Skeletons ────────────────────────────────────────
  const SkeletonRow = () => (
    <div className="animate-pulse flex items-start gap-5 px-6 py-5 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-slate-100 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 bg-slate-100 rounded-lg w-3/5" />
        <div className="h-3 bg-slate-100 rounded-lg w-full" />
        <div className="h-3 bg-slate-100 rounded-lg w-4/5" />
      </div>
    </div>
  )

  return (
    <div className="min-h-[60vh] bg-white">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Page Header ── */}
        <div className="mb-10 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-1 h-16 bg-gradient-to-b from-slate-900 to-slate-300 rounded-full flex-shrink-0" />
            <div>
              <h1 className="text-4xl font-extralight tracking-tight text-slate-900">FAQ Manager</h1>
              <p className="text-base text-slate-400 font-light tracking-wide mt-1">
                Train your agent with question &amp; answer pairs
              </p>
            </div>
          </div>

          {/* Stats strip */}
          {!loading && (
            <div className="flex items-center gap-8 pl-7 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-2xl font-light text-slate-900 leading-none">{faqs.length}</p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-0.5">FAQs</p>
                </div>
              </div>
              {faqs.some(f => f.sub_faqs && f.sub_faqs.length > 0) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-light text-slate-900 leading-none">
                      {faqs.reduce((sum, f) => sum + (f.sub_faqs?.length ?? 0), 0)}
                    </p>
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-0.5">Sub-FAQs</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
            {loading ? "Loading…" : `${faqs.length} entr${faqs.length === 1 ? "y" : "ies"}`}
          </p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-light bg-slate-900 text-white hover:bg-slate-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            New FAQ
          </button>
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : faqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-light text-slate-700 tracking-tight">No FAQs yet</p>
            <p className="text-sm text-slate-400 font-light mt-1.5 max-w-xs">
              Add your first question &amp; answer pair to start training your agent.
            </p>
            <button
              onClick={() => setShowAddDialog(true)}
              className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-light bg-slate-900 text-white hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add First FAQ
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden divide-y divide-slate-50">
            {paginatedFaqs.map((faq, idx) => {
              const subFaqs = faq.sub_faqs ?? []
              const isExpanded = expandedFaq === faq.id
              return (
                <div key={faq.id}>
                  <div
                    className="group flex items-start gap-5 px-6 py-5 hover:bg-slate-50/60 transition-colors duration-150"
                  >
                    {/* Index badge */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium flex items-center justify-center mt-0.5 group-hover:bg-slate-200 transition-colors">
                      {(currentPage - 1) * FAQS_PER_PAGE + idx + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 leading-snug tracking-tight">{faq.question}</p>
                        {!faq.is_published && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-light text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{faq.answer}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-slate-400 font-light">Order: {faq.order}</span>
                        {subFaqs.length > 0 && (
                          <button
                            onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 font-light transition-colors"
                          >
                            <svg
                              className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                            {subFaqs.length} sub-FAQ{subFaqs.length !== 1 ? "s" : ""}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions – reveal on hover */}
                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => openEdit(faq)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-sm transition-all"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteFaq(faq)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Sub-FAQs expanded */}
                  {isExpanded && subFaqs.length > 0 && (
                    <div className="bg-slate-50/80 border-t border-slate-100">
                      {subFaqs.map((sub, subIdx) => (
                        <div
                          key={sub.id ?? subIdx}
                          className="flex items-start gap-5 pl-20 pr-6 py-3 border-b border-slate-100 last:border-0"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-slate-200 text-slate-500 text-[10px] font-medium flex items-center justify-center mt-0.5">
                            {subIdx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 leading-snug">{sub.question}</p>
                            <p className="text-xs font-light text-slate-400 mt-1 leading-relaxed">{sub.answer}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-slate-400 font-light">Order: {sub.order}</span>
                              {!sub.is_published && (
                                <span className="text-[10px] text-amber-500 font-light">Draft</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <p className="text-xs text-slate-400 font-light tracking-wide whitespace-nowrap">
              Page <span className="text-slate-700 font-medium">{currentPage}</span> of {totalPages}
            </p>

            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputSubmit}
              placeholder="Go to"
              className="w-16 px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 transition-all"
            />

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ══ Add Dialog ══════════════════════════════════ */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { setShowAddDialog(o); if (!o) { setAddQuestion(""); setAddAnswer(""); setAddOrder(0); setAddIsPublished(true); setAddSubFaqs([]) } }}>
        <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-slate-200 max-h-[85vh] overflow-y-auto">
          <div className="px-7 pt-7 pb-2">
            <DialogTitle className="text-xl font-extralight tracking-tight text-slate-900">New FAQ</DialogTitle>
            <DialogDescription className="text-sm font-light text-slate-400 mt-1">
              Add a question &amp; answer pair to your agent's knowledge base.
            </DialogDescription>
          </div>
          <div className="px-7 py-5 space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Question</p>
              <Input
                placeholder="e.g. What are your business hours?"
                value={addQuestion}
                onChange={(e) => setAddQuestion(e.target.value)}
                className="h-11 rounded-xl border-slate-200 text-sm font-light focus-visible:ring-slate-900/20"
                disabled={adding}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && document.getElementById("faq-add-answer")?.focus()}
              />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Answer</p>
              <Textarea
                id="faq-add-answer"
                placeholder="e.g. We're open Monday–Friday, 9 am–5 pm EST."
                value={addAnswer}
                onChange={(e) => setAddAnswer(e.target.value)}
                rows={4}
                className="rounded-xl border-slate-200 text-sm font-light resize-none focus-visible:ring-slate-900/20"
                disabled={adding}
              />
            </div>
            <div className="flex items-center gap-5">
              <div className="space-y-2 flex-1">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Order</p>
                <Input
                  type="number"
                  min={0}
                  value={addOrder}
                  onChange={(e) => setAddOrder(Number(e.target.value))}
                  className="h-10 rounded-xl border-slate-200 text-sm font-light focus-visible:ring-slate-900/20"
                  disabled={adding}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Published</p>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={addIsPublished}
                    onCheckedChange={setAddIsPublished}
                    disabled={adding}
                  />
                  <span className="text-sm text-slate-500 font-light">{addIsPublished ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Sub-FAQs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Sub-FAQs (optional)</p>
                <button
                  type="button"
                  onClick={() => setAddSubFaqs(prev => [...prev, { question: "", answer: "", order: 0, is_published: true }])}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 font-light transition-colors"
                  disabled={adding}
                >
                  <Plus className="w-3 h-3" /> Add Sub-FAQ
                </button>
              </div>
              {addSubFaqs.length > 0 && (
                <p className="text-xs text-slate-400 font-light">
                  Sub-FAQs are nested items (e.g. cost components). They appear under the parent in search results.
                </p>
              )}
              {addSubFaqs.map((sub, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Sub-FAQ {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setAddSubFaqs(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                      disabled={adding}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <Input
                    placeholder="Sub-question"
                    value={sub.question}
                    onChange={(e) => setAddSubFaqs(prev => prev.map((s, i) => i === idx ? { ...s, question: e.target.value } : s))}
                    className="h-9 rounded-lg border-slate-200 text-xs font-light focus-visible:ring-slate-900/20"
                    disabled={adding}
                  />
                  <Textarea
                    placeholder="Sub-answer"
                    value={sub.answer}
                    onChange={(e) => setAddSubFaqs(prev => prev.map((s, i) => i === idx ? { ...s, answer: e.target.value } : s))}
                    rows={2}
                    className="rounded-lg border-slate-200 text-xs font-light resize-none focus-visible:ring-slate-900/20"
                    disabled={adding}
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-400 font-light">Order:</p>
                      <Input
                        type="number"
                        min={0}
                        value={sub.order}
                        onChange={(e) => setAddSubFaqs(prev => prev.map((s, i) => i === idx ? { ...s, order: Number(e.target.value) } : s))}
                        className="w-16 h-7 rounded-lg border-slate-200 text-xs font-light focus-visible:ring-slate-900/20"
                        disabled={adding}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={sub.is_published}
                        onCheckedChange={(checked) => setAddSubFaqs(prev => prev.map((s, i) => i === idx ? { ...s, is_published: checked } : s))}
                        disabled={adding}
                      />
                      <span className="text-[10px] text-slate-400 font-light">Published</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-7 py-5 bg-slate-50 border-t border-slate-100">
            <button
              onClick={() => { setShowAddDialog(false); setAddQuestion(""); setAddAnswer(""); setAddOrder(0); setAddIsPublished(true); setAddSubFaqs([]) }}
              disabled={adding}
              className="px-4 py-2 rounded-xl text-sm font-light text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-light bg-slate-900 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {adding ? "Saving…" : "Save FAQ"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Edit Dialog ═════════════════════════════════ */}
      <Dialog open={!!editFaq} onOpenChange={(o) => { if (!o) setEditFaq(null) }}>
        <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-slate-200 max-h-[85vh] overflow-y-auto">
          <div className="px-7 pt-7 pb-2">
            <DialogTitle className="text-xl font-extralight tracking-tight text-slate-900">Edit FAQ</DialogTitle>
            <DialogDescription className="text-sm font-light text-slate-400 mt-1">
              Update the question, answer, or sub-FAQs below.
            </DialogDescription>
          </div>
          <div className="px-7 py-5 space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Question</p>
              <Input
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                className="h-11 rounded-xl border-slate-200 text-sm font-light focus-visible:ring-slate-900/20"
                disabled={editing}
              />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Answer</p>
              <Textarea
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                rows={4}
                className="rounded-xl border-slate-200 text-sm font-light resize-none focus-visible:ring-slate-900/20"
                disabled={editing}
              />
            </div>
            <div className="flex items-center gap-5">
              <div className="space-y-2 flex-1">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Order</p>
                <Input
                  type="number"
                  min={0}
                  value={editOrder}
                  onChange={(e) => setEditOrder(Number(e.target.value))}
                  className="h-10 rounded-xl border-slate-200 text-sm font-light focus-visible:ring-slate-900/20"
                  disabled={editing}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Published</p>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={editIsPublished}
                    onCheckedChange={setEditIsPublished}
                    disabled={editing}
                  />
                  <span className="text-sm text-slate-500 font-light">{editIsPublished ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Sub-FAQs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Sub-FAQs</p>
                <button
                  type="button"
                  onClick={() => setEditSubFaqs(prev => [...prev, { question: "", answer: "", order: 0, is_published: true }])}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 font-light transition-colors"
                  disabled={editing}
                >
                  <Plus className="w-3 h-3" /> Add Sub-FAQ
                </button>
              </div>
              {editSubFaqs.length > 0 && (
                <p className="text-xs text-slate-400 font-light">
                  Sub-FAQs replace the full set when saved. Omitting them leaves existing sub-FAQs untouched.
                </p>
              )}
              {editSubFaqs.map((sub, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Sub-FAQ {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setEditSubFaqs(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                      disabled={editing}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <Input
                    placeholder="Sub-question"
                    value={sub.question}
                    onChange={(e) => setEditSubFaqs(prev => prev.map((s, i) => i === idx ? { ...s, question: e.target.value } : s))}
                    className="h-9 rounded-lg border-slate-200 text-xs font-light focus-visible:ring-slate-900/20"
                    disabled={editing}
                  />
                  <Textarea
                    placeholder="Sub-answer"
                    value={sub.answer}
                    onChange={(e) => setEditSubFaqs(prev => prev.map((s, i) => i === idx ? { ...s, answer: e.target.value } : s))}
                    rows={2}
                    className="rounded-lg border-slate-200 text-xs font-light resize-none focus-visible:ring-slate-900/20"
                    disabled={editing}
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-400 font-light">Order:</p>
                      <Input
                        type="number"
                        min={0}
                        value={sub.order}
                        onChange={(e) => setEditSubFaqs(prev => prev.map((s, i) => i === idx ? { ...s, order: Number(e.target.value) } : s))}
                        className="w-16 h-7 rounded-lg border-slate-200 text-xs font-light focus-visible:ring-slate-900/20"
                        disabled={editing}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={sub.is_published}
                        onCheckedChange={(checked) => setEditSubFaqs(prev => prev.map((s, i) => i === idx ? { ...s, is_published: checked } : s))}
                        disabled={editing}
                      />
                      <span className="text-[10px] text-slate-400 font-light">Published</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-7 py-5 bg-slate-50 border-t border-slate-100">
            <button
              onClick={() => setEditFaq(null)}
              disabled={editing}
              className="px-4 py-2 rounded-xl text-sm font-light text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={editing}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-light bg-slate-900 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {editing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editing ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Delete Confirm Dialog ════════════════════════ */}
      <Dialog open={!!deleteFaq} onOpenChange={(o) => { if (!o) setDeleteFaq(null) }}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-slate-200">
          <div className="px-7 pt-7 pb-2 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <div>
              <DialogTitle className="text-base font-medium text-slate-900 leading-tight">Delete FAQ?</DialogTitle>
              <DialogDescription className="text-sm font-light text-slate-400 mt-1">
                This cannot be undone.
              </DialogDescription>
            </div>
          </div>
          {deleteFaq && (
            <div className="mx-7 mb-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-medium text-slate-700 truncate">{deleteFaq.question}</p>
            </div>
          )}
          <div className="flex items-center gap-2 px-7 py-5 bg-slate-50 border-t border-slate-100">
            <button
              onClick={() => setDeleteFaq(null)}
              disabled={deleting}
              className="flex-1 py-2 rounded-xl text-sm font-light text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-light bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
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








import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AudioPlayer } from "@/components/ui/audio-player"
import {Mic} from "lucide-react"
import { cn } from "@/lib/utils"

const predefinedVoices = [
  {
    id: "marissa",
    name: "Marissa",
    description: "Friendly and Sociable",
    tags: "american/casual/young/female/conversational",
    avatar: "/marissa.png",
    audioSrc: "/voices/marissa.mp3",
  },
  {
    id: "scott",
    name: "Scott",
    description: "Professional and Clear",
    tags: "american/formal/male/business",
    avatar: "/scott.png",
    audioSrc: "/voices/scott.mp3",
  },
  {
    id: "luna",
    name: "Luna",
    description: "Warm and Engaging",
    tags: "british/casual/male/conversational",
    avatar: "/luna.png",
    audioSrc: "/voices/luna.mp3",
  },
]

function VoiceprintTab({ agentId }: { agentId: string }) {
  const { toast } = useToast()
  const [selectedVoice, setSelectedVoice] = useState<string>(predefinedVoices[0].id)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [voiceType, setVoiceType] = useState<"predefined" | "upload">("predefined")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingAgent, setIsFetchingAgent] = useState(true)
  const [currentAgentVoice, setCurrentAgentVoice] = useState<{
    type: "predefined" | "upload"
    voiceId?: string
    customVoiceUrl?: string
  } | null>(null)
  const [previewText, setPreviewText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch current agent voice on mount
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setIsFetchingAgent(true)
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
          method: "GET",
          headers: {
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })

        if (res.ok) {
          const agentData = await res.json()
          if (agentData.selected_voice) {
            setCurrentAgentVoice({
              type: "predefined",
              voiceId: agentData.selected_voice,
            })
            setSelectedVoice(agentData.selected_voice)
            setVoiceType("predefined")
          } else if (agentData.voice_clip) {
            setCurrentAgentVoice({
              type: "upload",
              customVoiceUrl: agentData.voice_clip,
            })
            setVoiceType("upload")
          }
        }
      } catch (error) {
        console.error("Error fetching agent data:", error)
      } finally {
        setIsFetchingAgent(false)
      }
    }

    fetchAgentData()
  }, [agentId])

  const currentPredefinedVoice = predefinedVoices.find((v) => v.id === selectedVoice)

  const uploadedFileBlobUrl = useMemo(() => {
    if (voiceType === "upload" && uploadedFile) {
      return URL.createObjectURL(uploadedFile)
    }
    return null
  }, [voiceType, uploadedFile])

  useEffect(() => {
    if (!uploadedFileBlobUrl) return
    return () => URL.revokeObjectURL(uploadedFileBlobUrl)
  }, [uploadedFileBlobUrl])

  const displayAudioSrc =
    uploadedFileBlobUrl ??
    (voiceType === "upload" && currentAgentVoice?.customVoiceUrl
      ? currentAgentVoice.customVoiceUrl
      : currentPredefinedVoice?.audioSrc)

  const handleVoiceSelection = (voiceId: string) => {
    setSelectedVoice(voiceId)
    setVoiceType("predefined")
    setUploadedFile(null)
  }

  const handleVoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (MP3, WAV, OGG).",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB.",
          variant: "destructive",
        })
        return
      }

      setUploadedFile(file)
      setVoiceType("upload")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (MP3, WAV, OGG).",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB.",
          variant: "destructive",
        })
        return
      }

      setUploadedFile(file)
      setVoiceType("upload")
    }
  }

  const handleUpdateVoice = async () => {
    try {
      setIsLoading(true)

      const formPayload = new FormData()

      if (voiceType === "upload" && uploadedFile) {
        formPayload.append("voice_clip", uploadedFile)
      } else if (voiceType === "predefined" && selectedVoice) {
        formPayload.append("selected_voice", selectedVoice)
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: formPayload,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to update voice")
      }

      const updatedAgent = await res.json()

      // Update current agent voice state
      if (updatedAgent.selected_voice) {
        setCurrentAgentVoice({
          type: "predefined",
          voiceId: updatedAgent.selected_voice,
        })
      } else if (updatedAgent.voice_clip) {
        setCurrentAgentVoice({
          type: "upload",
          customVoiceUrl: updatedAgent.voice_clip,
        })
      }

      toast({
        title: "Voice Updated",
        description: "Your agent's voice has been successfully updated.",
      })

      // Clear uploaded file after successful update
      setUploadedFile(null)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Unable to update voice.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePreview = async () => {
    if (!previewText.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter some text to generate a preview.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    // Simulate generation - replace with actual API call
    setTimeout(() => {
      setIsGenerating(false)
      toast({
        title: "Preview Generated",
        description: "Your voice snippet has been created.",
      })
    }, 2000)
  }

  if (isFetchingAgent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-32">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
          <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
        </div>
        <p className="text-slate-500 font-light">Loading voice configuration...</p>
      </div>
    )
  }

  const activeVoiceName =
    currentAgentVoice?.type === "upload"
      ? "Custom Voice"
      : currentAgentVoice?.voiceId
      ? predefinedVoices.find((v) => v.id === currentAgentVoice.voiceId)?.name
      : "No Voice Selected"

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-16 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-1 h-20 bg-gradient-to-b from-slate-900 to-slate-400 rounded-full" />
            <div className="space-y-3">
              <h1 className="text-5xl font-extralight tracking-tight text-slate-900">Voice Configuration</h1>
              <p className="text-lg text-slate-500 font-light tracking-wide">
                Customize the voice personality of your agent
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 pl-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-slate-900">{activeVoiceName}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Active Voice</p>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Mic className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-slate-900">
                  {currentAgentVoice?.type === "predefined" ? "Predefined" : "Custom"}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Voice Type</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {/* Predefined Voices Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-2xl font-light text-slate-900">Predefined Voices</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predefinedVoices.map((voice) => {
                const isSelected = voiceType === "predefined" && selectedVoice === voice.id
                return (
                  <Card
                    key={voice.id}
                    className={cn(
                      "group relative bg-white border transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden cursor-pointer",
                      isSelected ? "border-slate-900 shadow-md" : "border-slate-200"
                    )}
                    onClick={() => handleVoiceSelection(voice.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-slate-100">
                            <AvatarImage src={voice.avatar} alt={voice.name} />
                            <AvatarFallback>{voice.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-lg font-light text-slate-900">{voice.name}</p>
                            <p className="text-xs text-slate-500 font-light">{voice.description}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-slate-400 text-xs font-light font-mono">{voice.tags}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Custom Voice Upload Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-2xl font-light text-slate-900">Custom Voice</h2>
            </div>

            <Card
              className={cn(
                "relative bg-white border transition-all duration-300 rounded-xl overflow-hidden",
                voiceType === "upload" ? "border-slate-900 shadow-md" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <CardContent className="p-8">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="relative rounded-xl border-2 border-dashed border-slate-300 p-12 transition-all duration-300 hover:border-slate-400"
                >
                  <input
                    id="voice-upload"
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={handleVoiceFileUpload}
                  />
                  <label htmlFor="voice-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Upload className="w-8 h-8 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-slate-700 font-light text-lg">
                          {uploadedFile ? (
                            <span className="text-slate-900 font-normal">✓ {uploadedFile.name}</span>
                          ) : currentAgentVoice?.type === "upload" && currentAgentVoice.customVoiceUrl ? (
                            <span className="text-slate-600">Current custom voice uploaded</span>
                          ) : (
                            <>
                              Drag & drop or <span className="text-slate-900 underline">browse</span> to upload
                            </>
                          )}
                        </p>
                        <p className="text-sm text-slate-400 font-light mt-2">
                          MP3, WAV, OGG • Max 5MB • Up to 5 minutes
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audio Preview Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-2xl font-light text-slate-900">Preview</h2>
            </div>

            <Card className="bg-white border border-slate-200 rounded-xl">
              <CardContent className="p-6">
                {displayAudioSrc ? (
                  <AudioPlayer src={displayAudioSrc} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <Volume2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-light">Select a voice to preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generate Voice Snippet Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-2xl font-light text-slate-900">Generate Voice Snippet</h2>
            </div>

            <Card className="bg-white border border-slate-200 rounded-xl">
              <CardContent className="p-6 space-y-4">
                <p className="text-slate-600 font-light">Test the selected voice with custom text</p>
                <Textarea
                  placeholder="Type something for the agent to say..."
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  rows={4}
                  className="resize-none font-light"
                />
                <Button
                  onClick={handleGeneratePreview}
                  disabled={isGenerating || !previewText.trim()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 font-light tracking-wide disabled:opacity-40"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Preview"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Update Button */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={handleUpdateVoice}
              disabled={isLoading}
              className="group px-12 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Updating Voice...
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-light tracking-wide">Update Voice Configuration</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Bottom Divider */}
        <div className="mt-24 pt-12 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
          </div>
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



import {Sparkles, Save, Type, Hash, ShieldCheck, CheckCircle2 } from "lucide-react"

// Samsung-style AI scanning skeleton
function RefineSkeletonLoader() {
  const lines = [
    { w: "92%", delay: 0 }, { w: "78%", delay: 0.07 }, { w: "85%", delay: 0.14 },
    { w: "60%", delay: 0.21 }, { w: "90%", delay: 0.28 }, { w: "70%", delay: 0.35 },
    { w: "88%", delay: 0.42 }, { w: "55%", delay: 0.49 }, { w: "82%", delay: 0.56 },
    { w: "75%", delay: 0.63 }, { w: "93%", delay: 0.70 }, { w: "65%", delay: 0.77 },
    { w: "80%", delay: 0.84 }, { w: "45%", delay: 0.91 }, { w: "88%", delay: 0.98 },
    { w: "72%", delay: 1.05 }, { w: "60%", delay: 1.12 },
  ]
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100" style={{ minHeight: 500 }}>
      {/* Base surface */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/20" />
      {/* Scanning beam */}
      <motion.div
        className="absolute inset-x-0 top-0 h-full pointer-events-none z-10"
        style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(99,102,241,0.05) 46%, rgba(139,92,246,0.12) 50%, rgba(99,102,241,0.05) 54%, transparent 100%)" }}
        animate={{ y: ["-100%", "200%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      {/* Glow pulse */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none z-10"
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ boxShadow: "inset 0 0 60px rgba(99,102,241,0.12)" }}
      />
      {/* Lines */}
      <div className="relative z-0 pl-20 pr-8 py-6 space-y-[10px]">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center gap-3" style={{ height: 28 }}>
            <div className="absolute left-0 w-16 flex items-center justify-center text-xs font-light text-slate-300 select-none">{i + 1}</div>
            <motion.div
              className="relative h-[14px] rounded-full overflow-hidden bg-slate-200/60"
              style={{ width: line.w }}
              animate={{ opacity: [0.45, 0.9, 0.45] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: line.delay }}
            >
              <motion.div
                className="absolute inset-y-0 w-1/3 rounded-full"
                style={{ background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.4) 50%, transparent 100%)" }}
                animate={{ x: ["-100%", "400%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: line.delay }}
              />
            </motion.div>
          </div>
        ))}
      </div>
      {/* AI badge */}
      <div className="absolute bottom-5 right-6 flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-full px-3 py-1.5 shadow-sm">
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        </motion.div>
        <span className="text-xs font-medium text-indigo-600 tracking-wide">AI is refining…</span>
      </div>
    </div>
  )
}


function AgentPromptsTab({ agentId }: { agentId: string }) {
  const [agentPrompt, setAgentPrompt] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [isRefineDialogOpen, setIsRefineDialogOpen] = useState(false)
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  // ── Guardrails ──
  const [mounted, setMounted] = useState(false)
  const [guardrail, setGuardrail] = useState<Record<string, string>>({})
  const [isGuardrailOpen, setIsGuardrailOpen] = useState(false)
  const [guardrailDraft, setGuardrailDraft] = useState<{ id: number; key: string; value: string }[]>([])
  const [guardrailSaving, setGuardrailSaving] = useState(false)
  useEffect(() => { setMounted(true) }, [])

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

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
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
    } finally {
      setIsSaving(false)
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
    console.log("Refined prompt response:", data)
      if (data.refined_prompt) {
        setAgentPrompt(data.refined_prompt)
        toast({ title: "Prompt refined", description: "Your prompt has been improved by AI." })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to refine prompt." })
    } finally {
      setIsRefining(false)
    }
  }

  const lineCount = agentPrompt ? agentPrompt.split("\n").length : 1
  const charCount = agentPrompt.length
  const wordCount = agentPrompt.trim() ? agentPrompt.trim().split(/\s+/).length : 0

  return (
    <div className="min-h-screen bg-white">

      {/* ── Guardrail portal ── rendered into document.body to escape any transform containers */}
      {mounted && isGuardrailOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(8px)" }}
          onClick={() => setIsGuardrailOpen(false)}
        >
          <div
            className="relative w-full max-w-xl flex flex-col rounded-2xl bg-white overflow-hidden"
            style={{ maxHeight: "85vh", boxShadow: "0 32px 96px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Modal header ── */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-100">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-slate-900 font-semibold text-base tracking-tight">Guardrails</h2>
                  <p className="text-slate-400 text-xs font-light mt-0.5">Key-value rules enforced at runtime on this agent</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {guardrailDraft.filter(r => r.key.trim()).length > 0 && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {guardrailDraft.filter(r => r.key.trim()).length}&nbsp;rule{guardrailDraft.filter(r => r.key.trim()).length !== 1 ? "s" : ""}
                  </span>
                )}
                <button
                  onClick={() => setIsGuardrailOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Rows ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2.5">
              {guardrailDraft.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-slate-200" />
                  </div>
                  <p className="text-slate-400 text-sm font-light">No guardrails yet</p>
                  <p className="text-slate-300 text-xs">Add rules below to constrain agent behaviour</p>
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
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* ── Add row button ── */}
            <div className="px-6 pb-2">
              <button
                onClick={() => setGuardrailDraft(d => [...d, { id: Date.now(), key: "", value: "" }])}
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium px-3 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors w-full"
              >
                <Plus className="w-4 h-4" />
                Add rule
              </button>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400 font-light">Persisted as JSON on the agent record.</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGuardrailOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGuardrail}
                  disabled={guardrailSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header Section */}
        <div className="mb-16 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-1 h-16 bg-gradient-to-b from-slate-900 to-slate-400 rounded-full" />
                <div>
                  <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">
                    Agent Prompt
                  </h1>
                  <p className="text-lg text-slate-500 font-light tracking-wide">
                    Define personality, context, and behavior
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="flex items-center gap-6 bg-slate-50/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Hash className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-light text-slate-900">{lineCount}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Lines</p>
                </div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Type className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-light text-slate-900">{wordCount}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Words</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="max-w-3xl pl-8">
            <p className="text-slate-600 font-light leading-relaxed text-base">
              Shape your virtual agent's personality and response style. Define the context, tone, and behavioral 
              guidelines that will govern how your agent interacts and communicates.
            </p>
          </div>
        </div>

        {/* Editor Section */}
        <div className="space-y-6">
          <div className="group relative">
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

            {/* Floating toolbar */}
            <div className="absolute -top-16 right-0 z-10 flex items-center gap-3">
              <button
                onClick={handleCopy}
                disabled={isRefining}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow group/btn disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Copy className="w-4 h-4 text-slate-600 group-hover/btn:text-slate-900 transition-colors" />
                <span className="text-sm font-light text-slate-700 group-hover/btn:text-slate-900 transition-colors">
                  Copy
                </span>
              </button>

              <button
                onClick={openGuardrail}
                disabled={loading}
                className="relative flex items-center gap-2 px-4 py-2.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 rounded-xl transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Guardrails</span>
                {Object.keys(guardrail).length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-semibold leading-none">
                    {Object.keys(guardrail).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsRefineDialogOpen(true)}
                disabled={isRefining || loading || !agentPrompt.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md shadow-indigo-200 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group/refine"
              >
                <Sparkles className="w-4 h-4 group-hover/refine:rotate-12 transition-transform duration-200" />
                <span className="font-light tracking-wide">Refine Prompt</span>
              </button>

              <div className="text-sm text-slate-400 font-light px-4 py-2.5 bg-slate-50/50 border border-slate-200/50 rounded-xl">
                {isRefining ? (
                  <span className="text-indigo-500 font-medium">AI refining…</span>
                ) : (
                  <>{charCount.toLocaleString()} characters</>
                )}
              </div>
            </div>

            {/* Editor Container */}
            <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="relative">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                      <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/5 to-transparent rounded-2xl blur-xl" />
                  </div>
                  <p className="text-slate-500 font-light tracking-wide">Loading prompt...</p>
                </div>
              ) : isRefining ? (
                <RefineSkeletonLoader />
              ) : (
                <div className="relative">
                  {/* Line numbers */}
                  <div
                    ref={lineNumbersRef}
                    className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50 to-slate-50/30 border-r border-slate-200/50 overflow-hidden select-none"
                    style={{ overflowY: 'hidden' }}
                  >
                    <div className="py-6">
                      {Array.from({ length: lineCount }, (_, i) => (
                        <div
                          key={i + 1}
                          className="flex items-center justify-center text-xs font-light text-slate-400 hover:text-slate-600 transition-colors"
                          style={{ height: '28px', lineHeight: '28px' }}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <Textarea
                    ref={textareaRef}
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    onScroll={handleScroll}
                    placeholder="Define your agent's instructions, personality, and behavior guidelines..."
                    className="pl-20 pr-8 py-6 min-h-[500px] border-0 resize-none focus:ring-0 focus-visible:ring-0 font-mono text-[15px] text-slate-800 placeholder:text-slate-300 bg-transparent"
                    style={{ lineHeight: '28px' }}
                  />

                  {/* Gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-slate-400" />
              <p className="text-sm text-slate-500 font-light">
                Auto-saved locally as you type
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading || isSaving || isRefining}
              className="group relative px-8 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3">
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-light tracking-wide">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-light tracking-wide">Save Changes</span>
                  </>
                )}
              </div>
            </Button>
          </div>
        </div>

        {/* Bottom Divider */}
        <div className="mt-24 pt-12 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}


import { Volume2, Sliders, RotateCcw } from 'lucide-react'

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
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
            </div>
            <p className="text-slate-500 font-light">Loading voice settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-16 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-1 h-20 bg-gradient-to-b from-slate-900 to-slate-400 rounded-full" />
            <div className="space-y-3">
              <h1 className="text-5xl font-extralight tracking-tight text-slate-900">
                Voice Settings
              </h1>
              <p className="text-lg text-slate-500 font-light tracking-wide">
                Fine-tune your agent's voice characteristics and audio output
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 pl-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-slate-900">4</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Voice Parameters
                </p>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Sliders className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-slate-900">
                  {speakerBoost ? "On" : "Off"}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Speaker Boost
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12 max-w-4xl">
          {/* Sliders */}
          <div className="space-y-8">
            {[
              { label: "Stability", value: stability, set: setStability },
              { label: "Clarity", value: clarity, set: setClarity },
              { label: "Style", value: styleExaggeration, set: setStyleExaggeration },
              { label: "Speed", value: voiceSpeed, set: setVoiceSpeed },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <h2 className="text-2xl font-light text-slate-900">{label}</h2>
                    <span className="text-lg font-light text-slate-600 min-w-[4rem] text-right">
                      {value}%
                    </span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-slate-900 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Speaker Boost Toggle */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-2xl font-light text-slate-900">Speaker Boost</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="speaker-boost"
                    checked={speakerBoost}
                    onChange={(e) => setSpeakerBoost(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-slate-200 rounded-full peer-checked:bg-slate-900 transition-colors duration-300"></div>
                  <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-6 shadow-sm"></div>
                </div>
                <span className="text-base font-light text-slate-700 group-hover:text-slate-900 transition-colors">
                  Enable enhanced speaker output
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-8">
            <Button
              variant="outline"
              onClick={handleReset}
              className="px-8 py-6 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-300"
            >
              <span className="flex items-center gap-2 font-light tracking-wide">
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </span>
            </Button>
            <Button
              onClick={handleSave}
              className="px-10 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="font-light tracking-wide">Save Changes</span>
            </Button>
          </div>
        </div>

        {/* Bottom Divider */}
        <div className="mt-24 pt-12 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
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
  const [agentType, setAgentType] = useState<"Inbound" | "Outbound">("Inbound")
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
        setAgentType(data.type === "Outbound" ? "Outbound" : "Inbound")
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
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
            </div>
            <p className="text-slate-500 font-light">Loading agent settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-16 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-1 h-20 bg-gradient-to-b from-slate-900 to-slate-400 rounded-full" />
            <div className="space-y-3">
              <h1 className="text-5xl font-extralight tracking-tight text-slate-900">
                Additional Settings
              </h1>
              <p className="text-lg text-slate-500 font-light tracking-wide">
                Configure your agent's identity, persona, and strategic goals
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 pl-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-slate-900">
                  {agentName ? "1" : "0"}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Agent Name Set
                </p>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-slate-900">
                  {agentPersona ? "1" : "0"}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Persona Defined
                </p>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-light text-slate-900">
                  {agentGoals ? "1" : "0"}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Goals Set
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12 max-w-4xl">
          {/* Agent Name */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-2xl font-light text-slate-900">Agent Name</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Enter agent name"
                className="text-lg font-light border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />
            </div>
          </div>

          {/* Agent Type */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-2xl font-light text-slate-900">Agent Type</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="relative inline-flex items-center gap-0.5 p-0.5 bg-slate-100/60 rounded-lg">
                {(["Inbound", "Outbound"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={async () => {
                      if (agentType === t) return
                      setAgentType(t)
                      try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Token ${Cookies.get("Token") || ""}`,
                          },
                          body: JSON.stringify({ type: t }),
                        })
                        if (!res.ok) throw new Error("Failed to update agent type")
                        toast({ title: "Success", description: `Agent type changed to ${t}.` })
                      } catch {
                        setAgentType(agentType)
                        toast({ title: "Error", description: "Failed to update agent type.", variant: "destructive" })
                      }
                    }}
                    className={`relative px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      agentType === t
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${t === "Inbound" ? "bg-emerald-500" : "bg-violet-500"}`} />
                      {t}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                {agentType === "Inbound" ? "This agent responds to incoming calls." : "This agent initiates outbound conversations."}
              </p>
            </div>
          </div>

          {/* Agent Persona */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-2xl font-light text-slate-900">Agent Persona</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <Textarea
                value={agentPersona}
                onChange={(e) => setAgentPersona(e.target.value)}
                placeholder="Describe your agent's persona, tone, and communication style..."
                rows={6}
                className="text-base font-light border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 resize-none"
              />
            </div>
          </div>

          {/* Agent Goals */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-slate-600" />
              </div>
              <h2 className="text-2xl font-light text-slate-900">Agent Goals</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <Textarea
                value={agentGoals}
                onChange={(e) => setAgentGoals(e.target.value)}
                placeholder="Define the strategic objectives and goals your agent should achieve..."
                rows={6}
                className="text-base font-light border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 resize-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-8">
            <Button
              onClick={handleSave}
              className="px-10 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="font-light tracking-wide">Save Changes</span>
            </Button>
          </div>
        </div>

        {/* Bottom Divider */}
        <div className="mt-24 pt-12 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}


import { ArrowLeft, Bot, ChevronDown, Search, Wand2 } from "lucide-react"

type FunctionalityConflict = {
  scope?: string
  conflict_type?: string
  agent_id?: number
  agent_name?: string
  reason?: string
  guardrail_examples?: { guardrail_key?: string; text?: string; polarity?: string }[]
  instruction_examples?: { line_number?: number; line_text?: string; polarity?: string }[]
  positive_examples?: unknown[]
  negative_examples?: unknown[]
}

type FunctionalityConflictResponse = {
  functionality?: string
  intent?: string
  has_conflicts?: boolean
  has_repetitions?: boolean
  conflicts?: FunctionalityConflict[]
  repetitions?: unknown[]
  mentions?: unknown[]
  llm_stage?: string
  llm?: {
    enabled?: boolean
    headline?: string
    conflict_bullets?: string[]
    recommendations?: string[]
    semantic_conflicts?: {
      agent_id?: number
      agent_name?: string
      statement?: string
      conflicting_line_number?: number
      conflicting_line_text?: string
      reason?: string
      severity?: string
    }[]
    semantic_recommendations?: string[]
    rewrite_enabled?: boolean
    rewrite_headline?: string
    updated_prompts?: {
      agent_id?: number
      agent_name?: string
      updated_instructions?: string
      change_summary?: string
    }[]
    insertion_enabled?: boolean
    insertion_headline?: string
    insertion_plans?: unknown[]
    insertion_recommendations?: string[]
    removal_enabled?: boolean
    removal_headline?: string
    removal_plans?: unknown[]
    removal_recommendations?: string[]
    semantic_headline?: string
  }
}

type ChatMessage = {
  role: "user" | "assistant"
  text: string
  mode?: "scan" | "rewrite"
  rewriteIntent?: "add" | "remove"
  data?: FunctionalityConflictResponse
}

function diffPromptLines(oldStr: string, newStr: string) {
  const a = oldStr.split("\n")
  const b = newStr.split("\n")
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
  const result: { type: "same" | "add" | "remove"; line: string }[] = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: "same", line: a[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "add", line: b[j - 1] })
      j--
    } else {
      result.unshift({ type: "remove", line: a[i - 1] })
      i--
    }
  }
  return result
}

function getConflictLabel(c: FunctionalityConflict): string {
  switch (c.conflict_type) {
    case "instruction_internal":
      return "Conflicting instructions"
    case "guardrail_vs_prompt":
      return "Guardrail vs prompt"
    default:
      return c.scope === "cross_scope" ? "Cross-agent conflict" : "Conflict"
  }
}

function hasConflictIssues(data: FunctionalityConflictResponse): boolean {
  return Boolean(
    data.has_conflicts ||
      (data.llm?.semantic_conflicts && data.llm.semantic_conflicts.length > 0)
  )
}

function collectConflictingGuardrailKeys(conflicts: FunctionalityConflict[]): string[] {
  const keys = new Set<string>()
  for (const c of conflicts) {
    if (c.conflict_type === "guardrail_vs_prompt" && c.guardrail_examples) {
      for (const ex of c.guardrail_examples) {
        if (ex.guardrail_key) keys.add(ex.guardrail_key)
      }
    }
  }
  return [...keys]
}

function ConflictCard({ conflict }: { conflict: FunctionalityConflict }) {
  const label = getConflictLabel(conflict)
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">{label}</span>
        {conflict.agent_name && (
          <span className="text-xs font-medium text-slate-800">{conflict.agent_name}</span>
        )}
      </div>
      {conflict.reason && (
        <p className="text-xs text-slate-600 font-light leading-relaxed break-words">{conflict.reason}</p>
      )}
      {conflict.instruction_examples && conflict.instruction_examples.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Instructions</p>
          {conflict.instruction_examples.map((ex, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
              {ex.line_number != null && (
                <p className="text-[10px] text-slate-400 font-mono mb-0.5">Line {ex.line_number}</p>
              )}
              <p className="text-xs text-slate-600 font-light italic break-words">"{ex.line_text}"</p>
            </div>
          ))}
        </div>
      )}
      {conflict.guardrail_examples && conflict.guardrail_examples.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Guardrails</p>
          {conflict.guardrail_examples.map((ex, i) => (
            <div key={i} className="bg-white border border-amber-200 rounded-lg px-3 py-2">
              {ex.guardrail_key && (
                <p className="text-[10px] text-amber-600 font-mono mb-0.5">{ex.guardrail_key}</p>
              )}
              <p className="text-xs text-slate-600 font-light break-words">{ex.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AgentConfigPage({ params }: { params: Promise<{ agentId: string }> }) {
  
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
  const tabFromUrl = searchParams.get("tab")
    return tabFromUrl && tabs.some(t => t.id === tabFromUrl) ? tabFromUrl : "voiceprint"
  })
  const router = useRouter()
  const { agentId } = use(params) 
  const [agentName, setAgentName] = useState("")
  const [agentNumbers, setAgentNumbers] = useState<string[]>([])
  const [testPanelOpen, setTestPanelOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab")
    if (tabFromUrl && tabs.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    } else if (!tabFromUrl) {
      setActiveTab("voiceprint")
    }
  }, [searchParams])

  // Chat bubble state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatFunctionality, setChatFunctionality] = useState("")
  const [fixIntent, setFixIntent] = useState<"add" | "remove">("remove")
  const [chatLoading, setChatLoading] = useState(false)
  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [agentInstructions, setAgentInstructions] = useState("")
  const [agentGuardrail, setAgentGuardrail] = useState<Record<string, string>>({})
  const [promptDiff, setPromptDiff] = useState<{ oldPrompt: string; newPrompt: string; scanData?: FunctionalityConflictResponse } | null>(null)
  const [isPromptDiffOpen, setIsPromptDiffOpen] = useState(false)
  const [chatMounted, setChatMounted] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setChatMounted(true) }, [])

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages, chatOpen])

  const postFunctionalityConflicts = async (body: Record<string, unknown>) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/agents/functionality-conflicts/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify(body),
      }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || data.error || "Conflict request failed")
    return data as FunctionalityConflictResponse
  }

  const runConflictScan = async () => {
    const trimmed = chatFunctionality.trim()
    if (!trimmed || chatLoading) return

    setChatMessages((prev) => [...prev, { role: "user", text: trimmed, mode: "scan" }])
    setChatFunctionality("")
    setChatLoading(true)

    try {
      const data = await postFunctionalityConflicts({
        functionality: trimmed,
        intent: "detect",
        use_llm: true,
        llm_stage: "detect",
        agent_id: Number(agentId),
        include_workers: true,
      })
      const fallbackText = data.llm?.headline || `Scan results for "${data.functionality || trimmed}"`
      setChatMessages((prev) => [...prev, { role: "assistant", text: fallbackText, mode: "scan", data }])
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Error: " + (err.message || "Request failed") }])
    } finally {
      setChatLoading(false)
    }
  }

  const generateFixedPrompt = async (functionality: string, rewriteIntent: "add" | "remove") => {
    if (rewriteLoading) return
    setRewriteLoading(true)
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: functionality, mode: "rewrite", rewriteIntent },
    ])

    try {
      const data = await postFunctionalityConflicts({
        functionality,
        intent: rewriteIntent,
        use_llm: true,
        llm_stage: "rewrite",
        agent_id: Number(agentId),
        include_workers: true,
      })
      const fallbackText =
        data.llm?.rewrite_headline || data.llm?.headline || `Rewrite for "${functionality}"`
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: fallbackText, mode: "rewrite", rewriteIntent, data },
      ])

      const updated = data.llm?.updated_prompts?.find(
        (p) => p.agent_id === Number(agentId) || !p.agent_id
      )?.updated_instructions
      if (updated) {
        setPromptDiff({ oldPrompt: agentInstructions, newPrompt: updated, scanData: data })
        setIsPromptDiffOpen(true)
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error: " + (err.message || "Rewrite failed") },
      ])
    } finally {
      setRewriteLoading(false)
    }
  }

  const applyRewrittenPrompt = async () => {
    if (!promptDiff || applyLoading) return
    setApplyLoading(true)
    try {
      const keysToClear = collectConflictingGuardrailKeys(promptDiff.scanData?.conflicts || [])
      const nextGuardrail = { ...agentGuardrail }
      for (const key of keysToClear) delete nextGuardrail[key]

      const payload: Record<string, unknown> = { instructions: promptDiff.newPrompt }
      if (keysToClear.length > 0) payload.guardrail = nextGuardrail

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save agent prompt")

      setAgentInstructions(promptDiff.newPrompt)
      if (keysToClear.length > 0) setAgentGuardrail(nextGuardrail)
      setIsPromptDiffOpen(false)
      setPromptDiff(null)
      toast({
        title: "Prompt updated",
        description:
          keysToClear.length > 0
            ? `Instructions saved; cleared ${keysToClear.length} conflicting guardrail rule(s).`
            : "Instructions saved successfully.",
      })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to apply fix" })
    } finally {
      setApplyLoading(false)
    }
  }

  const verifyNoConflicts = async (functionality: string) => {
    setChatLoading(true)
    try {
      const data = await postFunctionalityConflicts({
        functionality,
        intent: "detect",
        use_llm: true,
        llm_stage: "detect",
        agent_id: Number(agentId),
        include_workers: true,
      })
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: hasConflictIssues(data)
            ? "Verification: conflicts still detected"
            : "Verification: no conflicts detected",
          mode: "scan",
          data,
        },
      ])
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message })
    } finally {
      setChatLoading(false)
    }
  }

  const openTestPanel = async () => {
    setTestPanelOpen(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
        headers: { Authorization: `Token ${Cookies.get("Token") || ""}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setAgentName(data.name || "")
      setAgentNumbers(Array.isArray(data.twilio_phone_numbers) ? data.twilio_phone_numbers : [])
    } catch (err) {
      console.error("Failed to refresh agent before testing:", err)
    }
  }
  
  // Fetch agent name + instructions for header / diff
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
          headers: { Authorization: `Token ${Cookies.get("Token") || ""}` },
        })
        const data = await res.json()
        setAgentName(data.name || "")
        setAgentNumbers(Array.isArray(data.twilio_phone_numbers) ? data.twilio_phone_numbers : [])
        if (data.instructions) setAgentInstructions(data.instructions)
        if (data.guardrail && typeof data.guardrail === "object") setAgentGuardrail(data.guardrail)
      } catch (err) {
        console.error("Failed to fetch agent:", err)
      }
    }
    fetchAgent()
  }, [agentId])

  const renderTabContent = () => {
    switch (activeTab) {
      case "voiceprint":
        return <VoiceprintTab agentId={agentId} />
      case "voice-prompts":
        return <VoicePromptsTab agentId={agentId} />
      case "agent-prompts":
        return <AgentPromptsTab agentId={agentId} />
      case "voice-settings":
        return <VoiceSettingsTab agentId={agentId} />
      case "tools":
        return <ToolsTab agentId={agentId} />
      case "faq":
        return <FAQTab agentId={agentId} />
      case "unanswered":
        return <UnansweredQuestionsPanel agentId={agentId} />
      case "additional-settings":
        return <AdditionalSettingsTab agentId={agentId} />
      default:
        return <VoiceprintTab agentId={agentId} />
    }
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden border-b border-slate-100/50">
        {/* Ambient Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 to-slate-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-slate-900/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-8 py-16 relative">
          {/* Back Button */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/agent-settings')}
              className="group rounded-xl border-slate-200/80 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 font-light"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Agents
            </Button>
          </div>

          {/* Main Header */}
          <div className="flex flex-wrap items-start gap-6">
            {/* Decorative Element */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center shadow-xl">
                <Settings className="w-10 h-10 text-white animate-[spin_20s_linear_infinite]" />
              </div>
            </div>

            {/* Title Section */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-6xl font-extralight tracking-tight text-slate-900 leading-none">
                    Agent Configuration
                  </h1>
                </div>
                <div className="h-1 w-32 bg-gradient-to-r from-slate-900 via-slate-600 to-transparent rounded-full" />
              </div>
              
              {/* Agent Name Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm">
                <div className="relative flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <div className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Configuring</span>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="text-sm font-medium text-slate-900">
                    {agentName || (
                      <span className="text-slate-400 animate-pulse">Loading agent...</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Subtitle */}
              <p className="text-slate-500 font-light text-lg tracking-wide max-w-2xl">
                Fine-tune your agent's behavior, voice, and capabilities with precision controls
              </p>
            </div>

            <Button
              type="button"
              onClick={() => void openTestPanel()}
              className="gap-2 rounded-xl bg-cyan-500 px-5 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400"
            >
              <Phone className="h-4 w-4" />
              Test agent
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="px-8 py-6 bg-white/60 backdrop-blur-md border-b border-slate-100/50 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  router.replace(`/dashboard/agent-settings/${agentId}?tab=${tab.id}`, { scroll: false })
                }}
                style={{ animationDelay: `${index * 50}ms` }}
                className={cn(
                  "relative px-6 py-3.5 text-sm font-light tracking-wide rounded-xl transition-all duration-300 whitespace-nowrap animate-fadeIn",
                  tab.id === activeTab
                    ? "bg-slate-900 text-white shadow-lg scale-105"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80 hover:shadow-md"
                )}
              >
                {tab.id === activeTab && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent rounded-xl" />
                  </>
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.label}
                  {tab.id === activeTab && (
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative min-h-[600px]">
          {/* Ambient Content Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 via-transparent to-slate-50/30 pointer-events-none" />
          <div className="relative">
            {renderTabContent()}
          </div>
        </div>

        {/* Bottom Signature */}
        <div className="px-8 py-16 border-t border-slate-100/50">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs text-slate-400 font-light tracking-wider">
              Powered by SmartConvo
            </p>
          </div>
        </div>
      </div>
    </div>

      {testPanelOpen && (
        <>
          <button
            type="button"
            aria-label="Dismiss test agent overlay"
            onClick={() => setTestPanelOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Test ${agentName || "agent"}`}
            className="fixed inset-y-0 right-0 z-[60] w-full max-w-md shadow-2xl"
          >
            <WorkflowTestPanel
              definition={{
                id: Number(agentId),
                twilio_phone_numbers: agentNumbers,
              }}
              canStart={agentNumbers.length > 0}
              disabledReason="Assign a phone number to this agent before testing."
              title={`Test ${agentName || "agent"}`}
              onClose={() => setTestPanelOpen(false)}
            />
          </div>
        </>
      )}

      {/* ── Functionality Conflict Chat Bubble ── */}
      {/* Floating bubble */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-700 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        title="Check functionality conflicts"
      >
        {chatOpen ? <ChevronDown className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] max-h-[640px] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-slate-900 text-white flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Functionality Checker</p>
              <p className="text-xs text-slate-400">Check for conflicts &amp; repetitions</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: "480px" }}>
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-8">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-center text-slate-400 text-xs font-light leading-relaxed max-w-[240px]">
                  Enter a capability (e.g. <span className="text-slate-600 font-medium">send sms</span>) to scan for conflicts. Use <span className="text-indigo-600 font-medium">Generate fixed prompt</span> when issues are found.
                </p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  /* ── User message card ── */
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm overflow-hidden border border-slate-700 bg-slate-900 text-white">
                    <div className="px-4 pt-3 pb-2">
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-1">Functionality</p>
                      <p className="text-sm font-light break-words">{msg.text}</p>
                    </div>
                    <div className="px-4 pb-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider bg-slate-700/50 text-slate-300 border border-slate-600">
                        {msg.mode === "rewrite" ? (
                          <><Wand2 className="w-2.5 h-2.5" /> fix ({msg.rewriteIntent})</>
                        ) : (
                          <><Search className="w-2.5 h-2.5" /> scan</>
                        )}
                      </span>
                    </div>
                  </div>
                ) : msg.data ? (
                  /* ── Structured assistant response ── */
                  <div className="w-full space-y-2 text-sm">

                    {/* ── Header: Functionality + status badges ── */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                      <div className="px-4 pt-4 pb-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Functionality</p>
                        <p className="text-slate-900 font-medium text-base break-words">"{msg.data.functionality}"</p>
                      </div>
                      <div className="px-4 pb-4 flex flex-wrap gap-2">
                        {msg.data.intent && (
                          <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold border ${
                            msg.data.intent === "add"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {msg.data.intent === "add" ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {msg.data.intent}
                          </span>
                        )}
                        {msg.data.llm_stage && (
                          <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium border bg-indigo-50 text-indigo-600 border-indigo-200">
                            stage: {msg.data.llm_stage}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium border ${hasConflictIssues(msg.data) ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                          {hasConflictIssues(msg.data) ? "⚠️ Conflicts Found" : "✓ No Conflicts"}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium border ${msg.data.has_repetitions ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                          {msg.data.has_repetitions ? "🔁 Repetitions Found" : "✓ No Repetitions"}
                        </span>
                      </div>
                    </div>

                    {/* ── AI Analysis (LLM) ── */}
                    {msg.data.llm?.enabled && (
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">AI Analysis</p>
                        </div>
                        <div className="px-4 py-3 space-y-3">
                          {msg.data.llm.headline && (
                            <p className="text-slate-800 font-light break-words leading-relaxed">{msg.data.llm.headline}</p>
                          )}
                          {(msg.data.llm.conflict_bullets?.length ?? 0) > 0 && (
                            <ul className="space-y-1.5">
                              {msg.data.llm.conflict_bullets!.map((b: string, idx: number) => (
                                <li key={idx} className="flex gap-2 text-xs text-slate-600 font-light break-words">
                                  <span className="text-rose-500 flex-shrink-0 mt-0.5">•</span>{b}
                                </li>
                              ))}
                            </ul>
                          )}
                          {(msg.data.llm.recommendations?.length ?? 0) > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Recommendations</p>
                              <ul className="space-y-1.5">
                                {msg.data.llm.recommendations!.map((r: string, idx: number) => (
                                  <li key={idx} className="flex gap-2 text-xs text-slate-600 font-light break-words">
                                    <span className="text-indigo-400 flex-shrink-0">💡</span>{r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Semantic Analysis ── */}
                    {((msg.data.llm?.semantic_conflicts?.length ?? 0) > 0 || msg.data.llm?.semantic_headline) && (
                      <div className="bg-white border border-rose-200 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-rose-100 bg-rose-50 flex items-start gap-2">
                          <span className="text-rose-500 text-base leading-none mt-0.5">⚡</span>
                          <div>
                            <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest">Semantic conflict</p>
                            {msg.data.llm?.semantic_headline && (
                              <p className="text-rose-700 text-xs font-medium mt-0.5 break-words">{msg.data.llm.semantic_headline}</p>
                            )}
                          </div>
                        </div>

                        {(msg.data.llm?.semantic_conflicts?.length ?? 0) > 0 && (
                          <div className="px-4 py-3 space-y-3">
                            {msg.data.llm!.semantic_conflicts!.map((sc: any, idx: number) => (
                              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <p className="text-xs font-medium text-slate-800 break-words">{sc.agent_name}</p>
                                  <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                                    sc.severity === "high" ? "bg-rose-100 text-rose-600" :
                                    sc.severity === "medium" ? "bg-amber-100 text-amber-600" :
                                    "bg-slate-100 text-slate-500"
                                  }`}>
                                    {sc.severity}
                                  </span>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Line {sc.conflicting_line_number}</p>
                                  <p className="text-xs text-slate-600 font-light italic break-words">"{sc.conflicting_line_text}"</p>
                                </div>
                                <p className="text-xs text-slate-600 font-light break-words leading-relaxed">{sc.reason}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {(msg.data.llm?.semantic_recommendations?.length ?? 0) > 0 && (
                          <div className="px-4 pt-0 pb-3 border-t border-rose-100">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 mt-3">Semantic Recommendations</p>
                            <ul className="space-y-1.5">
                              {msg.data.llm!.semantic_recommendations!.map((r: string, idx: number) => (
                                <li key={idx} className="flex gap-2 text-xs text-slate-600 font-light break-words">
                                  <span className="text-rose-400 flex-shrink-0">→</span>{r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Mentions ── */}
                    {(msg.data.mentions?.length ?? 0) > 0 && (
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                            Mentions ({msg.data.mentions!.length})
                          </p>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {msg.data.mentions!.map((m: any, idx: number) => (
                            <div key={idx} className="px-4 py-3 space-y-1.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs font-medium text-slate-800 break-words">{m.agent_name}</span>
                                <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                                  {m.line_number != null && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">L{m.line_number}</span>
                                  )}
                                  {m.source_type && (
                                    <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-medium">{m.source_type}</span>
                                  )}
                                  {m.polarity && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                      m.polarity === "positive" ? "bg-emerald-50 text-emerald-600" :
                                      m.polarity === "negative" ? "bg-rose-50 text-rose-600" :
                                      "bg-slate-100 text-slate-500"
                                    }`}>
                                      {m.polarity}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 font-light break-words leading-relaxed">{m.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Insertion Plans (add intent) ── */}
                    {msg.data.llm?.insertion_enabled && (msg.data.llm?.insertion_plans?.length ?? 0) > 0 && (
                      <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
                          <Plus className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">Insertion Plan</p>
                            {msg.data.llm.insertion_headline && (
                              <p className="text-emerald-800 text-xs font-medium mt-0.5 break-words">{msg.data.llm.insertion_headline}</p>
                            )}
                          </div>
                        </div>
                        <div className="px-4 py-3 space-y-3">
                          {msg.data.llm!.insertion_plans!.map((plan: any, idx: number) => (
                            <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <p className="text-xs font-medium text-slate-800 break-words">{plan.agent_name}</p>
                                {plan.insert_after_line_number != null && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-mono flex-shrink-0">after L{plan.insert_after_line_number}</span>
                                )}
                              </div>
                              {plan.section_hint && (
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{plan.section_hint}</p>
                              )}
                              <div className="bg-white border border-emerald-200 rounded-lg px-3 py-2">
                                <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-1">Insert</p>
                                <p className="text-xs text-slate-700 font-light break-words leading-relaxed">{plan.rewritten_sentence}</p>
                              </div>
                              {plan.reason && (
                                <p className="text-xs text-slate-500 font-light break-words leading-relaxed">{plan.reason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        {(msg.data.llm.insertion_recommendations?.length ?? 0) > 0 && (
                          <div className="px-4 pb-3 border-t border-emerald-100">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 mt-3">Recommendations</p>
                            <ul className="space-y-1.5">
                              {msg.data.llm.insertion_recommendations!.map((r: string, idx: number) => (
                                <li key={idx} className="flex gap-2 text-xs text-slate-600 font-light break-words">
                                  <span className="text-emerald-500 flex-shrink-0">→</span>{r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Removal Plans (remove intent) ── */}
                    {msg.data.llm?.removal_enabled && (msg.data.llm?.removal_plans?.length ?? 0) > 0 && (
                      <div className="bg-white border border-rose-200 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-rose-100 bg-rose-50 flex items-center gap-2">
                          <Minus className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold text-rose-500 uppercase tracking-widest">Removal Plan</p>
                            {msg.data.llm.removal_headline && (
                              <p className="text-rose-800 text-xs font-medium mt-0.5 break-words">{msg.data.llm.removal_headline}</p>
                            )}
                          </div>
                        </div>
                        <div className="px-4 py-3 space-y-3">
                          {msg.data.llm!.removal_plans!.map((plan: any, idx: number) => (
                            <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                              <p className="text-xs font-medium text-slate-800 break-words">{plan.agent_name}</p>
                              {plan.reason && (
                                <p className="text-xs text-slate-500 font-light break-words leading-relaxed">{plan.reason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        {(msg.data.llm.removal_recommendations?.length ?? 0) > 0 && (
                          <div className="px-4 pb-3 border-t border-rose-100">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 mt-3">Recommendations</p>
                            <ul className="space-y-1.5">
                              {msg.data.llm.removal_recommendations!.map((r: string, idx: number) => (
                                <li key={idx} className="flex gap-2 text-xs text-slate-600 font-light break-words">
                                  <span className="text-rose-400 flex-shrink-0">→</span>{r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Rewrite Plans ── */}
                    {msg.data.llm?.updated_prompts && msg.data.llm.updated_prompts.length > 0 && (
                      <div className="bg-white border border-indigo-200 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-indigo-100 bg-indigo-50">
                          <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Rewritten prompt</p>
                          {msg.data.llm.rewrite_headline && (
                            <p className="text-indigo-800 text-xs font-medium mt-0.5 break-words">{msg.data.llm.rewrite_headline}</p>
                          )}
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          {msg.data.llm.updated_prompts.map((p: any, idx: number) => (
                            <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                              <p className="text-xs font-medium text-slate-800 mb-1 break-words">{p.agent_name}</p>
                              {p.change_summary && (
                                <p className="text-xs text-slate-500 font-light mb-2">{p.change_summary}</p>
                              )}
                              {p.updated_instructions ? (
                                <>
                                  <pre className="text-[11px] text-slate-600 font-mono bg-white border border-slate-200 rounded-lg p-2 max-h-28 overflow-y-auto whitespace-pre-wrap break-words">
                                    {p.updated_instructions.length > 400
                                      ? p.updated_instructions.slice(0, 400) + "…"
                                      : p.updated_instructions}
                                  </pre>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPromptDiff({
                                        oldPrompt: agentInstructions,
                                        newPrompt: p.updated_instructions,
                                        scanData: msg.data,
                                      })
                                      setIsPromptDiffOpen(true)
                                    }}
                                    className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                  >
                                    View diff &amp; apply
                                  </button>
                                </>
                              ) : (
                                <p className="text-xs text-slate-600 font-light break-words leading-relaxed">{typeof p === "string" ? p : JSON.stringify(p)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {((msg.data.conflicts?.length ?? 0) > 0 || (msg.data.repetitions?.length ?? 0) > 0) && (
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        {(msg.data.conflicts?.length ?? 0) > 0 && (
                          <div className="px-4 py-3">
                            <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest mb-2">
                              Conflicts ({msg.data.conflicts!.length})
                            </p>
                            <div className="space-y-2">
                              {msg.data.conflicts!.map((c: FunctionalityConflict, idx: number) => (
                                <ConflictCard key={idx} conflict={c} />
                              ))}
                            </div>
                          </div>
                        )}
                        {(msg.data.repetitions?.length ?? 0) > 0 && (
                          <div className="px-4 py-3 border-t border-slate-100">
                            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-2">Repetitions</p>
                            <ul className="space-y-1.5">
                              {msg.data.repetitions!.map((r: any, idx: number) => (
                                <li key={idx} className="text-xs text-slate-600 font-light break-words">• {typeof r === "string" ? r : JSON.stringify(r)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.mode === "scan" && hasConflictIssues(msg.data) && (
                      <div className="bg-white border border-indigo-200 rounded-2xl p-4 space-y-3">
                        <p className="text-xs text-slate-600 font-light">
                          Generate a full rewritten prompt to resolve conflicts safely.
                        </p>
                        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setFixIntent("remove")}
                            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                              fixIntent === "remove" ? "bg-rose-500 text-white" : "bg-white text-slate-500"
                            }`}
                          >
                            Remove feature
                          </button>
                          <button
                            type="button"
                            onClick={() => setFixIntent("add")}
                            className={`flex-1 py-2 text-xs font-semibold border-l border-slate-200 transition-colors ${
                              fixIntent === "add" ? "bg-emerald-600 text-white" : "bg-white text-slate-500"
                            }`}
                          >
                            Add feature
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={rewriteLoading}
                          onClick={() =>
                            generateFixedPrompt(msg.data?.functionality || "", fixIntent)
                          }
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {rewriteLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Wand2 className="w-4 h-4" />
                          )}
                          Generate fixed prompt
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback plain text */
                  <div className="w-full px-4 py-3 rounded-2xl rounded-bl-md text-sm font-light bg-slate-100 text-slate-800 break-words whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            {(chatLoading || rewriteLoading) && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-slate-100 px-3 pt-3 pb-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatFunctionality}
                onChange={(e) => setChatFunctionality(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && runConflictScan()}
                placeholder="e.g. send sms"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-light focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 bg-slate-50"
                disabled={chatLoading || rewriteLoading}
              />
              <button
                onClick={runConflictScan}
                disabled={chatLoading || rewriteLoading || !chatFunctionality.trim()}
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-700 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                title="Scan for conflicts"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {chatMounted && isPromptDiffOpen && promptDiff && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => { setIsPromptDiffOpen(false); setPromptDiff(null) }}
        >
          <motion.div
            className="relative w-full max-w-3xl flex flex-col rounded-2xl overflow-hidden border border-white/[0.08]"
            style={{ background: "#0d1117", maxHeight: "80vh", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white font-medium text-sm">Prompt changes</span>
              </div>
              <button
                onClick={() => { setIsPromptDiffOpen(false); setPromptDiff(null) }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto font-mono text-xs flex-1 max-h-[50vh]">
              {diffPromptLines(promptDiff.oldPrompt, promptDiff.newPrompt).map((ln, idx) => (
                <div
                  key={idx}
                  className={`flex min-w-0 ${
                    ln.type === "remove"
                      ? "bg-rose-500/[0.08]"
                      : ln.type === "add"
                      ? "bg-emerald-500/[0.08]"
                      : ""
                  }`}
                >
                  <span className={`w-6 text-center py-0.5 shrink-0 ${
                    ln.type === "remove" ? "text-rose-400" : ln.type === "add" ? "text-emerald-400" : "text-slate-700"
                  }`}>
                    {ln.type === "remove" ? "-" : ln.type === "add" ? "+" : " "}
                  </span>
                  <span className={`px-2 py-0.5 whitespace-pre-wrap break-all leading-5 flex-1 ${
                    ln.type === "remove" ? "text-rose-300" : ln.type === "add" ? "text-emerald-300" : "text-slate-400"
                  }`}>
                    {ln.line || " "}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.07] shrink-0">
              <button
                onClick={() => { setIsPromptDiffOpen(false); setPromptDiff(null) }}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyRewrittenPrompt}
                disabled={applyLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
              >
                {applyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Apply to agent
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  )
}
