"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  AgentJsonObject,
  LinearCondition,
  LinearConditionLeaf,
  SupervisorTaskEdge,
} from "../types";

const OPERATORS: LinearConditionLeaf["operator"][] = [
  "equals",
  "not_equals",
  "exists",
  "not_exists",
  "in",
  "contains",
  "gt",
  "gte",
  "lt",
  "lte",
];

export function SupervisorEdgeInspector({
  workflowId,
  edgeId,
  jsonObject,
  onUpdate,
}: {
  workflowId: string;
  edgeId: string;
  jsonObject: AgentJsonObject;
  onUpdate: (updater: (previous: AgentJsonObject) => AgentJsonObject) => void;
}) {
  const workflow = jsonObject.workflows?.[workflowId];
  const edge = workflow?.task_edges?.find((item) => item.id === edgeId);
  const [rawCondition, setRawCondition] = useState("");
  const [conditionError, setConditionError] = useState<string | null>(null);

  useEffect(() => {
    setRawCondition(JSON.stringify(edge?.condition ?? {}, null, 2));
    setConditionError(null);
  }, [edge?.condition]);

  if (!workflow || !edge) return null;
  const fields = Object.keys(jsonObject.state?.fields ?? {});
  const tasks = Object.keys(workflow.task_group);
  const leaf =
    edge.condition && "path" in edge.condition ? edge.condition : undefined;

  const updateEdge = (changes: Partial<SupervisorTaskEdge>) => {
    onUpdate((previous) => {
      const next = structuredClone(previous);
      const targetWorkflow = next.workflows?.[workflowId];
      if (!targetWorkflow?.task_edges) return previous;
      targetWorkflow.task_edges = targetWorkflow.task_edges.map((item) =>
        item.id === edgeId ? { ...item, ...changes } : item,
      );
      return next;
    });
  };

  const setDefault = (checked: boolean) => {
    onUpdate((previous) => {
      const next = structuredClone(previous);
      const targetWorkflow = next.workflows?.[workflowId];
      if (!targetWorkflow?.task_edges) return previous;
      targetWorkflow.task_edges = targetWorkflow.task_edges.map((item) => {
        if (item.source !== edge.source) return item;
        if (item.id === edgeId) {
          const updated = { ...item, default: checked };
          if (checked) delete updated.condition;
          return updated;
        }
        return checked ? { ...item, default: false } : item;
      });
      return next;
    });
  };

  const applyCondition = () => {
    try {
      const parsed = JSON.parse(rawCondition) as LinearCondition;
      updateEdge({ condition: parsed, default: false });
      setConditionError(null);
    } catch {
      setConditionError("Condition must be valid JSON.");
    }
  };

  const remove = () => {
    onUpdate((previous) => {
      const next = structuredClone(previous);
      const targetWorkflow = next.workflows?.[workflowId];
      if (!targetWorkflow?.task_edges) return previous;
      targetWorkflow.task_edges = targetWorkflow.task_edges.filter(
        (item) => item.id !== edgeId,
      );
      return next;
    });
  };

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4 text-xs">
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-600">Label</label>
        <Input
          value={edge.label ?? ""}
          onChange={(event) => updateEdge({ label: event.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-600">Source</label>
          <Input value={edge.source} disabled className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-600">Target</label>
          <select
            className="h-10 w-full rounded-md border bg-background px-2 font-mono"
            value={edge.target}
            onChange={(event) => updateEdge({ target: event.target.value })}
          >
            {tasks.map((taskId) => (
              <option key={taskId} value={taskId}>{taskId}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 rounded-lg border p-3">
        <input
          type="checkbox"
          checked={Boolean(edge.default)}
          onChange={(event) => setDefault(event.target.checked)}
        />
        Default branch
      </label>
      {!edge.default && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">State path</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-2 font-mono"
                value={leaf?.path ?? fields[0] ?? ""}
                onChange={(event) =>
                  updateEdge({
                    default: false,
                    condition: {
                      path: event.target.value,
                      operator: leaf?.operator ?? "exists",
                      ...(leaf && "value" in leaf ? { value: leaf.value } : {}),
                    },
                  })
                }
              >
                {fields.map((field) => <option key={field} value={field}>{field}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">Operator</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-2"
                value={leaf?.operator ?? "exists"}
                onChange={(event) =>
                  updateEdge({
                    default: false,
                    condition: {
                      path: leaf?.path ?? fields[0] ?? "",
                      operator: event.target.value as LinearConditionLeaf["operator"],
                      ...(leaf && "value" in leaf ? { value: leaf.value } : {}),
                    },
                  })
                }
              >
                {OPERATORS.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-600">Condition JSON</label>
            <Textarea
              value={rawCondition}
              onChange={(event) => setRawCondition(event.target.value)}
              className="min-h-32 font-mono text-[11px]"
            />
            {conditionError && <p className="text-red-600">{conditionError}</p>}
            <Button size="sm" variant="outline" onClick={applyCondition}>Apply condition</Button>
          </div>
        </>
      )}
      <Button variant="destructive" size="sm" onClick={remove}>Delete transition</Button>
    </div>
  );
}
