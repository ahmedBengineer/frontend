"use client";

import React from "react";
import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AgentJsonObject, StateField } from "../types";
import { STATE_PATH_PATTERN } from "../utils/editorMutations";
import { findStateReferences } from "../utils/validation";

export function VariableInspector({
  jsonObject,
  onUpdate,
}: {
  jsonObject: AgentJsonObject;
  onUpdate: (updater: (current: AgentJsonObject) => AgentJsonObject) => void;
}) {
  const fields = jsonObject.state?.fields ?? {};
  const dependencies = jsonObject.state?.dependencies ?? {};
  const [newId, setNewId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function updateField(id: string, patch: Partial<StateField>) {
    onUpdate((current) => {
      const next = structuredClone(current);
      if (!next.state?.fields[id]) return current;
      next.state.fields[id] = { ...next.state.fields[id], ...patch };
      return next;
    });
  }

  function addField() {
    const id = newId.trim();
    if (!STATE_PATH_PATTERN.test(id))
      return setError(
        "Use lowercase path segments separated by dots, for example booking.patient_name",
      );
    if (fields[id]) return setError("Field ID already exists");
    onUpdate((current) => {
      const next = structuredClone(current);
      next.state ??= { fields: {} };
      next.state.fields ??= {};
      next.state.fields[id] = { type: "string", nullable: true };
      return next;
    });
    setNewId("");
    setError(null);
  }

  function deleteField(id: string) {
    const references = findStateReferences(jsonObject, id);
    if (references.length)
      return setError(`Cannot delete ${id}; used by ${references.join(", ")}`);
    if (Object.keys(fields).length <= 1)
      return setError("The runtime requires at least one state field");
    if (!window.confirm(`Delete state field “${id}”?`)) return;
    onUpdate((current) => {
      const next = structuredClone(current);
      delete next.state!.fields[id];
      delete next.state!.dependencies?.[id];
      return next;
    });
  }

  function toggleDependency(source: string, target: string, enabled: boolean) {
    onUpdate((current) => {
      const next = structuredClone(current);
      next.state ??= { fields: {} };
      next.state.dependencies ??= {};
      const values = new Set(next.state.dependencies[source] ?? []);
      if (enabled) values.add(target);
      else values.delete(target);
      if (values.size) next.state.dependencies[source] = [...values];
      else delete next.state.dependencies[source];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed p-3 dark:border-slate-700">
        <Label htmlFor="new-state-field" className="text-xs">
          New state field
        </Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="new-state-field"
            value={newId}
            onChange={(event) => setNewId(event.target.value)}
            placeholder="patient_name"
            className="h-8 text-xs"
          />
          <Button size="sm" className="h-8" onClick={addField}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>
      {error && (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}
      {Object.entries(fields).map(([id, schema]) => (
        <section
          key={id}
          className="space-y-3 rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-900/60"
        >
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs font-semibold text-violet-600 dark:text-violet-300">
              {id}
            </code>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-500"
              onClick={() => deleteField(id)}
              title="Delete state field"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-[10px]">Type</Label>
              <select
                className="h-8 rounded-md border bg-background px-2 text-xs"
                value={schema.type}
                onChange={(event) =>
                  updateField(id, { type: event.target.value })
                }
              >
                {[
                  "string",
                  "number",
                  "integer",
                  "boolean",
                  "object",
                  "array",
                ].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-between rounded-md border px-2 py-1.5 dark:border-slate-700">
              <Label className="text-[10px]">Nullable</Label>
              <Switch
                checked={schema.nullable === true}
                onCheckedChange={(checked) =>
                  updateField(id, { nullable: checked })
                }
              />
            </div>
          </div>
          {schema.type === "string" && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                value={schema.minLength ?? ""}
                onChange={(event) =>
                  updateField(id, {
                    minLength: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  })
                }
                placeholder="Min length"
                className="h-8 text-xs"
              />
              <Input
                type="number"
                min={0}
                value={schema.maxLength ?? ""}
                onChange={(event) =>
                  updateField(id, {
                    maxLength: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  })
                }
                placeholder="Max length"
                className="h-8 text-xs"
              />
              <Input
                value={schema.pattern ?? ""}
                onChange={(event) =>
                  updateField(id, { pattern: event.target.value || undefined })
                }
                placeholder="Regex pattern"
                className="col-span-2 h-8 text-xs"
              />
              <Input
                value={schema.error ?? ""}
                onChange={(event) =>
                  updateField(id, { error: event.target.value || undefined })
                }
                placeholder="Validation message"
                className="col-span-2 h-8 text-xs"
              />
              <Input
                value={(schema.normalizers ?? []).join(", ")}
                onChange={(event) =>
                  updateField(id, {
                    normalizers: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Normalizers: strip, collapse_spaces"
                className="col-span-2 h-8 text-xs"
              />
            </div>
          )}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Changing this field invalidates
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(fields)
                .filter((target) => target !== id)
                .map((target) => {
                  const checked = (dependencies[id] ?? []).includes(target);
                  return (
                    <button
                      key={target}
                      type="button"
                      onClick={() => toggleDependency(id, target, !checked)}
                      className={`rounded-md border px-2 py-1 font-mono text-[10px] ${checked ? "border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200" : "border-slate-200 text-slate-500 dark:border-slate-700"}`}
                    >
                      {target}
                    </button>
                  );
                })}
            </div>
          </div>
        </section>
      ))}
      <div className="flex items-center gap-1 text-[10px] text-slate-400">
        <Save className="h-3 w-3" /> Changes are saved with the workflow.
      </div>
    </div>
  );
}
