"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentJsonObject, Workflow } from "../types";
import { getWorkflowStats } from "../utils/workflowSelectors";
import { JsonInspector } from "./JsonInspector";
import { findWorkflowReferences } from "../utils/validation";
import { removeWorkflow, reorderTasks } from "../utils/editorMutations";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "raw", label: "Raw JSON" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
      {children}
    </p>
  );
}

function EditField({
  label,
  value,
  onSave,
  multiline = true,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-400">
          {label}
        </p>
        {multiline ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[72px] resize-y border-indigo-200 bg-white text-[12px]"
            autoFocus
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="border-indigo-200 bg-white text-[12px]"
            autoFocus
          />
        )}
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            className="h-7 gap-1.5 text-[11px]"
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
          >
            <Check className="h-3 w-3" /> Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
          >
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group cursor-pointer rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all hover:border-slate-200 hover:bg-slate-50"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <Pencil className="h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="text-[12px] leading-relaxed text-slate-700">
        {value || (
          <span className="italic text-slate-400">empty — click to edit</span>
        )}
      </p>
    </div>
  );
}

export function WorkflowInspector({
  workflowId,
  workflow,
  jsonObject,
  onUpdate,
}: {
  workflowId: string;
  workflow: Workflow;
  jsonObject: AgentJsonObject;
  onUpdate: (updater: (prev: AgentJsonObject) => AgentJsonObject) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const stats = getWorkflowStats(workflow, jsonObject);

  function updateField(key: string, value: unknown) {
    onUpdate((prev) => {
      const next = structuredClone(prev);
      if (next.workflows?.[workflowId]) {
        next.workflows[workflowId] = {
          ...next.workflows[workflowId],
          [key]: value,
        };
      }
      return next;
    });
  }

  function deleteWorkflow() {
    const references = findWorkflowReferences(jsonObject, workflowId);
    if (references.length) {
      window.alert(`Remove these references first: ${references.join(", ")}`);
      return;
    }
    if (!window.confirm(`Delete workflow “${workflowId}”?`)) return;
    try {
      onUpdate((current) => removeWorkflow(current, workflowId));
    } catch (reason) {
      window.alert(
        reason instanceof Error ? reason.message : "Could not delete workflow",
      );
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="shrink-0 border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="flex overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-[12px] font-medium whitespace-nowrap transition-colors",
                activeTab === t.id
                  ? "text-slate-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-indigo-500"
                  : "text-slate-400 hover:text-slate-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Tasks",
                  value: stats.taskCount,
                  color: "text-slate-800",
                },
                {
                  label: "Tools",
                  value: stats.toolCount,
                  color: "text-amber-600",
                },
                {
                  label: "Variables",
                  value: stats.variableCount,
                  color: "text-violet-600",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center"
                >
                  <p className={cn("font-mono text-xl font-bold", color)}>
                    {value}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            {/* Resume toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <div>
                <p className="text-[12px] font-medium text-slate-700">
                  Resume after interrupt
                </p>
                <p className="text-[11px] text-slate-400">
                  {stats.resumeAfterInterrupt
                    ? "Returns to this workflow"
                    : "Does not resume"}
                </p>
              </div>
              <button
                onClick={() =>
                  updateField(
                    "resume_after_interrupt",
                    !stats.resumeAfterInterrupt,
                  )
                }
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none",
                  stats.resumeAfterInterrupt
                    ? "bg-emerald-500"
                    : "bg-slate-200",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform",
                    stats.resumeAfterInterrupt
                      ? "translate-x-4"
                      : "translate-x-0",
                  )}
                />
              </button>
            </div>

            {/* Interruptible by */}
            <div>
              <SectionLabel>May be interrupted by</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(jsonObject.workflows ?? {})
                  .filter((id) => id !== workflowId)
                  .map((id) => {
                    const selected = stats.interruptibleBy.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          updateField(
                            "interruptible_by",
                            selected
                              ? stats.interruptibleBy.filter(
                                  (value) => value !== id,
                                )
                              : [...stats.interruptibleBy, id],
                          )
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-1 font-mono text-[10px]",
                          selected
                            ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40"
                            : "border-slate-200 text-slate-500 dark:border-slate-700",
                        )}
                      >
                        {id}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div>
              <SectionLabel>Task order</SectionLabel>
              <div className="space-y-1.5">
                {workflow.task_order.map((taskId, index) => (
                  <div
                    key={taskId}
                    className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs dark:border-slate-700"
                  >
                    <span className="w-5 text-slate-400">{index + 1}</span>
                    <code className="min-w-0 flex-1 truncate">{taskId}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() =>
                        onUpdate((current) =>
                          reorderTasks(current, workflowId, index, index - 1),
                        )
                      }
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={index === workflow.task_order.length - 1}
                      onClick={() =>
                        onUpdate((current) =>
                          reorderTasks(current, workflowId, index, index + 1),
                        )
                      }
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <EditField
              label="Description"
              value={workflow.description ?? ""}
              onSave={(v) => updateField("description", v)}
            />
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={deleteWorkflow}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete workflow
            </Button>
            <EditField
              label="Start phrase"
              value={workflow.start_phrase ?? ""}
              onSave={(v) => updateField("start_phrase", v)}
            />
          </div>
        )}

        {activeTab === "raw" && (
          <div className="h-[calc(100vh-200px)] min-h-[300px]">
            <JsonInspector
              title={`workflows.${workflowId}`}
              value={workflow}
              onApply={(parsed) =>
                onUpdate((prev) => {
                  const next = structuredClone(prev);
                  if (next.workflows)
                    next.workflows[workflowId] = parsed as unknown as Workflow;
                  return next;
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
