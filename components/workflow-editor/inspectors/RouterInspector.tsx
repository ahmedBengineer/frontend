"use client";

import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Check, X, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssistantSection, AgentJsonObject, TaskDefaults } from "../types";
import { JsonInspector } from "./JsonInspector";
import {
  DEFAULT_ROUTER_TOOLS,
  DEFAULT_ROUTER_TOOL_DESCRIPTIONS,
} from "@/lib/workflow-studio/defaultTools";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "global", label: "Global Instructions" },
  { id: "routing", label: "Routing" },
  { id: "tools", label: "Default Tools" },
  { id: "raw", label: "Raw JSON" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function RouterInspector({
  assistant,
  taskDefaults,
  onUpdate,
  focusTab,
  focusRequestId,
  includeDefaultTools = false,
  defaultToolNames = [],
  onDefaultToolsChange,
}: {
  assistant: AssistantSection;
  taskDefaults?: TaskDefaults;
  onUpdate: (updater: (prev: AgentJsonObject) => AgentJsonObject) => void;
  focusTab?: TabId;
  focusRequestId?: number;
  includeDefaultTools?: boolean;
  defaultToolNames?: string[];
  onDefaultToolsChange?: (enabled: boolean, names: string[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>(focusTab ?? "overview");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const routing = assistant.routing_instructions ?? [];
  const globalInstructions = taskDefaults?.instructions ?? [];

  useEffect(() => {
    if (focusTab) setActiveTab(focusTab);
  }, [focusRequestId, focusTab]);

  function saveInstruction(i: number, text: string) {
    const updated = [...routing];
    updated[i] = text;
    onUpdate((prev) => ({
      ...prev,
      assistant: {
        ...prev.assistant,
        routing_instructions: updated,
      } as AssistantSection,
    }));
    setEditingIdx(null);
  }

  function deleteInstruction(i: number) {
    const updated = routing.filter((_, idx) => idx !== i);
    onUpdate((prev) => ({
      ...prev,
      assistant: {
        ...prev.assistant,
        routing_instructions: updated,
      } as AssistantSection,
    }));
  }

  function addInstruction() {
    const updated = [...routing, ""];
    onUpdate((prev) => ({
      ...prev,
      assistant: {
        ...prev.assistant,
        routing_instructions: updated,
      } as AssistantSection,
    }));
    setEditingIdx(updated.length - 1);
    setEditText("");
  }

  function updateGlobal(instructions: string[]) {
    onUpdate((prev) => ({
      ...prev,
      task_defaults: { ...prev.task_defaults, instructions },
    }));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="shrink-0 border-b border-slate-100 bg-white">
        <div className="flex overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-[12px] font-medium whitespace-nowrap transition-colors",
                activeTab === t.id
                  ? "text-slate-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-teal-500"
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
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Workflow tool description
              </p>
              <p className="text-[12px] leading-relaxed text-slate-700">
                {assistant.run_workflow_tool_description || (
                  <span className="italic text-slate-400">Not set</span>
                )}
              </p>
            </div>

            {/* Flags */}
            {[
              {
                key: "greeting_from_agent_definition",
                label: "Greeting from definition",
              },
              {
                key: "use_agent_definition_instructions",
                label: "Use agent instructions",
              },
            ].map(({ key, label }) => {
              const val = assistant[key as keyof AssistantSection] as
                boolean | undefined;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                >
                  <p className="text-[12px] font-medium text-slate-700">
                    {label}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                      val
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {val ? "Yes" : "No"}
                  </span>
                </div>
              );
            })}

            {/* Unknown extra fields */}
            {Object.entries(assistant)
              .filter(
                ([k]) =>
                  ![
                    "routing_instructions",
                    "run_workflow_tool_description",
                    "greeting_from_agent_definition",
                    "use_agent_definition_instructions",
                  ].includes(k),
              )
              .map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <p className="mb-1 text-[10px] font-semibold text-slate-400">
                    {k}
                  </p>
                  <pre className="overflow-x-auto text-[10px] text-slate-600">
                    {JSON.stringify(v, null, 2)}
                  </pre>
                </div>
              ))}
          </div>
        )}

        {activeTab === "routing" && (
          <div className="space-y-2">
            {routing.map((r, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl border text-[12px] transition-all",
                  editingIdx === i
                    ? "border-teal-200 bg-teal-50/40 p-3"
                    : "border-slate-100 bg-slate-50/60 px-3 py-2.5",
                )}
              >
                {editingIdx === i ? (
                  <>
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[72px] resize-y border-teal-200 bg-white text-[12px]"
                      autoFocus
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 gap-1.5 text-[11px]"
                        onClick={() => saveInstruction(i, editText)}
                      >
                        <Check className="h-3 w-3" /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px]"
                        onClick={() => setEditingIdx(null)}
                      >
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="group flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                    <p
                      className="flex-1 cursor-pointer leading-relaxed text-slate-700 hover:text-slate-900"
                      onClick={() => {
                        setEditingIdx(i);
                        setEditText(r);
                      }}
                    >
                      {r || (
                        <span className="italic text-slate-400">empty</span>
                      )}
                    </p>
                    <button
                      className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                      onClick={() => deleteInstruction(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={addInstruction}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2.5 text-[11px] text-slate-400 transition hover:border-teal-200 hover:text-teal-500"
            >
              <Plus className="h-3 w-3" /> Add routing instruction
            </button>
          </div>
        )}

        {activeTab === "global" && (
          <div className="space-y-3">
            <p className="text-[11px] leading-relaxed text-slate-500">
              These instructions are applied to the supervisor router and every workflow task.
            </p>
            {globalInstructions.map((instruction, index) => (
              <div key={index} className="group rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <Textarea
                  value={instruction}
                  onChange={(event) => {
                    const updated = [...globalInstructions];
                    updated[index] = event.target.value;
                    updateGlobal(updated);
                  }}
                  className="min-h-[72px] resize-y bg-white text-[12px]"
                />
                <button
                  type="button"
                  onClick={() => updateGlobal(globalInstructions.filter((_, itemIndex) => itemIndex !== index))}
                  className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateGlobal([...globalInstructions, ""])}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2.5 text-[11px] text-slate-400 hover:border-teal-200 hover:text-teal-500"
            >
              <Plus className="h-3 w-3" /> Add global instruction
            </button>
          </div>
        )}

        {activeTab === "tools" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
              <div>
                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                  Expose default tools to Router
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Only selected tools are added to the supervisor router.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-label="Enable router default tools"
                aria-checked={includeDefaultTools}
                onClick={() =>
                  onDefaultToolsChange?.(
                    !includeDefaultTools,
                    !includeDefaultTools ? defaultToolNames : [],
                  )
                }
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
                  includeDefaultTools ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-700",
                )}
              >
                <span
                  className={cn(
                    "mt-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    includeDefaultTools ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </button>
            </div>

            <div className="space-y-2" aria-label="Router default tools">
              {DEFAULT_ROUTER_TOOLS.map((tool) => {
                const selected =
                  includeDefaultTools && defaultToolNames.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    disabled={!includeDefaultTools}
                    aria-pressed={selected}
                    onClick={() =>
                      onDefaultToolsChange?.(
                        true,
                        selected
                          ? defaultToolNames.filter((name) => name !== tool)
                          : [...defaultToolNames, tool],
                      )
                    }
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                      selected
                        ? "border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/40"
                        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950",
                      !includeDefaultTools && "cursor-not-allowed opacity-45",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        selected
                          ? "border-teal-500 bg-teal-500 text-white"
                          : "border-slate-300 text-transparent dark:border-slate-600",
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                        <Wrench className="h-3 w-3 text-slate-400" /> {tool}
                      </span>
                      <span className="mt-1 block text-[10px] leading-relaxed text-slate-400">
                        {DEFAULT_ROUTER_TOOL_DESCRIPTIONS[tool]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "raw" && (
          <div className="h-[calc(100vh-200px)] min-h-[300px]">
            <JsonInspector
              title="assistant"
              value={assistant}
              onApply={(parsed) =>
                onUpdate((prev) => ({
                  ...prev,
                  assistant: parsed as unknown as AssistantSection,
                }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
