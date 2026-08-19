import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AddAgentWizard } from "@/components/add-agent-wizard";

const { pushMock, toastMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/components/tutorial/TutorialProvider", () => ({
  useTutorial: () => ({
    currentStep: null,
    nextStep: vi.fn(),
    jumpToStep: vi.fn(),
    markCheckpoint: vi.fn(),
    isActive: false,
  }),
}));

vi.mock("js-cookie", () => ({
  default: { get: () => "test-token" },
}));

describe("workflow agent creation", () => {
  afterEach(cleanup);
  beforeEach(() => {
    pushMock.mockReset();
    toastMock.mockReset();
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("submits a starter workflow definition and opens Workflow Studio", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 204, name: "New workflow agent" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onAgentAdded = vi.fn();

    render(
      <AddAgentWizard
        isOpen
        onClose={vi.fn()}
        onAgentAdded={onAgentAdded}
      />,
    );

    fireEvent.change(
      screen.getByPlaceholderText("e.g. Customer Support Agent"),
      { target: { value: "New workflow agent" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        "Describe the agent's personality, tone, behavior...",
      ),
      { target: { value: "Helpful and concise" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(
      screen.getByRole("button", { name: /Workflow based/ }),
    );
    fireEvent.change(screen.getByPlaceholderText("Describe the agent's goals..."), {
      target: { value: "Handle customer requests" },
    });
    fireEvent.change(screen.getByPlaceholderText("Add the system prompt..."), {
      target: { value: "Be accurate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Agent" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = request.body as FormData;
    const definition = JSON.parse(String(body.get("json_object")));

    expect(body.get("agent_type")).toBe("workflow");
    expect(definition.schema_version).toBe(1);
    expect(definition.workflows.main).toBeDefined();
    expect(onAgentAdded).toHaveBeenCalledWith(
      expect.objectContaining({ id: 204 }),
    );
    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/workflow-studio?agentId=204",
    );
  });

  it("creates the full linear starter when Linear is selected", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 368, name: "Linear agent" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AddAgentWizard isOpen onClose={vi.fn()} onAgentAdded={vi.fn()} />,
    );
    fireEvent.change(screen.getByPlaceholderText("e.g. Customer Support Agent"), {
      target: { value: "Linear agent" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Describe the agent's personality, tone, behavior..."),
      { target: { value: "Helpful" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: /Workflow based/ }));
    fireEvent.click(screen.getByRole("button", { name: /Linear Blocks follow/ }));
    fireEvent.change(screen.getByPlaceholderText("Describe the agent's goals..."), {
      target: { value: "Qualify leads" },
    });
    fireEvent.change(screen.getByPlaceholderText("Add the system prompt..."), {
      target: { value: "Be accurate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Agent" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = fetchMock.mock.calls[0][1].body as FormData;
    const definition = JSON.parse(String(body.get("json_object")));
    expect(definition.schema_version).toBe(2);
    expect(definition.architecture).toBe("linear");
    expect(definition.flows.main.nodes.qualified.type).toBe("logic_split");
    expect(definition.flows.global.nodes.callback_disclosure.message).toContain(
      "does not schedule or guarantee",
    );
  });
});
