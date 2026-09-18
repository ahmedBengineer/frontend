import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";

const setMicrophoneEnabled = vi.fn().mockResolvedValue(undefined);

vi.mock("@livekit/components-react", () => ({
  StartAudio: () => null,
  useConnectionState: () => "connected",
  useLocalParticipant: () => ({
    localParticipant: {
      isMicrophoneEnabled: true,
      setMicrophoneEnabled,
    },
  }),
  useRoomInfo: () => ({ name: "test-room" }),
  useVoiceAssistant: () => ({
    agent: { identity: "test-agent" },
    audioTrack: undefined,
    state: "listening",
  }),
}));

vi.mock("@/components/agents-ui/agent-audio-visualizer-aura", () => ({
  AgentAudioVisualizerAura: () => <div>Audio visualizer</div>,
}));

vi.mock("@/components/workflow-test/Transcript", () => ({
  Transcript: () => {
    const [draft, setDraft] = useState("");
    return (
      <input
        aria-label="Persistent conversation draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    );
  },
}));

vi.mock("@/components/workflow-test/ExecutionTimeline", () => ({
  ExecutionTimeline: () => <div>Execution timeline content</div>,
}));

vi.mock("@/components/workflow-test/ToolCallHistory", () => ({
  ToolCallHistory: () => <div>Tool history content</div>,
}));

import { ConnectedCallPanel } from "@/components/workflow-test/ConnectedCallPanel";
import { createExecutionState } from "@/lib/workflow-test/telemetry";

describe("connected call tabs", () => {
  it("keeps the conversation mounted when switching tabs", () => {
    render(
      <ConnectedCallPanel
        details={{
          serverUrl: "wss://example.test",
          roomName: "test-room",
          identity: "caller",
          accessToken: "test-token",
        }}
        execution={createExecutionState()}
        onEnd={vi.fn()}
      />,
    );

    const draft = screen.getByLabelText("Persistent conversation draft");
    fireEvent.change(draft, { target: { value: "Do not lose this" } });
    fireEvent.click(screen.getByRole("tab", { name: "execution" }));
    expect(draft).toHaveValue("Do not lose this");
    expect(draft).not.toBeVisible();
    fireEvent.click(screen.getByRole("tab", { name: "conversation" }));
    expect(draft).toBeVisible();
    expect(draft).toHaveValue("Do not lose this");
  });
});
