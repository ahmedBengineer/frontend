"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  ArrowLeft,
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
}

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
  const [viewType, setViewType] = useState<"transcript" | "summary" | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<"7days" | "10days" | "30days" | "custom" | "all">("all")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [triggerSearch, setTriggerSearch] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

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
        const summaryMsg = sortedMsgs.find((m) => m.type === "summary")
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
        if (currentPage === 1) setLoading(true)
        else setPageLoading(true)

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
        const groupedResults = data.results ? Object.values(data.results).flat() : []
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
  const latestSummary = selectedMessages?.find((m) => m.type === "summary") || null

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

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-700 rounded-full"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-slate-300 font-light tracking-wide">Loading conversations...</p>
      </div>
    )

  if (error) return <div className="p-6 text-red-600 text-center">Error: {error}</div>

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Panel - Conversations List */}
      <div className={`${selectedSession ? "w-2/5" : "w-full"} flex flex-col bg-white border-r border-slate-200`}>
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-teal-900/40 backdrop-blur-xl border-b border-emerald-700/30 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5"></div>
          
          <div className="relative p-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-1 h-16 bg-gradient-to-b from-emerald-400 via-emerald-600 to-teal-800 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-extralight tracking-tight text-white mb-1">
                  Call History
                </h1>
                <p className="text-sm text-emerald-100 font-light tracking-wide">
                  {sortedSessions.length} conversations
                </p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setTriggerSearch((x) => x + 1)}
                className="pl-14 pr-14 py-6 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 shadow-sm"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all duration-300 ${
                  showFilters 
                    ? 'bg-emerald-100 text-emerald-600 rotate-180' 
                    : 'hover:bg-slate-100 text-slate-500 hover:text-emerald-600'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="relative overflow-hidden bg-slate-50 border-b border-slate-200 flex-shrink-0" style={{ animation: 'slideDown 0.3s ease-out' }}>
            <div className="relative p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Phone Number Filter */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 uppercase tracking-wider font-medium mb-2">
                    <Hash className="w-3 h-3" />
                    Phone Number
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 appearance-none cursor-pointer"
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
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 uppercase tracking-wider font-medium mb-2">
                    <Calendar className="w-3 h-3" />
                    Time Period
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 appearance-none cursor-pointer"
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
                <div className="grid grid-cols-2 gap-3 pt-2" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                  />
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setDateFilter("all")
                    setCustomStart("")
                    setCustomEnd("")
                    setSelectedNumber("")
                    setTriggerSearch((x) => x + 1)
                  }}
                  className="px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 font-light"
                >
                  Clear Filters
                </button>
                <button
                  onClick={exportCSV}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-500 hover:to-emerald-600 transition-all duration-300 font-light flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto relative" style={{ scrollBehavior: 'smooth', scrollPaddingBottom: '120px' }}>
          {pageLoading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-10">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-slate-700 rounded-full"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>
          )}

          <div className="pb-4">
            {sortedSessions.map(([session_id, msgs]) => {
              const sortedMsgs = [...msgs].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              )
              const startedAt = new Date(sortedMsgs[0].timestamp)
              const startedAtMs = startedAt.getTime()

              const summaryMsg = sortedMsgs.find((m) => m.type === "summary")
              const endedAtMs = summaryMsg
                ? new Date(summaryMsg.timestamp).getTime() + 15000
                : new Date(sortedMsgs[sortedMsgs.length - 1].timestamp).getTime()

              const callDuration = formatDuration(endedAtMs - startedAtMs)
              const phoneNumber = msgs[0]?.phonenumber || "Unknown"
              const callerNumber = msgs.find((m) => m.caller_number)?.caller_number || "N/A"
              const previewText = summaryMsg
                ? summaryMsg.summary.split(" ").slice(0, 8).join(" ") + "..."
                : "Tap to view transcript"

              const isSelected = selectedSession === session_id

              return (
                <div
                  key={session_id}
                  onClick={() => {
                    setSelectedSession(session_id)
                    setViewType("transcript")
                  }}
                  className={`relative mx-3 my-2 p-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
                    isSelected 
                      ? "bg-emerald-50 shadow-lg shadow-emerald-500/10 border border-emerald-200" 
                      : "bg-gradient-to-br from-white to-emerald-50/20 hover:from-emerald-50/30 hover:to-white border border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isSelected
                        ? "bg-emerald-600"
                        : "bg-emerald-50 group-hover:bg-emerald-100"
                    }`}>
                      <Phone className={`w-5 h-5 transition-colors duration-300 ${
                        isSelected ? "text-white" : "text-emerald-600 group-hover:text-emerald-700"
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-slate-900 truncate text-base">{callerNumber}</h3>
                        <span className={`text-xs font-medium ml-2 transition-colors duration-300 ${
                          isSelected ? "text-emerald-700" : "text-emerald-600 group-hover:text-emerald-700"
                        }`}>{formatTime(sortedMsgs[0].timestamp)}</span>
                      </div>
                      
                      <p className="text-xs text-slate-600 mb-1.5 truncate font-medium">{phoneNumber}</p>
                      
                      <p className="text-sm text-slate-700 truncate font-normal leading-relaxed mb-2">{previewText}</p>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`flex items-center gap-1 font-medium transition-colors duration-300 ${
                          isSelected ? "text-slate-600" : "text-emerald-600 group-hover:text-emerald-700"
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {callDuration}
                        </span>
                        <span className={`flex items-center gap-1 font-medium transition-colors duration-300 ${
                          isSelected ? "text-slate-600" : "text-emerald-600 group-hover:text-emerald-700"
                        }`}>
                          <MessageSquare className="w-3.5 h-3.5" />
                          {msgs.length}
                        </span>
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-all duration-300 group/delete">
                          <Trash2 className="w-4 h-4 text-slate-600 group-hover/delete:text-red-500 transition-colors duration-300" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Delete this conversation?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            This will permanently delete all messages under this session.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
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
          </div>
        </div>

        {/* Pagination */}
        <div className="relative overflow-hidden bg-white border-t border-slate-200 flex-shrink-0">
          <div className="relative px-6 py-4 flex items-center justify-center gap-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 font-medium">
                {currentPage}
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-sm text-slate-400">
                {conversationTotalPages}
              </span>
            </div>

            <input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputSubmit}
              placeholder="Go to"
              className="w-20 px-3 py-1.5 text-sm text-center rounded-lg border border-slate-300 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
            />

            <button
              disabled={currentPage === conversationTotalPages}
              onClick={() => setCurrentPage((p) => Math.min(conversationTotalPages, p + 1))}
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Chat View */}
      {selectedSession && (
        <div className="w-3/5 flex flex-col">
          {/* Chat Header */}
          <div className="relative overflow-hidden bg-[#1b574a] border-b border-emerald-700/40 flex-shrink-0">
            <div className="relative p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-light text-white text-lg">
                    {selectedMessages?.find((m) => m.caller_number)?.caller_number || "Unknown"}
                  </h2>
                  <p className="text-sm text-emerald-100 font-light">
                    {selectedMessages?.[0]?.phonenumber || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewType("transcript")}
                  className={`px-5 py-2.5 rounded-xl transition-all duration-300 font-light ${
                    viewType === "transcript"
                      ? "bg-emerald-700/80 text-white"
                      : "text-emerald-100 hover:bg-emerald-800/30 hover:text-white"
                  }`}
                >
                  Transcript
                </button>
                <button
                  onClick={() => setViewType("summary")}
                  className={`px-5 py-2.5 rounded-xl transition-all duration-300 font-light ${
                    viewType === "summary"
                      ? "bg-emerald-700/80 text-white"
                      : "text-emerald-100 hover:bg-emerald-800/30 hover:text-white"
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => {
                    setSelectedSession(null)
                    setViewType(null)
                  }}
                  className="p-2.5 hover:bg-emerald-800/30 rounded-xl transition-all duration-300 text-emerald-100 hover:text-white ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div 
            className="flex-1 overflow-y-auto p-8 space-y-6 bg-cover bg-center bg-no-repeat" 
            style={{ 
              scrollBehavior: 'smooth',
              backgroundImage: "url('/chat_bg.jpg')"
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
                          <div className="w-20 h-20 rounded-3xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-10 h-10 text-slate-500" />
                          </div>
                          <p className="text-slate-700 font-medium text-lg mb-2">No transcript available</p>
                          <p className="text-sm text-slate-600 font-normal">This session contains only a summary</p>
                        </div>
                      </div>
                    )
                  }

                  return nonSummaryMsgs.map((m) => (
                    <div key={m.id} className="space-y-6">
                      {/* User Message */}
                      <div className="flex justify-end" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <div className="max-w-[70%]">
                          <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white rounded-3xl rounded-tr-md px-6 py-4 shadow-xl shadow-emerald-500/10">
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
                          <div className="bg-white rounded-3xl rounded-tl-md px-6 py-4 shadow-lg border border-slate-200">
                            <p className="text-sm text-slate-900 leading-relaxed font-normal">{m.assistant_response}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 font-light">
                            {formatTime(m.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                })()}
              </>
            )}

            {viewType === "summary" && (
              <div className="h-full flex items-start justify-center pt-12">
                {latestSummary ? (
                  <div className="max-w-2xl w-full" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <MessageSquare className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-xl mb-1">Call Summary</h3>
                          <p className="text-sm text-slate-600 font-medium">
                            {new Date(latestSummary.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-normal text-base">
                          {latestSummary.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-10 h-10 text-emerald-600" />
                    </div>
                    <p className="text-slate-700 font-medium text-lg mb-2">No summary available</p>
                    <p className="text-sm text-slate-600 font-normal">Summary will appear here after the call ends</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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

export default CallsTab
