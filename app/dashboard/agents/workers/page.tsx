"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Users, ChevronRight, Search, Network, GitBranch, Layers, Eye } from "lucide-react"
import { ListRowsSkeleton } from "@/components/page-skeletons"
import { Input } from "@/components/ui/input"
import Cookies from "js-cookie"

interface Agent {
  id: number
  name: string
  status: string
  primary: boolean
  worker_agents: any[]
  parent?: number | null
}

const PALETTE = [
  {
    avatar: "bg-violet-600", light: "bg-violet-50", border: "border-violet-200",
    text: "text-violet-700", badge: "bg-violet-100 text-violet-700", lineColor: "#8b5cf6",
    headerBg: "bg-violet-600",
  },
  {
    avatar: "bg-blue-600", light: "bg-blue-50", border: "border-blue-200",
    text: "text-blue-700", badge: "bg-blue-100 text-blue-700", lineColor: "#3b82f6",
    headerBg: "bg-blue-600",
  },
  {
    avatar: "bg-teal-600", light: "bg-teal-50", border: "border-teal-200",
    text: "text-teal-700", badge: "bg-teal-100 text-teal-700", lineColor: "#14b8a6",
    headerBg: "bg-teal-600",
  },
  {
    avatar: "bg-rose-600", light: "bg-rose-50", border: "border-rose-200",
    text: "text-rose-700", badge: "bg-rose-100 text-rose-700", lineColor: "#f43f5e",
    headerBg: "bg-rose-600",
  },
  {
    avatar: "bg-amber-500", light: "bg-amber-50", border: "border-amber-200",
    text: "text-amber-700", badge: "bg-amber-100 text-amber-700", lineColor: "#f59e0b",
    headerBg: "bg-amber-500",
  },
  {
    avatar: "bg-emerald-600", light: "bg-emerald-50", border: "border-emerald-200",
    text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", lineColor: "#10b981",
    headerBg: "bg-emerald-600",
  },
]

function SectionHeader({
  icon, title, subtitle, count,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  count: number
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 leading-tight">{title}</h2>
          <p className="text-xs text-slate-500 font-light">{subtitle}</p>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
        {count}
      </span>
    </div>
  )
}

export default function WorkerAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set())
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => { fetchAgents() }, [])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
      })
      const data = await res.json()
      const enriched: Agent[] = Array.isArray(data)
        ? data.map((a: any) => ({
            id: a.id,
            name: a.name,
            status: a.status,
            primary: a.primary || false,
            worker_agents: a.worker_agents || [],
            parent: a.parent ?? null,
          }))
        : []
      setAgents(enriched)
    } catch {
      toast({ title: "Error", description: "Failed to fetch agents", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // ── Categorise ────────────────────────────────────────────────────────────
  const parentAgents = useMemo(
    () => agents.filter((a) => a.worker_agents.length > 0 && (a.parent === null || a.parent === undefined)),
    [agents]
  )
  const workerAgents = useMemo(
    () => agents.filter((a) => a.parent !== null && a.parent !== undefined),
    [agents]
  )
  const standaloneAgents = useMemo(
    () => agents.filter((a) => a.worker_agents.length === 0 && (a.parent === null || a.parent === undefined)),
    [agents]
  )

  // ── Stable colour per parent ──────────────────────────────────────────────
  const parentColorMap = useMemo(() => {
    const map = new Map<number, (typeof PALETTE)[0]>()
    parentAgents.forEach((p, i) => map.set(p.id, PALETTE[i % PALETTE.length]))
    return map
  }, [parentAgents])

  const getWorkers = (parentId: number) => agents.filter((a) => a.parent === parentId)

  const toggleParent = (id: number) => {
    setExpandedParents((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Search filtering ──────────────────────────────────────────────────────
  const q = searchQuery.toLowerCase()
  const matches = (a: Agent) => a.name.toLowerCase().includes(q)

  const filteredParents    = parentAgents.filter(matches)
  const filteredWorkers    = workerAgents.filter(matches)
  const filteredStandalone = standaloneAgents.filter(matches)
  const totalEmpty         = filteredParents.length === 0 && filteredWorkers.length === 0 && filteredStandalone.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-6 py-12 max-w-5xl">

        {/* ── Page header ── */}
        <div className="mb-10 space-y-4">
          <h1 className="text-4xl font-light tracking-tight text-slate-900">Worker Agents</h1>
          <p className="text-slate-500 font-light">
            Manage hierarchies and assignments across your agent network
          </p>
          {!loading && (
            <div className="flex items-center gap-8 pt-2">
              {[
                { value: parentAgents.length,    label: "Orchestrating", color: "bg-violet-500" },
                { value: workerAgents.length,     label: "Workers",       color: "bg-blue-500"   },
                { value: standaloneAgents.length, label: "Standalone",    color: "bg-slate-400"  },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-1 h-10 ${s.color} rounded-full`} />
                  <div>
                    <p className="text-2xl font-light text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Search ── */}
        <div className="mb-10">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search agents…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-white border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <ListRowsSkeleton rows={6} />
        ) : totalEmpty ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-5">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-lg font-light text-slate-700">
              {searchQuery ? "No agents match your search" : "No agents available"}
            </p>
          </div>
        ) : (
          <div className="space-y-14">

            {/* ════════════════════════════════════════
                SECTION 1 — Orchestrating Agents
            ════════════════════════════════════════ */}
            {filteredParents.length > 0 && (
              <section>
                <SectionHeader
                  icon={<Network className="w-4 h-4" />}
                  title="Orchestrating Agents"
                  subtitle="Agents that manage one or more workers — click to expand"
                  count={filteredParents.length}
                />

                <div className="space-y-3">
                  {filteredParents.map((agent) => {
                    const color    = parentColorMap.get(agent.id) ?? PALETTE[0]
                    const workers  = getWorkers(agent.id)
                    const expanded = expandedParents.has(agent.id)

                    return (
                      <div key={agent.id}>
                        {/* Parent row */}
                        <div
                          onClick={() => toggleParent(agent.id)}
                          className={`flex items-center gap-4 p-5 bg-white rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md select-none ${
                            expanded ? `${color.border} shadow-md` : "border-slate-200"
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`w-11 h-11 ${color.avatar} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}
                          >
                            <span className="text-white font-bold text-sm">
                              {agent.name.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{agent.name}</p>
                            <p className={`text-xs mt-0.5 font-medium ${color.text}`}>
                              {workers.length} worker{workers.length !== 1 ? "s" : ""}
                            </p>
                          </div>

                          {/* Status + eye + chevron */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${color.badge}`}
                            >
                              {agent.status}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/agents/workers/${agent.id}`) }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                              title="View agent detail"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </button>
                            <div
                              className={`transition-transform duration-300 ${expanded ? "rotate-90" : "rotate-0"}`}
                            >
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>
                        </div>

                        {/* Expanded worker branches */}
                        {expanded && workers.length > 0 && (
                          <div className="ml-7 mt-1.5 relative">
                            {/* Vertical spine */}
                            <div
                              className="absolute left-0 top-2 bottom-4 w-0.5 rounded-full"
                              style={{ backgroundColor: color.lineColor, opacity: 0.35 }}
                            />

                            <div className="pl-7 space-y-2.5 pb-1">
                              {workers.map((worker) => (
                                <div key={worker.id} className="relative">
                                  {/* Horizontal connector */}
                                  <div
                                    className="absolute left-[-28px] top-1/2 w-7 h-px"
                                    style={{ backgroundColor: color.lineColor, opacity: 0.35 }}
                                  />

                                  <div
                                    className={`flex items-center gap-3 p-4 rounded-xl border ${color.light} ${color.border}`}
                                  >
                                    <div
                                      className={`w-8 h-8 ${color.avatar} rounded-lg flex items-center justify-center flex-shrink-0 opacity-75`}
                                    >
                                      <span className="text-white text-xs font-bold">
                                        {worker.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-800 flex-1 truncate">
                                      {worker.name}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.badge}`}
                                    >
                                      {worker.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════════
                SECTION 2 — Worker Agents (grouped)
            ════════════════════════════════════════ */}
            {filteredWorkers.length > 0 && (
              <section>
                <SectionHeader
                  icon={<GitBranch className="w-4 h-4" />}
                  title="Worker Agents"
                  subtitle="Agents assigned to an orchestrating agent, grouped by their manager"
                  count={filteredWorkers.length}
                />

                <div className="space-y-8">
                  {parentAgents
                    .filter((p) => getWorkers(p.id).filter(matches).length > 0)
                    .map((parent) => {
                      const color   = parentColorMap.get(parent.id) ?? PALETTE[0]
                      const workers = getWorkers(parent.id).filter(matches)

                      return (
                        <div key={parent.id}>
                          {/* Group header strip */}
                          <div
                            className={`flex items-center gap-3 mb-3 px-4 py-3 rounded-xl ${color.light} border ${color.border}`}
                          >
                            <div
                              className={`w-7 h-7 ${color.avatar} rounded-lg flex items-center justify-center flex-shrink-0`}
                            >
                              <span className="text-white text-xs font-bold">
                                {parent.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] font-bold uppercase tracking-widest ${color.text}`}>
                                Managed by
                              </p>
                              <p className="text-sm font-semibold text-slate-800 truncate">{parent.name}</p>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${color.badge}`}>
                              {workers.length} worker{workers.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Worker cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
                            {workers.map((worker) => (
                              <div
                                key={worker.id}
                                className="relative flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 overflow-hidden"
                              >
                                {/* Left colour accent bar */}
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                                  style={{ backgroundColor: color.lineColor }}
                                />

                                <div
                                  className={`w-9 h-9 ${color.avatar} rounded-lg flex items-center justify-center flex-shrink-0 ml-1`}
                                >
                                  <span className="text-white text-sm font-bold">
                                    {worker.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{worker.name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        worker.status === "active" || worker.status === "Active"
                                          ? "bg-emerald-500"
                                          : "bg-slate-300"
                                      }`}
                                    />
                                    <p className="text-xs text-slate-500">{worker.status}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════════
                SECTION 3 — Standalone Agents
            ════════════════════════════════════════ */}
            {filteredStandalone.length > 0 && (
              <section>
                <SectionHeader
                  icon={<Layers className="w-4 h-4" />}
                  title="Standalone Agents"
                  subtitle="No workers assigned and not a worker of any agent"
                  count={filteredStandalone.length}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredStandalone.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => router.push(`/dashboard/agents/workers/${agent.id}`)}
                      className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 cursor-pointer transition-all hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-600 font-semibold text-sm">
                          {agent.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{agent.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              agent.status === "active" || agent.status === "Active"
                                ? "bg-emerald-500"
                                : "bg-slate-300"
                            }`}
                          />
                          <p className="text-xs text-slate-500">{agent.status}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        <div className="mt-20 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-400 font-light">© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    </div>
  )
}