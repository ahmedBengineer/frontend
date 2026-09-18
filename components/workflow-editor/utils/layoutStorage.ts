import type { AgentJsonObject } from "../types";

export interface StoredPosition {
  x: number;
  y: number;
}
export type StoredPositions = Record<string, StoredPosition>;

export function structuralHash(json: AgentJsonObject): string {
  const shape = Object.entries(json.workflows ?? {}).map(
    ([workflowId, workflow]) => ({
      workflowId,
      interruptibleBy: [...(workflow.interruptible_by ?? [])].sort(),
      tasks: (
        workflow.task_order ?? Object.keys(workflow.task_group ?? {})
      ).map((taskId) => ({
        taskId,
        kind: workflow.task_group?.[taskId]?.kind ?? "",
      })),
    }),
  );
  const value = JSON.stringify(shape);
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function layoutKey(agentId: number, hash: string, view: string): string {
  return `smartconvo.workflow.layout.${agentId}.${hash}.${view}`;
}

export function loadPositions(key: string): StoredPositions {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, position]) => {
        if (!position || typeof position !== "object") return false;
        const point = position as Record<string, unknown>;
        return Number.isFinite(point.x) && Number.isFinite(point.y);
      }),
    ) as StoredPositions;
  } catch {
    return {};
  }
}

export function savePositions(key: string, positions: StoredPositions): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(positions));
}

export function clearPositions(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}
