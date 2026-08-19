"use client";

import React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
  Bot,
  CheckCircle2,
  ListChecks,
  Play,
  AlertTriangle,
  Info,
  PencilLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Task } from "../types";
import type { ExecutionStatus } from "@/lib/workflow-test/contracts";
import { getTaskStateReferences } from "../utils/workflowSelectors";

const KINDS: Record<
  string,
  {
    label: string;
    accent: string;
    iconBg: string;
    iconColor: string;
    icon: React.ElementType;
  }
> = {
  collect: {
    label: "COLLECT",
    accent: "from-indigo-400 to-indigo-500",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    icon: ListChecks,
  },
  action: {
    label: "ACTION",
    accent: "from-rose-400 to-rose-500",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    icon: Play,
  },
  answer: {
    label: "ANSWER",
    accent: "from-sky-400 to-sky-500",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
    icon: Bot,
  },
};

const DEFAULT_KIND = {
  label: "TASK",
  accent: "from-slate-300 to-slate-400",
  iconBg: "bg-slate-50",
  iconColor: "text-slate-500",
  icon: Info,
};

export interface TaskNodeData extends Record<string, unknown> {
  taskId: string;
  workflowId: string;
  task: Task;
  toolCount: number;
  variableCount: number;
  unsequenced?: boolean;
  onSelect?: () => void;
  onOpenInstructions?: () => void;
  executionStatus?: ExecutionStatus;
  toolStatuses?: Record<string, ExecutionStatus>;
  updatedStateFields?: string[];
  stateValues?: Record<string, unknown>;
}

export type TaskNodeType = Node<TaskNodeData, "taskNode">;

function formatStateValue(value: unknown): string {
  if (value === null) return "cleared";
  if (value === "") return "empty string";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function TaskNode({ data, selected }: NodeProps<TaskNodeType>) {
  const { taskId, task, toolCount, variableCount, unsequenced } = data;
  const k = KINDS[task.kind] ?? DEFAULT_KIND;
  const Icon = k.icon;
  const updatedStateFields = new Set(data.updatedStateFields ?? []);
  const visibleStateFields = Array.from(
    new Set([...getTaskStateReferences(task), ...updatedStateFields]),
  );
  const instructionPreview = [
    task.entry_prompt,
    task.on_enter_instructions,
    ...(task.instructions ?? []),
  ]
    .map((instruction) => instruction?.trim())
    .filter((instruction): instruction is string => Boolean(instruction))
    .join(" ");

  // Primary info line — what this task does / collects
  const infoLine = (() => {
    if (task.action_tool) return task.action_tool;
    if (task.answer_tool) return task.answer_tool;
    if (task.collect) {
      const vars = Object.keys(task.collect);
      return vars.length > 0 ? vars.join(", ") : null;
    }
    return null;
  })();

  return (
    <div
      data-active={data.executionStatus === "active" ? "true" : "false"}
      className={cn(
        "relative w-[280px] overflow-visible rounded-2xl border bg-white shadow-lg transition-all dark:bg-slate-900",
        selected
          ? "border-indigo-400 ring-2 ring-indigo-200 shadow-indigo-100"
          : "border-slate-200 hover:border-slate-300 hover:shadow-xl dark:border-slate-700",
        unsequenced && "border-amber-300",
        data.executionStatus === "active" &&
          "scale-[1.03] border-cyan-500 ring-4 ring-cyan-300/80 shadow-[0_0_32px_rgba(6,182,212,0.65)] dark:border-cyan-300 dark:ring-cyan-400/60",
        data.executionStatus === "completed" &&
          "border-emerald-400 ring-2 ring-emerald-300/40",
        data.executionStatus === "regressed" &&
          "border-orange-400 ring-2 ring-orange-300/50",
        data.executionStatus === "failed" &&
          "border-red-500 ring-2 ring-red-300/50",
      )}
    >
      {data.executionStatus === "active" && (
        <span className="absolute -right-2 -top-3 z-20 inline-flex items-center gap-1 rounded-full bg-cyan-500 px-2 py-1 text-[9px] font-bold tracking-[0.12em] text-slate-950 shadow-lg dark:bg-cyan-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-pulse" />
          LIVE TASK
        </span>
      )}
      {/* Accent strip */}
      <div className={cn("h-1 w-full bg-gradient-to-r", k.accent)} />

      {/* Unsequenced banner — single line, never wraps */}
      {unsequenced && (
        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 text-[10px] font-medium text-amber-600">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Not in task_order
        </div>
      )}

      <div className="px-4 py-3">
        {/* Header row */}
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
              k.iconBg,
              k.iconColor,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                k.iconColor,
              )}
            >
              {k.label}
            </p>
            <p className="truncate font-mono text-[13px] font-bold text-slate-800">
              {taskId}
            </p>
          </div>
          {data.executionStatus && data.executionStatus !== "idle" && (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-semibold uppercase text-white dark:bg-white dark:text-slate-900">
              {data.executionStatus}
            </span>
          )}
        </div>

        {/* Description — one line max */}
        {task.description && (
          <p className="mt-2 truncate text-[11px] text-slate-400">
            {task.description}
          </p>
        )}

        {/* Primary info — tool name or variables */}
        {infoLine && (
          <p className="mt-1.5 truncate font-mono text-[11px] font-semibold text-slate-600">
            {infoLine}
          </p>
        )}

        {/* Instructions — a Retell-style preview with direct edit navigation */}
        <button
          type="button"
          aria-label={`Edit instructions for ${taskId}`}
          className="nodrag nopan mt-3 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-left transition hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 dark:border-indigo-900/60 dark:bg-indigo-950/30"
          onClick={(event) => {
            event.stopPropagation();
            data.onOpenInstructions?.();
          }}
        >
          <span className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-500">
            Instructions
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
            {instructionPreview || "Add task instructions…"}
          </span>
        </button>

        {/* Stats chips */}
        <div className="mt-3 flex items-center gap-1.5">
          {variableCount > 0 && (
            <span className="rounded-lg bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600 ring-1 ring-violet-100">
              {variableCount}V
            </span>
          )}
          {toolCount > 0 && (
            <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 ring-1 ring-amber-100">
              {toolCount}🔧
            </span>
          )}
          {(task.instructions?.length ?? 0) > 0 && (
            <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-100">
              {task.instructions!.length} steps
            </span>
          )}
          {task.required_tool_calls_before_complete &&
            task.required_tool_calls_before_complete.length > 0 && (
              <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-500 ring-1 ring-indigo-100">
                req
              </span>
            )}
        </div>
        {visibleStateFields.length > 0 && (
          <TooltipProvider delayDuration={150}>
            <div
              className="mt-2 flex flex-wrap gap-1"
              aria-label="Task variables"
            >
              {visibleStateFields.map((field) => {
                const updated = updatedStateFields.has(field);
                const hasValue = Object.prototype.hasOwnProperty.call(
                  data.stateValues ?? {},
                  field,
                );
                const value = data.stateValues?.[field];
                const detail = hasValue
                  ? formatStateValue(value)
                  : "Not updated in this test call";
                return (
                  <Tooltip key={field}>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "inline-flex max-w-full cursor-help items-center gap-1 truncate rounded-md border px-1.5 py-0.5 font-mono text-[9px]",
                          updated
                            ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-700"
                            : "border-violet-100 bg-violet-50 text-violet-600",
                        )}
                        aria-label={`State variable ${field}`}
                      >
                        {updated && (
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                        )}
                        <span className="truncate">{field}</span>
                        {updated && <span className="sr-only"> updated</span>}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-72 space-y-1 text-xs"
                    >
                      <p className="font-mono font-semibold">{field}</p>
                      <p>{detail}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}
        {(task.tools ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(task.tools ?? []).slice(0, 4).map((name) => {
              const status = data.toolStatuses?.[name];
              return (
                <span
                  key={name}
                  className={cn(
                    "max-w-full truncate rounded-md border px-1.5 py-0.5 font-mono text-[9px]",
                    status === "active" &&
                      "border-cyan-400 bg-cyan-50 text-cyan-700",
                    status === "completed" &&
                      "border-emerald-400 bg-emerald-50 text-emerald-700",
                    status === "failed" &&
                      "border-red-400 bg-red-50 text-red-700",
                  )}
                >
                  {name}
                  {status && status !== "idle" ? ` · ${status}` : ""}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Details button */}
      <div className="border-t border-slate-100 px-3 py-2">
        <button
          className="flex w-full items-center justify-center rounded-xl bg-slate-50 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
          onClick={(e) => {
            e.stopPropagation();
            data.onSelect?.();
          }}
        >
          Details
        </button>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{
          background: "white",
          border: "2px solid #94a3b8",
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{
          background: "#94a3b8",
          border: "2px solid white",
          width: 8,
          height: 8,
        }}
      />
    </div>
  );
}
