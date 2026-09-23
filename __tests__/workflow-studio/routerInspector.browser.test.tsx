import React from "react";
import { userEvent } from "@vitest/browser/context";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RouterInspector } from "@/components/workflow-editor/inspectors/RouterInspector";

describe("router tool selection in Chromium", () => {
  beforeEach(() => vi.stubGlobal("React", React));

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens the tool tab and selects an assigned default tool", async () => {
    const onDefaultToolsChange = vi.fn();
    render(
      <div style={{ width: 460, height: 700 }}>
        <RouterInspector
          assistant={{ routing_instructions: [] }}
          onUpdate={vi.fn()}
          includeDefaultTools
          defaultToolNames={["end_call"]}
          onDefaultToolsChange={onDefaultToolsChange}
        />
      </div>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Default Tools" }),
    );
    expect(
      screen.getByRole("switch", { name: "Enable router default tools" }),
    ).toBeChecked();
    expect(screen.getByRole("button", { name: /end_call/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(
      screen.getByRole("button", { name: /transfer_call/i }),
    );
    expect(onDefaultToolsChange).toHaveBeenCalledWith(true, [
      "end_call",
      "transfer_call",
    ]);
  });
});
