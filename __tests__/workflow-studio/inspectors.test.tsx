import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TaskInspector } from "@/components/workflow-editor/inspectors/TaskInspector";
import { RouterInspector } from "@/components/workflow-editor/inspectors/RouterInspector";
import { VariableInspector } from "@/components/workflow-editor/inspectors/VariableInspector";
import { LinearNodeInspector } from "@/components/workflow-editor/inspectors/LinearNodeInspector";
import type { AgentJsonObject } from "@/components/workflow-editor/types";

afterEach(cleanup);
beforeEach(() => vi.stubGlobal("React", React));

const jsonObject: AgentJsonObject = {
  schema_version: 1,
  assistant: { routing_instructions: [] },
  state: {
    fields: {
      "booking.appointment_id": { type: "string", nullable: true },
      "booking.requested_date": { type: "string", nullable: true },
    },
    dependencies: {},
  },
  workflows: {
    update_appointment: {
      task_group: {
        confirm_and_update: {
          kind: "action",
          action_tool: "update_appointment",
          action_arguments: {},
        },
      },
      task_order: ["confirm_and_update"],
    },
  },
};

describe("workflow inspectors", () => {
  it("edits supervisor global instructions", () => {
    const onUpdate = vi.fn();
    render(
      <RouterInspector
        assistant={{ routing_instructions: [] }}
        taskDefaults={{ instructions: ["Keep responses concise."] }}
        onUpdate={onUpdate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Global Instructions" }));
    fireEvent.change(screen.getByDisplayValue("Keep responses concise."), {
      target: { value: "Always verify external actions." },
    });
    const updater = onUpdate.mock.calls[0][0];
    expect(updater(jsonObject).task_defaults?.instructions).toEqual([
      "Always verify external actions.",
    ]);
  });

  it("shows and edits the default tools assigned to the router", () => {
    const onDefaultToolsChange = vi.fn();
    render(
      <RouterInspector
        assistant={{ routing_instructions: [] }}
        onUpdate={vi.fn()}
        includeDefaultTools
        defaultToolNames={["end_call"]}
        onDefaultToolsChange={onDefaultToolsChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Default Tools" }));
    expect(
      screen.getByRole("switch", { name: "Enable router default tools" }),
    ).toBeChecked();
    expect(screen.getByRole("button", { name: /end_call/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: /transfer_call/i }));
    expect(onDefaultToolsChange).toHaveBeenCalledWith(true, [
      "end_call",
      "transfer_call",
    ]);
  });

  it("opens a task directly on the requested Instructions tab", () => {
    const task =
      jsonObject.workflows!.update_appointment.task_group.confirm_and_update;
    render(
      <TaskInspector
        taskId="confirm_and_update"
        workflowId="update_appointment"
        task={task}
        jsonObject={jsonObject}
        availableTools={[]}
        onUpdate={vi.fn()}
        focusTab="instructions"
        focusRequestId={1}
      />,
    );

    expect(screen.getByText("Entry prompt")).toBeVisible();
    expect(screen.getByText("On enter instructions")).toBeVisible();
  });

  it("reopens router instructions after the user visited another tab", () => {
    const props = {
      assistant: {
        routing_instructions: ["Route appointment changes to update_appointment."],
      },
      onUpdate: vi.fn(),
      focusTab: "routing" as const,
    };
    const { rerender } = render(
      <RouterInspector {...props} focusRequestId={1} />,
    );

    expect(screen.getByText(/Route appointment changes/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    expect(screen.getByText("Workflow tool description")).toBeVisible();

    rerender(<RouterInspector {...props} focusRequestId={2} />);
    expect(screen.getByText(/Route appointment changes/)).toBeVisible();
  });

  it("opens common instructions directly when requested from the router card", () => {
    render(
      <RouterInspector
        assistant={{ routing_instructions: [] }}
        taskDefaults={{ instructions: ["Always use feminine Urdu."] }}
        onUpdate={vi.fn()}
        focusTab="global"
        focusRequestId={1}
      />,
    );

    expect(screen.getByDisplayValue("Always use feminine Urdu.")).toBeVisible();
  });

  it("adds dotted runtime state paths from the variable form", () => {
    const onUpdate = vi.fn();
    render(<VariableInspector jsonObject={jsonObject} onUpdate={onUpdate} />);
    fireEvent.change(screen.getByLabelText("New state field"), {
      target: { value: "booking.doctor_id" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    const updater = onUpdate.mock.calls[0][0];
    const updated = updater(jsonObject) as AgentJsonObject;
    expect(updated.state?.fields["booking.doctor_id"]).toEqual({
      type: "string",
      nullable: true,
    });
  });

  it("maps action-tool parameters to state without editing raw JSON", () => {
    const onUpdate = vi.fn();
    const task = jsonObject.workflows!.update_appointment.task_group.confirm_and_update;
    render(
      <TaskInspector
        taskId="confirm_and_update"
        workflowId="update_appointment"
        task={task}
        jsonObject={jsonObject}
        availableTools={[
          {
            name: "update_appointment",
            parameters: {
              appointment_id: {
                type: "string",
                required: true,
                description: "Exact appointment UUID",
              },
            },
          },
        ]}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.getByText("Exact appointment UUID")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Map appointment_id to state"), {
      target: { value: "{state.booking.appointment_id}" },
    });

    const updater = onUpdate.mock.calls[0][0];
    const updated = updater(jsonObject) as AgentJsonObject;
    expect(
      updated.workflows!.update_appointment.task_group.confirm_and_update
        .action_arguments,
    ).toEqual({ appointment_id: "{state.booking.appointment_id}" });
  });

  it("connects and deletes linear blocks from explicit inspector controls", () => {
    const onEdgesChange = vi.fn();
    const onDeleteNode = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <LinearNodeInspector
        nodeId="conversation_1"
        node={{ type: "conversation", label: "Conversation", mode: "message", message: "Hello" }}
        edges={[]}
        allNodes={{
          start: { type: "start", label: "Start" },
          conversation_1: { type: "conversation", label: "Conversation" },
          end: { type: "end_call", label: "End call" },
        }}
        stateFields={["session.global_intent"]}
        entryNodeId="start"
        tools={[]}
        onNodeChange={vi.fn()}
        onEdgesChange={onEdgesChange}
        onDeleteNode={onDeleteNode}
      />,
    );

    fireEvent.change(screen.getByLabelText("Next block"), {
      target: { value: "end" },
    });
    expect(onEdgesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        source: "conversation_1",
        target: "end",
      }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Delete block" }));
    expect(onDeleteNode).toHaveBeenCalledOnce();
  });

  it("updates and removes logic split branches from the inspector", () => {
    const onEdgesChange = vi.fn();
    const edges = [
      {
        id: "branch_default",
        source: "split",
        target: "end_a",
        default: true,
      },
      {
        id: "branch_condition",
        source: "split",
        target: "end_b",
        condition: { path: "lead.ready", operator: "equals" as const, value: true },
      },
    ];

    render(
      <LinearNodeInspector
        nodeId="split"
        node={{ type: "logic_split", label: "Decision" }}
        edges={edges}
        allNodes={{
          split: { type: "logic_split", label: "Decision" },
          end_a: { type: "end_call", label: "End A" },
          end_b: { type: "end_call", label: "End B" },
        }}
        stateFields={["lead.ready", "session.global_intent"]}
        entryNodeId="start"
        tools={[]}
        onNodeChange={vi.fn()}
        onEdgesChange={onEdgesChange}
        onDeleteNode={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Branch 1 target"), {
      target: { value: "end_b" },
    });
    expect(onEdgesChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "branch_default", target: "end_b" }),
      edges[1],
    ]);

    fireEvent.click(screen.getAllByRole("button", { name: "Remove branch" })[1]);
    expect(onEdgesChange).toHaveBeenLastCalledWith([edges[0]]);
  });

  it("creates conditioned split branches with a valid state path", () => {
    const onEdgesChange = vi.fn();
    const edges = [
      {
        id: "branch_default",
        source: "split",
        target: "end_a",
        default: true,
      },
    ];

    render(
      <LinearNodeInspector
        nodeId="split"
        node={{ type: "logic_split", label: "Decision" }}
        edges={edges}
        allNodes={{
          split: { type: "logic_split", label: "Decision" },
          end_a: { type: "end_call", label: "End A" },
        }}
        stateFields={["lead.ready", "session.global_intent"]}
        entryNodeId="start"
        tools={[]}
        onNodeChange={vi.fn()}
        onEdgesChange={onEdgesChange}
        onDeleteNode={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add branch" }));

    expect(onEdgesChange).toHaveBeenCalledWith([
      edges[0],
      expect.objectContaining({
        source: "split",
        target: "end_a",
        condition: { path: "lead.ready", operator: "exists" },
      }),
    ]);
  });
});
