import type {
  AgentJsonObject,
  LinearCondition,
  LinearFlow,
  Task,
  ValidationWarning,
} from "../types";
import { getOrderedTasks } from "./workflowSelectors";

export interface WorkflowValidationResult {
  errors: ValidationWarning[];
  warnings: ValidationWarning[];
  isValid: boolean;
}

function issue(
  severity: "error" | "warning",
  message: string,
  context?: string,
): ValidationWarning {
  return { severity, message, context };
}

function taskTools(task: Task): string[] {
  return [
    ...(task.tools ?? []),
    ...(task.action_tool ? [task.action_tool] : []),
    ...(task.answer_tool ? [task.answer_tool] : []),
    ...(task.required_tool_calls_before_complete ?? []),
    ...(task.completion_validators ?? [])
      .map((validator) => validator.tool)
      .filter(Boolean),
  ];
}

const LINEAR_NODE_TYPES = new Set([
  "start",
  "conversation",
  "function",
  "logic_split",
  "call_transfer",
  "end_call",
]);

function conditionPaths(condition: LinearCondition): string[] {
  if ("all" in condition) return condition.all.flatMap(conditionPaths);
  if ("any" in condition) return condition.any.flatMap(conditionPaths);
  return [condition.path];
}

function validateLinearDefinition(
  jsonObject: AgentJsonObject,
  availableToolNames: Iterable<string>,
): WorkflowValidationResult {
  const errors: ValidationWarning[] = [];
  const warnings: ValidationWarning[] = [];
  const tools = new Set(availableToolNames);
  const fields = jsonObject.state?.fields ?? {};
  const flows = jsonObject.flows;
  if (!jsonObject.state || Object.keys(fields).length === 0)
    errors.push(issue("error", "state.fields must contain at least one field"));
  if (!("session.global_intent" in fields))
    errors.push(issue("error", "Linear workflows require session.global_intent"));
  if (!flows || !flows.main || !flows.global) {
    errors.push(issue("error", "Linear workflows require main and global flows"));
    return { errors, warnings, isValid: false };
  }

  for (const [flowId, flow] of Object.entries(flows) as [string, LinearFlow][]) {
    const context = `flows.${flowId}`;
    const nodeIds = new Set(Object.keys(flow.nodes ?? {}));
    if (!nodeIds.size) {
      errors.push(issue("error", "Flow needs nodes", context));
      continue;
    }
    if (!nodeIds.has(flow.entry_node_id))
      errors.push(issue("error", "Invalid entry_node_id", context));
    const starts = Object.entries(flow.nodes).filter(([, node]) => node.type === "start");
    if (starts.length !== 1 || starts[0]?.[0] !== flow.entry_node_id)
      errors.push(issue("error", "Flow needs exactly one start entry node", context));
    const outgoing = new Map<string, typeof flow.edges>();
    for (const nodeId of nodeIds) outgoing.set(nodeId, []);
    const edgeIds = new Set<string>();
    for (const edge of flow.edges ?? []) {
      if (!edge.id || edgeIds.has(edge.id))
        errors.push(issue("error", "Edge IDs must be unique and non-empty", context));
      edgeIds.add(edge.id);
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target))
        errors.push(issue("error", `Edge “${edge.id}” references an unknown node`, context));
      outgoing.get(edge.source)?.push(edge);
      for (const path of edge.condition ? conditionPaths(edge.condition) : []) {
        if (!path.trim())
          errors.push(issue("error", `Edge “${edge.id}” condition needs a state path`, context));
        else if (!(path in fields))
          errors.push(issue("error", `Edge “${edge.id}” references unknown state “${path}”`, context));
      }
    }

    for (const [nodeId, node] of Object.entries(flow.nodes)) {
      const nodeContext = `${context}.nodes.${nodeId}`;
      const edges = outgoing.get(nodeId) ?? [];
      if (!LINEAR_NODE_TYPES.has(node.type))
        errors.push(issue("error", `Unsupported node type “${node.type}”`, nodeContext));
      if (node.type === "start" && edges.length !== 1)
        errors.push(issue("error", "Start needs exactly one outgoing edge", nodeContext));
      if (node.type === "conversation") {
        if (node.mode === "message" && !String(node.message ?? "").trim())
          errors.push(issue("error", "Message conversation needs message text", nodeContext));
        if ((node.mode ?? "collect") === "collect") {
          if (!node.collect || Object.keys(node.collect).length === 0)
            errors.push(issue("error", "Collect conversation needs fields", nodeContext));
          for (const field of Object.values(node.collect ?? {})) {
            if (!(field.state in fields))
              errors.push(issue("error", `Unknown state field “${field.state}”`, nodeContext));
          }
        }
        if (edges.length !== 1)
          errors.push(issue("error", "Conversation needs exactly one outgoing edge", nodeContext));
      }
      if (node.type === "function") {
        if (!node.tool || !tools.has(node.tool))
          errors.push(issue("error", `Unknown or unavailable tool “${node.tool ?? ""}”`, nodeContext));
        for (const path of Object.keys(node.response_mappings ?? {})) {
          if (!(path in fields))
            errors.push(issue("error", `Unknown mapped state “${path}”`, nodeContext));
        }
        if (!edges.some((edge) => (edge.source_handle ?? "success") === "success"))
          errors.push(issue("error", "Function needs a success edge", nodeContext));
      }
      if (node.type === "logic_split") {
        const defaults = edges.filter((edge) => edge.default);
        const conditioned = edges.filter((edge) => edge.condition);
        if (defaults.length !== 1 || conditioned.length !== edges.length - 1)
          errors.push(issue("error", "Logic split needs conditions and exactly one default", nodeContext));
      }
      if (node.type === "call_transfer") {
        if (!String(node.destination ?? "").trim())
          errors.push(issue("error", "Call transfer needs a destination", nodeContext));
        if (edges.some((edge) => edge.source_handle !== "error"))
          errors.push(issue("error", "Call transfer only supports an error edge", nodeContext));
      }
      if (node.type === "end_call" && edges.length)
        errors.push(issue("error", "End Call must be terminal", nodeContext));
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        errors.push(issue("error", "Flow contains a cycle", context));
        return;
      }
      if (visited.has(nodeId)) return;
      visiting.add(nodeId);
      for (const edge of outgoing.get(nodeId) ?? []) visit(edge.target);
      visiting.delete(nodeId);
      visited.add(nodeId);
    };
    if (nodeIds.has(flow.entry_node_id)) visit(flow.entry_node_id);
    const unreachable = [...nodeIds].filter((nodeId) => !visited.has(nodeId));
    if (unreachable.length)
      errors.push(issue("error", `Unreachable nodes: ${unreachable.join(", ")}`, context));
  }
  if (!flows.global.intents?.length)
    errors.push(issue("error", "Global flow needs at least one intent", "flows.global"));
  return { errors, warnings, isValid: errors.length === 0 };
}

export function validateWorkflowDefinition(
  jsonObject: AgentJsonObject,
  availableToolNames: Iterable<string> = [],
): WorkflowValidationResult {
  const errors: ValidationWarning[] = [];
  const warnings: ValidationWarning[] = [];
  if (jsonObject.schema_version === 2 && jsonObject.architecture === "linear")
    return validateLinearDefinition(jsonObject, availableToolNames);
  const tools = new Set(availableToolNames);
  const workflows = jsonObject.workflows;
  const stateFields = jsonObject.state?.fields ?? {};

  if (jsonObject.schema_version !== 1)
    errors.push(issue("error", "schema_version must be 1"));
  if (!jsonObject.assistant || typeof jsonObject.assistant !== "object") {
    errors.push(issue("error", "assistant must be an object"));
  }
  if (!jsonObject.state || typeof jsonObject.state !== "object") {
    errors.push(issue("error", "state must be an object"));
  } else if (Object.keys(stateFields).length === 0) {
    errors.push(issue("error", "state.fields must contain at least one field"));
  }
  if (
    !workflows ||
    typeof workflows !== "object" ||
    Object.keys(workflows).length === 0
  ) {
    errors.push(issue("error", "workflows must contain at least one workflow"));
    return { errors, warnings, isValid: false };
  }

  const workflowIds = new Set(Object.keys(workflows));
  for (const [workflowId, workflow] of Object.entries(workflows)) {
    const context = `workflows.${workflowId}`;
    const group = workflow.task_group;
    if (
      !group ||
      typeof group !== "object" ||
      Object.keys(group).length === 0
    ) {
      errors.push(issue("error", "Workflow needs at least one task", context));
      continue;
    }
    const order = workflow.task_order;
    const taskIds = Object.keys(group);
    if (
      !Array.isArray(order) ||
      order.length !== new Set(order).size ||
      order.length !== taskIds.length ||
      order.some((taskId) => !(taskId in group))
    ) {
      errors.push(
        issue("error", "task_order must list every task exactly once", context),
      );
    }
    for (const interruptId of workflow.interruptible_by ?? []) {
      if (!workflowIds.has(interruptId)) {
        errors.push(
          issue(
            "error",
            `Unknown interruption workflow “${interruptId}”`,
            context,
          ),
        );
      }
      if (interruptId === workflowId) {
        warnings.push(
          issue("warning", "A workflow interrupts itself", context),
        );
      }
    }

    for (const [taskId, task] of Object.entries(group)) {
      const taskContext = `${context}.task_group.${taskId}`;
      if (!(["collect", "action", "answer"] as string[]).includes(task.kind)) {
        errors.push(
          issue("error", `Unsupported task kind “${task.kind}”`, taskContext),
        );
      }
      if (task.kind === "collect") {
        if (!task.collect || Object.keys(task.collect).length === 0) {
          errors.push(
            issue(
              "error",
              "Collect task needs at least one field mapping",
              taskContext,
            ),
          );
        }
        for (const [alias, field] of Object.entries(task.collect ?? {})) {
          if (!/^[a-z][a-z0-9_]*$/.test(alias)) {
            errors.push(
              issue(
                "error",
                `Collect argument “${alias}” must use lowercase letters, numbers, and underscores`,
                taskContext,
              ),
            );
          }
          if (!field.state || !(field.state in stateFields)) {
            errors.push(
              issue(
                "error",
                `Unknown state field “${field.state || "empty"}”`,
                taskContext,
              ),
            );
          }
        }
      }
      if (task.kind === "action" && !task.action_tool) {
        errors.push(
          issue("error", "Action task requires action_tool", taskContext),
        );
      }
      if (task.kind === "answer" && !task.answer_tool) {
        errors.push(
          issue("error", "Answer task requires answer_tool", taskContext),
        );
      }
      for (const statePath of task.required_state ?? []) {
        if (!(statePath in stateFields)) {
          errors.push(
            issue(
              "error",
              `Unknown required state field “${statePath}”`,
              taskContext,
            ),
          );
        }
      }
      for (const statePath of [
        task.response_state,
        task.question_state,
        task.answer_state,
      ].filter((value): value is string => Boolean(value))) {
        if (!(statePath in stateFields)) {
          errors.push(
            issue(
              "error",
              `Unknown state field “${statePath}”`,
              taskContext,
            ),
          );
        }
      }
      for (const [argument, template] of Object.entries(
        task.action_arguments ?? {},
      )) {
        if (typeof template !== "string") {
          errors.push(
            issue("error", `Action argument “${argument}” must be a string template`, taskContext),
          );
          continue;
        }
        for (const match of template.matchAll(/\{state\.([^{}]+)\}/g)) {
          if (!(match[1] in stateFields)) {
            errors.push(
              issue(
                "error",
                `Action argument “${argument}” references unknown state “${match[1]}”`,
                taskContext,
              ),
            );
          }
        }
      }
      const collectAliases = new Set(Object.keys(task.collect ?? {}));
      for (const validator of task.completion_validators ?? []) {
        if (!collectAliases.has(validator.field)) {
          errors.push(
            issue(
              "error",
              `Completion validator references unknown collected value “${validator.field}”`,
              taskContext,
            ),
          );
        }
        if (validator.type === "equals_tool_argument" && !validator.argument) {
          errors.push(issue("error", "Equals validator requires a tool argument", taskContext));
        }
        if (
          validator.type === "value_in_tool_response" &&
          !(validator.paths?.length)
        ) {
          errors.push(issue("error", "Response-value validator requires at least one response path", taskContext));
        }
      }
      for (const toolName of taskTools(task)) {
        if (!tools.has(toolName)) {
          errors.push(
            issue(
              "error",
              `Unknown or unavailable tool “${toolName}”`,
              taskContext,
            ),
          );
        }
      }
    }
  }

  for (const [source, targets] of Object.entries(
    jsonObject.state?.dependencies ?? {},
  )) {
    if (!(source in stateFields))
      errors.push(
        issue(
          "error",
          `Unknown dependency source “${source}”`,
          "state.dependencies",
        ),
      );
    for (const target of targets) {
      if (!(target in stateFields))
        errors.push(
          issue(
            "error",
            `Unknown dependency target “${target}”`,
            `state.dependencies.${source}`,
          ),
        );
    }
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

export function validateWorkflowReferences(
  jsonObject: AgentJsonObject,
): ValidationWarning[] {
  const result: ValidationWarning[] = [];
  const workflows = jsonObject.workflows ?? {};
  const workflowKeys = new Set(Object.keys(workflows));
  for (const [workflowId, workflow] of Object.entries(workflows)) {
    const { unsequenced, missingFromGroup } = getOrderedTasks(workflow);
    for (const key of missingFromGroup)
      result.push(
        issue(
          "warning",
          `task_order references missing task “${key}”`,
          workflowId,
        ),
      );
    for (const { key } of unsequenced)
      result.push(
        issue(
          "warning",
          `Task “${key}” is missing from task_order`,
          workflowId,
        ),
      );
    for (const interruptId of workflow.interruptible_by ?? []) {
      if (!workflowKeys.has(interruptId))
        result.push(
          issue(
            "warning",
            `Unknown interruption workflow “${interruptId}”`,
            workflowId,
          ),
        );
    }
  }
  return result;
}

export function validateTaskReferences(
  workflowId: string,
  jsonObject: AgentJsonObject,
): ValidationWarning[] {
  const workflow = jsonObject.workflows?.[workflowId];
  if (!workflow) return [];
  const fields = jsonObject.state?.fields ?? {};
  const result: ValidationWarning[] = [];
  for (const [taskId, task] of Object.entries(workflow.task_group ?? {})) {
    for (const field of Object.values(task.collect ?? {})) {
      if (field.state && !(field.state in fields))
        result.push(
          issue(
            "warning",
            `Unknown state path “${field.state}”`,
            `${workflowId}/${taskId}`,
          ),
        );
    }
    for (const path of task.required_state ?? []) {
      if (!(path in fields))
        result.push(
          issue(
            "warning",
            `Unknown required state “${path}”`,
            `${workflowId}/${taskId}`,
          ),
        );
    }
  }
  return result;
}

export function findWorkflowReferences(
  jsonObject: AgentJsonObject,
  workflowId: string,
): string[] {
  return Object.entries(jsonObject.workflows ?? {})
    .filter(([, workflow]) =>
      (workflow.interruptible_by ?? []).includes(workflowId),
    )
    .map(([id]) => `workflows.${id}.interruptible_by`);
}

export function findStateReferences(
  jsonObject: AgentJsonObject,
  stateId: string,
): string[] {
  const references: string[] = [];
  for (const [workflowId, workflow] of Object.entries(
    jsonObject.workflows ?? {},
  )) {
    for (const [taskId, task] of Object.entries(workflow.task_group ?? {})) {
      if (
        Object.values(task.collect ?? {}).some(
          (field) => field.state === stateId,
        )
      )
        references.push(`${workflowId}/${taskId}.collect`);
      if ((task.required_state ?? []).includes(stateId))
        references.push(`${workflowId}/${taskId}.required_state`);
    }
  }
  for (const [source, targets] of Object.entries(
    jsonObject.state?.dependencies ?? {},
  )) {
    if (source === stateId || targets.includes(stateId))
      references.push(`state.dependencies.${source}`);
  }
  return references;
}
