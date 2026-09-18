export type AgentRuntime = "standard" | "workflow";
export type AgentRuntimeFilter = "ALL" | AgentRuntime;

export function normalizeAgentRuntime(value: unknown): AgentRuntime {
  return typeof value === "string" && value.trim().toLowerCase() === "workflow"
    ? "workflow"
    : "standard";
}

export function matchesAgentRuntime(
  runtime: AgentRuntime,
  filter: AgentRuntimeFilter,
): boolean {
  return filter === "ALL" || runtime === filter;
}
