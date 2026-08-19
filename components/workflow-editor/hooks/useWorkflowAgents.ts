"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkflowAgentSummary } from "../types";

function normalizeAgent(value: unknown): WorkflowAgentSummary | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = Number(raw.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return {
    id,
    name:
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : `Agent ${id}`,
    agent_type: typeof raw.agent_type === "string" ? raw.agent_type : "",
    twilio_phone_numbers: Array.isArray(raw.twilio_phone_numbers)
      ? raw.twilio_phone_numbers.map(String).filter(Boolean)
      : [],
  };
}

export function useWorkflowAgents() {
  const [agents, setAgents] = useState<WorkflowAgentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/workflow-studio/agents", {
        cache: "no-store",
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          error?.error || `Could not load agents (HTTP ${response.status})`,
        );
      }
      const payload = await response.json();
      const list: unknown[] = Array.isArray(payload?.agents)
        ? payload.agents
        : [];
      setAgents(
        list
          .map(normalizeAgent)
          .filter((agent): agent is WorkflowAgentSummary => Boolean(agent)),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not load agents",
      );
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const workflowAgents = useMemo(
    () => agents.filter((agent) => agent.agent_type === "workflow"),
    [agents],
  );

  return { agents, workflowAgents, isLoading, error, reload };
}
