import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const livekitMock = vi.hoisted(() => ({
  agentTrack: { participant: { identity: "agent-one" } },
  agentSegments: [] as Array<Record<string, unknown>>,
  chatMessages: [] as Array<Record<string, unknown>>,
  localSegments: [] as Array<Record<string, unknown>>,
  send: vi.fn(),
}));

vi.mock("@livekit/components-react", () => ({
  useChat: () => ({
    chatMessages: livekitMock.chatMessages,
    send: livekitMock.send,
  }),
  useLocalParticipant: () => ({
    localParticipant: { identity: "caller-one", getTrackPublication: vi.fn() },
  }),
  useTrackTranscription: (track: unknown) => ({
    segments:
      track === livekitMock.agentTrack
        ? livekitMock.agentSegments
        : livekitMock.localSegments,
  }),
}));

import {
  buildConversationExport,
  Transcript,
} from "@/components/workflow-test/Transcript";
import { createExecutionState } from "@/lib/workflow-test/telemetry";

describe("conversation transcript", () => {
  beforeEach(() => {
    livekitMock.agentSegments = [];
    livekitMock.chatMessages = [];
    livekitMock.localSegments = [];
    livekitMock.send.mockReset();
    livekitMock.send.mockResolvedValue({});
  });

  it("provides an independently scrollable message region and typed input", async () => {
    render(<Transcript agentAudioTrack={livekitMock.agentTrack as never} />);
    expect(screen.getByTestId("transcript-scroll-region")).toHaveClass(
      "overflow-y-auto",
    );
    const input = screen.getByLabelText("Message the agent");
    fireEvent.change(input, { target: { value: "I need an appointment" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() =>
      expect(livekitMock.send).toHaveBeenCalledWith("I need an appointment"),
    );
    expect(input).toHaveValue("");
  });

  it("merges LiveKit chat messages with microphone transcription", () => {
    livekitMock.agentSegments = [
      { id: "agent-segment", text: "How may I help?", final: true },
    ];
    livekitMock.chatMessages = [
      {
        message: "Typed request",
        timestamp: Date.now() + 1,
        from: { identity: "caller-one" },
      },
    ];
    render(<Transcript agentAudioTrack={livekitMock.agentTrack as never} />);
    expect(screen.getByText("How may I help?")).toBeVisible();
    expect(screen.getByText("Typed request")).toBeVisible();
  });

  it("builds a structured conversation export with execution context", () => {
    const execution = {
      ...createExecutionState(),
      sessionId: "session-42",
      currentWorkflowId: "general_information",
      currentTaskId: "answer_verified_question",
    };
    const payload = buildConversationExport(
      [
        {
          id: "Agent:one",
          text: "Water services are available online.",
          speaker: "Agent",
          isSelf: false,
          timestamp: Date.parse("2026-08-21T09:00:00.000Z"),
          final: true,
          source: "transcription",
        },
      ],
      execution,
    );

    expect(payload).toMatchObject({
      schema_version: 1,
      type: "smartconvo.conversation",
      session_id: "session-42",
      workflow: "general_information",
      task: "answer_verified_question",
      messages: [
        {
          speaker: "Agent",
          text: "Water services are available online.",
          source: "transcription",
          timestamp: "2026-08-21T09:00:00.000Z",
          final: true,
        },
      ],
    });
  });
});
