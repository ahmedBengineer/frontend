"use client";

import React from "react";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  GripVertical,
  Pencil,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AgentJsonObject,
  AgentTool,
  CollectField,
  CompletionValidator,
  Task,
} from "../types";
import {
  getTaskStateReferences,
  getProgressPhrase,
} from "../utils/workflowSelectors";
import { JsonInspector } from "./JsonInspector";
import { removeTask } from "../utils/editorMutations";

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "instructions", label: "Instructions" },
  { id: "tools", label: "Tools" },
  { id: "variables", label: "Variables" },
  { id: "transitions", label: "Transitions" },
  { id: "raw", label: "Raw JSON" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Shared micro components ─────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
      {children}
    </p>
  );
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

// Inline editable field — shows a subtle pencil on hover, expands to textarea on click
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

  function commit() {
    onSave(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

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
            className="min-h-[72px] resize-y border-indigo-200 bg-white text-[12px] focus-visible:ring-indigo-300"
            autoFocus
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="border-indigo-200 bg-white text-[12px] focus-visible:ring-indigo-300"
            autoFocus
          />
        )}
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            onClick={commit}
            className="h-7 gap-1.5 text-[11px]"
          >
            <Check className="h-3 w-3" /> Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancel}
            className="h-7 text-[11px]"
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

function EditJsonField({
  label,
  value,
  expected,
  onSave,
}: {
  label: string;
  value: unknown;
  expected: "array" | "object";
  onSave: (value: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  function begin() {
    setDraft(JSON.stringify(value, null, 2));
    setError(null);
    setEditing(true);
  }

  function commit() {
    try {
      const parsed: unknown = JSON.parse(draft);
      const isValid =
        expected === "array"
          ? Array.isArray(parsed)
          : Boolean(parsed) &&
            typeof parsed === "object" &&
            !Array.isArray(parsed);
      if (!isValid) throw new Error(`Value must be a JSON ${expected}.`);
      onSave(parsed);
      setEditing(false);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Invalid JSON");
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={begin}
        className="group w-full rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-left transition hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900/60"
      >
        <span className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
        </span>
        <pre className="max-h-36 overflow-auto whitespace-pre-wrap text-[10px] text-slate-600 dark:text-slate-300">
          {JSON.stringify(value, null, 2)}
        </pre>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 dark:bg-indigo-950/20">
      <SectionLabel>{label}</SectionLabel>
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="min-h-36 bg-white font-mono text-[11px] dark:bg-slate-950"
        autoFocus
      />
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <Button size="sm" className="h-7" onClick={commit}>
          <Check className="mr-1 h-3 w-3" /> Apply
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function StateSelect({
  label,
  value,
  fields,
  onChange,
}: {
  label: string;
  value?: string;
  fields: string[];
  onChange: (value: string | undefined) => void;
}) {
  return (
    <label className="grid gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
      {label}
      <select
        className="h-9 rounded-md border bg-background px-2 font-mono text-xs normal-case tracking-normal text-foreground"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || undefined)}
      >
        <option value="">Not set</option>
        {fields.map((field) => (
          <option key={field} value={field}>
            {field}
          </option>
        ))}
      </select>
    </label>
  );
}

function CollectMappingsEditor({
  value,
  fields,
  onSave,
}: {
  value: Record<string, CollectField>;
  fields: string[];
  onSave: (value: Record<string, CollectField>) => void;
}) {
  const [alias, setAlias] = useState("");
  const entries = Object.entries(value);
  const update = (name: string, field: CollectField) =>
    onSave({ ...value, [name]: field });
  return (
    <div className="space-y-2">
      <SectionLabel>Values to collect</SectionLabel>
      {entries.map(([name, field]) => (
        <div key={name} className="space-y-2 rounded-xl border p-3">
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-xs font-semibold">{name}</code>
            <button
              type="button"
              className="text-red-400"
              onClick={() =>
                onSave(Object.fromEntries(entries.filter(([key]) => key !== name)))
              }
              title="Remove collected value"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <select
            aria-label={`State field for ${name}`}
            className="h-9 w-full rounded-md border bg-background px-2 font-mono text-xs"
            value={field.state}
            onChange={(event) => update(name, { ...field, state: event.target.value })}
          >
            <option value="">Choose state field</option>
            {fields.map((path) => <option key={path}>{path}</option>)}
          </select>
          <Input
            aria-label={`Description for ${name}`}
            value={String(field.schema?.description ?? "")}
            onChange={(event) =>
              update(name, {
                ...field,
                schema: {
                  ...(field.schema ?? { type: "string" }),
                  type: String(field.schema?.type ?? "string"),
                  description: event.target.value,
                },
              })
            }
            placeholder="What the agent must collect and verify"
            className="h-8 text-xs"
          />
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={alias}
          onChange={(event) => setAlias(event.target.value)}
          placeholder="Argument name, e.g. appointment_id"
          className="h-8 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={!alias.trim() || !fields.length || Boolean(value[alias.trim()])}
          onClick={() => {
            const name = alias.trim();
            update(name, { state: fields[0], schema: { type: "string", description: "" } });
            setAlias("");
          }}
        >
          <Plus className="mr-1 h-3 w-3" /> Add
        </Button>
      </div>
    </div>
  );
}

function ActionArgumentsEditor({
  value,
  tool,
  fields,
  onSave,
}: {
  value: Record<string, string>;
  tool?: AgentTool;
  fields: string[];
  onSave: (value: Record<string, string>) => void;
}) {
  const parameters = Object.entries(tool?.parameters ?? {});
  if (!tool)
    return <p className="text-xs text-amber-600">Choose an action tool first.</p>;
  if (!parameters.length)
    return <p className="text-xs text-slate-400">This tool exposes no configurable arguments.</p>;
  return (
    <div className="space-y-2">
      <SectionLabel>Action argument mappings</SectionLabel>
      {parameters.map(([name, schema]) => {
        const current = value[name] ?? "";
        return (
          <div key={name} className="space-y-1.5 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-semibold">{name}</code>
              <Pill className={schema.required ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}>
                {schema.required ? "required" : "optional"}
              </Pill>
            </div>
            {schema.description && <p className="text-[10px] text-slate-500">{schema.description}</p>}
            <select
              aria-label={`Map ${name} to state`}
              className="h-8 w-full rounded-md border bg-background px-2 font-mono text-xs"
              value={fields.some((path) => current === `{state.${path}}`) ? current : ""}
              onChange={(event) => {
                const next = { ...value };
                if (event.target.value) next[name] = event.target.value;
                else delete next[name];
                onSave(next);
              }}
            >
              <option value="">Omit / custom value below</option>
              {fields.map((path) => (
                <option key={path} value={`{state.${path}}`}>{path}</option>
              ))}
            </select>
            <Input
              aria-label={`Template for ${name}`}
              value={current}
              onChange={(event) => {
                const next = { ...value };
                if (event.target.value) next[name] = event.target.value;
                else delete next[name];
                onSave(next);
              }}
              placeholder={`{state.${fields[0] ?? "field"}} or a fixed value`}
              className="h-8 font-mono text-xs"
            />
          </div>
        );
      })}
    </div>
  );
}

function CompletionValidatorsEditor({
  value,
  tools,
  collectAliases,
  onSave,
}: {
  value: CompletionValidator[];
  tools: AgentTool[];
  collectAliases: string[];
  onSave: (value: CompletionValidator[]) => void;
}) {
  const update = (index: number, patch: Partial<CompletionValidator>) =>
    onSave(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  return (
    <div className="space-y-2">
      <SectionLabel>Completion validators</SectionLabel>
      {value.map((validator, index) => (
        <div key={index} className="space-y-2 rounded-xl border p-3">
          <div className="flex justify-end">
            <button type="button" className="text-red-400" onClick={() => onSave(value.filter((_, i) => i !== index))}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <select className="h-8 w-full rounded-md border bg-background px-2 text-xs" value={validator.type} onChange={(event) => update(index, { type: event.target.value })}>
            <option value="equals_tool_argument">Equals tool argument</option>
            <option value="value_in_tool_response">Value in tool response</option>
          </select>
          <select className="h-8 w-full rounded-md border bg-background px-2 font-mono text-xs" value={validator.field} onChange={(event) => update(index, { field: event.target.value })}>
            <option value="">Collected value</option>
            {collectAliases.map((name) => <option key={name}>{name}</option>)}
          </select>
          <select className="h-8 w-full rounded-md border bg-background px-2 font-mono text-xs" value={validator.tool} onChange={(event) => update(index, { tool: event.target.value })}>
            <option value="">Verification tool</option>
            {tools.map((tool) => <option key={tool.name}>{tool.name}</option>)}
          </select>
          {validator.type === "equals_tool_argument" ? (
            <Input value={validator.argument ?? ""} onChange={(event) => update(index, { argument: event.target.value, paths: undefined })} placeholder="Tool argument name" className="h-8 font-mono text-xs" />
          ) : (
            <Input value={(validator.paths ?? []).join(", ")} onChange={(event) => update(index, { paths: event.target.value.split(",").map((path) => path.trim()).filter(Boolean), argument: undefined })} placeholder="Response paths, comma separated" className="h-8 font-mono text-xs" />
          )}
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" className="h-8 w-full" disabled={!collectAliases.length || !tools.length} onClick={() => onSave([...value, { type: "equals_tool_argument", field: collectAliases[0], tool: tools[0].name, argument: "" }])}>
        <Plus className="mr-1 h-3 w-3" /> Add validator
      </Button>
    </div>
  );
}

// Editable ordered list
function EditList({
  label,
  items,
  onSave,
}: {
  label: string;
  items: string[];
  onSave: (updated: string[]) => void;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div>
      <SectionLabel>
        {label}{" "}
        <span className="ml-1 font-mono text-slate-300">({items.length})</span>
      </SectionLabel>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl border text-[12px] transition-all",
              editingIdx === i
                ? "border-indigo-200 bg-indigo-50/40 p-3"
                : "border-slate-100 bg-slate-50/60 px-3 py-2",
            )}
          >
            {editingIdx === i ? (
              <>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-[72px] resize-y border-indigo-200 bg-white text-[12px]"
                  autoFocus
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 gap-1.5 text-[11px]"
                    onClick={() => {
                      const next = [...items];
                      next[i] = draft;
                      onSave(next);
                      setEditingIdx(null);
                    }}
                  >
                    <Check className="h-3 w-3" /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px]"
                    onClick={() => setEditingIdx(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="group flex items-start gap-2">
                <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                <p
                  className="flex-1 cursor-pointer leading-relaxed text-slate-700"
                  onClick={() => {
                    setEditingIdx(i);
                    setDraft(item);
                  }}
                >
                  {item}
                </p>
                <button
                  className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                  onClick={() => onSave(items.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={() => {
            const next = [...items, ""];
            onSave(next);
            setEditingIdx(next.length - 1);
            setDraft("");
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2 text-[11px] text-slate-400 transition hover:border-indigo-200 hover:text-indigo-500"
        >
          <Plus className="h-3 w-3" /> Add item
        </button>
      </div>
    </div>
  );
}

// ─── Main inspector ───────────────────────────────────────────────────────────

interface TaskInspectorProps {
  taskId: string;
  workflowId: string;
  task: Task;
  jsonObject: AgentJsonObject;
  availableTools: AgentTool[];
  onUpdate: (updater: (prev: AgentJsonObject) => AgentJsonObject) => void;
  focusTab?: TabId;
  focusRequestId?: number;
}

const KIND_STYLE: Record<string, { bg: string; text: string; border: string }> =
  {
    collect: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-100",
    },
    action: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-100",
    },
    answer: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-100" },
  };
const DEFAULT_KIND_STYLE = {
  bg: "bg-slate-100",
  text: "text-slate-600",
  border: "border-slate-200",
};

export function TaskInspector({
  taskId,
  workflowId,
  task,
  jsonObject,
  availableTools,
  onUpdate,
  focusTab,
  focusRequestId,
}: TaskInspectorProps) {
  const [activeTab, setActiveTab] = useState<TabId>(focusTab ?? "overview");

  useEffect(() => {
    if (focusTab) setActiveTab(focusTab);
  }, [focusRequestId, focusTab]);

  const stateRefs = getTaskStateReferences(task);
  const collectFields = task.collect ? Object.entries(task.collect) : [];
  const ks = KIND_STYLE[task.kind] ?? DEFAULT_KIND_STYLE;

  function updateField(key: string, value: unknown) {
    onUpdate((prev) => {
      const next = structuredClone(prev);
      if (next.workflows?.[workflowId]?.task_group?.[taskId]) {
        next.workflows[workflowId].task_group[taskId] = {
          ...next.workflows[workflowId].task_group[taskId],
          [key]: value,
        };
      }
      return next;
    });
  }

  function deleteTask() {
    if (!window.confirm(`Delete task “${taskId}”?`)) return;
    try {
      onUpdate((current) => removeTask(current, workflowId, taskId));
    } catch (reason) {
      window.alert(
        reason instanceof Error ? reason.message : "Could not delete task",
      );
    }
  }

  function setAsEntryTask() {
    onUpdate((previous) => {
      const next = structuredClone(previous);
      const workflow = next.workflows?.[workflowId];
      if (!workflow) return previous;
      next.schema_version = 2;
      next.architecture = "supervisor";
      workflow.entry_task_id = taskId;
      workflow.task_edges ??= workflow.task_order.slice(1).map((target, index) => ({
        id: `${workflow.task_order[index]}_to_${target}`,
        source: workflow.task_order[index],
        target,
      }));
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar — horizontally scrollable so all 6 tabs always reachable */}
      <div className="shrink-0 border-b border-slate-100 bg-white">
        <div className="flex overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-[12px] font-medium transition-colors whitespace-nowrap",
                activeTab === t.id
                  ? "text-slate-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500 after:rounded-full"
                  : "text-slate-400 hover:text-slate-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Kind + ID badge row */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  ks.bg,
                  ks.text,
                  ks.border,
                )}
              >
                {task.kind}
              </span>
              <span className="font-mono text-[12px] font-semibold text-slate-500">
                {taskId}
              </span>
            </div>

            <EditField
              label="Description"
              value={task.description ?? ""}
              onSave={(v) => updateField("description", v)}
            />
            {jsonObject.workflows?.[workflowId]?.task_edges && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={jsonObject.workflows[workflowId].entry_task_id === taskId}
                onClick={setAsEntryTask}
              >
                {jsonObject.workflows[workflowId].entry_task_id === taskId
                  ? "Entry task"
                  : "Set as entry task"}
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={deleteTask}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete task
            </Button>

            {/* Collect-specific */}
            {task.kind === "collect" && collectFields.length > 0 && (
              <div>
                <SectionLabel>Collected variables</SectionLabel>
                <div className="space-y-2">
                  {collectFields.map(([name, field]) => {
                    const globalSchema =
                      jsonObject.state?.fields?.[field.state];
                    return (
                      <div
                        key={name}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-semibold text-slate-800">
                            {name}
                          </span>
                          <ChevronRight className="h-3 w-3 text-slate-300" />
                          <span className="font-mono text-[11px] text-violet-500">
                            {field.state}
                          </span>
                          <label className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
                            <input
                              type="checkbox"
                              checked={field.required !== false}
                              onChange={(event) =>
                                onUpdate((previous) => {
                                  const next = structuredClone(previous);
                                  const collect = next.workflows?.[workflowId]?.task_group?.[taskId]?.collect;
                                  if (!collect?.[name]) return previous;
                                  collect[name].required = event.target.checked;
                                  return next;
                                })
                              }
                            />
                            required
                          </label>
                        </div>
                        {field.schema && (
                          <div className="mt-2">
                            <p className="mb-1 text-[10px] font-medium text-slate-400">
                              Local schema
                            </p>
                            <pre className="overflow-x-auto rounded-lg bg-white px-2.5 py-2 text-[10px] text-slate-600 ring-1 ring-slate-100">
                              {JSON.stringify(field.schema, null, 2)}
                            </pre>
                          </div>
                        )}
                        {globalSchema && (
                          <div className="mt-2">
                            <p className="mb-1 text-[10px] font-medium text-violet-400">
                              Global state schema
                            </p>
                            <pre className="overflow-x-auto rounded-lg bg-violet-50/60 px-2.5 py-2 text-[10px] text-violet-700 ring-1 ring-violet-100">
                              {JSON.stringify(globalSchema, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {task.kind === "collect" && (
              <CollectMappingsEditor
                value={task.collect ?? {}}
                fields={Object.keys(jsonObject.state?.fields ?? {})}
                onSave={(value) => updateField("collect", value)}
              />
            )}

            {/* Action-specific */}
            {task.kind === "action" && (
              <div className="space-y-3">
                {task.action_tool && (
                  <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                    <SectionLabel>Action tool</SectionLabel>
                    <p className="font-mono text-sm font-bold text-rose-700">
                      {task.action_tool}
                    </p>
                    {getProgressPhrase(task.action_tool, jsonObject) && (
                      <p className="mt-1.5 text-[11px] italic text-rose-400">
                        &ldquo;{getProgressPhrase(task.action_tool, jsonObject)}
                        &rdquo;
                      </p>
                    )}
                  </div>
                )}
                {task.required_state && task.required_state.length > 0 && (
                  <div>
                    <SectionLabel>Required state</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {task.required_state.map((s) => (
                        <Pill
                          key={s}
                          className="bg-violet-50 text-violet-700 ring-1 ring-violet-100"
                        >
                          {s}
                        </Pill>
                      ))}
                    </div>
                  </div>
                )}
                <ActionArgumentsEditor
                  value={task.action_arguments ?? {}}
                  tool={availableTools.find((tool) => tool.name === task.action_tool)}
                  fields={Object.keys(jsonObject.state?.fields ?? {})}
                  onSave={(value) => updateField("action_arguments", value)}
                />
              </div>
            )}

            {/* Answer-specific */}
            {task.kind === "answer" && (
              <div className="space-y-3">
                {task.answer_tool && (
                  <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                    <SectionLabel>Answer tool</SectionLabel>
                    <p className="font-mono text-sm font-bold text-sky-700">
                      {task.answer_tool}
                    </p>
                    {getProgressPhrase(task.answer_tool, jsonObject) && (
                      <p className="mt-1.5 text-[11px] italic text-sky-400">
                        &ldquo;{getProgressPhrase(task.answer_tool, jsonObject)}
                        &rdquo;
                      </p>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {task.question_state && (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50/60 px-3 py-2 ring-1 ring-slate-100">
                      <span className="text-[11px] text-slate-400">Input</span>
                      <span className="font-mono text-[11px] font-semibold text-violet-600">
                        {task.question_state}
                      </span>
                    </div>
                  )}
                  {task.answer_state && (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50/60 px-3 py-2 ring-1 ring-slate-100">
                      <span className="text-[11px] text-slate-400">Output</span>
                      <span className="font-mono text-[11px] font-semibold text-violet-600">
                        {task.answer_state}
                      </span>
                    </div>
                  )}
                </div>
                {task.fallback_answer && (
                  <EditField
                    label="Fallback answer"
                    value={task.fallback_answer}
                    onSave={(v) => updateField("fallback_answer", v)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Instructions ── */}
        {activeTab === "instructions" && (
          <div className="space-y-4">
            <EditField
              label="Entry prompt"
              value={task.entry_prompt ?? ""}
              onSave={(v) => updateField("entry_prompt", v)}
            />
            <EditField
              label="On enter instructions"
              value={task.on_enter_instructions ?? ""}
              onSave={(v) => updateField("on_enter_instructions", v)}
            />
            <EditList
              label="Instructions"
              items={task.instructions ?? []}
              onSave={(v) => updateField("instructions", v)}
            />
          </div>
        )}

        {/* ── Tools ── */}
        {activeTab === "tools" && (
          <div className="space-y-5">
            <div>
              <SectionLabel>Assigned tools</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {availableTools.map((tool) => {
                  const selected = (task.tools ?? []).includes(tool.name);
                  return (
                    <button
                      key={tool.name}
                      type="button"
                      title={tool.description}
                      onClick={() =>
                        updateField(
                          "tools",
                          selected
                            ? (task.tools ?? []).filter(
                                (name) => name !== tool.name,
                              )
                            : [...(task.tools ?? []), tool.name],
                        )
                      }
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 font-mono text-[10px]",
                        selected
                          ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                          : "border-slate-200 text-slate-500 dark:border-slate-700",
                      )}
                    >
                      {tool.name}
                    </button>
                  );
                })}
              </div>
              {!availableTools.length && (
                <p className="text-[11px] text-amber-600">
                  No tools are assigned to this agent.
                </p>
              )}
            </div>
            {task.kind === "action" && (
              <div>
                <SectionLabel>Primary action tool</SectionLabel>
                <select
                  className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                  value={task.action_tool ?? ""}
                  onChange={(event) =>
                    updateField("action_tool", event.target.value || undefined)
                  }
                >
                  <option value="">Choose a tool</option>
                  {availableTools.map((tool) => (
                    <option key={tool.name} value={tool.name}>
                      {tool.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {task.kind === "answer" && (
              <div>
                <SectionLabel>Answer tool</SectionLabel>
                <select
                  className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                  value={task.answer_tool ?? ""}
                  onChange={(event) =>
                    updateField("answer_tool", event.target.value || undefined)
                  }
                >
                  <option value="">Choose a tool</option>
                  {availableTools.map((tool) => (
                    <option key={tool.name} value={tool.name}>
                      {tool.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {task.tools && task.tools.length > 0 && (
              <div>
                <SectionLabel>Available tools</SectionLabel>
                <div className="space-y-1.5">
                  {task.tools.map((t) => (
                    <ToolRow
                      key={t}
                      name={t}
                      phrase={getProgressPhrase(t, jsonObject)}
                      accent="amber"
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <SectionLabel>Required tool calls before completion</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {availableTools.map((tool) => {
                  const selected = (
                    task.required_tool_calls_before_complete ?? []
                  ).includes(tool.name);
                  return (
                    <button
                      key={tool.name}
                      type="button"
                      onClick={() =>
                        updateField(
                          "required_tool_calls_before_complete",
                          selected
                            ? (
                                task.required_tool_calls_before_complete ?? []
                              ).filter((name) => name !== tool.name)
                            : [
                                ...(task.required_tool_calls_before_complete ??
                                  []),
                                tool.name,
                              ],
                        )
                      }
                      className={cn(
                        "rounded-md border px-2 py-1 font-mono text-[10px]",
                        selected
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50"
                          : "border-slate-200 text-slate-500 dark:border-slate-700",
                      )}
                    >
                      {tool.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <CompletionValidatorsEditor
              value={task.completion_validators ?? []}
              tools={availableTools}
              collectAliases={Object.keys(task.collect ?? {})}
              onSave={(value) => updateField("completion_validators", value)}
            />
            {task.action_tool && (
              <div>
                <SectionLabel>Primary action tool</SectionLabel>
                <ToolRow
                  name={task.action_tool}
                  phrase={getProgressPhrase(task.action_tool, jsonObject)}
                  accent="rose"
                />
              </div>
            )}
            {task.answer_tool && (
              <div>
                <SectionLabel>Answer tool</SectionLabel>
                <ToolRow
                  name={task.answer_tool}
                  phrase={getProgressPhrase(task.answer_tool, jsonObject)}
                  accent="sky"
                />
              </div>
            )}
            {task.required_tool_calls_before_complete &&
              task.required_tool_calls_before_complete.length > 0 && (
                <div>
                  <SectionLabel>Required before completion</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {task.required_tool_calls_before_complete.map((t) => (
                      <Pill
                        key={t}
                        className="bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                      >
                        {t}
                      </Pill>
                    ))}
                  </div>
                </div>
              )}
            {task.completion_validators &&
              task.completion_validators.length > 0 && (
                <div>
                  <SectionLabel>
                    Completion validators ({task.completion_validators.length})
                  </SectionLabel>
                  <div className="space-y-1.5">
                    {task.completion_validators.map((v, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"
                      >
                        <p className="text-[11px] font-semibold text-emerald-700">
                          {v.type}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                          field: {v.field} · tool: {v.tool}
                          {v.argument && ` · arg: ${v.argument}`}
                        </p>
                        {v.paths && (
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                            paths: {v.paths.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {!task.tools?.length && !task.action_tool && !task.answer_tool && (
              <p className="text-[12px] text-slate-400">No tools configured</p>
            )}
          </div>
        )}

        {/* ── Variables ── */}
        {activeTab === "variables" && (
          <div className="space-y-3">
            <div>
              <SectionLabel>Required state</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(jsonObject.state?.fields ?? {}).map((path) => {
                  const selected = (task.required_state ?? []).includes(path);
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() =>
                        updateField(
                          "required_state",
                          selected
                            ? (task.required_state ?? []).filter(
                                (item) => item !== path,
                              )
                            : [...(task.required_state ?? []), path],
                        )
                      }
                      className={cn(
                        "rounded-md border px-2 py-1 font-mono text-[10px]",
                        selected
                          ? "border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/50"
                          : "border-slate-200 text-slate-500 dark:border-slate-700",
                      )}
                    >
                      {path}
                    </button>
                  );
                })}
              </div>
            </div>
            {task.kind === "action" && (
              <>
                <StateSelect
                  label="Response state"
                  value={task.response_state}
                  fields={Object.keys(jsonObject.state?.fields ?? {})}
                  onChange={(value) => updateField("response_state", value)}
                />
                <ActionArgumentsEditor
                  value={task.action_arguments ?? {}}
                  tool={availableTools.find((tool) => tool.name === task.action_tool)}
                  fields={Object.keys(jsonObject.state?.fields ?? {})}
                  onSave={(value) => updateField("action_arguments", value)}
                />
              </>
            )}
            {task.kind === "answer" && (
              <>
                <StateSelect
                  label="Question state"
                  value={task.question_state}
                  fields={Object.keys(jsonObject.state?.fields ?? {})}
                  onChange={(value) => updateField("question_state", value)}
                />
                <StateSelect
                  label="Answer state"
                  value={task.answer_state}
                  fields={Object.keys(jsonObject.state?.fields ?? {})}
                  onChange={(value) => updateField("answer_state", value)}
                />
                <EditField
                  label="Question argument"
                  value={task.question_argument ?? ""}
                  multiline={false}
                  onSave={(value) =>
                    updateField("question_argument", value || undefined)
                  }
                />
                <EditJsonField
                  label="Answer paths"
                  value={task.answer_paths ?? []}
                  expected="array"
                  onSave={(value) => updateField("answer_paths", value)}
                />
              </>
            )}
            {stateRefs.length === 0 ? (
              <p className="text-[12px] text-slate-400">No state references</p>
            ) : (
              stateRefs.map((path) => {
                const globalField = jsonObject.state?.fields?.[path];
                const deps = jsonObject.state?.dependencies?.[path] ?? [];
                return (
                  <div
                    key={path}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                  >
                    <p className="font-mono text-[12px] font-semibold text-violet-600">
                      {path}
                    </p>
                    {globalField && (
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-violet-50/60 px-2.5 py-2 text-[10px] text-violet-700 ring-1 ring-violet-100">
                        {JSON.stringify(globalField, null, 2)}
                      </pre>
                    )}
                    {deps.length > 0 && (
                      <p className="mt-1.5 text-[10px] text-slate-400">
                        Invalidates → {deps.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Transitions ── */}
        {activeTab === "transitions" && (
          <div className="space-y-3">
            {[
              {
                key: "confirmation_question",
                label: "Confirmation question",
                badge: "CONFIRM",
                badgeColor: "bg-amber-50 text-amber-700 ring-amber-100",
              },
              {
                key: "success_message",
                label: "Success message",
                badge: "SUCCESS",
                badgeColor: "bg-emerald-50 text-emerald-700 ring-emerald-100",
              },
              {
                key: "cancel_message",
                label: "Cancel message",
                badge: "CANCEL",
                badgeColor: "bg-red-50 text-red-600 ring-red-100",
              },
              {
                key: "summary_template",
                label: "Summary template",
                badge: "SUMMARY",
                badgeColor: "bg-slate-100 text-slate-600 ring-slate-200",
              },
              {
                key: "fallback_answer",
                label: "Fallback answer",
                badge: "FALLBACK",
                badgeColor: "bg-sky-50 text-sky-700 ring-sky-100",
              },
            ].map(({ key, label, badge, badgeColor }) => {
              const val = (task as Record<string, unknown>)[key] as
                string | undefined;
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <Pill className={cn("ring-1", badgeColor)}>{badge}</Pill>
                  </div>
                  <EditField
                    label={label}
                    value={val ?? ""}
                    onSave={(v) => updateField(key, v || undefined)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Raw JSON ── */}
        {activeTab === "raw" && (
          <div className="h-[calc(100vh-200px)] min-h-[300px]">
            <JsonInspector
              title={`workflows.${workflowId}.task_group.${taskId}`}
              value={task}
              onApply={(parsed) =>
                onUpdate((prev) => {
                  const next = structuredClone(prev);
                  if (next.workflows?.[workflowId]?.task_group) {
                    next.workflows[workflowId].task_group[taskId] =
                      parsed as unknown as Task;
                  }
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

function ToolRow({
  name,
  phrase,
  accent,
}: {
  name: string;
  phrase: string | undefined;
  accent: "amber" | "rose" | "sky";
}) {
  const styles = {
    amber: "border-amber-100 bg-amber-50/60 text-amber-700",
    rose: "border-rose-100  bg-rose-50/60  text-rose-700",
    sky: "border-sky-100   bg-sky-50/60   text-sky-700",
  };
  return (
    <div className={cn("rounded-xl border p-3", styles[accent])}>
      <p className="font-mono text-[12px] font-semibold">{name}</p>
      {phrase && (
        <p className="mt-1 text-[11px] italic opacity-70">
          &ldquo;{phrase}&rdquo;
        </p>
      )}
    </div>
  );
}
