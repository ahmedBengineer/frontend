"use client"



import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Download,
  X,
  Phone,
  Clock,
  MessageSquare,
  Filter,
  Calendar,
  Hash,
  Zap,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DashboardSidebar } from "@/components/dashboard-sidebar"





type Message = {
  id: number
  user: number
  timestamp: string
  session_id: string
  type: string
  user_question: string
  assistant_response: string
  summary: string
  phonenumber: string
  caller_number: string
  token: TokenUsage | null
  resolution_confidence: number | null
  resolution_reason: string | null
  resolution_source: string | null
  resolution_status: string | null
}

type TokenUsage = {
  prompt_tokens: number
  completion_tokens: number
  prompt_cached_tokens: number
  cache_creation_tokens: number
  cache_read_tokens: number
  total_tokens: number
}

type UnknownToken = Message["token"] | number | string | Record<string, unknown> | null | undefined




const Cookies = {
  get: (key: string) => {
    if (typeof document !== 'undefined') {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${key}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
    }
    return ''
  }
}





function CallsTab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [conversationTotalPages, setConversationTotalPages] = useState(1)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [viewType, setViewType] = useState<"transcript" | "summary" | "resolution" | null>(null)





  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<"7days" | "10days" | "30days" | "custom" | "all">("all")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [triggerSearch, setTriggerSearch] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  // Auto-fill search from ?session_id= query param (e.g. navigated from Security page)
  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    if (sessionId) {
      setSearchTerm(sessionId)
      setTriggerSearch((x) => x + 1)
    }
  }, [searchParams])





  const [assignedNumbers, setAssignedNumbers] = useState<string[]>([])
  const [numbersLoading, setNumbersLoading] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<string>("")





  const [pageInput, setPageInput] = useState("")





  const router = useRouter()
  const { toast } = useToast()





  const format = (d: Date) => d.toISOString().split("T")[0]





  const handleDelete = async (session_id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/conversations/messages/delete-by-session/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({ session_id }),
      })





      if (!res.ok) throw new Error("Failed to delete conversation")





      setMessages((prev) => prev.filter((m) => m.session_id !== session_id))
      toast({
        title: "Conversation deleted",
        description: `Session ${session_id} was removed successfully.`,
        className: "bg-green-50 border-green-400 text-green-800",
      })
    } catch (err: any) {
      toast({
        title: "Error deleting conversation",
        description: err.message,
        className: "bg-red-50 border-red-400 text-red-800",
      })
    }
  }





  const exportCSV = () => {
    if (!messages || messages.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no messages to download.",
        className: "bg-yellow-50 border-yellow-400 text-yellow-800",
      })
      return
    }





    const grouped: Record<string, Message[]> = messages.reduce((acc, m) => {
      if (!acc[m.session_id]) acc[m.session_id] = []
      acc[m.session_id].push(m)
      return acc
    }, {} as Record<string, Message[]>)





    const headers = [
      "id",
      "session_id",
      "timestamp",
      "type",
      "user_question",
      "assistant_response",
      "summary",
      "phonenumber",
      "caller_number",
    ]





    const rows: string[] = []





    Object.entries(grouped)
      .sort((a, b) => new Date(a[1][0].timestamp).getTime() - new Date(b[1][0].timestamp).getTime())
      .forEach(([session_id, msgs]) => {
        const sortedMsgs = msgs.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )





        const firstMsg = sortedMsgs[0]
        const summaryMsg = sortedMsgs.find((m) => m.type === "summary" || m.type === "conversation_complete")
        const phoneNumber = firstMsg.phonenumber || "Unknown"
        const callerNumber = firstMsg.caller_number || "N/A"
        const startedAt = firstMsg.timestamp
        const callDuration = summaryMsg
          ? Math.floor((new Date(summaryMsg.timestamp).getTime() - new Date(firstMsg.timestamp).getTime()) / 1000) + "s"
          : "N/A"





        const sessionRow = [
          `"Session Info"`,
          `"${session_id}"`,
          `"${startedAt}"`,
          `"${callDuration}"`,
          `"${phoneNumber}"`,
          `"${callerNumber}"`,
          `"Summary: ${summaryMsg?.summary?.replace(/"/g, '""') || "N/A"}"`,
          "",
          "",
        ].join(",")
        rows.push(sessionRow)





        sortedMsgs.forEach((m) => {
          const row = headers
            .map((h) => {
              let val = (m as any)[h] ?? ""
              if (typeof val === "string") val = val.replace(/"/g, '""')
              return `"${val}"`
            })
            .join(",")
          rows.push(row)
        })





        rows.push("")
      })





    const csvContent = [headers.join(","), ...rows].join("\n")





    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `conversations_export_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)





    toast({
      title: "Exported Successfully",
      description: "Your CSV file is ready.",
      className: "bg-green-50 border-green-400 text-green-800",
    })
  }





  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPageInput(value)
  }





  const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(pageInput)
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= conversationTotalPages) {
        setCurrentPage(pageNum)
        setPageInput("")
      } else {
        toast({
          title: "Invalid page number",
          description: `Please enter a number between 1 and ${conversationTotalPages}`,
          className: "bg-red-50 border-red-400 text-red-800",
        })
      }
    }
  }





  useEffect(() => {
    async function fetchNumbers() {
      try {
        setNumbersLoading(true)





        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/public/company/get-twilio-phones`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )





        const data = await res.json()
        console.log("Fetched numbers:", data)




        let nums = data?.twilio_phone_numbers || []
        setAssignedNumbers(nums)





      } catch (err) {
        console.error("Failed to load numbers", err)
      } finally {
        setNumbersLoading(false)
      }
    }





    fetchNumbers()
  }, [])





  useEffect(() => {
    async function fetchMessages() {
      try {
        setPageLoading(true)





        const params = new URLSearchParams()
        params.append("page", currentPage.toString())





        if (searchTerm.trim() !== "") {
          params.append("search", searchTerm.trim())
        }





        const today = new Date()





        if (dateFilter === "7days") {
          const d = new Date(today)
          d.setDate(d.getDate() - 7)
          params.append("date_from", format(d))
          params.append("date_to", format(today))
        }





        if (dateFilter === "10days") {
          const d = new Date(today)
          d.setDate(d.getDate() - 10)
          params.append("date_from", format(d))
          params.append("date_to", format(today))
        }





        if (dateFilter === "30days") {
          const d = new Date(today)
          d.setDate(d.getDate() - 30)
          params.append("date_from", format(d))
          params.append("date_to", format(today))
        }





        if (dateFilter === "custom" && customStart && customEnd) {
          params.append("date_from", customStart)
          params.append("date_to", customEnd)
        }





        if (selectedNumber !== "") {
          params.append("search", selectedNumber)
        }





        console.log("hey", params.toString())
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/messages/conversations/?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )





        if (!res.ok) throw new Error("Failed to fetch messages")





        const data = await res.json()
        console.log("Messages API response (complete):", data)
        console.log("Messages API raw results:", JSON.stringify(data.results, null, 2))
        // Log each session and whether it has a summary message
        if (data.results) {
          Object.entries(data.results).forEach(([sessionId, msgs]: [string, any]) => {
            const msgsArr = Array.isArray(msgs) ? msgs : [msgs]
            const summaryMsg = msgsArr.find((m: any) => m.type === "summary" || m.type === "conversation_complete")
            console.log(`Session ${sessionId}: ${msgsArr.length} messages, summary:`, summaryMsg ? summaryMsg.summary : "❌ NO SUMMARY")
            // Full dump for the target caller
            const hasTargetCaller = msgsArr.some((m: any) =>
              m.caller_number === "921111111111" ||
              m.from_number === "921111111111" ||
              m.phone_number === "921111111111" ||
              JSON.stringify(m).includes("921111111111")
            )
            if (hasTargetCaller) {
              console.log("🎯 FOUND TARGET CALLER 921111111111 — full session dump:")
              console.log("Session ID:", sessionId)
              console.log("All messages:", JSON.stringify(msgsArr, null, 2))
            }
          })
        }
        const groupedResults: Message[] = data.results ? (Object.values(data.results) as Message[][]).flat() : []
        setMessages(groupedResults)
        setConversationTotalPages(data.total_pages || 1)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
        setPageLoading(false)
      }
    }





    fetchMessages()
  }, [currentPage, triggerSearch, dateFilter, customStart, customEnd, selectedNumber])





  const grouped = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    if (!acc[msg.session_id]) acc[msg.session_id] = []
    acc[msg.session_id].push(msg)
    return acc
  }, {})





  const sortedSessions = Object.entries(grouped).sort((a, b) => {
    const firstA = new Date(a[1][0].timestamp).getTime()
    const firstB = new Date(b[1][0].timestamp).getTime()
    return firstB - firstA
  })





  const selectedMessages = selectedSession ? grouped[selectedSession] : null
  const latestSummary = selectedMessages?.find((m) => (m.type === "summary" || m.type === "conversation_complete") && m.summary) || null





  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000)
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins}m ${secs}s`
  }





  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const toSafeNumber = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  const normalizeTokenUsage = (token: UnknownToken): TokenUsage => {
    if (typeof token === "string") {
      const trimmed = token.trim()
      if (trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed) as UnknownToken
          return normalizeTokenUsage(parsed)
        } catch {
          /* fall through to numeric string handling */
        }
      }
    }

    if (typeof token === "number" || typeof token === "string") {
      return {
        prompt_tokens: 0,
        completion_tokens: 0,
        prompt_cached_tokens: 0,
        cache_creation_tokens: 0,
        cache_read_tokens: 0,
        total_tokens: toSafeNumber(token),
      }
    }

    if (!token || typeof token !== "object") {
      return {
        prompt_tokens: 0,
        completion_tokens: 0,
        prompt_cached_tokens: 0,
        cache_creation_tokens: 0,
        cache_read_tokens: 0,
        total_tokens: 0,
      }
    }

    const raw = token as Record<string, unknown>
    if (Array.isArray(raw)) {
      return {
        prompt_tokens: 0,
        completion_tokens: 0,
        prompt_cached_tokens: 0,
        cache_creation_tokens: 0,
        cache_read_tokens: 0,
        total_tokens: 0,
      }
    }

    return {
      prompt_tokens: toSafeNumber(raw.prompt_tokens),
      completion_tokens: toSafeNumber(raw.completion_tokens),
      prompt_cached_tokens: toSafeNumber(raw.prompt_cached_tokens),
      cache_creation_tokens: toSafeNumber(raw.cache_creation_tokens),
      cache_read_tokens: toSafeNumber(raw.cache_read_tokens),
      total_tokens: toSafeNumber(raw.total_tokens),
    }
  }

  const formatTokenCount = (value: unknown) => {
    const safeValue = toSafeNumber(value)
    return new Intl.NumberFormat("en-US").format(safeValue)
  }

  const getSessionTokenTotals = (msgs: Message[]) =>
    msgs.reduce(
      (acc, m) => {
        const token = normalizeTokenUsage(m.token as UnknownToken)
        acc.prompt_tokens += toSafeNumber(token.prompt_tokens)
        acc.completion_tokens += toSafeNumber(token.completion_tokens)
        acc.prompt_cached_tokens += toSafeNumber(token.prompt_cached_tokens)
        acc.cache_creation_tokens += toSafeNumber(token.cache_creation_tokens)
        acc.cache_read_tokens += toSafeNumber(token.cache_read_tokens)
        acc.total_tokens += toSafeNumber(token.total_tokens)
        return acc
      },
      {
        prompt_tokens: 0,
        completion_tokens: 0,
        prompt_cached_tokens: 0,
        cache_creation_tokens: 0,
        cache_read_tokens: 0,
        total_tokens: 0,
      } as TokenUsage
    )





  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-slate-600 font-light tracking-wide">Loading conversations...</p>
      </div>
    )





  if (error) return <div className="p-6 text-red-600 text-center">Error: {error}</div>




  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* New Collapsible Sidebar */}
      <DashboardSidebar />



      {/* Main Content Wrapper with proper spacing */}
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Left Panel - Conversations List */}
        <div className={`${selectedSession ? "w-2/5" : "flex-1"} flex flex-col bg-white border-r border-slate-200 h-full`}>
          {/* Header - consistent with reference page */}
          <div className="relative overflow-hidden bg-white border-b border-slate-200 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50"></div>
            
            <div className="relative px-8 py-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-20 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full"></div>
                <div>
                  <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">
                    Call History
                  </h1>
                  <p className="text-lg text-slate-500 font-light tracking-wide">
                    {sortedSessions.length} conversations
                  </p>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setTriggerSearch((x) => x + 1)}
                  className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 px-5 py-3 pl-12 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all duration-300"
                />
                <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                    showFilters 
                      ? 'bg-slate-100 text-slate-900' 
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>




          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-slate-50 border-b border-slate-200 flex-shrink-0" style={{ animation: 'slideDown 0.3s ease-out' }}>
              <div className="px-8 py-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Phone Number Filter */}
                  <div>
                    <label className="flex items-center gap-2 text-xs text-slate-700 uppercase tracking-wider font-medium mb-2">
                      <Hash className="w-3 h-3" />
                      Phone Number
                    </label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all duration-300 appearance-none cursor-pointer font-light"
                        value={selectedNumber}
                        onChange={(e) => {
                          setSelectedNumber(e.target.value)
                          setTriggerSearch((x) => x + 1)
                        }}
                      >
                        <option value="">All Numbers</option>
                        {assignedNumbers.map((num, i) => (
                          <option key={i} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>




                  {/* Date Filter */}
                  <div>
                    <label className="flex items-center gap-2 text-xs text-slate-700 uppercase tracking-wider font-medium mb-2">
                      <Calendar className="w-3 h-3" />
                      Time Period
                    </label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all duration-300 appearance-none cursor-pointer font-light"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                      >
                        <option value="all">All Time</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="10days">Last 10 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>





                {dateFilter === "custom" && (
                  <div className="grid grid-cols-2 gap-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <Input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all duration-300 font-light"
                    />
                    <Input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all duration-300 font-light"
                    />
                  </div>
                )}





                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setDateFilter("all")
                      setCustomStart("")
                      setCustomEnd("")
                      setSelectedNumber("")
                      setTriggerSearch((x) => x + 1)
                    }}
                    className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-200 font-light"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={exportCSV}
                    className="px-4 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 font-light flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          )}





          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-8 space-y-4">
              {pageLoading ? (
                <>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 animate-pulse">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-slate-200 rounded w-40"></div>
                          <div className="h-3 bg-slate-200 rounded w-32"></div>
                          <div className="h-3 bg-slate-200 rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {sortedSessions.map(([session_id, msgs]) => {
                    const sortedMsgs = [...msgs].sort(
                      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    )
                    const startedAt = new Date(sortedMsgs[0].timestamp)
                    const startedAtMs = startedAt.getTime()



                    const summaryMsg = sortedMsgs.find((m) => m.type === "summary" || m.type === "conversation_complete")
                    const endedAtMs = summaryMsg
                      ? new Date(summaryMsg.timestamp).getTime() + 15000
                      : new Date(sortedMsgs[sortedMsgs.length - 1].timestamp).getTime()





                    const callDuration = formatDuration(endedAtMs - startedAtMs)
                    const tokenTotals = getSessionTokenTotals(msgs)
                    const totalTokens = toSafeNumber(tokenTotals.total_tokens)
                    const phoneNumber = msgs[0]?.phonenumber || "Unknown"
                    const callerNumber = msgs.find((m) => m.caller_number)?.caller_number || "N/A"
                    const previewText = summaryMsg
                      ? summaryMsg.summary.split(" ").slice(0, 8).join(" ") + "..."
                      : "Tap to view transcript"





                    const isSelected = selectedSession === session_id

                    // Latest message by timestamp (for resolution fields)
                    const latestMsg = sortedMsgs[sortedMsgs.length - 1]
                    const resStatus = latestMsg?.resolution_status ?? null
                    const resConfidence = latestMsg?.resolution_confidence ?? null
                    const resReason = latestMsg?.resolution_reason ?? null

                    const resStatusConfig: Record<string, { label: string; dot: string; text: string }> = {
                      resolved:   { label: "Resolved",   dot: "bg-emerald-400", text: "text-emerald-700" },
                      unresolved: { label: "Unresolved", dot: "bg-rose-400",    text: "text-rose-700"    },
                      escalated:  { label: "Escalated",  dot: "bg-amber-400",   text: "text-amber-700"  },
                      unknown:    { label: "Unknown",    dot: "bg-slate-300",   text: "text-slate-500"  },
                    }
                    const resCfg = resStatus ? (resStatusConfig[resStatus] ?? resStatusConfig["unknown"]) : null

                    return (
                      <div
                        key={session_id}
                        onClick={() => {
                          setSelectedSession(session_id)
                          setViewType("transcript")
                        }}
                        className={`group bg-white border rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? "border-emerald-600 shadow-lg shadow-emerald-500/20 bg-emerald-50/30" 
                            : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            isSelected
                              ? "bg-emerald-600"
                              : "bg-slate-100 group-hover:bg-slate-200"
                          }`}>
                            <Phone className={`w-5 h-5 ${
                              isSelected ? "text-white" : "text-slate-600 group-hover:text-slate-700"
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-light text-slate-900 truncate">{callerNumber}</h3>
                              <span className="text-xs text-slate-500 ml-2">{formatTime(sortedMsgs[0].timestamp)}</span>
                            </div>
                            
                            <p className="text-sm text-slate-600 mb-2 truncate font-light">{phoneNumber}</p>
                            
                            <p className="text-sm text-slate-700 truncate font-light mb-3">{previewText}</p>

                            {/* Resolution status badge only */}
                            {resCfg && (
                              <div className="mb-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 border border-slate-100 ${resCfg.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${resCfg.dot}`} />
                                  {resCfg.label}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-light">
                                <Clock className="w-3.5 h-3.5" />
                                {callDuration}
                              </span>
                              <span className="flex items-center gap-1 font-light">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {msgs.length}
                              </span>
                              <div className="relative group/token">
                                <button
                                  type="button"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 font-light rounded-md px-1.5 py-0.5 hover:bg-slate-100 transition-colors duration-200"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  {formatTokenCount(totalTokens)} tokens
                                </button>
                                <div className="pointer-events-none absolute left-0 top-full mt-2 hidden min-w-[240px] rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-xl group-hover/token:block z-20">
                                  <p className="font-medium text-slate-900 mb-2">Token usage</p>
                                  <div className="space-y-1 font-light">
                                    <p>Prompt: {formatTokenCount(tokenTotals.prompt_tokens)}</p>
                                    <p>Completion: {formatTokenCount(tokenTotals.completion_tokens)}</p>
                                    <p>Prompt Cached: {formatTokenCount(tokenTotals.prompt_cached_tokens)}</p>
                                    <p>Cache Creation: {formatTokenCount(tokenTotals.cache_creation_tokens)}</p>
                                    <p>Cache Read: {formatTokenCount(tokenTotals.cache_read_tokens)}</p>
                                    <p className="pt-1 border-t border-slate-200 text-slate-900 font-medium">Total: {formatTokenCount(tokenTotals.total_tokens)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>




                          <AlertDialog>
                            <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button className="p-2 hover:bg-rose-50 rounded-lg transition-all duration-200">
                                <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600 transition-colors duration-200" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border border-slate-200">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-900 font-light">Delete this conversation?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-600 font-light">
                                  This will permanently delete all messages under this session.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-light">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-light"
                                  onClick={() => handleDelete(session_id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>





          {/* Pagination */}
          <div className="bg-white border-t border-slate-200 px-8 py-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>





              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 font-light">
                  Page {currentPage} of {conversationTotalPages}
                </span>
                <input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onKeyDown={handlePageInputSubmit}
                  placeholder="Go to"
                  className="w-20 px-3 py-1.5 text-sm text-center rounded-lg border border-slate-300 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all duration-200 font-light"
                />
              </div>





              <button
                disabled={currentPage === conversationTotalPages}
                onClick={() => setCurrentPage((p) => Math.min(conversationTotalPages, p + 1))}
                className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>





        {/* Right Panel - Chat View */}
        {selectedSession && (
          <div className="w-3/5 flex flex-col h-full">

            {/* ── Panel Header ── */}
            <div className="bg-slate-900 flex-shrink-0">
              {/* Caller row */}
              <div className="flex items-center justify-between px-7 pt-6 pb-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-light text-base leading-tight truncate">
                      {selectedMessages?.find((m) => m.caller_number)?.caller_number || "Unknown"}
                    </p>
                    <p className="text-slate-400 text-xs font-light mt-0.5 truncate">
                      {selectedMessages?.[0]?.phonenumber || "Unknown"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedSession(null); setViewType(null) }}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab bar */}
              <div className="px-7 pb-0">
                <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1">
                  {(["transcript", "summary", "resolution"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setViewType(tab)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 capitalize ${
                        viewType === tab
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="h-px bg-white/5 mt-4" />
              </div>
            </div>




            {/* Chat Messages */}
            <div 
              className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50 min-h-0" 
              style={{ 
                scrollBehavior: 'smooth',
              }}
            >
              {viewType === "transcript" && (
                <>
                  {(() => {
                    const nonSummaryMsgs = selectedMessages
                      ?.filter((m) => m.type !== "summary")
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())





                    if (!nonSummaryMsgs || nonSummaryMsgs.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                              <MessageSquare className="w-10 h-10 text-slate-400" />
                            </div>
                            <p className="text-slate-700 font-light text-lg mb-2">No transcript available</p>
                            <p className="text-sm text-slate-500 font-light">This session contains only a summary</p>
                          </div>
                        </div>
                      )
                    }





                    return nonSummaryMsgs.map((m) => {
                      if (!m.user_question || m.user_question.trim() === "") {
                        return null
                      }




                      return (
                        <div key={m.id} className="space-y-4">
                          {/* User Message */}
                          <div className="flex justify-end" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                            <div className="max-w-[70%]">
                              <div className="bg-slate-900 text-white rounded-2xl rounded-tr-md px-5 py-4 shadow-lg">
                                <p className="text-sm leading-relaxed font-light">{m.user_question}</p>
                              </div>
                              <p className="text-xs text-slate-500 mt-2 text-right font-light">
                                {formatTime(m.timestamp)}
                              </p>
                            </div>
                          </div>





                          {/* Assistant Message */}
                          <div className="flex justify-start" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                            <div className="max-w-[70%]">
                              <div className="bg-white rounded-2xl rounded-tl-md px-5 py-4 shadow-lg border border-slate-200">
                                <p className="text-sm text-slate-900 leading-relaxed font-light">{m.assistant_response}</p>
                              </div>
                              <p className="text-xs text-slate-500 mt-2 font-light">
                                {formatTime(m.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </>
              )}




              {viewType === "summary" && (() => {
                if (!latestSummary) return (
                  <div className="flex-1 flex flex-col items-center justify-center bg-white" style={{ animation: 'fadeIn 0.25s ease-out' }}>
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-base font-light text-slate-600 tracking-tight">No summary yet</p>
                    <p className="text-sm text-slate-400 font-light mt-1.5 max-w-xs text-center">Will appear here automatically after the call ends</p>
                  </div>
                )

                const raw = latestSummary.summary ?? ""
                const isError = /failed|error code|invalid_api_key|incorrect api key/i.test(raw)

                // split into readable paragraphs
                const paragraphs = raw
                  .split(/\n{2,}|\n/)
                  .map((p: string) => p.trim())
                  .filter(Boolean)

                return (
                  <div className="h-full flex flex-col overflow-hidden" style={{ animation: 'fadeIn 0.25s ease-out' }}>

                    {/* ── Meta band ── */}
                    <div className="flex-shrink-0 bg-white border-b border-slate-100">
                      <div className="px-8 py-4 flex items-center gap-5 overflow-x-auto">
                        {[
                          { label: "Date", value: new Date(latestSummary.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                          { label: "Time", value: new Date(latestSummary.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                          { label: "Caller", value: selectedMessages?.find((m) => m.caller_number)?.caller_number || "Unknown" },
                        ].map((item, i, arr) => (
                          <div key={item.label} className="flex items-center gap-5 flex-shrink-0">
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400 font-medium mb-0.5">{item.label}</p>
                              <p className="text-sm font-light text-slate-800 whitespace-nowrap">{item.value}</p>
                            </div>
                            {i < arr.length - 1 && <div className="w-px h-7 bg-slate-100 flex-shrink-0" />}
                          </div>
                        ))}
                        <div className="ml-auto flex-shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            AI Generated
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto bg-white">
                      {isError ? (
                        /* Error state */
                        <div className="px-8 py-10 max-w-2xl">
                          <div className="flex items-start gap-4 p-5 rounded-2xl bg-rose-50 border border-rose-100 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-4.5 h-4.5 text-rose-500" style={{width:"18px",height:"18px"}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-rose-700 mb-1">Summary generation failed</p>
                              <p className="text-xs font-light text-rose-500">The AI was unable to generate a summary for this call.</p>
                            </div>
                          </div>
                          <details className="group">
                            <summary className="text-xs text-slate-400 font-light cursor-pointer select-none hover:text-slate-600 transition-colors list-none flex items-center gap-1.5">
                              <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                              Technical details
                            </summary>
                            <div className="mt-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-[11px] font-mono text-slate-500 break-all leading-relaxed whitespace-pre-wrap">{raw}</p>
                            </div>
                          </details>
                        </div>
                      ) : (
                        /* Normal summary — editorial paragraph layout */
                        <div className="px-8 pt-8 pb-16 max-w-2xl">
                          <div className="flex items-center gap-3 mb-8">
                            <div className="w-1 h-7 bg-gradient-to-b from-slate-900 to-slate-300 rounded-full flex-shrink-0" />
                            <h3 className="text-lg font-extralight tracking-tight text-slate-900">Call Summary</h3>
                          </div>
                          <div className="space-y-4">
                            {paragraphs.map((para: string, i: number) => (
                              <p
                                key={i}
                                className="text-[15px] font-light text-slate-700 leading-[1.9] break-words overflow-wrap-anywhere"
                                style={{ overflowWrap: 'anywhere' }}
                              >
                                {para}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {viewType === "resolution" && (() => {
                const sortedAll = [...(selectedMessages ?? [])].sort(
                  (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                )
                const latest = sortedAll[sortedAll.length - 1]
                const status   = latest?.resolution_status   ?? "unknown"
                const confidence = latest?.resolution_confidence ?? null
                const reason   = latest?.resolution_reason   ?? null
                const source   = latest?.resolution_source   ?? null

                const statusMap: Record<string, { label: string; ring: string; bg: string; text: string; bar: string }> = {
                  resolved:   { label: "Resolved",   ring: "ring-emerald-200", bg: "bg-emerald-50",  text: "text-emerald-700", bar: "bg-emerald-400" },
                  unresolved: { label: "Unresolved", ring: "ring-rose-200",    bg: "bg-rose-50",     text: "text-rose-700",    bar: "bg-rose-400"    },
                  escalated:  { label: "Escalated",  ring: "ring-amber-200",   bg: "bg-amber-50",    text: "text-amber-700",   bar: "bg-amber-400"   },
                  unknown:    { label: "Unknown",    ring: "ring-slate-200",   bg: "bg-slate-50",    text: "text-slate-500",   bar: "bg-slate-300"   },
                }
                const cfg = statusMap[status] ?? statusMap["unknown"]
                const pct = confidence !== null ? Math.round(confidence * 100) : null

                return (
                  <div className="h-full flex items-start justify-center p-8" style={{ animation: "fadeIn 0.3s ease-out" }}>
                    <div className="max-w-2xl w-full space-y-5">

                      {/* Status hero card */}
                      <div className={`relative overflow-hidden rounded-3xl border ring-1 ${cfg.ring} ${cfg.bg} p-8`}>
                        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-30 bg-current pointer-events-none" />
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium mb-4">Resolution Status</p>
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cfg.bg} ring-1 ${cfg.ring}`}>
                            {status === "resolved" && (
                              <svg className={`w-7 h-7 ${cfg.text}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                            {status === "unresolved" && (
                              <svg className={`w-7 h-7 ${cfg.text}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            )}
                            {status === "escalated" && (
                              <svg className={`w-7 h-7 ${cfg.text}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            )}
                            {status === "unknown" && (
                              <svg className={`w-7 h-7 ${cfg.text}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            )}
                          </div>
                          <div>
                            <h2 className={`text-3xl font-extralight tracking-tight ${cfg.text}`}>{cfg.label}</h2>
                            {source && (
                              <p className="text-xs text-slate-400 font-light mt-0.5 uppercase tracking-wider">{source}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Confidence meter */}
                      {pct !== null && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Confidence Score</p>
                            <span className="text-2xl font-extralight text-slate-900 tracking-tight">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-2">
                            <span className="text-[10px] text-slate-300 font-light">0%</span>
                            <span className="text-[10px] text-slate-300 font-light">100%</span>
                          </div>
                        </div>
                      )}

                      {/* Reason */}
                      <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium mb-3">Resolution Reason</p>
                        {reason && reason !== "No summary provided." ? (
                          <p className="text-base font-light text-slate-700 leading-relaxed">{reason}</p>
                        ) : (
                          <p className="text-sm font-light text-slate-300 italic">No reason provided.</p>
                        )}
                      </div>

                      {/* Meta row */}
                      {source && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6">
                          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium mb-3">Source</p>
                          <p className="text-sm font-light text-slate-600 capitalize">{source}</p>
                        </div>
                      )}

                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>





      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}





function ConversationsPage() {
  return (
    <Suspense>
      <CallsTab />
    </Suspense>
  )
}

export default ConversationsPage
