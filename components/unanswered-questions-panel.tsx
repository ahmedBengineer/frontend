"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import {
  ArrowRightLeft,
  Check,
  EyeOff,
  HelpCircle,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"

type UnansweredStatus = "pending" | "answered" | "dismissed"

type UnansweredQuestion = {
  id: number
  question: string
  answer: string
  status: UnansweredStatus
  occurrences: number
  company_id: number | null
  agent_id: number | null
  converted_faq_id: number | null
  created_at: string
  last_asked_at: string
  updated_at: string
}

type AgentOption = { id: number; name: string }

type ListResponse = {
  count?: number
  next?: string | null
  previous?: string | null
  results?: UnansweredQuestion[]
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "answered", label: "Answered" },
  { value: "dismissed", label: "Dismissed" },
] as const

type StatusTab = (typeof STATUS_TABS)[number]["value"]

function getToken() {
  return Cookies.get("Token") || ""
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const send = (scheme: string) => {
    const headers: Record<string, string> = { Authorization: `${scheme} ${token}` }
    if (init.body) headers["Content-Type"] = "application/json"
    return fetch(`${BASE_URL}${path}`, { ...init, headers })
  }
  let res = await send("Bearer")
  if (res.status === 401 || res.status === 403) {
    res = await send("Token")
  }
  return res
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json()
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const entries = Object.entries(data as Record<string, unknown>)
      const messages: string[] = []
      for (const [key, value] of entries) {
        if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === "string") messages.push(value.join(" "))
        } else if (typeof value === "string") {
          messages.push(key === "detail" ? value : `${key}: ${value}`)
        }
      }
      if (messages.length > 0) return messages.join(" ")
    }
  } catch {}
  return `Request failed (${res.status})`
}

function relativeTime(iso: string): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  try {
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return "—"
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

const STATUS_STYLES: Record<UnansweredStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  answered: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  dismissed: "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100",
}

export function UnansweredQuestionsPanel({ agentId }: { agentId?: string | number | null }) {
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([])
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState<StatusTab>("pending")
  const [agentFilter, setAgentFilter] = useState<string>(agentId != null ? String(agentId) : "all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)

  const [answerRow, setAnswerRow] = useState<UnansweredQuestion | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [answering, setAnswering] = useState(false)

  const [convertRow, setConvertRow] = useState<UnansweredQuestion | null>(null)
  const [convertAnswer, setConvertAnswer] = useState("")
  const [convertAgentId, setConvertAgentId] = useState<string>("")
  const [converting, setConverting] = useState(false)

  const [dismissRow, setDismissRow] = useState<UnansweredQuestion | null>(null)
  const [dismissing, setDismissing] = useState(false)

  const [deleteRow, setDeleteRow] = useState<UnansweredQuestion | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [createQuestion, setCreateQuestion] = useState("")
  const [createAgentId, setCreateAgentId] = useState<string>("none")
  const [creating, setCreating] = useState(false)

  const fetchAgents = useCallback(async () => {
    try {
      const res = await apiFetch("/agents/agents/")
      if (!res.ok) return
      const data = await res.json()
      const rawList: unknown[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
      setAgents(
        rawList.map((agent) => {
          const a = agent as Record<string, unknown>
          return {
            id: Number(a.id),
            name: typeof a.name === "string" && a.name.trim() ? a.name.trim() : `Agent #${String(a.id)}`,
          }
        }),
      )
    } catch {}
  }, [])

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (agentFilter !== "all") params.set("agent_id", agentFilter)
      const res = await apiFetch(`/faq/unanswered-questions/?${params.toString()}`)
      if (!res.ok) throw new Error(await extractErrorMessage(res))
      const data: unknown = await res.json()
      if (Array.isArray(data)) {
        setQuestions(data as UnansweredQuestion[])
        setTotalCount(data.length)
        setHasNext(false)
        setHasPrev(page > 1)
      } else {
        const paginated = (data ?? {}) as ListResponse
        setQuestions(Array.isArray(paginated.results) ? paginated.results : [])
        setTotalCount(typeof paginated.count === "number" ? paginated.count : null)
        setHasNext(Boolean(paginated.next))
        setHasPrev(Boolean(paginated.previous))
      }
    } catch (err) {
      toast.error("Failed to load unanswered questions.", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, agentFilter])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, agentFilter])

  const visibleQuestions = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = query
      ? questions.filter((q) => q.question.toLowerCase().includes(query))
      : questions
    return [...filtered].sort((a, b) => {
      if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences
      return (b.last_asked_at || "").localeCompare(a.last_asked_at || "")
    })
  }, [questions, search])

  const agentName = (rowAgentId: number | null) => {
    if (!rowAgentId) return "All agents"
    return agents.find((a) => a.id === rowAgentId)?.name ?? `Agent #${rowAgentId}`
  }

  const openAnswer = (row: UnansweredQuestion) => {
    setAnswerRow(row)
    setAnswerText(row.answer || "")
  }

  const submitAnswer = async () => {
    if (!answerRow) return
    if (!answerText.trim()) {
      toast.error("Add an answer before saving.")
      return
    }
    setAnswering(true)
    try {
      const res = await apiFetch(`/faq/unanswered-questions/${answerRow.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ answer: answerText.trim(), status: "answered" }),
      })
      if (!res.ok) throw new Error(await extractErrorMessage(res))
      toast.success("Answer saved", { description: `"${truncate(answerRow.question, 60)}" is now answered.` })
      setAnswerRow(null)
      await fetchQuestions()
    } catch (err) {
      toast.error("Could not save the answer.", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setAnswering(false)
    }
  }

  const openConvert = (row: UnansweredQuestion) => {
    setConvertRow(row)
    setConvertAnswer(row.answer || "")
    setConvertAgentId(row.agent_id ? String(row.agent_id) : "")
  }

  const submitConvert = async () => {
    if (!convertRow) return
    const needsAgent = convertRow.agent_id == null
    if (needsAgent && !convertAgentId) {
      toast.error("Select an agent for the new FAQ.")
      return
    }
    if (!convertAnswer.trim()) {
      toast.error("Add an answer before converting.")
      return
    }
    setConverting(true)
    try {
      const body: Record<string, unknown> = {
        answer: convertAnswer.trim(),
        is_published: true,
      }
      if (needsAgent) body.agent_id = Number(convertAgentId)
      const res = await apiFetch(`/faq/unanswered-questions/${convertRow.id}/convert/`, {
        method: "POST",
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await extractErrorMessage(res))
      const data = (await res.json()) as { converted_faq_id?: number | null; faq?: { id?: number } }
      const faqId = data.converted_faq_id ?? data.faq?.id
      toast.success("Converted to FAQ", {
        description: faqId ? `New FAQ #${faqId} published.` : "A new published FAQ was created.",
      })
      setConvertRow(null)
      await fetchQuestions()
    } catch (err) {
      toast.error("Conversion failed.", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setConverting(false)
    }
  }

  const confirmDismiss = async () => {
    if (!dismissRow) return
    setDismissing(true)
    try {
      const res = await apiFetch(`/faq/unanswered-questions/${dismissRow.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: "dismissed" }),
      })
      if (!res.ok) throw new Error(await extractErrorMessage(res))
      toast.success("Question dismissed")
      setDismissRow(null)
      await fetchQuestions()
    } catch (err) {
      toast.error("Could not dismiss the question.", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setDismissing(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteRow) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/faq/unanswered-questions/${deleteRow.id}/`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) throw new Error(await extractErrorMessage(res))
      toast.success("Question deleted")
      setDeleteRow(null)
      if (questions.length <= 1 && page > 1) {
        setPage(page - 1)
      } else {
        await fetchQuestions()
      }
    } catch (err) {
      toast.error("Could not delete the question.", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setDeleting(false)
    }
  }

  const submitCreate = async () => {
    if (!createQuestion.trim()) {
      toast.error("Enter a question first.")
      return
    }
    setCreating(true)
    try {
      const body: Record<string, unknown> = { question: createQuestion.trim(), answer: "" }
      if (createAgentId !== "none") body.agent_id = Number(createAgentId)
      const res = await apiFetch("/faq/unanswered-questions/", {
        method: "POST",
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await extractErrorMessage(res))
      toast.success("Question logged")
      setShowCreate(false)
      setCreateQuestion("")
      setCreateAgentId(agentId != null ? String(agentId) : "none")
      setPage(1)
      await fetchQuestions()
    } catch (err) {
      toast.error("Could not log the question.", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setCreating(false)
    }
  }

  const pendingCount = questions.filter((q) => q.status === "pending").length
  const isEmptyStateFriendly =
    !loading && visibleQuestions.length === 0 && search.trim() === "" && (statusFilter === "all" || statusFilter === "pending")

  return (
    <div className="min-h-[60vh] bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-1 h-16 bg-gradient-to-b from-slate-900 to-slate-300 rounded-full flex-shrink-0" />
            <div>
              <h1 className="text-4xl font-extralight tracking-tight text-slate-900">Unanswered Questions</h1>
              <p className="text-base text-slate-400 font-light tracking-wide mt-1">
                What visitors asked that had no FAQ match — answer, convert to FAQ, or dismiss
              </p>
            </div>
          </div>

          {!loading && totalCount !== null && (
            <div className="flex items-center gap-8 pl-7 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-2xl font-light text-slate-900 leading-none">{totalCount}</p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-0.5">Logged</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-light text-slate-900 leading-none">{pendingCount}</p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-0.5">Pending here</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-all ${
                  statusFilter === tab.value
                    ? "bg-slate-900 text-white font-light"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[190px] h-10 rounded-xl border-slate-200 text-sm font-light">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={String(agent.id)}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200 text-sm font-light focus-visible:ring-slate-900/20"
            />
          </div>

          <Button
            variant="outline"
            onClick={fetchQuestions}
            disabled={loading}
            className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={() => setShowCreate(true)}
            className="h-10 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-light"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </Button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[38%]">Question</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Asks</TableHead>
                  <TableHead>Last asked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100">
                    <TableCell>
                      <Skeleton className="h-4 w-3/4 rounded-lg" />
                      <Skeleton className="mt-2 h-3 w-1/2 rounded-lg" />
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-20 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-8 w-28 rounded-lg" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : visibleQuestions.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              {isEmptyStateFriendly ? (
                <Check className="w-8 h-8 text-emerald-400" />
              ) : (
                <HelpCircle className="w-8 h-8 text-slate-300" />
              )}
            </div>
            {isEmptyStateFriendly ? (
              <>
                <p className="text-lg font-light text-slate-700 tracking-tight">No unanswered questions — great sign!</p>
                <p className="text-sm text-slate-400 font-light mt-1.5 max-w-xs">
                  Every question your visitors asked got an answer. Nothing needs your attention.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-light text-slate-700 tracking-tight">Nothing matches these filters</p>
                <p className="text-sm text-slate-400 font-light mt-1.5 max-w-xs">
                  Try a different status, agent, or clear the search box.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/50">
                  <TableHead className="w-[38%] text-[11px] uppercase tracking-widest text-slate-400 font-medium">Question</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Agent</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Asks</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Last asked</TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-widest text-slate-400 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleQuestions.map((row) => (
                  <TableRow key={row.id} className="border-slate-100 group">
                    <TableCell className="align-top py-4">
                      <p className="text-sm font-medium text-slate-900 leading-snug tracking-tight">{row.question}</p>
                      {row.answer ? (
                        <p className="text-xs font-light text-slate-400 mt-1 leading-relaxed line-clamp-1">{row.answer}</p>
                      ) : null}
                      {row.converted_faq_id ? (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-light">
                          FAQ #{row.converted_faq_id}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <span className="text-sm font-light text-slate-600">{agentName(row.agent_id)}</span>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <Badge variant="outline" className={`capitalize border font-normal ${STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <Badge
                        variant="outline"
                        className={`font-normal border ${
                          row.occurrences >= 5
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : row.occurrences >= 3
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        ×{row.occurrences}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <span className="text-sm font-light text-slate-500 whitespace-nowrap">{relativeTime(row.last_asked_at)}</span>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {row.status !== "answered" && (
                          <button
                            onClick={() => openAnswer(row)}
                            className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                            title="Answer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openConvert(row)}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                          title="Convert to FAQ"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                        {row.status !== "dismissed" && (
                          <button
                            onClick={() => setDismissRow(row)}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                            title="Dismiss"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteRow(row)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(hasPrev || hasNext || (totalCount !== null && totalCount > 0)) && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                <p className="text-xs font-light text-slate-400">
                  {totalCount !== null ? `${totalCount} question${totalCount === 1 ? "" : "s"} · ` : ""}Page {page}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border-slate-200 text-slate-600 font-light"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border-slate-200 text-slate-600 font-light"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={!!answerRow}
        onOpenChange={(open) => {
          if (!open) setAnswerRow(null)
        }}
      >
        <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-slate-200">
          <div className="px-7 pt-7 pb-2">
            <DialogTitle className="text-xl font-extralight tracking-tight text-slate-900">Answer Question</DialogTitle>
            <DialogDescription className="text-sm font-light text-slate-400 mt-1">
              Your answer is saved against this question and marked as answered.
            </DialogDescription>
          </div>
          <div className="px-7 py-5 space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Question</p>
              <p className="text-sm font-medium text-slate-800 leading-snug">{answerRow?.question}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Answer</p>
              <Textarea
                placeholder="Type the answer visitors should get…"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={5}
                disabled={answering}
                className="rounded-xl border-slate-200 text-sm font-light resize-none focus-visible:ring-slate-900/20"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-7 py-5 bg-slate-50 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setAnswerRow(null)}
              disabled={answering}
              className="rounded-xl text-slate-500 font-light hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={submitAnswer}
              disabled={answering}
              className="rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-light"
            >
              {answering && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {answering ? "Saving…" : "Save Answer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!convertRow}
        onOpenChange={(open) => {
          if (!open) setConvertRow(null)
        }}
      >
        <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-slate-200">
          <div className="px-7 pt-7 pb-2">
            <DialogTitle className="text-xl font-extralight tracking-tight text-slate-900">Convert to FAQ</DialogTitle>
            <DialogDescription className="text-sm font-light text-slate-400 mt-1">
              Creates a published FAQ entry from this question. The question is then marked answered.
            </DialogDescription>
          </div>
          <div className="px-7 py-5 space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Question</p>
              <p className="text-sm font-medium text-slate-800 leading-snug">{convertRow?.question}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Answer</p>
              <Textarea
                placeholder="Type the answer for the new FAQ…"
                value={convertAnswer}
                onChange={(e) => setConvertAnswer(e.target.value)}
                rows={5}
                disabled={converting}
                className="rounded-xl border-slate-200 text-sm font-light resize-none focus-visible:ring-slate-900/20"
              />
            </div>
            {convertRow != null && convertRow.agent_id == null && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Agent (required)</p>
                <Select value={convertAgentId} onValueChange={setConvertAgentId}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm font-light focus-visible:ring-slate-900/20">
                    <SelectValue placeholder="Choose an agent…" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={String(agent.id)}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs font-light text-slate-400">
                  This question was logged without an agent, so pick where the FAQ should live.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 px-7 py-5 bg-slate-50 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setConvertRow(null)}
              disabled={converting}
              className="rounded-xl text-slate-500 font-light hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={submitConvert}
              disabled={converting}
              className="rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-light"
            >
              {converting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {converting ? "Converting…" : "Create FAQ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!dismissRow}
        onOpenChange={(open) => {
          if (!open) setDismissRow(null)
        }}
      >
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-slate-200">
          <div className="px-7 pt-7 pb-2">
            <DialogTitle className="text-xl font-extralight tracking-tight text-slate-900">Dismiss question?</DialogTitle>
            <DialogDescription className="text-sm font-light text-slate-400 mt-1">
              It stays in the log but won&apos;t be flagged as needing an answer.
            </DialogDescription>
          </div>
          <div className="px-7 pb-2">
            <p className="text-sm font-medium text-slate-800 leading-snug">{dismissRow?.question}</p>
          </div>
          <div className="flex items-center justify-end gap-2 px-7 py-5 bg-slate-50 border-t border-slate-100 mt-5">
            <Button
              variant="ghost"
              onClick={() => setDismissRow(null)}
              disabled={dismissing}
              className="rounded-xl text-slate-500 font-light hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDismiss}
              disabled={dismissing}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-light"
            >
              {dismissing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {dismissing ? "Dismissing…" : "Dismiss"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteRow}
        onOpenChange={(open) => {
          if (!open) setDeleteRow(null)
        }}
      >
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-slate-200">
          <div className="px-7 pt-7 pb-2">
            <DialogTitle className="text-xl font-extralight tracking-tight text-slate-900">Delete question?</DialogTitle>
            <DialogDescription className="text-sm font-light text-slate-400 mt-1">
              This permanently removes the logged question. This action cannot be undone.
            </DialogDescription>
          </div>
          <div className="px-7 pb-2">
            <p className="text-sm font-medium text-slate-800 leading-snug">{deleteRow?.question}</p>
          </div>
          <div className="flex items-center justify-end gap-2 px-7 py-5 bg-slate-50 border-t border-slate-100 mt-5">
            <Button
              variant="ghost"
              onClick={() => setDeleteRow(null)}
              disabled={deleting}
              className="rounded-xl text-slate-500 font-light hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-light"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open)
          if (!open) {
            setCreateQuestion("")
            setCreateAgentId(agentId != null ? String(agentId) : "none")
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-slate-200">
          <div className="px-7 pt-7 pb-2">
            <DialogTitle className="text-xl font-extralight tracking-tight text-slate-900">Log a Question</DialogTitle>
            <DialogDescription className="text-sm font-light text-slate-400 mt-1">
              Manually add a question to the review list.
            </DialogDescription>
          </div>
          <div className="px-7 py-5 space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Question</p>
              <Input
                placeholder="e.g. Who is the mayor of Vaughan?"
                value={createQuestion}
                onChange={(e) => setCreateQuestion(e.target.value)}
                disabled={creating}
                className="h-11 rounded-xl border-slate-200 text-sm font-light focus-visible:ring-slate-900/20"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">Agent (optional)</p>
              <Select value={createAgentId} onValueChange={setCreateAgentId}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm font-light focus-visible:ring-slate-900/20">
                  <SelectValue placeholder="Company-wide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Company-wide (no agent)</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={String(agent.id)}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-7 py-5 bg-slate-50 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setShowCreate(false)}
              disabled={creating}
              className="rounded-xl text-slate-500 font-light hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={submitCreate}
              disabled={creating}
              className="rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-light"
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {creating ? "Saving…" : "Add Question"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
