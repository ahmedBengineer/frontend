"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AgentTool, LinearEdge, LinearNode } from "../types";

function JsonField({
  label,
  value,
  onApply,
}: {
  label: string;
  value: unknown;
  onApply: (value: unknown) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState("");
  useEffect(() => setText(JSON.stringify(value ?? {}, null, 2)), [value]);
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-28 font-mono text-[10px]" />
      {error && <p className="text-[10px] text-red-600">{error}</p>}
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-[10px]"
        onClick={() => {
          try {
            onApply(JSON.parse(text));
            setError("");
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Invalid JSON");
          }
        }}
      >
        Apply {label}
      </Button>
    </div>
  );
}

export function LinearNodeInspector({
  nodeId,
  node,
  edges,
  allNodes,
  stateFields,
  entryNodeId,
  tools,
  onNodeChange,
  onEdgesChange,
  onDeleteNode,
}: {
  nodeId: string;
  node: LinearNode;
  edges: LinearEdge[];
  allNodes: Record<string, LinearNode>;
  stateFields: string[];
  entryNodeId: string;
  tools: AgentTool[];
  onNodeChange: (node: LinearNode) => void;
  onEdgesChange: (edges: LinearEdge[]) => void;
  onDeleteNode: () => void;
}) {
  const update = (changes: Partial<LinearNode>) => onNodeChange({ ...node, ...changes });
  const nodeOptions = Object.entries(allNodes).filter(([id]) => id !== nodeId);
  const defaultCondition = (): LinearEdge["condition"] => ({
    path: stateFields[0] ?? "session.global_intent",
    operator: "exists",
  });
  const createEdge = (
    target: string,
    sourceHandle?: string,
    extra: Partial<LinearEdge> = {},
  ): LinearEdge => ({
    id: `edge_${nodeId}_${sourceHandle ?? "next"}_${Date.now().toString(36)}_${edges.length}`,
    source: nodeId,
    target,
    ...(sourceHandle ? { source_handle: sourceHandle } : {}),
    ...extra,
  });
  const replaceConnection = (sourceHandle: string | undefined, target: string) => {
    const matches = (edge: LinearEdge) => {
      if (!sourceHandle) return true;
      return (edge.source_handle ?? "success") === sourceHandle;
    };
    const existing = edges.find(matches);
    const remaining = edges.filter((edge) => !matches(edge));
    if (!target) {
      onEdgesChange(remaining);
      return;
    }
    onEdgesChange([
      ...remaining,
      existing
        ? {
            ...existing,
            target,
            ...(sourceHandle ? { source_handle: sourceHandle } : {}),
          }
        : createEdge(target, sourceHandle),
    ]);
  };
  const connectionSelect = (
    label: string,
    sourceHandle?: string,
    optional = false,
  ) => {
    const edge = edges.find((item) =>
      sourceHandle
        ? (item.source_handle ?? "success") === sourceHandle
        : true,
    );
    return (
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase text-slate-500">
          {label}
        </label>
        <select
          aria-label={label}
          value={edge?.target ?? ""}
          onChange={(event) => replaceConnection(sourceHandle, event.target.value)}
          className="h-9 w-full rounded-md border bg-white px-2 text-xs dark:bg-slate-950"
        >
          <option value="">{optional ? "No connection" : "Choose next block"}</option>
          {nodeOptions.map(([id, option]) => (
            <option key={id} value={id}>
              {option.label || id} · {id}
            </option>
          ))}
        </select>
      </div>
    );
  };
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600">{node.type.replace("_", " ")}</p>
        <p className="font-mono text-xs text-slate-400">{nodeId}</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase text-slate-500">Label</label>
          <Input value={node.label ?? ""} onChange={(event) => update({ label: event.target.value })} className="h-8 text-xs" />
        </div>

        {node.type === "conversation" && (
          <>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500">Mode</label>
              <select value={node.mode ?? "collect"} onChange={(event) => update({ mode: event.target.value as "collect" | "message" })} className="h-8 w-full rounded-md border bg-white px-2 text-xs">
                <option value="collect">Collect information</option>
                <option value="message">Speak message</option>
              </select>
            </div>
            {(node.mode ?? "collect") === "collect" ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase text-slate-500">Entry prompt</label>
                  <Textarea value={node.entry_prompt ?? ""} onChange={(event) => update({ entry_prompt: event.target.value })} className="min-h-20 text-xs" />
                </div>
                <JsonField label="Collect mappings" value={node.collect ?? {}} onApply={(value) => update({ collect: value as LinearNode["collect"] })} />
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase text-slate-500">Message</label>
                <Textarea value={node.message ?? ""} onChange={(event) => update({ message: event.target.value })} className="min-h-24 text-xs" />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500">Instructions (one per line)</label>
              <Textarea value={(node.instructions ?? []).join("\n")} onChange={(event) => update({ instructions: event.target.value.split("\n") })} className="min-h-24 text-xs" />
            </div>
          </>
        )}

        {node.type === "function" && (
          <>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500">Tool</label>
              <select value={node.tool ?? ""} onChange={(event) => update({ tool: event.target.value })} className="h-8 w-full rounded-md border bg-white px-2 text-xs">
                <option value="">Choose tool</option>
                {tools.map((tool) => <option key={tool.name} value={tool.name}>{tool.name}</option>)}
              </select>
            </div>
            <JsonField label="Arguments" value={node.arguments ?? {}} onApply={(value) => update({ arguments: value as Record<string, unknown> })} />
            <JsonField label="Response mappings" value={node.response_mappings ?? {}} onApply={(value) => update({ response_mappings: value as Record<string, string> })} />
          </>
        )}

        {node.type === "logic_split" && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">Edges are evaluated in the order shown. Keep exactly one default.</p>
            {edges.map((edge, index) => (
              <div key={edge.id} className="space-y-2 rounded-xl border bg-slate-50 p-3 dark:bg-slate-950/60">
                <Input value={edge.label ?? ""} placeholder={`Branch ${index + 1}`} onChange={(event) => {
                  const updated = [...edges]; updated[index] = { ...edge, label: event.target.value }; onEdgesChange(updated);
                }} className="h-7 text-[10px]" />
                <select
                  aria-label={`Branch ${index + 1} target`}
                  value={edge.target}
                  onChange={(event) => {
                    const updated = [...edges];
                    updated[index] = { ...edge, target: event.target.value };
                    onEdgesChange(updated);
                  }}
                  className="h-8 w-full rounded-md border bg-white px-2 text-[10px] dark:bg-slate-950"
                >
                  <option value="">Choose target block</option>
                  {nodeOptions.map(([id, option]) => (
                    <option key={id} value={id}>{option.label || id} · {id}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-[10px] text-slate-600">
                  <input type="checkbox" checked={Boolean(edge.default)} onChange={(event) => {
                    const updated = edges.map((item, itemIndex) => ({ ...item, default: itemIndex === index ? event.target.checked : event.target.checked ? false : item.default }));
                    if (event.target.checked) delete updated[index].condition;
                    else if (!updated[index].condition) updated[index].condition = defaultCondition();
                    onEdgesChange(updated);
                  }} /> Default branch
                </label>
                {!edge.default && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase text-slate-500">
                        Condition state
                      </label>
                      <select
                        aria-label={`Branch ${index + 1} condition state`}
                        value={
                          edge.condition && "path" in edge.condition
                            ? edge.condition.path
                            : ""
                        }
                        onChange={(event) => {
                          const updated = [...edges];
                          updated[index] = {
                            ...edge,
                            default: false,
                            condition: {
                              path: event.target.value,
                              operator:
                                edge.condition && "path" in edge.condition
                                  ? edge.condition.operator
                                  : "exists",
                              ...(edge.condition &&
                              "path" in edge.condition &&
                              "value" in edge.condition
                                ? { value: edge.condition.value }
                                : {}),
                            },
                          };
                          onEdgesChange(updated);
                        }}
                        className="h-8 w-full rounded-md border bg-white px-2 text-[10px] dark:bg-slate-950"
                      >
                        <option value="">Choose state field</option>
                        {stateFields.map((path) => (
                          <option key={path} value={path}>{path}</option>
                        ))}
                      </select>
                    </div>
                    <JsonField label="Condition" value={edge.condition ?? defaultCondition()} onApply={(value) => {
                      const updated = [...edges]; updated[index] = { ...edge, condition: value as LinearEdge["condition"], default: false }; onEdgesChange(updated);
                    }} />
                  </>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-full justify-start text-[10px] text-red-600 hover:text-red-700"
                  onClick={() => onEdgesChange(edges.filter((_, edgeIndex) => edgeIndex !== index))}
                >
                  <Trash2 className="mr-1.5 h-3 w-3" /> Remove branch
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 w-full text-[10px]"
              disabled={!nodeOptions.length}
              onClick={() => {
                const target = nodeOptions[0]?.[0];
                if (!target) return;
                const hasDefault = edges.some((edge) => edge.default);
                onEdgesChange([
                  ...edges,
                  createEdge(
                    target,
                    undefined,
                    hasDefault
                      ? { condition: defaultCondition() }
                      : { default: true },
                  ),
                ]);
              }}
            >
              <Plus className="mr-1.5 h-3 w-3" /> Add branch
            </Button>
          </div>
        )}

        {node.type === "call_transfer" && (
          <>
            <div className="space-y-1.5"><label className="text-[10px] font-semibold uppercase text-slate-500">Destination</label><Input value={node.destination ?? ""} onChange={(event) => update({ destination: event.target.value })} className="h-8 font-mono text-xs" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-semibold uppercase text-slate-500">Pre-transfer message</label><Textarea value={node.message ?? ""} onChange={(event) => update({ message: event.target.value })} className="min-h-20 text-xs" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-semibold uppercase text-slate-500">Reason</label><Input value={node.reason ?? ""} onChange={(event) => update({ reason: event.target.value })} className="h-8 text-xs" /></div>
          </>
        )}

        {node.type === "end_call" && (
          <div className="space-y-1.5"><label className="text-[10px] font-semibold uppercase text-slate-500">Farewell</label><Textarea value={node.farewell ?? ""} onChange={(event) => update({ farewell: event.target.value })} className="min-h-24 text-xs" /></div>
        )}

        {node.type !== "logic_split" && node.type !== "end_call" && (
          <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Connections</p>
              <p className="mt-1 text-[10px] text-slate-400">Choose targets here, or drag between card handles on the canvas.</p>
            </div>
            {(node.type === "start" || node.type === "conversation") && connectionSelect("Next block")}
            {node.type === "function" && (
              <>
                {connectionSelect("On success", "success")}
                {connectionSelect("On error", "error", true)}
              </>
            )}
            {node.type === "call_transfer" && connectionSelect("On transfer error", "error", true)}
          </div>
        )}

        {nodeId !== entryNodeId && (
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={() => {
              if (window.confirm(`Delete “${node.label || nodeId}” and its connections?`))
                onDeleteNode();
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete block
          </Button>
        )}
      </div>
    </div>
  );
}
