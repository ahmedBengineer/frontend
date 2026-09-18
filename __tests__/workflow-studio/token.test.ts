// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createWorkflowTestToken } from "@/lib/workflow-test/token";
import { validateCallInputs } from "@/lib/workflow-test/validation";
import {
  consumeWorkflowTokenQuota,
  resetWorkflowTokenRateLimit,
} from "@/lib/workflow-test/rateLimit";
import { getWorkflowTestDispatchConfiguration } from "@/lib/workflow-test/serverEnv";

const environment = {
  livekitUrl: "wss://example.livekit.cloud",
  livekitApiKey: "api-key",
  livekitApiSecret: "secret-at-least-32-characters-long",
  backendApiBaseUrl: "https://example.test/api",
  defaultDispatchName: "pentagonai",
  allowedDispatchNames: ["pentagonai"],
};

afterEach(() => vi.unstubAllEnvs());

describe("workflow test token", () => {
  it("contains canonical and additional participant attributes with correct grants", async () => {
    const ids = ["room-aaaaaaaaaaaa", "user-bbbbbbbbbbbb"];
    const details = await createWorkflowTestToken(
      {
        agentId: 137,
        dispatchName: "pentagonai",
        agentNumber: "924232460262",
        humanNumber: "03094836196",
        additionalAttributes: {
          customer_id: "customer-42",
          language: "ur",
        },
      },
      environment,
      () => ids.shift()!,
    );
    const claims = JSON.parse(
      Buffer.from(details.accessToken.split(".")[1], "base64url").toString(
        "utf8",
      ),
    );
    expect(claims.attributes).toEqual({
      agent_number: "924232460262",
      human_number: "03094836196",
      customer_id: "customer-42",
      language: "ur",
    });
    expect(claims.video).toMatchObject({
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    });
    expect(claims.roomConfig.agents).toEqual([
      expect.objectContaining({ agentName: "pentagonai" }),
    ]);
    expect(details.roomName).not.toBe(details.identity);
  });

  it("validates additional attribute shape and protects canonical attributes", () => {
    const base = {
      agentId: 137,
      dispatchName: "pentagonai",
      agentNumber: "924232460262",
      humanNumber: "03094836196",
    };
    expect(
      validateCallInputs({
        ...base,
        additionalAttributes: { customer_id: "customer-42" },
      }).additionalAttributes,
    ).toEqual({ customer_id: "customer-42" });
    expect(() =>
      validateCallInputs({
        ...base,
        additionalAttributes: { human_number: "override" },
      }),
    ).toThrow(/managed by the call form/i);
    expect(() =>
      validateCallInputs({
        ...base,
        additionalAttributes: { customer_id: 42 },
      }),
    ).toThrow(/string value/i);
  });

  it("accepts every valid deployment name and validates malformed input", () => {
    expect(
      validateCallInputs({
        agentId: 137,
        dispatchName: "pentagonai-hostinger",
        agentNumber: "924232460262",
        humanNumber: "03094836196",
      }).dispatchName,
    ).toBe("pentagonai-hostinger");
    expect(() =>
      validateCallInputs({
        agentId: 137,
        dispatchName: "invalid deployment!",
        agentNumber: "924232460262",
        humanNumber: "03094836196",
      }),
    ).toThrow(/letters, numbers/i);
    expect(() =>
      validateCallInputs({
        agentId: 0,
        dispatchName: "pentagonai",
        agentNumber: "123",
        humanNumber: "03094836196",
      }),
    ).toThrow(/valid agent/i);
  });

  it("bounds token requests per user", () => {
    resetWorkflowTokenRateLimit();
    for (let index = 0; index < 10; index += 1)
      expect(consumeWorkflowTokenQuota("user", index)).toBe(true);
    expect(consumeWorkflowTokenQuota("user", 10)).toBe(false);
  });

  it("uses an editable environment dispatch with a hostinger fallback", () => {
    vi.stubEnv("LIVEKIT_AGENT_DISPATCH", "");
    vi.stubEnv("AGENT_NAME", "");
    vi.stubEnv("LIVEKIT_ALLOWED_AGENT_NAMES", "");
    expect(getWorkflowTestDispatchConfiguration()).toEqual({
      defaultDispatchName: "pentagonai-hostinger",
      allowedDispatchNames: ["pentagonai-hostinger"],
    });

    vi.stubEnv("LIVEKIT_AGENT_DISPATCH", "appointments-worker");
    vi.stubEnv("LIVEKIT_ALLOWED_AGENT_NAMES", "pentagonai,backup-worker");
    expect(getWorkflowTestDispatchConfiguration()).toEqual({
      defaultDispatchName: "appointments-worker",
      allowedDispatchNames: [
        "appointments-worker",
        "pentagonai",
        "backup-worker",
      ],
    });
  });
});
