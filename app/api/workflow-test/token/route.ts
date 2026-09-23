import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createWorkflowTestToken } from "@/lib/workflow-test/token";
import { consumeWorkflowTokenQuota } from "@/lib/workflow-test/rateLimit";
import { getWorkflowTestServerEnvironment } from "@/lib/workflow-test/serverEnv";
import { isSameOrigin } from "@/lib/workflow-studio/requestSecurity";
import {
  InputValidationError,
  normalizeDigits,
  validateCallInputs,
} from "@/lib/workflow-test/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request))
    return jsonError("Request origin is not allowed.", 403);
  const authToken = request.cookies.get("Token")?.value;
  if (!authToken) return jsonError("Authentication is required.", 401);

  try {
    const environment = getWorkflowTestServerEnvironment();
    const inputs = validateCallInputs(await request.json());
    const quotaKey = createHash("sha256").update(authToken).digest("hex");
    if (!consumeWorkflowTokenQuota(quotaKey))
      return jsonError("Too many test-call requests. Try again shortly.", 429);

    const agentResponse = await fetch(
      `${environment.backendApiBaseUrl}/agents/agents/${inputs.agentId}/`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Token ${authToken}`,
          Accept: "application/json",
        },
      },
    );
    if (agentResponse.status === 401 || agentResponse.status === 403)
      return jsonError("Authentication is required.", 401);
    if (!agentResponse.ok)
      return jsonError("The selected agent could not be verified.", 400);
    const agent = (await agentResponse.json()) as Record<string, unknown>;
    const assignedNumbers = Array.isArray(agent.twilio_phone_numbers)
      ? agent.twilio_phone_numbers.map(normalizeDigits)
      : [];
    if (!assignedNumbers.includes(inputs.agentNumber))
      return jsonError(
        "The selected number does not belong to this agent.",
        400,
      );

    return NextResponse.json(
      await createWorkflowTestToken(inputs, environment),
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (reason) {
    if (reason instanceof InputValidationError)
      return jsonError(reason.message, 400);
    return jsonError("Test-call token generation failed.", 500);
  }
}
