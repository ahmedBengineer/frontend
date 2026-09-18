// "use client"

// import { useEffect, useState } from "react"
// import { useSearchParams, useRouter } from "next/navigation"
// import { useToast } from "@/hooks/use-toast"
// import Cookies from "js-cookie"
// import { Card, CardContent } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Switch } from "@/components/ui/switch"
// import { Slider } from "@/components/ui/slider"

// // shadcn searchable dropdown
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover"
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
// } from "@/components/ui/command"

// // Separate model groups
// const AVAILABLE_MODELS = {
//   llm: ["gpt-4", "gpt-3.5-turbo", "claude-3", "llama-2-70b", "mistral-7b"],
//   stt: ["whisper-1", "deepgram-stt"],
//   tts: ["coqui-tts"],
// }

// export default function CompanyAgentsPage() {
//   const [agents, setAgents] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
//   const [agentConfig, setAgentConfig] = useState<any>(null)
//   const { toast } = useToast()
//   const searchParams = useSearchParams()
//   const router = useRouter()
//   const companyId = searchParams.get("companyId")

//   // Fetch agents (already includes configs)
//   useEffect(() => {
//     const fetchAgents = async () => {
//       setLoading(true)
//       const token = Cookies.get("adminToken")
//       try {
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`,
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Token ${token || ""}`,
//             },
//           }
//         )
//         const data = await res.json()
//         let fetchedAgents: any[] = []

//         if (Array.isArray(data)) fetchedAgents = data
//         else if (Array.isArray(data.results)) fetchedAgents = data.results

//         if (companyId) {
//           fetchedAgents = fetchedAgents.filter(
//             (a) => String(a.company) === String(companyId)
//           )
//         }

//         setAgents(fetchedAgents)
//       } catch (err) {
//         console.error("Failed to fetch agents", err)
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Failed to load agents",
//         })
//       } finally {
//         setLoading(false)
//       }
//     }
//     if (companyId) fetchAgents()
//   }, [companyId, toast])

//   // When selecting an agent, grab its config
//   const openConfig = (agent: any) => {
//     setSelectedAgentId(agent.id)
//     setAgentConfig(agent.agent_config || {})
//   }

//   // Update field value
//   const handleChange = (path: string[], value: any) => {
//     setAgentConfig((prev: any) => {
//       const updated = { ...prev }
//       let obj = updated
//       for (let i = 0; i < path.length - 1; i++) {
//         obj = obj[path[i]]
//       }
//       obj[path[path.length - 1]] = value
//       return updated
//     })
//   }

//   // Save config
//   const handleSave = async () => {
//     const token = Cookies.get("adminToken")
//     if (!selectedAgentId) return
//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${selectedAgentId}/`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${token || ""}`,
//           },
//           body: JSON.stringify({ agent_config: agentConfig }),
//         }
//       )

//       if (!res.ok) throw new Error("Failed to save agent config")

//       toast({
//         title: "Success",
//         description: "Agent config saved successfully.",
//       })
//     } catch (err: any) {
//       toast({ title: "Error", description: err.message })
//     }
//   }

//   // Render dynamic form fields
//   const renderField = (path: string[], key: string, value: any) => {
//     const fullPath = [...path, key]

//     // Handle model dropdown for llm, stt, tts
//     if (key === "model" && ["llm", "stt", "tts"].includes(path[0])) {
//       const category = path[0] as "llm" | "stt" | "tts"
//       return (
//         <div
//           key={fullPath.join(".")}
//           className="p-4 bg-white rounded-xl shadow-sm border space-y-2"
//         >
//           <Label className="block text-slate-700 font-semibold">{key}</Label>
//           <Popover modal={true}>
//             <PopoverTrigger asChild>
//               <Button variant="outline" className="w-full justify-between">
//                 {value || "Select a model"}
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-[300px] p-0">
//               <Command>
//                 <CommandInput placeholder="Search models..." />
//                 <CommandEmpty>No model found.</CommandEmpty>
//                 <CommandGroup>
//                   {AVAILABLE_MODELS[category].map((m) => (
//                     <CommandItem
//                       key={m}
//                       onSelect={() => handleChange(fullPath, m)}
//                     >
//                       {m}
//                     </CommandItem>
//                   ))}
//                 </CommandGroup>
//               </Command>
//             </PopoverContent>
//           </Popover>
//         </div>
//       )
//     }

//     if (typeof value === "boolean") {
//       return (
//         <div
//           key={fullPath.join(".")}
//           className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl shadow-sm"
//         >
//           <Label className="text-slate-700 font-medium">{key}</Label>
//           <Switch
//             checked={value}
//             onCheckedChange={(val) => handleChange(fullPath, val)}
//           />
//         </div>
//       )
//     }

//     if (typeof value === "number") {
//       return (
//         <div
//           key={fullPath.join(".")}
//           className="p-4 bg-white rounded-xl shadow-sm border space-y-3"
//         >
//           <Label className="block text-slate-700 font-semibold">{key}</Label>
//           <Slider
//             value={[value]}
//             min={0}
//             max={100}
//             step={0.1}
//             onValueChange={(val) => handleChange(fullPath, val[0])}
//             className="w-full"
//           />
//           <div className="text-right text-xs text-slate-500">
//             Current: {value}
//           </div>
//         </div>
//       )
//     }

//     if (typeof value === "string" || value === null) {
//       return (
//         <div
//           key={fullPath.join(".")}
//           className="p-4 bg-white rounded-xl shadow-sm border space-y-2"
//         >
//           <Label className="block text-slate-700 font-semibold">{key}</Label>
//           <Input
//             value={value || ""}
//             placeholder="Enter value"
//             className="border-slate-300 focus:border-indigo-500 focus:ring-blue-500 rounded-xl"
//             onChange={(e) => handleChange(fullPath, e.target.value)}
//           />
//         </div>
//       )
//     }

//     if (typeof value === "object" && value !== null) {
//       // Reorder: provider first if exists
//       const entries = Object.entries(value)
//       const reordered = [
//         ...entries.filter(([subKey]) => subKey === "provider"),
//         ...entries.filter(([subKey]) => subKey !== "provider"),
//       ]

//       return (
//         <div
//           key={fullPath.join(".")}
//           className="p-6 bg-gradient-to-br from-slate-50 to-white border rounded-2xl shadow-md space-y-5"
//         >
//           <h4 className="text-lg font-semibold text-slate-800 tracking-tight capitalize">
//             {key}
//           </h4>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {reordered.map(([subKey, subVal]) =>
//               renderField(fullPath, subKey, subVal)
//             )}
//           </div>
//         </div>
//       )
//     }


//     return null
//   }

//   return (
//     <div className="space-y-8">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
//           Agents for Company #{companyId}
//         </h1>
//         <Button
//           variant="ghost"
//           className="hover:bg-slate-100 transition"
//           onClick={() => router.push("/admin/dashboard/agent-settings")}
//         >
//           ← Back
//         </Button>
//       </div>

//       {/* Loader */}
//       {loading ? (
//         <div className="flex justify-center items-center h-40">
//           <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
//         </div>
//       ) : agents.length > 0 ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
//           {agents.map((agent) => (
//             <Card
//               key={agent.id}
//               className="group relative hover:shadow-2xl transition-all rounded-2xl"
//             >
//               <CardContent className="p-8 flex flex-col items-center space-y-4 text-center">
//                 {/* Avatar */}
//                 <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl shadow-lg">
//                   🤖
//                 </div>

//                 {/* Name */}
//                 <h3 className="font-semibold text-lg text-slate-800">
//                   {agent.name}
//                 </h3>

//                 {/* Status */}
//                 <p className="text-sm text-slate-500">
//                   Status:{" "}
//                   <span
//                     className={
//                       agent.status === "active"
//                         ? "text-green-600 font-medium"
//                         : "text-red-500 font-medium"
//                     }
//                   >
//                     {agent.status || "unknown"}
//                   </span>
//                 </p>

//                 {/* Configure Button */}
//                 <Dialog>
//                   <DialogTrigger asChild>
//                     <Button
//                       variant="default"
//                       size="sm"
//                       className="opacity-0 group-hover:opacity-100 transition-all duration-300"
//                       onClick={() => openConfig(agent)}
//                     >
//                       Configure
//                     </Button>
//                   </DialogTrigger>
//                   <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//                     <DialogHeader>
//                       <DialogTitle>
//                         ⚙️ Manage Config for {agent.name}
//                       </DialogTitle>
//                     </DialogHeader>

//                     {!agentConfig ? (
//                       <div className="flex justify-center items-center py-20">
//                         <p className="text-slate-600 animate-pulse">
//                           Loading configuration...
//                         </p>
//                       </div>
//                     ) : (
//                       <div className="space-y-8">
//                         <Accordion
//                           type="single"
//                           collapsible
//                           className="w-full space-y-6"
//                         >
//                           {Object.entries(agentConfig).map(([key, val]) => (
//                             <AccordionItem
//                               key={key}
//                               value={key}
//                               className="border rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm bg-white/80"
//                             >
//                               <AccordionTrigger className="px-6 py-4 font-semibold text-slate-800 bg-gradient-to-r from-slate-100 to-slate-50 hover:from-indigo-50 hover:to-blue-50 transition-colors duration-200">
//                                 {key.toUpperCase()}
//                               </AccordionTrigger>
//                               <AccordionContent className="p-8 bg-gradient-to-br from-white via-slate-50 to-white space-y-8">
//                                 {renderField([], key, val)}
//                               </AccordionContent>
//                             </AccordionItem>
//                           ))}
//                         </Accordion>

//                         <div className="flex justify-end pt-6">
//                           <Button
//                             className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-white px-10 py-3 text-sm font-semibold rounded-xl transition-all duration-200"
//                             onClick={handleSave}
//                           >
//                             💾 Save All Changes
//                           </Button>
//                         </div>
//                       </div>
//                     )}
//                   </DialogContent>
//                 </Dialog>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       ) : (
//         <p className="text-slate-500 italic text-center">
//           No agents found for this company.
//         </p>
//       )}
//     </div>
//   )
// }


"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Search, ArrowLeft, Settings2, Check } from "lucide-react"

type InstructionHistoryRevision = {
  id: number
  agent: number
  company: number
  changed_by: number | null
  source: "create" | "update"
  changed_fields: string[]
  instructions: string
  agent_config: Record<string, unknown> | null
  created_at: string
}

// // DYNAMIC MODEL MAPS
// const AVAILABLE_MODELS = {
//   llm: {
//     openai: {
//       realTime: ["GPT-4o mini Realtime",
// "GPT-4o Realtime",
// "gpt-realtime-mini",
// "gpt-realtime"],
//       standard: ["gpt-5",
//     "gpt-5-mini",
//     "gpt-5-nano",
//     "gpt-4.1",
//     "gpt-4.1-mini",
//     "gpt-4.1-nano",
//     "gpt-4o",
//     "gpt-4o-2024-05-13",
//     "gpt-4o-mini",
//     "gpt-4o-mini-2024-07-18",
//     "gpt-4-turbo",
//     "gpt-4-turbo-2024-04-09",
//     "gpt-4-turbo-preview",
//     "gpt-4-0125-preview",
//     "gpt-4-1106-preview",
//     "gpt-4-vision-preview",
//     "gpt-4-1106-vision-preview",
//     "gpt-4",
//     "gpt-4-0314",
//     "gpt-4-0613",
//     "gpt-4-32k",
//     "gpt-4-32k-0314",
//     "gpt-4-32k-0613",
//     "gpt-3.5-turbo",
//     "gpt-3.5-turbo-16k",
//     "gpt-3.5-turbo-0301",
//     "gpt-3.5-turbo-0613",
//     "gpt-3.5-turbo-1106",
//     "gpt-3.5-turbo-16k-0613",
// ],
//     },
//     groq: {
//       realTime: [],
//       standard: ["llama3-8b-8192",
//     "llama3-70b-8192",
//     "llama-guard-3-8b",
//     "llama-3.1-8b-instant",
//     "llama-3.3-70b-versatile",
//     "meta-llama/llama-4-scout-17b-16e-instruct",
//     "meta-llama/llama-4-maverick-17b-128e-instruct",
//     "deepseek-r1-distill-llama-70b",
//     "openai/gpt-oss-120b",
//     "openai/gpt-oss-20b",
//     "moonshotai/kimi-k2-instruct",
//     "qwen/qwen3-32b",
// ],
//     },
//     google: {
//       realTime: ["gemini-2.0-flash-exp",
//     "gemini-2.0-flash-live-001",
//     "gemini-live-2.5-flash-preview",
//     "gemini-2.5-flash-preview-native-audio-dialog",
//     "gemini-2.5-flash-exp-native-audio-thinking-dialog",
// ],
//       standard: [
//         "gemini-2.5-flash-lite",
//         "gemini-2.5-flash-lite-preview-09-2025",
//         "gemini-2.5-flash",
//         "gemini-2.5-flash-preview-09-2025",
//         "gemini-2.5-pro",
//         "gemini-2.0-flash-001",
//         "gemini-2.0-flash-lite-preview-02-05",
//         "gemini-2.0-pro-exp-02-05",
//         "gemini-1.5-pro",
// ],
//     },
//   },
//   tts: {
//     elevenlabs: ["eleven_monolingual_v1",
//     "eleven_multilingual_v1",
//     "eleven_multilingual_v2",
//     "eleven_turbo_v2",
//     "eleven_turbo_v2_5",
//     "eleven_flash_v2_5",
//     "eleven_flash_v2",
//     "eleven_v3",
// ],
// google: ["chirp-3", "gemini", "gemini-2.5-flash-tts",
// "gemini-2.5-flash-lite-preview-tts",
// "gemini-2.5-pro-tts"],
//     cartesia: ["sonic", "sonic-2", "sonic-3", "sonic-lite", "sonic-preview", "sonic-turbo"],
//     openai: ["tts-1", "tts-1-hd", "gpt-4o-mini-tts"],
//   },
//   stt: {
//     speechmatics: ["default"],
//     deepgram: ["nova-general",
//     "nova-phonecall",
//     "nova-meeting",
//     "nova-2-general",
//     "nova-2-meeting",
//     "nova-2-phonecall",
//     "nova-2-finance",
//     "nova-2-conversationalai",
//     "nova-2-voicemail",
//     "nova-2-video",
//     "nova-2-medical",
//     "nova-2-drivethru",
//     "nova-2-automotive",
//     "nova-3",
//     "nova-3-general",
//     "nova-3-medical",
//     "enhanced-general",
//     "enhanced-meeting",
//     "enhanced-phonecall",
//     "enhanced-finance",
//     "base",
//     "meeting",
//     "phonecall",
//     "finance",
//     "conversationalai",
//     "voicemail",
//     "video",
//     "whisper-tiny",
//     "whisper-base",
//     "whisper-small",
//     "whisper-medium",
//     "whisper-large",
// ],
//     openai: ["whisper-1", "gpt-4o-transcribe", "gpt-4o-mini-transcribe"],
//   },
// }

export default function CompanyAgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
  const [agentConfig, setAgentConfig] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [instructionHistoryByAgent, setInstructionHistoryByAgent] = useState<
    Record<number, InstructionHistoryRevision[]>
  >({})
  const [historyLoadingAgentId, setHistoryLoadingAgentId] = useState<number | null>(null)
  const [historyErrorsByAgent, setHistoryErrorsByAgent] = useState<Record<number, string>>({})
  const PAGE_SIZE = 12
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const companyId = searchParams.get("companyId")
   const [AVAILABLE_MODELS, setAVAILABLE_MODELS] = useState<any>({
    llm: {
      openai: { realTime: [], standard: [] },
      groq: { realTime: [], standard: [] },
      google: { realTime: [], standard: [] },
      deepseek: { realTime: [], standard: [] },
      azure: { realTime: [], standard: [] },
    },
    tts: {
      elevenlabs: [],
      google: [],
      cartesia: [],
      openai: [],
      upliftai: [],
      azure: [],
    },
    stt: {
      speechmatics: [],
      deepgram: [],
      openai: [],
    },
  })

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true)
      const token = Cookies.get("adminToken")
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`

        const res = await fetch(url, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token || ""}`,
            },
          }
        )
        const data = await res.json()

        let fetchedAgents: any[] = []

        if (Array.isArray(data)) fetchedAgents = data
        else if (Array.isArray(data.results)) fetchedAgents = data.results

        if (companyId) {
          fetchedAgents = fetchedAgents.filter(
            (a) => String(a.company) === String(companyId)
          )
        }


        setAgents(fetchedAgents)
      } catch (err) {
        console.error("[Agents] Failed to fetch agents", err)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load agents",
        })
      } finally {
        setLoading(false)
      }
    }
    if (companyId) fetchAgents()
  }, [companyId, toast])

  const openConfig = (agent: any) => {

    setSelectedAgentId(agent.id)
    setAgentConfig(agent.agent_config || {})
    void fetchInstructionHistory(agent.id)
  }

  const getApiHeaders = () => {
    const token = Cookies.get("adminToken")
    const serviceApiKey = process.env.NEXT_PUBLIC_SERVICE_API_KEY

    return {
      "Content-Type": "application/json",
      Authorization: `Token ${token || ""}`,
      ...(serviceApiKey ? { "X-Service-API-Key": serviceApiKey } : {}),
    }
  }

  const fetchInstructionHistory = async (agentId: number) => {
    if (instructionHistoryByAgent[agentId]) return

    setHistoryLoadingAgentId(agentId)
    setHistoryErrorsByAgent((prev) => {
      const next = { ...prev }
      delete next[agentId]
      return next
    })

    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${agentId}/instruction-history/`

      const res = await fetch(url, {
          method: "GET",
          headers: getApiHeaders(),
        }
      )


      if (!res.ok) {
        throw new Error(`Failed to load instruction history (${res.status})`)
      }

      const data = await res.json()
      const history = Array.isArray(data) ? data : []
      setInstructionHistoryByAgent((prev) => ({ ...prev, [agentId]: history }))
    } catch (err: any) {
      const message =
        err?.message || "Unable to load instruction history for this agent."
      setHistoryErrorsByAgent((prev) => ({ ...prev, [agentId]: message }))
      toast({
        variant: "destructive",
        title: "Instruction history error",
        description: message,
      })
    } finally {
      setHistoryLoadingAgentId((prev) => (prev === agentId ? null : prev))
    }
  }

  const formatChangedFieldLabel = (field: string) =>
    field
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())

  const handleChange = (path: string[], value: any) => {
  setAgentConfig((prev: any) => {
    const updated = { ...prev }
    let obj = updated

    for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]]
    const key = path[path.length - 1]
    obj[key] = value

    // 🧠 Reset model when provider changes
    if (key === "provider") {
      const section = path[0] // e.g. "llm", "tts", "stt"
      if (obj["model"]) {
        obj["model"] = "" // Clear model so placeholder updates
      }
    }

    return updated
  })
}



// useEffect(() => {
//   const fetchDeepseekStandard = async () => {
//     const token = Cookies.get("adminToken")
//       const headers = {
//         "Content-Type": "application/json",
//         Authorization: `Token ${token || ""}`,
//       }
//     try {
//       const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
//       const res = await fetch(`${baseUrl}/models/llm/deepseek/standard/`, {
//         headers,
//       });

//       const data = await res.json();
//       console.log("Fetched DeepSeek Standard models:", data);
//     } catch (err) {
//       console.error("Failed to fetch DeepSeek Standard models", err);
     
//     }
//   };

//   fetchDeepseekStandard();
// }, []);

useEffect(() => {
    const fetchAllModelData = async () => {
      const token = Cookies.get("adminToken")
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Token ${token || ""}`,
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

        // Fetch all LLM models
        const llmProviders = ["openai", "groq", "google", "deepseek", "azure"]
        const llmSubtypes = ["realTime", "standard"]
        const llmPromises = llmProviders.flatMap((provider) =>
          llmSubtypes.map(async (subtype) => {
            try {
              const url = `${baseUrl}/models/llm/${provider}/${subtype}/`

              const res = await fetch(url, { headers })
              const data = await res.json()

              return { provider, subtype, models: data.models || [] }
            } catch (err) {
              console.error(`[Models] Failed to fetch LLM ${provider} ${subtype}`, err)
              return { provider, subtype, models: [] }
            }
          })
        )

        // Fetch all TTS models
        const ttsProviders = ["elevenlabs", "google", "cartesia", "openai", "upliftai","azure"]
        const ttsPromises = ttsProviders.map(async (provider) => {
          try {
            const url = `${baseUrl}/models/tts/${provider}/`

            const res = await fetch(url, { headers })
            const data = await res.json()

            return { provider, models: data.models || [] }
          } catch (err) {
            console.error(`[Models] Failed to fetch TTS ${provider}`, err)
            return { provider, models: [] }
          }
        })

        // Fetch all STT models
        const sttProviders = ["speechmatics", "deepgram", "openai"]
        const sttPromises = sttProviders.map(async (provider) => {
          try {
            const url = `${baseUrl}/models/stt/${provider}/`

            const res = await fetch(url, { headers })
            const data = await res.json()

            return { provider, models: data.models || [] }
          } catch (err) {
            console.error(`[Models] Failed to fetch STT ${provider}`, err)
            return { provider, models: [] }
          }
        })

        // Wait for all requests to complete
        const [llmResults, ttsResults, sttResults] = await Promise.all([
          Promise.all(llmPromises),
          Promise.all(ttsPromises),
          Promise.all(sttPromises),
        ])

        // Build the AVAILABLE_MODELS structure
        const newModels: any = {
          llm: {
            openai: { realTime: [], standard: [] },
            groq: { realTime: [], standard: [] },
            google: { realTime: [], standard: [] },
            deepseek: { realTime: [], standard: [] },
            azure: { realTime: [], standard: [] },
          },
          tts: {
            elevenlabs: [],
            google: [],
            cartesia: [],
            openai: [],
            upliftai: [],
            azure: [],
          },
          stt: {
            speechmatics: [],
            deepgram: [],
            openai: [],
          },
        }

        // Populate LLM models
        llmResults.forEach(({ provider, subtype, models }) => {
          if (newModels.llm[provider]) {
            newModels.llm[provider][subtype] = models
          }
        })

        // Populate TTS models
        ttsResults.forEach(({ provider, models }) => {
          if (newModels.tts[provider]) {
            newModels.tts[provider] = models
          }
        })

        // Populate STT models
        sttResults.forEach(({ provider, models }) => {
          if (newModels.stt[provider]) {
            newModels.stt[provider] = models
          }
        })

        setAVAILABLE_MODELS(newModels)

      } catch (err) {
        console.error("❌ Failed to fetch model data", err)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load model data",
        })
      }
    }

    fetchAllModelData()
  }, [toast])



  const handleSave = async () => {
    const token = Cookies.get("adminToken")
    if (!selectedAgentId) return
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/${selectedAgentId}/`
      const payload = { agent_config: agentConfig }

      const res = await fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token || ""}`,
          },
          body: JSON.stringify(payload),
        }
      )
      const responseData = await res.json().catch(() => null)

      if (!res.ok) throw new Error("Failed to save agent config")
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
      toast({
        title: "Success",
        description: "Agent config saved successfully.",
      })
    } catch (err: any) {
      toast({ title: "Error", description: err.message })
    }
  }

  const [saveSuccess, setSaveSuccess] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownSearch, setDropdownSearch] = useState("")

  // Render field with new provider/model logic
  const renderField = (path: string[], key: string, value: any) => {
    const fullPath = [...path, key]
    const rootKey = path[0]
    const dropdownId = fullPath.join(".")

    // ✅ LLM provider dropdown
    if (key === "provider" && rootKey === "llm") {
      const providers = ["openai", "groq", "google", "deepseek", "azure"]
      const isOpen = openDropdown === dropdownId
      const filtered = providers.filter(p => p.toLowerCase().includes(dropdownSearch.toLowerCase()))
      return (
        <div key={dropdownId} className="space-y-2 relative">
          <Label className="font-semibold">LLM Provider</Label>
          <button
            type="button"
            onClick={() => { setOpenDropdown(isOpen ? null : dropdownId); setDropdownSearch("") }}
            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
          >
            <span className={value ? "text-slate-900" : "text-slate-400"}>{value || "Select provider"}</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[9999] overflow-hidden">
              <input
                type="text"
                placeholder="Search..."
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border-b border-slate-100 outline-none placeholder:text-slate-400"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto">
                {filtered.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { handleChange(fullPath, p); setOpenDropdown(null); setDropdownSearch("") }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition-colors ${value === p ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"}`}
                  >
                    {p}
                  </button>
                ))}
                {filtered.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No results</p>}
              </div>
            </div>
          )}
        </div>
      )
    }

    // ✅ TTS provider dropdown
    if (key === "provider" && rootKey === "tts") {
      const providers = ["elevenlabs", "cartesia", "openai", "google", "upliftai", "azure"]
      const isOpen = openDropdown === dropdownId
      const filtered = providers.filter(p => p.toLowerCase().includes(dropdownSearch.toLowerCase()))
      return (
        <div key={dropdownId} className="space-y-2 relative">
          <Label className="font-semibold">TTS Provider</Label>
          <button
            type="button"
            onClick={() => { setOpenDropdown(isOpen ? null : dropdownId); setDropdownSearch("") }}
            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
          >
            <span className={value ? "text-slate-900" : "text-slate-400"}>{value || "Select provider"}</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[9999] overflow-hidden">
              <input
                type="text"
                placeholder="Search..."
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border-b border-slate-100 outline-none placeholder:text-slate-400"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto">
                {filtered.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { handleChange(fullPath, p); setOpenDropdown(null); setDropdownSearch("") }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition-colors ${value === p ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"}`}
                  >
                    {p}
                  </button>
                ))}
                {filtered.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No results</p>}
              </div>
            </div>
          )}
        </div>
      )
    }

    // ✅ STT provider dropdown
    if (key === "provider" && rootKey === "stt") {
      const providers = ["deepgram", "openai", "speechmatics"]
      const isOpen = openDropdown === dropdownId
      const filtered = providers.filter(p => p.toLowerCase().includes(dropdownSearch.toLowerCase()))
      return (
        <div key={dropdownId} className="space-y-2 relative">
          <Label className="font-semibold">STT Provider</Label>
          <button
            type="button"
            onClick={() => { setOpenDropdown(isOpen ? null : dropdownId); setDropdownSearch("") }}
            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
          >
            <span className={value ? "text-slate-900" : "text-slate-400"}>{value || "Select provider"}</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[9999] overflow-hidden">
              <input
                type="text"
                placeholder="Search..."
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border-b border-slate-100 outline-none placeholder:text-slate-400"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto">
                {filtered.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { handleChange(fullPath, p); setOpenDropdown(null); setDropdownSearch("") }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition-colors ${value === p ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"}`}
                  >
                    {p}
                  </button>
                ))}
                {filtered.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No results</p>}
              </div>
            </div>
          )}
        </div>
      )
    }

    // ✅ LLM real_time checkbox
    if ((key === "real_time") && rootKey === "llm") {
      return (
        <div key={fullPath.join(".")} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl shadow-sm">
          <Label className="font-medium">Real-Time</Label>
          <Switch
            checked={!!value}
            onCheckedChange={(val) => handleChange(fullPath, val)}
          />
        </div>
      )
    }

    // ✅ Model dropdown based on provider and real_time
    if (key === "model" && ["llm", "tts", "stt"].includes(rootKey)) {
      const section = path[0] as "llm" | "tts" | "stt"
      const provider = agentConfig?.[section]?.provider
      let models: string[] = []

      if (section === "llm" && provider) {
        const isRealTime = agentConfig?.llm?.real_time
        models = isRealTime
          ? AVAILABLE_MODELS.llm[provider]?.realTime || []
          : AVAILABLE_MODELS.llm[provider]?.standard || []
      } else if (section === "tts" && provider) {
        models = AVAILABLE_MODELS.tts[provider] || []
      } else if (section === "stt" && provider) {
        models = AVAILABLE_MODELS.stt[provider] || []
      }



      const isOpen = openDropdown === dropdownId
      const filtered = models.filter(m => m.toLowerCase().includes(dropdownSearch.toLowerCase()))

      return (
        <div key={dropdownId} className="space-y-2 relative">
          <Label className="font-semibold capitalize">{section} Model</Label>
          <button
            type="button"
            onClick={() => { setOpenDropdown(isOpen ? null : dropdownId); setDropdownSearch("") }}
            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
          >
            <span className={value ? "text-slate-900" : "text-slate-400"}>{value || (models.length > 0 ? "Select model" : "No models available")}</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {isOpen && models.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[9999] overflow-hidden">
              <input
                type="text"
                placeholder="Search models..."
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border-b border-slate-100 outline-none placeholder:text-slate-400"
                autoFocus
              />
              <div className="max-h-56 overflow-y-auto">
                {filtered.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { handleChange(fullPath, m); setOpenDropdown(null); setDropdownSearch("") }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition-colors ${value === m ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"}`}
                  >
                    {m}
                  </button>
                ))}
                {filtered.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No models found</p>}
              </div>
            </div>
          )}
        </div>
      )
    }

    // 🧠 Default fallback rendering
    if (typeof value === "boolean") {
      return (
        <div key={fullPath.join(".")} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl shadow-sm">
          <Label className="font-medium">{key}</Label>
          <Switch checked={value} onCheckedChange={(val) => handleChange(fullPath, val)} />
        </div>
      )
    }

    if (typeof value === "number") {
      return (
        <div key={fullPath.join(".")} className="p-4 bg-white rounded-xl shadow-sm border space-y-3">
          <Label className="font-semibold">{key}</Label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-0">
              <Slider value={[value]} min={0} max={100} step={0.1} onValueChange={(val) => handleChange(fullPath, val[0])} />
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={value}
              className="w-full sm:w-28 text-right bg-white border-slate-300 focus-visible:ring-indigo-500"
              onChange={(e) => {
                const raw = e.target.value
                if (raw === "") return
                const parsed = Number(raw)
                if (!Number.isNaN(parsed)) {
                  const clamped = Math.min(100, Math.max(0, parsed))
                  handleChange(fullPath, clamped)
                }
              }}
            />
          </div>
          <div className="text-right text-xs text-slate-500">Current: {value}</div>
        </div>
      )
    }

    if (typeof value === "string" || value === null) {
      return (
        <div key={fullPath.join(".")} className="p-4 bg-white rounded-xl shadow-sm border space-y-2">
          <Label className="font-semibold">{key}</Label>
          <Input value={value || ""} placeholder="Enter value" onChange={(e) => handleChange(fullPath, e.target.value)} />
        </div>
      )
    }

    if (typeof value === "object" && value !== null) {
      const entries = Object.entries(value)
      const reordered = [
        ...entries.filter(([subKey]) => subKey === "provider"),
        ...entries.filter(([subKey]) => subKey !== "provider"),
      ]
      return (
        <div key={fullPath.join(".")} className="p-6 bg-gradient-to-br from-slate-50 to-white border rounded-2xl shadow-md space-y-5">
          <h4 className="text-lg font-semibold capitalize">{key}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reordered.map(([subKey, subVal]) => renderField(fullPath, subKey, subVal))}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Sticky Header */}
      <div className="sticky top-2 md:top-4 z-40">
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 rounded-xl md:rounded-2xl opacity-60 blur-[2px] animate-[gradient_3s_ease_infinite] bg-[length:200%_100%]" />
          <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-purple-500/10" />
            <div className="relative px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-light text-slate-800 tracking-tight">Agents for Company #{companyId}</h1>
                  <p className="text-xs md:text-sm text-slate-500 font-light mt-0.5">Configure and manage agents</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl hover:bg-white/60 text-slate-600 gap-1.5"
                  onClick={() => router.push("/admin/dashboard/agent-settings")}
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-medium">Loading agents...</p>
        </div>
      ) : agents.length > 0 ? (
        <>
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              className="pl-10 rounded-xl border-slate-200 bg-white h-10 focus:border-indigo-400 focus:ring-indigo-400/20"
            />
          </div>

          {(() => {
            const filteredAgents = agents.filter(a =>
              a.name?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            const totalPages = Math.ceil(filteredAgents.length / PAGE_SIZE)
            const pagedAgents = filteredAgents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pagedAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                          <span className="text-sm font-semibold text-indigo-600">
                            {agent.name?.charAt(0)?.toUpperCase() || "A"}
                          </span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          agent.status === "active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {agent.status || "unknown"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm mb-1 truncate">{agent.name}</h3>
                      <p className="text-xs text-slate-400 mb-4">ID: {agent.id}</p>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-sm shadow-indigo-500/20 text-xs gap-1.5"
                            onClick={() => openConfig(agent)}
                          >
                            <Settings2 className="h-3.5 w-3.5" /> Configure
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-0">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-slate-800">Configure: {agent.name}</DialogTitle>
                          </DialogHeader>

                          {!agentConfig ? (
                            <div className="flex justify-center items-center py-20">
                              <p className="text-slate-600 animate-pulse">Loading configuration...</p>
                            </div>
                          ) : (
                            <Tabs defaultValue="configuration" className="space-y-5">
                              <TabsList className="grid w-full grid-cols-2 rounded-xl">
                                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                                <TabsTrigger value="history">Instruction History</TabsTrigger>
                              </TabsList>

                              <TabsContent value="configuration" className="space-y-8">
                                <Accordion type="single" collapsible className="w-full space-y-6">
                                  {Object.entries(agentConfig).map(([key, val]) => (
                                    <AccordionItem key={key} value={key} className="border rounded-2xl shadow-lg">
                                      <AccordionTrigger className="px-6 py-4 font-semibold">{key.toUpperCase()}</AccordionTrigger>
                                      <AccordionContent className="p-8 bg-gradient-to-br from-white via-slate-50 to-white space-y-8">
                                        {renderField([], key, val)}
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                                </Accordion>

                                <div className="flex justify-end pt-2">
                                  <Button
                                    className={`relative overflow-hidden text-white px-10 py-3 rounded-xl shadow-lg transition-all duration-300 ${
                                      saveSuccess
                                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25"
                                        : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-indigo-500/25"
                                    }`}
                                    onClick={handleSave}
                                  >
                                    <span className={`flex items-center gap-2 transition-all duration-300 ${saveSuccess ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}>
                                      Save All Changes
                                    </span>
                                    <span className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${saveSuccess ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
                                      <Check className="h-4 w-4 stroke-[3]" /> Saved!
                                    </span>
                                  </Button>
                                </div>
                              </TabsContent>

                              <TabsContent value="history" className="space-y-4">
                                {historyLoadingAgentId === agent.id ? (
                                  <div className="text-sm text-slate-500 py-6 text-center">Loading instruction history...</div>
                                ) : historyErrorsByAgent[agent.id] ? (
                                  <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-4">
                                    {historyErrorsByAgent[agent.id]}
                                  </div>
                                ) : (instructionHistoryByAgent[agent.id] || []).length === 0 ? (
                                  <div className="text-sm text-slate-500 py-6 text-center">
                                    No instruction history found for this agent.
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {(instructionHistoryByAgent[agent.id] || []).map((revision, idx) => (
                                      <div key={revision.id} className="rounded-xl border border-slate-200 p-4 bg-white">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                          <div className="flex items-center gap-2">
                                            <Badge variant={idx === 0 ? "default" : "secondary"}>
                                              {idx === 0 ? "Current version" : "Revision"}
                                            </Badge>
                                            <Badge variant="outline">{revision.source}</Badge>
                                            <span className="text-xs text-slate-500">#{revision.id}</span>
                                          </div>
                                          <div className="text-xs text-slate-500">
                                            {new Date(revision.created_at).toLocaleString()}
                                          </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                          {(revision.changed_fields || []).map((field) => (
                                            <Badge key={field} variant="secondary">
                                              {formatChangedFieldLabel(field)}
                                            </Badge>
                                          ))}
                                        </div>

                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-xs font-medium text-slate-600 mb-1">Instructions snapshot</p>
                                            <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 max-h-48 overflow-auto">
                                              {revision.instructions || "No instructions snapshot"}
                                            </pre>
                                          </div>

                                          <div>
                                            <p className="text-xs font-medium text-slate-600 mb-1">Agent config snapshot</p>
                                            <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 max-h-56 overflow-auto">
                                              {revision.agent_config
                                                ? JSON.stringify(revision.agent_config, null, 2)
                                                : "No config snapshot"}
                                            </pre>
                                          </div>

                                          <p className="text-xs text-slate-500">
                                            Changed by: {revision.changed_by ?? "System/Service"}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>

                {filteredAgents.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm">No agents found matching your search.</p>
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
        </>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Settings2 className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">No agents found for this company.</p>
        </div>
      )}

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
