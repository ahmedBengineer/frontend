import React, { useState } from "react";
import { userEvent } from "@vitest/browser/context";
import { cleanup, render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@xyflow/react/dist/style.css";

import { LinearWorkflowCanvas } from "@/components/workflow-editor/LinearWorkflowCanvas";
import { createLinearWorkflowDefinition } from "@/lib/workflow-studio/starterDefinition";

function BrowserCanvasHarness() {
  const [definition, setDefinition] = useState(() =>
    createLinearWorkflowDefinition(),
  );
  return (
    <div style={{ width: 1400, height: 900 }}>
      <ReactFlowProvider>
        <LinearWorkflowCanvas
          jsonObject={definition}
          tools={[]}
          onUpdate={setDefinition}
          onReplaceJson={setDefinition}
        />
      </ReactFlowProvider>
    </div>
  );
}

describe("linear workflow canvas in Chromium", () => {
  beforeEach(() => {
    vi.stubGlobal("React", React);
    const style = document.createElement("style");
    style.dataset.testCanvasStyles = "true";
    style.textContent = `
      .linear-workflow-canvas { height: 900px; position: relative; overflow: hidden; }
      .linear-workflow-canvas .react-flow { height: 900px; width: 1400px; }
      .linear-workflow-canvas .react-flow__node { min-width: 220px; min-height: 100px; }
    `;
    document.head.appendChild(style);
  });

  afterEach(() => {
    cleanup();
    document.querySelector("style[data-test-canvas-styles]")?.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("marquee-selects multiple nodes without a page or console error", async () => {
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => errors.push(event.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    const consoleError = vi.spyOn(console, "error");

    try {
      const { container } = render(<BrowserCanvasHarness />);
      await vi.waitFor(() =>
        expect(container.querySelectorAll(".react-flow__node").length).toBeGreaterThan(5),
      );
      const pane = container.querySelector<HTMLElement>(".react-flow__pane");
      expect(pane).not.toBeNull();

      await userEvent.dragAndDrop(pane!, pane!, {
        sourcePosition: { x: 5, y: 5 },
        targetPosition: { x: 1350, y: 850 },
        steps: 12,
      });

      expect(errors).toEqual([]);
      await vi.waitFor(() =>
        expect(container.querySelectorAll(".react-flow__node.selected").length).toBeGreaterThan(1),
      );
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    }
  });
});
