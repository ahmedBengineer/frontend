import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkflowTestPanel } from "@/components/workflow-test/WorkflowTestPanel";
import type { WorkflowAgentDefinition } from "@/components/workflow-editor/types";

const livekitMock = vi.hoisted(() => ({
  agent: undefined as { identity: string } | undefined,
}));

vi.mock("@livekit/components-react", () => ({
  LiveKitRoom: ({ children }: { children: React.ReactNode }) => children,
  RoomAudioRenderer: () => null,
  useVoiceAssistant: () => ({ agent: livekitMock.agent }),
}));

vi.mock("@/hooks/useWorkflowTelemetry", () => ({
  useWorkflowTelemetry: () => ({
    sessionId: null,
    lastSeq: 0,
    telemetrySeen: false,
    gapDetected: false,
    routerStatus: "idle",
    workflowStatuses: {},
    taskStatuses: {},
    toolStatuses: {},
    updatedStateFields: [],
    stateValues: {},
    currentWorkflowId: null,
    currentTaskId: null,
    callStatus: "idle",
    events: [],
  }),
}));

vi.mock("@/components/workflow-test/ConnectedCallPanel", () => ({
  ConnectedCallPanel: ({ onEnd }: { onEnd: () => void }) => (
    <div>
      <span>Connected test session</span>
      <button onClick={onEnd}>End mocked call</button>
    </div>
  ),
}));

const definition: WorkflowAgentDefinition = {
  id: 137,
  name: "Workflow agent",
  agent_type: "workflow",
  twilio_phone_numbers: ["924232460262"],
  json_object: {},
  custom_features: [],
  include_default_tools: false,
  default_tool_names: [],
};

afterEach(() => {
  cleanup();
  livekitMock.agent = undefined;
  vi.unstubAllGlobals();
});

describe("workflow test dispatch", () => {
  it("supports an agent-specific title and close control", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            dispatchName: "pentagonai-hostinger",
            dispatchNames: ["pentagonai-hostinger"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const onClose = vi.fn();

    render(
      <WorkflowTestPanel
        definition={definition}
        canStart
        title="Test Support agent"
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Test Support agent" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close test panel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("loads the environment default into an editable input", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            dispatchName: "appointments-worker",
            dispatchNames: ["appointments-worker", "pentagonai"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    render(
      <WorkflowTestPanel
        definition={definition}
        canStart
        onExecution={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Agent dispatch") as HTMLInputElement;
    await waitFor(() => expect(input.value).toBe("appointments-worker"));
    fireEvent.change(input, { target: { value: "pentagonai" } });
    expect(input.value).toBe("pentagonai");
  });

  it("validates and sends additional participant attributes", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      if (String(input) === "/api/workflow-test/config") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              dispatchName: "pentagonai",
              dispatchNames: ["pentagonai"],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            serverUrl: "wss://example.livekit.cloud",
            roomName: "workflow-studio-test",
            identity: "workflow-user-test",
            accessToken: "test-token",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    livekitMock.agent = { identity: "agent-test" };

    render(
      <WorkflowTestPanel
        definition={definition}
        canStart
        onExecution={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Human number")).toHaveValue("03094836196");
    expect(
      screen.queryByLabelText("Additional attributes (JSON)"),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Additional attributes" }),
    );
    fireEvent.change(screen.getByLabelText("Additional attributes (JSON)"), {
      target: {
        value: '{"customer_id":"customer-42","language":"ur"}',
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start test call" }));

    await screen.findByText("Connected test session");
    const tokenRequest = fetchMock.mock.calls.find(
      ([input]) => String(input) === "/api/workflow-test/token",
    );
    expect(tokenRequest).toBeDefined();
    expect(JSON.parse(String(tokenRequest?.[1]?.body))).toMatchObject({
      agentNumber: "924232460262",
      humanNumber: "03094836196",
      additionalAttributes: {
        customer_id: "customer-42",
        language: "ur",
      },
    });
  });

  it("blocks malformed or reserved additional attributes", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            dispatchName: "pentagonai",
            dispatchNames: ["pentagonai"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    render(
      <WorkflowTestPanel
        definition={definition}
        canStart
        onExecution={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Human number"), {
      target: { value: "03094836196" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Additional attributes" }),
    );
    const attributes = screen.getByLabelText("Additional attributes (JSON)");
    fireEvent.change(attributes, { target: { value: "{" } });
    expect(screen.getByText(/must be a valid JSON object/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Start test call" })).toBeDisabled();

    fireEvent.change(attributes, {
      target: { value: '{"human_number":"override"}' },
    });
    expect(screen.getByText(/managed by the call form/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Start test call" })).toBeDisabled();
  });

  it("keeps optional attributes collapsed and removes the security warning", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            dispatchName: "pentagonai-hostinger",
            dispatchNames: ["pentagonai-hostinger"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    render(
      <WorkflowTestPanel
        definition={definition}
        canStart
        onExecution={vi.fn()}
      />,
    );

    const toggle = screen.getByRole("button", {
      name: "Additional attributes",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText("Secure ephemeral session"),
    ).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Additional attributes (JSON)")).toBeVisible();
  });

  it("returns to the new-call form when the connected agent leaves", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              String(input) === "/api/workflow-test/config"
                ? {
                    dispatchName: "pentagonai",
                    dispatchNames: ["pentagonai"],
                  }
                : {
                    serverUrl: "wss://example.livekit.cloud",
                    roomName: "workflow-studio-test",
                    identity: "workflow-user-test",
                    accessToken: "test-token",
                  },
            ),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
      ),
    );
    livekitMock.agent = { identity: "agent-test" };
    const onExecution = vi.fn();
    const view = render(
      <WorkflowTestPanel
        definition={definition}
        canStart
        onExecution={onExecution}
      />,
    );
    fireEvent.change(screen.getByLabelText("Human number"), {
      target: { value: "03094836196" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start test call" }));
    await screen.findByText("Connected test session");

    livekitMock.agent = undefined;
    view.rerender(
      <WorkflowTestPanel
        definition={definition}
        canStart
        onExecution={onExecution}
      />,
    );

    await screen.findByRole("heading", { name: "Start workflow call" });
    expect(screen.queryByText("Connected test session")).not.toBeInTheDocument();
    expect(onExecution).toHaveBeenLastCalledWith(
      expect.objectContaining({ callStatus: "idle", events: [] }),
    );
  });
});
