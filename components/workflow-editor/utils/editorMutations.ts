import type { AgentJsonObject, Task, Workflow } from "../types";

export const ID_PATTERN = /^[a-z][a-z0-9_]*$/;
export const STATE_PATH_PATTERN = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/;

export function createTask(
  kind: "collect" | "action" | "answer",
  options: {
    description?: string;
    stateField?: string;
    toolName?: string;
  },
): Task {
  const base: Task = {
    kind,
    description: options.description ?? "",
    instructions: [],
  };
  if (kind === "collect") {
    if (!options.stateField) throw new Error("Choose a state field");
    return {
      ...base,
      collect: { [options.stateField]: { state: options.stateField } },
    };
  }
  if (!options.toolName) throw new Error(`Choose a tool for the ${kind} task`);
  return kind === "action"
    ? { ...base, action_tool: options.toolName, tools: [options.toolName] }
    : { ...base, answer_tool: options.toolName, tools: [options.toolName] };
}

export function addTask(
  json: AgentJsonObject,
  workflowId: string,
  taskId: string,
  task: Task,
): AgentJsonObject {
  if (!ID_PATTERN.test(taskId))
    throw new Error(
      "Task ID must use lowercase letters, numbers, and underscores",
    );
  const workflow = json.workflows?.[workflowId];
  if (!workflow) throw new Error("Workflow not found");
  if (workflow.task_group[taskId]) throw new Error("Task ID already exists");
  const next = structuredClone(json);
  const target = next.workflows![workflowId];
  target.task_group[taskId] = task;
  target.task_order = [
    ...(target.task_order ?? Object.keys(workflow.task_group)),
    taskId,
  ];
  return next;
}

export function addWorkflow(
  json: AgentJsonObject,
  workflowId: string,
  workflow: Workflow,
): AgentJsonObject {
  if (!ID_PATTERN.test(workflowId))
    throw new Error(
      "Workflow ID must use lowercase letters, numbers, and underscores",
    );
  if (json.workflows?.[workflowId])
    throw new Error("Workflow ID already exists");
  const next = structuredClone(json);
  next.workflows = { ...(next.workflows ?? {}), [workflowId]: workflow };
  return next;
}

export function reorderTasks(
  json: AgentJsonObject,
  workflowId: string,
  from: number,
  to: number,
): AgentJsonObject {
  const next = structuredClone(json);
  const workflow = next.workflows?.[workflowId];
  if (!workflow) return json;
  const order = [...workflow.task_order];
  const [moved] = order.splice(from, 1);
  if (!moved) return json;
  order.splice(Math.max(0, Math.min(to, order.length)), 0, moved);
  workflow.task_order = order;
  return next;
}

export function removeTask(
  json: AgentJsonObject,
  workflowId: string,
  taskId: string,
): AgentJsonObject {
  const workflow = json.workflows?.[workflowId];
  if (!workflow || !workflow.task_group[taskId]) return json;
  if (Object.keys(workflow.task_group).length <= 1)
    throw new Error("A workflow must keep at least one task");
  const next = structuredClone(json);
  delete next.workflows![workflowId].task_group[taskId];
  next.workflows![workflowId].task_order = next.workflows![
    workflowId
  ].task_order.filter((id) => id !== taskId);
  return next;
}

export function removeWorkflow(
  json: AgentJsonObject,
  workflowId: string,
): AgentJsonObject {
  if (!json.workflows?.[workflowId]) return json;
  if (Object.keys(json.workflows).length <= 1)
    throw new Error("An agent must keep at least one workflow");
  const next = structuredClone(json);
  delete next.workflows![workflowId];
  return next;
}
