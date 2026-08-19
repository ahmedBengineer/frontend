import React, { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LinearWorkflowCanvas } from "@/components/workflow-editor/LinearWorkflowCanvas";
import type { AgentJsonObject } from "@/components/workflow-editor/types";
import { createLinearWorkflowDefinition } from "@/lib/workflow-studio/starterDefinition";
import { createExecutionState } from "@/lib/workflow-test/telemetry";

const flowMocks = vi.hoisted(() => ({
  getNode: vi.fn(),
  getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 0.4 })),
  screenToFlowPosition: vi.fn(({ x, y }: { x: number; y: number }) => ({ x, y })),
  setCenter: vi.fn(),
  fitView: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  latestProps: {} as Record<string, unknown>,
}));

vi.mock("@xyflow/react", async () => {
  const React = await import("react");

  return {
    Background: () => React.createElement("div", { "data-testid": "flow-background" }),
    BackgroundVariant: { Dots: "dots" },
    Controls: ({ className }: { className?: string }) =>
      React.createElement("div", { className, "data-testid": "flow-controls" }),
    Handle: () => React.createElement("span", { "data-testid": "node-handle" }),
    MiniMap: ({ className }: { className?: string }) =>
      React.createElement("div", { className, "data-testid": "flow-minimap" }),
    Position: { Left: "left", Right: "right" },
    SelectionMode: { Partial: "partial" },
    ReactFlow: (props: {
      children: React.ReactNode;
      nodes: Array<{ id: string; type: string; data: Record<string, unknown> }>;
      edges: Array<{ id: string; selected?: boolean; style?: Record<string, unknown> }>;
      nodeTypes: Record<string, React.ComponentType<Record<string, unknown>>>;
      onDragOver?: React.DragEventHandler<HTMLDivElement>;
      onDrop?: React.DragEventHandler<HTMLDivElement>;
      onEdgeClick?: (event: React.MouseEvent, edge: { id: string }) => void;
      onSelectionChange?: (selection: { nodes: unknown[]; edges: unknown[] }) => void;
      onEdgesChange?: (changes: Array<{ id: string; type: string; selected?: boolean }>) => void;
      onNodesDelete?: (nodes: Array<{ id: string }>) => void;
      onEdgesDelete?: (edges: Array<{ id: string }>) => void;
    }) => {
      flowMocks.latestProps = props as unknown as Record<string, unknown>;
      return React.createElement(
        "div",
        {
          "data-testid": "react-flow",
          onDragOver: props.onDragOver,
          onDrop: props.onDrop,
        },
        props.nodes.map((node) => {
          const NodeComponent = props.nodeTypes[node.type];
          return React.createElement(NodeComponent, {
            key: node.id,
            id: node.id,
            data: node.data,
            selected: Boolean((node as { selected?: boolean }).selected),
          });
        }),
        props.edges.map((edge) =>
          React.createElement("button", {
            key: edge.id,
            type: "button",
            "data-testid": `edge-${edge.id}`,
            "data-selected": edge.selected ? "true" : "false",
            style: { color: String(edge.style?.stroke ?? "") },
            onClick: (event: React.MouseEvent) => {
              props.onEdgesChange?.([
                { id: edge.id, type: "select", selected: true },
              ]);
              props.onEdgeClick?.(event, edge);
              props.onSelectionChange?.({ nodes: [], edges: [edge] });
            },
          }),
        ),
        props.children,
      );
    },
    addEdge: (edge: unknown, edges: unknown[]) => [...edges, edge],
    useEdgesState: (initial: unknown[]) => {
      const [edges, setEdges] = React.useState<
        Array<{ id: string; selected?: boolean }>
      >(initial as Array<{ id: string; selected?: boolean }>);
      const onEdgesChange = React.useCallback(
        (changes: Array<{ id: string; type: string; selected?: boolean }>) => {
          setEdges((current) =>
            current.map((edge) => {
              const selection = changes.find(
                (change) => change.type === "select" && change.id === edge.id,
              );
              return selection
                ? { ...edge, selected: Boolean(selection.selected) }
                : edge;
            }),
          );
        },
        [],
      );
      return [edges, setEdges, onEdgesChange];
    },
    useNodesState: (initial: unknown[]) => {
      const [nodes, setNodes] = React.useState(initial);
      return [nodes, setNodes, vi.fn()];
    },
    useReactFlow: () => flowMocks,
  };
});

function CanvasHarness({
  execution,
  autoFollow = true,
  readOnly = false,
  colorMode = "light",
  onDefinition,
}: {
  execution?: ReturnType<typeof createExecutionState>;
  autoFollow?: boolean;
  readOnly?: boolean;
  colorMode?: "light" | "dark";
  onDefinition?: (definition: AgentJsonObject) => void;
}) {
  const [definition, setDefinition] = useState(() => createLinearWorkflowDefinition());

  return (
    <LinearWorkflowCanvas
      jsonObject={definition}
      tools={[]}
      readOnly={readOnly}
      execution={execution}
      autoFollow={autoFollow}
      colorMode={colorMode}
      onUpdate={(updater) => {
        setDefinition((previous) => {
          const next = updater(previous);
          onDefinition?.(next);
          return next;
        });
      }}
      onReplaceJson={(next) => {
        setDefinition(next);
        onDefinition?.(next);
      }}
    />
  );
}

describe("linear workflow canvas", () => {
  beforeEach(() => {
    vi.stubGlobal("React", React);
    flowMocks.getNode.mockReset();
    flowMocks.getViewport.mockReset();
    flowMocks.getViewport.mockReturnValue({ x: 0, y: 0, zoom: 0.4 });
    flowMocks.screenToFlowPosition.mockReset();
    flowMocks.screenToFlowPosition.mockImplementation(({ x, y }) => ({ x, y }));
    flowMocks.setCenter.mockReset();
    flowMocks.fitView.mockReset();
    flowMocks.zoomIn.mockReset();
    flowMocks.zoomOut.mockReset();
    flowMocks.latestProps = {};
    flowMocks.getNode.mockReturnValue({
      position: { x: 400, y: 240 },
      measured: { width: 240, height: 120 },
    });
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 50,
      left: 100,
      top: 50,
      right: 1100,
      bottom: 650,
      width: 1000,
      height: 600,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("adds unique blocks from clicks in non-overlapping viewport positions", async () => {
    let latest = createLinearWorkflowDefinition();
    render(<CanvasHarness onDefinition={(definition) => { latest = definition; }} />);

    const startButton = screen.getByRole("button", { name: "Start" });
    expect(startButton).toBeDisabled();
    expect(startButton).toHaveAttribute("title", "This flow already has a Start block");

    fireEvent.click(screen.getByRole("button", { name: "Conversation" }));
    fireEvent.click(screen.getByRole("button", { name: "Conversation" }));

    await waitFor(() => {
      expect(latest.flows?.main.nodes.conversation_1).toBeDefined();
      expect(latest.flows?.main.nodes.conversation_2).toBeDefined();
    });
    expect(latest.flows?.main.nodes.conversation_1.ui?.position).not.toEqual(
      latest.flows?.main.nodes.conversation_2.ui?.position,
    );
    expect(flowMocks.screenToFlowPosition).toHaveBeenCalledWith({ x: 600, y: 350 });
  });

  it("places dragged blocks at the converted drop coordinates", async () => {
    let latest = createLinearWorkflowDefinition();
    flowMocks.screenToFlowPosition.mockImplementation(({ x, y }) => ({ x: x - 100, y: y - 50 }));
    render(<CanvasHarness onDefinition={(definition) => { latest = definition; }} />);

    const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperties(dropEvent, {
      clientX: { value: 740 },
      clientY: { value: 410 },
      dataTransfer: { value: { getData: () => "function" } },
    });
    fireEvent(screen.getByTestId("react-flow"), dropEvent);

    await waitFor(() => expect(latest.flows?.main.nodes.function_1).toBeDefined());
    expect(latest.flows?.main.nodes.function_1.ui?.position).toEqual({ x: 640, y: 360 });
  });

  it("opens and marks the global instructions and raw JSON actions", () => {
    render(<CanvasHarness />);

    const globalButton = screen.getByRole("button", { name: "Global instructions" });
    fireEvent.click(globalButton);
    expect(globalButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Global Instructions")).toBeInTheDocument();

    const jsonButton = screen.getByRole("button", { name: "Raw JSON" });
    fireEvent.click(jsonButton);
    expect(jsonButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Workflow JSON")).toBeInTheDocument();
  });

  it("switches flows, highlights, and centers the live node when auto-follow is enabled", async () => {
    const execution = {
      ...createExecutionState(),
      currentWorkflowId: "global",
      currentTaskId: "callback_disclosure",
    };
    render(<CanvasHarness readOnly execution={execution} autoFollow />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Global Flow" })).toHaveClass("bg-cyan-500");
      expect(screen.getByText("LIVE")).toBeInTheDocument();
      expect(flowMocks.setCenter).toHaveBeenCalledWith(520, 300, {
        duration: 500,
        zoom: 0.85,
      });
    });
  });

  it("keeps the live highlight without moving the viewport when auto-follow is disabled", async () => {
    const execution = {
      ...createExecutionState(),
      currentWorkflowId: "main",
      currentTaskId: "start",
    };
    render(<CanvasHarness readOnly execution={execution} autoFollow={false} />);

    await waitFor(() => expect(screen.getByText("LIVE")).toBeInTheDocument());
    expect(flowMocks.setCenter).not.toHaveBeenCalled();
  });

  it("exposes light and dark variants for the canvas chrome and cards", () => {
    const { container } = render(<CanvasHarness colorMode="dark" />);

    expect(container.firstElementChild).toHaveClass("bg-slate-50", "dark:bg-slate-950");
    expect(screen.getByTestId("flow-controls").className).toContain("dark:!bg-slate-900");
    expect(screen.getByTestId("flow-minimap").className).toContain("dark:!bg-slate-900");
    expect(screen.getByText("Flow entry point").closest("[data-active]")?.className).toContain("dark:bg-emerald-950/60");
    expect(flowMocks.latestProps.colorMode).toBe("dark");
  });

  it("uses LTspice-style box and additive selection with grid snapping", () => {
    render(<CanvasHarness />);

    expect(flowMocks.latestProps.selectionOnDrag).toBe(true);
    expect(flowMocks.latestProps.selectionMode).toBe("partial");
    expect(flowMocks.latestProps.multiSelectionKeyCode).toEqual([
      "Meta",
      "Control",
      "Shift",
    ]);
    expect(flowMocks.latestProps.panOnDrag).toEqual([1, 2]);
    expect(flowMocks.latestProps.panActivationKeyCode).toBe("Space");
    expect(flowMocks.latestProps.snapToGrid).toBe(true);
    expect(flowMocks.latestProps.snapGrid).toEqual([10, 10]);

    fireEvent.click(screen.getByRole("button", { name: "Pan canvas" }));
    expect(screen.getByRole("button", { name: "Pan canvas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(flowMocks.latestProps.selectionOnDrag).toBe(false);
    expect(flowMocks.latestProps.elementsSelectable).toBe(false);
    expect(flowMocks.latestProps.nodesDraggable).toBe(false);
    expect(flowMocks.latestProps.panOnDrag).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Select and drag" }));
    expect(
      screen.getByRole("button", { name: "Select and drag" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(flowMocks.latestProps.selectionOnDrag).toBe(true);
    expect(flowMocks.latestProps.nodesDraggable).toBe(true);
  });

  it("highlights an edge and persists React Flow's native Delete action", async () => {
    let latest = createLinearWorkflowDefinition();
    const edgeId = latest.flows!.main.edges[0].id;
    const { container } = render(
      <CanvasHarness onDefinition={(definition) => { latest = definition; }} />,
    );

    fireEvent.click(screen.getByTestId(`edge-${edgeId}`));
    await waitFor(() => {
      expect(screen.getByTestId(`edge-${edgeId}`)).toHaveAttribute(
        "data-selected",
        "true",
      );
      expect(container.querySelector("style")?.textContent).toContain(
        ".react-flow__edge.selected",
      );
    });

    expect(flowMocks.latestProps.deleteKeyCode).toEqual(["Backspace", "Delete"]);
    act(() =>
      (flowMocks.latestProps.onEdgesDelete as (
        edges: Array<{ id: string }>,
      ) => void)([{ id: edgeId }]),
    );
    await waitFor(() =>
      expect(
        latest.flows!.main.edges.some((edge) => edge.id === edgeId),
      ).toBe(false),
    );
  });

  it("changes selection without scheduling state from inside another state updater", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<CanvasHarness />);
    const onNodeClick = flowMocks.latestProps.onNodeClick as (
      event: unknown,
      node: { id: string },
    ) => void;
    act(() => onNodeClick({}, { id: "welcome" }));
    const onSelectionChange = flowMocks.latestProps.onSelectionChange as (
      selection: { nodes: Array<{ id: string }>; edges: unknown[] },
    ) => void;
    act(() =>
      onSelectionChange({ nodes: [{ id: "discover_need" }], edges: [] }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Delete block" })).not.toBeInTheDocument(),
    );
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("keeps mouse multi-selection stable when React Flow changes node order", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<CanvasHarness />);
    const selectionCallback = flowMocks.latestProps.onSelectionChange as (
      selection: { nodes: Array<{ id: string }>; edges: unknown[] },
    ) => void;

    act(() =>
      selectionCallback({
        nodes: [{ id: "welcome" }, { id: "engagement_split" }],
        edges: [],
      }),
    );
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(flowMocks.latestProps.onSelectionChange).toBe(selectionCallback);

    for (let index = 0; index < 20; index += 1) {
      act(() =>
        selectionCallback({
          nodes:
            index % 2
              ? [{ id: "welcome" }, { id: "engagement_split" }]
              : [{ id: "engagement_split" }, { id: "welcome" }],
          edges: [],
        }),
      );
    }

    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(flowMocks.latestProps.onSelectionChange).toBe(selectionCallback);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("deletes a multi-node selection and all of its connected edges", async () => {
    let latest = createLinearWorkflowDefinition();
    render(
      <CanvasHarness onDefinition={(definition) => { latest = definition; }} />,
    );
    const onSelectionChange = flowMocks.latestProps.onSelectionChange as (
      selection: { nodes: Array<{ id: string }>; edges: unknown[] },
    ) => void;

    act(() =>
      onSelectionChange({
        nodes: [{ id: "welcome" }, { id: "engagement_split" }],
        edges: [],
      }),
    );
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    act(() =>
      (flowMocks.latestProps.onNodesDelete as (
        nodes: Array<{ id: string }>,
      ) => void)([{ id: "welcome" }, { id: "engagement_split" }]),
    );
    await waitFor(() => {
      expect(latest.flows!.main.nodes.welcome).toBeUndefined();
      expect(latest.flows!.main.nodes.engagement_split).toBeUndefined();
    });
  });

  it("supports duplicate, undo, redo, and working fit-view controls", async () => {
    let latest = createLinearWorkflowDefinition();
    const { container } = render(
      <CanvasHarness onDefinition={(definition) => { latest = definition; }} />,
    );
    const onSelectionChange = flowMocks.latestProps.onSelectionChange as (
      selection: { nodes: Array<{ id: string }>; edges: unknown[] },
    ) => void;
    act(() =>
      onSelectionChange({
        nodes: [{ id: "welcome" }, { id: "engagement_split" }],
        edges: [],
      }),
    );

    fireEvent.keyDown(container.firstElementChild!, {
      key: "d",
      ctrlKey: true,
    });
    await waitFor(() => {
      expect(latest.flows!.main.nodes.welcome_copy).toBeDefined();
      expect(latest.flows!.main.nodes.engagement_split_copy).toBeDefined();
    });

    fireEvent.keyDown(container.firstElementChild!, {
      key: "z",
      ctrlKey: true,
    });
    await waitFor(() =>
      expect(latest.flows!.main.nodes.welcome_copy).toBeUndefined(),
    );

    fireEvent.keyDown(container.firstElementChild!, {
      key: "y",
      ctrlKey: true,
    });
    await waitFor(() =>
      expect(latest.flows!.main.nodes.welcome_copy).toBeDefined(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Fit workflow" }));
    expect(flowMocks.fitView).toHaveBeenCalledWith({
      padding: 0.18,
      duration: 250,
    });
  });
});
