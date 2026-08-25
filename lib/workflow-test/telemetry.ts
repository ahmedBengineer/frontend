import {
  TELEMETRY_EVENT_TYPES,
  type AgentId,
  type ExecutionStatus,
  type WorkflowExecutionState,
  type ToolInvocationRecord,
  type WorkflowSnapshotV1,
  type WorkflowTelemetryEventType,
  type WorkflowTelemetryEventV1,
} from "@/lib/workflow-test/contracts";

const EVENT_TYPES = new Set<string>(TELEMETRY_EVENT_TYPES);
const MAX_TEXT = 256;
const MAX_EVENTS = 200;
const MAX_TOOL_CALLS = 100;
const MAX_TOOL_PAYLOAD = 16_384;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseRawJson(value: string | Uint8Array): unknown {
  try {
    const text =
      typeof value === "string" ? value : new TextDecoder().decode(value);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function nullableText(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > MAX_TEXT) return undefined;
  return value;
}

function nullableTextArray(value: unknown): string[] | null | undefined {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return undefined;
  const items = value.map(nullableText);
  if (items.some((item) => item === undefined || item === null)) return undefined;
  return items as string[];
}

function nullableStateValues(
  value: unknown,
): Record<string, unknown> | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value);
  if (entries.length > 100) return undefined;
  if (
    entries.some(
      ([key, item]) =>
        !key ||
        key.length > MAX_TEXT ||
        JSON.stringify(item).length > 4096,
    )
  ) {
    return undefined;
  }
  return Object.fromEntries(entries);
}

function nullableToolArguments(
  value: unknown,
): Record<string, unknown> | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return undefined;
  try {
    if (JSON.stringify(value).length > MAX_TOOL_PAYLOAD) return undefined;
  } catch {
    return undefined;
  }
  return value;
}

function boundedToolResponse(value: unknown): unknown | undefined {
  if (value === undefined) return undefined;
  try {
    if (JSON.stringify(value).length > MAX_TOOL_PAYLOAD) return undefined;
  } catch {
    return undefined;
  }
  return value;
}

function nullableToolError(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length > 4096) return undefined;
  return value;
}

function validAgentId(value: unknown): value is AgentId | null {
  return (
    value === null || typeof value === "string" || typeof value === "number"
  );
}

function matchesAgent(actual: AgentId | null, expected: AgentId): boolean {
  return actual !== null && String(actual) === String(expected);
}

function basePayload(
  value: unknown,
  expectedAgentId: AgentId,
): JsonRecord | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1 || value.agent_type !== "workflow") return null;
  if (!Number.isInteger(value.seq) || Number(value.seq) < 1) return null;
  if (
    typeof value.session_id !== "string" ||
    !value.session_id ||
    value.session_id.length > MAX_TEXT
  ) {
    return null;
  }
  if (
    !validAgentId(value.agent_id) ||
    !matchesAgent(value.agent_id, expectedAgentId)
  ) {
    return null;
  }
  return value;
}

export function parseTelemetryEvent(
  raw: string | Uint8Array,
  expectedAgentId: AgentId,
): WorkflowTelemetryEventV1 | null {
  const value = basePayload(parseRawJson(raw), expectedAgentId);
  if (
    !value ||
    typeof value.type !== "string" ||
    !EVENT_TYPES.has(value.type)
  ) {
    return null;
  }
  if (
    typeof value.timestamp !== "string" ||
    Number.isNaN(Date.parse(value.timestamp))
  ) {
    return null;
  }
  const workflowId = nullableText(value.workflow_id);
  const taskId = nullableText(value.task_id);
  const toolName = nullableText(value.tool_name);
  const nodeId = nullableText(value.node_id ?? null);
  const edgeId = nullableText(value.edge_id ?? null);
  const status = nullableText(value.status);
  const stateFields = nullableTextArray(value.state_fields);
  const stateValues = nullableStateValues(value.state_values);
  const toolCallId = nullableText(value.tool_call_id ?? null);
  const toolArguments = nullableToolArguments(value.tool_arguments);
  const toolResponse = boundedToolResponse(value.tool_response);
  const toolError = nullableToolError(value.tool_error);
  if (
    [
      workflowId,
      taskId,
      nodeId,
      edgeId,
      toolName,
      status,
      stateFields,
      stateValues,
      toolCallId,
      toolArguments,
      toolError,
    ].some(
      (item) => item === undefined,
    ) ||
    (Object.prototype.hasOwnProperty.call(value, "tool_response") &&
      toolResponse === undefined)
  ) {
    return null;
  }
  // Construct a fixed object so unknown or private properties are discarded.
  return {
    version: 1,
    seq: Number(value.seq),
    timestamp: String(value.timestamp),
    session_id: String(value.session_id),
    agent_id: value.agent_id as AgentId,
    agent_type: "workflow",
    type: value.type as WorkflowTelemetryEventType,
    workflow_id: workflowId as string | null,
    task_id: taskId as string | null,
    ...(nodeId ? { node_id: nodeId } : {}),
    ...(edgeId ? { edge_id: edgeId } : {}),
    tool_name: toolName as string | null,
    status: status as string | null,
    state_fields: stateFields as string[] | null,
    state_values: stateValues as Record<string, unknown> | null,
    ...(toolCallId ? { tool_call_id: toolCallId } : {}),
    ...(toolArguments ? { tool_arguments: toolArguments } : {}),
    ...(Object.prototype.hasOwnProperty.call(value, "tool_response")
      ? { tool_response: toolResponse }
      : {}),
    ...(toolError ? { tool_error: toolError } : {}),
  };
}

export function parseWorkflowSnapshot(
  raw: string,
  expectedAgentId: AgentId,
): WorkflowSnapshotV1 | null {
  const value = basePayload(parseRawJson(raw), expectedAgentId);
  if (!value) return null;
  const workflowId = nullableText(value.workflow_id);
  const taskId = nullableText(value.task_id);
  const status = nullableText(value.status);
  const nodeId = nullableText(value.node_id ?? null);
  const edgeId = nullableText(value.edge_id ?? null);
  if (
    workflowId === undefined ||
    taskId === undefined ||
    nodeId === undefined ||
    edgeId === undefined ||
    status === undefined ||
    status === null
  ) {
    return null;
  }
  return {
    version: 1,
    seq: Number(value.seq),
    session_id: String(value.session_id),
    agent_id: value.agent_id as AgentId,
    agent_type: "workflow",
    workflow_id: workflowId,
    task_id: taskId,
    ...(nodeId ? { node_id: nodeId } : {}),
    ...(edgeId ? { edge_id: edgeId } : {}),
    status,
  };
}

export function taskStatusKey(workflowId: string, taskId: string): string {
  return `${workflowId}/${taskId}`;
}

export function toolStatusKey(
  workflowId: string,
  taskId: string,
  toolName: string,
): string {
  return `${workflowId}/${taskId}/${toolName}`;
}

export function createExecutionState(): WorkflowExecutionState {
  return {
    sessionId: null,
    lastSeq: 0,
    telemetrySeen: false,
    gapDetected: false,
    routerStatus: "idle",
    workflowStatuses: {},
    taskStatuses: {},
    toolStatuses: {},
    updatedStateFields: {},
    stateValues: {},
    latestStateValues: {},
    toolCalls: [],
    currentWorkflowId: null,
    currentTaskId: null,
    currentEdgeId: null,
    callStatus: "idle",
    events: [],
  };
}

function statusFromWire(
  status: string | null,
  fallback: ExecutionStatus,
): ExecutionStatus {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("fail") || normalized.includes("error"))
    return "failed";
  if (normalized.includes("interrupt")) return "interrupted";
  if (normalized.includes("regress")) return "regressed";
  if (normalized.includes("transfer")) return "transferring";
  if (normalized.includes("ending") || normalized.includes("end_call"))
    return "ending";
  if (normalized === "active" || normalized === "started") return "active";
  if (normalized.includes("complete") || normalized.includes("success"))
    return "completed";
  return fallback;
}

function canAccept(
  state: WorkflowExecutionState,
  seq: number,
  sessionId: string,
): boolean {
  if (state.sessionId && state.sessionId !== sessionId) return false;
  return seq > state.lastSeq;
}

function acceptedBase(
  state: WorkflowExecutionState,
  seq: number,
  sessionId: string,
): WorkflowExecutionState {
  return {
    ...state,
    sessionId,
    lastSeq: seq,
    telemetrySeen: true,
    gapDetected: state.gapDetected || seq > state.lastSeq + 1,
  };
}

export function applyTelemetryEvent(
  state: WorkflowExecutionState,
  event: WorkflowTelemetryEventV1,
): WorkflowExecutionState {
  if (!canAccept(state, event.seq, event.session_id)) return state;
  let next = acceptedBase(state, event.seq, event.session_id);
  next = { ...next, events: [...next.events, event].slice(-MAX_EVENTS) };
  const workflowId = event.workflow_id;
  const taskId = event.task_id;

  switch (event.type) {
    case "router.entered":
      return {
        ...next,
        routerStatus: "active",
        currentWorkflowId: null,
        currentTaskId: null,
        currentEdgeId: null,
        callStatus:
          next.callStatus === "ending" || next.callStatus === "transferring"
            ? next.callStatus
            : "active",
      };
    case "workflow.started":
    case "workflow.resumed":
      if (!workflowId) return next;
      return {
        ...next,
        routerStatus: "completed",
        workflowStatuses: {
          ...next.workflowStatuses,
          [workflowId]:
            event.type === "workflow.resumed" ? "resumed" : "active",
        },
        currentWorkflowId: workflowId,
        currentTaskId: taskId,
        callStatus: "active",
      };
    case "workflow.interrupted":
      if (!workflowId) return next;
      return {
        ...next,
        workflowStatuses: {
          ...next.workflowStatuses,
          [workflowId]: "interrupted",
        },
        currentWorkflowId: workflowId,
        currentTaskId: taskId,
      };
    case "workflow.completed":
      if (!workflowId) return next;
      return {
        ...next,
        workflowStatuses: {
          ...next.workflowStatuses,
          [workflowId]: statusFromWire(event.status, "completed"),
        },
        currentWorkflowId: workflowId,
        currentTaskId: null,
      };
    case "task.started":
    case "task.regressed":
      if (!workflowId || !taskId) return next;
      return {
        ...next,
        workflowStatuses: { ...next.workflowStatuses, [workflowId]: "active" },
        taskStatuses: {
          ...next.taskStatuses,
          [taskStatusKey(workflowId, taskId)]:
            event.type === "task.regressed" ? "regressed" : "active",
        },
        currentWorkflowId: workflowId,
        currentTaskId: taskId,
      };
    case "task.completed":
      if (!workflowId || !taskId) return next;
      return {
        ...next,
        taskStatuses: {
          ...next.taskStatuses,
          [taskStatusKey(workflowId, taskId)]: statusFromWire(
            event.status,
            "completed",
          ),
        },
        currentWorkflowId: workflowId,
        currentTaskId: taskId,
      };
    case "tool.started":
    case "tool.completed":
    case "tool.failed":
      if (!workflowId || !taskId || !event.tool_name) return next;
      const matchingIndex = event.tool_call_id
        ? next.toolCalls.findIndex((call) => call.id === event.tool_call_id)
        : event.type === "tool.started"
          ? -1
          : next.toolCalls.findLastIndex(
              (call) =>
                call.workflowId === workflowId &&
                call.taskId === taskId &&
                call.toolName === event.tool_name &&
                call.status === "active",
            );
      const toolStatus =
        event.type === "tool.started"
          ? "active"
          : event.type === "tool.failed"
            ? "failed"
            : "completed";
      const existing = matchingIndex >= 0 ? next.toolCalls[matchingIndex] : null;
      const toolCallId =
        event.tool_call_id ??
        existing?.id ??
        `${event.session_id}:${event.seq}:${workflowId}:${taskId}:${event.tool_name}`;
      const invocation: ToolInvocationRecord = {
        id: toolCallId,
        workflowId,
        taskId,
        toolName: event.tool_name,
        status: toolStatus,
        startedAt: existing?.startedAt ?? event.timestamp,
        ...(event.type !== "tool.started" ? { completedAt: event.timestamp } : {}),
        arguments: event.tool_arguments ?? existing?.arguments ?? {},
        ...(Object.prototype.hasOwnProperty.call(event, "tool_response")
          ? { response: event.tool_response }
          : existing && Object.prototype.hasOwnProperty.call(existing, "response")
            ? { response: existing.response }
            : {}),
        ...(event.tool_error
          ? { error: event.tool_error }
          : existing?.error
            ? { error: existing.error }
            : {}),
      };
      const toolCalls = [...next.toolCalls];
      if (matchingIndex >= 0) toolCalls[matchingIndex] = invocation;
      else toolCalls.push(invocation);
      return {
        ...next,
        toolStatuses: {
          ...next.toolStatuses,
          [toolStatusKey(workflowId, taskId, event.tool_name)]:
            toolStatus,
        },
        toolCalls: toolCalls.slice(-MAX_TOOL_CALLS),
        currentWorkflowId: workflowId,
        currentTaskId: taskId,
      };
    case "state.updated":
      if (!workflowId || !taskId) return next;
      const stateKey = taskStatusKey(workflowId, taskId);
      const updatedFields = Array.from(
        new Set([
          ...(next.updatedStateFields[stateKey] ?? []),
          ...(event.state_fields ?? []),
        ]),
      );
      return {
        ...next,
        workflowStatuses: { ...next.workflowStatuses, [workflowId]: "active" },
        taskStatuses: {
          ...next.taskStatuses,
          [stateKey]: "active",
        },
        updatedStateFields: {
          ...next.updatedStateFields,
          [stateKey]: updatedFields,
        },
        stateValues: {
          ...next.stateValues,
          [stateKey]: {
            ...(next.stateValues[stateKey] ?? {}),
            ...(event.state_values ?? {}),
          },
        },
        latestStateValues: {
          ...next.latestStateValues,
          ...(event.state_values ?? {}),
        },
        currentWorkflowId: workflowId,
        currentTaskId: taskId,
      };
    case "call.ending":
      return {
        ...next,
        routerStatus: "active",
        workflowStatuses: workflowId
          ? { ...next.workflowStatuses, [workflowId]: "ending" }
          : next.workflowStatuses,
        taskStatuses:
          workflowId && taskId
            ? {
                ...next.taskStatuses,
                [taskStatusKey(workflowId, taskId)]: "ending",
              }
            : next.taskStatuses,
        currentWorkflowId: null,
        currentTaskId: null,
        currentEdgeId: null,
        callStatus: "ending",
      };
    case "call.transferring":
      return { ...next, callStatus: "transferring" };
    case "node.started":
      if (!workflowId || !(event.node_id ?? taskId)) return next;
      return {
        ...next,
        workflowStatuses: { ...next.workflowStatuses, [workflowId]: "active" },
        taskStatuses: {
          ...next.taskStatuses,
          [taskStatusKey(workflowId, event.node_id ?? taskId!)]: "active",
        },
        currentWorkflowId: workflowId,
        currentTaskId: event.node_id ?? taskId,
        currentEdgeId: null,
        callStatus:
          next.callStatus === "ending" || next.callStatus === "transferring"
            ? next.callStatus
            : "active",
      };
    case "flow.interrupted":
      if (!workflowId) return next;
      return {
        ...next,
        workflowStatuses: { ...next.workflowStatuses, [workflowId]: "interrupted" },
        currentWorkflowId: workflowId,
        currentTaskId: event.node_id ?? taskId,
      };
    case "transition.selected":
      return {
        ...next,
        currentWorkflowId: workflowId,
        currentTaskId: event.node_id ?? taskId,
        currentEdgeId: event.edge_id ?? null,
      };
  }
}

export function applyWorkflowSnapshot(
  state: WorkflowExecutionState,
  snapshot: WorkflowSnapshotV1,
): WorkflowExecutionState {
  if (!canAccept(state, snapshot.seq, snapshot.session_id)) return state;
  const next = acceptedBase(state, snapshot.seq, snapshot.session_id);
  const status = statusFromWire(snapshot.status, "active");
  if (snapshot.status === "ending" || snapshot.status === "transferring") {
    return { ...next, callStatus: status };
  }
  if (snapshot.workflow_id && snapshot.task_id) {
    return {
      ...next,
      workflowStatuses: {
        ...next.workflowStatuses,
        [snapshot.workflow_id]:
          status === "interrupted" ? "interrupted" : "active",
      },
      taskStatuses: {
        ...next.taskStatuses,
        [taskStatusKey(snapshot.workflow_id, snapshot.task_id)]: status,
      },
      currentWorkflowId: snapshot.workflow_id,
      currentTaskId: snapshot.task_id,
      callStatus: "active",
    };
  }
  if (snapshot.workflow_id) {
    return {
      ...next,
      workflowStatuses: {
        ...next.workflowStatuses,
        [snapshot.workflow_id]: status,
      },
      currentWorkflowId: snapshot.workflow_id,
      currentTaskId: null,
      callStatus: "active",
    };
  }
  return {
    ...next,
    routerStatus: status,
    currentWorkflowId: null,
    currentTaskId: null,
    callStatus: "active",
  };
}
