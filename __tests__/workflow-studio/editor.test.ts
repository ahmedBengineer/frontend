import { describe, expect, it } from "vitest";
import type { AgentJsonObject } from "@/components/workflow-editor/types";
import {
  addTask,
  addWorkflow,
  createTask,
  removeTask,
  reorderTasks,
} from "@/components/workflow-editor/utils/editorMutations";
import { STATE_PATH_PATTERN } from "@/components/workflow-editor/utils/editorMutations";
import {
  findStateReferences,
  findWorkflowReferences,
  validateWorkflowDefinition,
} from "@/components/workflow-editor/utils/validation";
import { buildMainAgentGraph } from "@/components/workflow-editor/utils/graphBuilder";
import {
  matchesAgentRuntime,
  normalizeAgentRuntime,
} from "@/lib/agents/runtime";
import { createStarterWorkflowDefinition } from "@/lib/workflow-studio/starterDefinition";

const base: AgentJsonObject = {
  schema_version: 1,
  assistant: { routing_instructions: ["Choose a workflow"] },
  state: {
    fields: { patient_name: { type: "string", nullable: true } },
    dependencies: {},
  },
  workflows: {
    booking: {
      description: "Book",
      task_group: {
        details: {
          kind: "collect",
          collect: { name: { state: "patient_name" } },
        },
      },
      task_order: ["details"],
      interruptible_by: [],
    },
  },
};

describe("workflow editor mutations", () => {
  it("accepts runtime dotted state paths and rejects malformed paths", () => {
    expect(STATE_PATH_PATTERN.test("booking.appointment_id")).toBe(true);
    expect(STATE_PATH_PATTERN.test("session.inbound_phone")).toBe(true);
    expect(STATE_PATH_PATTERN.test("Booking Patient")).toBe(false);
  });
  it("creates each runtime-supported task kind", () => {
    expect(
      createTask("collect", { stateField: "patient_name" }).collect,
    ).toEqual({ patient_name: { state: "patient_name" } });
    expect(
      createTask("action", { toolName: "create_appointment" }).action_tool,
    ).toBe("create_appointment");
    expect(createTask("answer", { toolName: "lookup" }).answer_tool).toBe(
      "lookup",
    );
  });

  it("adds and reorders tasks while keeping task_order exact", () => {
    const withTask = addTask(
      base,
      "booking",
      "create",
      createTask("action", { toolName: "create_appointment" }),
    );
    expect(withTask.workflows?.booking.task_order).toEqual([
      "details",
      "create",
    ]);
    const reordered = reorderTasks(withTask, "booking", 1, 0);
    expect(reordered.workflows?.booking.task_order).toEqual([
      "create",
      "details",
    ]);
  });

  it("prevents deleting the final task", () => {
    expect(() => removeTask(base, "booking", "details")).toThrow(
      /at least one task/i,
    );
  });

  it("adds workflows without losing unknown fields", () => {
    const source = { ...base, future_backend_field: { keep: true } };
    const next = addWorkflow(source, "questions", {
      task_group: { answer: createTask("answer", { toolName: "lookup" }) },
      task_order: ["answer"],
    });
    expect(next.future_backend_field).toEqual({ keep: true });
  });
});

describe("workflow validation and referenced deletes", () => {
  it("accepts a valid workflow and assigned tool", () => {
    const result = validateWorkflowDefinition(base, ["create_appointment"]);
    expect(result.isValid).toBe(true);
  });

  it("rejects missing task order, tools, state fields, and unsupported kinds", () => {
    const invalid = structuredClone(base);
    invalid.workflows!.booking.task_order = [];
    invalid.workflows!.booking.task_group.details = {
      kind: "unsupported",
      tools: ["private_payload_tool"],
      required_state: ["missing"],
    };
    const result = validateWorkflowDefinition(invalid, []);
    expect(result.errors.map((error) => error.message).join(" ")).toMatch(
      /task_order.*Unsupported.*Unknown required.*Unknown or unavailable/i,
    );
  });

  it("reports workflow and state references", () => {
    const source = structuredClone(base);
    source.workflows!.interrupt = {
      task_group: {
        details: {
          kind: "collect",
          collect: { name: { state: "patient_name" } },
        },
      },
      task_order: ["details"],
      interruptible_by: ["booking"],
    };
    expect(findWorkflowReferences(source, "booking")).toEqual([
      "workflows.interrupt.interruptible_by",
    ]);
    expect(findStateReferences(source, "patient_name")).toContain(
      "booking/details.collect",
    );
  });
});

describe("new workflow agents", () => {
  it("starts valid with an implicit router and an editable main workflow", () => {
    const definition = createStarterWorkflowDefinition();
    const validation = validateWorkflowDefinition(definition, []);
    const graph = buildMainAgentGraph(definition);

    expect(validation.errors).toEqual([]);
    expect(graph.nodes.find((node) => node.id === "router")).toBeDefined();
    expect(
      graph.nodes.find((node) => node.id === "workflow:main"),
    ).toBeDefined();
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "router", target: "workflow:main" }),
      ]),
    );
  });

  it("normalizes legacy agents and filters workflow runtimes", () => {
    expect(normalizeAgentRuntime(undefined)).toBe("standard");
    expect(normalizeAgentRuntime("workflow")).toBe("workflow");
    expect(matchesAgentRuntime("workflow", "workflow")).toBe(true);
    expect(matchesAgentRuntime("standard", "workflow")).toBe(false);
    expect(matchesAgentRuntime("standard", "ALL")).toBe(true);
  });
});
