"use client"

import React, { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Activity, Plus, Edit, Trash, BarChart3, X, Clock, User, FileText, Layers, ArrowRight, Eye, RotateCcw } from "lucide-react"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"
import { ListPageSkeleton } from "@/components/page-skeletons"

type ActionLog = {
  id: number
  action: "create" | "update" | "delete" | string
  content_type: string
  user: string
  object_id: string | number
  description: string
  timestamp: string
  changes?: Record<string, { old: unknown; new: unknown }>
  highlight_changes?: Record<string, { highlight: boolean; old?: unknown; new?: unknown }>
}

type DiffLine = { type: "same" | "add" | "remove"; line: string }

const Button = ({
  children,
  onClick,
  disabled,
  className = "",
  size = "default",
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
  size?: string
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ${
      size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2"
    } ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
)

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
)

function diffLines(oldStr: unknown, newStr: unknown): DiffLine[] {
  const toString = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'string') return v
    return JSON.stringify(v, null, 2)
  }
  const a = toString(oldStr).split('\n')
  const b = toString(newStr).split('\n')
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
  const result: DiffLine[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { result.unshift({ type: 'same', line: a[i - 1] }); i--; j-- }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { result.unshift({ type: 'add', line: b[j - 1] }); j-- }
    else { result.unshift({ type: 'remove', line: a[i - 1] }); i-- }
  }
  return result
}

const LogDetailModal = ({
  log,
  onClose,
  onRevert,
  revertingId,
}: {
  log: ActionLog | null
  onClose: () => void
  onRevert: (id: number) => void
  revertingId: number | null
}) => {
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

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return "null"
    if (Array.isArray(value)) {
      if (value.length === 0) return "[ ]"
      return value.map(v => typeof v === 'string' ? `"${v}"` : JSON.stringify(v)).join(", ")
    }
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    if (typeof value === 'string') return `"${value}"`
    return String(value)
  }

  const highlightDifferences = (oldVal: unknown, newVal: unknown) => {
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
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
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
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 font-light capitalize">
                  {log.action}
                </Badge>
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 font-light">
                  {log.content_type}
                </Badge>
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
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">User ID</p>
              </div>
              <p className="text-xl text-slate-900 font-light">{log.user}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4 text-cyan-600" />
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Object ID</p>
              </div>
              <p className="text-xl text-slate-900 font-light font-mono">{log.object_id}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Timestamp</p>
              </div>
              <p className="text-sm text-slate-900 font-light">
                {new Date(log.timestamp).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
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
                {Object.entries(log.changes).map(([field, change]) => {
                  const highlightInfo = log.highlight_changes?.[field]

                  if (highlightInfo?.highlight === true) {
                    const lines = diffLines(highlightInfo.old, highlightInfo.new)
                    return (
                      <div key={field} className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-6 border border-slate-200">
                        <div className="mb-4 flex items-center justify-between">
                          <Badge className="bg-slate-100 text-slate-700 border-0 font-mono text-xs">{field}</Badge>
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Modified</Badge>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-slate-200 font-mono text-xs">
                          <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 text-xs">
                            <span className="text-rose-400">--- previous</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-emerald-400">+++ current</span>
                          </div>
                          <div className="overflow-x-auto max-h-80 overflow-y-auto">
                            {lines.map((ln, idx) => (
                              <div key={idx} className={`flex min-w-0 ${ln.type === 'remove' ? 'bg-rose-50' : ln.type === 'add' ? 'bg-emerald-50' : 'bg-white'}`}>
                                <span className={`flex-shrink-0 w-6 text-center select-none py-0.5 border-r ${ln.type === 'remove' ? 'text-rose-500 bg-rose-100 border-rose-200' : ln.type === 'add' ? 'text-emerald-600 bg-emerald-100 border-emerald-200' : 'text-slate-300 bg-slate-50 border-slate-100'}`}>
                                  {ln.type === 'remove' ? '-' : ln.type === 'add' ? '+' : ' '}
                                </span>
                                <span className={`px-3 py-0.5 whitespace-pre-wrap break-all leading-5 ${ln.type === 'remove' ? 'text-rose-800' : ln.type === 'add' ? 'text-emerald-800' : 'text-slate-600'}`}>
                                  {ln.line || ' '}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const diff = highlightDifferences(change.old, change.new)
                  return (
                    <div key={field} className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-6 border border-slate-200">
                      <div className="mb-4 flex items-center justify-between">
                        <Badge className="bg-slate-100 text-slate-700 border-0 font-mono text-xs">
                          {field}
                        </Badge>
                        {diff.hasDiff && (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                            Modified
                          </Badge>
                        )}
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

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-light">
              Log Entry #{log.id}
            </p>
            {log.action === 'update' ? (
              <button
                onClick={() => onRevert && onRevert(log.id)}
                disabled={revertingId === log.id}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className={`w-4 h-4 ${revertingId === log.id ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">{revertingId === log.id ? 'Reverting...' : 'Revert Changes'}</span>
              </button>
            ) : (
              <div title="Action not allowed for this log type" className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl cursor-not-allowed select-none">
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm font-medium line-through">Revert Changes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

export default function ActionLogsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null)
  const [revertingId, setRevertingId] = useState<number | null>(null)
  const { toast } = useToast()
  const logsPerPage = 15

  const handleRevert = async (id: number) => {
    setRevertingId(id)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/reports/action-logs/${id}/revert/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`)
      toast({ title: "Changes reverted", description: "The action has been successfully reverted." })
      setSelectedLog(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong."
      toast({ title: "Failed to revert", description: message, variant: "destructive" })
    } finally {
      setRevertingId(null)
    }
  }

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/reports/action-logs/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })

        if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`)

        const data = await res.json()
        setLogs(data)
      } catch (error) {
        console.error("Error fetching logs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const totalLogs = logs.length
  const createCount = logs.filter(log => log.action === "create").length
  const updateCount = logs.filter(log => log.action === "update").length
  const deleteCount = logs.filter(log => log.action === "delete").length

  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(logs.length / logsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-emerald-50 text-emerald-700 border border-emerald-200"
      case "update": return "bg-blue-50 text-blue-700 border border-blue-200"
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
    return <ListPageSkeleton rows={8} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} onRevert={handleRevert} revertingId={revertingId} />}

      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50"></div>
        
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1 h-20 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full"></div>
            <div>
              <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">
                Activity Monitor
              </h1>
              <p className="text-lg text-slate-500 font-light tracking-wide">
                Real-time system action logs and analytics
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:scale-110 transition-all duration-300">
                  <Activity className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <BarChart3 className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{totalLogs}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Total Actions</p>
            </div>

            <div className="group bg-white border border-emerald-200 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:scale-110 transition-all duration-300">
                  <Plus className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                  {totalLogs > 0 ? Math.round((createCount / totalLogs) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{createCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Created</p>
            </div>

            <div className="group bg-white border border-blue-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300">
                  <Edit className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                  {totalLogs > 0 ? Math.round((updateCount / totalLogs) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{updateCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Updated</p>
            </div>

            <div className="group bg-white border border-rose-200 rounded-2xl p-6 hover:shadow-lg hover:border-rose-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:scale-110 transition-all duration-300">
                  <Trash className="w-6 h-6 text-rose-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded-full">
                  {totalLogs > 0 ? Math.round((deleteCount / totalLogs) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{deleteCount}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Deleted</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-5 border-b border-slate-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-600 uppercase tracking-wider">
              <div className="col-span-2">Description</div>
              <div className="col-span-2">Content Type</div>
              <div className="col-span-2">User</div>
              <div className="col-span-2">Action</div>
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {currentLogs.map((log, index) => (
              <div
                key={log.id || index}
                className="relative px-4 md:px-8 py-4 hover:bg-slate-50/50 transition-all duration-200 group border-l-4 border-transparent hover:border-slate-300"
              >
                {/* Mobile card layout */}
                <div className="flex flex-col gap-3 md:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 font-light leading-snug">{log.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {log.object_id}</p>
                    </div>
                    <Badge className={`${getActionColor(log.action)} font-light capitalize flex-shrink-0`}>{log.action}</Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${getContentTypeColor(log.content_type)} font-light`}>{log.content_type}</Badge>
                    <span className="text-xs text-slate-500">{log.user}</span>
                    <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedLog(log)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all duration-200">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-medium">View</span>
                    </button>
                    {log.action === 'update' ? (
                      <button onClick={() => handleRevert(log.id)} disabled={revertingId === log.id} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        <RotateCcw className={`w-4 h-4 ${revertingId === log.id ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-medium">{revertingId === log.id ? '...' : 'Revert'}</span>
                      </button>
                    ) : (
                      <div title="Action not allowed for this log type" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed select-none">
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-xs font-medium line-through">Revert</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop grid layout */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2">
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
                    <p className="text-sm text-slate-600 font-light">{new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => setSelectedLog(log)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all duration-200 cursor-pointer">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-medium">View</span>
                    </button>
                    {log.action === 'update' ? (
                      <button onClick={() => handleRevert(log.id)} disabled={revertingId === log.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        <RotateCcw className={`w-4 h-4 ${revertingId === log.id ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-medium">{revertingId === log.id ? '...' : 'Revert'}</span>
                      </button>
                    ) : (
                      <div title="Action not allowed for this log type" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed select-none">
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-xs font-medium line-through">Revert</span>
                      </div>
                    )}
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
                  <span className="font-medium text-slate-900">
                    {Math.min(indexOfLastLog, totalLogs)}
                  </span>{" "}
                  of <span className="font-medium text-slate-900">{totalLogs}</span> results
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || 
                               page === totalPages || 
                               Math.abs(page - currentPage) <= 1
                      })
                      .map((page, index, array) => {
                        const prevPage = array[index - 1]
                        const showEllipsis = prevPage && page - prevPage > 1
                        
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="px-2 text-slate-400">...</span>
                            )}
                            <Button
                              onClick={() => handlePageChange(page)}
                              className={`min-w-[40px] px-3 py-2 rounded-lg transition-all duration-200 ${
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
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
                    size="sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 flex items-center justify-center gap-2">
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}