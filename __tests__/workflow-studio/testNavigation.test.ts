import { describe, expect, it } from "vitest";

import {
  getAutoFollowNodeId,
  getAutoFollowView,
} from "@/components/workflow-editor/utils/testNavigation";

describe("supervisor test auto-follow navigation", () => {
  it("focuses the active workflow while the runtime is between tasks", () => {
    expect(
      getAutoFollowNodeId({
        viewMode: "main",
        activeWorkflowId: null,
        currentWorkflowId: "booking",
        currentTaskId: null,
      }),
    ).toBe("workflow:booking");
  });

  it("keeps focusing the workflow until the user opens its detail graph", () => {
    expect(
      getAutoFollowNodeId({
        viewMode: "main",
        activeWorkflowId: null,
        currentWorkflowId: "booking",
        currentTaskId: "details",
      }),
    ).toBe("workflow:booking");
    expect(
      getAutoFollowNodeId({
        viewMode: "detail",
        activeWorkflowId: "booking",
        currentWorkflowId: "booking",
        currentTaskId: "details",
      }),
    ).toBe("workflow:booking:task:details");
  });

  it("does not focus a task from a different open workflow", () => {
    expect(
      getAutoFollowNodeId({
        viewMode: "detail",
        activeWorkflowId: "cancel",
        currentWorkflowId: "booking",
        currentTaskId: "details",
      }),
    ).toBeNull();
  });

  it("switches the canvas when telemetry enters another workflow", () => {
    expect(
      getAutoFollowView({
        currentWorkflowId: "general_information",
        availableWorkflowIds: ["complaint_intake", "general_information"],
        routerActive: false,
      }),
    ).toEqual({
      viewMode: "detail",
      activeWorkflowId: "general_information",
    });
  });

  it("returns to all workflows while the router is active", () => {
    expect(
      getAutoFollowView({
        currentWorkflowId: null,
        availableWorkflowIds: ["complaint_intake"],
        routerActive: true,
      }),
    ).toEqual({ viewMode: "main", activeWorkflowId: null });
  });
});
