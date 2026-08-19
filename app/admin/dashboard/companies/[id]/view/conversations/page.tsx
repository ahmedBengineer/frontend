"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Phone,
  Clock,
  MessageSquare,
  Filter,
  Calendar,
} from "lucide-react"
import Cookies from "js-cookie"

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

export default function ViewCompanyConversations() {
  const params = useParams()
  const companyId = params.id
  const { toast } = useToast()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [viewType, setViewType] = useState<"transcript" | "summary" | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [triggerSearch, setTriggerSearch] = useState(0)
  const [dateFilter, setDateFilter] = useState<"7days" | "10days" | "30days" | "custom" | "all">("all")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const [pageInput, setPageInput] = useState("")

  const format = (d: Date) => d.toISOString().split("T")[0]

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(pageInput)
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        setCurrentPage(pageNum)
        setPageInput("")
      } else {
        toast({
          title: "Invalid page number",
          description: `Please enter a number between 1 and ${totalPages}`,
          className: "bg-red-50 border-red-400 text-red-800",
        })
      }
    }
  }

  // Fetch conversations — same endpoint as user-side, passing company_id so backend scopes to this company
  useEffect(() => {
    async function fetchMessages() {
      try {
        setPageLoading(true)

        const params = new URLSearchParams()
        params.append("company_id", String(companyId))
        params.append("page", currentPage.toString())

        if (searchTerm.trim() !== "") {
          params.append("search", searchTerm.trim())
        }

        const today = new Date()

        if (dateFilter === "7days") {
          const d = new Date(today); d.setDate(d.getDate() - 7)
          params.append("date_from", format(d))
          params.append("date_to", format(today))
        } else if (dateFilter === "10days") {
          const d = new Date(today); d.setDate(d.getDate() - 10)
          params.append("date_from", format(d))
          params.append("date_to", format(today))
        } else if (dateFilter === "30days") {
          const d = new Date(today); d.setDate(d.getDate() - 30)
          params.append("date_from", format(d))
          params.append("date_to", format(today))
        } else if (dateFilter === "custom" && customStart && customEnd) {
          params.append("date_from", customStart)
          params.append("date_to", customEnd)
        }

        const token = Cookies.get("adminToken")
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/messages/conversations/?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token || ""}`,
            },
          }
        )

        if (!res.ok) throw new Error("Failed to fetch conversations")

        const data = await res.json()
        const results = data.results ? Object.values(data.results).flat() as Message[] : []
        setMessages(results)
        setTotalPages(data.total_pages || 1)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
        setPageLoading(false)
      }
    }

    fetchMessages()
  }, [companyId, currentPage, triggerSearch, dateFilter, customStart, customEnd])

  // Group messages by session_id (same as user-side)
  const grouped = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const key = msg.session_id || (msg as any).sessionID || ""
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(msg)
    return acc
  }, {})

  // Sort sessions by most recent first (backend already paginated)
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
      <div className="flex flex-col justify-center items-center h-64 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-slate-600 font-light tracking-wide">Loading conversations...</p>
      </div>
    )

  if (error) return <div className="p-6 text-red-600 text-center">Error: {error}</div>

  return (
    <div className="flex bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden rounded-xl" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
      {/* Left Panel - Conversations List */}
      <div className={`${selectedSession ? "w-2/5" : "flex-1"} flex flex-col bg-white border-r border-slate-200 h-full`}>
        {/* Header */}
        <div className="relative overflow-hidden bg-white border-b border-slate-200 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50"></div>

          <div className="relative px-8 py-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1 h-16 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full"></div>
              <div>
                <h1 className="text-4xl font-extralight tracking-tight text-slate-900 mb-1">
                  Call History
                </h1>
                <p className="text-base text-slate-500 font-light tracking-wide">
                  {sortedSessions.length} conversation{sortedSessions.length !== 1 ? "s" : ""}
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
                onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(1); setTriggerSearch((x) => x + 1) } }}
                className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 px-5 py-3 pl-12 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all duration-300"
              />
              <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-200 ${
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
              <div>
                <label className="flex items-center gap-2 text-xs text-slate-700 uppercase tracking-wider font-medium mb-2">
                  <Calendar className="w-3 h-3" />
                  Time Period
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all duration-300 appearance-none cursor-pointer font-light"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value as any); setCurrentPage(1) }}
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

              <button
                onClick={() => {
                  setSearchTerm("")
                  setDateFilter("all")
                  setCustomStart("")
                  setCustomEnd("")
                  setCurrentPage(1)
                  setTriggerSearch((x) => x + 1)
                }}
                className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-200 font-light w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-8 space-y-4">
            {pageLoading ? (
              <>
                {Array.from({ length: 10 }).map((_, i) => (
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

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-light">
                              <Clock className="w-3.5 h-3.5" />
                              {callDuration}
                            </span>
                            <span className="flex items-center gap-1 font-light">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {msgs.length}
                            </span>
                          </div>
                        </div>
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
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 font-light">
                Page {currentPage} of {totalPages}
              </span>
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputSubmit}
                placeholder="Go to"
                className="w-20 px-3 py-1.5 text-sm text-center rounded-xl border border-slate-300 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all duration-200 font-light"
              />
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Chat View */}
      {selectedSession && (
        <div className="w-3/5 flex flex-col h-full">
          {/* Chat Header */}
          <div className="bg-slate-900 border-b border-slate-700 px-6 py-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-light text-white text-lg">
                    {selectedMessages?.find((m) => m.caller_number)?.caller_number || "Unknown"}
                  </h2>
                  <p className="text-sm text-slate-400 font-light">
                    {selectedMessages?.[0]?.phonenumber || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewType("transcript")}
                  className={`px-5 py-2.5 rounded-xl transition-all duration-200 font-light ${
                    viewType === "transcript"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  Transcript
                </button>
                <button
                  onClick={() => setViewType("summary")}
                  className={`px-5 py-2.5 rounded-xl transition-all duration-200 font-light ${
                    viewType === "summary"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => {
                    setSelectedSession(null)
                    setViewType(null)
                  }}
                  className="p-2.5 hover:bg-slate-800 rounded-xl transition-all duration-200 text-slate-400 hover:text-white ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50 min-h-0"
            style={{ scrollBehavior: 'smooth' }}
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

            {viewType === "summary" && (
              <div className="h-full flex items-start justify-center p-8 pt-8">
                {latestSummary ? (
                  <div className="max-w-3xl w-full" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-3xl shadow-2xl border border-slate-200">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-600/5 rounded-full blur-3xl"></div>

                      <div className="relative p-10">
                        <div className="flex items-start gap-6 mb-8">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-500/30">
                              <MessageSquare className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-400 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-light text-slate-900 mb-2 flex items-center gap-3">
                              Call Summary
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-slate-600 font-light">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-slate-600" />
                                {new Date(latestSummary.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-4 h-4 text-slate-600" />
                                {new Date(latestSummary.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-slate-900 via-slate-500 to-slate-300 rounded-full"></div>
                          <div className="pl-8 pr-4">
                            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-light text-base">
                              {latestSummary.summary}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <MessageSquare className="w-12 h-12 text-slate-400" />
                    </div>
                    <p className="text-slate-700 font-light text-xl mb-3">No summary available</p>
                    <p className="text-sm text-slate-500 font-light max-w-sm mx-auto">
                      Summary will be automatically generated after the call ends
                    </p>
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

