import type { Task, Workflow, AgentJsonObject } from "../types";

// Collect all unique tool names referenced in a task without mutating it
export function getTaskToolReferences(task: Task): string[] {
  const tools = new Set<string>();
  if (task.tools) task.tools.forEach((t) => tools.add(t));
  if (task.action_tool) tools.add(task.action_tool);
  if (task.answer_tool) tools.add(task.answer_tool);
  if (task.completion_validators) {
    task.completion_validators.forEach((v) => tools.add(v.tool));
  }
  if (task.required_tool_calls_before_complete) {
    task.required_tool_calls_before_complete.forEach((t) => tools.add(t));
  }
  return Array.from(tools);
}

export function getWorkflowToolReferences(workflow: Workflow): string[] {
  const tools = new Set<string>();
  Object.values(workflow.task_group || {}).forEach((task) => {
    getTaskToolReferences(task).forEach((t) => tools.add(t));
  });
  return Array.from(tools);
}

// Returns all state paths that a task writes to (from collect fields)
export function getTaskCollectedStatePaths(task: Task): string[] {
  if (!task.collect) return [];
  return Object.values(task.collect).map((f) => f.state);
}

// Returns all state paths referenced in any form by a task
export function getTaskStateReferences(task: Task): string[] {
  const paths = new Set<string>();
  if (task.collect) {
    Object.values(task.collect).forEach((f) => paths.add(f.state));
  }
  if (task.required_state) task.required_state.forEach((p) => paths.add(p));
  if (task.response_state) paths.add(task.response_state);
  if (task.question_state) paths.add(task.question_state);
  if (task.answer_state) paths.add(task.answer_state);
  return Array.from(paths);
}

// Returns all unique state variable paths collected across a workflow
export function getWorkflowVariables(workflow: Workflow): string[] {
  const paths = new Set<string>();
  Object.values(workflow.task_group || {}).forEach((task) => {
    getTaskCollectedStatePaths(task).forEach((p) => paths.add(p));
  });
  return Array.from(paths);
}

// Returns task transition/phrase metadata without mutation
export interface TaskTransitionMetadata {
  entry_prompt?: string;
  on_enter_instructions?: string;
  confirmation_question?: string;
  success_message?: string;
  cancel_message?: string;
}

export function getTaskTransitionMetadata(task: Task): TaskTransitionMetadata {
  return {
    entry_prompt: task.entry_prompt,
    on_enter_instructions: task.on_enter_instructions,
    confirmation_question: task.confirmation_question,
    success_message: task.success_message,
    cancel_message: task.cancel_message,
  };
}

// Returns tasks in the order defined by task_order, with unsequenced tasks separate
export interface OrderedTasks {
  ordered: Array<{ key: string; task: Task }>;
  unsequenced: Array<{ key: string; task: Task }>;
  missingFromGroup: string[];
}

export function getOrderedTasks(workflow: Workflow): OrderedTasks {
  const group = workflow.task_group || {};
  const order = workflow.task_order || [];

  const ordered: Array<{ key: string; task: Task }> = [];
  const missingFromGroup: string[] = [];

  for (const key of order) {
    if (key in group) {
      ordered.push({ key, task: group[key] });
    } else {
      missingFromGroup.push(key);
    }
  }

  const orderedKeys = new Set(order);
  const unsequenced = Object.entries(group)
    .filter(([key]) => !orderedKeys.has(key))
    .map(([key, task]) => ({ key, task }));

  return { ordered, unsequenced, missingFromGroup };
}

export function getWorkflowStats(
  workflow: Workflow,
  jsonObject: AgentJsonObject,
) {
  const tools = getWorkflowToolReferences(workflow);
  const variables = getWorkflowVariables(workflow);
  const taskCount = Object.keys(workflow.task_group || {}).length;
  const interruptible = workflow.interruptible_by || [];
  const resume = workflow.resume_after_interrupt ?? false;

  // Validate interruptible_by refs
  const workflows = Object.keys(jsonObject.workflows || {});
  const invalidInterrupts = interruptible.filter(
    (id) => !workflows.includes(id),
  );

  return {
    taskCount,
    toolCount: tools.length,
    variableCount: variables.length,
    interruptibleBy: interruptible,
    resumeAfterInterrupt: resume,
    invalidInterrupts,
  };
}

export function getProgressPhrase(
  toolName: string,
  jsonObject: AgentJsonObject,
): string | undefined {
  return jsonObject.tool_presentation?.[toolName]?.progress_phrase;
}
