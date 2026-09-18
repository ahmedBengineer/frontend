import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import {
  buildToolCallExport,
  ToolCallHistory,
} from "@/components/workflow-test/ToolCallHistory";
import { createExecutionState } from "@/lib/workflow-test/telemetry";

function stateWithCall() {
  return {
    ...createExecutionState(),
    sessionId: "session-1",
    toolCalls: [
      {
        id: "call-1",
        workflowId: "general_information",
        taskId: "answer_verified_question",
        toolName: "search_information",
        status: "completed" as const,
        startedAt: "2026-08-21T08:40:00.000Z",
        completedAt: "2026-08-21T08:40:00.250Z",
        arguments: { question: "water services" },
        response: { answer: "Water service information" },
      },
    ],
  };
}

describe("tool call history", () => {
  it("shows structured details through an expandable row", () => {
    render(<ToolCallHistory state={stateWithCall()} />);
    const summary = screen.getByText("search_information").closest("summary");
    expect(summary).not.toBeNull();
    fireEvent.click(summary!);
    expect(screen.getByText("Parameters")).toBeVisible();
    expect(screen.getByText(/water services/)).toBeVisible();
    expect(screen.getByText(/Water service information/)).toBeVisible();
  });

  it("builds a workflow/task-aware JSON export", () => {
    const payload = buildToolCallExport(stateWithCall());
    expect(payload).toMatchObject({
      schema_version: 1,
      session_id: "session-1",
      tool_calls: [
        {
          call_id: "call-1",
          workflow: "general_information",
          task: "answer_verified_question",
          parameters: { question: "water services" },
          response: { answer: "Water service information" },
          duration_ms: 250,
        },
      ],
    });
  });
});
