import { act, renderHook, waitFor } from "@testing-library/react";
import type { Participant } from "livekit-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  WORKFLOW_EXECUTION_TOPIC,
  WORKFLOW_SNAPSHOT_ATTRIBUTE,
} from "@/lib/workflow-test/contracts";

const livekitMock = vi.hoisted(() => ({
  attributes: {} as Record<string, string>,
  callback: null as
    null | ((message: { payload: Uint8Array; from?: Participant }) => void),
  topic: "",
}));

vi.mock("@livekit/components-react", () => ({
  useDataChannel: (
    topic: string,
    callback: (message: { payload: Uint8Array; from?: Participant }) => void,
  ) => {
    livekitMock.topic = topic;
    livekitMock.callback = callback;
  },
  useParticipantAttributes: () => ({ attributes: livekitMock.attributes }),
}));

import { useWorkflowTelemetry } from "@/hooks/useWorkflowTelemetry";

describe("workflow telemetry hook", () => {
  beforeEach(() => {
    livekitMock.attributes = {};
    livekitMock.callback = null;
    livekitMock.topic = "";
  });

  it("hydrates a late join from the agent snapshot attribute", async () => {
    livekitMock.attributes = {
      [WORKFLOW_SNAPSHOT_ATTRIBUTE]: JSON.stringify({
        version: 1,
        seq: 8,
        session_id: "session-late",
        agent_id: 137,
        agent_type: "workflow",
        workflow_id: "create_appointment",
        task_id: "personal_details",
        status: "active",
      }),
    };

    const { result } = renderHook(() => useWorkflowTelemetry(137));

    await waitFor(() => expect(result.current.lastSeq).toBe(8));
    expect(result.current.currentWorkflowId).toBe("create_appointment");
    expect(result.current.currentTaskId).toBe("personal_details");
  });

  it("subscribes only to the telemetry topic and ignores non-agent senders", () => {
    const { result } = renderHook(() => useWorkflowTelemetry(137));
    expect(livekitMock.topic).toBe(WORKFLOW_EXECUTION_TOPIC);
    const payload = new TextEncoder().encode(
      JSON.stringify({
        version: 1,
        seq: 1,
        timestamp: "2026-08-10T10:00:00.000Z",
        session_id: "session-one",
        agent_id: 137,
        agent_type: "workflow",
        type: "router.entered",
        workflow_id: null,
        task_id: null,
        tool_name: null,
        status: "active",
      }),
    );

    act(() =>
      livekitMock.callback?.({
        payload,
        from: { isAgent: false } as Participant,
      }),
    );

    expect(result.current.telemetrySeen).toBe(false);
  });
});
