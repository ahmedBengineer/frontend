"use client"

import { useCallback, useEffect, useMemo } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
} from "@xyflow/react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import type { AgentJsonObject, SelectedEntity } from "./types"
import { buildWorkflowGraph } from "./utils/graphBuilder"
import { getWorkflowStats } from "./utils/workflowSelectors"
import { validateTaskReferences, validateWorkflowReferences } from "./utils/validation"
import { TaskNode } from "./nodes/TaskNode"
import { TransitionEdge } from "./edges/TransitionEdge"

const nodeTypes = { taskNode: TaskNode }
const edgeTypes = { transitionEdge: TransitionEdge }

interface WorkflowDetailCanvasProps {
  workflowId: string | null
  jsonObject: AgentJsonObject
  onClose: () => void
  onSelectEntity: (entity: SelectedEntity) => void
}

export function WorkflowDetailCanvas({
  workflowId,
  jsonObject,
  onClose,
  onSelectEntity,
}: WorkflowDetailCanvasProps) {
  const workflow = workflowId ? jsonObject.workflows?.[workflowId] : null

  const { nodes: derivedNodes, edges: derivedEdges } = useMemo(() => {
    if (!workflowId) return { nodes: [], edges: [] }
    return buildWorkflowGraph(jsonObject, workflowId)
  }, [jsonObject, workflowId])

  const stats = useMemo(() => {
    if (!workflow) return null
    return getWorkflowStats(workflow, jsonObject)
  }, [workflow, jsonObject])

  const warnings = useMemo(() => {
    if (!workflowId) return []
    return [
      ...validateWorkflowReferences(jsonObject).filter((w) => w.context === workflowId),
      ...validateTaskReferences(workflowId, jsonObject),
    ]
  }, [jsonObject, workflowId])

  const initialNodes = useMemo(
    () =>
      derivedNodes.map((n) => {
        if (n.type === "taskNode") {
          const data = n.data as { taskId: string; workflowId: string }
          return {
            ...n,
            draggable: true,
            data: {
              ...n.data,
              onSelect: () =>
                onSelectEntity({ type: "task", workflowId: data.workflowId, taskId: data.taskId }),
              onOpenInstructions: () =>
                onSelectEntity({
                  type: "task",
                  workflowId: data.workflowId,
                  taskId: data.taskId,
                  inspectorTab: "instructions",
                }),
            },
          }
        }
        return { ...n, draggable: true }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [derivedNodes],
  )

  const [flowNodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(derivedEdges)

  // Sync when workflow JSON changes, preserving user-moved positions
  useEffect(() => {
    setNodes((prev) => {
      const posMap = new Map(prev.map((n) => [n.id, n.position]))
      return derivedNodes.map((n) => {
        const base = { ...n, draggable: true, position: posMap.get(n.id) ?? n.position }
        if (n.type === "taskNode") {
          const data = n.data as { taskId: string; workflowId: string }
          return {
            ...base,
            data: {
              ...n.data,
              onSelect: () =>
                onSelectEntity({ type: "task", workflowId: data.workflowId, taskId: data.taskId }),
              onOpenInstructions: () =>
                onSelectEntity({
                  type: "task",
                  workflowId: data.workflowId,
                  taskId: data.taskId,
                  inspectorTab: "instructions",
                }),
            },
          }
        }
        return base
      })
    })
  }, [derivedNodes, setNodes, onSelectEntity])

  useEffect(() => {
    setEdges(derivedEdges)
  }, [derivedEdges, setEdges])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type === "taskNode") {
        const data = node.data as { taskId: string; workflowId: string }
        onSelectEntity({ type: "task", workflowId: data.workflowId, taskId: data.taskId })
      }
    },
    [onSelectEntity],
  )

  return (
    <Dialog open={!!workflowId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onClose} className="shrink-0">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All Workflows
            </Button>
            <div className="hidden h-4 w-px bg-slate-200 sm:block" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm font-bold text-slate-800">{workflowId}</p>
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-600">
                  WORKFLOW
                </span>
              </div>
              {workflow?.description && (
                <p className="line-clamp-1 text-[11px] text-slate-500">{workflow.description}</p>
              )}
            </div>
            {stats && (
              <div className="flex shrink-0 flex-wrap items-center gap-2 text-[11px]">
                <span className="text-slate-500">
                  <span className="font-bold text-slate-700">{stats.taskCount}</span> tasks
                </span>
                <span className="text-slate-500">
                  <span className="font-bold text-amber-600">{stats.toolCount}</span> tools
                </span>
                <span className="text-slate-500">
                  <span className="font-bold text-violet-600">{stats.variableCount}</span> vars
                </span>
                {stats.resumeAfterInterrupt && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    resume ✓
                  </span>
                )}
                {stats.interruptibleBy.length > 0 && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                    interruptible
                  </span>
                )}
              </div>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <div className="space-y-0.5">
                {warnings.map((w, i) => (
                  <p key={i} className="text-[11px] text-amber-700">
                    {w.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas — fills remaining height */}
        <div className="min-h-0 flex-1">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable
            nodesConnectable={false}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.15}
            maxZoom={2}
            className="h-full w-full"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="!bg-slate-50" />
            <Controls className="!bottom-4 !left-4" showInteractive={false} />
            <MiniMap
              className="!bottom-4 !right-4 !h-20 !w-28 overflow-hidden rounded-xl border border-slate-200 shadow-sm"
              nodeColor={() => "#818cf8"}
              pannable
              zoomable
            />
          </ReactFlow>
        </div>
      </DialogContent>
    </Dialog>
  )
}
