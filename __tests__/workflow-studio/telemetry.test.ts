import { describe, expect, it } from "vitest";

import type {
  WorkflowSnapshotV1,
  WorkflowTelemetryEventType,
  WorkflowTelemetryEventV1,
} from "@/lib/workflow-test/contracts";
import {
  applyTelemetryEvent,
  applyWorkflowSnapshot,
  createExecutionState,
  parseTelemetryEvent,
  parseWorkflowSnapshot,
  taskStatusKey,
  toolStatusKey,
} from "@/lib/workflow-test/telemetry";

function event(
  seq: number,
  type: WorkflowTelemetryEventType,
  overrides: Partial<WorkflowTelemetryEventV1> = {},
): WorkflowTelemetryEventV1 {
  return {
    version: 1,
    seq,
    timestamp: `2026-08-10T10:00:${String(seq).padStart(2, "0")}.000Z`,
    session_id: "session-one",
    agent_id: 137,
    agent_type: "workflow",
    type,
    workflow_id: null,
    task_id: null,
    tool_name: null,
    status: "active",
    ...overrides,
  };
}

describe("workflow telemetry parsing", () => {
  it("keeps only the fixed structural event schema", () => {
    const parsed = parseTelemetryEvent(
      JSON.stringify({
        ...event(1, "task.started", {
          workflow_id: "create_appointment",
          task_id: "personal_details",
        }),
        patient_name: "Jane Patient",
        arguments: { phone: "+15551234567" },
        result: "private result",
        authorization: "Bearer private-token",
        transcript: "private transcript",
      }),
      137,
    );
    expect(parsed).not.toBeNull();
    expect(Object.keys(parsed!)).toEqual([
      "version",
      "seq",
      "timestamp",
      "session_id",
      "agent_id",
      "agent_type",
      "type",
      "workflow_id",
      "task_id",
      "tool_name",
      "status",
      "state_fields",
      "state_values",
    ]);
    const serialized = JSON.stringify(parsed);
    for (const forbidden of [
      "Jane",
      "+1555",
      "private result",
      "Bearer",
      "transcript",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("rejects malformed, mismatched, and unsupported packets", () => {
    expect(parseTelemetryEvent("not json", 137)).toBeNull();
    expect(
      parseTelemetryEvent(
        JSON.stringify(event(1, "router.entered", { agent_id: 999 })),
        137,
      ),
    ).toBeNull();
    expect(
      parseTelemetryEvent(
        JSON.stringify({
          ...event(1, "router.entered"),
          type: "private.payload",
        }),
        137,
      ),
    ).toBeNull();
    expect(
      parseTelemetryEvent(
        JSON.stringify({ ...event(1, "router.entered"), version: 2 }),
        137,
      ),
    ).toBeNull();
  });

  it("parses a late-join snapshot", () => {
    const snapshot = parseWorkflowSnapshot(
      JSON.stringify({
        version: 1,
        seq: 12,
        session_id: "session-one",
        agent_id: 137,
        agent_type: "workflow",
        workflow_id: "create_appointment",
        task_id: "personal_details",
        status: "active",
        private_state: { patient_name: "Jane" },
      }),
      137,
    );
    expect(snapshot).toEqual({
      version: 1,
      seq: 12,
      session_id: "session-one",
      agent_id: 137,
      agent_type: "workflow",
      workflow_id: "create_appointment",
      task_id: "personal_details",
      status: "active",
    });
  });
});

describe("workflow execution reducer", () => {
  it("tracks linear node and selected edge telemetry", () => {
    const started = parseTelemetryEvent(
      JSON.stringify({
        ...event(1, "node.started", {
          workflow_id: "main",
          task_id: "discover_need",
        }),
        node_id: "discover_need",
      }),
      137,
    )!;
    const transitioned = parseTelemetryEvent(
      JSON.stringify({
        ...event(2, "transition.selected", {
          workflow_id: "main",
          task_id: "discover_need",
        }),
        node_id: "introduce_solution",
        edge_id: "main_need",
      }),
      137,
    )!;
    let state = applyTelemetryEvent(createExecutionState(), started);
    state = applyTelemetryEvent(state, transitioned);
    expect(state.currentWorkflowId).toBe("main");
    expect(state.currentTaskId).toBe("introduce_solution");
    expect(state.currentEdgeId).toBe("main_need");
  });

  it("maps router, workflow, task, tool, interruption, resume, and call events", () => {
    let state = createExecutionState();
    state = applyTelemetryEvent(state, event(1, "router.entered"));
    expect(state.routerStatus).toBe("active");

    state = applyTelemetryEvent(
      state,
      event(2, "workflow.started", { workflow_id: "create_appointment" }),
    );
    expect(state.workflowStatuses.create_appointment).toBe("active");

    state = applyTelemetryEvent(
      state,
      event(3, "task.started", {
        workflow_id: "create_appointment",
        task_id: "personal_details",
      }),
    );
    expect(
      state.taskStatuses[
        taskStatusKey("create_appointment", "personal_details")
      ],
    ).toBe("active");

    state = applyTelemetryEvent(
      state,
      event(4, "tool.started", {
        workflow_id: "create_appointment",
        task_id: "personal_details",
        tool_name: "lookup",
      }),
    );
    state = applyTelemetryEvent(
      state,
      event(5, "tool.completed", {
        workflow_id: "create_appointment",
        task_id: "personal_details",
        tool_name: "lookup",
        status: "completed",
      }),
    );
    expect(
      state.toolStatuses[
        toolStatusKey("create_appointment", "personal_details", "lookup")
      ],
    ).toBe("completed");

    state = applyTelemetryEvent(
      state,
      event(6, "task.completed", {
        workflow_id: "create_appointment",
        task_id: "personal_details",
        status: "completed",
      }),
    );
    state = applyTelemetryEvent(
      state,
      event(7, "task.regressed", {
        workflow_id: "create_appointment",
        task_id: "personal_details",
        status: "regressed",
      }),
    );
    expect(
      state.taskStatuses[
        taskStatusKey("create_appointment", "personal_details")
      ],
    ).toBe("regressed");

    state = applyTelemetryEvent(
      state,
      event(8, "workflow.interrupted", {
        workflow_id: "create_appointment",
        task_id: "personal_details",
        status: "interrupted",
      }),
    );
    expect(state.workflowStatuses.create_appointment).toBe("interrupted");
    state = applyTelemetryEvent(
      state,
      event(9, "workflow.resumed", {
        workflow_id: "create_appointment",
        task_id: "personal_details",
      }),
    );
    expect(state.workflowStatuses.create_appointment).toBe("resumed");
    state = applyTelemetryEvent(state, event(10, "call.transferring"));
    expect(state.callStatus).toBe("transferring");
  });

  it("tracks privacy-safe state updates without exposing values", () => {
    const state = applyTelemetryEvent(
      createExecutionState(),
      event(1, "state.updated", {
        workflow_id: "create_appointment",
        task_id: "personal_details",
        status: "updated",
        state_fields: ["booking.patient_name", "booking.phone"],
        state_values: {
          "booking.patient_name": "Jane Patient",
          "booking.phone": "+15551234567",
        },
      }),
    );
    expect(state.currentWorkflowId).toBe("create_appointment");
    expect(state.currentTaskId).toBe("personal_details");
    expect(state.events[0].state_fields).toEqual([
      "booking.patient_name",
      "booking.phone",
    ]);
    expect(
      state.updatedStateFields[
        taskStatusKey("create_appointment", "personal_details")
      ],
    ).toEqual(["booking.patient_name", "booking.phone"]);
    expect(
      state.stateValues[
        taskStatusKey("create_appointment", "personal_details")
      ],
    ).toEqual({
      "booking.patient_name": "Jane Patient",
      "booking.phone": "+15551234567",
    });
  });

  it("accumulates unique variable updates for each task", () => {
    let state = applyTelemetryEvent(
      createExecutionState(),
      event(1, "state.updated", {
        workflow_id: "update_appointment",
        task_id: "identify_appointment",
        state_fields: ["booking.patient_name", "booking.appointment_id"],
        state_values: {
          "booking.patient_name": "New Name",
          "booking.appointment_id": null,
        },
      }),
    );
    state = applyTelemetryEvent(
      state,
      event(2, "state.updated", {
        workflow_id: "update_appointment",
        task_id: "identify_appointment",
        state_fields: ["booking.patient_name", "booking.phone"],
        state_values: {
          "booking.patient_name": "Newest Name",
          "booking.phone": "+15557654321",
        },
      }),
    );
    expect(
      state.updatedStateFields[
        taskStatusKey("update_appointment", "identify_appointment")
      ],
    ).toEqual([
      "booking.patient_name",
      "booking.appointment_id",
      "booking.phone",
    ]);
    expect(
      state.stateValues[
        taskStatusKey("update_appointment", "identify_appointment")
      ],
    ).toEqual({
      "booking.patient_name": "Newest Name",
      "booking.appointment_id": null,
      "booking.phone": "+15557654321",
    });
  });

  it("returns the visible execution owner to the router", () => {
    let state = applyTelemetryEvent(
      createExecutionState(),
      event(1, "workflow.started", { workflow_id: "create_appointment" }),
    );
    state = applyTelemetryEvent(
      state,
      event(2, "workflow.completed", {
        workflow_id: "create_appointment",
        status: "end_call_requested",
      }),
    );
    state = applyTelemetryEvent(state, event(3, "router.entered"));
    expect(state.routerStatus).toBe("active");
    expect(state.currentWorkflowId).toBeNull();
    expect(state.currentTaskId).toBeNull();
  });

  it("returns visual ownership to the router as soon as call ending begins", () => {
    let state = applyTelemetryEvent(
      createExecutionState(),
      event(1, "task.started", {
        workflow_id: "create_appointment",
        task_id: "confirm_and_create",
      }),
    );
    state = applyTelemetryEvent(
      state,
      event(2, "call.ending", {
        workflow_id: "create_appointment",
        task_id: "confirm_and_create",
      }),
    );

    expect(state.routerStatus).toBe("active");
    expect(state.currentWorkflowId).toBeNull();
    expect(state.currentTaskId).toBeNull();
    expect(state.currentEdgeId).toBeNull();
    expect(state.callStatus).toBe("ending");
    expect(state.workflowStatuses.create_appointment).toBe("ending");
    expect(
      state.taskStatuses[
        taskStatusKey("create_appointment", "confirm_and_create")
      ],
    ).toBe("ending");

    state = applyTelemetryEvent(state, event(3, "router.entered"));
    expect(state.routerStatus).toBe("active");
    expect(state.callStatus).toBe("ending");
  });

  it("marks tool failure and workflow failure", () => {
    let state = createExecutionState();
    state = applyTelemetryEvent(
      state,
      event(1, "tool.failed", {
        workflow_id: "create_appointment",
        task_id: "confirm_and_create",
        tool_name: "create_appointment",
        status: "failed",
      }),
    );
    expect(
      state.toolStatuses[
        toolStatusKey(
          "create_appointment",
          "confirm_and_create",
          "create_appointment",
        )
      ],
    ).toBe("failed");
    state = applyTelemetryEvent(
      state,
      event(2, "workflow.completed", {
        workflow_id: "create_appointment",
        status: "failed",
      }),
    );
    expect(state.workflowStatuses.create_appointment).toBe("failed");
  });

  it("enforces monotonic sequence and session identity while reporting gaps", () => {
    let state = applyTelemetryEvent(
      createExecutionState(),
      event(1, "router.entered"),
    );
    const duplicate = applyTelemetryEvent(state, event(1, "call.ending"));
    expect(duplicate).toBe(state);
    const stale = applyTelemetryEvent(state, event(0, "call.ending"));
    expect(stale).toBe(state);
    state = applyTelemetryEvent(state, event(3, "call.ending"));
    expect(state.gapDetected).toBe(true);
    expect(state.callStatus).toBe("ending");
    const anotherSession = applyTelemetryEvent(
      state,
      event(4, "call.transferring", { session_id: "different-session" }),
    );
    expect(anotherSession).toBe(state);
  });

  it("hydrates task state from a snapshot and bounds event history", () => {
    const snapshot: WorkflowSnapshotV1 = {
      version: 1,
      seq: 12,
      session_id: "session-one",
      agent_id: 137,
      agent_type: "workflow",
      workflow_id: "create_appointment",
      task_id: "personal_details",
      status: "active",
    };
    let state = applyWorkflowSnapshot(createExecutionState(), snapshot);
    expect(state.currentTaskId).toBe("personal_details");
    expect(state.lastSeq).toBe(12);
    expect(state.events).toHaveLength(0);
    for (let seq = 13; seq < 230; seq += 1) {
      state = applyTelemetryEvent(state, event(seq, "router.entered"));
    }
    expect(state.events).toHaveLength(200);
    expect(state.events[0].seq).toBe(30);
  });
});
