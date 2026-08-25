"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodesInitialized,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type OnNodeDrag,
  type Connection,
  type Node,
  type OnNodesChange,
} from "@xyflow/react";
import {
  ArrowLeft,
  AlertTriangle,
  Search,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Braces,
  Database,
  X,
  Sparkles,
  Workflow as WorkflowIcon,
  LayoutList,
  GitBranch,
  Code2,
  Maximize2,
  MapPinOff,
  Undo2,
  Redo2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { RouterNode } from "./nodes/RouterNode";
import { WorkflowNode } from "./nodes/WorkflowNode";
import { TaskNode } from "./nodes/TaskNode";
import { TransitionEdge } from "./edges/TransitionEdge";
import { InterruptEdge } from "./edges/InterruptEdge";

import { RouterInspector } from "./inspectors/RouterInspector";
import { WorkflowInspector } from "./inspectors/WorkflowInspector";
import { TaskInspector } from "./inspectors/TaskInspector";
import { VariableInspector } from "./inspectors/VariableInspector";
import { JsonInspector } from "./inspectors/JsonInspector";
import { SupervisorEdgeInspector } from "./inspectors/SupervisorEdgeInspector";
import { StudioActions } from "./StudioActions";

import { buildMainAgentGraph, buildWorkflowGraph } from "./utils/graphBuilder";
import { getWorkflowStats } from "./utils/workflowSelectors";
import {
  validateTaskReferences,
  validateWorkflowDefinition,
  validateWorkflowReferences,
} from "./utils/validation";
import { createTask, removeTask } from "./utils/editorMutations";
import {
  addSupervisorTask,
  connectSupervisorTasks,
  parseSupervisorTaskNodeId,
  removeSupervisorEdge,
  setSupervisorTaskPosition,
} from "./utils/supervisorGraph";

import type { AgentJsonObject, AgentTool, SelectedEntity } from "./types";
import type { SaveMethod } from "./hooks/useAgentDefinition";
import type { WorkflowExecutionState } from "@/lib/workflow-test/contracts";
import {
  clearPositions,
  layoutKey,
  loadPositions,
  savePositions,
  structuralHash,
} from "./utils/layoutStorage";
import {
  getAutoFollowNodeId,
  getAutoFollowView,
} from "./utils/testNavigation";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOLBAR_H = 52; // px — height of the top toolbar panel
const INSPECTOR_W = 460; // px — width of the right inspector panel

// Defined at module scope — must never change identity between renders
const NODE_TYPES = {
  routerNode: RouterNode,
  workflowNode: WorkflowNode,
  taskNode: TaskNode,
};
const EDGE_TYPES = {
  transitionEdge: TransitionEdge,
  interruptEdge: InterruptEdge,
};

// ─── FitViewTrigger ───────────────────────────────────────────────────────────
// Waits until React Flow has measured all nodes, then fits — once per viewKey.

function FitViewTrigger({ viewKey }: { viewKey: string }) {
  const { fitView } = useReactFlow();
  const initialized = useNodesInitialized();
  const fittedKey = useRef<string | null>(null);

  useEffect(() => {
    // Only run once per viewKey, and only after nodes have been measured
    if (!initialized) return;
    if (fittedKey.current === viewKey) return;
    fittedKey.current = viewKey;
    fitView({ duration: 400, padding: 0.22 });
  }, [initialized, viewKey, fitView]);

  return null;
}

// ─── Toolbar panel ────────────────────────────────────────────────────────────

interface ToolbarProps {
  viewMode: "main" | "detail";
  activeWorkflowId: string | null;
  agentName: string;
  agentType: string;
  isDirty: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSave: (m: SaveMethod) => void;
  onReload: () => void;
  onBack: () => void;
  onOpenRawJson: () => void;
  onOpenVariables: () => void;
  onAgentTypeChange: (t: string) => void;
  canSave: boolean;
  readOnly: boolean;
}

function Toolbar(p: ToolbarProps) {
  const [editingType, setEditingType] = useState(false);
  const [typeDraft, setTypeDraft] = useState(p.agentType);
  const st = (() => {
    if (p.isSaving)
      return {
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
        label: "Saving…",
        cls: "text-slate-400",
      };
    if (p.saveError)
      return {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        label: "Failed",
        cls: "text-red-500",
      };
    if (p.saveSuccess)
      return {
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        label: "Saved",
        cls: "text-emerald-600",
      };
    if (p.isDirty)
      return {
        icon: <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />,
        label: "Unsaved",
        cls: "text-amber-600",
      };
    return {
      icon: <CheckCircle className="h-3.5 w-3.5 opacity-25" />,
      label: "Saved",
      cls: "text-slate-400",
    };
  })();

  return (
    <div
      className="nodrag nopan flex h-[52px] w-full items-center gap-2 border-b border-slate-200/80 bg-white/95 px-3 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
      style={{ pointerEvents: "all" }}
    >
      {/* Left — back button OR agent badge */}
      {p.viewMode === "detail" ? (
        <button
          onClick={p.onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">All Workflows</span>
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden max-w-[130px] truncate text-[12px] font-semibold text-slate-800 lg:block">
            {p.agentName || "Agent"}
          </span>
          <span className="hidden text-slate-300 lg:block">·</span>
          {editingType ? (
            <form
              className="flex"
              onSubmit={(e) => {
                e.preventDefault();
                p.onAgentTypeChange(typeDraft);
                setEditingType(false);
              }}
            >
              <input
                value={typeDraft}
                onChange={(e) => setTypeDraft(e.target.value)}
                className="h-6 w-[84px] rounded-md border border-indigo-300 bg-white px-1.5 font-mono text-[10px] outline-none ring-1 ring-indigo-200"
                autoFocus
                onBlur={() => {
                  p.onAgentTypeChange(typeDraft);
                  setEditingType(false);
                }}
              />
            </form>
          ) : (
            <button
              onClick={() => {
                setTypeDraft(p.agentType);
                setEditingType(true);
              }}
              className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600 transition hover:bg-slate-200"
            >
              {p.agentType}
            </button>
          )}
        </div>
      )}

      {/* Workflow name badge (detail view) */}
      {p.viewMode === "detail" && p.activeWorkflowId && (
        <>
          <div className="h-4 w-px shrink-0 bg-slate-200" />
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="font-mono text-[12px] font-bold text-slate-800">
              {p.activeWorkflowId}
            </span>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-600 ring-1 ring-indigo-100">
              workflow
            </span>
          </div>
        </>
      )}

      <div className="mx-0.5 h-4 w-px shrink-0 bg-slate-200" />

      {/* Search */}
      <div className="relative min-w-0 flex-1 max-w-[260px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={p.searchQuery}
          onChange={(e) => p.onSearchChange(e.target.value)}
          placeholder={
            p.viewMode === "detail"
              ? "Search tasks, tools…"
              : "Search workflows, tasks…"
          }
          className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-[11px] outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/* Save status */}
        <div
          className={cn(
            "hidden items-center gap-1.5 pr-1 text-[11px] font-medium sm:flex",
            st.cls,
          )}
        >
          {st.icon}
          <span>{st.label}</span>
        </div>

        <div className="mx-0.5 hidden h-4 w-px bg-slate-200 sm:block" />

        {/* Icon row */}
        {[
          {
            icon: <Database className="h-3.5 w-3.5" />,
            label: "Variables",
            action: p.onOpenVariables,
          },
          {
            icon: <Braces className="h-3.5 w-3.5" />,
            label: "Raw JSON",
            action: p.onOpenRawJson,
          },
          {
            icon: <RotateCcw className="h-3.5 w-3.5" />,
            label: "Reload",
            action: p.onReload,
          },
        ].map(({ icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            title={label}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            {icon}
          </button>
        ))}

        <div className="mx-0.5 hidden h-4 w-px bg-slate-200 sm:block" />

        <div className="flex items-center">
          <button
            disabled={p.isSaving || !p.isDirty || !p.canSave || p.readOnly}
            onClick={() => p.onSave("PATCH")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold transition",
              p.isDirty && !p.isSaving && p.canSave && !p.readOnly
                ? "bg-slate-900 text-white hover:bg-slate-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inspector panel ──────────────────────────────────────────────────────────

const ENTITY_META: Record<
  string,
  { label: string; icon: React.ElementType; bar: string }
> = {
  router: { label: "Router", icon: Sparkles, bar: "bg-teal-500" },
  workflow: { label: "Workflow", icon: WorkflowIcon, bar: "bg-indigo-500" },
  task: { label: "Task", icon: LayoutList, bar: "bg-violet-500" },
  variable: { label: "State Variables", icon: Database, bar: "bg-purple-500" },
  json: { label: "Raw JSON", icon: Code2, bar: "bg-slate-700" },
  edge: { label: "Transition", icon: GitBranch, bar: "bg-sky-500" },
};

interface InspectorProps {
  open: boolean;
  entity: SelectedEntity | null;
  jsonObject: AgentJsonObject;
  onClose: () => void;
  onUpdate: (updater: (prev: AgentJsonObject) => AgentJsonObject) => void;
  onReplaceJson: (json: AgentJsonObject) => void;
  availableTools: AgentTool[];
  includeDefaultTools: boolean;
  defaultToolNames: string[];
  onDefaultToolsChange: (enabled: boolean, names: string[]) => void;
}

function InspectorPanel({
  open,
  entity,
  jsonObject,
  onClose,
  onUpdate,
  onReplaceJson,
  availableTools,
  includeDefaultTools,
  defaultToolNames,
  onDefaultToolsChange,
}: InspectorProps) {
  const meta = entity
    ? (ENTITY_META[entity.type] ?? ENTITY_META.json)
    : ENTITY_META.json;
  const Icon = meta.icon;

  const title = (() => {
    if (!entity) return "";
    if (entity.type === "task") return entity.taskId ?? "Task";
    if (entity.type === "edge") return entity.edgeId ?? "Transition";
    if (entity.type === "workflow") return entity.workflowId ?? "Workflow";
    if (entity.type === "router") {
      const routingCount =
        jsonObject.assistant?.routing_instructions?.length ?? 0;
      const commonCount = jsonObject.task_defaults?.instructions?.length ?? 0;
      return `Router · ${routingCount} routing · ${commonCount} common`;
    }
    return meta.label;
  })();

  return (
    <div
      className={cn(
        "nodrag nopan flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 dark:border-slate-700 dark:bg-slate-950",
        open
          ? "opacity-100 translate-x-0"
          : "pointer-events-none opacity-0 translate-x-8",
      )}
      style={{
        width: INSPECTOR_W,
        height: "100%",
        pointerEvents: open ? "all" : "none",
      }}
    >
      {/* Header */}
      <div className="relative flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3.5">
        <div
          className={cn(
            "absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full",
            meta.bar,
          )}
        />
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-3.5 w-3.5 text-slate-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-slate-900">
            {title}
          </p>
          {entity?.type === "task" && entity.workflowId && (
            <p className="text-[10px] text-slate-400">{entity.workflowId}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {entity?.type === "router" && jsonObject.assistant && (
          <RouterInspector
            assistant={jsonObject.assistant}
            taskDefaults={jsonObject.task_defaults}
            onUpdate={onUpdate}
            focusTab={
              entity.inspectorTab === "routing" ||
              entity.inspectorTab === "global" ||
              entity.inspectorTab === "tools"
                ? entity.inspectorTab
                : undefined
            }
            focusRequestId={entity.inspectorRequestId}
            includeDefaultTools={includeDefaultTools}
            defaultToolNames={defaultToolNames}
            onDefaultToolsChange={onDefaultToolsChange}
          />
        )}
        {entity?.type === "workflow" &&
          entity.workflowId &&
          jsonObject.workflows?.[entity.workflowId] && (
            <WorkflowInspector
              workflowId={entity.workflowId}
              workflow={jsonObject.workflows[entity.workflowId]}
              jsonObject={jsonObject}
              onUpdate={onUpdate}
            />
          )}
        {entity?.type === "task" &&
          entity.workflowId &&
          entity.taskId &&
          jsonObject.workflows?.[entity.workflowId]?.task_group?.[
            entity.taskId
          ] && (
            <TaskInspector
              taskId={entity.taskId}
              workflowId={entity.workflowId}
              task={
                jsonObject.workflows[entity.workflowId].task_group[
                  entity.taskId
                ]
              }
              jsonObject={jsonObject}
              availableTools={availableTools}
              onUpdate={onUpdate}
              focusTab={
                entity.inspectorTab === "instructions"
                  ? "instructions"
                  : undefined
              }
              focusRequestId={entity.inspectorRequestId}
            />
          )}
        {entity?.type === "edge" &&
          entity.workflowId &&
          entity.edgeId && (
            <SupervisorEdgeInspector
              workflowId={entity.workflowId}
              edgeId={entity.edgeId}
              jsonObject={jsonObject}
              onUpdate={onUpdate}
            />
          )}
        {entity?.type === "variable" && (
          <div className="h-full overflow-y-auto px-5 py-4">
            <VariableInspector jsonObject={jsonObject} onUpdate={onUpdate} />
          </div>
        )}
        {entity?.type === "json" && (
          <div className="h-full p-4">
            <JsonInspector
              title="json_object"
              value={jsonObject}
              onApply={onReplaceJson}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Warnings banner ──────────────────────────────────────────────────────────

function WarningsBanner({ messages }: { messages: string[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || messages.length === 0) return null;
  return (
    <div
      className="nodrag nopan flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 shadow-sm backdrop-blur-sm"
      style={{ pointerEvents: "all", maxWidth: 560 }}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1 space-y-0.5">
        {messages.map((m, i) => (
          <p key={i} className="text-[11px] text-amber-700">
            {m}
          </p>
        ))}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-amber-400 transition hover:text-amber-600"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Workflow detail stats bar ─────────────────────────────────────────────────

function DetailStats({
  workflowId,
  jsonObject,
}: {
  workflowId: string;
  jsonObject: AgentJsonObject;
}) {
  const workflow = jsonObject.workflows?.[workflowId];
  if (!workflow) return null;
  const stats = getWorkflowStats(workflow, jsonObject);
  return (
    <div
      className="nodrag nopan flex flex-wrap items-center gap-3 text-[11px]"
      style={{ pointerEvents: "all" }}
    >
      <span className="text-slate-500">
        <b className="text-slate-700">{stats.taskCount}</b> tasks
      </span>
      <span className="text-slate-500">
        <b className="text-amber-600">{stats.toolCount}</b> tools
      </span>
      <span className="text-slate-500">
        <b className="text-violet-600">{stats.variableCount}</b> vars
      </span>
      {stats.resumeAfterInterrupt && (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-100">
          resume ✓
        </span>
      )}
      {stats.interruptibleBy.length > 0 && (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 ring-1 ring-amber-100">
          interruptible
        </span>
      )}
    </div>
  );
}

type PaletteTaskKind = "collect" | "action" | "answer";

function TaskPalette({
  disabledKinds,
  onCreate,
}: {
  disabledKinds: PaletteTaskKind[];
  onCreate: (kind: PaletteTaskKind) => void;
}) {
  return (
    <div
      className="nodrag nopan flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm"
      style={{ pointerEvents: "all" }}
      aria-label="Task palette"
    >
      {(["collect", "action", "answer"] as PaletteTaskKind[]).map((kind) => {
        const disabled = disabledKinds.includes(kind);
        return (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            draggable={!disabled}
            onDragStart={(event) => {
              event.dataTransfer.setData("application/smartconvo-task-kind", kind);
              event.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => onCreate(kind)}
            className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold capitalize text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            title={`Click or drag to create a ${kind} task`}
          >
            <Plus className="h-3.5 w-3.5" /> {kind}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main WorkflowCanvas component ───────────────────────────────────────────

export interface WorkflowCanvasProps {
  agentId: number;
  jsonObject: AgentJsonObject;
  availableTools: AgentTool[];
  includeDefaultTools: boolean;
  defaultToolNames: string[];
  onDefaultToolsChange: (enabled: boolean, names: string[]) => void;
  agentName: string;
  agentType: string;
  isDirty: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  onSave: (m: SaveMethod) => void;
  onReload: () => void;
  onUpdate: (updater: (prev: AgentJsonObject) => AgentJsonObject) => void;
  onReplaceJson: (json: AgentJsonObject) => void;
  onAgentTypeChange: (t: string) => void;
  validationErrorCount?: number;
  readOnly?: boolean;
  execution?: WorkflowExecutionState;
  autoFollow?: boolean;
}

export function WorkflowCanvas({
  agentId,
  jsonObject,
  availableTools,
  includeDefaultTools,
  defaultToolNames,
  onDefaultToolsChange,
  agentName,
  agentType,
  isDirty,
  isSaving,
  saveSuccess,
  saveError,
  onSave,
  onReload,
  onUpdate,
  onReplaceJson,
  onAgentTypeChange,
  validationErrorCount = 0,
  readOnly = false,
  execution,
  autoFollow = true,
}: WorkflowCanvasProps) {
  // ── View state ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"main" | "detail">("main");
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  // ── Inspector state ─────────────────────────────────────────────────────────
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(
    null,
  );
  const inspectorRequestId = useRef(0);

  // ── Search ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const { fitView, getNode, getViewport, setCenter, screenToFlowPosition } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const lastFollowedNode = useRef<string | null>(null);
  const lastAutoOpenedWorkflow = useRef<string | null>(null);
  const layoutHash = useMemo(() => structuralHash(jsonObject), [jsonObject]);
  const storageKey = useMemo(
    () =>
      layoutKey(
        agentId,
        layoutHash,
        `${viewMode}:${activeWorkflowId ?? "main"}`,
      ),
    [activeWorkflowId, agentId, layoutHash, viewMode],
  );
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoStack = useRef<AgentJsonObject[]>([]);
  const redoStack = useRef<AgentJsonObject[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const applyUpdate = useCallback(
    (updater: (previous: AgentJsonObject) => AgentJsonObject) => {
      onUpdate((previous) => {
        const next = updater(previous);
        if (next === previous) return previous;
        undoStack.current.push(structuredClone(previous));
        if (undoStack.current.length > 50) undoStack.current.shift();
        redoStack.current = [];
        setHistoryVersion((value) => value + 1);
        return next;
      });
    },
    [onUpdate],
  );

  const undo = useCallback(() => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(structuredClone(jsonObject));
    onReplaceJson(previous);
    setHistoryVersion((value) => value + 1);
  }, [jsonObject, onReplaceJson]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(structuredClone(jsonObject));
    onReplaceJson(next);
    setHistoryVersion((value) => value + 1);
  }, [jsonObject, onReplaceJson]);

  // ── Derived nodes/edges ─────────────────────────────────────────────────────
  const { nodes: derivedNodes, edges: derivedEdges } = useMemo(() => {
    if (viewMode === "detail" && activeWorkflowId) {
      return buildWorkflowGraph(jsonObject, activeWorkflowId);
    }
    return buildMainAgentGraph(jsonObject);
  }, [jsonObject, viewMode, activeWorkflowId]);

  // ── React Flow state ────────────────────────────────────────────────────────
  const [flowNodes, setNodes, onNodesChange] = useNodesState<Node>(
    derivedNodes.map((n) => ({ ...n, draggable: true })),
  );
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(derivedEdges);

  // Sync nodes when JSON changes — preserve user-moved positions
  useEffect(() => {
    setNodes((prev) => {
      const stored = loadPositions(storageKey);
      const posMap = new Map(prev.map((n) => [n.id, n.position]));
      return derivedNodes.map((n) => {
        const base = {
          ...n,
          draggable: !readOnly,
          position: stored[n.id] ?? posMap.get(n.id) ?? n.position,
        };
        if (n.type === "taskNode") {
          const d = n.data as { taskId: string; workflowId: string };
          return {
            ...base,
            data: {
              ...n.data,
              onSelect: () =>
                openInspector({
                  type: "task",
                  workflowId: d.workflowId,
                  taskId: d.taskId,
                }),
              onOpenInstructions: () =>
                openInspector(
                  {
                    type: "task",
                    workflowId: d.workflowId,
                    taskId: d.taskId,
                  },
                  "instructions",
                ),
            },
          };
        }
        return base;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedNodes, readOnly, storageKey]);

  useEffect(() => {
    if (!flowNodes.length) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      savePositions(
        storageKey,
        Object.fromEntries(flowNodes.map((node) => [node.id, node.position])),
      );
    }, 200);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [flowNodes, storageKey]);

  useEffect(() => {
    setEdges(derivedEdges);
  }, [derivedEdges, setEdges]);

  // ── Callbacks ───────────────────────────────────────────────────────────────
  const openInspector = useCallback(
    (
      entity: SelectedEntity,
      inspectorTab?: SelectedEntity["inspectorTab"],
    ) => {
      if (readOnly) return;
      inspectorRequestId.current += 1;
      setSelectedEntity({
        ...entity,
        inspectorTab,
        inspectorRequestId: inspectorRequestId.current,
      });
      setInspectorOpen(true);
    },
    [readOnly],
  );

  const openWorkflow = useCallback((workflowId: string) => {
    setActiveWorkflowId(workflowId);
    setViewMode("detail");
    setInspectorOpen(false);
  }, []);

  const goBack = useCallback(() => {
    if (readOnly) {
      lastAutoOpenedWorkflow.current = execution?.currentWorkflowId ?? null;
    }
    setViewMode("main");
    setActiveWorkflowId(null);
    setInspectorOpen(false);
  }, [execution?.currentWorkflowId, readOnly]);

  // Inject per-node callbacks
  const nodesWithCallbacks: Node[] = useMemo(
    () =>
      flowNodes.map((node) => {
        if (node.type === "routerNode") {
          const executionStatus = execution?.routerStatus ?? "idle";
          return {
            ...node,
            zIndex: executionStatus === "active" ? 1000 : node.zIndex,
            data: {
              ...node.data,
              onOpenInstructions: () =>
                openInspector({ type: "router" }, "routing"),
              onOpenGlobalInstructions: () =>
                openInspector({ type: "router" }, "global"),
              onOpenDefaultTools: () =>
                openInspector({ type: "router" }, "tools"),
              defaultToolCount: includeDefaultTools
                ? defaultToolNames.length
                : 0,
              executionStatus,
            },
          };
        }
        if (node.type === "workflowNode") {
          const wfId = (node.data as { workflowId: string }).workflowId;
          const executionStatus = execution?.workflowStatuses[wfId] ?? "idle";
          return {
            ...node,
            zIndex: executionStatus === "active" ? 1000 : node.zIndex,
            data: {
              ...node.data,
              onOpen: () => openWorkflow(wfId),
              executionStatus,
            },
          };
        }
        if (node.type === "taskNode") {
          const data = node.data as { workflowId: string; taskId: string };
          const toolStatuses = Object.fromEntries(
            Object.entries(execution?.toolStatuses ?? {})
              .filter(([key]) =>
                key.startsWith(`${data.workflowId}/${data.taskId}/`),
              )
              .map(([key, status]) => [
                key.split("/").slice(2).join("/"),
                status,
              ]),
          );
          const executionStatus =
            execution?.taskStatuses[`${data.workflowId}/${data.taskId}`] ??
            "idle";
          return {
            ...node,
            zIndex: executionStatus === "active" ? 1000 : node.zIndex,
            data: {
              ...node.data,
              executionStatus,
              toolStatuses,
              updatedStateFields:
                execution?.updatedStateFields[
                  `${data.workflowId}/${data.taskId}`
                ] ?? [],
              stateValues:
                execution?.latestStateValues ?? {},
              toolCalls: execution?.toolCalls.filter(
                (call) =>
                  call.workflowId === data.workflowId &&
                  call.taskId === data.taskId,
              ),
            },
          };
        }
        return node;
      }),
    [
      defaultToolNames.length,
      execution,
      flowNodes,
      includeDefaultTools,
      openInspector,
      openWorkflow,
    ],
  );

  const autoFollowNodeId = getAutoFollowNodeId({
    viewMode,
    activeWorkflowId,
    currentWorkflowId: execution?.currentWorkflowId ?? null,
    currentTaskId: execution?.currentTaskId ?? null,
  });

  useEffect(() => {
    if (!readOnly || !autoFollow || !nodesInitialized || !autoFollowNodeId) {
      if (!autoFollow) lastFollowedNode.current = null;
      return;
    }
    if (lastFollowedNode.current === autoFollowNodeId) return;
    const frame = window.requestAnimationFrame(() => {
      const activeNode = getNode(autoFollowNodeId);
      if (!activeNode) return;
      const width = activeNode.measured?.width ?? activeNode.width ?? 270;
      const height = activeNode.measured?.height ?? activeNode.height ?? 160;
      const currentZoom = getViewport().zoom;
      lastFollowedNode.current = autoFollowNodeId;
      void setCenter(
        activeNode.position.x + width / 2,
        activeNode.position.y + height / 2,
        {
          duration: 500,
          zoom: Math.max(0.85, Math.min(currentZoom, 1.1)),
        },
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    autoFollow,
    autoFollowNodeId,
    getNode,
    getViewport,
    nodesInitialized,
    readOnly,
    setCenter,
  ]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      if (node.type === "routerNode") {
        openInspector({ type: "router" });
      } else if (node.type === "workflowNode") {
        const wfId = (node.data as { workflowId: string }).workflowId;
        openInspector({ type: "workflow", workflowId: wfId });
      } else if (node.type === "taskNode") {
        const d = node.data as { taskId: string; workflowId: string };
        openInspector({
          type: "task",
          workflowId: d.workflowId,
          taskId: d.taskId,
        });
      }
    },
    [openInspector],
  );

  useEffect(() => {
    if (!readOnly || !autoFollow) return;
    const currentWorkflowId = execution?.currentWorkflowId ?? null;
    const target = getAutoFollowView({
      currentWorkflowId,
      availableWorkflowIds: Object.keys(jsonObject.workflows ?? {}),
      routerActive: execution?.routerStatus === "active",
    });
    if (!target) return;
    if (target.viewMode === "main") {
      lastAutoOpenedWorkflow.current = null;
      if (viewMode !== "main" || activeWorkflowId !== null) {
        setViewMode("main");
        setActiveWorkflowId(null);
        setInspectorOpen(false);
      }
      return;
    }
    if (lastAutoOpenedWorkflow.current === currentWorkflowId) return;
    lastAutoOpenedWorkflow.current = currentWorkflowId;
    setViewMode("detail");
    setActiveWorkflowId(currentWorkflowId);
    setInspectorOpen(false);
    lastFollowedNode.current = null;
  }, [
    activeWorkflowId,
    autoFollow,
    execution?.currentWorkflowId,
    execution?.routerStatus,
    jsonObject.workflows,
    readOnly,
    viewMode,
  ]);

  const createPaletteTask = useCallback(
    (kind: PaletteTaskKind, position?: { x: number; y: number }) => {
      if (!activeWorkflowId) return;
      try {
        const workflow = jsonObject.workflows?.[activeWorkflowId];
        if (!workflow) return;
        let suffix = 1;
        let taskId = `${kind}_${suffix}`;
        while (workflow.task_group[taskId]) taskId = `${kind}_${++suffix}`;
        const task = createTask(kind, {
          description: `New ${kind} task`,
          stateField: Object.keys(jsonObject.state?.fields ?? {})[0],
          toolName: availableTools[0]?.name,
        });
        const fallbackPosition = {
          x: 60 + (workflow.task_order.length % 3) * 320,
          y: 60 + Math.floor(workflow.task_order.length / 3) * 280,
        };
        applyUpdate((current) =>
          addSupervisorTask(
            current,
            activeWorkflowId,
            taskId,
            task,
            position ?? fallbackPosition,
          ),
        );
        setMutationError(null);
        openInspector({ type: "task", workflowId: activeWorkflowId, taskId });
      } catch (reason) {
        setMutationError(reason instanceof Error ? reason.message : "Could not create task");
      }
    },
    [activeWorkflowId, applyUpdate, availableTools, jsonObject, openInspector],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const source = connection.source ? parseSupervisorTaskNodeId(connection.source) : null;
      const target = connection.target ? parseSupervisorTaskNodeId(connection.target) : null;
      if (!source || !target || source.workflowId !== target.workflowId) return;
      try {
        applyUpdate((current) =>
          connectSupervisorTasks(
            current,
            source.workflowId,
            source.taskId,
            target.taskId,
            Object.keys(current.state?.fields ?? {})[0],
          ),
        );
        setMutationError(null);
      } catch (reason) {
        setMutationError(reason instanceof Error ? reason.message : "Could not connect tasks");
      }
    },
    [applyUpdate],
  );

  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      const parsed = parseSupervisorTaskNodeId(node.id);
      if (!parsed) return;
      applyUpdate((current) =>
        setSupervisorTaskPosition(current, parsed.workflowId, parsed.taskId, node.position),
      );
    },
    [applyUpdate],
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      if (!activeWorkflowId || !jsonObject.workflows?.[activeWorkflowId]?.task_edges) return;
      openInspector({ type: "edge", workflowId: activeWorkflowId, edgeId: edge.id });
    },
    [activeWorkflowId, jsonObject.workflows, openInspector],
  );

  const handleNodesDelete = useCallback(
    (nodes: Node[]) => {
      if (!activeWorkflowId) return;
      try {
        applyUpdate((current) =>
          nodes.reduce((next, node) => {
            const parsed = parseSupervisorTaskNodeId(node.id);
            return parsed ? removeTask(next, parsed.workflowId, parsed.taskId) : next;
          }, current),
        );
        setInspectorOpen(false);
      } catch (reason) {
        setMutationError(reason instanceof Error ? reason.message : "Could not delete task");
      }
    },
    [activeWorkflowId, applyUpdate],
  );

  const handleEdgesDelete = useCallback(
    (edges: { id: string }[]) => {
      if (!activeWorkflowId) return;
      applyUpdate((current) =>
        edges.reduce(
          (next, edge) => removeSupervisorEdge(next, activeWorkflowId, edge.id),
          current,
        ),
      );
      setInspectorOpen(false);
    },
    [activeWorkflowId, applyUpdate],
  );

  // ── Warnings ────────────────────────────────────────────────────────────────
  const warningMessages = useMemo(() => {
    const all = validateWorkflowReferences(jsonObject);
    if (viewMode === "detail" && activeWorkflowId) {
      all.push(...validateTaskReferences(activeWorkflowId, jsonObject));
    }
    const definition = validateWorkflowDefinition(
      jsonObject,
      availableTools.map((tool) => tool.name),
    );
    all.push(...definition.errors);
    return [...new Set([...(mutationError ? [mutationError] : []), ...all.map((w) => w.message)])];
  }, [jsonObject, viewMode, activeWorkflowId, availableTools, mutationError]);

  // Key that drives FitViewTrigger — change on view switch
  const viewKey = `${viewMode}:${activeWorkflowId ?? "main"}`;

  // ── Inspector offsets ────────────────────────────────────────────────────────
  // Panel position="top-right" puts it at right:0, top:0 with margin:15px
  // We override to stick it to the right edge below the toolbar
  const inspectorPanelStyle: React.CSSProperties = {
    top: TOOLBAR_H,
    right: 0,
    bottom: 0,
    margin: 0,
    height: `calc(100% - ${TOOLBAR_H}px)`,
    padding: "10px 10px 10px 0",
    pointerEvents: "none",
  };

  const edgesWithExecution = flowEdges.map((edge) => ({
    ...edge,
    data: { ...edge.data, active: execution?.currentEdgeId === edge.id },
  }));

  return (
    <ReactFlow
      nodes={nodesWithCallbacks}
      edges={edgesWithExecution}
      onNodesChange={onNodesChange as OnNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onEdgeClick={handleEdgeClick}
      onNodeDragStop={handleNodeDragStop}
      onConnect={handleConnect}
      onNodesDelete={handleNodesDelete}
      onEdgesDelete={handleEdgesDelete}
      onDragOver={(event) => {
        if (viewMode !== "detail" || readOnly) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        if (viewMode !== "detail" || readOnly) return;
        event.preventDefault();
        const kind = event.dataTransfer.getData("application/smartconvo-task-kind");
        if (["collect", "action", "answer"].includes(kind))
          createPaletteTask(kind as PaletteTaskKind, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
      }}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly && viewMode === "detail"}
      deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      className="h-full w-full bg-slate-50 dark:bg-slate-950"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1.2}
        color="#d1d5db"
      />

      <Controls
        position="bottom-left"
        showInteractive={false}
        className="!bottom-4 !left-4"
      />

      <MiniMap
        position="bottom-right"
        className="!bottom-4 !right-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
        style={{ width: 144, height: 90 }}
        nodeColor={(n) => {
          if (n.type === "routerNode") return "#14b8a6";
          if (n.type === "workflowNode") return "#818cf8";
          if (n.type === "taskNode") return "#a78bfa";
          return "#cbd5e1";
        }}
        pannable
        zoomable
      />

      {/* Fit view whenever viewMode/activeWorkflowId changes */}
      <FitViewTrigger viewKey={viewKey} />

      {/* ── Toolbar — full-width top panel ───────────────────────────────── */}
      {!readOnly && (
        <Panel
          position="top-left"
          style={{ left: 0, right: 0, top: 0, margin: 0, padding: 0 }}
        >
          <Toolbar
            viewMode={viewMode}
            activeWorkflowId={activeWorkflowId}
            agentName={agentName}
            agentType={agentType}
            isDirty={isDirty}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            saveError={saveError}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSave={onSave}
            onReload={onReload}
            onBack={goBack}
            onOpenRawJson={() => openInspector({ type: "json" })}
            onOpenVariables={() => openInspector({ type: "variable" })}
            onAgentTypeChange={onAgentTypeChange}
            canSave={validationErrorCount === 0}
            readOnly={readOnly}
          />
        </Panel>
      )}

      {!readOnly && (
        <Panel
          position="top-left"
          style={{ top: TOOLBAR_H + 10, left: 12, margin: 0 }}
        >
          <div className="nodrag nopan" style={{ pointerEvents: "all" }}>
            <StudioActions
              jsonObject={jsonObject}
              tools={availableTools}
              onUpdate={applyUpdate}
            />
          </div>
        </Panel>
      )}

      {/* ── Workflow detail stats (below toolbar, top-left) ────────────── */}
      {viewMode === "detail" && activeWorkflowId && (
        <Panel
          position="top-left"
          style={{ top: (readOnly ? 0 : TOOLBAR_H) + 54, left: 12, margin: 0 }}
        >
          <DetailStats workflowId={activeWorkflowId} jsonObject={jsonObject} />
        </Panel>
      )}

      {readOnly && viewMode === "detail" && (
        <Panel position="top-left" style={{ top: 12, left: 12, margin: 0 }}>
          <button
            type="button"
            onClick={goBack}
            className="nodrag nopan flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200"
            style={{ pointerEvents: "all" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Workflows
          </button>
        </Panel>
      )}

      {!readOnly && viewMode === "detail" && activeWorkflowId && (
        <Panel
          position="top-left"
          style={{ top: TOOLBAR_H + 92, left: 12, margin: 0 }}
        >
          <TaskPalette
            disabledKinds={[
              ...(Object.keys(jsonObject.state?.fields ?? {}).length ? [] : ["collect" as const]),
              ...(availableTools.length ? [] : ["action" as const, "answer" as const]),
            ]}
            onCreate={(kind) => createPaletteTask(kind)}
          />
        </Panel>
      )}

      {/* ── Validation warnings (below toolbar, centered) ─────────────── */}
      {warningMessages.length > 0 && (
        <Panel position="top-center" style={{ top: TOOLBAR_H + 10, margin: 0 }}>
          <WarningsBanner messages={warningMessages} />
        </Panel>
      )}

      {/* ── Inspector — right-side panel ──────────────────────────────── */}
      {!readOnly && (
        <Panel position="top-right" style={inspectorPanelStyle}>
          <InspectorPanel
            open={inspectorOpen}
            entity={selectedEntity}
            jsonObject={jsonObject}
            onClose={() => setInspectorOpen(false)}
            onUpdate={applyUpdate}
            onReplaceJson={onReplaceJson}
            availableTools={availableTools}
            includeDefaultTools={includeDefaultTools}
            defaultToolNames={defaultToolNames}
            onDefaultToolsChange={onDefaultToolsChange}
          />
        </Panel>
      )}

      <Panel position="bottom-center">
        <div
          className="nodrag nopan flex gap-1 rounded-xl border bg-white/95 p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900/95"
          style={{ pointerEvents: "all" }}
        >
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => void fitView({ duration: 300, padding: 0.22 })}
            title="Fit view"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          {!readOnly && (
            <>
              <button
                type="button"
                disabled={!undoStack.current.length}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                onClick={undo}
                title={`Undo (${historyVersion})`}
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!redoStack.current.length}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                onClick={redo}
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </>
          )}
          {!readOnly && (
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => {
                clearPositions(storageKey);
                setNodes(
                  derivedNodes.map((node) => ({ ...node, draggable: true })),
                );
                void fitView({ duration: 300, padding: 0.22 });
              }}
              title="Reset layout"
            >
              <MapPinOff className="h-4 w-4" />
            </button>
          )}
        </div>
      </Panel>
    </ReactFlow>
  );
}
