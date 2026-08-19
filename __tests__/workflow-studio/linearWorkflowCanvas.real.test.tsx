import React, { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LinearWorkflowCanvas } from "@/components/workflow-editor/LinearWorkflowCanvas";
import { createLinearWorkflowDefinition } from "@/lib/workflow-studio/starterDefinition";

class TestResizeObserver {
  constructor(
    private readonly callback: ResizeObserverCallback,
  ) {}

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: target.getBoundingClientRect(),
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this as unknown as ResizeObserver,
    );
  }

  unobserve() {}
  disconnect() {}
}

class TestDOMMatrixReadOnly {
  readonly m22: number;

  constructor(transform?: string) {
    const matrix = transform?.match(/^matrix\(([^)]+)\)$/)?.[1]
      .split(",")
      .map(Number);
    this.m22 = matrix?.[3] ?? 1;
  }
}

function RealCanvasHarness() {
  const [definition, setDefinition] = useState(() =>
    createLinearWorkflowDefinition(),
  );
  return (
    <div style={{ width: 1200, height: 700 }}>
      <ReactFlowProvider>
        <LinearWorkflowCanvas
          jsonObject={definition}
          tools={[]}
          onUpdate={(updater) => setDefinition(updater)}
          onReplaceJson={setDefinition}
        />
      </ReactFlowProvider>
    </div>
  );
}

describe("linear workflow canvas with the real React Flow renderer", () => {
  beforeEach(() => {
    vi.stubGlobal("React", React);
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    vi.stubGlobal("DOMMatrixReadOnly", TestDOMMatrixReadOnly);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 1200,
      bottom: 700,
      width: 1200,
      height: 700,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("selects different cards without throwing a client-side React error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(<RealCanvasHarness />);

    await waitFor(() =>
      expect(container.querySelectorAll(".react-flow__node").length).toBeGreaterThan(2),
    );
    const welcome = screen.getByText("Welcome and engage").closest(".react-flow__node");
    const discover = screen.getByText("Discover need").closest(".react-flow__node");
    expect(welcome).not.toBeNull();
    expect(discover).not.toBeNull();

    fireEvent.click(welcome!);
    fireEvent.click(discover!);

    await waitFor(() => expect(discover).toHaveClass("selected"));
    expect(consoleError).not.toHaveBeenCalled();
  });
});
