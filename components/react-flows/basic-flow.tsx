"use client"

import { useCallback } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"

// A minimal graph: an input node, two processing nodes and an output node.
const initialNodes: Node[] = [
  { id: "start", type: "input", position: { x: 60, y: 170 }, data: { label: "Start" } },
  { id: "validate", position: { x: 280, y: 70 }, data: { label: "Validate input" } },
  { id: "process", position: { x: 280, y: 250 }, data: { label: "Run process" } },
  { id: "finish", type: "output", position: { x: 520, y: 160 }, data: { label: "Finish" } },
]

const initialEdges: Edge[] = [
  { id: "e1", source: "start", target: "validate", animated: true },
  { id: "e2", source: "start", target: "process" },
  { id: "e3", source: "validate", target: "finish", animated: true },
  { id: "e4", source: "process", target: "finish" },
]

export function BasicFlow() {
  // useNodesState / useEdgesState are convenience hooks. They store the graph in
  // React state and give us an onNodesChange / onEdgesChange handler that applies
  // low-level events (drag, select, remove) to our state, keeping us in sync.
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // onConnect is fired when the user drags a new connection from a source handle
  // to a target handle. addEdge appends the new connection to our edge list.
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
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        {/* The dotted background grid behind the canvas */}
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#cbd5e1" />
        {/* Mini-map mirrors the whole graph for orientation */}
        <MiniMap pannable zoomable nodeColor={() => "#10b981"} maskColor="rgba(241,245,249,0.75)" className="!bg-white" />
        {/* Built-in zoom in / out / fit / lock controls */}
        <Controls className="!bg-white" />
      </ReactFlow>
    </div>
  )
}
