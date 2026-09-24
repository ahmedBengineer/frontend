"use client"

import { useState } from "react"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Loader2,
  PlayCircle,
  AlertTriangle,
} from "lucide-react"

// ── Recursive JSON tree viewer ──────────────────────────────────────────────

function JsonNode({
  data,
  name,
  depth = 0,
}: {
  data: unknown
  name?: string
  depth?: number
}) {
  const [open, setOpen] = useState(depth < 3)
  const isArray = Array.isArray(data)
  const isObject = data !== null && typeof data === "object" && !isArray

  if (isArray || isObject) {
    const entries = isArray
      ? (data as unknown[]).map((v, i) => [String(i), v] as const)
      : Object.entries(data as Record<string, unknown>)
    const isEmpty = entries.length === 0
    const [openBracket, closeBracket] = isArray ? ["[", "]"] : ["{", "}"]

    return (
      <div className="font-mono text-[12px] leading-relaxed">
        <div className="flex items-center gap-1">
          {isEmpty ? (
            <span className="w-4 shrink-0" />
          ) : (
            <button
              onClick={() => setOpen((o) => !o)}
              className="w-4 shrink-0 text-slate-400 hover:text-slate-700 transition-colors"
            >
              {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
          {name !== undefined && <span className="text-indigo-600">{`"${name}"`}</span>}
          {name !== undefined && <span className="text-slate-400">:</span>}
          <span className="text-slate-400">{openBracket}</span>
          {(!open || isEmpty) && (
            <>
              {!isEmpty && (
                <span className="text-slate-300 italic px-1">
                  {entries.length} {isArray ? "item" : "key"}{entries.length === 1 ? "" : "s"}
                </span>
              )}
              <span className="text-slate-400">{closeBracket}</span>
            </>
          )}
        </div>
        {open && !isEmpty && (
          <div className="pl-4 ml-1.5 border-l border-slate-100">
            {entries.map(([k, v]) => (
              <JsonNode key={k} data={v} name={isArray ? undefined : k} depth={depth + 1} />
            ))}
            <div className="text-slate-400">{closeBracket}</div>
          </div>
        )}
      </div>
    )
  }

  const valueClass =
    typeof data === "string"
      ? "text-emerald-600"
      : typeof data === "number"
        ? "text-blue-600"
        : typeof data === "boolean"
          ? "text-purple-600"
          : "text-slate-400 italic"
  const display =
    typeof data === "string" ? `"${data}"` : data === null || data === undefined ? "null" : String(data)

  return (
    <div className="flex items-start gap-1 font-mono text-[12px] leading-relaxed">
      <span className="w-4 shrink-0" />
      {name !== undefined && <span className="text-indigo-600">{`"${name}"`}</span>}
      {name !== undefined && <span className="text-slate-400">:</span>}
      <span className={valueClass}>{display}</span>
    </div>
  )
}

// ── Endpoint configuration ──────────────────────────────────────────────────

type EndpointKey = "list" | "retrieve" | "keep" | "consume"

interface EndpointConfig {
  key: EndpointKey
  label: string
  description: string
  method: "GET"
  requiresId: boolean
  destructive?: boolean
  buildPath: (id: string) => string
}

const ENDPOINTS: EndpointConfig[] = [
  {
    key: "list",
    label: "List",
    description: "List (filtered for non-expired)",
    method: "GET",
    requiresId: false,
    buildPath: () => `/voice-agent-transfer-webhooks/`,
  },
  {
    key: "retrieve",
    label: "Retrieve",
    description: "Retrieve (filtered for non-expired)",
    method: "GET",
    requiresId: true,
    buildPath: (id) => `/voice-agent-transfer-webhooks/${id}/`,
  },
  {
    key: "keep",
    label: "Keep",
    description: "Keep the data (returns if not expired)",
    method: "GET",
    requiresId: true,
    buildPath: (id) => `/voice-agent-transfer-webhooks/${id}/keep/`,
  },
  {
    key: "consume",
    label: "Consume",
    description: "Read + delete the record",
    method: "GET",
    requiresId: true,
    destructive: true,
    buildPath: (id) => `/voice-agent-transfer-webhooks/${id}/consume/`,
  },
]

interface EndpointResult {
  loading: boolean
  status: number | null
  data: unknown
  error: string | null
  calledAt: string | null
  url: string
}

const emptyResult: EndpointResult = {
  loading: false,
  status: null,
  data: null,
  error: null,
  calledAt: null,
  url: "",
}

export default function TestApiPage() {
  const { toast } = useToast()
  const [webhookId, setWebhookId] = useState("")
  const [copiedKey, setCopiedKey] = useState<EndpointKey | null>(null)
  const [results, setResults] = useState<Record<EndpointKey, EndpointResult>>({
    list: { ...emptyResult },
    retrieve: { ...emptyResult },
    keep: { ...emptyResult },
    consume: { ...emptyResult },
  })

  const callEndpoint = async (ep: EndpointConfig) => {
    if (ep.requiresId && !webhookId.trim()) {
      toast({
        title: "ID required",
        description: `Enter a webhook ID to call "${ep.label}".`,
        variant: "destructive",
      })
      return
    }

    if (ep.destructive && !window.confirm("This will read and delete the record. Continue?")) {
      return
    }

    setResults((prev) => ({ ...prev, [ep.key]: { ...prev[ep.key], loading: true, error: null } }))

    const base = process.env.NEXT_PUBLIC_BASE_URL
    const url = `${base}${ep.buildPath(webhookId.trim())}`

    try {
      const res = await fetch(url, {
        method: ep.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${Cookies.get("Token") || ""}`,
        },
      })

      let data: unknown = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      setResults((prev) => ({
        ...prev,
        [ep.key]: {
          loading: false,
          status: res.status,
          data,
          error: res.ok ? null : (data as { detail?: string })?.detail || res.statusText,
          calledAt: new Date().toISOString(),
          url,
        },
      }))
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [ep.key]: {
          loading: false,
          status: null,
          data: null,
          error: err instanceof Error ? err.message : "Request failed",
          calledAt: new Date().toISOString(),
          url,
        },
      }))
    }
  }

  const handleCopy = (key: EndpointKey, data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* ── Page Header ── */}
        <div className="mb-8 flex items-start gap-4">
          <div className="w-1 h-16 bg-gradient-to-b from-slate-900 to-slate-300 rounded-full flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-extralight tracking-tight text-slate-900">Test API</h1>
            <p className="text-base text-slate-400 font-light tracking-wide mt-1">
              voice-agent-transfer-webhooks endpoints
            </p>
          </div>
        </div>

        {/* ── Webhook ID input ── */}
        <div className="mb-8 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium mb-2">Webhook ID</p>
          <Input
            placeholder="e.g. 123"
            value={webhookId}
            onChange={(e) => setWebhookId(e.target.value)}
            className="h-11 max-w-xs rounded-xl border-slate-200 text-sm font-light bg-white focus-visible:ring-slate-900/20"
          />
          <p className="text-xs text-slate-400 font-light mt-2">
            Required for Retrieve, Keep, and Consume. List does not need an ID.
          </p>
        </div>

        {/* ── Endpoint cards ── */}
        <div className="space-y-6">
          {ENDPOINTS.map((ep) => {
            const result = results[ep.key]
            const hasData = result.calledAt !== null

            return (
              <div key={ep.key} className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ep.method}
                      </span>
                      <p className="text-sm font-medium text-slate-900">{ep.label}</p>
                      {ep.destructive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> destructive
                        </span>
                      )}
                      {result.status !== null && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            result.status >= 200 && result.status < 300
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-600 border-rose-200"
                          }`}
                        >
                          {result.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-light mt-0.5 truncate">{ep.description}</p>
                  </div>

                  <button
                    onClick={() => callEndpoint(ep)}
                    disabled={result.loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-light bg-slate-900 text-white hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {result.loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlayCircle className="w-4 h-4" />
                    )}
                    {result.loading ? "Calling…" : "Call"}
                  </button>
                </div>

                {/* Card body */}
                <div className="px-5 py-4">
                  {!hasData && !result.loading && (
                    <p className="text-sm text-slate-400 font-light italic">Not called yet.</p>
                  )}

                  {result.loading && (
                    <p className="text-sm text-slate-400 font-light italic">Loading…</p>
                  )}

                  {!result.loading && result.error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 mb-3">
                      <p className="text-xs text-rose-700 font-medium">{result.error}</p>
                    </div>
                  )}

                  {!result.loading && hasData && result.data !== null && result.data !== undefined && (
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-slate-400 font-light">
                          {new Date(result.calledAt as string).toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleCopy(ep.key, result.data)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-light text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
                        >
                          {copiedKey === ep.key ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 overflow-x-auto max-h-96 overflow-y-auto">
                        <JsonNode data={result.data} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
