"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AgentJsonObject,
  AgentTool,
  CanonicalAgentState,
  WorkflowAgentDefinition,
} from "../types";
import { deepEqual } from "../utils/jsonPath";
import { normalizeDefaultRouterTools } from "@/lib/workflow-studio/defaultTools";
import { protectedFetchGlobal } from "@/hooks/useProtectedFetch";

function normalizeDefinition(
  data: Record<string, unknown>,
): WorkflowAgentDefinition {
  const id = Number(data.id);
  return {
    id,
    name: typeof data.name === "string" ? data.name : `Agent ${id}`,
    agent_type: typeof data.agent_type === "string" ? data.agent_type : "",
    json_object: structuredClone((data.json_object ?? {}) as AgentJsonObject),
    twilio_phone_numbers: Array.isArray(data.twilio_phone_numbers)
      ? data.twilio_phone_numbers.map(String).filter(Boolean)
      : [],
    custom_features: Array.isArray(data.custom_features)
      ? data.custom_features
          .filter(
            (item): item is Record<string, unknown> =>
              Boolean(item) && typeof item === "object",
          )
          .map((item): AgentTool => ({
            id:
              typeof item.id === "number" || typeof item.id === "string"
                ? item.id
                : undefined,
            name: String(item.name ?? "").trim(),
            description:
              typeof item.description === "string"
                ? item.description
                : undefined,
            parameters:
              item.parameters &&
              typeof item.parameters === "object" &&
              !Array.isArray(item.parameters)
                ? (structuredClone(item.parameters) as AgentTool["parameters"])
                : {},
          }))
          .filter((tool) => tool.name.length > 0)
      : [],
    include_default_tools: data.include_default_tools === true,
    default_tool_names: normalizeDefaultRouterTools(data.default_tool_names),
  };
}

export type SaveMethod = "PATCH";

export interface UseAgentDefinitionReturn {
  definition: WorkflowAgentDefinition | null;
  agentType: string;
  jsonObject: AgentJsonObject;
  agentName: string;
  availableTools: AgentTool[];
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  hasConflict: boolean;
  loadError: string | null;
  saveError: string | null;
  saveSuccess: boolean;
  updateJsonObject: (
    updater: (prev: AgentJsonObject) => AgentJsonObject,
  ) => void;
  replaceJsonObject: (json: AgentJsonObject) => void;
  updateDefaultTools: (enabled: boolean, names: string[]) => void;
  save: (method?: SaveMethod, force?: boolean) => Promise<boolean>;
  reload: () => Promise<void>;
}

export function useAgentDefinition(
  agentId: number | null,
): UseAgentDefinitionReturn {
  const [definition, setDefinition] = useState<WorkflowAgentDefinition | null>(
    null,
  );
  const [canonicalState, setCanonicalState] = useState<CanonicalAgentState>({
    agent_type: "",
    json_object: {},
    include_default_tools: false,
    default_tool_names: [],
  });
  const [savedState, setSavedState] = useState<CanonicalAgentState | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(Boolean(agentId));
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirty = savedState !== null && !deepEqual(canonicalState, savedState);

  const fetchRawAgent = useCallback(async () => {
    if (!agentId) throw new Error("Choose a workflow agent");
    const response = await protectedFetchGlobal(`/api/workflow-studio/agents/${agentId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(
        error?.error || `Could not load agent (HTTP ${response.status})`,
      );
    }
    return response.json() as Promise<Record<string, unknown>>;
  }, [agentId]);

  const reload = useCallback(async () => {
    if (!agentId) {
      setDefinition(null);
      setSavedState(null);
      setCanonicalState({
        agent_type: "",
        json_object: {},
        include_default_tools: false,
        default_tool_names: [],
      });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    setSaveError(null);
    setHasConflict(false);
    try {
      const normalized = normalizeDefinition(await fetchRawAgent());
      const state: CanonicalAgentState = {
        agent_type: normalized.agent_type,
        json_object: structuredClone(normalized.json_object),
        include_default_tools: normalized.include_default_tools,
        default_tool_names: [...normalized.default_tool_names],
      };
      setDefinition(normalized);
      setCanonicalState(state);
      setSavedState(structuredClone(state));
    } catch (reason) {
      setDefinition(null);
      setLoadError(
        reason instanceof Error ? reason.message : "Could not load agent",
      );
    } finally {
      setIsLoading(false);
    }
  }, [agentId, fetchRawAgent]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    [],
  );

  const updateJsonObject = useCallback(
    (updater: (prev: AgentJsonObject) => AgentJsonObject) => {
      setCanonicalState((current) => ({
        ...current,
        json_object: updater(current.json_object),
      }));
      setSaveSuccess(false);
      setHasConflict(false);
    },
    [],
  );

  const replaceJsonObject = useCallback((json: AgentJsonObject) => {
    setCanonicalState((current) => ({
      ...current,
      json_object: structuredClone(json),
    }));
    setSaveSuccess(false);
    setHasConflict(false);
  }, []);

  const updateDefaultTools = useCallback(
    (enabled: boolean, names: string[]) => {
      setCanonicalState((current) => ({
        ...current,
        include_default_tools: enabled,
        default_tool_names: enabled ? normalizeDefaultRouterTools(names) : [],
      }));
      setSaveSuccess(false);
      setHasConflict(false);
    },
    [],
  );

const save = useCallback(
    async (method: SaveMethod = "PATCH", force = false) => {
      if (!agentId || !savedState) return false;
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      try {
        if (!force) {
          const latest = normalizeDefinition(await fetchRawAgent());
          const latestState: CanonicalAgentState = {
            agent_type: latest.agent_type,
            json_object: latest.json_object,
            include_default_tools: latest.include_default_tools,
            default_tool_names: [...latest.default_tool_names],
          };
          if (!deepEqual(latestState, savedState)) {
            setHasConflict(true);
            throw new Error(
              "This workflow changed on the server. Reload it or choose Overwrite.",
            );
          }
        }
        const response = await protectedFetchGlobal(`/api/workflow-studio/agents/${agentId}`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_type: canonicalState.agent_type,
            json_object: canonicalState.json_object,
            include_default_tools: canonicalState.include_default_tools,
            default_tool_names: canonicalState.default_tool_names,
          }),
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(
            `Save failed (HTTP ${response.status})${message ? `: ${message}` : ""}`,
          );
        }
        const normalized = normalizeDefinition(await response.json());
        const updated: CanonicalAgentState = {
          agent_type: normalized.agent_type,
          json_object: structuredClone(normalized.json_object),
          include_default_tools: normalized.include_default_tools,
          default_tool_names: [...normalized.default_tool_names],
        };
        setDefinition(normalized);
        setCanonicalState(updated);
        setSavedState(structuredClone(updated));
        setHasConflict(false);
        setSaveSuccess(true);
        if (successTimer.current) clearTimeout(successTimer.current);
        successTimer.current = setTimeout(() => setSaveSuccess(false), 3000);
        return true;
      } catch (reason) {
        if (reason instanceof Error && reason.message.includes("Protected action cancelled")) {
          setSaveError("Save cancelled: password required");
          return false;
        }
        setSaveError(reason instanceof Error ? reason.message : "Save failed");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [agentId, canonicalState, fetchRawAgent, savedState],
  );

  const availableTools = useMemo(() => {
    if (!definition) return [];
    const tools = [...definition.custom_features];
    if (canonicalState.include_default_tools) {
      const existing = new Set(tools.map((tool) => tool.name));
      for (const name of canonicalState.default_tool_names) {
        if (!existing.has(name))
          tools.push({ name, description: "Built-in tool" });
      }
    }
    return tools.sort((left, right) => left.name.localeCompare(right.name));
  }, [canonicalState.default_tool_names, canonicalState.include_default_tools, definition]);

  return {
    definition: definition
      ? {
          ...definition,
          json_object: canonicalState.json_object,
          include_default_tools: canonicalState.include_default_tools,
          default_tool_names: canonicalState.default_tool_names,
        }
      : null,
    agentType: canonicalState.agent_type,
    jsonObject: canonicalState.json_object,
    agentName: definition?.name ?? "",
    availableTools,
    isLoading,
    isSaving,
    isDirty,
    hasConflict,
    loadError,
    saveError,
    saveSuccess,
    updateJsonObject,
    replaceJsonObject,
    updateDefaultTools,
    save,
    reload,
  };
}
