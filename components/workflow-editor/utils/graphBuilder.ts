import { MarkerType, type Node, type Edge } from "@xyflow/react";
import type { AgentJsonObject } from "../types";
import {
  getWorkflowStats,
  getOrderedTasks,
  getTaskToolReferences,
  getTaskCollectedStatePaths,
} from "./workflowSelectors";

// Node widths must match what the components actually render
const NODE_WIDTH = 280; // RouterNode width
const WORKFLOW_NODE_W = 260; // WorkflowNode width
const ROUTER_Y = 40;
const WORKFLOW_Y = 360; // router includes routing and common instruction previews
const WORKFLOW_X_GAP = 320; // 260px node + 60px breathing room
// Leave room for the task instruction preview and runtime variable/tool chips.
const TASK_Y_GAP = 280;
const TASK_START_Y = 60;
const TASK_CENTER_X = 60; // left margin; cards are 260px wide

// ─── Main architecture graph ─────────────────────────────────────────────────

export function buildMainAgentGraph(jsonObject: AgentJsonObject): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const workflows = Object.entries(jsonObject.workflows || {});
  const assistant = jsonObject.assistant;
  const taskDefaults = jsonObject.task_defaults;

  // Center router over all workflow nodes
  const totalWidth = Math.max(1, workflows.length) * WORKFLOW_X_GAP;
  const routerX = totalWidth / 2 - NODE_WIDTH / 2;

  nodes.push({
    id: "router",
    type: "routerNode",
    position: { x: routerX, y: ROUTER_Y },
    data: { assistant, taskDefaults, workflowCount: workflows.length },
  });

  workflows.forEach(([wfKey, workflow], index) => {
    const stats = getWorkflowStats(workflow, jsonObject);
    const x =
      index * WORKFLOW_X_GAP + (WORKFLOW_X_GAP / 2 - WORKFLOW_NODE_W / 2);
    const nodeId = `workflow:${wfKey}`;

    nodes.push({
      id: nodeId,
      type: "workflowNode",
      position: { x, y: WORKFLOW_Y },
      data: { workflowId: wfKey, workflow, stats },
    });

    // Router → Workflow: clean edge, no text label (info lives on the node)
    edges.push({
      id: `edge:router:${wfKey}`,
      source: "router",
      target: nodeId,
      type: "transitionEdge",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: "#94a3b8",
      },
      data: { badgeType: "START" },
    });
  });

  for (const [workflowId, workflow] of workflows) {
    for (const interrupterId of workflow.interruptible_by ?? []) {
      if (!jsonObject.workflows?.[interrupterId]) continue;
      edges.push({
        id: `interrupt:${interrupterId}:${workflowId}`,
        source: `workflow:${interrupterId}`,
        target: `workflow:${workflowId}`,
        type: "interruptEdge",
        data: { label: "interrupts" },
      });
    }
  }

  return { nodes, edges };
}

// ─── Workflow detail graph ────────────────────────────────────────────────────

export function buildWorkflowGraph(
  jsonObject: AgentJsonObject,
  workflowId: string,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const workflow = jsonObject.workflows?.[workflowId];
  if (!workflow) return { nodes, edges };

  const { ordered, unsequenced } = getOrderedTasks(workflow);

  // Sequenced tasks — vertical chain, all centered at TASK_CENTER_X
  ordered.forEach(({ key, task }, index) => {
    const nodeId = `workflow:${workflowId}:task:${key}`;
    const toolCount = getTaskToolReferences(task).length;
    const varCount = getTaskCollectedStatePaths(task).length;

    nodes.push({
      id: nodeId,
      type: "taskNode",
      position: { x: TASK_CENTER_X, y: index * TASK_Y_GAP + TASK_START_Y },
      data: {
        taskId: key,
        workflowId,
        task,
        toolCount,
        variableCount: varCount,
      },
    });

    if (index > 0) {
      const prevId = `workflow:${workflowId}:task:${ordered[index - 1].key}`;
      edges.push({
        id: `edge:${workflowId}:${ordered[index - 1].key}:${key}`,
        source: prevId,
        target: nodeId,
        type: "transitionEdge",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: "#94a3b8",
        },
        data: { badgeType: "PROMPT" },
      });
    }
  });

  // Unsequenced tasks — offset to the right with warning flag
  const unsequencedX = TASK_CENTER_X + 300 + 60;
  unsequenced.forEach(({ key, task }, index) => {
    const nodeId = `workflow:${workflowId}:task:${key}`;
    const toolCount = getTaskToolReferences(task).length;
    const varCount = getTaskCollectedStatePaths(task).length;

    nodes.push({
      id: nodeId,
      type: "taskNode",
      position: { x: unsequencedX, y: index * TASK_Y_GAP + TASK_START_Y },
      data: {
        taskId: key,
        workflowId,
        task,
        toolCount,
        variableCount: varCount,
        unsequenced: true,
      },
    });
  });

  return { nodes, edges };
}
