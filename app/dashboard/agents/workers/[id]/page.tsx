// "use client"

// import { useEffect, useState } from "react"
// import { useParams } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Dialog, DialogTrigger } from "@/components/ui/dialog"
// import { Switch } from "@/components/ui/switch"
// import { Label } from "@/components/ui/label"
// import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// import { useToast } from "@/hooks/use-toast"
// import { Plus, Trash2, Loader2, Bot, Settings, FileText } from "lucide-react"
// import Cookies from "js-cookie"

// interface Worker {
//   id: number
//   name: string
//   status: "Active" | "Inactive"
//   role: string
//   persona: string
// }

// interface Agent {
//   id: number
//   name: string
//   status: "Active" | "Inactive"
//   persona: string
//   primary: boolean
//   worker_agents: Worker[]
// }

// export default function WorkersPage() {
//   const { id } = useParams()
//   const [workers, setWorkers] = useState<Worker[]>([])
//   const [agent, setAgent] = useState<Agent | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [expandedPersonas, setExpandedPersonas] = useState<Set<number>>(new Set())
//   const { toast } = useToast()

//   const fetchAgent = () => {
//     setLoading(true)
//     fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/${id}/`, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Token ${Cookies.get("Token") || ""}`,
//       },
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         const enrichedAgent: Agent = {
//           id: data.id,
//           name: data.name,
//           status: data.status === "Active" || data.status === "active" ? "Active" : "Inactive",
//           persona: data.persona || "Unknown",
//           primary: data.primary || false,
//           worker_agents: Array.isArray(data.worker_agents)
//             ? data.worker_agents.map((w: any) => ({
//                 id: w.id,
//                 name: w.name,
//                 status: w.status === "Active" ? "Active" : "Inactive",
//                 role: w.role || "Support Agent",
//                 persona: w.persona || "Unknown",
//               }))
//             : [],
//         }
//         setAgent(enrichedAgent)
//         setWorkers(enrichedAgent.worker_agents)
//       })
//       .catch(() =>
//         toast({ title: "Error", description: "Failed to fetch agent details", variant: "destructive" })
//       )
//       .finally(() => setLoading(false))
//   }

//   useEffect(() => {
//     fetchAgent()
//   }, [id])

//   const handleToggleWorker = async (workerId: number) => {
//     const workerToUpdate = workers.find((w) => w.id === workerId)
//     if (!workerToUpdate) return

//     const newStatus = workerToUpdate.status === "Active" ? "Inactive" : "Active"
//     setWorkers((prev) => prev.map((w) => (w.id === workerId ? { ...w, status: newStatus } : w)))

//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/${id}/workers/${workerId}/`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Token ${Cookies.get("Token") || ""}`,
//         },
//         body: JSON.stringify({ status: newStatus.toLowerCase() }),
//       })
//       if (!res.ok) throw new Error("Failed")
//       toast({ title: "Worker Updated", description: `Status set to ${newStatus}.` })
//     } catch {
//       // rollback
//       setWorkers((prev) => prev.map((w) => (w.id === workerId ? { ...w, status: workerToUpdate.status } : w)))
//       toast({ title: "Error", description: "Failed to update worker", variant: "destructive" })
//     }
//   }

//   const handleDeleteWorker = async (workerId: number) => {
//     if (!window.confirm("Delete this worker?")) return
//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/${id}/workers/${workerId}/`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Token ${Cookies.get("Token") || ""}`,
//         },
//       })
//       if (res.ok) {
//         setWorkers((prev) => prev.filter((w) => w.id !== workerId))
//         toast({ title: "Worker Deleted", description: "Worker removed successfully.", variant: "destructive" })
//       } else throw new Error()
//     } catch {
//       toast({ title: "Error", description: "Failed to delete worker", variant: "destructive" })
//     }
//   }

//   const togglePersonaExpansion = (workerId: number) => {
//     setExpandedPersonas((prev) => {
//       const newSet = new Set(prev)
//       newSet.has(workerId) ? newSet.delete(workerId) : newSet.add(workerId)
//       return newSet
//     })
//   }

//   const truncatePersona = (persona: string, maxLength = 60) =>
//     persona.length <= maxLength ? persona : persona.substring(0, maxLength) + "..."

//   return (
//     <div className="min-h-screen bg-white text-gray-900 font-[Poppins]">
//       <div className="container mx-auto px-6 py-14 max-w-7xl">
//         {/* Cinematic Header */}
//         <div className="mb-14 text-center space-y-4">
//           <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-sm">
//             {agent ? `${agent.name} Agent Page` : "Agent Page"}
//           </h1>
//           <p className="text-lg text-gray-600">
//             Manage and monitor worker agents linked to this primary agent.
//           </p>
//         </div>

//         {/* Add Worker Button */}
//         <div className="flex justify-center mb-12">
//           <Dialog>
//             <DialogTrigger asChild>
//               <Button
//                 size="lg"
//                 className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-base font-semibold shadow-md hover:shadow-xl transition-all duration-300 rounded-xl"
//               >
//                 <Plus className="w-5 h-5 mr-2" />
//                 Add Worker
//               </Button>
//             </DialogTrigger>
//           </Dialog>
//         </div>

//         {/* Workers Grid */}
//         {loading ? (
//           <div className="flex justify-center items-center py-20">
//             <Loader2 className="w-12 h-12 text-gray-500 animate-spin" />
//           </div>
//         ) : workers.length === 0 ? (
//           <Card className="bg-gray-50 border-2 border-dashed border-gray-200 shadow-sm">
//             <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
//               <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
//                 <Bot className="w-10 h-10 text-gray-500" />
//               </div>
//               <h3 className="text-xl font-semibold mb-2">No workers found</h3>
//               <p className="text-gray-500 max-w-md">
//                 Start by adding your first worker agent. Click <span className="font-medium">“Add Worker”</span> above.
//               </p>
//             </CardContent>
//           </Card>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {workers.map((worker) => (
//               <Card
//                 key={worker.id}
//                 className="group bg-white border border-gray-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden"
//               >
//                 <CardHeader className="pb-4">
//                   <div className="flex items-start justify-between">
//                     <div className="flex items-center space-x-3 flex-1 min-w-0">
//                       <Avatar className="w-12 h-12 bg-black text-white flex-shrink-0">
//                         <AvatarFallback className="bg-black text-white font-semibold">
//                           {worker.name.charAt(0).toUpperCase()}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div className="min-w-0 flex-1">
//                         <CardTitle className="text-lg font-semibold truncate">
//                           {worker.name}
//                         </CardTitle>
//                         <p className="text-sm text-gray-500">{worker.role}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       {/* Settings */}
//                       <Button
//                         size="icon"
//                         variant="ghost"
//                         className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg h-6 w-6"
//                         title="Settings"
//                       >
//                         <Settings className="h-3 w-3" />
//                       </Button>

//                       {/* Delete */}
//                       <Button
//                         size="icon"
//                         variant="ghost"
//                         onClick={() => handleDeleteWorker(worker.id)}
//                         className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg h-6 w-6"
//                         title="Delete Worker"
//                       >
//                         <Trash2 className="h-3 w-3" />
//                       </Button>
//                     </div>
//                   </div>
//                 </CardHeader>

//                 <CardContent className="pt-0 space-y-4">
//                   {/* Status */}
//                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
//                     <div className="flex items-center space-x-3">
//                       <div
//                         className={`w-3 h-3 rounded-full ${
//                           worker.status === "Active" ? "bg-green-500" : "bg-gray-400"
//                         }`}
//                       />
//                       <Label className="text-sm font-medium">{worker.status}</Label>
//                     </div>
//                     <Switch
//                       checked={worker.status === "Active"}
//                       onCheckedChange={() => handleToggleWorker(worker.id)}
//                       className="data-[state=checked]:bg-green-600"
//                     />
//                   </div>

//                   {/* Details */}
//                   <div className="space-y-3 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-gray-500">Worker ID</span>
//                       <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
//                         #{worker.id}
//                       </Badge>
//                     </div>
//                     <div className="space-y-2">
//                       <div className="flex items-center justify-between">
//                         <span className="text-gray-500">Persona</span>
//                         <FileText className="w-4 h-4 text-gray-400" />
//                       </div>
//                       <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-black">
//                         <p className="text-sm leading-relaxed text-gray-800">
//                           {expandedPersonas.has(worker.id)
//                             ? worker.persona
//                             : truncatePersona(worker.persona)}
//                         </p>
//                         {worker.persona.length > 60 && (
//                           <button
//                             onClick={() => togglePersonaExpansion(worker.id)}
//                             className="mt-2 text-xs text-black hover:text-gray-700 font-medium transition-colors"
//                           >
//                             {expandedPersonas.has(worker.id) ? "Show less" : "Read more"}
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Settings, Phone, Activity, FileText, Plus, Trash2, Wrench, CheckCircle2, Circle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import Cookies from "js-cookie"

const DEFAULT_TOOLS = ["send_sms", "send_email", "end_call", "transfer_call"] as const
type DefaultTool = typeof DEFAULT_TOOLS[number]

interface WorkerAgent {
  id: number
  name: string
  description: string | null
  status: string
  is_active: boolean
  voice_id: string
  instructions: string
  primary: boolean
  type: string
  twilio_phone_numbers: string[]
  include_default_tools: boolean
  default_tool_names: string[]
  tool_scope: string
}

interface AgentData {
  id: number
  name: string
  status: string
  primary: boolean
  worker_agents: WorkerAgent[]
}

interface AvailableAgent {
  id: number
  name: string
  status: string
  primary: boolean
}

export default function WorkerAgentsDetailPage() {
  const [agentData, setAgentData] = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedInstructions, setExpandedInstructions] = useState<Set<number>>(new Set())
  const [addWorkerDialogOpen, setAddWorkerDialogOpen] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<AvailableAgent[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingWorkers, setUpdatingWorkers] = useState(false)
  // Add-worker tool config
  const [selectedWorkerForAdd, setSelectedWorkerForAdd] = useState<AvailableAgent | null>(null)
  const [addIncludeDefaultTools, setAddIncludeDefaultTools] = useState(false)
  const [addSelectedTools, setAddSelectedTools] = useState<string[]>([])
  // Edit-tools state
  const [editToolsDialogOpen, setEditToolsDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<WorkerAgent | null>(null)
  const [editIncludeDefaultTools, setEditIncludeDefaultTools] = useState(false)
  const [editSelectedTools, setEditSelectedTools] = useState<string[]>([])
  const [updatingTools, setUpdatingTools] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const agentId = params?.id as string

  useEffect(() => {
    if (agentId) {
      fetchAgentData()
    }
  }, [agentId])

  const fetchAgentData = async () => {
    setLoading(true)
    try {
      // Fetch parent agent and flat agent list in parallel
      const [parentRes, allRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        }),
      ])

      if (!parentRes.ok) throw new Error("Failed to fetch agent data")

      const data = await parentRes.json()
      const allData = await allRes.json()

      // Build a status lookup map from the flat list (this is the authoritative source)
      const statusMap: Record<number, string> = {}
      if (Array.isArray(allData)) {
        allData.forEach((a: any) => {
          statusMap[a.id] =
            a.status === "Active" || a.status === "active" ? "active" : "inactive"
        })
      }

      // Merge accurate status into each nested worker_agent
      const enriched = {
        ...data,
        worker_agents: Array.isArray(data.worker_agents)
          ? data.worker_agents.map((w: any) => ({
              ...w,
              status: statusMap[w.id] ?? w.status ?? "inactive",
            }))
          : [],
      }

      setAgentData(enriched)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch agent data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableAgents = async () => {
    setLoadingAvailable(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
      })
      const data = await res.json()
      
      if (!agentData) return

      // Filter out: current agent, already assigned workers, and non-primary agents
      const currentWorkerIds = agentData.worker_agents.map(w => w.id)
      const filtered = Array.isArray(data)
        ? data.filter((agent: any) => 
            agent.id !== parseInt(agentId) && 
            !currentWorkerIds.includes(agent.id)
          ).map((agent: any) => ({
            id: agent.id,
            name: agent.name,
            status: agent.status,
            primary: agent.primary || false,
          }))
        : []
      
      setAvailableAgents(filtered)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch available agents",
        variant: "destructive",
      })
    } finally {
      setLoadingAvailable(false)
    }
  }

const handleAddWorker = async (workerId: number, includeDefaultTools: boolean, selectedTools: string[]) => {
    if (!agentData) return

    setUpdatingWorkers(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${workerId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({
          parent: agentId,
          include_default_tools: includeDefaultTools,
          default_tool_names: includeDefaultTools ? selectedTools : [],
          tool_scope: includeDefaultTools ? "default_worker" : "standard",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMessage = data?.detail || data?.error || "Failed to add worker agent"
        throw new Error(errorMessage)
      }

      toast({
        title: "Worker Added",
        description: data?.message || "Worker agent has been successfully added",
      })

      await fetchAgentData()
      setAddWorkerDialogOpen(false)
      setSelectedWorkerForAdd(null)
      setAddIncludeDefaultTools(false)
      setAddSelectedTools([])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add worker agent",
        variant: "destructive",
      })
    } finally {
      setUpdatingWorkers(false)
    }
  }

  const handleUpdateWorkerTools = async () => {
    if (!editingWorker) return
    setUpdatingTools(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${editingWorker.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({
          include_default_tools: editIncludeDefaultTools,
          default_tool_names: editIncludeDefaultTools ? editSelectedTools : [],
          tool_scope: editIncludeDefaultTools ? "default_worker" : "standard",
        }),
      })

      if (!res.ok) throw new Error("Failed to update tools")

      setAgentData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          worker_agents: prev.worker_agents.map((w) =>
            w.id === editingWorker.id
              ? {
                  ...w,
                  include_default_tools: editIncludeDefaultTools,
                  default_tool_names: editIncludeDefaultTools ? editSelectedTools : [],
                  tool_scope: editIncludeDefaultTools ? "default_worker" : "standard",
                }
              : w
          ),
        }
      })

      toast({ title: "Tools Updated", description: "Worker tools have been updated successfully" })
      setEditToolsDialogOpen(false)
    } catch {
      toast({ title: "Error", description: "Failed to update tools", variant: "destructive" })
    } finally {
      setUpdatingTools(false)
    }
  }

  const openEditToolsDialog = (worker: WorkerAgent) => {
    setEditingWorker(worker)
    setEditIncludeDefaultTools(worker.include_default_tools ?? false)
    setEditSelectedTools(worker.default_tool_names ?? [])
    setEditToolsDialogOpen(true)
  }

  const toggleTool = (tool: string, selected: string[], setSelected: (t: string[]) => void) => {
    setSelected(selected.includes(tool) ? selected.filter((t) => t !== tool) : [...selected, tool])
  }

  const handleRemoveWorker = async (workerId: number) => {
    if (!agentData) return
    if (!window.confirm("Are you sure you want to remove this worker agent?")) return

    setUpdatingWorkers(true)
    try {
      // Remove the parent by setting it to null
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${workerId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({
          parent: "",
        }),
      })

      if (!res.ok) throw new Error("Failed to remove worker agent")

      toast({
        title: "Worker Removed",
        description: "Worker agent has been successfully removed",
        variant: "destructive",
      })

      // Refresh agent data
      await fetchAgentData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove worker agent",
        variant: "destructive",
      })
    } finally {
      setUpdatingWorkers(false)
    }
  }

  const toggleInstructions = (workerId: number) => {
    setExpandedInstructions((prev) => {
      const newSet = new Set(prev)
      newSet.has(workerId) ? newSet.delete(workerId) : newSet.add(workerId)
      return newSet
    })
  }

  const truncateText = (text: string, maxLength = 150) => {
    return text.length <= maxLength ? text : text.substring(0, maxLength) + "..."
  }

  const openAddWorkerDialog = () => {
    setSearchQuery("")
    setSelectedWorkerForAdd(null)
    setAddIncludeDefaultTools(false)
    setAddSelectedTools([])
    fetchAvailableAgents()
    setAddWorkerDialogOpen(true)
  }

  const filteredAvailableAgents = availableAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (!agentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Card className="bg-white border-0 shadow-sm max-w-md">
          <CardContent className="text-center py-12">
            <p className="text-slate-500 font-light">Agent not found</p>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeWorkers = agentData.worker_agents.filter((w) => w.status === "active").length
  const totalWorkers = agentData.worker_agents.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 text-slate-600 hover:text-slate-900 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agents
          </Button>

          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 bg-slate-900">
                  <AvatarFallback className="bg-slate-900 text-white font-light text-2xl">
                    {agentData.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-4xl font-light tracking-tight text-slate-900">
                    {agentData.name}
                  </h1>
                  <p className="text-slate-500 font-light mt-1">Primary Agent</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {agentData.primary && (
                  <Badge variant="outline" className="text-sm font-light border-slate-300">
                    Primary
                  </Badge>
                )}
                <Button
                  onClick={openAddWorkerDialog}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={updatingWorkers}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Worker Agent
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-12 bg-slate-900 rounded-full" />
                <div>
                  <p className="text-3xl font-light text-slate-900">{totalWorkers}</p>
                  <p className="text-sm text-slate-500">Total Workers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-12 bg-emerald-500 rounded-full" />
                <div>
                  <p className="text-3xl font-light text-slate-900">{activeWorkers}</p>
                  <p className="text-sm text-slate-500">Active Workers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-12 bg-slate-400 rounded-full" />
                <div>
                  <p className="text-3xl font-light text-slate-900">{totalWorkers - activeWorkers}</p>
                  <p className="text-sm text-slate-500">Inactive Workers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Worker Agents Grid */}
        {agentData.worker_agents.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-light text-slate-700 mb-2">No Worker Agents</h3>
              <p className="text-slate-500 font-light mb-6">
                This agent doesn't have any worker agents assigned yet
              </p>
              <Button
                onClick={openAddWorkerDialog}
                variant="outline"
                className="border-slate-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Worker
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agentData.worker_agents.map((worker) => (
              <Card
                key={worker.id}
                className="group bg-white border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg overflow-hidden"
              >
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-12 h-12 bg-slate-900 flex-shrink-0">
                        <AvatarFallback className="bg-slate-900 text-white font-light">
                          {worker.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-light text-slate-900 truncate">
                          {worker.name}
                        </CardTitle>
                        <p className="text-sm text-slate-500 font-light">{worker.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditToolsDialog(worker)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-violet-600"
                        title="Edit tools"
                      >
                        <Wrench className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/agent-settings/${worker.id}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-900"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveWorker(worker.id)}
                        disabled={updatingWorkers}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Activity Status */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg w-fit">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        worker.status === "active" || worker.status === "Active"
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                    />
                    <span className={`text-xs font-medium ${
                      worker.status === "active" || worker.status === "Active"
                        ? "text-emerald-700"
                        : "text-slate-500"
                    }`}>
                      {worker.status === "active" || worker.status === "Active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-light">Worker ID</span>
                      <span className="text-slate-700 font-mono text-xs">#{worker.id}</span>
                    </div>

                    {(worker.twilio_phone_numbers ?? []).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="w-4 h-4" />
                          <span className="font-light">Phone Numbers</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(worker.twilio_phone_numbers ?? []).map((phone, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs font-mono font-light border-slate-300"
                            >
                              {phone}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    {worker.instructions && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500">
                          <FileText className="w-4 h-4" />
                          <span className="font-light">Instructions</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 border-l-2 border-slate-900">
                          <p className="text-sm text-slate-700 leading-relaxed font-light whitespace-pre-wrap">
                            {expandedInstructions.has(worker.id)
                              ? worker.instructions
                              : truncateText(worker.instructions)}
                          </p>
                          {worker.instructions.length > 150 && (
                            <button
                              onClick={() => toggleInstructions(worker.id)}
                              className="mt-2 text-xs text-slate-600 hover:text-slate-900 font-light transition-colors"
                            >
                              {expandedInstructions.has(worker.id) ? "Show less" : "Read more"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Default Tools */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Wrench className="w-4 h-4" />
                          <span className="font-light">Default Tools</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            worker.include_default_tools
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {worker.include_default_tools ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                      {worker.include_default_tools && (worker.default_tool_names ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(worker.default_tool_names ?? []).map((tool) => (
                            <span
                              key={tool}
                              className="text-xs font-mono px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                      {worker.include_default_tools && (worker.default_tool_names ?? []).length === 0 && (
                        <p className="text-xs text-amber-600 font-light">No tools selected — click the wrench icon to assign tools.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Worker Dialog */}
        <Dialog open={addWorkerDialogOpen} onOpenChange={(o) => { if (!o) { setSelectedWorkerForAdd(null); setAddIncludeDefaultTools(false); setAddSelectedTools([]) } setAddWorkerDialogOpen(o) }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-light text-slate-900">
                {selectedWorkerForAdd ? "Configure Worker Tools" : "Add Worker Agent"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-light">
                {selectedWorkerForAdd
                  ? `Configure tool access for ${selectedWorkerForAdd.name}`
                  : `Select an agent to add as a worker to ${agentData.name}`}
              </DialogDescription>
            </DialogHeader>

            {!selectedWorkerForAdd ? (
              <>
                {/* Step 1 — pick agent */}
                <div className="py-3">
                  <Input
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border-slate-200"
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {loadingAvailable ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    </div>
                  ) : filteredAvailableAgents.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-500 font-light">
                        {searchQuery ? "No agents found" : "No available agents to add"}
                      </p>
                    </div>
                  ) : (
                    filteredAvailableAgents.map((agent) => (
                      <Card
                        key={agent.id}
                        className="group bg-white border-slate-200 hover:border-slate-400 transition-all duration-200 cursor-pointer"
                        onClick={() => setSelectedWorkerForAdd(agent)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="w-10 h-10 bg-slate-900">
                                <AvatarFallback className="bg-slate-900 text-white font-light text-sm">
                                  {agent.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{agent.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    agent.status === "active" || agent.status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                                  }`} />
                                  <span className="text-xs text-slate-500">{agent.status}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400 group-hover:text-slate-700 transition-colors">Select →</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddWorkerDialogOpen(false)}>Cancel</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                {/* Step 2 — configure tools */}
                <div className="flex-1 overflow-y-auto space-y-6 py-2">
                  {/* Selected agent recap */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <Avatar className="w-9 h-9 bg-slate-900 flex-shrink-0">
                      <AvatarFallback className="bg-slate-900 text-white text-sm font-light">
                        {selectedWorkerForAdd.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{selectedWorkerForAdd.name}</p>
                      <p className="text-xs text-slate-500">{selectedWorkerForAdd.status}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedWorkerForAdd(null); setAddIncludeDefaultTools(false); setAddSelectedTools([]) }}
                      className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  {/* Include default tools toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${addIncludeDefaultTools ? "bg-violet-100" : "bg-slate-100"}`}>
                        <Wrench className={`w-4 h-4 ${addIncludeDefaultTools ? "text-violet-600" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Include default tools</p>
                        <p className="text-xs text-slate-500 font-light">Grant this worker access to built-in tools</p>
                      </div>
                    </div>
                    <Switch
                      checked={addIncludeDefaultTools}
                      onCheckedChange={(v) => { setAddIncludeDefaultTools(v); if (!v) setAddSelectedTools([]) }}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </div>

                  {/* Tool chips */}
                  {addIncludeDefaultTools && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Select tools</p>
                      <div className="grid grid-cols-2 gap-2">
                        {DEFAULT_TOOLS.map((tool) => {
                          const isSelected = addSelectedTools.includes(tool)
                          return (
                            <button
                              key={tool}
                              onClick={() => toggleTool(tool, addSelectedTools, setAddSelectedTools)}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                                isSelected
                                  ? "border-violet-500 bg-violet-50"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              {isSelected
                                ? <CheckCircle2 className="w-4 h-4 text-violet-600 flex-shrink-0" />
                                : <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                              <span className={`text-sm font-mono ${isSelected ? "text-violet-700 font-medium" : "text-slate-600"}`}>
                                {tool}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      {addSelectedTools.length === 0 && (
                        <p className="text-xs text-amber-600 px-1">Select at least one tool, or disable the toggle.</p>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => { setSelectedWorkerForAdd(null); setAddIncludeDefaultTools(false); setAddSelectedTools([]) }} disabled={updatingWorkers}>
                    Back
                  </Button>
                  <Button
                    onClick={() => handleAddWorker(selectedWorkerForAdd.id, addIncludeDefaultTools, addSelectedTools)}
                    disabled={updatingWorkers || (addIncludeDefaultTools && addSelectedTools.length === 0)}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {updatingWorkers ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Worker
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Tools Dialog */}
        {editingWorker && (
          <Dialog open={editToolsDialogOpen} onOpenChange={setEditToolsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-light text-slate-900">Edit Tools</DialogTitle>
                <DialogDescription className="text-slate-500 font-light">
                  Update default tool access for <span className="font-medium text-slate-800">{editingWorker.name}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Toggle */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${editIncludeDefaultTools ? "bg-violet-100" : "bg-slate-100"}`}>
                      <Wrench className={`w-4 h-4 ${editIncludeDefaultTools ? "text-violet-600" : "text-slate-400"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Include default tools</p>
                      <p className="text-xs text-slate-500 font-light">Grant access to built-in tools</p>
                    </div>
                  </div>
                  <Switch
                    checked={editIncludeDefaultTools}
                    onCheckedChange={(v) => { setEditIncludeDefaultTools(v); if (!v) setEditSelectedTools([]) }}
                    className="data-[state=checked]:bg-violet-600"
                  />
                </div>

                {/* Tool chips */}
                {editIncludeDefaultTools && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Select tools</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DEFAULT_TOOLS.map((tool) => {
                        const isSelected = editSelectedTools.includes(tool)
                        return (
                          <button
                            key={tool}
                            onClick={() => toggleTool(tool, editSelectedTools, setEditSelectedTools)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                              isSelected
                                ? "border-violet-500 bg-violet-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            {isSelected
                              ? <CheckCircle2 className="w-4 h-4 text-violet-600 flex-shrink-0" />
                              : <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                            <span className={`text-sm font-mono ${isSelected ? "text-violet-700 font-medium" : "text-slate-600"}`}>
                              {tool}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {editSelectedTools.length === 0 && (
                      <p className="text-xs text-amber-600">Select at least one tool, or disable the toggle.</p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditToolsDialogOpen(false)} disabled={updatingTools}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateWorkerTools}
                  disabled={updatingTools || (editIncludeDefaultTools && editSelectedTools.length === 0)}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {updatingTools ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-slate-200">
          <div className="text-center">
            <p className="text-sm text-slate-400 font-light">© {new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </div>
    </div>
  )
}