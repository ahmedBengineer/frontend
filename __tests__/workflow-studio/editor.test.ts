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
import { buildMainAgentGraph, buildWorkflowGraph } from "@/components/workflow-editor/utils/graphBuilder";
import {
  connectSupervisorTasks,
  ensureSupervisorGraph,
  setSupervisorTaskPosition,
} from "@/components/workflow-editor/utils/supervisorGraph";
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

describe("supervisor task graphs", () => {
  it("upgrades a legacy task order and persists task positions", () => {
    const withCreate = addTask(
      base,
      "booking",
      "create",
      createTask("action", { toolName: "create_appointment" }),
    );
    const graph = ensureSupervisorGraph(withCreate, "booking");
    const positioned = setSupervisorTaskPosition(graph, "booking", "create", { x: 420, y: 210 });
    expect(positioned.schema_version).toBe(2);
    expect(positioned.architecture).toBe("supervisor");
    expect(positioned.workflows?.booking.entry_task_id).toBe("details");
    expect(positioned.workflows?.booking.task_edges).toEqual([
      expect.objectContaining({ source: "details", target: "create" }),
    ]);
    expect(buildWorkflowGraph(positioned, "booking").nodes.find((node) => node.id.endsWith(":create"))?.position)
      .toEqual({ x: 420, y: 210 });
  });

  it("creates a deterministic conditioned branch with one default", () => {
    let graph = structuredClone(base);
    graph = addTask(graph, "booking", "found", createTask("action", { toolName: "lookup" }));
    graph = addTask(graph, "booking", "missing", createTask("action", { toolName: "create_appointment" }));
    graph = connectSupervisorTasks(ensureSupervisorGraph({ ...graph, workflows: {
      ...graph.workflows,
      booking: { ...graph.workflows!.booking, task_edges: [] },
    } }, "booking"), "booking", "details", "found", "patient_name");
    graph = connectSupervisorTasks(graph, "booking", "details", "missing", "patient_name");
    const outgoing = graph.workflows!.booking.task_edges!.filter((edge) => edge.source === "details");
    expect(outgoing.filter((edge) => edge.default)).toHaveLength(1);
    expect(outgoing.filter((edge) => edge.condition)).toEqual([
      expect.objectContaining({ target: "missing", condition: { path: "patient_name", operator: "exists" } }),
    ]);
  });

  it("validates graph branches, reachability, cycles, and condition paths", () => {
    const invalid = structuredClone(base);
    invalid.schema_version = 2;
    invalid.architecture = "supervisor";
    invalid.workflows!.booking.entry_task_id = "details";
    invalid.workflows!.booking.task_group.second = { kind: "collect", collect: { name: { state: "patient_name" } } };
    invalid.workflows!.booking.task_order.push("second");
    invalid.workflows!.booking.task_edges = [
      { id: "bad", source: "details", target: "second", condition: { path: "missing", operator: "exists" } },
      { id: "back", source: "second", target: "details" },
    ];
    const messages = validateWorkflowDefinition(invalid, []).errors.map((item) => item.message).join(" ");
    expect(messages).toMatch(/unknown state/i);
    expect(messages).toMatch(/single transition/i);
    expect(messages).toMatch(/cycle/i);
  });

  it("tracks state references used by branch conditions", () => {
    const graph = ensureSupervisorGraph(base, "booking");
    graph.workflows!.booking.task_edges = [{
      id: "loop_for_reference_only",
      source: "details",
      target: "details",
      condition: { path: "patient_name", operator: "exists" },
    }];
    expect(findStateReferences(graph, "patient_name")).toContain(
      "booking.task_edges.loop_for_reference_only.condition",
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
