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
import { MousePointerSquareDashed, Trash2, Ban } from "lucide-react"

const initialNodes: Node[] = [
  { id: "1", position: { x: 60, y: 60 }, data: { label: "Ingest" } },
  { id: "2", position: { x: 60, y: 220 }, data: { label: "Normalize" } },
  { id: "3", position: { x: 320, y: 60 }, data: { label: "Enrich" } },
  { id: "4", position: { x: 320, y: 220 }, data: { label: "Dedupe" } },
  { id: "5", position: { x: 580, y: 140 }, data: { label: "Export" } },
  { id: "6", position: { x: 580, y: 300 }, data: { label: "Archive" } },
]

const initialEdges: Edge[] = [
  { id: "e1", source: "1", target: "3", animated: true },
  { id: "e2", source: "2", target: "4", animated: true },
  { id: "e3", source: "3", target: "5" },
  { id: "e4", source: "4", target: "5" },
  { id: "e5", source: "4", target: "6" },
]

export function SelectionDeletion() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

  // React Flow keeps the `selected` flag in sync on our node objects as the
  // user clicks, so we can derive the current selection straight from state.
  const selectedCount = nodes.filter((n) => n.selected).length

  const selectAll = () => setNodes((nds) => nds.map((n) => ({ ...n, selected: true })))
  const clearSelection = () => setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))

  // Programmatic deletion — the same thing the Backspace / Delete keys do.
  const deleteSelected = () => {
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => eds.filter((e) => {
      const ids = new Set(nodes.filter((n) => n.selected).map((n) => n.id))
      return !ids.has(e.source) && !ids.has(e.target)
    }))
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
        <p className="text-xs text-slate-500">
          Click a node, or Ctrl/Cmd+click and drag a box on empty space to multi-select. Press{" "}
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600">Backspace</kbd>{" "}
          or{" "}
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600">Delete</kbd>{" "}
          to remove.
        </p>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
          {selectedCount} selected
        </span>
        <div className="ml-auto inline-flex items-center gap-1.5">
          <button
            onClick={selectAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <MousePointerSquareDashed className="h-3.5 w-3.5" />
            Select all
          </button>
          <button
            onClick={clearSelection}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Ban className="h-3.5 w-3.5" />
            Clear
          </button>
          <button
            onClick={deleteSelected}
            disabled={selectedCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="h-[400px] w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          // Drag on empty space to draw a selection box (multi-select)
          selectionOnDrag
          // Backspace / Delete remove the current selection
          deleteKeyCode={["Backspace", "Delete"]}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#cbd5e1" />
          <MiniMap pannable zoomable nodeColor={() => "#6366f1"} maskColor="rgba(241,245,249,0.75)" className="!bg-white" />
          <Controls className="!bg-white" />
        </ReactFlow>
      </div>
    </div>
  )
}
