"use client"

import { useCallback } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  ConnectionMode,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"
import { RotateCcw } from "lucide-react"

const initialNodes: Node[] = [
  { id: "a", type: "input", position: { x: 80, y: 180 }, data: { label: "Source A" } },
  { id: "b", type: "input", position: { x: 80, y: 320 }, data: { label: "Source B" } },
  { id: "c", position: { x: 380, y: 120 }, data: { label: "Router" } },
  { id: "d", position: { x: 380, y: 300 }, data: { label: "Processor" } },
  { id: "e", type: "output", position: { x: 660, y: 210 }, data: { label: "Output" } },
]

const initialEdges: Edge[] = [
  { id: "e1", source: "a", target: "c", animated: true },
  { id: "e2", source: "b", target: "d" },
  { id: "e3", source: "c", target: "e", animated: true },
  { id: "e4", source: "d", target: "e" },
]

export function InteractiveConnections() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // onConnect fires whenever a new connection is drawn between two handles.
  // addEdge gives the new edge an id automatically and appends it to our state.
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

  const reset = () => {
    setNodes(initialNodes.map((n) => ({ ...n })))
    setEdges(initialEdges.map((e) => ({ ...e })))
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
        <p className="text-xs text-slate-500">
          Drag from a node&apos;s handle to another node&apos;s handle to create a connection.
        </p>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          {edges.length} edge{edges.length === 1 ? "" : "s"}
        </span>
        <button
          onClick={reset}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="h-[400px] w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          // Strict mode requires connections to go source -> target (not source -> source)
          connectionMode={ConnectionMode.Strict}
          // Style the "in progress" connection while the user is drawing it
          connectionLineStyle={{ stroke: "#10b981", strokeWidth: 2 }}
          connectionRadius={30}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#cbd5e1" />
          <MiniMap pannable zoomable nodeColor={() => "#10b981"} maskColor="rgba(241,245,249,0.75)" className="!bg-white" />
          <Controls className="!bg-white" />
        </ReactFlow>
      </div>
    </div>
  )
}
