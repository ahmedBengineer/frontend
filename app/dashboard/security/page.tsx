"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Lock,
  AlertTriangle,
  Pencil,
  Loader2,
  X,
  Phone,
  ChevronDown,
  RefreshCw,
  Search,
  CheckCircle2,
  Ban,
  MessageSquare,
  User,
  Copy,
  Check,
  TrendingUp,
  Activity,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationMessage {
  id?: number
  timestamp: string
  type: string
  user_question: string
  assistant_response: string
  summary: string
  session_id?: string
  caller_number?: string
  phonenumber?: string
}

interface FraudulentNumber {
  id: number
  company: number
  phone_number: string
  session_id: string
  agent: number | null
  reason: string
  confidence: number | null
  detected_at: string
  status: "blocked"
  is_fraud: true
  is_warning: false
  warning_count: number
  messages?: ConversationMessage[]
}

interface FraudWarning {
  id: number
  company: number
  phone_number: string
  session_id: string
  conversation_id: string
  agent: number | null
  reason: string
  confidence: number | null
  detected_at: string
  warned_at: string
  status: "warning"
  is_fraud: false
  is_warning: true
  messages?: ConversationMessage[]
}

type FraudListItem = FraudulentNumber | FraudWarning

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pctLabel(c: number | null): string {
  return c != null ? `${Math.round(c * 100)}%` : "N/A"
}

function confidenceBarColor(c: number | null): string {
  if (c == null) return "bg-slate-300"
  if (c >= 0.85) return "bg-rose-500"
  if (c >= 0.6) return "bg-amber-500"
  return "bg-emerald-500"
}

function confidenceBadge(c: number | null): string {
  if (c == null) return "bg-slate-100 text-slate-500 border-slate-200"
  if (c >= 0.85) return "bg-rose-50 text-rose-700 border-rose-200"
  if (c >= 0.6) return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-emerald-50 text-emerald-700 border-emerald-200"
}

function riskLabel(c: number | null): { label: string; color: string; dot: string } {
  if (c == null) return { label: "Unknown", color: "text-slate-500", dot: "bg-slate-400" }
  if (c >= 0.85) return { label: "Critical", color: "text-rose-600", dot: "bg-rose-500" }
  if (c >= 0.6) return { label: "High", color: "text-amber-600", dot: "bg-amber-500" }
  return { label: "Moderate", color: "text-emerald-600", dot: "bg-emerald-500" }
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function fmtDateShort(s: string): string {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ─── Confidence Arc SVG ────────────────────────────────────────────────────────

function ConfidenceArc({ value }: { value: number | null }) {
  const v = Math.min(1, Math.max(0, value ?? 0))
  const r = 28
  const circ = 2 * Math.PI * r
  const filled = circ * v
  const color = value == null ? "#cbd5e1" : value >= 0.85 ? "#f43f5e" : value >= 0.6 ? "#f59e0b" : "#22c55e"

  return (
    <div className="relative flex items-center justify-center w-[72px] h-[72px]">
      <svg width={72} height={72} viewBox="0 0 72 72" className="-rotate-90">
        <circle cx={36} cy={36} r={r} fill="none" stroke="#e2e8f0" strokeWidth={6} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-sm font-bold text-slate-900">
          {value != null ? `${Math.round(v * 100)}` : "–"}
        </span>
        {value != null && <span className="text-[9px] text-slate-400 mt-0.5">%</span>}
      </div>
    </div>
  )
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center flex-shrink-0 transition-all"
      title="Copy"
    >
      {copied
        ? <Check className="h-3 w-3 text-emerald-500" />
        : <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />}
    </button>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, message, confirmLabel, confirmClass, loading, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: React.ReactNode; confirmLabel: string
  confirmClass: string; loading: boolean; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-slate-900 mb-2">{title}</p>
        <div className="text-xs text-slate-500 font-light mb-5 leading-relaxed">{message}</div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 text-xs font-semibold text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 ${confirmClass}`}
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  item, onClose, onBlock, onUnblock, onEdit, onViewConversation, blocking, unblocking,
}: {
  item: FraudListItem | null
  onClose: () => void
  onBlock: (w: FraudWarning) => void
  onUnblock: (id: number) => void
  onEdit: (item: FraudulentNumber) => void
  onViewConversation: (item: FraudListItem) => void
  blocking: boolean
  unblocking: boolean
}) {
  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 min-h-[500px]">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-slate-300" />
        </div>
        <p className="text-sm font-light text-slate-400">Select an entry to inspect</p>
        <p className="text-xs text-slate-300 mt-1.5">Click any row on the left</p>
      </div>
    )
  }

  const isBlocked = item.status === "blocked"
  const b = item as FraudulentNumber
  const w = item as FraudWarning
  const convId = isBlocked ? b.session_id : w.conversation_id
  const risk = riskLabel(item.confidence)

  return (
    <div className={`flex-1 flex flex-col rounded-2xl border overflow-hidden shadow-sm ${
      isBlocked ? "border-rose-200" : "border-amber-200"
    }`}>

      {/* Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between flex-shrink-0 ${
        isBlocked
          ? "bg-gradient-to-r from-rose-50 to-white border-rose-100"
          : "bg-gradient-to-r from-amber-50 to-white border-amber-100"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            isBlocked ? "bg-rose-100 border-rose-200" : "bg-amber-100 border-amber-200"
          }`}>
            {isBlocked
              ? <Ban className="h-5 w-5 text-rose-600" />
              : <AlertTriangle className="h-5 w-5 text-amber-600" />}
          </div>
          <div>
            <p className="text-base font-bold font-mono text-slate-900 tracking-wide">{item.phone_number}</p>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mt-0.5 ${
              isBlocked ? "text-rose-600" : "text-amber-600"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBlocked ? "bg-rose-500 animate-pulse" : "bg-amber-500"}`} />
              {isBlocked ? "Blocked" : "Warning"}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center transition-all"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-white divide-y divide-slate-100">

        {/* Confidence arc + risk summary */}
        <div className="px-5 py-5 flex items-center gap-5">
          <ConfidenceArc value={item.confidence} />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Risk Level</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${risk.dot}`} />
                <span className={`text-sm font-semibold ${risk.color}`}>{risk.label}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                {isBlocked ? "Prior Warnings" : "Detection Type"}
              </p>
              {isBlocked
                ? <p className="text-2xl font-light text-slate-900 tabular-nums">{b.warning_count}</p>
                : <p className="text-sm font-medium text-amber-600">Suspicious Activity Flag</p>}
            </div>
          </div>
          {/* Mini confidence bar */}
          <div className="w-1.5 self-stretch rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
            <div
              className={`rounded-full transition-all duration-700 ${confidenceBarColor(item.confidence)}`}
              style={{ height: `${Math.round((item.confidence ?? 0) * 100)}%`, marginTop: "auto" }}
            />
          </div>
        </div>

        {/* Detection Reason */}
        <div className="px-5 py-5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Detection Reason</p>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-sm text-slate-700 font-light leading-relaxed">{item.reason || "No reason provided."}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-5 py-5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Timeline</p>
          <div className="relative space-y-4 pl-5">
            <div className="absolute left-[8px] top-1 bottom-1 w-px bg-slate-200" />

            <div className="flex items-start gap-3">
              <div className="w-[14px] h-[14px] rounded-full bg-white border-2 border-slate-300 flex-shrink-0 mt-0.5 relative z-10" />
              <div>
                <p className="text-xs font-semibold text-slate-600">Detected</p>
                <p className="text-xs text-slate-400 mt-0.5">{fmtDate(item.detected_at)}</p>
              </div>
            </div>

            {!isBlocked && w.warned_at && (
              <div className="flex items-start gap-3">
                <div className="w-[14px] h-[14px] rounded-full bg-amber-100 border-2 border-amber-400 flex-shrink-0 mt-0.5 relative z-10" />
                <div>
                  <p className="text-xs font-semibold text-amber-600">Warning Issued</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDate(w.warned_at)}</p>
                </div>
              </div>
            )}

            {isBlocked && (
              <div className="flex items-start gap-3">
                <div className="w-[14px] h-[14px] rounded-full bg-rose-100 border-2 border-rose-400 flex-shrink-0 mt-0.5 relative z-10" />
                <div>
                  <p className="text-xs font-semibold text-rose-600">Number Blocked</p>
                  <p className="text-xs text-slate-400 mt-0.5">Manual block applied</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Identifiers */}
        <div className="px-5 py-5 space-y-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Identifiers</p>

          <div>
            <p className="text-[10px] text-slate-400 mb-1.5">{isBlocked ? "Session ID" : "Conversation ID"}</p>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
              <code className="text-xs text-slate-600 font-mono flex-1 truncate">{convId}</code>
              <CopyButton text={convId} />
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 mb-1.5">Phone Number</p>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <code className="text-xs text-slate-600 font-mono flex-1">{item.phone_number}</code>
              <CopyButton text={item.phone_number} />
            </div>
          </div>

          {item.agent != null && (
            <div>
              <p className="text-[10px] text-slate-400 mb-1.5">Agent ID</p>
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-600 font-mono">{item.agent}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/60">
        {isBlocked ? (
          <div className="flex gap-2">
            <button
              onClick={() => onViewConversation(item)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              View Conversation
            </button>
            <button
              onClick={() => onUnblock(b.id)}
              disabled={unblocking}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
            >
              {unblocking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Unblock
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => onViewConversation(item)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              View Conversation
            </button>
            <button
              onClick={() => onBlock(w)}
              disabled={blocking}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
            >
              {blocking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              Block Number
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  item, onClose, onSave, saving,
}: {
  item: FraudulentNumber | null
  onClose: () => void
  onSave: (id: number, reason: string, confidence: string) => void
  saving: boolean
}) {
  const [reason, setReason] = useState(item?.reason ?? "")
  const [confidence, setConfidence] = useState(
    item?.confidence != null ? String(item.confidence) : ""
  )

  useEffect(() => {
    if (item) {
      setReason(item.reason ?? "")
      setConfidence(item.confidence != null ? String(item.confidence) : "")
    }
  }, [item])

  if (!item) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-base font-semibold text-slate-900">Edit Blocked Entry</p>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{item.phone_number}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center transition-all"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 font-light resize-none"
              placeholder="Reason for blocking…"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
              Confidence <span className="text-slate-400 font-light">(0.0 – 1.0)</span>
            </label>
            <input
              type="number" min="0" max="1" step="0.01"
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 font-mono"
              placeholder="e.g. 0.95"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(item.id, reason, confidence)}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Conversation Drawer ──────────────────────────────────────────────────────

function ConversationDrawer({
  item,
  onClose,
}: {
  item: FraudListItem | null
  onClose: () => void
}) {
  const [tab, setTab] = useState<"transcript" | "summary">("transcript")

  useEffect(() => {
    if (item) setTab("transcript")
  }, [item])

  if (!item) return null

  console.log("[ConversationDrawer] item received:", item)
  console.log("[ConversationDrawer] item.messages raw:", (item as any).messages)
  console.log("[ConversationDrawer] item keys:", Object.keys(item))

  const messages = item.messages ?? []
  console.log("[ConversationDrawer] messages array length:", messages.length, messages)

  const nonSummary = [...messages]
    .filter((m) => m.type !== "summary")
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const summaryMsg = messages.find((m) => m.type === "summary") ?? null
  const isBlocked = item.status === "blocked"

  console.log("[ConversationDrawer] nonSummary (transcript turns):", nonSummary)
  console.log("[ConversationDrawer] summaryMsg:", summaryMsg)

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  const fmtFull = (ts: string) =>
    new Date(ts).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })

  return (
    <div className="fixed inset-0 z-[10100] flex items-stretch">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer — slides in from the right */}
      <div
        className="relative ml-auto w-full max-w-2xl flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 flex items-center justify-between flex-shrink-0 ${
            isBlocked
              ? "bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900"
              : "bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                isBlocked
                  ? "bg-rose-500/15 border-rose-500/25"
                  : "bg-amber-500/15 border-amber-500/25"
              }`}
            >
              {isBlocked
                ? <Ban className="h-5 w-5 text-rose-400" />
                : <AlertTriangle className="h-5 w-5 text-amber-400" />}
            </div>
            <div>
              <p className="text-white font-bold font-mono text-lg tracking-wide leading-tight">
                {item.phone_number}
              </p>
              <p className={`text-xs mt-0.5 font-medium ${isBlocked ? "text-rose-300" : "text-amber-300"}`}>
                {isBlocked ? "Blocked" : "Warning"} · {nonSummary.length} message{nonSummary.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Transcript / Summary toggle */}
            <div className="flex bg-white/10 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setTab("transcript")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === "transcript" ? "bg-white text-slate-900 shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Transcript
              </button>
              <button
                onClick={() => setTab("summary")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === "summary" ? "bg-white text-slate-900 shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Summary
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all ml-1 flex-shrink-0"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{ background: "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)" }}
        >
          {tab === "transcript" ? (
            nonSummary.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="h-7 w-7 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-600 font-medium mb-1">No transcript available</p>
                  <p className="text-xs text-slate-400">This entry has no recorded messages</p>
                </div>
              </div>
            ) : (
              nonSummary.map((m, idx) => (
                <div key={m.id ?? idx} className="space-y-3">
                  {/* Caller (user) message — right side */}
                  {m.user_question && (
                    <div
                      className="flex justify-end"
                      style={{ animation: `convFadeIn 0.25s ease-out ${idx * 40}ms both` }}
                    >
                      <div className="max-w-[78%]">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl rounded-tr-md px-5 py-3.5 shadow-md">
                          <p className="text-sm leading-relaxed font-light">{m.user_question}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 text-right font-mono">
                          {formatTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Agent (assistant) message — left side */}
                  {m.assistant_response && (
                    <div
                      className="flex justify-start"
                      style={{ animation: `convFadeIn 0.25s ease-out ${idx * 40 + 20}ms both` }}
                    >
                      <div className="max-w-[78%]">
                        <div className="bg-white rounded-3xl rounded-tl-md px-5 py-3.5 shadow-sm border border-slate-100/80">
                          <p className="text-sm text-slate-800 leading-relaxed">{m.assistant_response}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                          {formatTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            <div className="flex items-start justify-center pt-4">
              {summaryMsg ? (
                <div className="w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-base">Call Summary</p>
                      <p className="text-xs text-slate-400 mt-0.5">{fmtFull(summaryMsg.timestamp)}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-light">
                    {summaryMsg.summary}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-4 py-12">
                  <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="h-7 w-7 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium mb-1">No summary available</p>
                    <p className="text-xs text-slate-400">Summary is generated after the call ends</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              {item.phone_number}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" />
              {nonSummary.length} turn{nonSummary.length !== 1 ? "s" : ""}
            </span>
          </div>
          <code className="text-[10px] text-slate-300 font-mono truncate max-w-[220px]">
            {item.session_id}
          </code>
        </div>
      </div>

      <style>{`
        @keyframes convFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Paginator ────────────────────────────────────────────────────────────────

function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null

  const pages: (number | "…")[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== "…") pages.push("…")
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-3 pb-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
      >
        <ChevronDown className="h-3.5 w-3.5 rotate-90" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="w-8 text-center text-xs text-slate-300 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all border ${
              page === p
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
      >
        <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const { toast } = useToast()

  const [items, setItems] = useState<FraudListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [selected, setSelected] = useState<FraudListItem | null>(null)
  const [tab, setTab] = useState<"all" | "warnings" | "blocked">("all")
  const [search, setSearch] = useState("")

  // one-open-at-a-time accordion
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null)

  const [blockingId, setBlockingId] = useState<number | null>(null)
  const [unblockingId, setUnblockingId] = useState<number | null>(null)
  const [patchingId, setPatchingId] = useState<number | null>(null)

  const [confirmBlock, setConfirmBlock] = useState<FraudWarning | null>(null)
  const [confirmUnblock, setConfirmUnblock] = useState<FraudulentNumber | null>(null)
  const [editItem, setEditItem] = useState<FraudulentNumber | null>(null)
  const [convDrawer, setConvDrawer] = useState<FraudListItem | null>(null)
  const [page, setPage] = useState(1)

  const authHeaders: Record<string, string> = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Token ${Cookies.get("Token") || ""}`,
    }),
    []
  )

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchList = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/fraudulent-numbers/`
      console.log("[Security] fetchList → URL:", url)
      console.log("[Security] fetchList → headers:", authHeaders)

      fetch(url, { headers: authHeaders })
        .then(async (r) => {
          console.log("━━━ [Security API] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
          console.log("[Security API] REQUEST →", "GET", url)
          console.log("[Security API] REQUEST headers →", authHeaders)
          console.log("[Security API] RESPONSE status →", r.status, r.statusText)
          console.log("[Security API] RESPONSE headers →", Object.fromEntries(r.headers.entries()))
          const text = await r.text()
          console.log("[Security API] RESPONSE raw text →", text)
          let d: any
          try {
            d = JSON.parse(text)
          } catch (e) {
            console.error("[Security API] RESPONSE is not valid JSON:", e)
            throw e
          }
          console.log("[Security API] RESPONSE parsed →", d)
          if (Array.isArray(d)) {
            console.log("[Security API] item count:", d.length)
            d.forEach((item: any, i: number) => {
              console.log(`[Security API] item[${i}] →`, JSON.stringify(item, null, 2))
            })
          } else {
            console.warn("[Security API] response is NOT an array. Type:", typeof d, d)
          }
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
          return d
        })
        .then((d) => {
          if (Array.isArray(d)) setItems(d)
        })
        .catch((err) => {
          console.error("[Security API] fetch error:", err)
          toast({ title: "Error", description: "Failed to load security data.", variant: "destructive" })
        })
        .finally(() => { setLoading(false); setRefreshing(false) })
    },
    [authHeaders, toast]
  )

  useEffect(() => { fetchList() }, [fetchList])

  // ── Derived ────────────────────────────────────────────────────────────────
  const blocked = useMemo(() => items.filter((i): i is FraudulentNumber => i.status === "blocked"), [items])
  const warnings = useMemo(() => items.filter((i): i is FraudWarning => i.status === "warning"), [items])

  const warningsByPhone = useMemo(() => {
    const map: Record<string, FraudWarning[]> = {}
    warnings.forEach((w) => {
      if (!map[w.phone_number]) map[w.phone_number] = []
      map[w.phone_number].push(w)
    })
    return map
  }, [warnings])

  const filtered = useMemo(() => {
    const base = tab === "blocked" ? blocked : tab === "warnings" ? warnings : items
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter(
      (i) =>
        i.phone_number.toLowerCase().includes(q) ||
        i.reason.toLowerCase().includes(q) ||
        i.session_id.toLowerCase().includes(q)
    )
  }, [tab, blocked, warnings, items, search])

  const highRisk = useMemo(() => items.filter((i) => (i.confidence ?? 0) >= 0.85).length, [items])
  const avgConfidence = useMemo(() => {
    const vals = items.map((i) => i.confidence).filter((c): c is number => c != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [items])

  // ── Navigate to conversation ───────────────────────────────────────────────
  const openConversation = useCallback(
    (item: FraudListItem) => {
      setConvDrawer(item)
    },
    []
  )

  // ── Block ──────────────────────────────────────────────────────────────────
  const handleBlock = useCallback(
    async (w: FraudWarning) => {
      setBlockingId(w.id)
      try {
        const body: Record<string, unknown> = {
          phone_number: w.phone_number,
          session_id: w.conversation_id,
          reason: w.reason,
          company: w.company,
        }
        if (w.confidence != null) body.confidence = w.confidence
        if (w.agent != null) body.agent = w.agent
        console.log("[Block] Sending body:", JSON.stringify(body, null, 2))
        console.log("[Block] Warning object:", w)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/fraudulent-numbers/`,
          { method: "POST", headers: authHeaders, body: JSON.stringify(body) }
        )
        const data = await res.json().catch(() => null)
        console.log("[Block] Response status:", res.status)
        console.log("[Block] Response body:", data)
        if (!res.ok) throw new Error()
        toast({ title: "Blocked", description: `${w.phone_number} has been blocked.` })
        if (selected?.id === w.id) setSelected(null)
        fetchList(true)
      } catch {
        toast({ title: "Error", description: "Could not block number.", variant: "destructive" })
      } finally {
        setBlockingId(null)
        setConfirmBlock(null)
      }
    },
    [authHeaders, toast, fetchList, selected]
  )

  // ── Unblock ────────────────────────────────────────────────────────────────
  const handleUnblock = useCallback(
    async (id: number) => {
      setUnblockingId(id)
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/fraudulent-numbers/${id}/`,
          { method: "DELETE", headers: authHeaders }
        )
        if (!res.ok) throw new Error()
        toast({ title: "Unblocked", description: "Number removed from the block list." })
        if (selected?.id === id) setSelected(null)
        fetchList(true)
      } catch {
        toast({ title: "Error", description: "Could not unblock number.", variant: "destructive" })
      } finally {
        setUnblockingId(null)
        setConfirmUnblock(null)
      }
    },
    [authHeaders, toast, fetchList, selected]
  )

  // ── Patch ──────────────────────────────────────────────────────────────────
  const handlePatch = useCallback(
    async (id: number, reason: string, confidenceStr: string) => {
      setPatchingId(id)
      try {
        const body: Record<string, unknown> = {}
        if (reason.trim()) body.reason = reason.trim()
        const parsed = parseFloat(confidenceStr)
        if (!isNaN(parsed)) body.confidence = Math.min(1, Math.max(0, parsed))
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/fraudulent-numbers/${id}/`,
          { method: "PATCH", headers: authHeaders, body: JSON.stringify(body) }
        )
        if (!res.ok) throw new Error()
        toast({ title: "Updated", description: "Entry updated successfully." })
        setEditItem(null)
        fetchList(true)
      } catch {
        toast({ title: "Error", description: "Could not update entry.", variant: "destructive" })
      } finally {
        setPatchingId(null)
      }
    },
    [authHeaders, toast, fetchList]
  )

  // ── Row ────────────────────────────────────────────────────────────────────
  const renderRow = (item: FraudListItem, idx: number) => {
    const isBlocked = item.status === "blocked"
    const isSelected = selected?.id === item.id

    return (
      <button
        key={item.id}
        onClick={() => setSelected(isSelected ? null : item)}
        className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 ${
          isSelected
            ? isBlocked
              ? "bg-rose-50/80 border-rose-300 shadow-sm"
              : "bg-amber-50/80 border-amber-300 shadow-sm"
            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
        }`}
        style={{ animationDelay: `${idx * 15}ms` }}
      >
        {/* Left accent */}
        <span className={`w-1.5 h-10 rounded-full flex-shrink-0 ${isBlocked ? "bg-rose-400" : "bg-amber-400"}`} />

        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isBlocked ? "bg-rose-100" : "bg-amber-100"
        }`}>
          {isBlocked
            ? <Ban className="h-4 w-4 text-rose-600" />
            : <AlertTriangle className="h-4 w-4 text-amber-600" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold font-mono text-slate-800 block truncate">{item.phone_number}</span>
          <p className="text-[11px] text-slate-400 font-light truncate mt-0.5 leading-tight">
            {item.reason || "No reason provided"}
          </p>
        </div>

        {/* Confidence + date */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs font-bold tabular-nums border px-2 py-0.5 rounded-full ${confidenceBadge(item.confidence)}`}>
            {pctLabel(item.confidence)}
          </span>
          <span className="text-[10px] text-slate-400">{fmtDateShort(item.detected_at)}</span>
        </div>

        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-300 transition-transform duration-200 ${
          isSelected ? "rotate-180 text-slate-500" : ""
        }`} />
      </button>
    )
  }

  const PAGE_SIZE = 25

  const warningGroups = useMemo(() => Object.entries(warningsByPhone), [warningsByPhone])
  const pagedGroups = useMemo(() => warningGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [warningGroups, page])
  const pagedFiltered = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const totalPages = useMemo(() => {
    if (tab === "warnings" && !search) return Math.max(1, Math.ceil(warningGroups.length / PAGE_SIZE))
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  }, [tab, search, warningGroups.length, filtered.length])

  useEffect(() => { setPage(1) }, [tab, search])

  const tabCounts = { all: items.length, warnings: warnings.length, blocked: blocked.length }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">

      {/* ── Hero Header — matches users/tools pages ────────────────────────── */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-rose-50/30" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-8 py-12">
          {/* Title row */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-1 h-16 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-4xl font-extralight tracking-tight text-slate-900">Security</h1>
                  {!loading && items.length > 0 && (
                    <span className="relative flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-40" />
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 items-center justify-center">
                        <span className="text-[8px] font-bold text-white">{items.length > 9 ? "9+" : items.length}</span>
                      </span>
                    </span>
                  )}
                </div>
                <p className="text-base text-slate-500 font-light tracking-wide">
                  Fraudulent caller detection and number blocking
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchList(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-light text-slate-600 transition-all disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Stats row — matches pattern from agents/users pages */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Flags</span>
                <Activity className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              {loading ? <div className="h-9 w-12 bg-slate-100 rounded-lg animate-pulse" />
                : <p className="text-4xl font-extralight text-slate-900 tabular-nums">{items.length}</p>}
              <p className="text-[10px] text-slate-400 font-light mt-1.5">all time</p>
            </div>

            <div className="group bg-white border border-rose-200 rounded-2xl p-5 hover:shadow-md hover:border-rose-300 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Blocked</span>
                <Ban className="w-4 h-4 text-rose-300 group-hover:text-rose-500 transition-colors" />
              </div>
              {loading ? <div className="h-9 w-12 bg-rose-50 rounded-lg animate-pulse" />
                : <p className="text-4xl font-extralight text-rose-600 tabular-nums">{blocked.length}</p>}
              <p className="text-[10px] text-rose-400/60 font-light mt-1.5">numbers</p>
            </div>

            <div className="group bg-white border border-amber-200 rounded-2xl p-5 hover:shadow-md hover:border-amber-300 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">Warnings</span>
                <AlertTriangle className="w-4 h-4 text-amber-300 group-hover:text-amber-500 transition-colors" />
              </div>
              {loading ? <div className="h-9 w-12 bg-amber-50 rounded-lg animate-pulse" />
                : <p className="text-4xl font-extralight text-amber-600 tabular-nums">{warnings.length}</p>}
              <p className="text-[10px] text-amber-500/50 font-light mt-1.5">under review</p>
            </div>

            <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">High Risk</span>
                <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              {loading ? <div className="h-9 w-12 bg-slate-100 rounded-lg animate-pulse" />
                : <p className="text-4xl font-extralight text-slate-900 tabular-nums">{highRisk}</p>}
              <p className="text-[10px] text-slate-400 font-light mt-1.5">
                {avgConfidence != null ? `avg ${pctLabel(avgConfidence)} confidence` : "≥ 85% confidence"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notice bars ──────────────────────────────────────────────────────── */}
      {!loading && warnings.length > 0 && blocked.length === 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-8 py-2.5 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-light">
            <span className="font-semibold">{warnings.length}</span> unreviewed warning{warnings.length !== 1 ? "s" : ""} — review and block if confirmed fraud.
          </p>
        </div>
      )}
      {!loading && items.length === 0 && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-8 py-2.5 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-700 font-light">No suspicious callers detected — system is clear.</p>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 py-6">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {(["all", "warnings", "blocked"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelected(null) }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  tab === t
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <span className="capitalize">{t === "all" ? "All" : t === "warnings" ? "Warnings" : "Blocked"}</span>
                {loading ? (
                  <span className={`w-5 h-3.5 rounded-full animate-pulse inline-block ${
                    tab === t ? "bg-white/20" : "bg-slate-200"
                  }`} />
                ) : (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums ${
                    tab === t ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {tabCounts[t]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search phone, reason, session…"
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              </button>
            )}
          </div>

          <span className="text-xs text-slate-400 font-light ml-auto hidden sm:block">
            {loading ? <span className="inline-block w-16 h-3.5 bg-slate-200 rounded-full animate-pulse align-middle" /> : <>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</>}
          </span>
        </div>

        {/* Split screen */}
        <div className="flex gap-5" style={{ minHeight: "65vh" }}>

          {/* LEFT: List */}
          <div className={`flex flex-col transition-all duration-300 ease-in-out ${
            selected ? "w-[400px] flex-shrink-0" : "flex-1"
          }`}>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-[70px] bg-slate-100 rounded-xl animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-24 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-light text-slate-500">
                  {search ? "No results match your search"
                    : tab === "all" ? "No suspicious callers"
                    : tab === "warnings" ? "No warnings — all clear"
                    : "No blocked numbers"}
                </p>
              </div>
            ) : tab === "warnings" && !search ? (
              // Grouped warnings — one open at a time
              <div className="flex flex-col gap-2">
                <div className="space-y-2">
                  {pagedGroups.map(([phone, group]) => {
                    const isExpanded = expandedPhone === phone
                    return (
                      <div key={phone}>
                        <button
                          onClick={() => setExpandedPhone(isExpanded ? null : phone)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 ${
                            isExpanded
                              ? "bg-amber-50/80 border-amber-300 shadow-sm"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                              <Phone className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                            <span className="text-sm font-semibold font-mono text-slate-800">{phone}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              {group.length}×
                            </span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                              isExpanded ? "rotate-180 text-amber-500" : ""
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="mt-1 ml-3 space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                            {(group as FraudWarning[]).map((w, idx) => renderRow(w, idx))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <Paginator page={page} total={totalPages} onChange={setPage} />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="space-y-1.5">
                  {pagedFiltered.map((item, idx) => renderRow(item, idx))}
                </div>
                <Paginator page={page} total={totalPages} onChange={setPage} />
              </div>
            )}
          </div>

          {/* RIGHT: Detail panel */}
          <div className={`flex-col transition-all duration-300 ease-in-out ${selected ? "flex flex-1" : "hidden"}`}>
            <DetailPanel
              item={selected}
              onClose={() => setSelected(null)}
              onBlock={(w) => setConfirmBlock(w)}
              onUnblock={(id) => {
                const b = blocked.find((x) => x.id === id)
                if (b) setConfirmUnblock(b)
              }}
              onEdit={(b) => setEditItem(b)}
              onViewConversation={openConversation}
              blocking={blockingId !== null}
              unblocking={unblockingId !== null}
            />
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-8 flex items-start gap-3 bg-slate-50 rounded-2xl border border-slate-200/60 px-5 py-4">
          <Shield className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">How it works</p>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              <span className="font-medium text-amber-600">Warnings</span> are auto-created when the AI flags a call as suspicious. They are informational only and do not block callers.{" "}
              <span className="font-medium text-rose-600">Blocked</span> numbers are manually set by you and prevent those callers from connecting.
            </p>
          </div>
        </div>
      </div>

      {/* ── Dialogs ───────────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmBlock !== null}
        title="Block this number?"
        message={
          <>
            This will block{" "}
            <span className="font-mono font-medium text-slate-800">{confirmBlock?.phone_number}</span>{" "}
            from calling. Warnings for this number will be superseded.
          </>
        }
        confirmLabel="Block"
        confirmClass="bg-rose-600 hover:bg-rose-700"
        loading={blockingId !== null}
        onConfirm={() => confirmBlock && handleBlock(confirmBlock)}
        onCancel={() => setConfirmBlock(null)}
      />

      <ConfirmDialog
        open={confirmUnblock !== null}
        title="Unblock this number?"
        message={
          <>
            Remove{" "}
            <span className="font-mono font-medium text-slate-800">{confirmUnblock?.phone_number}</span>{" "}
            from the block list. They will be able to call again.
          </>
        }
        confirmLabel="Unblock"
        confirmClass="bg-emerald-600 hover:bg-emerald-700"
        loading={unblockingId !== null}
        onConfirm={() => confirmUnblock && handleUnblock(confirmUnblock.id)}
        onCancel={() => setConfirmUnblock(null)}
      />

      <EditModal
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={handlePatch}
        saving={patchingId !== null}
      />

      <ConversationDrawer
        item={convDrawer}
        onClose={() => setConvDrawer(null)}
      />
    </div>
  )
}
