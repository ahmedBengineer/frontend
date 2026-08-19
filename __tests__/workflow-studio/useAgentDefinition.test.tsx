import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgentDefinition } from "@/components/workflow-editor/hooks/useAgentDefinition";

const agent = {
  id: 42,
  name: "Supervisor agent",
  agent_type: "workflow",
  json_object: {
    schema_version: 1,
    assistant: { routing_instructions: [] },
    workflows: {},
  },
  twilio_phone_numbers: [],
  custom_features: [],
  include_default_tools: false,
  default_tool_names: [],
};

describe("workflow agent definition editing", () => {
  beforeEach(() => vi.stubGlobal("React", React));

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("tracks and saves router default tool selections with the workflow", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "PATCH") {
          const payload = JSON.parse(String(init.body));
          return new Response(JSON.stringify({ ...agent, ...payload }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(agent), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAgentDefinition(42));
    await waitFor(() => expect(result.current.definition).not.toBeNull());

    act(() =>
      result.current.updateDefaultTools(true, ["end_call", "not_a_tool"]),
    );
    expect(result.current.isDirty).toBe(true);
    expect(result.current.definition?.include_default_tools).toBe(true);
    expect(result.current.definition?.default_tool_names).toEqual(["end_call"]);

    await act(async () => {
      expect(await result.current.save()).toBe(true);
    });

    const patchRequest = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "PATCH",
    );
    expect(JSON.parse(String(patchRequest?.[1]?.body))).toMatchObject({
      agent_type: "workflow",
      include_default_tools: true,
      default_tool_names: ["end_call"],
    });
    expect(result.current.isDirty).toBe(false);
  });
});
