"use client"

import { useState, useMemo, useEffect } from "react"
import Cookies from "js-cookie"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { X, Plus, Trash2, ChevronRight, ChevronLeft, FileJson, Braces, Settings2, Globe, ListChecks, Layers, Send, Wrench } from "lucide-react"
import { useProtectedFetch } from "@/hooks/useProtectedFetch"

// Step types — now 8 steps
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

type KVEntry = { id: string; key: string; value: string }

// ── Placeholder extraction helpers ───────────────────────────────────────────

function extractDeepestCurlyStrings(inputStr: string): string[] {
  let s: string = inputStr.replace(/"/g, "")
  let stack: number[] = []
  let toRemove: Set<number> = new Set()
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "{") stack.push(i)
    else if (s[i] === "}") {
      if (stack.length > 0) stack.pop()
      else toRemove.add(i)
    }
  }
  while (stack.length > 0) toRemove.add(stack.pop()!)
  s = s.split("").map((ch, idx) => (toRemove.has(idx) ? "" : ch)).join("")
  let result: string[] = []
  stack = []
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "{") stack.push(i)
    if (s[i] === "}" && stack.length > 0) {
      const candidate = s.slice(stack[stack.length - 1] + 1, i).trim()
      if (candidate && !candidate.includes(":") && !candidate.includes("[") && !candidate.includes("]")) {
        result.push(candidate)
      }
      stack = []
    }
  }
  return Array.from(new Set(result))
}

const extractPlaceholdersFromString = (str: string): string[] => {
  const found: string[] = []
  const regex = /\{([^{}]+)\}/g
  let match
  while ((match = regex.exec(str)) !== null) {
    let candidate = match[1].trim()
    if (candidate === "" || candidate.includes('"') || candidate.includes("'") || candidate.includes("{") || candidate.includes("}")) continue
    found.push(candidate)
  }
  return found
}

// ── Shared KV section builder ────────────────────────────────────────────────

function KVSection({
  title,
  entries,
  section,
  onAdd,
  onRemove,
  onUpdate,
  onPasteJSON,
  showPaste = false,
}: {
  title: string
  entries: KVEntry[]
  section: string
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: "key" | "value", val: string) => void
  onPasteJSON?: (json: string) => void
  showPaste?: boolean
}) {
  const [pasteValue, setPasteValue] = useState("")

  const applyPaste = () => {
    const trimmed = pasteValue.trim()
    if (!trimmed || !onPasteJSON) return
    onPasteJSON(trimmed)
    setPasteValue("")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{entries.length} field{entries.length !== 1 ? "s" : ""}</span>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-sm text-slate-400">No fields yet. Click below to add one.</p>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={entry.id} className="flex items-center gap-2 group">
            <span className="text-xs text-slate-300 w-5 text-right flex-shrink-0">{i + 1}</span>
            <Input placeholder="Key" value={entry.key} onChange={(e) => onUpdate(entry.id, "key", e.target.value)} className="flex-1 h-10 text-sm border-slate-200 focus:border-slate-400" />
            <Input placeholder="Value" value={entry.value} onChange={(e) => onUpdate(entry.id, "value", e.target.value)} className="flex-1 h-10 text-sm border-slate-200 focus:border-slate-400" />
            <button type="button" onClick={() => onRemove(entry.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" aria-label="Remove">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="text-xs gap-1.5 border-dashed">
          <Plus className="w-3.5 h-3.5" /> Add Field
        </Button>
      </div>

      {showPaste && onPasteJSON && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <label className="text-sm font-medium text-slate-700">Paste JSON</label>
          <Textarea
            placeholder={`{\n  "key": "{placeholder}",\n  "nested": [{"val": "{param}"}]\n}`}
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            className="min-h-[100px] text-sm font-mono resize-y border-slate-200"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Shallow keys become editable fields. <code className="bg-slate-100 px-1 rounded">{`{placeholders}`}</code> are auto-detected as parameters.</p>
            <Button type="button" size="sm" onClick={applyPaste} disabled={!pasteValue.trim()} className="text-xs shrink-0 ml-3">
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Parameter card ───────────────────────────────────────────────────────────

function ParameterCard({
  paramKey,
  config,
  source,
  onRename,
  onRemove,
  onUpdate,
}: {
  paramKey: string
  config: any
  source: "request" | "response"
  onRename: (oldKey: string, newKey: string) => void
  onRemove: (key: string) => void
  onUpdate: (key: string, field: string, value: any) => void
}) {
  const sourceColors = {
    request: "bg-blue-50 text-blue-600 border-blue-200",
    response: "bg-emerald-50 text-emerald-600 border-emerald-200",
  }
  const sourceLabels = { request: "Request", response: "Response" }

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={paramKey}
            onChange={(e) => onRename(paramKey, e.target.value)}
            className="flex-1 text-sm font-mono font-medium bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-500 focus:outline-none py-0.5 min-w-0"
          />
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${sourceColors[source]}`}>
            {sourceLabels[source]}
          </span>
        </div>
        <button type="button" onClick={() => onRemove(paramKey)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Type</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
            value={config?.type || ""}
            onChange={(e) => {
              onUpdate(paramKey, "type", e.target.value)
              if (e.target.value === "array") onUpdate(paramKey, "items", { type: "" })
              else onUpdate(paramKey, "items", undefined)
            }}
          >
            <option value="">Select type</option>
            {["string", "integer", "float", "double", "boolean", "char", "array", "object"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {config?.type === "array" && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Item Type</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
              value={config?.items?.type || ""}
              onChange={(e) => onUpdate(paramKey, "items", { type: e.target.value })}
            >
              <option value="">Select item type</option>
              {["string", "integer", "float", "double", "boolean", "char"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">Description</label>
        <textarea
          placeholder="What does this parameter do?"
          value={config?.description || ""}
          onChange={(e) => onUpdate(paramKey, "description", e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-slate-300"
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={config?.required || false} onChange={(e) => onUpdate(paramKey, "required", e.target.checked)} className="rounded" />
        <span className="text-slate-600">Required</span>
      </label>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={config?.global || false} onChange={(e) => onUpdate(paramKey, "global", e.target.checked)} className="rounded" />
        <span className="text-slate-600">Global</span>
      </label>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function CustomToolsForm({ tool, onSuccess }: { tool?: any; onSuccess?: () => void }) {
  const { toast } = useToast()
  const { protectedFetch } = useProtectedFetch()
  const [step, setStep] = useState<Step>(1)

  const stepConfig: { key: Step; label: string; icon: any }[] = [
    { key: 1, label: "Info", icon: FileJson },
    { key: 2, label: "Request", icon: Globe },
    { key: 3, label: "Headers", icon: Layers },
    { key: 4, label: "Query", icon: ListChecks },
    { key: 5, label: "Body", icon: Send },
    { key: 6, label: "Response", icon: Braces },
    { key: 7, label: "Params", icon: Settings2 },
    { key: 8, label: "Settings", icon: Wrench },
  ]

  const totalSteps = stepConfig.length

  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    method: "POST",
    url: "",
    auth_header_name: "",
    auth_token: "",
    headers: [] as KVEntry[],
    query_template: [] as KVEntry[],
    body_template: [] as KVEntry[],
    response_payload: [] as KVEntry[],
    request_parameters: {},
    response_parameters: {},
    omit_nulls: false,
    summarize_conversation: false,
    timeout_ms: 30000,
    speak_during_execution: { enabled: false, delay_seconds: 0, message: "", message_field_type: "message" },
  })

  // ── Load existing tool ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!tool) return
    let detectedFieldType = "message"
    let messageValue = ""
    if (tool.speak_during_execution?.instructions) { detectedFieldType = "instructions"; messageValue = tool.speak_during_execution.instructions }
    else if (tool.speak_during_execution?.message) { detectedFieldType = "message"; messageValue = tool.speak_during_execution.message }

    const toKV = (obj: any) => obj ? Object.entries(obj).map(([k, v]: [string, any]) => ({ id: crypto.randomUUID(), key: k, value: typeof v === "string" ? v : JSON.stringify(v) })) : []

    const inferredAuthHeaderName = tool.auth_header_name || (tool.headers?.Authorization ? "Authorization" : "")
    const inferredAuthToken =
      tool.auth_token ||
      (inferredAuthHeaderName && tool.headers?.[inferredAuthHeaderName]
        ? tool.headers[inferredAuthHeaderName]
        : "")

    const mappedFormData = {
      ...tool,
      auth_header_name: inferredAuthHeaderName,
      auth_token: inferredAuthToken,
      headers: toKV(tool.headers),
      query_template: toKV(tool.query_template),
      body_template: toKV(tool.body_template),
      response_payload: toKV(tool.response_payload),
      request_parameters: tool.request_parameters == null ? (tool.parameters ?? {}) : tool.request_parameters,
      response_parameters: tool.response_parameters ?? {},
      summarize_conversation: tool.summarize_conversation ?? false,
      speak_during_execution: { enabled: tool.speak_during_execution?.enabled || false, delay_seconds: tool.speak_during_execution?.delay_seconds || 0, message: messageValue, message_field_type: detectedFieldType },
    }

    setFormData(mappedFormData)

  }, [tool])

  // ── KV helpers ─────────────────────────────────────────────────────────────
  type KVSection = "headers" | "query_template" | "body_template" | "response_payload"

  const addKV = (section: KVSection) => {
    setFormData((prev: any) => ({ ...prev, [section]: [...prev[section], { id: crypto.randomUUID(), key: "", value: "" }] }))
  }
  const removeKV = (section: KVSection, id: string) => {
    setFormData((prev: any) => ({ ...prev, [section]: prev[section].filter((e: KVEntry) => e.id !== id) }))
  }
  const updateKV = (section: KVSection, id: string, field: "key" | "value", newValue: string) => {
    setFormData((prev: any) => ({ ...prev, [section]: prev[section].map((entry: KVEntry) => entry.id === id ? { ...entry, [field]: newValue } : entry) }))

    // Auto-detect placeholders
    const placeholders = extractPlaceholdersFromString(newValue)
    if (placeholders.length > 0) {
      const targetSchema = section === "response_payload" ? "response_parameters" : "request_parameters"
      setFormData((prev: any) => ({
        ...prev,
        [targetSchema]: {
          ...prev[targetSchema],
          ...Object.fromEntries(placeholders.map((p: string) => [p, prev[targetSchema]?.[p] || { type: "", description: "", required: false, global: false }])),
        },
      }))
    }
  }

  const handlePasteJSON = (json: string, section: "body_template" | "response_payload") => {
    // Normalize common copy-paste encoding issues before parsing
    const normalized = json
      .replace(/\uFEFF/g, "")                                        // BOM
      .replace(/[\u200B\u200C\u200D\u2060]/g, "")                   // zero-width chars
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ") // non-standard spaces → ASCII space
      .replace(/[\u2028\u2029]/g, "\n")                              // Unicode line separators → newline
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')      // curly double quotes → "
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")      // curly single quotes → '
    try {
      const parsed = JSON.parse(normalized)
      const shallowFlatten = (obj: any): KVEntry[] => Object.entries(obj).map(([k, v]) => {
        let val = JSON.stringify(v)
        if (typeof v === "string" && val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
        return { id: crypto.randomUUID(), key: k, value: val }
      })
      const newEntries = shallowFlatten(parsed)
      const placeholders: string[] = []
      newEntries.forEach((entry) => {
        placeholders.push(...extractPlaceholdersFromString(entry.key))
        placeholders.push(...extractDeepestCurlyStrings(entry.value))
      })
      const targetSchema = section === "response_payload" ? "response_parameters" : "request_parameters"
      setFormData((prev: any) => ({
        ...prev,
        [section]: [...prev[section], ...newEntries],
        [targetSchema]: {
          ...prev[targetSchema],
          ...Object.fromEntries(placeholders.map((p: string) => [p, prev[targetSchema]?.[p] || { type: "", description: "", required: false, global: false }])),
        },
      }))
    } catch (err) {
      console.error("JSON parse failed. Input was:", JSON.stringify(json))
      console.error(err)
      toast({ title: "Invalid JSON", description: "Please check the format.", variant: "destructive" })
    }
  }

  const handleParameterConfig = (schema: "request_parameters" | "response_parameters", paramKey: string, field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [schema]: { ...prev[schema], [paramKey]: { ...prev[schema]?.[paramKey], [field]: value } } }))
  }

  const renameParameter = (schema: "request_parameters" | "response_parameters", oldKey: string, newKey: string) => {
    const updated = { ...formData[schema] }
    updated[newKey] = updated[oldKey]
    delete updated[oldKey]
    setFormData((prev: any) => ({ ...prev, [schema]: updated }))
  }

  const removeParameter = (schema: "request_parameters" | "response_parameters", key: string) => {
    const updated = { ...formData[schema] }
    delete updated[key]
    setFormData((prev: any) => ({ ...prev, [schema]: updated }))
  }

  // ── Extract params from URL ────────────────────────────────────────────────
  const extractedRequestParams = useMemo(() => {
    const regex = /^\{[a-zA-Z0-9_]+\}$/
    const found: string[] = []
    const scan = (entries: KVEntry[]) => entries.forEach((e) => { if (regex.test(e.value.trim())) found.push(e.value.trim().slice(1, -1)) })
    scan(formData.query_template)
    scan(formData.body_template)
    const urlMatches = formData.url.match(/\{[a-zA-Z0-9_]+\}/g)
    if (urlMatches) urlMatches.forEach((m: string) => found.push(m.slice(1, -1)))
    return Array.from(new Set(found))
  }, [formData.url, formData.query_template, formData.body_template, formData.response_payload])

  useEffect(() => {
    if (extractedRequestParams.length > 0) {
      setFormData((prev: any) => ({
        ...prev,
        request_parameters: {
          ...prev.request_parameters,
          ...Object.fromEntries(extractedRequestParams.map((p: string) => [p, prev.request_parameters?.[p] || { type: "", description: "", required: false, global: false }])),
        },
      }))
    }
  }, [extractedRequestParams])

  const extractedResponseParams = useMemo(() => {
    const regex = /^\{[a-zA-Z0-9_]+\}$/
    const found: string[] = []
    const scan = (entries: KVEntry[]) => entries.forEach((e) => { if (regex.test(e.value.trim())) found.push(e.value.trim().slice(1, -1)) })
    scan(formData.response_payload)
    return Array.from(new Set(found))
  }, [formData.response_payload])

  useEffect(() => {
    if (extractedResponseParams.length > 0) {
      setFormData((prev: any) => ({
        ...prev,
        response_parameters: {
          ...prev.response_parameters,
          ...Object.fromEntries(extractedResponseParams.map((p: string) => [p, prev.response_parameters?.[p] || { type: "", description: "", required: false, global: false }])),
        },
      }))
    }
  }, [extractedResponseParams])

  const requestParamKeys = useMemo(() => Object.keys(formData.request_parameters || {}), [formData.request_parameters])
  const responseParamKeys = useMemo(() => Object.keys(formData.response_parameters || {}), [formData.response_parameters])

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const formatKV = (arr: KVEntry[]) =>
        Object.fromEntries(arr.filter((e) => e.key).map((e) => {
          let raw = e.value.trim()
          if (/^\{[a-zA-Z0-9_]+\}$/.test(raw)) return [e.key, raw]
          try { return [e.key, JSON.parse(raw)] } catch { return [e.key, raw] }
        }))

      const payload = {
        name: formData.name,
        description: formData.description,
        method: formData.method,
        url: formData.url,
        headers: formatKV(formData.headers),
        query_template: formatKV(formData.query_template),
        body_template: formatKV(formData.body_template),
        response_payload: formatKV(formData.response_payload),
        request_parameters: formData.request_parameters,
        response_parameters: formData.response_parameters,
        parameters: formData.request_parameters, // legacy fallback for older clients
        omit_nulls: formData.omit_nulls,
        summarize_conversation: !!formData.summarize_conversation,
        timeout_ms: formData.timeout_ms,
        speak_during_execution: {
          enabled: formData.speak_during_execution.enabled === true || formData.speak_during_execution.enabled === "true",
          delay_seconds: Number(formData.speak_during_execution.delay_seconds) || 0,
          [formData.speak_during_execution.message_field_type || "message"]: formData.speak_during_execution.message || "",
        },
        ...(formData.auth_header_name ? { auth_header_name: formData.auth_header_name } : {}),
        ...(formData.auth_token ? { auth_token: formData.auth_token } : {}),
      }

      const url = tool
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/${tool.id}/`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/custom_feature/custom-features/`

      const res = await protectedFetch(url, {
        method: tool ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${Cookies.get("Token") || ""}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Request failed")
      await res.json()

      setFormData({
        name: "", description: "", method: "POST", url: "",
        auth_header_name: "", auth_token: "",
        headers: [], query_template: [], body_template: [], response_payload: [],
        request_parameters: {}, response_parameters: {}, omit_nulls: false, summarize_conversation: false, timeout_ms: 30000,
        speak_during_execution: { enabled: false, delay_seconds: 0, message: "", message_field_type: "message" },
      })
      setStep(1)
      onSuccess?.()
      toast({ title: "Success", description: tool ? "Custom tool updated!" : "Custom tool created!" })
    } catch (err: any) {
      if (err.message?.includes("Protected action cancelled")) return
      console.error("Submit failed", err)
      toast({ variant: "destructive", title: "Error", description: "Could not save tool." })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Step indicator ─────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-x-0 top-5 h-0.5 bg-slate-100 z-0" />
        <div className="absolute left-0 top-5 h-0.5 bg-slate-900 z-0 transition-all duration-500" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }} />
        <div className="relative flex justify-between z-10">
          {stepConfig.map(({ key, label, icon: Icon }) => {
            const isCurrent = key === step
            const isCompleted = key < step
            return (
              <button key={key} type="button" onClick={() => setStep(key)} className="flex flex-col items-center gap-1.5 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  isCurrent ? "bg-slate-900 text-white shadow-lg scale-110" : isCompleted ? "bg-slate-800 text-white" : "bg-white text-slate-400 border border-slate-200 group-hover:border-slate-400"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isCurrent ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Step content ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="min-h-[320px]">

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Tool Name</label>
                <Input placeholder="e.g. Create Contact" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 border-slate-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                <Textarea placeholder="What does this tool do?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[120px] border-slate-200 resize-y" />
              </div>
            </div>
          )}

          {/* Step 2: Request Setup */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">HTTP Method</label>
                <select className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-300" value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })}>
                  {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Endpoint URL</label>
                <Input placeholder="https://api.example.com/endpoint" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="h-11 border-slate-200 font-mono text-sm" />
                <p className="text-xs text-slate-400 mt-1">Use <code className="bg-slate-100 px-1 rounded">{`{param}`}</code> for dynamic URL segments</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Auth Header Name</label>
                  <Input placeholder="Authorization" value={formData.auth_header_name || ""} onChange={(e) => setFormData({ ...formData, auth_header_name: e.target.value })} className="h-11 border-slate-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Auth Token</label>
                  <Input placeholder="Token ..." value={formData.auth_token || ""} onChange={(e) => setFormData({ ...formData, auth_token: e.target.value })} className="h-11 border-slate-200 font-mono text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Headers */}
          {step === 3 && (
            <KVSection title="Headers" entries={formData.headers} section="headers" onAdd={() => addKV("headers")} onRemove={(id) => removeKV("headers", id)} onUpdate={(id, f, v) => updateKV("headers", id, f, v)} />
          )}

          {/* Step 4: Query Params */}
          {step === 4 && (
            <KVSection title="Query Parameters" entries={formData.query_template} section="query_template" onAdd={() => addKV("query_template")} onRemove={(id) => removeKV("query_template", id)} onUpdate={(id, f, v) => updateKV("query_template", id, f, v)} />
          )}

          {/* Step 5: Body Template */}
          {step === 5 && (
            <KVSection title="Body Template" entries={formData.body_template} section="body_template" onAdd={() => addKV("body_template")} onRemove={(id) => removeKV("body_template", id)} onUpdate={(id, f, v) => updateKV("body_template", id, f, v)} showPaste onPasteJSON={(json) => handlePasteJSON(json, "body_template")} />
          )}

          {/* Step 6: Response Payload */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Braces className="w-5 h-5 text-emerald-600" />
                <p className="text-sm text-slate-500">Define the expected response structure. Placeholders become response parameters in the next step.</p>
              </div>
              <KVSection title="Response Payload" entries={formData.response_payload} section="response_payload" onAdd={() => addKV("response_payload")} onRemove={(id) => removeKV("response_payload", id)} onUpdate={(id, f, v) => updateKV("response_payload", id, f, v)} showPaste onPasteJSON={(json) => handlePasteJSON(json, "response_payload")} />
            </div>
          )}

          {/* Step 7: Parameters */}
          {step === 7 && (
            <div className="space-y-6">
              {requestParamKeys.length === 0 && responseParamKeys.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <Settings2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No parameters detected yet.</p>
                  <p className="text-xs text-slate-300 mt-1">Add <code className="bg-slate-100 px-1 rounded">{`{placeholders}`}</code> in Body or Response steps, or add manually below.</p>
                </div>
              ) : (
                <>
                  {requestParamKeys.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <h4 className="text-sm font-medium text-slate-700">Request Parameters</h4>
                        <span className="text-xs text-slate-400">{requestParamKeys.length}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {requestParamKeys.map((k) => (
                          <ParameterCard
                            key={k}
                            paramKey={k}
                            config={formData.request_parameters[k]}
                            source="request"
                            onRename={(oldKey, newKey) => renameParameter("request_parameters", oldKey, newKey)}
                            onRemove={(key) => removeParameter("request_parameters", key)}
                            onUpdate={(key, field, value) => handleParameterConfig("request_parameters", key, field, value)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {responseParamKeys.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h4 className="text-sm font-medium text-slate-700">Response Parameters</h4>
                        <span className="text-xs text-slate-400">{responseParamKeys.length}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {responseParamKeys.map((k) => (
                          <ParameterCard
                            key={k}
                            paramKey={k}
                            config={formData.response_parameters[k]}
                            source="response"
                            onRename={(oldKey, newKey) => renameParameter("response_parameters", oldKey, newKey)}
                            onRemove={(key) => removeParameter("response_parameters", key)}
                            onUpdate={(key, field, value) => handleParameterConfig("response_parameters", key, field, value)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  const newKey = `request_param_${Object.keys(formData.request_parameters || {}).length + 1}`
                  setFormData((prev: any) => ({
                    ...prev,
                    request_parameters: { ...prev.request_parameters, [newKey]: { type: "", required: false, description: "", global: false } },
                  }))
                }}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Request Parameter Manually
              </button>

              <button
                type="button"
                onClick={() => {
                  const newKey = `response_param_${Object.keys(formData.response_parameters || {}).length + 1}`
                  setFormData((prev: any) => ({
                    ...prev,
                    response_parameters: { ...prev.response_parameters, [newKey]: { type: "", required: false, description: "", global: false } },
                  }))
                }}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Response Parameter Manually
              </button>
            </div>
          )}

          {/* Step 8: Settings (was Step 7) */}
          {step === 8 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <Checkbox checked={formData.omit_nulls} onCheckedChange={(checked) => setFormData({ ...formData, omit_nulls: !!checked })} />
                <div>
                  <p className="text-sm font-medium text-slate-700">Omit Nulls</p>
                  <p className="text-xs text-slate-400">Remove null values from the request payload</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <Checkbox
                  checked={!!formData.summarize_conversation}
                  onCheckedChange={(checked) => setFormData({ ...formData, summarize_conversation: !!checked })}
                />
                <div>
                  <p className="text-sm font-medium text-slate-700">Summarize Conversation</p>
                  <p className="text-xs text-slate-400">Send a conversation summary along with the tool request</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Timeout (ms)</label>
                <Input type="number" value={formData.timeout_ms} onChange={(e) => setFormData({ ...formData, timeout_ms: Number(e.target.value) })} className="h-11 border-slate-200" />
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox checked={formData.speak_during_execution.enabled} onCheckedChange={(checked) => setFormData({ ...formData, speak_during_execution: { ...formData.speak_during_execution, enabled: !!checked } })} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Speak During Execution</p>
                    <p className="text-xs text-slate-400">Agent speaks while tool processes</p>
                  </div>
                </div>

                {formData.speak_during_execution.enabled && (
                  <div className="space-y-4 pl-7 border-l-2 border-slate-200 ml-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Delay (seconds)</label>
                      <Input type="number" value={formData.speak_during_execution.delay_seconds} onChange={(e) => setFormData({ ...formData, speak_during_execution: { ...formData.speak_during_execution, delay_seconds: Number(e.target.value) } })} className="h-10 border-slate-200" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Field Type</label>
                      <select className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-300" value={formData.speak_during_execution.message_field_type || "message"} onChange={(e) => setFormData({ ...formData, speak_during_execution: { ...formData.speak_during_execution, message_field_type: e.target.value } })}>
                        <option value="message">Message</option>
                        <option value="instructions">Instructions</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">{formData.speak_during_execution.message_field_type === "instructions" ? "Instructions" : "Message"}</label>
                      <Textarea placeholder={formData.speak_during_execution.message_field_type === "instructions" ? "Agent instructions..." : "What to say..."} value={formData.speak_during_execution.message} onChange={(e) => setFormData({ ...formData, speak_during_execution: { ...formData.speak_during_execution, message: e.target.value } })} className="min-h-[80px] border-slate-200 resize-y" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={() => setStep((s) => (s - 1) as Step)} disabled={step === 1} className="gap-2 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>

        <span className="text-xs text-slate-400">Step {step} of {totalSteps}</span>

        {step < 8 ? (
          <Button type="button" onClick={() => setStep((s) => (s + 1) as Step)} className="gap-2 text-sm bg-slate-900 hover:bg-slate-800 text-white">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} className="gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white">
            {tool ? "Update Tool" : "Create Tool"}
          </Button>
        )}
      </div>
    </div>
  )
}
