"use client"

import { useCallback } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"
import { LayoutGrid, Focus, RotateCcw } from "lucide-react"

// Deliberately messy starting positions so "Reset" vs "Auto layout" is obvious.
const initialNodes: Node[] = [
  { id: "a", type: "input", position: { x: 420, y: 40 }, data: { label: "Start" } },
  { id: "b", position: { x: 40, y: 120 }, data: { label: "Fetch data" } },
  { id: "c", position: { x: 260, y: 320 }, data: { label: "Clean rows" } },
  { id: "d", position: { x: 560, y: 240 }, data: { label: "Validate" } },
  { id: "e", position: { x: 160, y: 60 }, data: { label: "Transform" } },
  { id: "f", position: { x: 640, y: 60 }, data: { label: "Aggregate" } },
  { id: "g", type: "output", position: { x: 340, y: 420 }, data: { label: "Publish" } },
]

const initialEdges: Edge[] = [
  { id: "e1", source: "a", target: "b", animated: true },
  { id: "e2", source: "a", target: "e", animated: true },
  { id: "e3", source: "b", target: "c" },
  { id: "e4", source: "e", target: "f" },
  { id: "e5", source: "c", target: "d" },
  { id: "e6", source: "d", target: "g", animated: true },
  { id: "e7", source: "f", target: "g", animated: true },
]

// A tiny layered (longest-path) layout: assign each node a layer based on the
// longest path from any source, then position layers left-to-right.
function autoLayout(nodes: Node[], edges: Edge[]): Node[] {
  const adj: Record<string, string[]> = {}
  const indegree: Record<string, number> = {}
  nodes.forEach((n) => {
    adj[n.id] = []
    indegree[n.id] = 0
  })
  edges.forEach((e) => {
    adj[e.source]?.push(e.target)
    if (indegree[e.target] !== undefined) indegree[e.target] += 1
  })

  const layer: Record<string, number> = {}
  const best: Record<string, number> = {}
  const queue: string[] = []
  nodes.forEach((n) => {
    layer[n.id] = 0
    best[n.id] = 0
    if (indegree[n.id] === 0) queue.push(n.id)
  })

  // Kahn's algorithm, tracking the longest path to each node as its layer.
  const indeg = { ...indegree }
  while (queue.length) {
    const id = queue.shift()!
    for (const next of adj[id]) {
      best[next] = Math.max(best[next], layer[id] + 1)
      indeg[next] -= 1
      if (indeg[next] === 0) {
        layer[next] = best[next]
        queue.push(next)
      }
    }
  }

  const byLayer: Record<number, string[]> = {}
  nodes.forEach((n) => {
    const l = layer[n.id] ?? 0
    ;(byLayer[l] ||= []).push(n.id)
  })

  const NODE_W = 150
  const NODE_H = 50
  const H_GAP = 130
  const V_GAP = 90

  return nodes.map((n) => {
    const l = layer[n.id] ?? 0
    const siblings = byLayer[l]
    const idx = siblings.indexOf(n.id)
    return {
      ...n,
      position: {
        x: 40 + l * (NODE_W + H_GAP),
        y: 40 + (idx - (siblings.length - 1) / 2) * (NODE_H + V_GAP),
      },
    }
  })
}

// useReactFlow only works inside a ReactFlowProvider, so we wrap the demo.
function FitViewDemo() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

  // The instance gives us imperative control over the viewport and graph.
  const { fitView, getEdges } = useReactFlow()

  const runAutoLayout = useCallback(() => {
    setNodes((nds) => autoLayout(nds, getEdges()))
  }, [setNodes, getEdges])

  const reset = () => {
    setNodes(initialNodes.map((n) => ({ ...n })))
    setEdges(initialEdges.map((e) => ({ ...e })))
  }

  const runFitView = () => {
    // fitView animates the viewport so every node is visible
    void fitView({ padding: 0.25, duration: 500 })
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
        <p className="text-xs text-slate-500">Try moving nodes around, then run Auto layout to tidy everything up.</p>
        <div className="ml-auto inline-flex items-center gap-1.5">
          <button
            onClick={runAutoLayout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Auto layout
          </button>
          <button
            onClick={runFitView}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Focus className="h-3.5 w-3.5" />
            Fit view
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
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
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#cbd5e1" />
          <MiniMap pannable zoomable nodeColor={() => "#0ea5e9"} maskColor="rgba(241,245,249,0.75)" className="!bg-white" />
          <Controls className="!bg-white" />
        </ReactFlow>
      </div>
    </div>
  )
}

export function FitView() {
  return (
    <ReactFlowProvider>
      <FitViewDemo />
    </ReactFlowProvider>
  )
}
