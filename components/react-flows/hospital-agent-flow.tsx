"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  useStore,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type OnSelectionChangeParams,
  type Connection,
} from "@xyflow/react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  Bot,
  CircleCheck,
  Database,
  FileJson,
  Focus,
  GripVertical,
  ListChecks,
  Maximize,
  Minimize,
  Play,
  Plus,
  Quote,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  Undo2,
  Redo2,
  Waypoints,
  Wrench,
  X,
  Zap,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Data model — mirrors the hospital agent definition JSON.
// ─────────────────────────────────────────────────────────────────────────────

type FieldInfo = { name: string; state: string; description: string }
type Validator = { type: string; field: string; tool: string; argument?: string; paths?: string[] }

type TaskData = {
  name: string
  kind: "collect" | "action" | "answer"
  description: string
  entryPrompt: string
  tools: string[]
  collectFields?: FieldInfo[]
  requiredToolCalls?: string[]
  validators?: Validator[]
  requiredState?: string[]
  actionTool?: string
  actionArguments?: Record<string, string>
  successMessage?: string
  cancelMessage?: string
  answerTool?: string
  questionState?: string
  answerState?: string
  answerPaths?: string[]
  fallbackAnswer?: string
}

type WorkflowData = {
  name: string
  description: string
  startPhrase: string
  interruptibleBy: string[]
  resumeAfterInterrupt: boolean
  summarizeChatCtx: boolean
  afterCompletionPrompt?: string
}

type AgentData = { title: string; version: number; workflows: number; tools: number; fields: number }
type AssistantData = { routing: string[]; flags: { label: string; value: boolean }[] }
type StateData = { fields: { name: string; type: string; short: string }[] }
type ToolData = { name: string; progress: string }

type FlowNodeData = AgentData | AssistantData | StateData | WorkflowData | TaskData | ToolData
type NodeKind = "agent" | "assistant" | "state" | "workflow" | "task" | "tool"
type FlowNode = Node<FlowNodeData, NodeKind>

// State fields from the definition
const STATE_FIELDS = [
  { name: "session.inbound_phone", type: "string", short: "digits_only · 10–15" },
  { name: "booking.doctor_name", type: "string", short: "strip + collapse · 2–160" },
  { name: "booking.requested_date", type: "string", short: "YYYY-MM-DD pattern" },
  { name: "booking.slot", type: "string", short: "from available_slots" },
  { name: "booking.patient_name", type: "string", short: "strip + collapse · 2–160" },
  { name: "booking.phone", type: "string", short: "digits_only · ^\\d{10,15}$" },
  { name: "booking.appointment_response", type: "object", short: "result of create_appointment" },
  { name: "information.question", type: "string", short: "strip + collapse · 2–2000" },
  { name: "information.answer", type: "string", short: "verified answer · 1–5000" },
]

// Tools + their progress phrases from tool_presentation
const TOOLS: ToolData[] = [
  { name: "get_doctors_specialization", progress: "میں دستیاب شعبے دیکھ رہی ہوں، ایک لمحہ انتظار کیجیے۔" },
  { name: "get_doctor_by_specialization", progress: "میں اس شعبے کے ڈاکٹرز دیکھ رہی ہوں، ایک لمحہ انتظار کیجیے۔" },
  { name: "get_doctor_by_name", progress: "میں ڈاکٹر کی معلومات چیک کر رہی ہوں، ایک لمحہ انتظار کیجیے۔" },
  { name: "get_doctor_availability", progress: "میں ڈاکٹر کے دستیاب اوقات دیکھ رہی ہوں، ایک لمحہ انتظار کیجیے۔" },
  { name: "create_appointment", progress: "میں اب آپ کی اپائنٹمنٹ بک کر رہی ہوں۔" },
  { name: "search_hospital_information", progress: "میں یہ معلومات چیک کر رہی ہوں، ایک لمحہ انتظار کیجیے۔" },
]

// The two workflows, each with its task group
const CREATE_APPOINTMENT_TASKS: TaskData[] = [
  {
    name: "doctor_and_slot_selection",
    kind: "collect",
    description: "Select and verify one doctor name, one date, and one returned available slot together.",
    entryPrompt: "آپ کس ڈاکٹر کے ساتھ اپائنٹمنٹ چاہتے ہیں؟",
    tools: ["get_doctors_specialization", "get_doctor_by_specialization", "get_doctor_by_name", "get_doctor_availability"],
    collectFields: [
      { name: "doctor_name", state: "booking.doctor_name", description: "Exact verified doctor name used in get_doctor_availability." },
      { name: "requested_date", state: "booking.requested_date", description: "Exact date used in get_doctor_availability, formatted YYYY-MM-DD." },
      { name: "slot", state: "booking.slot", description: "Exact selected value from get_doctor_availability.available_slots." },
    ],
    requiredToolCalls: ["get_doctor_availability"],
    validators: [
      { type: "equals_tool_argument", field: "doctor_name", tool: "get_doctor_availability", argument: "doctor_name" },
      { type: "equals_tool_argument", field: "requested_date", tool: "get_doctor_availability", argument: "date" },
      { type: "value_in_tool_response", field: "slot", tool: "get_doctor_availability", paths: ["available_slots", "data.available_slots", "result.available_slots", "data.result.available_slots"] },
    ],
  },
  {
    name: "personal_details",
    kind: "collect",
    description: "Collect the patient full name and confirmed booking phone number.",
    entryPrompt: "اب مجھے آپ کی کچھ ذاتی معلومات چاہییں۔ مریض کا پورا نام؟",
    tools: [],
    collectFields: [
      { name: "patient_name", state: "booking.patient_name", description: "Patient's confirmed full name." },
      { name: "phone", state: "booking.phone", description: "Confirmed patient contact number — inbound number only after caller accepts it." },
    ],
  },
  {
    name: "confirm_and_create",
    kind: "action",
    description: "Read the final booking summary, obtain confirmation, and call the real create_appointment endpoint once.",
    entryPrompt: "تصدیق کے بعد ہی اپائنٹمنٹ بنے گی۔",
    tools: ["create_appointment"],
    requiredState: ["booking.doctor_name", "booking.requested_date", "booking.slot", "booking.patient_name", "booking.phone"],
    actionTool: "create_appointment",
    actionArguments: {
      patient_name: "{state.booking.patient_name}",
      doctor_name: "{state.booking.doctor_name}",
      time_slot: "{state.booking.slot}",
      phone: "{state.booking.phone}",
      appointment_date: "{state.booking.requested_date}",
    },
    successMessage: "آپ کی اپائنٹمنٹ بک ہوگئی ہے۔ کیا میں کسی اور چیز میں مدد کر سکتی ہوں؟",
    cancelMessage: "ٹھیک ہے، اپائنٹمنٹ بک نہیں کی گئی۔",
  },
]

const GENERAL_INFO_TASKS: TaskData[] = [
  {
    name: "answer_question",
    kind: "answer",
    description: "Search the real hospital FAQ endpoint and answer only from its result.",
    entryPrompt: "آپ ہسپتال کے بارے میں کیا جاننا چاہتے ہیں؟",
    tools: ["search_hospital_information"],
    answerTool: "search_hospital_information",
    questionState: "information.question",
    answerState: "information.answer",
    answerPaths: ["answer", "data.answer", "match.answer", "data.match.answer", "result.answer", "result"],
    fallbackAnswer: "یہ معلومات ابھی تصدیق نہیں ہو سکیں۔",
  },
]

const WORKFLOWS: WorkflowData[] = [
  {
    name: "create_appointment",
    description: "Create a new appointment using a verified doctor, date, available time slot, patient name, and phone number.",
    startPhrase: "آئیے آپ کی اپائنٹمنٹ بک کرتے ہیں۔",
    interruptibleBy: ["general_information"],
    resumeAfterInterrupt: true,
    summarizeChatCtx: false,
  },
  {
    name: "general_information",
    description: "Answer one verified, non-patient-specific hospital information question.",
    startPhrase: "میں تصدیق شدہ معلومات دیکھتی ہوں۔",
    interruptibleBy: [],
    resumeAfterInterrupt: false,
    summarizeChatCtx: false,
    afterCompletionPrompt: "کیا میں کسی اور چیز میں مدد کر سکتی ہوں؟",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Small shared UI pieces
// ─────────────────────────────────────────────────────────────────────────────

function Micro({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[9px] font-semibold uppercase tracking-[0.14em]", className)}>{children}</p>
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium", className)}>
      {children}
    </span>
  )
}

const KINDS = {
  collect: { label: "COLLECT", chip: "bg-indigo-50 text-indigo-600", dot: "bg-indigo-500", icon: ListChecks },
  action: { label: "ACTION", chip: "bg-rose-50 text-rose-600", dot: "bg-rose-500", icon: Play },
  answer: { label: "ANSWER", chip: "bg-sky-50 text-sky-600", dot: "bg-sky-500", icon: Bot },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Custom node components
// ─────────────────────────────────────────────────────────────────────────────

function AgentNode({ data, selected }: NodeProps<FlowNode>) {
  const d = data as AgentData
  return (
    <div
      className={cn(
        "w-[260px] max-w-full overflow-hidden rounded-2xl border bg-white shadow-md transition-shadow",
        selected ? "border-emerald-400 ring-2 ring-emerald-300" : "border-slate-200",
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <FileJson className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <Micro className="text-emerald-600">Agent definition</Micro>
          <p className="truncate font-mono text-xs font-semibold text-slate-800">{d.title}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2.5">
        <Chip className="bg-slate-100 text-slate-600">schema v{d.version}</Chip>
        <Chip className="bg-emerald-50 text-emerald-600">{d.workflows} workflows</Chip>
        <Chip className="bg-amber-50 text-amber-600">{d.tools} tools</Chip>
        <Chip className="bg-violet-50 text-violet-600">{d.fields} state fields</Chip>
      </div>
      <Handle type="source" position={Position.Bottom} id="out" className="!h-2 !w-2 !border-emerald-500 !bg-emerald-500" />
    </div>
  )
}

function AssistantNode({ data, selected }: NodeProps<FlowNode>) {
  const d = data as AssistantData
  return (
    <div
      className={cn(
        "w-[300px] max-w-full overflow-hidden rounded-2xl border bg-white shadow-md transition-shadow",
        selected ? "border-teal-400 ring-2 ring-teal-300" : "border-slate-200",
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <Micro className="text-teal-600">Assistant</Micro>
          <p className="text-xs font-semibold text-slate-800">Voice agent runtime</p>
        </div>
      </div>
      <div className="space-y-2 px-3.5 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <CircleCheck className="h-3 w-3" /> use_agent_definition_instructions
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <CircleCheck className="h-3 w-3" /> greeting_from_agent_definition
          </span>
        </div>
        <div>
          <Micro className="mb-1.5 text-slate-400">Routing — 2 POC workflows</Micro>
          <div className="space-y-1">
            {d.routing.map((r) => (
              <div key={r} className="flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                <p className="text-[11px] leading-snug text-slate-600">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} id="in" className="!h-2 !w-2 !border-teal-500 !bg-white" />
      <Handle type="source" position={Position.Right} id="out" className="!h-2 !w-2 !border-teal-500 !bg-teal-500" />
    </div>
  )
}

function StateNode({ data, selected }: NodeProps<FlowNode>) {
  const d = data as StateData
  return (
    <div
      className={cn(
        "w-[320px] max-w-full overflow-hidden rounded-2xl border bg-white shadow-md transition-shadow",
        selected ? "border-violet-400 ring-2 ring-violet-300" : "border-slate-200",
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Database className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <Micro className="text-violet-600">State schema</Micro>
          <p className="text-xs font-semibold text-slate-800">{d.fields.length} validated fields</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 px-3.5 py-3">
        {d.fields.map((f) => (
          <div key={f.name} className="rounded-lg border border-slate-100 bg-slate-50/70 px-2 py-1.5">
            <p className="truncate font-mono text-[10px] font-semibold text-slate-700" title={f.name}>
              {f.name}
            </p>
            <p className="mt-0.5 truncate text-[9px] text-slate-400" title={f.short}>
              {f.type} · {f.short}
            </p>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} id="out" className="!h-2 !w-2 !border-violet-500 !bg-violet-500" />
    </div>
  )
}

function WorkflowGroupNode({ data, selected }: NodeProps<FlowNode>) {
  const d = data as WorkflowData
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-b from-slate-50/90 to-white transition-colors",
        selected ? "border-indigo-400 bg-indigo-50/40" : "border-slate-200",
      )}
    >
      <div className="pointer-events-none absolute inset-x-3 top-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div>
            <Micro className="text-indigo-500">Workflow</Micro>
            <p className="font-mono text-xs font-bold text-slate-800">{d.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {d.interruptibleBy.length > 0 && (
            <Chip className="bg-amber-50 text-amber-600">interruptible</Chip>
          )}
          {d.resumeAfterInterrupt && <Chip className="bg-emerald-50 text-emerald-600">resume</Chip>}
          {!d.summarizeChatCtx && <Chip className="bg-slate-100 text-slate-500">no ctx</Chip>}
        </div>
      </div>
      <Handle type="target" position={Position.Left} id="in" className="!h-2.5 !w-2.5 !border-indigo-500 !bg-white" />
    </div>
  )
}

function TaskNode({ data, selected }: NodeProps<FlowNode>) {
  const d = data as TaskData
  const kind = KINDS[d.kind]
  return (
    <div
      className={cn(
        "w-[400px] max-w-full overflow-hidden rounded-2xl border bg-white shadow-md transition-shadow",
        selected ? "border-indigo-400 ring-2 ring-indigo-300" : "border-slate-200",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", kind.chip)}>
            <kind.icon className="h-3.5 w-3.5" />
          </div>
          <p className="truncate font-mono text-xs font-bold text-slate-800">{d.name}</p>
        </div>
        <Chip className={cn(kind.chip, "shrink-0")}>{kind.label}</Chip>
      </div>

      <p className="break-words px-3.5 pt-2.5 text-[11px] leading-relaxed text-slate-500">{d.description}</p>

      <div className="mt-2 flex items-start gap-1.5 px-3.5">
        <Quote className="mt-0.5 h-3 w-3 shrink-0 text-slate-300" />
        <p className="break-words text-[11px] italic leading-relaxed text-slate-600">{d.entryPrompt}</p>
      </div>

      {d.collectFields && d.collectFields.length > 0 && (
        <div className="mt-2.5 px-3.5">
          <Micro className="mb-1 text-slate-400">Collect</Micro>
          <div className="grid grid-cols-2 gap-1.5">
            {d.collectFields.map((f) => (
              <div key={f.name} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 px-2 py-1.5">
                <p className="truncate text-[10px] font-semibold text-slate-700" title={f.name}>
                  {f.name}
                </p>
                <p className="truncate font-mono text-[9px] text-violet-500" title={f.state}>
                  → {f.state}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.requiredState && d.requiredState.length > 0 && (
        <div className="mt-2.5 px-3.5">
          <Micro className="mb-1 text-slate-400">Required state</Micro>
          <div className="flex flex-wrap gap-1">
            {d.requiredState.map((s) => (
              <Chip key={s} className="bg-violet-50 text-violet-600">{s}</Chip>
            ))}
          </div>
        </div>
      )}

      {d.tools.length > 0 && (
        <div className="mt-2.5 px-3.5">
          <Micro className="mb-1 text-slate-400">Tools</Micro>
          <div className="flex flex-wrap gap-1">
            {d.tools.map((t) => (
              <Chip key={t} className="bg-amber-50 text-amber-600">{t}</Chip>
            ))}
          </div>
        </div>
      )}

      {d.actionTool && (
        <div className="mt-2.5 px-3.5">
          <Micro className="mb-1 text-slate-400">Action</Micro>
          <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50/70 px-2 py-1.5">
            <Play className="h-3 w-3 shrink-0 text-rose-500" />
            <span className="truncate font-mono text-[10px] font-semibold text-rose-600">{d.actionTool}</span>
            <span className="ml-auto shrink-0 text-[9px] text-rose-400">→ {d.successMessage ? "success" : "completed"}</span>
          </div>
        </div>
      )}

      {d.answerTool && (
        <div className="mt-2.5 px-3.5">
          <Micro className="mb-1 text-slate-400">Answer source</Micro>
          <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50/70 px-2 py-1.5">
            <Bot className="h-3 w-3 shrink-0 text-sky-500" />
            <span className="truncate font-mono text-[10px] font-semibold text-sky-600">{d.answerTool}</span>
            <span className="ml-auto shrink-0 font-mono text-[9px] text-sky-400">q:{d.questionState}</span>
          </div>
        </div>
      )}

      {(d.requiredToolCalls?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3.5 pb-3 pt-2.5">
          <Chip className="bg-indigo-50 text-indigo-600">
            must call: {d.requiredToolCalls?.join(", ")}
          </Chip>
          {d.validators && (
            <Chip className="bg-emerald-50 text-emerald-600">{d.validators.length} completion validators</Chip>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Left} id="in" className="!h-2 !w-2 !border-indigo-500 !bg-white" />
      <Handle type="source" position={Position.Right} id="out" className="!h-2 !w-2 !border-indigo-500 !bg-indigo-500" />
    </div>
  )
}

function ToolNode({ data, selected }: NodeProps<FlowNode>) {
  const d = data as ToolData
  return (
    <div
      className={cn(
        "w-[240px] max-w-full overflow-hidden rounded-2xl border bg-white shadow-md transition-shadow",
        selected ? "border-amber-400 ring-2 ring-amber-300" : "border-slate-200",
      )}
    >
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Wrench className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <Micro className="text-amber-600">Tool</Micro>
          <p className="truncate font-mono text-[11px] font-semibold text-slate-800">{d.name}</p>
        </div>
      </div>
      <p className="break-words border-t border-slate-100 px-3.5 py-2 text-[10px] italic leading-relaxed text-slate-500">
        {d.progress}
      </p>
      <Handle type="target" position={Position.Left} id="in" className="!h-2 !w-2 !border-amber-500 !bg-white" />
    </div>
  )
}

// nodeTypes must be referentially stable across renders.
const nodeTypes = { agent: AgentNode, assistant: AssistantNode, state: StateNode, workflow: WorkflowGroupNode, task: TaskNode, tool: ToolNode }

// ─────────────────────────────────────────────────────────────────────────────
// Custom edges: labeled "pill" edge + dashed tool / state edges
// ─────────────────────────────────────────────────────────────────────────────

function PillEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps) {
  const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  return (
    <>
      <BaseEdge id={id} path={path} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 shadow-sm"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {(data as { label?: string })?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

function makeDashedEdge(color: string) {
  return function DashedEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
    const [path] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
    return <BaseEdge id={id} path={path} style={{ stroke: color, strokeWidth: 1.5, strokeDasharray: "5 5" }} />
  }
}

const edgeTypes = {
  pill: PillEdge,
  dashedViolet: makeDashedEdge("#8b5cf6"),
  dashedAmber: makeDashedEdge("#f59e0b"),
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph assembly
// ─────────────────────────────────────────────────────────────────────────────

const initialNodes: FlowNode[] = [
  // Config column
  { id: "agent", type: "agent", position: { x: 40, y: 90 }, data: { title: "hospital_agent_definition.json", version: 1, workflows: 2, tools: 6, fields: 9 } },
  {
    id: "assistant",
    type: "assistant",
    position: { x: 40, y: 400 },
    data: {
      routing: [
        "New booking request → run_workflow(create_appointment)",
        "Hospital fact question → run_workflow(general_information)",
        "Never answer hospital facts from memory",
        "Never mention workflows, tasks, state, JSON, or tool names",
      ],
      flags: [
        { label: "use_agent_definition_instructions", value: true },
        { label: "greeting_from_agent_definition", value: true },
      ],
    },
  },
  { id: "state", type: "state", position: { x: 40, y: 800 }, data: { fields: STATE_FIELDS } },

  // Workflow groups (subflows). Children use relative coordinates via parentId.
  {
    id: "wf-create",
    type: "workflow",
    position: { x: 500, y: 60 },
    style: { width: 460, height: 940 },
    data: WORKFLOWS[0],
  },
  {
    id: "wf-general",
    type: "workflow",
    position: { x: 500, y: 1040 },
    style: { width: 460, height: 340 },
    data: WORKFLOWS[1],
  },

  // create_appointment task group (children of wf-create)
  {
    id: "task-doctor-slot",
    type: "task",
    parentId: "wf-create",
    extent: "parent",
    zIndex: 1,
    position: { x: 20, y: 84 },
    data: CREATE_APPOINTMENT_TASKS[0],
  },
  {
    id: "task-personal",
    type: "task",
    parentId: "wf-create",
    extent: "parent",
    zIndex: 1,
    position: { x: 20, y: 380 },
    data: CREATE_APPOINTMENT_TASKS[1],
  },
  {
    id: "task-confirm",
    type: "task",
    parentId: "wf-create",
    extent: "parent",
    zIndex: 1,
    position: { x: 20, y: 660 },
    data: CREATE_APPOINTMENT_TASKS[2],
  },

  // general_information task group (children of wf-general)
  {
    id: "task-answer",
    type: "task",
    parentId: "wf-general",
    extent: "parent",
    zIndex: 1,
    position: { x: 20, y: 84 },
    data: GENERAL_INFO_TASKS[0],
  },

  // Tools column
  { id: "tool-specs", type: "tool", position: { x: 1100, y: 110 }, data: TOOLS[0] },
  { id: "tool-spec-doctors", type: "tool", position: { x: 1100, y: 230 }, data: TOOLS[1] },
  { id: "tool-doctor-name", type: "tool", position: { x: 1100, y: 350 }, data: TOOLS[2] },
  { id: "tool-availability", type: "tool", position: { x: 1100, y: 470 }, data: TOOLS[3] },
  { id: "tool-create", type: "tool", position: { x: 1100, y: 840 }, data: TOOLS[4] },
  { id: "tool-search", type: "tool", position: { x: 1100, y: 1100 }, data: TOOLS[5] },
]

const initialEdges: Edge[] = [
  // Agent definition → assistant → workflows
  { id: "e-agent-assistant", source: "agent", sourceHandle: "out", target: "assistant", targetHandle: "in" },
  { id: "e-asst-create", source: "assistant", sourceHandle: "out", target: "wf-create", targetHandle: "in", type: "pill", animated: true, data: { label: "run_workflow" } },
  { id: "e-asst-general", source: "assistant", sourceHandle: "out", target: "wf-general", targetHandle: "in", type: "pill", animated: true, data: { label: "run_workflow" } },

  // State schema feeds both workflows
  { id: "e-state-create", source: "state", sourceHandle: "out", target: "wf-create", targetHandle: "in", type: "dashedViolet" },
  { id: "e-state-general", source: "state", sourceHandle: "out", target: "wf-general", targetHandle: "in", type: "dashedViolet" },

  // Task pipeline inside create_appointment
  { id: "e-t1-t2", source: "task-doctor-slot", target: "task-personal", type: "pill", animated: true, data: { label: "next" } },
  { id: "e-t2-t3", source: "task-personal", target: "task-confirm", type: "pill", animated: true, data: { label: "next" } },

  // Task → tool calls
  { id: "e-t1-specs", source: "task-doctor-slot", target: "tool-specs", type: "dashedAmber" },
  { id: "e-t1-spec-doctors", source: "task-doctor-slot", target: "tool-spec-doctors", type: "dashedAmber" },
  { id: "e-t1-doctor-name", source: "task-doctor-slot", target: "tool-doctor-name", type: "dashedAmber" },
  { id: "e-t1-availability", source: "task-doctor-slot", target: "tool-availability", type: "dashedAmber" },
  { id: "e-t3-create", source: "task-confirm", target: "tool-create", type: "dashedAmber" },
  { id: "e-answer-search", source: "task-answer", target: "tool-search", type: "dashedAmber" },
]

// ─────────────────────────────────────────────────────────────────────────────
// Editor — schema-driven panel to edit the selected node's data
// ─────────────────────────────────────────────────────────────────────────────

type RowField =
  | { key: string; label: string; type?: "text" | "toggle" | "select" | "list"; options?: string[] }

type FieldSpec =
  | { kind: "text"; key: string; label: string; placeholder?: string; parse?: (s: string) => unknown }
  | { kind: "textarea"; key: string; label: string; placeholder?: string }
  | { kind: "toggle"; key: string; label: string }
  | { kind: "select"; key: string; label: string; options: string[] }
  | { kind: "chips"; key: string; label: string; placeholder?: string }
  | { kind: "rows"; key: string; label: string; addLabel: string; rowKey: string; defaultRow: Record<string, unknown>; rowFields: RowField[] }
  | { kind: "kv"; key: string; label: string }

const TASK_KINDS = ["collect", "action", "answer"]
const VALIDATOR_TYPES = ["equals_tool_argument", "value_in_tool_response"]

const EDIT_SCHEMA: Record<string, FieldSpec[]> = {
  agent: [
    { kind: "text", key: "title", label: "Definition file" },
    { kind: "text", key: "version", label: "Schema version", parse: (s) => parseInt(s, 10) || 0 },
  ],
  assistant: [
    { kind: "chips", key: "routing", label: "Routing instructions", placeholder: "Add a routing rule" },
    {
      kind: "rows",
      key: "flags",
      label: "Behavior flags",
      addLabel: "Add flag",
      rowKey: "label",
      defaultRow: { label: "new_flag", value: true },
      rowFields: [
        { key: "label", label: "Flag" },
        { key: "value", label: "Enabled", type: "toggle" },
      ],
    },
  ],
  state: [
    {
      kind: "rows",
      key: "fields",
      label: "State fields",
      addLabel: "Add field",
      rowKey: "name",
      defaultRow: { name: "new_field", type: "string", short: "description" },
      rowFields: [
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "short", label: "Validation" },
      ],
    },
    { kind: "text", key: "depsHint", label: "Dependencies", placeholder: "Read-only: derived from field validators" },
  ],
  workflow: [
    { kind: "text", key: "name", label: "Name" },
    { kind: "textarea", key: "description", label: "Description" },
    { kind: "text", key: "startPhrase", label: "Start phrase" },
    { kind: "chips", key: "interruptibleBy", label: "Interruptible by", placeholder: "workflow name" },
    { kind: "toggle", key: "resumeAfterInterrupt", label: "Resume after interrupt" },
    { kind: "toggle", key: "summarizeChatCtx", label: "Summarize chat context" },
    { kind: "text", key: "afterCompletionPrompt", label: "After completion prompt" },
  ],
  task: [
    { kind: "text", key: "name", label: "Name" },
    { kind: "select", key: "kind", label: "Kind", options: TASK_KINDS },
    { kind: "textarea", key: "description", label: "Description" },
    { kind: "text", key: "entryPrompt", label: "Entry prompt" },
    { kind: "chips", key: "tools", label: "Tools", placeholder: "tool name" },
    {
      kind: "rows",
      key: "collectFields",
      label: "Collect fields",
      addLabel: "Add field",
      rowKey: "name",
      defaultRow: { name: "new_field", state: "booking.new_field", description: "" },
      rowFields: [
        { key: "name", label: "Field" },
        { key: "state", label: "State" },
        { key: "description", label: "Description" },
      ],
    },
    { kind: "chips", key: "requiredState", label: "Required state", placeholder: "booking.field" },
    { kind: "chips", key: "requiredToolCalls", label: "Must call", placeholder: "tool name" },
    {
      kind: "rows",
      key: "validators",
      label: "Completion validators",
      addLabel: "Add validator",
      rowKey: "type",
      defaultRow: { type: "equals_tool_argument", field: "", tool: "", argument: "", paths: "" },
      rowFields: [
        { key: "type", label: "Type", type: "select", options: VALIDATOR_TYPES },
        { key: "field", label: "Field" },
        { key: "tool", label: "Tool" },
        { key: "argument", label: "Argument" },
        { key: "paths", label: "Paths (comma)", type: "list" },
      ],
    },
    { kind: "text", key: "actionTool", label: "Action tool" },
    { kind: "kv", key: "actionArguments", label: "Action arguments" },
    { kind: "text", key: "successMessage", label: "Success message" },
    { kind: "text", key: "cancelMessage", label: "Cancel message" },
    { kind: "text", key: "answerTool", label: "Answer tool" },
    { kind: "text", key: "questionState", label: "Question state" },
    { kind: "text", key: "answerState", label: "Answer state" },
    { kind: "chips", key: "answerPaths", label: "Answer paths", placeholder: "answer" },
    { kind: "text", key: "fallbackAnswer", label: "Fallback answer" },
  ],
  tool: [
    { kind: "text", key: "name", label: "Name" },
    { kind: "textarea", key: "progress", label: "Progress phrase" },
  ],
}

const INPUT_CLASS =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-1.5 font-mono text-[11px] text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-300 focus:bg-white"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <Micro className="mb-1 text-slate-400">{label}</Micro>
      {children}
    </div>
  )
}

function ToggleField({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        value ? "bg-emerald-500" : "bg-slate-200",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform",
          value ? "translate-x-4" : "translate-x-[3px]",
        )}
      />
    </button>
  )
}

function TextField({ spec, data, onData }: { spec: Extract<FieldSpec, { kind: "text" }>; data: Record<string, unknown>; onData: (d: Record<string, unknown>) => void }) {
  const raw = data[spec.key]
  const value = typeof raw === "number" ? String(raw) : (raw as string) ?? ""
  const onChange = (s: string) => onData({ ...data, [spec.key]: spec.parse ? spec.parse(s) : s })
  return (
    <Field label={spec.label}>
      <input className={INPUT_CLASS} value={value} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

function AreaField({ spec, data, onData }: { spec: Extract<FieldSpec, { kind: "textarea" }>; data: Record<string, unknown>; onData: (d: Record<string, unknown>) => void }) {
  const value = (data[spec.key] as string) ?? ""
  return (
    <Field label={spec.label}>
      <textarea
        rows={2}
        className={cn(INPUT_CLASS, "resize-none leading-relaxed")}
        value={value}
        placeholder={spec.placeholder}
        onChange={(e) => onData({ ...data, [spec.key]: e.target.value })}
      />
    </Field>
  )
}

function ToggleEditor({ spec, data, onData }: { spec: Extract<FieldSpec, { kind: "toggle" }>; data: Record<string, unknown>; onData: (d: Record<string, unknown>) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Micro className="text-slate-400">{spec.label}</Micro>
      <ToggleField value={Boolean(data[spec.key])} onChange={(v) => onData({ ...data, [spec.key]: v })} />
    </div>
  )
}

function SelectField({ spec, data, onData }: { spec: Extract<FieldSpec, { kind: "select" }>; data: Record<string, unknown>; onData: (d: Record<string, unknown>) => void }) {
  const value = (data[spec.key] as string) ?? spec.options[0]
  return (
    <Field label={spec.label}>
      <select className={INPUT_CLASS} value={value} onChange={(e) => onData({ ...data, [spec.key]: e.target.value })}>
        {spec.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  )
}

function ChipsField({ spec, data, onData }: { spec: Extract<FieldSpec, { kind: "chips" }>; data: Record<string, unknown>; onData: (d: Record<string, unknown>) => void }) {
  const [draft, setDraft] = useState("")
  const list = Array.isArray(data[spec.key]) ? (data[spec.key] as string[]) : []
  const set = (next: string[]) => onData({ ...data, [spec.key]: next })
  const add = () => {
    const v = draft.trim()
    if (!v) return
    set([...list, v])
    setDraft("")
  }
  return (
    <Field label={spec.label}>
      <div className="flex flex-wrap gap-1">
        {list.map((c, i) => (
          <span key={`${c}-${i}`} className="inline-flex max-w-full items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] text-indigo-600">
            <span className="truncate">{c}</span>
            <button onClick={() => set(list.filter((_, idx) => idx !== i))} className="text-indigo-300 hover:text-rose-500">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <input
          className={INPUT_CLASS}
          value={draft}
          placeholder={spec.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add()
            }
          }}
        />
        <button
          onClick={add}
          className="inline-flex shrink-0 items-center rounded-lg border border-slate-200 px-2 text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-600"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </Field>
  )
}

function RowFieldInput({ rf, row, onChange }: { rf: RowField; row: Record<string, unknown>; onChange: (v: unknown) => void }) {
  if (rf.type === "toggle") {
    return (
      <div className="flex items-center justify-between gap-2">
        <Micro className="text-slate-400">{rf.label}</Micro>
        <ToggleField value={Boolean(row[rf.key])} onChange={(v) => onChange(v)} />
      </div>
    )
  }
  if (rf.type === "select") {
    const value = (row[rf.key] as string) ?? rf.options?.[0]
    return (
      <select className={INPUT_CLASS} value={value} onChange={(e) => onChange(e.target.value)}>
        {rf.options?.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    )
  }
  if (rf.type === "list") {
    const raw = row[rf.key]
    const value = Array.isArray(raw) ? raw.join(", ") : (raw as string) ?? ""
    return (
      <input
        className={INPUT_CLASS}
        value={value}
        placeholder={rf.label}
        onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
      />
    )
  }
  const value = (row[rf.key] as string) ?? ""
  return (
    <input className={INPUT_CLASS} value={value} placeholder={rf.label} onChange={(e) => onChange(e.target.value)} />
  )
}

function RowsField({ spec, data, onData }: { spec: Extract<FieldSpec, { kind: "rows" }>; data: Record<string, unknown>; onData: (d: Record<string, unknown>) => void }) {
  const rows = (Array.isArray(data[spec.key]) ? data[spec.key] : []) as Record<string, unknown>[]
  const set = (next: Record<string, unknown>[]) => onData({ ...data, [spec.key]: next })
  const update = (i: number, patch: Record<string, unknown>) => set(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i: number) => set(rows.filter((_, idx) => idx !== i))
  const add = () => set([...rows, { ...spec.defaultRow }])
  return (
    <Field label={spec.label}>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate font-mono text-[10px] font-semibold text-slate-500">
                {String(row[spec.rowKey] || `row ${i + 1}`)}
              </span>
              <button onClick={() => remove(i)} className="shrink-0 text-slate-300 transition-colors hover:text-rose-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-1.5">
              {spec.rowFields.map((rf) => (
                <RowFieldInput key={rf.key} rf={rf} row={row} onChange={(v) => update(i, { [rf.key]: v })} />
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={add}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 py-1.5 text-[10px] font-medium text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-600"
        >
          <Plus className="h-3 w-3" /> {spec.addLabel}
        </button>
      </div>
    </Field>
  )
}

function KvField({ spec, data, onData }: { spec: Extract<FieldSpec, { kind: "kv" }>; data: Record<string, unknown>; onData: (d: Record<string, unknown>) => void }) {
  const rec = (data[spec.key] as Record<string, string>) ?? {}
  const entries = Object.entries(rec)
  const set = (next: Record<string, string>) => onData({ ...data, [spec.key]: next })
  const update = (i: number, k: string, v: string) => {
    const next: Record<string, string> = {}
    entries.forEach(([ok, ov], idx) => {
      if (idx === i) next[k] = v
      else next[ok] = ov
    })
    set(next)
  }
  const remove = (i: number) => {
    const next: Record<string, string> = {}
    entries.forEach(([ok, ov], idx) => {
      if (idx !== i) next[ok] = ov
    })
    set(next)
  }
  return (
    <Field label={spec.label}>
      <div className="space-y-1.5">
        {entries.map(([k, v], i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
            <div className="mb-1.5 flex items-center justify-end">
              <button onClick={() => remove(i)} className="text-slate-300 transition-colors hover:text-rose-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-1.5">
              <input className={INPUT_CLASS} value={k} placeholder="key" onChange={(e) => update(i, e.target.value, v)} />
              <input className={INPUT_CLASS} value={v} placeholder="value" onChange={(e) => update(i, k, e.target.value)} />
            </div>
          </div>
        ))}
        <button
          onClick={() => set({ ...rec, "": "" })}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 py-1.5 text-[10px] font-medium text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-600"
        >
          <Plus className="h-3 w-3" /> Add argument
        </button>
      </div>
    </Field>
  )
}

function EditorFields({ schema, data, onData }: { schema: FieldSpec[]; data: Record<string, unknown>; onData: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      {schema.map((spec) => {
        switch (spec.kind) {
          case "text":
            return <TextField key={spec.key} spec={spec} data={data} onData={onData} />
          case "textarea":
            return <AreaField key={spec.key} spec={spec} data={data} onData={onData} />
          case "toggle":
            return <ToggleEditor key={spec.key} spec={spec} data={data} onData={onData} />
          case "select":
            return <SelectField key={spec.key} spec={spec} data={data} onData={onData} />
          case "chips":
            return <ChipsField key={spec.key} spec={spec} data={data} onData={onData} />
          case "rows":
            return <RowsField key={spec.key} spec={spec} data={data} onData={onData} />
          case "kv":
            return <KvField key={spec.key} spec={spec} data={data} onData={onData} />
        }
      })}
    </div>
  )
}

const NODE_ICONS: Record<NodeKind, React.ReactNode> = {
  agent: <FileJson className="h-3.5 w-3.5" />,
  assistant: <Sparkles className="h-3.5 w-3.5" />,
  state: <Database className="h-3.5 w-3.5" />,
  workflow: <Zap className="h-3.5 w-3.5" />,
  task: <ListChecks className="h-3.5 w-3.5" />,
  tool: <Wrench className="h-3.5 w-3.5" />,
}

const NODE_TITLES: Record<NodeKind, string> = {
  agent: "Agent definition",
  assistant: "Assistant",
  state: "State schema",
  workflow: "Workflow",
  task: "Task",
  tool: "Tool",
}

function EditPanel({
  node,
  edge,
  onPatch,
  onDelete,
  onClose,
  width,
}: {
  node: FlowNode | null
  edge: Edge | null
  onPatch: (next: FlowNodeData) => void
  onDelete: () => void
  onClose: () => void
  width?: number
}) {
  const kind = node?.type as NodeKind | undefined
  const name = kind === "tool" ? String((node?.data as ToolData).name ?? "") : String((node?.data as { name?: string })?.name ?? "")

  return (
    <aside
      className="flex h-72 w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white lg:h-full lg:w-[var(--panel-w)]"
      style={{ "--panel-w": `${width ?? 320}px` } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        {node ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              {kind ? NODE_ICONS[kind] : null}
            </div>
            <div className="min-w-0">
              <Micro className="text-slate-400">{kind ? NODE_TITLES[kind] : "Node"}</Micro>
              <p className="truncate font-mono text-xs font-semibold text-slate-800">{name || node.id}</p>
            </div>
          </div>
        ) : edge ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Waypoints className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <Micro className="text-slate-400">Edge</Micro>
              <p className="truncate font-mono text-xs font-semibold text-slate-800">{edge.source} → {edge.target}</p>
            </div>
          </div>
        ) : (
          <Micro className="text-slate-400">Editor</Micro>
        )}
        {node && (
          <button
            onClick={onDelete}
            title="Delete node and its connections"
            className="rounded-md p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        {(node || edge) && (
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!node && !edge ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
              <Stethoscope className="h-5 w-5" />
            </div>
            <p className="max-w-[200px] text-[11px] font-light leading-relaxed text-slate-400">
              Select a node or edge to edit it. Use “Add” in the toolbar to create new nodes.
            </p>
          </div>
        ) : node && kind ? (
          <EditorFields schema={EDIT_SCHEMA[kind]} data={node.data as Record<string, unknown>} onData={(d) => onPatch(d as FlowNodeData)} />
        ) : edge ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
              <Micro className="mb-1 text-slate-400">Connection</Micro>
              <p className="break-words font-mono text-[10px] text-slate-600">
                {edge.source}
                {edge.sourceHandle ? `[${edge.sourceHandle}]` : ""} → {edge.target}
                {edge.targetHandle ? `[${edge.targetHandle}]` : ""}
              </p>
            </div>
            <button
              onClick={onDelete}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 py-2 text-[11px] font-medium text-rose-600 transition-colors hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete edge
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Retell-style left sidebar — block palette (drag / click to add) + canvas outline
// ─────────────────────────────────────────────────────────────────────────────

type PaletteKind = NodeKind | "task-collect" | "task-action" | "task-answer"

// Which workflow group (if any) contains the given screen point
function workflowGroupAt(clientX: number, clientY: number): string | null {
  const els = document.querySelectorAll<HTMLElement>(".react-flow__node.parent")
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return el.getAttribute("data-id")
  }
  return null
}

const ACCENTS = {
  emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  teal: { icon: "bg-teal-50 text-teal-600", bar: "bg-teal-500" },
  violet: { icon: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  indigo: { icon: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-500" },
  rose: { icon: "bg-rose-50 text-rose-600", bar: "bg-rose-500" },
  sky: { icon: "bg-sky-50 text-sky-600", bar: "bg-sky-500" },
  amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
} as const

type BlockDef = {
  kind: PaletteKind
  label: string
  sub: string
  icon: React.ReactNode
  accent: keyof typeof ACCENTS
}

const BLOCK_GROUPS: { group: string; items: BlockDef[] }[] = [
  {
    group: "Core",
    items: [
      { kind: "agent", label: "Agent Definition", sub: "schema metadata", icon: <FileJson className="h-3.5 w-3.5" />, accent: "emerald" },
      { kind: "assistant", label: "Assistant", sub: "routing + flags", icon: <Sparkles className="h-3.5 w-3.5" />, accent: "teal" },
      { kind: "state", label: "State Schema", sub: "validated fields", icon: <Database className="h-3.5 w-3.5" />, accent: "violet" },
    ],
  },
  {
    group: "Workflow",
    items: [{ kind: "workflow", label: "Workflow", sub: "task pipeline", icon: <Zap className="h-3.5 w-3.5" />, accent: "indigo" }],
  },
  {
    group: "Tasks",
    items: [
      { kind: "task-collect", label: "Collect Task", sub: "gather fields", icon: <ListChecks className="h-3.5 w-3.5" />, accent: "indigo" },
      { kind: "task-action", label: "Action Task", sub: "call a tool", icon: <Play className="h-3.5 w-3.5" />, accent: "rose" },
      { kind: "task-answer", label: "Answer Task", sub: "from tool result", icon: <Bot className="h-3.5 w-3.5" />, accent: "sky" },
    ],
  },
  {
    group: "Tools",
    items: [{ kind: "tool", label: "Tool", sub: "progress phrase", icon: <Wrench className="h-3.5 w-3.5" />, accent: "amber" }],
  },
]

function FlowSidebar({
  nodes,
  selectedId,
  onAdd,
  onSelect,
  width,
}: {
  nodes: FlowNode[]
  selectedId: string | null
  onAdd: (kind: PaletteKind) => void
  onSelect: (id: string) => void
  width?: number
}) {
  const [tab, setTab] = useState<"add" | "canvas">("add")
  const [query, setQuery] = useState("")

  const filtered = query.trim()
    ? BLOCK_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase())) })).filter((g) => g.items.length > 0)
    : BLOCK_GROUPS

  const tops = nodes.filter((n) => !n.parentId)

  return (
    <aside
      className="flex h-72 w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white lg:h-full lg:w-[var(--panel-w)]"
      style={{ "--panel-w": `${width ?? 252}px` } as React.CSSProperties}
    >
      <div className="border-b border-slate-100 px-3 pt-3">
        <div className="flex items-center justify-between px-0.5">
          <Micro className="text-slate-400">Library</Micro>
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setTab("add")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                tab === "add" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600",
              )}
            >
              <Plus className="h-3 w-3" /> Add
            </button>
            <button
              onClick={() => setTab("canvas")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                tab === "canvas" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600",
              )}
            >
              <ListChecks className="h-3 w-3" /> Canvas
            </button>
          </div>
        </div>
      </div>

      {tab === "add" ? (
        <>
          <div className="px-3 pb-1 pt-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search blocks"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-1.5 pl-7 pr-2 text-[11px] text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-300 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1">
            {filtered.map((g) => (
              <div key={g.group} className="mb-2">
                <Micro className="px-1 py-1 text-slate-300">{g.group}</Micro>
                <div className="space-y-1">
                  {g.items.map((item) => {
                    const accent = ACCENTS[item.accent]
                    return (
                      <div
                        key={item.kind}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/reactflow", item.kind)
                          e.dataTransfer.effectAllowed = "move"
                        }}
                        onClick={() => onAdd(item.kind)}
                        title="Drag onto the canvas, or click to add at the center"
                        className="group flex cursor-grab items-center gap-2 rounded-xl border border-slate-100 bg-white px-2 py-2 transition-colors hover:border-slate-200 hover:bg-slate-50 active:cursor-grabbing"
                      >
                        <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", accent.icon)}>
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-slate-700">{item.label}</p>
                          <p className="truncate text-[9px] text-slate-400">{item.sub}</p>
                        </div>
                        <span className="hidden shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 group-hover:inline-flex">
                          add
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-0.5">
            {tops.map((n) => {
              const kind = n.type as NodeKind
              const kids = n.type === "workflow" ? nodes.filter((k) => k.parentId === n.id) : []
              const active = selectedId === n.id
              return (
                <div key={n.id}>
                  <button
                    onClick={() => onSelect(n.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                      active ? "bg-indigo-50" : "hover:bg-slate-50",
                    )}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                      {NODE_ICONS[kind]}
                    </span>
                    <span className={cn("min-w-0 flex-1 truncate font-mono text-[10px] font-medium", active ? "text-indigo-700" : "text-slate-600")}>
                      {kind === "tool" ? String((n.data as ToolData).name) : String((n.data as { name?: string })?.name ?? n.id)}
                    </span>
                    {kids.length > 0 && <span className="shrink-0 font-mono text-[9px] text-slate-300">{kids.length}</span>}
                  </button>
                  {kids.map((k) => {
                    const kkind = k.type as NodeKind
                    return (
                      <button
                        key={k.id}
                        onClick={() => onSelect(k.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg py-1 pl-8 pr-2 text-left transition-colors",
                          selectedId === k.id ? "bg-indigo-50" : "hover:bg-slate-50",
                        )}
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
                          {NODE_ICONS[kkind]}
                        </span>
                        <span className={cn("min-w-0 flex-1 truncate font-mono text-[10px]", selectedId === k.id ? "font-medium text-indigo-700" : "text-slate-500")}>
                          {String((k.data as { name?: string })?.name ?? k.id)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// The flow + wrapper
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_BY_TYPE: Record<NodeKind, string> = {
  agent: "#10b981",
  assistant: "#14b8a6",
  state: "#8b5cf6",
  workflow: "#e2e8f0",
  task: "#6366f1",
  tool: "#f59e0b",
}

function HospitalAgentInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [closing, setClosing] = useState(false)
  const [visible, setVisible] = useState(false)
  const exitScheduledRef = useRef(false)
  const [sidebarWidth, setSidebarWidth] = useState(252)
  const [editorWidth, setEditorWidth] = useState(320)
  const [addOpen, setAddOpen] = useState(false)

  // Undo / redo — snapshots of {nodes, edges} taken before each mutation.
  const [history, setHistory] = useState<{ nodes: FlowNode[]; edges: Edge[] }[]>(() => [{ nodes: initialNodes, edges: initialEdges }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const editBuffer = useRef<{ id: string; gen: number; at: number } | null>(null)
  const genRef = useRef(0)

  const canvasRef = useRef<HTMLDivElement>(null)
  const flowBoxRef = useRef<HTMLDivElement>(null)
  const addCount = useRef(0)
  const { fitView, screenToFlowPosition, setCenter } = useReactFlow()

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null

  const onSelectionChange = useCallback(({ nodes: selected, edges: selectedEdges }: OnSelectionChangeParams) => {
    setSelectedId(selected.length === 1 ? selected[0].id : null)
    setSelectedEdgeId(selectedEdges.length === 1 ? selectedEdges[0].id : null)
  }, [])

  const runFitView = () => void fitView({ padding: 0.12, duration: 500 })

  // Record a new state onto the history stack (dropping any redo tail).
  const pushHistory = useCallback(
    (nextNodes: FlowNode[], nextEdges: Edge[]) => {
      genRef.current += 1
      setHistory((h) => [...h.slice(0, historyIndex + 1), { nodes: nextNodes, edges: nextEdges }].slice(-100))
      setHistoryIndex(historyIndex + 1)
    },
    [historyIndex],
  )

  const updateNode = useCallback(
    (id: string, next: FlowNodeData) => {
      const nextNodes = nodes.map((n) => (n.id === id ? { ...n, data: next } : n))
      setNodes(nextNodes)
      // Coalesce rapid keystrokes on the same node into one undo step.
      const buf = editBuffer.current
      if (buf && buf.id === id && buf.gen === genRef.current && Date.now() - buf.at < 800) {
        setHistory((h) => {
          const nh = [...h]
          nh[nh.length - 1] = { nodes: nextNodes, edges }
          return nh
        })
      } else {
        pushHistory(nextNodes, edges)
        editBuffer.current = { id, gen: genRef.current, at: Date.now() }
      }
    },
    [nodes, edges, pushHistory, setNodes],
  )

  const undo = useCallback(() => {
    if (historyIndex <= 0) return
    const i = historyIndex - 1
    setHistoryIndex(i)
    setNodes(history[i].nodes)
    setEdges(history[i].edges)
    editBuffer.current = null
    setSelectedId(null)
    setSelectedEdgeId(null)
  }, [history, historyIndex, setNodes, setEdges])

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const i = historyIndex + 1
    setHistoryIndex(i)
    setNodes(history[i].nodes)
    setEdges(history[i].edges)
    editBuffer.current = null
    setSelectedId(null)
    setSelectedEdgeId(null)
  }, [history, historyIndex, setNodes, setEdges])

  const deleteSelection = useCallback(() => {
    if (selectedEdgeId) {
      const nextEdges = edges.filter((e) => e.id !== selectedEdgeId)
      setEdges(nextEdges)
      pushHistory(nodes, nextEdges)
      setSelectedEdgeId(null)
      return
    }
    if (!selectedId) return
    const id = selectedId
    const nextNodes = nodes.filter((n) => n.id !== id && n.parentId !== id)
    const nextEdges = edges.filter((e) => e.source !== id && e.target !== id)
    setNodes(nextNodes)
    setEdges(nextEdges)
    pushHistory(nextNodes, nextEdges)
    setSelectedId(null)
  }, [selectedId, selectedEdgeId, nodes, edges, setNodes, setEdges, pushHistory])

  const onConnect = useCallback(
    (params: Connection) => {
      const nextEdges = [...edges, { ...params, id: `e-${Date.now()}` }]
      setEdges(nextEdges)
      pushHistory(nodes, nextEdges)
    },
    [edges, nodes, setEdges, pushHistory],
  )

  // Drag a palette block onto the canvas
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const addNode = useCallback(
    (kind: PaletteKind | "state-field", at?: { x: number; y: number }, forcedParentId?: string | null) => {
      addCount.current += 1
      const n = addCount.current
      setAddOpen(false)

      if (kind === "state-field") {
        const nextNodes = nodes.map((nd) =>
          nd.id === "state"
            ? { ...nd, data: { fields: [...(nd.data as StateData).fields, { name: `new_field_${n}`, type: "string", short: "description" }] } }
            : nd,
        )
        setNodes(nextNodes)
        pushHistory(nextNodes, edges)
        return
      }

      const nodeType: NodeKind = kind === "task-collect" || kind === "task-action" || kind === "task-answer" ? "task" : kind

      if (nodeType === "task") {
        const taskKind = kind === "task-action" ? "action" : kind === "task-answer" ? "answer" : "collect"
        const newId = `new-task-${n}`
        const taskData: TaskData = { name: `new_task_${n}`, kind: taskKind, description: "Describe what this task does.", entryPrompt: "New entry prompt", tools: [] }

        // Workflow the task lands in (drag drop hit-test > selected workflow > none)
        let parentId: string | null = null
        let position = at
        if (forcedParentId) {
          const pwf = nodes.find((nd) => nd.id === forcedParentId)
          parentId = forcedParentId
          position = pwf && at ? { x: at.x - pwf.position.x, y: at.y - pwf.position.y } : at
        } else if (at) {
          const wf = nodes.find(
            (nd) =>
              nd.type === "workflow" &&
              !nd.parentId &&
              at.x >= nd.position.x &&
              at.x <= nd.position.x + ((nd.style as { width?: number })?.width ?? 0) &&
              at.y >= nd.position.y &&
              at.y <= nd.position.y + ((nd.style as { height?: number })?.height ?? 0),
          )
          if (wf) {
            parentId = wf.id
            position = { x: at.x - wf.position.x, y: at.y - wf.position.y }
          }
        } else {
          const selWf = nodes.find((nd) => nd.id === selectedId && nd.type === "workflow")
          if (selWf) {
            const kids = nodes.filter((nd) => nd.parentId === selWf.id)
            const maxBottom = kids.reduce((m, k) => Math.max(m, k.position.y + (k.measured?.height ?? 200)), 0)
            parentId = selWf.id
            position = { x: 20, y: kids.length === 0 ? 84 : maxBottom + 24 }
          }
        }

        const kids = parentId ? nodes.filter((nd) => nd.parentId === parentId) : []
        const newNode: FlowNode = {
          id: newId,
          type: "task",
          ...(parentId ? { parentId, extent: "parent" as const, zIndex: 1 } : {}),
          position: position ?? { x: 1560, y: 80 },
          data: taskData,
          selected: true,
        }
        const nextNodes = [...nodes.map((n) => ({ ...n, selected: false })), newNode]
        let nextEdges = edges
        if (kids.length > 0) {
          const last = kids[kids.length - 1]
          nextEdges = [...edges, { id: `e-${newId}`, source: last.id, target: newId, type: "pill", animated: true, data: { label: "next" } }]
        }
        setNodes(nextNodes)
        setEdges(nextEdges)
        pushHistory(nextNodes, nextEdges)
        setSelectedId(newId)
        return
      }

      const maxY = nodes.filter((nd) => !nd.parentId).reduce((m, nd) => Math.max(m, nd.position.y + ((nd.style as { height?: number })?.height ?? 120)), 60)
      const newId = `new-${nodeType}-${n}`
      const data: FlowNodeData =
        nodeType === "tool"
          ? { name: `new_tool_${n}`, progress: "Checking the details…" }
          : nodeType === "workflow"
            ? { name: `new_workflow_${n}`, description: "Describe the workflow.", startPhrase: "", interruptibleBy: [], resumeAfterInterrupt: false, summarizeChatCtx: false }
            : nodeType === "agent"
              ? { title: `agent_definition_${n}.json`, version: 1, workflows: 0, tools: 0, fields: 0 }
              : nodeType === "assistant"
                ? { routing: ["Route each request to the right workflow"], flags: [{ label: "use_agent_definition_instructions", value: true }] }
                : { fields: [] }
      const style = nodeType === "workflow" ? { width: 460, height: 340 } : undefined
      const nextNodes = [
        ...nodes.map((n) => ({ ...n, selected: false })),
        { id: newId, type: nodeType, position: at ?? { x: 1560, y: maxY + 40 }, ...(style ? { style } : {}), data, selected: true },
      ]
      setNodes(nextNodes)
      pushHistory(nextNodes, edges)
      setSelectedId(newId)
    },
    [nodes, selectedId, edges, setNodes, setEdges, pushHistory],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData("application/reactflow")
      if (!raw) return
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addNode(raw as PaletteKind, flowPos, workflowGroupAt(e.clientX, e.clientY))
    },
    [addNode, screenToFlowPosition],
  )

  // Click a palette block -> add at the visible canvas center
  const addAtCenter = useCallback(
    (kind: PaletteKind) => {
      const el = flowBoxRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      addNode(kind, screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }))
    },
    [addNode, screenToFlowPosition],
  )

  // Pick a node from the sidebar outline -> select it, open the editor, center on it
  const selectNodeById = useCallback(
    (id: string) => {
      setSelectedId(id)
      setSelectedEdgeId(null)
      setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === id })))
      const node = nodes.find((n) => n.id === id)
      if (node) {
        const parent = node.parentId ? nodes.find((p) => p.id === node.parentId) : null
        const px = parent?.position.x ?? 0
        const py = parent?.position.y ?? 0
        setCenter(px + node.position.x + (node.measured?.width ?? 100) / 2, py + node.position.y + (node.measured?.height ?? 60) / 2, { zoom: 0.8, duration: 500 })
      }
    },
    [nodes, setNodes, setCenter],
  )

  // Auto-size workflow groups to wrap their child tasks so nothing escapes the box.
  const storeNodes = useStore((s) => s.nodes) as FlowNode[]
  const liveNodesRef = useRef<FlowNode[]>(storeNodes)
  liveNodesRef.current = storeNodes
  const storeEdges = useStore((s) => s.edges) as Edge[]
  const liveEdgesRef = useRef<Edge[]>(storeEdges)
  liveEdgesRef.current = storeEdges
  const preDragRef = useRef<FlowNode[] | null>(null)
  useEffect(() => {
    const changed: FlowNode[] = []
    for (const gn of storeNodes) {
      if (gn.type !== "workflow") continue
      const kids = storeNodes.filter((k) => k.parentId === gn.id)
      if (kids.length === 0 || !kids.some((k) => k.measured?.height)) continue
      let right = 0
      let bottom = 0
      for (const k of kids) {
        right = Math.max(right, k.position.x + (k.measured?.width ?? 0))
        bottom = Math.max(bottom, k.position.y + (k.measured?.height ?? 0))
      }
      const w = Math.max(240, Math.ceil(right) + 40)
      const h = Math.max(140, Math.ceil(bottom) + 76)
      const style = (gn.style ?? {}) as { width?: number; height?: number }
      if (style.width !== w || style.height !== h) {
        changed.push({ ...gn, style: { ...gn.style, width: w, height: h } })
      }
    }
    if (changed.length > 0) {
      setNodes((ns) => ns.map((n) => changed.find((c) => c.id === n.id) ?? n))
    }
  }, [storeNodes, setNodes])

  // Record a history point when a node is actually moved (connection drags fire
  // drag stop events too — those must not create history entries).
  const onNodeDragStart = useCallback(() => {
    preDragRef.current = liveNodesRef.current
  }, [])

  const onNodeDragStop = useCallback(() => {
    const pre = preDragRef.current
    preDragRef.current = null
    if (!pre) return
    const now = liveNodesRef.current
    const moved =
      now.length === pre.length &&
      now.some((n, i) => {
        const p = pre[i]
        return p && n.id === p.id && (p.position.x !== n.position.x || p.position.y !== n.position.y)
      })
    if (moved) pushHistory(now, liveEdgesRef.current)
  }, [pushHistory])

  const openFullscreen = () => {
    setClosing(false)
    setVisible(false)
    setExpanded(true)
    requestAnimationFrame(() => setVisible(true))
    // Fit the whole graph once the full-screen layout has settled.
    setTimeout(() => void fitView({ padding: 0.12, duration: 500 }), 250)
  }

  const scheduleUnmount = () => {
    window.setTimeout(() => {
      setExpanded(false)
      setClosing(false)
      setVisible(false)
      exitScheduledRef.current = false
      // Re-fit the graph once the normal layout has settled.
      window.setTimeout(() => void fitView({ padding: 0.12, duration: 500 }), 150)
    }, 280)
  }

  const finishExit = () => {
    if (exitScheduledRef.current) return
    exitScheduledRef.current = true
    setClosing(true)
    scheduleUnmount()
  }

  const closeFullscreen = () => finishExit()

  // Horizontal panel resizing (Library / Editor). Only active on lg+ rows.
  const startResize = (side: "left" | "right") => (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = side === "left" ? sidebarWidth : editorWidth
    const setW = side === "left" ? setSidebarWidth : setEditorWidth
    const minW = side === "left" ? 200 : 280
    const onMove = (ev: MouseEvent) => {
      const delta = side === "left" ? ev.clientX - startX : startX - ev.clientX
      setW(Math.min(Math.max(startW + delta, minW), 480))
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded])

  // Undo / redo keyboard shortcuts. Ignored while typing in panel inputs so
  // native text-editing undo keeps working.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)
      if (typing || !(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (key === "y") {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo])

  useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [expanded])

  return (
    <div
      ref={canvasRef}
      className={
        expanded
          ? cn(
              "fixed inset-0 z-[99999] flex flex-col bg-slate-50 transition-[opacity,transform] duration-300 ease-out",
              visible && !closing ? "opacity-100 scale-100" : "opacity-0 scale-[0.985]",
            )
          : "flex min-h-full flex-col"
      }
    >
      {expanded && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-600/10 bg-[#0f1f17] px-5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/Logo.png"
              alt="Smart Convo Logo"
              width={32}
              height={32}
              className="pointer-events-none shrink-0 rounded-lg"
              draggable={false}
            />
            <div className="min-w-0">
              <Micro className="text-emerald-200/60">Full screen</Micro>
              <p className="truncate text-sm font-semibold text-white">Agent Definition — End to End</p>
            </div>
          </div>
          <button
            onClick={closeFullscreen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Minimize className="h-3.5 w-3.5" />
            Exit
          </button>
        </div>
      )}

      <div className={expanded ? "flex min-h-0 flex-1 flex-col p-4" : "flex min-h-0 flex-1 flex-col"}>
        {/* Toolbar: legend + actions */}
        <div className="mb-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-1">
          <div className="hidden flex-wrap items-center gap-x-3 gap-y-1.5 md:flex">
            {(
              [
                ["agent", "Agent definition"],
                ["assistant", "Assistant"],
                ["state", "State"],
                ["workflow", "Workflow"],
                ["task", "Task"],
                ["tool", "Tool"],
              ] as [NodeKind, string][]
            ).map(([kind, label]) => (
              <span key={kind} className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ background: COLOR_BY_TYPE[kind] }} />
                {label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span className="h-0.5 w-4 rounded bg-slate-300" style={{ borderTop: "1.5px dashed #cbd5e1" }} />
              dashed = tool call / state
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-1.5 py-px font-mono text-[9px] text-slate-400">run_workflow</span>
              labeled edge
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <div className="relative">
              <button
                onClick={() => setAddOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
              {addOpen && (
                <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {(
                    [
                      ["tool", "New Tool"],
                      ["task", "New Task"],
                      ["workflow", "New Workflow"],
                      ["state-field", "New State Field"],
                    ] as [NodeKind | "state-field", string][]
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => addNode(k)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Plus className="h-3 w-3 text-slate-300" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo (⌘Z)"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (⌘⇧Z)"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Redo2 className="h-3.5 w-3.5" />
              Redo
            </button>
            <button
              onClick={runFitView}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Focus className="h-3.5 w-3.5" />
              Fit view
            </button>
            {!expanded && (
              <button
                onClick={openFullscreen}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <Maximize className="h-3.5 w-3.5" />
                Open
              </button>
            )}
          </div>
        </div>

        <div className={expanded ? "flex min-h-0 flex-1 flex-col gap-3 lg:flex-row" : "flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row"}>
          <FlowSidebar
            nodes={nodes}
            selectedId={selectedId}
            onAdd={addAtCenter}
            onSelect={selectNodeById}
            width={sidebarWidth}
          />
          <div
            onMouseDown={startResize("left")}
            title="Drag to resize"
            className="hidden w-2 shrink-0 cursor-col-resize items-center justify-center lg:flex"
          >
            <div className="h-10 w-1 rounded-full bg-slate-200 transition-colors hover:bg-emerald-300" />
          </div>
          <div
            ref={flowBoxRef}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="min-h-[320px] min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/70 bg-white lg:min-h-0"
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.12 }}
              minZoom={0.15}
              connectionLineStyle={{ stroke: "#94a3b8", strokeWidth: 1.5 }}
              deleteKeyCode={null}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#dbe2ea" />
              <MiniMap
                pannable
                zoomable
                nodeColor={(n) => COLOR_BY_TYPE[(n as FlowNode).type] ?? "#94a3b8"}
                maskColor="rgba(241,245,249,0.75)"
                className="!bg-white"
              />
              <Controls className="!bg-white" />
            </ReactFlow>
          </div>
          <div
            onMouseDown={startResize("right")}
            title="Drag to resize"
            className="hidden w-2 shrink-0 cursor-col-resize items-center justify-center lg:flex"
          >
            <div className="h-10 w-1 rounded-full bg-slate-200 transition-colors hover:bg-emerald-300" />
          </div>
          <EditPanel
            node={selectedNode}
            edge={selectedEdge}
            onPatch={(next) => selectedId && updateNode(selectedId, next)}
            onDelete={deleteSelection}
            onClose={() => {
              setSelectedId(null)
              setSelectedEdgeId(null)
            }}
            width={editorWidth}
          />
        </div>

        {!expanded && (
          <p className="mt-3 shrink-0 px-1 text-[11px] font-light text-slate-400">
            Drag blocks from the left sidebar onto the canvas (or click to add at the center) · click any node or edge to
            edit it · use the Canvas tab to jump to any node · drag between handles to connect · ⌘Z / ⌘⇧Z to undo /
            redo · drag a workflow header to move its whole pipeline. Workflow boxes auto-size to their tasks.
          </p>
        )}
      </div>
    </div>
  )
}

export function HospitalAgentFlow() {
  return (
    <ReactFlowProvider>
      <HospitalAgentInner />
    </ReactFlowProvider>
  )
}
