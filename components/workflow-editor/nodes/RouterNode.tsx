"use client";

import React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { PencilLine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssistantSection, TaskDefaults } from "../types";
import type { ExecutionStatus } from "@/lib/workflow-test/contracts";

export interface RouterNodeData extends Record<string, unknown> {
  assistant?: AssistantSection;
  taskDefaults?: TaskDefaults;
  workflowCount: number;
  onSelect?: () => void;
  onOpenInstructions?: () => void;
  onOpenGlobalInstructions?: () => void;
  onOpenDefaultTools?: () => void;
  defaultToolCount?: number;
  executionStatus?: ExecutionStatus;
}

export type RouterNodeType = Node<RouterNodeData, "routerNode">;

export function RouterNode({ data, selected }: NodeProps<RouterNodeType>) {
  const assistant = data.assistant;
  const routingCount = assistant?.routing_instructions?.length ?? 0;
  const globalCount = data.taskDefaults?.instructions?.length ?? 0;
  const instructionPreview = assistant?.routing_instructions
    ?.map((instruction) => instruction.trim())
    .filter(Boolean)
    .join(" ");
  const globalInstructionPreview = data.taskDefaults?.instructions
    ?.map((instruction) => instruction.trim())
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cn(
        "w-[280px] overflow-hidden rounded-2xl border bg-white shadow-lg transition-all dark:bg-slate-900",
        selected
          ? "border-teal-400 ring-2 ring-teal-200 shadow-teal-100"
          : "border-slate-200 hover:border-slate-300 hover:shadow-xl dark:border-slate-700",
        data.executionStatus === "active" &&
          "border-cyan-400 ring-4 ring-cyan-300/50 animate-pulse",
        data.executionStatus === "completed" &&
          "border-emerald-400 ring-2 ring-emerald-300/40",
      )}
    >
      {/* Teal accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-teal-400 to-teal-500" />

      <div className="px-4 py-3">
        {/* Header row */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500">
              Router
            </p>
            <p className="truncate text-[13px] font-semibold text-slate-800">
              Voice agent runtime
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-teal-600 ring-1 ring-teal-100">
            {data.executionStatus && data.executionStatus !== "idle"
              ? data.executionStatus
              : "ROUTER"}
          </span>
        </div>

        {/* Routing instructions — opens the inspector at the editable list */}
        <button
          type="button"
          aria-label="Edit router instructions"
          className="nodrag nopan mt-3 w-full rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-left transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 dark:border-teal-900/60 dark:bg-teal-950/30"
          onClick={(event) => {
            event.stopPropagation();
            data.onOpenInstructions?.();
          }}
        >
          <span className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.12em] text-teal-600">
            Routing Instructions
            <PencilLine className="h-3 w-3" aria-hidden="true" />
          </span>
          <span
            className={cn(
              "mt-1 block line-clamp-2 text-[11px] leading-4",
              instructionPreview
                ? "text-slate-600 dark:text-slate-300"
                : "italic text-slate-400",
            )}
          >
            {instructionPreview || "Add routing instructions…"}
          </span>
        </button>

        <button
          type="button"
          aria-label="Edit common instructions"
          className="nodrag nopan mt-2 w-full rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-left transition hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 dark:border-indigo-900/60 dark:bg-indigo-950/30"
          onClick={(event) => {
            event.stopPropagation();
            data.onOpenGlobalInstructions?.();
          }}
        >
          <span className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-600">
            Common Instructions
            <PencilLine className="h-3 w-3" aria-hidden="true" />
          </span>
          <span
            className={cn(
              "mt-1 block line-clamp-2 text-[11px] leading-4",
              globalInstructionPreview
                ? "text-slate-600 dark:text-slate-300"
                : "italic text-slate-400",
            )}
          >
            {globalInstructionPreview ||
              "Add instructions shared by router and tasks…"}
          </span>
        </button>

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-2 text-[11px]">
          <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-600 ring-1 ring-slate-100">
            {routingCount} rules
          </span>
          <span className="rounded-lg bg-teal-50 px-2.5 py-1 font-medium text-teal-700 ring-1 ring-teal-100">
            {globalCount} common
          </span>
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-medium text-indigo-600 ring-1 ring-indigo-100">
            {data.workflowCount} workflows
          </span>
          <button
            type="button"
            aria-label="Edit router default tools"
            onClick={(event) => {
              event.stopPropagation();
              data.onOpenDefaultTools?.();
            }}
            className="nodrag nopan rounded-lg bg-violet-50 px-2.5 py-1 font-medium text-violet-700 ring-1 ring-violet-100 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900"
          >
            {data.defaultToolCount ?? 0} default tools
          </button>
          {assistant?.greeting_from_agent_definition && (
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-600 ring-1 ring-emerald-100">
              greeting ✓
            </span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{
          background: "#14b8a6",
          width: 8,
          height: 8,
          border: "2px solid white",
        }}
      />
    </div>
  );
}
