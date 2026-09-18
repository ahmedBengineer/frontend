// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET as getAgent,
  PATCH,
} from "@/app/api/workflow-studio/agents/[agentId]/route";
import { GET as getAgents } from "@/app/api/workflow-studio/agents/route";
import { sanitizeWorkflowAgent } from "@/lib/workflow-studio/backend";

const agent = {
  id: 42,
  name: "Workflow agent",
  agent_type: "workflow",
  twilio_phone_numbers: ["923001234567"],
  json_object: { schema_version: 1, workflows: { intake: {} } },
  include_default_tools: true,
  default_tool_names: ["end_call"],
  custom_features: [
    {
      id: 9,
      name: "lookup",
      description: "Lookup a record",
      url: "https://private.example/tool",
      headers: { Authorization: "Bearer private-token" },
      request_parameters: { patient_name: "secret" },
      response_payload: { private: true },
    },
  ],
};

function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Host", "studio.example.test");
  headers.set("Origin", "https://studio.example.test");
  headers.set("Cookie", "Token=user-token");
  return new NextRequest(`https://studio.example.test${path}`, {
    method: init.method,
    body: init.body,
    headers,
  });
}

describe("workflow studio agent server boundary", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://backend.example.test/api");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sanitizes tool configuration before it can reach the client", () => {
    const sanitized = sanitizeWorkflowAgent(agent);
    expect(sanitized?.custom_features).toEqual([
      { id: 9, name: "lookup", description: "Lookup a record" },
    ]);
    const serialized = JSON.stringify(sanitized);
    for (const forbidden of [
      "private.example",
      "Authorization",
      "private-token",
      "patient_name",
      "response_payload",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("exposes only safe tool parameter schemas for workflow mappings", () => {
    const sanitized = sanitizeWorkflowAgent({
      ...agent,
      custom_features: [
        {
          ...agent.custom_features[0],
          request_parameters: {
            appointment_id: {
              type: "string",
              required: true,
              description: "Exact appointment UUID",
              global: true,
              private_default: "must-not-reach-client",
            },
          },
        },
      ],
    });
    expect(sanitized?.custom_features[0].parameters).toEqual({
      appointment_id: {
        type: "string",
        required: true,
        description: "Exact appointment UUID",
      },
    });
    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain("private_default");
    expect(serialized).not.toContain("must-not-reach-client");
    expect(serialized).not.toContain("private.example");
    expect(serialized).not.toContain("private-token");
  });

  it("returns only workflow summaries and requires the user cookie", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify([
              agent,
              { ...agent, id: 43, agent_type: "standard" },
            ]),
            { status: 200 },
          ),
        ),
    );
    const response = await getAgents(request("/api/workflow-studio/agents"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect((await response.json()).agents).toEqual([
      {
        id: 42,
        name: "Workflow agent",
        agent_type: "workflow",
        twilio_phone_numbers: ["923001234567"],
      },
    ]);

    const unauthorized = await getAgents(
      new NextRequest("https://studio.example.test/api/workflow-studio/agents"),
    );
    expect(unauthorized.status).toBe(401);
  });

  it("sanitizes detail responses and rejects non-workflow deep links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(agent))),
    );
    const response = await getAgent(request("/api/workflow-studio/agents/42"), {
      params: Promise.resolve({ agentId: "42" }),
    });
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("private-token");

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ...agent, agent_type: "standard" })),
        ),
    );
    const rejected = await getAgent(request("/api/workflow-studio/agents/42"), {
      params: Promise.resolve({ agentId: "42" }),
    });
    expect(rejected.status).toBe(400);
    expect(await rejected.text()).toContain("not workflow based");
  });

  it("forwards only workflow and validated router tool settings during same-origin saves", async () => {
    const backendFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(agent)))
      .mockResolvedValueOnce(new Response(JSON.stringify(agent)));
    vi.stubGlobal("fetch", backendFetch);
    const response = await PATCH(
      request("/api/workflow-studio/agents/42", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json_object: agent.json_object,
          include_default_tools: true,
          default_tool_names: ["end_call", "transfer_call", "not_a_tool"],
          headers: { Authorization: "must-not-forward" },
        }),
      }),
      { params: Promise.resolve({ agentId: "42" }) },
    );
    expect(response.status).toBe(200);
    const patchInit = backendFetch.mock.calls[1][1] as RequestInit;
    expect(JSON.parse(String(patchInit.body))).toEqual({
      agent_type: "workflow",
      json_object: agent.json_object,
      include_default_tools: true,
      default_tool_names: ["end_call", "transfer_call"],
    });
    expect(String(patchInit.body)).not.toContain("must-not-forward");
  });
});
