import { describe, expect, it } from "vitest";

import {
  createLinearWorkflowDefinition,
  createSupervisorWorkflowDefinition,
} from "@/lib/workflow-studio/starterDefinition";
import { validateWorkflowDefinition } from "@/components/workflow-editor/utils/validation";

describe("linear workflow definition", () => {
  it("creates a valid lead qualification main and global graph", () => {
    const definition = createLinearWorkflowDefinition();
    const validation = validateWorkflowDefinition(definition, ["getbroker"]);

    expect(validation.errors).toEqual([]);
    expect(definition.schema_version).toBe(2);
    expect(definition.architecture).toBe("linear");
    expect(definition.flows?.main.entry_node_id).toBe("start");
    expect(definition.flows?.global.intents?.map((item) => item.id)).toEqual([
      "end_request",
      "transfer_request",
      "callback_request",
    ]);
  });

  it("uses the required need, authority, and 90-day qualification rule", () => {
    const definition = createLinearWorkflowDefinition();
    const qualified = definition.flows!.main.edges.find(
      (edge) => edge.id === "main_qualified",
    );
    expect(qualified?.condition).toEqual({
      all: [
        { path: "lead.has_need", operator: "equals", value: true },
        {
          path: "lead.role",
          operator: "in",
          value: ["decision_maker", "influencer"],
        },
        {
          path: "lead.timeline",
          operator: "in",
          value: ["now", "30_days", "90_days"],
        },
      ],
    });
  });

  it("records callback preferences without promising scheduling", () => {
    const definition = createLinearWorkflowDefinition();
    const disclosure = definition.flows!.global.nodes.callback_disclosure;
    expect(disclosure.message).toContain("for this call only");
    expect(disclosure.message).toContain("does not schedule or guarantee");
  });

  it("keeps supervisor definitions legacy compatible", () => {
    const definition = createSupervisorWorkflowDefinition();
    expect(definition.schema_version).toBe(1);
    expect(definition.architecture).toBeUndefined();
    expect(validateWorkflowDefinition(definition).isValid).toBe(true);
  });

  it("rejects cycles, missing split defaults, and unknown tools", () => {
    const cyclic = createLinearWorkflowDefinition();
    cyclic.flows!.main.edges.push({
      id: "cycle",
      source: "nurture_end",
      target: "start",
    });
    expect(validateWorkflowDefinition(cyclic, ["getbroker"]).isValid).toBe(false);

    const noDefault = createLinearWorkflowDefinition();
    noDefault.flows!.main.edges = noDefault.flows!.main.edges.filter(
      (edge) => edge.id !== "main_unqualified",
    );
    expect(validateWorkflowDefinition(noDefault, ["getbroker"]).isValid).toBe(false);

    const unknownTool = createLinearWorkflowDefinition();
    unknownTool.flows!.main.nodes.sales_lookup.tool = "missing";
    expect(validateWorkflowDefinition(unknownTool, ["getbroker"]).isValid).toBe(false);
  });

  it("reports an actionable error for an empty condition state path", () => {
    const definition = createLinearWorkflowDefinition();
    const conditionedEdge = definition.flows!.main.edges.find(
      (edge) => edge.condition,
    );
    expect(conditionedEdge?.condition).toBeDefined();
    conditionedEdge!.condition = {
      path: "",
      operator: "exists",
    };

    const validation = validateWorkflowDefinition(definition, ["getbroker"]);

    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("condition needs a state path"),
        }),
      ]),
    );
    expect(validation.errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining('unknown state ““'),
        }),
      ]),
    );
  });
});
