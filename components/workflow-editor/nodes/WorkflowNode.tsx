"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Workflow } from "../types";
import type { ExecutionStatus } from "@/lib/workflow-test/contracts";

export interface WorkflowNodeStats {
  taskCount: number;
  toolCount: number;
  variableCount: number;
  interruptibleBy: string[];
  resumeAfterInterrupt: boolean;
  invalidInterrupts: string[];
}

export interface WorkflowNodeData extends Record<string, unknown> {
  workflowId: string;
  workflow: Workflow;
  stats: WorkflowNodeStats;
  onSelect?: () => void;
  onOpen?: () => void;
  executionStatus?: ExecutionStatus;
}

export type WorkflowNodeType = Node<WorkflowNodeData, "workflowNode">;

export function WorkflowNode({ data, selected }: NodeProps<WorkflowNodeType>) {
  const { workflowId, workflow, stats } = data;

  return (
    <div
      data-active={data.executionStatus === "active" ? "true" : "false"}
      className={cn(
        "relative w-[260px] overflow-visible rounded-2xl border bg-white shadow-lg transition-all dark:bg-slate-900",
        selected
          ? "border-indigo-400 ring-2 ring-indigo-200 shadow-indigo-100"
          : "border-slate-200 hover:border-slate-300 hover:shadow-xl dark:border-slate-700",
        data.executionStatus === "active" &&
          "scale-[1.03] border-cyan-500 ring-4 ring-cyan-300/80 shadow-[0_0_32px_rgba(6,182,212,0.65)] dark:border-cyan-300 dark:ring-cyan-400/60",
        data.executionStatus === "completed" &&
          "border-emerald-400 ring-2 ring-emerald-300/40",
        data.executionStatus === "interrupted" &&
          "border-amber-400 ring-2 ring-amber-300/50",
        data.executionStatus === "resumed" &&
          "border-violet-400 ring-2 ring-violet-300/50",
        data.executionStatus === "failed" &&
          "border-red-500 ring-2 ring-red-300/50",
      )}
    >
      {data.executionStatus === "active" && (
        <span className="absolute -right-2 -top-3 z-20 inline-flex items-center gap-1 rounded-full bg-cyan-500 px-2 py-1 text-[9px] font-bold tracking-[0.12em] text-slate-950 shadow-lg dark:bg-cyan-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-pulse" />
          LIVE WORKFLOW
        </span>
      )}
      {/* Indigo accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-400 to-violet-500" />

      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Workflow
            </p>
            <p className="truncate font-mono text-[13px] font-bold text-slate-800">
              {workflowId}
            </p>
          </div>
          {data.executionStatus && data.executionStatus !== "idle" && (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-semibold uppercase text-white dark:bg-white dark:text-slate-900">
              {data.executionStatus}
            </span>
          )}
        </div>

        {/* Description — single line, never wraps */}
        {workflow.description && (
          <p className="mt-2 truncate text-[11px] text-slate-400">
            {workflow.description}
          </p>
        )}

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px]">
          <span className="rounded-lg bg-slate-50 px-2 py-1 font-semibold text-slate-700 ring-1 ring-slate-100">
            {stats.taskCount}T
          </span>
          <span className="rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-700 ring-1 ring-amber-100">
            {stats.toolCount}🔧
          </span>
          <span className="rounded-lg bg-violet-50 px-2 py-1 font-semibold text-violet-700 ring-1 ring-violet-100">
            {stats.variableCount}V
          </span>
          {stats.resumeAfterInterrupt && (
            <span className="rounded-lg bg-emerald-50 px-2 py-1 font-semibold text-emerald-600 ring-1 ring-emerald-100">
              ↩
            </span>
          )}
          {stats.invalidInterrupts.length > 0 && (
            <span className="rounded-lg bg-red-50 px-2 py-1 font-semibold text-red-500 ring-1 ring-red-100">
              ⚠
            </span>
          )}
        </div>

        {/* Interrupt list (no edges = no spaghetti) */}
        {stats.interruptibleBy.length > 0 && (
          <p className="mt-2 truncate text-[10px] text-slate-400">
            ⚡ {stats.interruptibleBy.join(", ")}
          </p>
        )}
      </div>

      {/* Open button */}
      <div className="border-t border-slate-100 px-3 py-2">
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
          onClick={(e) => {
            e.stopPropagation();
            data.onOpen?.();
          }}
        >
          Open workflow <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{
          background: "white",
          border: "2px solid #818cf8",
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{
          background: "#818cf8",
          border: "2px solid white",
          width: 8,
          height: 8,
        }}
      />
    </div>
  );
}
