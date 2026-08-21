export const WORKFLOW_EXECUTION_TOPIC = "smartconvo.workflow.execution.v1";
export const WORKFLOW_SNAPSHOT_ATTRIBUTE = "smartconvo.workflow.snapshot";

export type AgentId = number | string;
export type WorkflowNodeKind = "router" | "workflow" | "task";
export type WorkflowEdgeKind = "routing" | "sequence" | "interrupt";

export interface WorkflowTaskV1 {
  id: string;
  nodeId: string;
  workflowId: string;
  label: string;
  description: string;
  kind: string;
  tools: string[];
}

export interface WorkflowDefinitionV1 {
  id: string;
  nodeId: string;
  label: string;
  description: string;
  interruptibleBy: string[];
  resumeAfterInterrupt: boolean;
  tasks: WorkflowTaskV1[];
}

export interface WorkflowEdgeV1 {
  id: string;
  source: string;
  target: string;
  kind: WorkflowEdgeKind;
}

export interface WorkflowGraphV1 {
  version: 1;
  structuralHash: string;
  agent: {
    id: AgentId;
    name: string;
    agentType: "workflow";
    agentNumber: string;
  };
  router: {
    id: "router";
    label: "Router";
  };
  workflows: WorkflowDefinitionV1[];
  edges: WorkflowEdgeV1[];
}

export const TELEMETRY_EVENT_TYPES = [
  "router.entered",
  "workflow.started",
  "workflow.completed",
  "workflow.interrupted",
  "workflow.resumed",
  "task.started",
  "task.completed",
  "task.regressed",
  "tool.started",
  "tool.completed",
  "tool.failed",
  "state.updated",
  "call.ending",
  "call.transferring",
  "node.started",
  "flow.interrupted",
  "transition.selected",
] as const;

export type WorkflowTelemetryEventType = (typeof TELEMETRY_EVENT_TYPES)[number];

export interface WorkflowTelemetryEventV1 {
  version: 1;
  seq: number;
  timestamp: string;
  session_id: string;
  agent_id: AgentId | null;
  agent_type: "workflow";
  type: WorkflowTelemetryEventType;
  workflow_id: string | null;
  task_id: string | null;
  node_id?: string | null;
  edge_id?: string | null;
  tool_name: string | null;
  status: string | null;
  state_fields?: string[] | null;
  state_values?: Record<string, unknown> | null;
  tool_call_id?: string | null;
  tool_arguments?: Record<string, unknown> | null;
  tool_response?: unknown;
  tool_error?: string | null;
}

export interface ToolInvocationRecord {
  id: string;
  workflowId: string;
  taskId: string;
  toolName: string;
  status: "active" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  arguments: Record<string, unknown>;
  response?: unknown;
  error?: string;
}

export interface WorkflowSnapshotV1 {
  version: 1;
  seq: number;
  session_id: string;
  agent_id: AgentId | null;
  agent_type: "workflow";
  workflow_id: string | null;
  task_id: string | null;
  node_id?: string | null;
  edge_id?: string | null;
  status: string;
}

export type ExecutionStatus =
  | "idle"
  | "active"
  | "completed"
  | "interrupted"
  | "resumed"
  | "regressed"
  | "failed"
  | "ending"
  | "transferring";

export interface WorkflowExecutionState {
  sessionId: string | null;
  lastSeq: number;
  telemetrySeen: boolean;
  gapDetected: boolean;
  routerStatus: ExecutionStatus;
  workflowStatuses: Record<string, ExecutionStatus>;
  taskStatuses: Record<string, ExecutionStatus>;
  toolStatuses: Record<string, ExecutionStatus>;
  updatedStateFields: Record<string, string[]>;
  stateValues: Record<string, Record<string, unknown>>;
  latestStateValues: Record<string, unknown>;
  toolCalls: ToolInvocationRecord[];
  currentWorkflowId: string | null;
  currentTaskId: string | null;
  currentEdgeId: string | null;
  callStatus: ExecutionStatus;
  events: WorkflowTelemetryEventV1[];
}

export interface CallInputs {
  agentId: number;
  dispatchName: string;
  agentNumber: string;
  humanNumber: string;
  additionalAttributes?: Record<string, string>;
}

export interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  identity: string;
  accessToken: string;
}
