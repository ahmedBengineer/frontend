"use client"

import { useCallback } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
} from "@xyflow/react"

// A custom edge type. Edges are just React components that receive the computed
// geometry of the connection. Here we render the standard smooth bezier path via
// BaseEdge and additionally draw a floating label with EdgeLabelRenderer.
// EdgeLabelRenderer renders into a top layer above the canvas so the label is
// never clipped by the viewport — the `nodrag` / `nopan` classes let clicks
// pass straight through to the underlying graph.
function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {(data as { label?: string })?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

// edgeTypes works exactly like nodeTypes — a map of type -> component.
const edgeTypes = { labeled: LabeledEdge }

const initialNodes: Node[] = [
  { id: "order", type: "input", position: { x: 60, y: 150 }, data: { label: "Order placed" } },
  { id: "pay", position: { x: 300, y: 40 }, data: { label: "Process payment" } },
  { id: "ship", position: { x: 300, y: 260 }, data: { label: "Ship order" } },
  { id: "done", type: "output", position: { x: 560, y: 150 }, data: { label: "Completed" } },
]

// Each edge uses our custom type and carries its label in `data`.
const initialEdges: Edge[] = [
  { id: "e1", source: "order", target: "pay", type: "labeled", animated: true, data: { label: "captured" } },
  { id: "e2", source: "order", target: "ship", type: "labeled", animated: true, data: { label: "in stock" } },
  { id: "e3", source: "pay", target: "done", type: "labeled", animated: true, data: { label: "paid" } },
  { id: "e4", source: "ship", target: "done", type: "labeled", animated: true, data: { label: "dispatched" } },
]

export function CustomEdges() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, type: "labeled" }, eds)),
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
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#cbd5e1" />
        <MiniMap pannable zoomable nodeColor={() => "#f59e0b"} maskColor="rgba(241,245,249,0.75)" className="!bg-white" />
        <Controls className="!bg-white" />
      </ReactFlow>
    </div>
  )
}
