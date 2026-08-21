import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React, { type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TaskNode } from "@/components/workflow-editor/nodes/TaskNode";
import { RouterNode } from "@/components/workflow-editor/nodes/RouterNode";
import { WorkflowNode } from "@/components/workflow-editor/nodes/WorkflowNode";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom" },
}));

afterEach(cleanup);
beforeEach(() => vi.stubGlobal("React", React));

describe("workflow task variable telemetry", () => {
  it("shows emitted state values in an accessible hover tooltip", async () => {
    render(
      <TaskNode
        {...({
          id: "workflow:create_appointment:task:personal_details",
          selected: false,
          data: {
            taskId: "personal_details",
            workflowId: "create_appointment",
            task: {
              kind: "collect",
              collect: {
                patient_name: { state: "booking.patient_name" },
                phone: { state: "booking.phone" },
              },
            },
            toolCount: 0,
            variableCount: 2,
            updatedStateFields: ["booking.patient_name"],
            stateValues: { "booking.patient_name": "Jane Patient" },
          },
        } as unknown as ComponentProps<typeof TaskNode>)}
      />,
    );

    const updated = screen.getByLabelText(
      "State variable booking.patient_name",
    );
    fireEvent.pointerMove(updated, { pointerType: "mouse" });
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "booking.patient_name",
      );
      expect(screen.getByRole("tooltip")).toHaveTextContent("Jane Patient");
    });

    const untouched = screen.getByLabelText("State variable booking.phone");
    fireEvent.focus(untouched);
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "Not updated in this test call",
      ),
    );
  });

  it("also shows an invalidated dependency reported by the runtime", async () => {
    render(
      <TaskNode
        {...({
          id: "workflow:update_appointment:task:identify_appointment",
          selected: false,
          data: {
            taskId: "identify_appointment",
            workflowId: "update_appointment",
            task: {
              kind: "collect",
              collect: {
                patient_name: { state: "booking.patient_name" },
              },
            },
            toolCount: 0,
            variableCount: 1,
            updatedStateFields: [
              "booking.patient_name",
              "booking.appointment_id",
            ],
            stateValues: {
              "booking.patient_name": "New Name",
              "booking.appointment_id": null,
            },
          },
        } as unknown as ComponentProps<typeof TaskNode>)}
      />,
    );

    const invalidated = screen.getByLabelText(
      "State variable booking.appointment_id",
    );
    fireEvent.focus(invalidated);
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent("cleared"),
    );
  });
});

describe("workflow task tool telemetry", () => {
  it("shows the latest tool parameters and response on hover", async () => {
    render(
      <TaskNode
        {...({
          id: "workflow:complaint_intake:task:resolve_contact",
          selected: false,
          data: {
            taskId: "resolve_contact",
            workflowId: "complaint_intake",
            task: { kind: "collect", tools: ["find_contact"] },
            toolCount: 1,
            variableCount: 0,
            toolStatuses: { find_contact: "completed" },
            toolCalls: [
              {
                id: "call-1",
                workflowId: "complaint_intake",
                taskId: "resolve_contact",
                toolName: "find_contact",
                status: "completed",
                startedAt: "2026-08-21T08:40:00.000Z",
                completedAt: "2026-08-21T08:40:01.000Z",
                arguments: { phone: "4165550100" },
                response: { status: "not_found" },
              },
            ],
          },
        } as unknown as ComponentProps<typeof TaskNode>)}
      />,
    );

    fireEvent.focus(screen.getByLabelText("Tool find_contact"));
    await waitFor(() => {
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent("Parameters");
      expect(tooltip).toHaveTextContent("4165550100");
      expect(tooltip).toHaveTextContent("not_found");
    });
  });
});

describe("workflow card instruction previews", () => {
  it("shows task instructions and opens their editor directly", () => {
    const onOpenInstructions = vi.fn();
    render(
      <TaskNode
        {...({
          id: "workflow:create_appointment:task:personal_details",
          selected: false,
          data: {
            taskId: "personal_details",
            workflowId: "create_appointment",
            task: {
              kind: "collect",
              entry_prompt: "First ask for the patient's full name.",
              instructions: ["Confirm their phone number before continuing."],
            },
            toolCount: 0,
            variableCount: 0,
            onOpenInstructions,
          },
        } as unknown as ComponentProps<typeof TaskNode>)}
      />,
    );

    expect(
      screen.getByText(/First ask for the patient's full name/),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit instructions for personal_details",
      }),
    );
    expect(onOpenInstructions).toHaveBeenCalledOnce();
  });

  it("shows router instructions and opens the routing editor directly", () => {
    const onOpenInstructions = vi.fn();
    const onOpenGlobalInstructions = vi.fn();
    render(
      <RouterNode
        {...({
          id: "router",
          selected: false,
          data: {
            workflowCount: 3,
            assistant: {
              routing_instructions: [
                "Use update_appointment when the caller wants to reschedule.",
              ],
            },
            taskDefaults: {
              instructions: ["Always use feminine Urdu self-reference."],
            },
            onOpenInstructions,
            onOpenGlobalInstructions,
          },
        } as unknown as ComponentProps<typeof RouterNode>)}
      />,
    );

    expect(screen.getByText(/Use update_appointment/)).toBeVisible();
    expect(screen.getByText(/Always use feminine Urdu/)).toBeVisible();
    expect(screen.getByText("1 common")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Edit router instructions" }),
    );
    expect(onOpenInstructions).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole("button", { name: "Edit common instructions" }),
    );
    expect(onOpenGlobalInstructions).toHaveBeenCalledOnce();
  });
});

describe("supervisor live execution markers", () => {
  it("shows a prominent live task marker", () => {
    render(
      <TaskNode
        {...({
          id: "workflow:booking:task:details",
          selected: false,
          data: {
            taskId: "details",
            workflowId: "booking",
            task: { kind: "collect" },
            toolCount: 0,
            variableCount: 0,
            executionStatus: "active",
          },
        } as unknown as ComponentProps<typeof TaskNode>)}
      />,
    );

    expect(screen.getByText("LIVE TASK")).toBeVisible();
    expect(screen.getByText("LIVE TASK").closest("[data-active]")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("shows a prominent live workflow marker", () => {
    render(
      <WorkflowNode
        {...({
          id: "workflow:booking",
          selected: false,
          data: {
            workflowId: "booking",
            workflow: { task_group: {}, task_order: [] },
            stats: {
              taskCount: 0,
              toolCount: 0,
              variableCount: 0,
              interruptibleBy: [],
              resumeAfterInterrupt: false,
              invalidInterrupts: [],
            },
            executionStatus: "active",
          },
        } as unknown as ComponentProps<typeof WorkflowNode>)}
      />,
    );

    expect(screen.getByText("LIVE WORKFLOW")).toBeVisible();
    expect(
      screen.getByText("LIVE WORKFLOW").closest("[data-active]"),
    ).toHaveAttribute("data-active", "true");
  });
});
