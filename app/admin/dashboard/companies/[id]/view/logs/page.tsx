"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Activity, Plus, Edit, Trash, BarChart3, X, Clock, User, FileText, Layers, ArrowRight, Eye, Search } from "lucide-react"
import Cookies from "js-cookie"

const Button = ({ children, onClick, disabled, className = "", size = "default" }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ${
      size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2"
    } ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
)

const Badge = ({ children, className = "" }: any) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
)

const LogDetailModal = ({ log, onClose }: any) => {
  if (!log) return null

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create": return <Plus className="w-5 h-5" />
      case "update": return <Edit className="w-5 h-5" />
      case "delete": return <Trash className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  const getActionGradient = (action: string) => {
    switch (action) {
      case "create": return "from-emerald-500 to-emerald-600"
      case "update": return "from-blue-500 to-blue-600"
      case "delete": return "from-rose-500 to-rose-600"
      default: return "from-slate-500 to-slate-600"
    }
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "null"
    if (Array.isArray(value)) {
      if (value.length === 0) return "[ ]"
      return value.map((v: any) => typeof v === 'string' ? `"${v}"` : JSON.stringify(v)).join(", ")
    }
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    if (typeof value === 'string') return `"${value}"`
    return String(value)
  }

  const highlightDifferences = (oldVal: any, newVal: any) => {
    const oldStr = JSON.stringify(oldVal)
    const newStr = JSON.stringify(newVal)
    return { old: oldStr, new: newStr, hasDiff: oldStr !== newStr }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className={`relative bg-gradient-to-r ${getActionGradient(log.action)} px-8 py-8 text-white`}>
          <div className="absolute inset-0 bg-black/10"></div>

          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              {getActionIcon(log.action)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 font-light capitalize">{log.action}</Badge>
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 font-light">{log.content_type}</Badge>
              </div>
              <h2 className="text-2xl font-light tracking-tight">Action Details</h2>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Description</p>
                <p className="text-lg text-slate-900 font-light leading-relaxed">{log.description}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">User ID</p>
              </div>
              <p className="text-xl text-slate-900 font-light">{log.user}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-cyan-50 rounded-xl flex items-center justify-center">
                  <Layers className="w-4 h-4 text-cyan-600" />
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Object ID</p>
              </div>
              <p className="text-xl text-slate-900 font-light font-mono">{log.object_id}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Timestamp</p>
              </div>
              <p className="text-sm text-slate-900 font-light">
                {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          {log.changes && Object.keys(log.changes).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-slate-900 to-slate-400 rounded-full"></div>
                <h3 className="text-lg font-light text-slate-900">Changes Made</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(log.changes).map(([field, change]: [string, any]) => {
                  const diff = highlightDifferences(change.old, change.new)
                  return (
                    <div key={field} className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-6 border border-slate-200">
                      <div className="mb-4 flex items-center justify-between">
                        <Badge className="bg-slate-100 text-slate-700 border-0 font-mono text-xs">{field}</Badge>
                        {diff.hasDiff && <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Modified</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Previous</p>
                          </div>
                          <div className={`rounded-xl p-4 border-2 ${diff.hasDiff ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                            <pre className={`text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words ${diff.hasDiff ? 'text-rose-900 font-medium' : 'text-slate-600'}`}>
                              {formatValue(change.old)}
                            </pre>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Current</p>
                          </div>
                          <div className={`rounded-xl p-4 border-2 ${diff.hasDiff ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                            <pre className={`text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words ${diff.hasDiff ? 'text-emerald-900 font-medium' : 'text-slate-600'}`}>
                              {formatValue(change.new)}
                            </pre>
                          </div>
                        </div>
                      </div>
                      {diff.hasDiff && (
                        <div className="flex items-center justify-center mt-4">
                          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                            <ArrowRight className="w-4 h-4 text-slate-600" />
                            <span className="text-xs text-slate-600 font-medium">Value Changed</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center font-light">Log Entry #{log.id}</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  )
}

export default function AdminCompanyLogsPage() {
  const params = useParams()
  const companyId = params.id as string

  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const logsPerPage = 15

  useEffect(() => {
    const fetchLogs = async () => {
      try {

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/reports/action-logs/?company_id=${companyId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("adminToken") || ""}`,
            },
          }
        )
        if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`)
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : data.results ?? [])
      } catch (error) {
        console.error("Error fetching logs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [companyId])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      (log.description && log.description.toLowerCase().includes(query)) ||
      (log.content_type && log.content_type.toLowerCase().includes(query)) ||
      (log.action && log.action.toLowerCase().includes(query))
    )
  })

  const totalLogs = filteredLogs.length
  const createCount = filteredLogs.filter(log => log.action === "create").length
  const updateCount = filteredLogs.filter(log => log.action === "update").length
  const deleteCount = filteredLogs.filter(log => log.action === "delete").length

  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-emerald-50 text-emerald-700 border border-emerald-200"
      case "update": return "bg-blue-50 text-indigo-700 border border-blue-200"
      case "delete": return "bg-rose-50 text-rose-700 border border-rose-200"
      default: return "bg-slate-50 text-slate-700 border border-slate-200"
    }
  }

  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      user: "bg-purple-50 text-purple-700",
      agent: "bg-cyan-50 text-cyan-700",
      task: "bg-amber-50 text-amber-700",
      report: "bg-pink-50 text-pink-700",
      setting: "bg-indigo-50 text-indigo-700",
    }
    return colors[type] || "bg-slate-50 text-slate-700"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="relative overflow-hidden bg-white border-b border-slate-200 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50"></div>
          <div className="relative px-8 py-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1 h-16 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full"></div>
              <div>
                <div className="h-10 w-64 bg-slate-200 rounded-xl animate-pulse"></div>
                <div className="h-4 w-40 bg-slate-100 rounded-lg animate-pulse mt-2"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse"></div>
                    <div className="w-8 h-4 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                  <div className="h-8 w-12 bg-slate-200 rounded-lg animate-pulse mb-1"></div>
                  <div className="h-3 w-20 bg-slate-100 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 pb-12">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-5 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-600 uppercase tracking-wider">
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Content Type</div>
                <div className="col-span-2">User</div>
                <div className="col-span-2">Action</div>
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-1 text-right">Details</div>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-8 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3 space-y-2">
                      <div className="h-4 w-full bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                    <div className="col-span-2">
                      <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="col-span-2">
                      <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="col-span-2">
                      <div className="h-5 w-14 bg-slate-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-3 w-16 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <div className="h-7 w-16 bg-slate-200 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      {/* Stats header */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50"></div>
        <div className="relative px-8 py-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1 h-16 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full"></div>
            <div>
              <h1 className="text-4xl font-extralight tracking-tight text-slate-900 mb-1">Activity Monitor</h1>
              <p className="text-sm text-slate-500 font-light tracking-wide">Company #{companyId} · action logs</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:scale-110 transition-all duration-300">
                  <Activity className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <BarChart3 className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-light text-slate-900 mb-0.5">{totalLogs}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Total Actions</p>
            </div>

            <div className="group bg-white border border-emerald-200 rounded-2xl p-5 hover:shadow-lg hover:border-emerald-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:scale-110 transition-all duration-300">
                  <Plus className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                  {totalLogs > 0 ? Math.round((createCount / totalLogs) * 100) : 0}%
                </div>
              </div>
              <p className="text-2xl font-light text-slate-900 mb-0.5">{createCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Created</p>
            </div>

            <div className="group bg-white border border-blue-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:scale-110 transition-all duration-300">
                  <Edit className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-indigo-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                  {totalLogs > 0 ? Math.round((updateCount / totalLogs) * 100) : 0}%
                </div>
              </div>
              <p className="text-2xl font-light text-slate-900 mb-0.5">{updateCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Updated</p>
            </div>

            <div className="group bg-white border border-rose-200 rounded-2xl p-5 hover:shadow-lg hover:border-rose-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:scale-110 transition-all duration-300">
                  <Trash className="w-5 h-5 text-rose-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded-full">
                  {totalLogs > 0 ? Math.round((deleteCount / totalLogs) * 100) : 0}%
                </div>
              </div>
              <p className="text-2xl font-light text-slate-900 mb-0.5">{deleteCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Deleted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search input */}
      <div className="px-8 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="px-8 pb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-5 border-b border-slate-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-600 uppercase tracking-wider">
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Content Type</div>
              <div className="col-span-2">User</div>
              <div className="col-span-2">Action</div>
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-1 text-right">Details</div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {currentLogs.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <p className="text-slate-400 font-light">No activity logs found for this company.</p>
              </div>
            ) : currentLogs.map((log, index) => (
              <div
                key={log.id || index}
                className="relative px-8 py-4 hover:bg-slate-50/50 transition-all duration-200 group border-l-4 border-transparent hover:border-slate-300"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <p className="text-sm text-slate-900 font-light leading-snug">{log.description}</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">ID: {log.object_id}</p>
                  </div>
                  <div className="col-span-2">
                    <Badge className={`${getContentTypeColor(log.content_type)} font-light`}>{log.content_type}</Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-700 font-light truncate">{log.user}</p>
                  </div>
                  <div className="col-span-2">
                    <Badge className={`${getActionColor(log.action)} font-light capitalize`}>{log.action}</Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 font-light">
                      {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all duration-200 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-medium">View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 font-light">
                  Showing <span className="font-medium text-slate-900">{indexOfFirstLog + 1}</span> to{" "}
                  <span className="font-medium text-slate-900">{Math.min(indexOfLastLog, totalLogs)}</span>{" "}
                  of <span className="font-medium text-slate-900">{totalLogs}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((page, index, array) => {
                        const prevPage = array[index - 1]
                        const showEllipsis = prevPage && page - prevPage > 1
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && <span className="px-2 text-slate-400">...</span>}
                            <Button
                              onClick={() => handlePageChange(page)}
                              className={`min-w-[40px] px-3 py-2 rounded-xl transition-all duration-200 ${
                                currentPage === page
                                  ? "bg-slate-900 text-white shadow-lg"
                                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                              }`}
                              size="sm"
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        )
                      })}
                  </div>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
                    size="sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
