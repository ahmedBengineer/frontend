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

import { Transcript } from "@/components/workflow-test/Transcript";

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
});
