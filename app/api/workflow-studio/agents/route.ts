import { NextRequest, NextResponse } from "next/server";
import {
  backendErrorStatus,
  fetchFromBackend,
  sanitizeWorkflowAgentSummary,
  WorkflowStudioBackendError,
} from "@/lib/workflow-studio/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  try {
    const response = await fetchFromBackend(request, "/agents/agents/");
    if (!response.ok)
      return NextResponse.json(
        { error: "Workflow agents could not be loaded." },
        { status: backendErrorStatus(response), headers: noStore },
      );
    const payload = await response.json();
    const values: unknown[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results)
        ? payload.results
        : [];
    const agents = values
      .map(sanitizeWorkflowAgentSummary)
      .filter((agent) => agent?.agent_type === "workflow");
    return NextResponse.json({ agents }, { headers: noStore });
  } catch (reason) {
    const status =
      reason instanceof WorkflowStudioBackendError ? reason.status : 500;
    const message =
      reason instanceof WorkflowStudioBackendError
        ? reason.message
        : "Workflow agents could not be loaded.";
    return NextResponse.json({ error: message }, { status, headers: noStore });
  }
}
