import { describe, expect, it } from "vitest";

import {
  copyLinearSelection,
  deleteLinearSelection,
  pasteLinearSelection,
} from "@/components/workflow-editor/utils/linearCanvasCommands";
import { createLinearWorkflowDefinition } from "@/lib/workflow-studio/starterDefinition";

describe("linear canvas commands", () => {
  it("deletes selected edges without deleting their nodes", () => {
    const flow = createLinearWorkflowDefinition().flows!.main;
    const edge = flow.edges[0];

    const updated = deleteLinearSelection(flow, [], [edge.id]);

    expect(updated.edges.some((item) => item.id === edge.id)).toBe(false);
    expect(updated.nodes[edge.source]).toBeDefined();
    expect(updated.nodes[edge.target]).toBeDefined();
  });

  it("deletes multiple nodes and their connected edges but protects Start", () => {
    const flow = createLinearWorkflowDefinition().flows!.main;
    const updated = deleteLinearSelection(
      flow,
      [flow.entry_node_id, "welcome", "engagement_split"],
      [],
    );

    expect(updated.nodes[flow.entry_node_id]).toBeDefined();
    expect(updated.nodes.welcome).toBeUndefined();
    expect(updated.nodes.engagement_split).toBeUndefined();
    expect(
      updated.edges.some(
        (edge) =>
          edge.source === "welcome" ||
          edge.target === "welcome" ||
          edge.source === "engagement_split" ||
          edge.target === "engagement_split",
      ),
    ).toBe(false);
  });

  it("copies and pastes a node group with internal connections and unique IDs", () => {
    const flow = createLinearWorkflowDefinition().flows!.main;
    const clipboard = copyLinearSelection(flow, [
      "welcome",
      "engagement_split",
      "discover_need",
    ]);
    expect(clipboard).not.toBeNull();

    const first = pasteLinearSelection(flow, clipboard!, { x: 40, y: 50 });
    const second = pasteLinearSelection(first.flow, clipboard!, { x: 80, y: 100 });

    expect(first.nodeIds).toEqual([
      "welcome_copy",
      "engagement_split_copy",
      "discover_need_copy",
    ]);
    expect(second.nodeIds).toEqual([
      "welcome_copy_2",
      "engagement_split_copy_2",
      "discover_need_copy_2",
    ]);
    expect(
      first.flow.edges.some(
        (edge) =>
          edge.source === "welcome_copy" &&
          edge.target === "engagement_split_copy",
      ),
    ).toBe(true);
    expect(first.flow.nodes.welcome_copy.ui?.position).toEqual({
      x: (flow.nodes.welcome.ui?.position?.x ?? 0) + 40,
      y: (flow.nodes.welcome.ui?.position?.y ?? 0) + 50,
    });
  });

  it("does not duplicate the single Start node", () => {
    const flow = createLinearWorkflowDefinition().flows!.main;
    expect(copyLinearSelection(flow, [flow.entry_node_id])).toBeNull();
  });
});
