// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/workflow-test/token/route";
import { resetWorkflowTokenRateLimit } from "@/lib/workflow-test/rateLimit";

function request(
  body: Record<string, unknown>,
  options: { cookie?: boolean; origin?: string } = {},
) {
  return new NextRequest(
    "https://studio.example.test/api/workflow-test/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Host: "studio.example.test",
        Origin: options.origin ?? "https://studio.example.test",
        ...(options.cookie === false ? {} : { Cookie: "Token=user-token" }),
      },
      body: JSON.stringify(body),
    },
  );
}

const validBody = {
  agentId: 137,
  dispatchName: "pentagonai",
  agentNumber: "924232460262",
  humanNumber: "03094836196",
};

describe("POST /api/workflow-test/token", () => {
  beforeEach(() => {
    resetWorkflowTokenRateLimit();
    vi.stubEnv("LIVEKIT_URL", "wss://example.livekit.cloud");
    vi.stubEnv("LIVEKIT_API_KEY", "api-key");
    vi.stubEnv("LIVEKIT_API_SECRET", "a-sufficiently-long-livekit-test-secret");
    vi.stubEnv("LIVEKIT_ALLOWED_AGENT_NAMES", "pentagonai");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://backend.example.test/api");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("requires authentication and a same-origin request", async () => {
    expect((await POST(request(validBody, { cookie: false }))).status).toBe(
      401,
    );
    expect(
      (await POST(request(validBody, { origin: "https://evil.example" })))
        .status,
    ).toBe(403);
  });

  it("verifies workflow type and assigned number with the authenticated backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 137,
            agent_type: "workflow",
            twilio_phone_numbers: ["924232460262"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const response = await POST(request(validBody));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const payload = await response.json();
    expect(payload).toMatchObject({ serverUrl: "wss://example.livekit.cloud" });
    expect(payload.accessToken).toEqual(expect.any(String));
    expect(fetch).toHaveBeenCalledWith(
      "https://backend.example.test/api/agents/agents/137/",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Token user-token" }),
      }),
    );
  });

  it("accepts a valid deployment name that is not in the server suggestions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 137,
            agent_type: "workflow",
            twilio_phone_numbers: ["924232460262"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const response = await POST(
      request({ ...validBody, dispatchName: "pentagonai-hostinger" }),
    );
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.accessToken).toEqual(expect.any(String));
  });

  it("includes validated additional attributes in the minted token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 137,
            agent_type: "workflow",
            twilio_phone_numbers: ["924232460262"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const response = await POST(
      request({
        ...validBody,
        additionalAttributes: {
          customer_id: "customer-42",
          language: "ur",
        },
      }),
    );
    expect(response.status).toBe(200);
    const { accessToken } = await response.json();
    const claims = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"),
    );
    expect(claims.attributes).toMatchObject({
      agent_number: "924232460262",
      human_number: "03094836196",
      customer_id: "customer-42",
      language: "ur",
    });
  });

  it("accepts standard agents and rejects mismatched numbers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 137,
            agent_type: "standard",
            twilio_phone_numbers: ["924232460262"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    expect((await POST(request(validBody))).status).toBe(200);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 137,
            agent_type: "workflow",
            twilio_phone_numbers: ["1111111111"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    expect((await POST(request(validBody))).status).toBe(400);
  });

  it("returns a generic error and no token when server credentials are missing", async () => {
    vi.stubEnv("LIVEKIT_API_SECRET", "");
    const response = await POST(request(validBody));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("accessToken");
  });
});
