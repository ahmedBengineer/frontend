import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLinearWorkflowDefinition } from "@/lib/workflow-studio/starterDefinition";
import { WorkflowStudio } from "@/components/workflow-editor/WorkflowStudio";

const studioMocks = vi.hoisted(() => ({
  save: vi.fn(async () => true),
  reload: vi.fn(async () => undefined),
  push: vi.fn(),
  replace: vi.fn(),
}));

const invalidDefinition = createLinearWorkflowDefinition();
invalidDefinition.flows!.main.nodes.unconnected = {
  type: "conversation",
  label: "Unconnected",
  mode: "message",
  message: "Draft message",
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: studioMocks.push, replace: studioMocks.replace }),
  useSearchParams: () => new URLSearchParams("agentId=368"),
}));

vi.mock("@xyflow/react", () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn(), mounted: true }),
}));

vi.mock("@/components/workflow-test/WorkflowTestPanel", () => ({
  WorkflowTestPanel: () => <div>Test panel</div>,
}));

vi.mock("@/components/workflow-editor/LinearWorkflowCanvas", () => ({
  LinearWorkflowCanvas: () => <div>Linear canvas</div>,
}));

vi.mock("@/components/workflow-editor/WorkflowCanvas", () => ({
  WorkflowCanvas: () => <div>Supervisor canvas</div>,
}));

vi.mock("@/components/workflow-editor/hooks/useWorkflowAgents", () => ({
  useWorkflowAgents: () => ({
    workflowAgents: [{ id: 368, name: "Draft agent", twilio_phone_numbers: [] }],
    isLoading: false,
    error: null,
    reload: studioMocks.reload,
  }),
}));

vi.mock("@/components/workflow-editor/hooks/useAgentDefinition", () => ({
  useAgentDefinition: () => ({
    definition: {
      id: 368,
      name: "Draft agent",
      agent_type: "workflow",
      json_object: invalidDefinition,
      twilio_phone_numbers: [],
      custom_features: [],
      include_default_tools: false,
      default_tool_names: [],
    },
    agentType: "workflow",
    jsonObject: invalidDefinition,
    agentName: "Draft agent",
    availableTools: [{ name: "getbroker" }],
    isLoading: false,
    isSaving: false,
    isDirty: true,
    hasConflict: false,
    loadError: null,
    saveError: null,
    saveSuccess: false,
    updateJsonObject: vi.fn(),
    replaceJsonObject: vi.fn(),
    save: studioMocks.save,
    reload: studioMocks.reload,
  }),
}));

describe("workflow studio draft saving", () => {
  beforeEach(() => {
    vi.stubGlobal("React", React);
    studioMocks.save.mockClear();
  });

  afterEach(cleanup);

  it("allows an invalid dirty linear workflow to be saved as a draft", () => {
    render(<WorkflowStudio />);

    const saveButton = screen.getByRole("button", { name: "Save draft" });
    expect(saveButton).toBeEnabled();
    expect(screen.getByText(/errors/)).toBeInTheDocument();

    fireEvent.click(saveButton);
    expect(studioMocks.save).toHaveBeenCalledWith("PATCH");
  });

  it("keeps the agent dropdown above the workflow canvas", () => {
    render(<WorkflowStudio />);

    fireEvent.click(
      screen.getByRole("button", { name: /Draft agent · Agent 368/i }),
    );

    const search = screen.getByPlaceholderText("Search name, ID, or number");
    expect(search).toBeVisible();
    expect(search.closest("header")).toHaveClass("z-[1000]", "overflow-visible");
  });
});
