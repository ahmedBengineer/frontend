"use client";

import { ChevronDown, Download, Wrench } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import type {
  ToolInvocationRecord,
  WorkflowExecutionState,
} from "@/lib/workflow-test/contracts";

function pretty(value: unknown): string {
  if (value === undefined) return "Not available";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function duration(call: ToolInvocationRecord): string {
  if (!call.completedAt) return "In progress";
  const elapsed = Date.parse(call.completedAt) - Date.parse(call.startedAt);
  return Number.isFinite(elapsed) ? `${Math.max(0, elapsed)} ms` : "Completed";
}

export function buildToolCallExport(state: WorkflowExecutionState) {
  return {
    schema_version: 1,
    session_id: state.sessionId,
    exported_at: new Date().toISOString(),
    tool_calls: state.toolCalls.map((call) => ({
      call_id: call.id,
      workflow: call.workflowId,
      task: call.taskId,
      tool: call.toolName,
      status: call.status,
      started_at: call.startedAt,
      completed_at: call.completedAt ?? null,
      duration_ms: call.completedAt
        ? Math.max(0, Date.parse(call.completedAt) - Date.parse(call.startedAt))
        : null,
      parameters: call.arguments,
      response: Object.prototype.hasOwnProperty.call(call, "response")
        ? call.response
        : null,
      error: call.error ?? null,
    })),
  };
}

export function ToolCallHistory({ state }: { state: WorkflowExecutionState }) {
  function exportJson() {
    const payload = buildToolCallExport(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartconvo-tool-calls-${state.sessionId ?? "session"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const calls = [...state.toolCalls].reverse();

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Tool call history">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold">Tool calls</p>
          <p className="text-[10px] text-slate-400">
            {calls.length} captured in this call
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={!calls.length}
          onClick={exportJson}
        >
          <Download className="h-3.5 w-3.5" />
          Export JSON
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {!calls.length && (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-400">
            <Wrench className="mb-3 h-7 w-7" />
            <p className="text-xs font-medium">No tool calls yet</p>
            <p className="mt-1 text-[10px]">
              Parameters and responses will appear here as tools run.
            </p>
          </div>
        )}
        {calls.map((call) => (
          <details
            key={call.id}
            className="group rounded-xl border bg-white open:shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <summary className="flex cursor-pointer list-none items-start gap-2 p-3 [&::-webkit-details-marker]:hidden">
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  call.status === "completed"
                    ? "bg-emerald-500"
                    : call.status === "failed"
                      ? "bg-red-500"
                      : "animate-pulse bg-cyan-500"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[11px] font-semibold">
                  {call.toolName}
                </span>
                <span className="mt-0.5 block truncate text-[9px] text-slate-400">
                  {call.workflowId} / {call.taskId}
                </span>
                <span className="mt-1 block text-[9px] text-slate-400">
                  {new Date(call.startedAt).toLocaleString()} · {duration(call)}
                </span>
              </span>
              <ChevronDown className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <div className="space-y-3 border-t px-3 py-3 text-[10px] dark:border-slate-700">
              <div className="grid grid-cols-2 gap-2 text-slate-500">
                <span>Status: <strong>{call.status}</strong></span>
                <span className="truncate" title={call.id}>ID: {call.id}</span>
              </div>
              <div>
                <p className="mb-1 font-semibold text-slate-600 dark:text-slate-300">
                  Parameters
                </p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-950 p-2 text-[10px] text-slate-100">
                  {pretty(call.arguments)}
                </pre>
              </div>
              <div>
                <p className="mb-1 font-semibold text-slate-600 dark:text-slate-300">
                  {call.error ? "Error" : "Response"}
                </p>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-950 p-2 text-[10px] text-slate-100">
                  {call.error ?? pretty(call.response)}
                </pre>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
