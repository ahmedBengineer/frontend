"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Bot,
  Braces,
  GitBranch,
  LogOut,
  PhoneForwarded,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinearNode as LinearNodeDefinition } from "../types";

export interface LinearNodeData extends Record<string, unknown> {
  nodeId: string;
  node: LinearNodeDefinition;
  active?: boolean;
  liveSession?: boolean;
}

const META = {
  start: {
    icon: Play,
    color: "border-emerald-300 bg-emerald-50 dark:border-emerald-500/70 dark:bg-emerald-950/60",
    tag: "START",
  },
  conversation: {
    icon: Bot,
    color: "border-fuchsia-300 bg-fuchsia-50 dark:border-fuchsia-500/70 dark:bg-fuchsia-950/60",
    tag: "CONVERSATION",
  },
  function: {
    icon: Braces,
    color: "border-violet-300 bg-violet-50 dark:border-violet-500/70 dark:bg-violet-950/60",
    tag: "FUNCTION",
  },
  logic_split: {
    icon: GitBranch,
    color: "border-blue-300 bg-blue-50 dark:border-blue-500/70 dark:bg-blue-950/60",
    tag: "LOGIC SPLIT",
  },
  call_transfer: {
    icon: PhoneForwarded,
    color: "border-amber-300 bg-amber-50 dark:border-amber-500/70 dark:bg-amber-950/60",
    tag: "TRANSFER",
  },
  end_call: {
    icon: LogOut,
    color: "border-teal-300 bg-teal-50 dark:border-teal-500/70 dark:bg-teal-950/60",
    tag: "END CALL",
  },
} as const;

export function LinearNode({ data, selected }: NodeProps) {
  const value = data as LinearNodeData;
  const node = value.node;
  const meta = META[node.type];
  const Icon = meta.icon;
  const collect = Object.values(node.collect ?? {});
  return (
    <div
      data-active={value.active ? "true" : "false"}
      className={cn(
        "relative min-w-[220px] max-w-[250px] rounded-xl border-2 shadow-md transition-all duration-200",
        meta.color,
        value.liveSession &&
          !value.active &&
          !selected &&
          "opacity-45 grayscale-[0.3] saturate-50",
        selected && !value.active &&
          "border-sky-500 ring-4 ring-sky-300/80 ring-offset-2 ring-offset-slate-50 shadow-[0_0_22px_rgba(14,165,233,0.45)] dark:border-sky-300 dark:ring-sky-500/60 dark:ring-offset-slate-950",
        value.active &&
          "scale-[1.06] border-cyan-500 ring-[6px] ring-cyan-300/80 shadow-[0_0_38px_rgba(6,182,212,0.8)] dark:border-cyan-300 dark:ring-cyan-400/60 dark:shadow-[0_0_44px_rgba(34,211,238,0.7)]",
      )}
    >
      {value.active && (
        <>
          <span className="pointer-events-none absolute -inset-2 -z-10 rounded-2xl border-2 border-cyan-400/70 animate-ping" />
          <span className="absolute -right-2 -top-3 z-20 inline-flex items-center gap-1 rounded-full bg-cyan-500 px-2 py-1 text-[9px] font-bold tracking-[0.12em] text-slate-950 shadow-lg dark:bg-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-pulse" />
            LIVE
          </span>
        </>
      )}
      {node.type !== "start" && (
        <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500 dark:!border-slate-950 dark:!bg-slate-300" />
      )}
      <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2 dark:border-white/10">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 shadow-sm dark:bg-slate-900/80">
          <Icon className="h-3.5 w-3.5 text-slate-700 dark:text-slate-200" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">{meta.tag}</p>
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{node.label || value.nodeId}</p>
        </div>
      </div>
      <div className="space-y-1.5 px-3 py-2.5 text-[10px] text-slate-600 dark:text-slate-300">
        {node.type === "conversation" && (
          <>
            <p className="line-clamp-2">{node.mode === "message" ? node.message : node.entry_prompt}</p>
            {collect.map((field, index) => (
              <span
                key={index}
                title={`Workflow state: ${field.state}`}
                className="mr-1 inline-flex rounded bg-white/80 px-1.5 py-0.5 font-mono text-[9px] text-fuchsia-700 dark:bg-slate-900/70 dark:text-fuchsia-300"
              >
                {field.state}
              </span>
            ))}
          </>
        )}
        {node.type === "function" && <p className="font-mono">{node.tool || "Choose a tool"}</p>}
        {node.type === "logic_split" && <p>First matching condition wins.</p>}
        {node.type === "call_transfer" && <p className="font-mono">{node.destination || "No destination"}</p>}
        {node.type === "end_call" && <p className="line-clamp-2">{node.farewell}</p>}
        {node.type === "start" && <p>Flow entry point</p>}
      </div>
      {node.type === "function" && (
        <>
          <Handle id="success" type="source" position={Position.Right} style={{ top: "38%" }} className="!h-3 !w-3 !border-2 !border-white !bg-emerald-500 dark:!border-slate-950" />
          <Handle id="error" type="source" position={Position.Right} style={{ top: "72%" }} className="!h-3 !w-3 !border-2 !border-white !bg-red-500 dark:!border-slate-950" />
        </>
      )}
      {node.type === "call_transfer" && (
        <Handle id="error" type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-white !bg-red-500 dark:!border-slate-950" />
      )}
      {!(["end_call", "function", "call_transfer"] as string[]).includes(node.type) && (
        <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500 dark:!border-slate-950 dark:!bg-slate-300" />
      )}
    </div>
  );
}
