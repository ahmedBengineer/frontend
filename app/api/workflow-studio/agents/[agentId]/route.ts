import { NextRequest, NextResponse } from "next/server";
import {
  backendErrorStatus,
  fetchFromBackend,
  sanitizeWorkflowAgent,
  WorkflowStudioBackendError,
} from "@/lib/workflow-studio/backend";
import { isSameOrigin } from "@/lib/workflow-studio/requestSecurity";
import { normalizeDefaultRouterTools } from "@/lib/workflow-studio/defaultTools";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStore });
}

function parseAgentId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function verifiedAgent(request: NextRequest, agentId: number) {
  const response = await fetchFromBackend(
    request,
    `/agents/agents/${agentId}/`,
  );
  if (!response.ok)
    throw new WorkflowStudioBackendError(
      "The selected agent could not be loaded.",
      backendErrorStatus(response),
    );
  const agent = sanitizeWorkflowAgent(await response.json());
  if (!agent)
    throw new WorkflowStudioBackendError(
      "The selected agent response is malformed.",
      502,
    );
  if (agent.agent_type !== "workflow")
    throw new WorkflowStudioBackendError(
      "The selected agent is not workflow based.",
      400,
    );
  return agent;
}

type RouteContext = { params: Promise<{ agentId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const agentId = parseAgentId((await context.params).agentId);
    if (!agentId) return errorResponse("Agent ID is invalid.", 400);
    return NextResponse.json(await verifiedAgent(request, agentId), {
      headers: noStore,
    });
  } catch (reason) {
    const status =
      reason instanceof WorkflowStudioBackendError ? reason.status : 500;
    const message =
      reason instanceof WorkflowStudioBackendError
        ? reason.message
        : "The selected agent could not be loaded.";
    return errorResponse(message, status);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request))
    return errorResponse("Request origin is not allowed.", 403);
  try {
    const agentId = parseAgentId((await context.params).agentId);
    if (!agentId) return errorResponse("Agent ID is invalid.", 400);
    const existing = await verifiedAgent(request, agentId);
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.json_object || typeof body.json_object !== "object")
      return errorResponse("Workflow JSON is required.", 400);

    const includeDefaultTools =
      typeof body.include_default_tools === "boolean"
        ? body.include_default_tools
        : existing.include_default_tools;
    const defaultToolNames = includeDefaultTools
      ? Object.prototype.hasOwnProperty.call(body, "default_tool_names")
        ? normalizeDefaultRouterTools(body.default_tool_names)
        : existing.default_tool_names
      : [];

    const response = await fetchFromBackend(
      request,
      `/agents/agents/${agentId}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_type: "workflow",
          json_object: body.json_object,
          include_default_tools: includeDefaultTools,
          default_tool_names: defaultToolNames,
        }),
      },
    );
    if (!response.ok)
      return errorResponse(
        "The workflow could not be saved.",
        backendErrorStatus(response),
      );
    const agent = sanitizeWorkflowAgent(await response.json());
    if (!agent || agent.agent_type !== "workflow")
      return errorResponse("The saved workflow response is malformed.", 502);
    return NextResponse.json(agent, { headers: noStore });
  } catch (reason) {
    const status =
      reason instanceof WorkflowStudioBackendError ? reason.status : 500;
    const message =
      reason instanceof WorkflowStudioBackendError
        ? reason.message
        : "The workflow could not be saved.";
    return errorResponse(message, status);
  }
}
