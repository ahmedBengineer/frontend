"use client"

import { useCallback } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import { cn } from "@/lib/utils"
import { Activity, DollarSign, ShoppingCart, TrendingDown, TrendingUp, Users, type LucideIcon } from "lucide-react"

type MetricNodeData = {
  label: string
  value: string
  delta: string
  up: boolean
  accent: "emerald" | "indigo" | "amber" | "rose"
  icon: "activity" | "users" | "cart" | "dollar"
}

type MetricNode = Node<MetricNodeData, "metric">

const ICONS: Record<MetricNodeData["icon"], LucideIcon> = {
  activity: Activity,
  users: Users,
  cart: ShoppingCart,
  dollar: DollarSign,
}

const ACCENT = {
  emerald: "bg-emerald-50 text-emerald-600",
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
}

// A custom node type. Any node whose `type` is "metric" is rendered by this
// component. Handles (the dots you connect to) are declared explicitly so we
// control exactly which sides of the card act as targets and sources.
function MetricNode({ data, selected }: NodeProps<MetricNode>) {
  const Icon = ICONS[data.icon]
  return (
    <div
      className={cn(
        "w-44 rounded-2xl border bg-white shadow-sm transition-shadow",
        selected ? "border-indigo-300 ring-2 ring-indigo-400" : "border-slate-200",
      )}
    >
      {/* Target handles — connections may arrive from the left or the top */}
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Top} id="top" />

      <div className="flex items-center gap-3 p-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", ACCENT[data.accent])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">{data.label}</p>
          <p className="text-lg font-semibold leading-tight text-slate-900">{data.value}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 px-3 pb-3">
        {data.up ? (
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
        )}
        <span className={cn("text-xs font-medium", data.up ? "text-emerald-600" : "text-rose-600")}>
          {data.delta}
        </span>
        <span className="ml-auto text-[10px] text-slate-400">vs last week</span>
      </div>

      {/* Source handles — connections may leave from the right or the bottom */}
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  )
}

// nodeTypes must be defined outside of the component (or memoized) so the
// reference stays stable across renders.
const nodeTypes = { metric: MetricNode }

const initialNodes: MetricNode[] = [
  { id: "revenue", type: "metric", position: { x: 60, y: 90 }, data: { label: "Revenue", value: "$84.2k", delta: "+12.4%", up: true, accent: "emerald", icon: "dollar" } },
  { id: "users", type: "metric", position: { x: 320, y: 30 }, data: { label: "Active users", value: "12,480", delta: "+8.1%", up: true, accent: "indigo", icon: "users" } },
  { id: "orders", type: "metric", position: { x: 320, y: 210 }, data: { label: "Orders", value: "1,092", delta: "-2.3%", up: false, accent: "amber", icon: "cart" } },
  { id: "acv", type: "metric", position: { x: 580, y: 120 }, data: { label: "Avg. cart value", value: "$77.10", delta: "+3.9%", up: true, accent: "rose", icon: "activity" } },
]

const initialEdges: Edge[] = [
  { id: "e1", source: "revenue", target: "users", sourceHandle: "right", targetHandle: "left", animated: true },
  { id: "e2", source: "revenue", target: "orders", sourceHandle: "bottom", targetHandle: "top", animated: true },
  { id: "e3", source: "users", target: "acv", sourceHandle: "right", targetHandle: "left", animated: true },
  { id: "e4", source: "orders", target: "acv", sourceHandle: "right", targetHandle: "left", animated: true },
]

export function CustomNodes() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#cbd5e1" />
        <MiniMap pannable zoomable nodeColor={() => "#818cf8"} maskColor="rgba(241,245,249,0.75)" className="!bg-white" />
        <Controls className="!bg-white" />
      </ReactFlow>
    </div>
  )
}
