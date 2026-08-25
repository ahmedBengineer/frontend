import type {
  AgentJsonObject,
  LinearCondition,
  SupervisorTaskEdge,
  Task,
} from "../types";
import { addTask } from "./editorMutations";

export function supervisorTaskNodeId(workflowId: string, taskId: string) {
  return `workflow:${workflowId}:task:${taskId}`;
}

export function parseSupervisorTaskNodeId(nodeId: string) {
  const match = /^workflow:([^:]+):task:(.+)$/.exec(nodeId);
  return match ? { workflowId: match[1], taskId: match[2] } : null;
}

function uniqueEdgeId(edges: SupervisorTaskEdge[], source: string, target: string) {
  const base = `${source}_to_${target}`;
  let id = base;
  let suffix = 2;
  const ids = new Set(edges.map((edge) => edge.id));
  while (ids.has(id)) id = `${base}_${suffix++}`;
  return id;
}

export function ensureSupervisorGraph(
  json: AgentJsonObject,
  workflowId: string,
): AgentJsonObject {
  const next = structuredClone(json);
  const workflow = next.workflows?.[workflowId];
  if (!workflow) return json;
  next.schema_version = 2;
  next.architecture = "supervisor";
  if (!workflow.entry_task_id) workflow.entry_task_id = workflow.task_order[0];
  if (!workflow.task_edges) {
    workflow.task_edges = workflow.task_order.slice(1).map((target, index) => ({
      id: uniqueEdgeId([], workflow.task_order[index], target),
      source: workflow.task_order[index],
      target,
    }));
  }
  return next;
}

export function connectSupervisorTasks(
  json: AgentJsonObject,
  workflowId: string,
  source: string,
  target: string,
  statePath?: string,
): AgentJsonObject {
  if (source === target) throw new Error("A task cannot connect to itself");
  const next = structuredClone(ensureSupervisorGraph(json, workflowId));
  const workflow = next.workflows?.[workflowId];
  if (!workflow?.task_group[source] || !workflow.task_group[target])
    throw new Error("Transition endpoints must be tasks in this workflow");
  const edges = workflow.task_edges ?? [];
  if (edges.some((edge) => edge.source === source && edge.target === target))
    throw new Error("That transition already exists");
  const outgoing = edges.filter((edge) => edge.source === source);
  let condition: LinearCondition | undefined;
  if (outgoing.length > 0) {
    if (outgoing.length === 1) {
      const existing = edges.find((edge) => edge.id === outgoing[0].id)!;
      existing.default = true;
      delete existing.condition;
    }
    if (!statePath) throw new Error("Choose a state field for the branch condition");
    condition = { path: statePath, operator: "exists" };
  }
  edges.push({
    id: uniqueEdgeId(edges, source, target),
    source,
    target,
    ...(condition ? { condition } : {}),
  });
  workflow.task_edges = edges;
  return next;
}

export function addSupervisorTask(
  json: AgentJsonObject,
  workflowId: string,
  taskId: string,
  task: Task,
  position: { x: number; y: number },
) {
  const positioned = { ...task, ui: { ...task.ui, position } };
  return ensureSupervisorGraph(addTask(json, workflowId, taskId, positioned), workflowId);
}

export function setSupervisorTaskPosition(
  json: AgentJsonObject,
  workflowId: string,
  taskId: string,
  position: { x: number; y: number },
) {
  const next = structuredClone(json);
  const task = next.workflows?.[workflowId]?.task_group[taskId];
  if (!task) return json;
  task.ui = { ...task.ui, position };
  return next;
}

export function removeSupervisorEdge(
  json: AgentJsonObject,
  workflowId: string,
  edgeId: string,
) {
  const next = structuredClone(json);
  const workflow = next.workflows?.[workflowId];
  if (!workflow?.task_edges) return json;
  workflow.task_edges = workflow.task_edges.filter((edge) => edge.id !== edgeId);
  return next;
}
