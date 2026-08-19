"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  SelectionMode,
  type Connection,
  type Edge,
  type Node,
  type OnNodeDrag,
  type OnSelectionChangeFunc,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import {
  Braces,
  ClipboardPaste,
  Copy,
  Database,
  GitBranch,
  Hand,
  Keyboard,
  LogOut,
  Maximize2,
  MessageSquare,
  MousePointer2,
  PhoneForwarded,
  Play,
  Redo2,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  AgentJsonObject,
  AgentTool,
  LinearEdge,
  LinearFlow,
  LinearNode as LinearNodeDefinition,
  LinearNodeType,
} from "./types";
import type { WorkflowExecutionState } from "@/lib/workflow-test/contracts";
import { LinearNode, type LinearNodeData } from "./nodes/LinearNode";
import { LinearNodeInspector } from "./inspectors/LinearNodeInspector";
import { JsonInspector } from "./inspectors/JsonInspector";
import {
  copyLinearSelection,
  deleteLinearSelection,
  pasteLinearSelection,
  type LinearCanvasClipboard,
} from "./utils/linearCanvasCommands";

const nodeTypes = { linearNode: LinearNode };
const PALETTE = [
  { type: "start", label: "Start", icon: Play },
  { type: "conversation", label: "Conversation", icon: MessageSquare },
  { type: "function", label: "Function", icon: Braces },
  { type: "logic_split", label: "Logic Split", icon: GitBranch },
  { type: "call_transfer", label: "Call Transfer", icon: PhoneForwarded },
  { type: "end_call", label: "End Call", icon: LogOut },
] satisfies { type: LinearNodeType; label: string; icon: typeof Play }[];

function hasSameSelection(current: string[], next: string[]) {
  if (current.length !== next.length) return false;
  const currentIds = new Set(current);
  return next.every((id) => currentIds.has(id));
}

function defaultNode(type: LinearNodeType, position: { x: number; y: number }, tool?: string): LinearNodeDefinition {
  const base = { type, label: PALETTE.find((item) => item.type === type)?.label, ui: { position } };
  if (type === "conversation") return { ...base, mode: "message", message: "Configure this message." };
  if (type === "function") return { ...base, tool: tool ?? "", arguments: {}, response_mappings: {} };
  if (type === "call_transfer") return { ...base, destination: "", reason: "workflow_transfer" };
  if (type === "end_call") return { ...base, farewell: "Thank you for calling. Goodbye." };
  return base;
}

function flowNodes(
  flow: LinearFlow,
  execution: WorkflowExecutionState | undefined,
  flowId: string,
): Node<LinearNodeData>[] {
  return Object.entries(flow.nodes).map(([nodeId, node], index) => {
    const active =
      execution?.currentWorkflowId === flowId &&
      execution.currentTaskId === nodeId;
    return {
      id: nodeId,
      type: "linearNode",
      position: node.ui?.position ?? { x: 80 + index * 260, y: 220 },
      data: {
        nodeId,
        node,
        active,
        liveSession: Boolean(
          execution?.currentWorkflowId === flowId && execution.currentTaskId,
        ),
      },
      deletable: nodeId !== flow.entry_node_id,
      zIndex: active ? 1000 : 0,
    };
  });
}

function flowEdges(
  flow: LinearFlow,
  execution: WorkflowExecutionState | undefined,
  flowId: string,
): Edge[] {
  return flow.edges.map((edge) => {
    const active = execution?.currentEdgeId === edge.id;
    const liveFlow = Boolean(
      execution?.currentWorkflowId === flowId && execution.currentTaskId,
    );
    return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.source_handle,
    label: edge.label || (edge.default ? "default" : edge.source_handle),
    animated: active,
    selectable: true,
    deletable: true,
    focusable: true,
    interactionWidth: 28,
    ariaLabel: `Connection ${edge.label || edge.id}`,
    style: {
      stroke: active
          ? "#06b6d4"
          : edge.source_handle === "error"
            ? "#ef4444"
            : "hsl(var(--muted-foreground))",
      strokeWidth: active ? 3 : 1.5,
      opacity: liveFlow && !active ? 0.38 : 1,
    },
    labelStyle: { fontSize: 10, fill: "hsl(var(--foreground))" },
    labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.92 },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
    zIndex: active ? 900 : 0,
  };
  });
}

interface HistoryEntry {
  flowId: "main" | "global";
  before: LinearFlow;
  after: LinearFlow;
}

function isFormTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || Boolean(target.closest("input, textarea, select, [contenteditable='true']")))
  );
}

export function LinearWorkflowCanvas({
  jsonObject,
  tools,
  onUpdate,
  onReplaceJson,
  readOnly = false,
  execution,
  autoFollow = true,
  colorMode = "light",
}: {
  jsonObject: AgentJsonObject;
  tools: AgentTool[];
  onUpdate: (updater: (previous: AgentJsonObject) => AgentJsonObject) => void;
  onReplaceJson: (json: AgentJsonObject) => void;
  readOnly?: boolean;
  execution?: WorkflowExecutionState;
  autoFollow?: boolean;
  colorMode?: "light" | "dark";
}) {
  const [flowId, setFlowId] = useState<"main" | "global">("main");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [panel, setPanel] = useState<"node" | "global" | "json" | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [interactionMode, setInteractionMode] = useState<"select" | "pan">(
    "select",
  );
  const [, setHistoryVersion] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const selectedNodeIdRef = useRef(selectedNodeId);
  const panelRef = useRef(panel);
  const palettePlacementCount = useRef(0);
  const lastFollowedNode = useRef<string | null>(null);
  const flowRef = useRef<LinearFlow | undefined>(undefined);
  const historyRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);
  const clipboardRef = useRef<LinearCanvasClipboard | null>(null);
  const pasteCountRef = useRef(1);
  selectedNodeIdRef.current = selectedNodeId;
  panelRef.current = panel;
  const flow = jsonObject.flows?.[flowId];
  const {
    fitView,
    getNode,
    getViewport,
    screenToFlowPosition,
    setCenter,
    zoomIn,
    zoomOut,
  } = useReactFlow();
  const derivedNodes = useMemo(
    () =>
      flow
        ? flowNodes(flow, execution, flowId)
        : [],
    [execution, flow, flowId],
  );
  const derivedEdges = useMemo(
    () =>
      flow ? flowEdges(flow, execution, flowId) : [],
    [execution, flow, flowId],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(derivedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(derivedEdges);

  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);

  useEffect(() => {
    setNodes((current) => {
      const selectedIds = new Set(
        current.filter((node) => node.selected).map((node) => node.id),
      );
      return derivedNodes.map((node) =>
        selectedIds.has(node.id) ? { ...node, selected: true } : node,
      );
    });
    setEdges((current) => {
      const selectedIds = new Set(
        current.filter((edge) => edge.selected).map((edge) => edge.id),
      );
      return derivedEdges.map((edge) =>
        selectedIds.has(edge.id) ? { ...edge, selected: true } : edge,
      );
    });
  }, [derivedEdges, derivedNodes, setEdges, setNodes]);

  useEffect(() => {
    if (!readOnly || !autoFollow) return;
    if (
      execution?.currentWorkflowId === "main" ||
      execution?.currentWorkflowId === "global"
    ) {
      setFlowId(execution.currentWorkflowId);
    }
  }, [autoFollow, execution?.currentWorkflowId, readOnly]);

  useEffect(() => {
    if (
      !readOnly ||
      !autoFollow ||
      !execution?.currentTaskId ||
      execution.currentWorkflowId !== flowId
    ) return;
    const taskId = execution.currentTaskId;
    const followKey = `${flowId}/${taskId}`;
    if (lastFollowedNode.current === followKey) return;
    const frame = window.requestAnimationFrame(() => {
      const activeNode = getNode(taskId);
      if (!activeNode) return;
      const width = activeNode.measured?.width ?? activeNode.width ?? 235;
      const height = activeNode.measured?.height ?? activeNode.height ?? 110;
      const currentZoom = getViewport().zoom;
      lastFollowedNode.current = followKey;
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
    execution?.currentTaskId,
    execution?.currentWorkflowId,
    flowId,
    getNode,
    getViewport,
    readOnly,
    setCenter,
  ]);

  const updateFlow = useCallback(
    (updater: (current: LinearFlow) => LinearFlow) => {
      const current = flowRef.current;
      if (!current) return;
      const next = updater(current);
      if (next === current) return;
      historyRef.current.push({ flowId, before: current, after: next });
      if (historyRef.current.length > 100) historyRef.current.shift();
      futureRef.current = [];
      flowRef.current = next;
      setHistoryVersion((version) => version + 1);
      onUpdate((previous) => ({
        ...previous,
        flows: {
          ...previous.flows!,
          [flowId]: next,
        },
      }));
    },
    [flowId, onUpdate],
  );

  const clearSelection = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    setNodes((current) =>
      current.map((node) =>
        node.selected ? { ...node, selected: false } : node,
      ),
    );
    setEdges((current) =>
      current.map((edge) =>
        edge.selected ? { ...edge, selected: false } : edge,
      ),
    );
    setSelectedNodeId(null);
    setPanel((current) => (current === "node" ? null : current));
  }, [setEdges, setNodes]);

  const applyHistoryEntry = useCallback(
    (entry: HistoryEntry, direction: "undo" | "redo") => {
      const next = direction === "undo" ? entry.before : entry.after;
      flowRef.current = next;
      setFlowId(entry.flowId);
      clearSelection();
      onUpdate((previous) => ({
        ...previous,
        flows: {
          ...previous.flows!,
          [entry.flowId]: next,
        },
      }));
      setHistoryVersion((version) => version + 1);
    },
    [clearSelection, onUpdate],
  );

  const undo = useCallback(() => {
    const entry = historyRef.current.pop();
    if (!entry) return;
    futureRef.current.push(entry);
    applyHistoryEntry(entry, "undo");
  }, [applyHistoryEntry]);

  const redo = useCallback(() => {
    const entry = futureRef.current.pop();
    if (!entry) return;
    historyRef.current.push(entry);
    applyHistoryEntry(entry, "redo");
  }, [applyHistoryEntry]);

  const addNodeAt = useCallback(
    (type: LinearNodeType, position: { x: number; y: number }) => {
      if (!flow || readOnly || (type === "start" && Object.values(flow.nodes).some((node) => node.type === "start"))) return;
      const base = type.replace("_", "");
      let index = 1;
      while (flow.nodes[`${base}_${index}`]) index += 1;
      const nodeId = `${base}_${index}`;
      updateFlow((current) => ({
        ...current,
        nodes: { ...current.nodes, [nodeId]: defaultNode(type, position, tools[0]?.name) },
      }));
      setSelectedNodeIds([nodeId]);
      setSelectedEdgeIds([]);
      setSelectedNodeId(nodeId);
      setPanel("node");
    },
    [flow, readOnly, tools, updateFlow],
  );

  const addNodeFromPalette = useCallback(
    (type: LinearNodeType) => {
      const bounds = canvasRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const placement = palettePlacementCount.current;
      palettePlacementCount.current += 1;
      const angle = placement * 2.399963229728653;
      const radius = placement === 0 ? 0 : 34 + Math.sqrt(placement) * 24;
      addNodeAt(
        type,
        screenToFlowPosition({
          x: bounds.left + bounds.width / 2 + Math.cos(angle) * radius,
          y: bounds.top + bounds.height / 2 + Math.sin(angle) * radius,
        }),
      );
    },
    [addNodeAt, screenToFlowPosition],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !flow) return;
      const sourceNode = flow.nodes[connection.source];
      const id = `edge_${Date.now().toString(36)}`;
      const newEdge: LinearEdge = {
        id,
        source: connection.source,
        target: connection.target,
      };
      if (sourceNode.type === "function") newEdge.source_handle = connection.sourceHandle ?? "success";
      if (sourceNode.type === "call_transfer") newEdge.source_handle = "error";
      if (sourceNode.type === "logic_split") {
        const existing = flow.edges.filter((edge) => edge.source === connection.source);
        if (!existing.some((edge) => edge.default)) newEdge.default = true;
        else {
          const firstState = Object.keys(jsonObject.state?.fields ?? {})[0] ?? "session.global_intent";
          newEdge.condition = { path: firstState, operator: "exists" };
        }
      }
      updateFlow((current) => {
        let edges = current.edges;
        if (sourceNode.type === "start" || sourceNode.type === "conversation") {
          edges = edges.filter((edge) => edge.source !== connection.source);
        }
        if (sourceNode.type === "function") {
          const handle = connection.sourceHandle ?? "success";
          edges = edges.filter(
            (edge) =>
              edge.source !== connection.source ||
              (edge.source_handle ?? "success") !== handle,
          );
        }
        if (sourceNode.type === "call_transfer") {
          edges = edges.filter(
            (edge) =>
              edge.source !== connection.source || edge.source_handle !== "error",
          );
        }
        return { ...current, edges: [...edges, newEdge] };
      });
    },
    [flow, jsonObject.state?.fields, updateFlow],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      updateFlow((current) => {
        if (nodeId === current.entry_node_id) return current;
        return {
          ...current,
          nodes: Object.fromEntries(
            Object.entries(current.nodes).filter(([id]) => id !== nodeId),
          ),
          edges: current.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId,
          ),
        };
      });
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
      setSelectedEdgeIds([]);
      setPanel(null);
    },
    [updateFlow],
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node, draggedNodes) => {
      const movedNodes = draggedNodes?.length ? draggedNodes : [node];
      updateFlow((current) => ({
        ...current,
        nodes: movedNodes.reduce(
          (updated, movedNode) => ({
            ...updated,
            [movedNode.id]: {
              ...updated[movedNode.id],
              ui: {
                ...updated[movedNode.id].ui,
                position: movedNode.position,
              },
            },
          }),
          { ...current.nodes },
        ),
      }));
    },
    [updateFlow],
  );

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      const nodeIds = selectedNodes.map((node) => node.id);
      const edgeIds = selectedEdges.map((edge) => edge.id);
      setSelectedNodeIds((current) =>
        hasSameSelection(current, nodeIds) ? current : nodeIds,
      );
      setSelectedEdgeIds((current) =>
        hasSameSelection(current, edgeIds) ? current : edgeIds,
      );
      const inspectedNodeId = selectedNodeIdRef.current;
      if (inspectedNodeId && !nodeIds.includes(inspectedNodeId)) {
        selectedNodeIdRef.current = null;
        setSelectedNodeId(null);
        if (panelRef.current === "node") {
          panelRef.current = null;
          setPanel(null);
        }
      }
    },
    [],
  );

  const selectAll = useCallback(() => {
    if (!flowRef.current) return;
    setSelectedNodeIds(Object.keys(flowRef.current.nodes));
    setSelectedEdgeIds(flowRef.current.edges.map((edge) => edge.id));
    setNodes((current) =>
      current.map((node) =>
        node.selected ? node : { ...node, selected: true },
      ),
    );
    setEdges((current) =>
      current.map((edge) =>
        edge.selected ? edge : { ...edge, selected: true },
      ),
    );
  }, [setEdges, setNodes]);

  const copySelection = useCallback(() => {
    const current = flowRef.current;
    if (!current) return false;
    const clipboard = copyLinearSelection(current, selectedNodeIds);
    if (!clipboard) return false;
    clipboardRef.current = clipboard;
    pasteCountRef.current = 1;
    setHistoryVersion((version) => version + 1);
    return true;
  }, [selectedNodeIds]);

  const deleteSelection = useCallback(() => {
    if (!selectedNodeIds.length && !selectedEdgeIds.length) return;
    updateFlow((current) =>
      deleteLinearSelection(current, selectedNodeIds, selectedEdgeIds),
    );
    clearSelection();
  }, [clearSelection, selectedEdgeIds, selectedNodeIds, updateFlow]);

  const cutSelection = useCallback(() => {
    if (copySelection()) deleteSelection();
  }, [copySelection, deleteSelection]);

  const pasteSelection = useCallback(() => {
    const current = flowRef.current;
    const clipboard = clipboardRef.current;
    if (!current || !clipboard) return;
    const distance = 40 * pasteCountRef.current;
    const result = pasteLinearSelection(current, clipboard, {
      x: distance,
      y: distance,
    });
    if (!result.nodeIds.length) return;
    pasteCountRef.current += 1;
    updateFlow(() => result.flow);
    setSelectedNodeIds(result.nodeIds);
    setSelectedEdgeIds([]);
    setSelectedNodeId(null);
    setPanel((currentPanel) =>
      currentPanel === "node" ? null : currentPanel,
    );
  }, [updateFlow]);

  const duplicateSelection = useCallback(() => {
    if (copySelection()) pasteSelection();
  }, [copySelection, pasteSelection]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (readOnly || isFormTarget(event.target)) return;
      const command = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (command && key === "a") {
        event.preventDefault();
        selectAll();
      } else if (command && key === "c") {
        event.preventDefault();
        copySelection();
      } else if (command && key === "x") {
        event.preventDefault();
        cutSelection();
      } else if (command && key === "v") {
        event.preventDefault();
        pasteSelection();
      } else if (command && key === "d") {
        event.preventDefault();
        duplicateSelection();
      } else if (command && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (command && key === "y") {
        event.preventDefault();
        redo();
      } else if (command && key === "0") {
        event.preventDefault();
        void fitView({ padding: 0.18, duration: 250 });
      } else if (event.key === "Escape") {
        event.preventDefault();
        clearSelection();
        setShowShortcuts(false);
      } else if (!command && key === "v") {
        event.preventDefault();
        setInteractionMode("select");
      } else if (!command && key === "h") {
        event.preventDefault();
        setInteractionMode("pan");
        clearSelection();
      } else if (!command && key === "f") {
        event.preventDefault();
        void fitView({ padding: 0.18, duration: 250 });
      } else if (!command && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        void zoomIn({ duration: 150 });
      } else if (!command && event.key === "-") {
        event.preventDefault();
        void zoomOut({ duration: 150 });
      }
    },
    [
      clearSelection,
      copySelection,
      cutSelection,
      duplicateSelection,
      fitView,
      pasteSelection,
      readOnly,
      redo,
      selectAll,
      undo,
      zoomIn,
      zoomOut,
    ],
  );

  if (!flow) return <div className="p-6 text-sm text-red-600">Linear flow configuration is missing.</div>;
  const selectedNode = selectedNodeId ? flow.nodes[selectedNodeId] : undefined;
  const selectedEdges = selectedNodeId ? flow.edges.filter((edge) => edge.source === selectedNodeId) : [];

  return (
    <div
      ref={canvasRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onPointerDownCapture={(event) => {
        const target = event.target as HTMLElement;
        if (
          target.closest(
            ".react-flow__pane, .react-flow__node, .react-flow__edge",
          )
        ) {
          canvasRef.current?.focus({ preventScroll: true });
        }
      }}
      className="linear-workflow-canvas relative h-full min-h-0 overflow-hidden bg-slate-50 outline-none dark:bg-slate-950"
    >
      <style>{`
        .linear-workflow-canvas .react-flow__edge.selected .react-flow__edge-path {
          stroke: #0ea5e9 !important;
          stroke-width: 4 !important;
          opacity: 1 !important;
          filter: drop-shadow(0 0 5px rgb(14 165 233 / 0.8));
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        colorMode={colorMode}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onNodeDragStop={readOnly ? undefined : onNodeDragStop}
        onNodeClick={(_event, node) => {
          if (readOnly) return;
          setSelectedNodeId(node.id);
          setPanel("node");
        }}
        onEdgeClick={() => {
          if (readOnly) return;
          setSelectedNodeId(null);
          setPanel((current) => (current === "node" ? null : current));
        }}
        onSelectionChange={onSelectionChange}
        onPaneClick={() => clearSelection()}
        onNodesDelete={(deleted) => {
          updateFlow((current) =>
            deleteLinearSelection(
              current,
              deleted.map((node) => node.id),
              [],
            ),
          );
          clearSelection();
        }}
        onEdgesDelete={(deleted) => {
          updateFlow((current) =>
            deleteLinearSelection(
              current,
              [],
              deleted.map((edge) => edge.id),
            ),
          );
          clearSelection();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          setDropActive(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDropActive(false);
          const type = event.dataTransfer.getData("application/smartconvo-linear-node") as LinearNodeType;
          if (LINEAR_NODE_TYPES.has(type)) addNodeAt(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
        }}
        nodesDraggable={!readOnly && interactionMode === "select"}
        nodesConnectable={!readOnly && interactionMode === "select"}
        nodesFocusable={!readOnly && interactionMode === "select"}
        edgesFocusable={!readOnly && interactionMode === "select"}
        connectOnClick
        deleteKeyCode={["Backspace", "Delete"]}
        elementsSelectable={!readOnly && interactionMode === "select"}
        selectionOnDrag={!readOnly && interactionMode === "select"}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={["Meta", "Control", "Shift"]}
        selectionKeyCode={null}
        panActivationKeyCode="Space"
        panOnDrag={readOnly || interactionMode === "pan" ? true : [1, 2]}
        panOnScroll
        snapToGrid={!readOnly}
        snapGrid={[10, 10]}
        elevateEdgesOnSelect
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="h-full w-full"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
        <Controls
          position="bottom-center"
          showInteractive={false}
          className="!overflow-hidden !rounded-lg !border !border-slate-200 !bg-white !shadow-lg dark:!border-slate-700 dark:!bg-slate-900 [&>button]:!border-slate-200 [&>button]:!bg-white [&>button]:!fill-slate-700 hover:[&>button]:!bg-slate-100 dark:[&>button]:!border-slate-700 dark:[&>button]:!bg-slate-900 dark:[&>button]:!fill-slate-200 dark:hover:[&>button]:!bg-slate-800"
        />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          className="!h-24 !w-40 !rounded-lg !border !border-slate-200 !bg-white !shadow-lg dark:!border-slate-700 dark:!bg-slate-900"
          maskColor="hsl(var(--background) / 0.72)"
          nodeColor={(node) => (node.data.active ? "#06b6d4" : "#d946ef")}
        />
      </ReactFlow>

      {dropActive && !readOnly && (
        <div className="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-cyan-400 bg-cyan-50/70 text-sm font-semibold text-cyan-800 backdrop-blur-[1px] dark:bg-cyan-950/35 dark:text-cyan-200">
          Drop block to place it here
        </div>
      )}

      <div className="nodrag nopan absolute left-4 top-4 z-20 flex rounded-xl border border-slate-200 bg-white/95 p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
        {(["main", "global"] as const).map((id) => (
          <button key={id} type="button" onClick={() => { setFlowId(id); setPanel(null); clearSelection(); }} className={`rounded-lg px-4 py-2 text-xs font-semibold ${flowId === id ? "bg-cyan-500 text-slate-950" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
            {id === "main" ? "Main Flow" : "Global Flow"}
          </button>
        ))}
      </div>

      {!readOnly && (
        <>
          <div
            className="nodrag nopan absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900/95"
            aria-label="Canvas commands"
          >
            <CanvasCommandButton
              label="Select and drag"
              shortcut="V"
              active={interactionMode === "select"}
              onClick={() => setInteractionMode("select")}
              icon={MousePointer2}
            />
            <CanvasCommandButton
              label="Pan canvas"
              shortcut="H"
              active={interactionMode === "pan"}
              onClick={() => {
                setInteractionMode("pan");
                clearSelection();
              }}
              icon={Hand}
            />
            <span className="mx-0.5 h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <CanvasCommandButton
              label="Undo"
              shortcut="Ctrl/Cmd+Z"
              disabled={!historyRef.current.length}
              onClick={undo}
              icon={Undo2}
            />
            <CanvasCommandButton
              label="Redo"
              shortcut="Ctrl/Cmd+Shift+Z"
              disabled={!futureRef.current.length}
              onClick={redo}
              icon={Redo2}
            />
            <span className="mx-0.5 h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <CanvasCommandButton
              label="Copy"
              shortcut="Ctrl/Cmd+C"
              disabled={!selectedNodeIds.some(
                (nodeId) => flow.nodes[nodeId]?.type !== "start",
              )}
              onClick={() => copySelection()}
              icon={Copy}
            />
            <CanvasCommandButton
              label="Paste"
              shortcut="Ctrl/Cmd+V"
              disabled={!clipboardRef.current}
              onClick={pasteSelection}
              icon={ClipboardPaste}
            />
            <CanvasCommandButton
              label="Delete selection"
              shortcut="Delete"
              disabled={!selectedNodeIds.length && !selectedEdgeIds.length}
              onClick={deleteSelection}
              icon={Trash2}
              destructive
            />
            <span className="mx-0.5 h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <CanvasCommandButton
              label="Fit workflow"
              shortcut="F"
              onClick={() => void fitView({ padding: 0.18, duration: 250 })}
              icon={Maximize2}
            />
            <CanvasCommandButton
              label="Keyboard shortcuts"
              shortcut=""
              active={showShortcuts}
              onClick={() => setShowShortcuts((current) => !current)}
              icon={Keyboard}
            />
            {(selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) && (
              <span className="ml-1 rounded-md bg-cyan-100 px-2 py-1 text-[10px] font-semibold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                {selectedNodeIds.length + selectedEdgeIds.length} selected
              </span>
            )}
          </div>
          {showShortcuts && (
            <div className="nodrag nopan absolute left-1/2 top-16 z-30 w-[420px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/98 p-3 text-[10px] text-slate-600 shadow-2xl dark:border-slate-700 dark:bg-slate-900/98 dark:text-slate-300">
              <p className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                Canvas shortcuts
              </p>
              <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
                <Shortcut keys="V / Select mode" action="Select and drag nodes" />
                <Shortcut keys="H / Pan mode" action="Drag the canvas" />
                <Shortcut keys="Drag empty space" action="Box select" />
                <Shortcut keys="Ctrl/Cmd/Shift + click" action="Add to selection" />
                <Shortcut keys="Space or middle drag" action="Pan canvas" />
                <Shortcut keys="Ctrl/Cmd+A" action="Select all" />
                <Shortcut keys="Ctrl/Cmd+C/X/V" action="Copy, cut, paste" />
                <Shortcut keys="Ctrl/Cmd+D" action="Duplicate" />
                <Shortcut keys="Ctrl/Cmd+Z/Y" action="Undo, redo" />
                <Shortcut keys="Delete / Backspace" action="Delete selection" />
                <Shortcut keys="F or Ctrl/Cmd+0" action="Fit workflow" />
                <Shortcut keys="+ / −" action="Zoom" />
                <Shortcut keys="Escape" action="Clear selection" />
                <Shortcut keys="10 px grid" action="Snap while moving" />
              </div>
            </div>
          )}
        </>
      )}

      {!readOnly && (
        <aside className="nodrag nopan nowheel absolute bottom-4 left-4 top-20 z-20 w-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Blocks</p>
          <p className="mb-3 text-[10px] leading-relaxed text-slate-400">Click or drag to add. Connect from card dots or use Connections in the card settings.</p>
          <div className="space-y-1.5">
            {PALETTE.map(({ type, label, icon: Icon }) => {
              const disabled = type === "start" && Object.values(flow.nodes).some((node) => node.type === "start");
              return (
                <button
                  key={type}
                  type="button"
                  disabled={disabled}
                  draggable={!disabled}
                  title={disabled ? "This flow already has a Start block" : `Click to add ${label}, or drag it onto the canvas`}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("application/smartconvo-linear-node", type);
                  }}
                  onDragEnd={() => setDropActive(false)}
                  onClick={() => addNodeFromPalette(type)}
                  className="flex w-full cursor-grab items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50 active:cursor-grabbing dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon className="h-3.5 w-3.5 text-cyan-400" /> {label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-3 dark:border-slate-700">
            <button type="button" aria-pressed={panel === "global"} onClick={() => { setSelectedNodeId(null); setPanel("global"); }} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs transition ${panel === "global" ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}><Database className="h-3.5 w-3.5" /> Global instructions</button>
            <button type="button" aria-pressed={panel === "json"} onClick={() => { setSelectedNodeId(null); setPanel("json"); }} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs transition ${panel === "json" ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}><Braces className="h-3.5 w-3.5" /> Raw JSON</button>
          </div>
        </aside>
      )}

      {!readOnly && panel && (
        <aside className="nodrag nopan nowheel absolute bottom-3 right-3 top-3 z-30 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          <div className="flex h-11 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
            <p className="text-xs font-semibold">{panel === "node" ? selectedNode?.label || selectedNodeId : panel === "global" ? "Global Instructions" : "Workflow JSON"}</p>
            <button type="button" onClick={() => setPanel(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
          </div>
          <div className="h-[calc(100%-44px)]">
            {panel === "node" && selectedNode && selectedNodeId && (
              <LinearNodeInspector
                nodeId={selectedNodeId}
                 node={selectedNode}
                 edges={selectedEdges}
                 allNodes={flow.nodes}
                 stateFields={Object.keys(jsonObject.state?.fields ?? {})}
                 entryNodeId={flow.entry_node_id}
                 tools={tools}
                 onNodeChange={(node) => updateFlow((current) => ({ ...current, nodes: { ...current.nodes, [selectedNodeId]: node } }))}
                 onEdgesChange={(updated) => updateFlow((current) => ({ ...current, edges: [...current.edges.filter((edge) => edge.source !== selectedNodeId), ...updated] }))}
                 onDeleteNode={() => deleteNode(selectedNodeId)}
               />
            )}
            {panel === "global" && (
              <div className="h-full overflow-y-auto p-4">
                <p className="mb-3 text-[11px] text-slate-500">Applied to every conversational block in both flows.</p>
                {(jsonObject.task_defaults?.instructions ?? []).map((instruction, index) => (
                    <div key={index} className="mb-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <Textarea value={instruction} onChange={(event) => onUpdate((previous) => {
                      const instructions = [...(previous.task_defaults?.instructions ?? [])]; instructions[index] = event.target.value;
                      return { ...previous, task_defaults: { ...previous.task_defaults, instructions } };
                    })} className="min-h-20 text-xs" />
                    <button type="button" onClick={() => onUpdate((previous) => ({ ...previous, task_defaults: { ...previous.task_defaults, instructions: (previous.task_defaults?.instructions ?? []).filter((_, itemIndex) => itemIndex !== index) } }))} className="mt-2 text-[10px] text-red-500">Remove</button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => onUpdate((previous) => ({ ...previous, task_defaults: { ...previous.task_defaults, instructions: [...(previous.task_defaults?.instructions ?? []), ""] } }))}>Add instruction</Button>
              </div>
            )}
            {panel === "json" && <div className="h-full p-3"><JsonInspector title="json_object" value={jsonObject} onApply={onReplaceJson} /></div>}
          </div>
        </aside>
      )}
    </div>
  );
}

function CanvasCommandButton({
  label,
  shortcut,
  icon: Icon,
  onClick,
  disabled = false,
  active = false,
  destructive = false,
}: {
  label: string;
  shortcut: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800",
        active && "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
        destructive &&
          "text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function Shortcut({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <kbd className="font-mono text-[9px] text-slate-500 dark:text-slate-400">
        {keys}
      </kbd>
      <span>{action}</span>
    </div>
  );
}

const LINEAR_NODE_TYPES = new Set<LinearNodeType>(PALETTE.map((item) => item.type));
