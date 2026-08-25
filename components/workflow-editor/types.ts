// Canonical JSON types — mirrors the backend schema without inventing new structure

export type JsonObject = Record<string, unknown>;

export interface StateField {
  type: string;
  nullable?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  error?: string;
  normalizers?: string[];
  enum?: unknown[];
  [key: string]: unknown;
}

export interface StateSection {
  fields: Record<string, StateField>;
  dependencies?: Record<string, string[]>;
}

export interface AssistantSection {
  routing_instructions: string[];
  run_workflow_tool_description?: string;
  greeting_from_agent_definition?: boolean;
  use_agent_definition_instructions?: boolean;
  [key: string]: unknown;
}

export interface CollectField {
  state: string;
  schema?: Record<string, unknown>;
  required?: boolean;
  [key: string]: unknown;
}

export interface CompletionValidator {
  tool: string;
  type: string;
  field: string;
  argument?: string;
  paths?: string[];
  [key: string]: unknown;
}

export interface Task {
  kind: string;
  ui?: { position?: { x: number; y: number } };
  description?: string;
  entry_prompt?: string;
  on_enter_instructions?: string;
  instructions?: string[];
  tools?: string[];
  collect?: Record<string, CollectField>;
  required_tool_calls_before_complete?: string[];
  completion_validators?: CompletionValidator[];
  // action
  action_tool?: string;
  required_state?: string[];
  response_state?: string;
  action_arguments?: Record<string, string>;
  summary_template?: string;
  confirmation_question?: string;
  success_message?: string;
  cancel_message?: string;
  // answer
  answer_tool?: string;
  answer_paths?: string[];
  answer_state?: string;
  question_state?: string;
  question_argument?: string;
  fallback_answer?: string;
  [key: string]: unknown;
}

export interface Workflow {
  task_group: Record<string, Task>;
  task_order: string[];
  entry_task_id?: string;
  task_edges?: SupervisorTaskEdge[];
  description?: string;
  start_phrase?: string;
  interruptible_by?: string[];
  resume_after_interrupt?: boolean;
  summarize_chat_ctx?: boolean;
  [key: string]: unknown;
}

export interface ToolPresentation {
  progress_phrase?: string;
  [key: string]: unknown;
}

export interface TaskDefaults {
  instructions?: string[];
  [key: string]: unknown;
}

export type WorkflowArchitecture = "supervisor" | "linear";
export type LinearNodeType =
  | "start"
  | "conversation"
  | "function"
  | "logic_split"
  | "call_transfer"
  | "end_call";

export interface LinearConditionLeaf {
  path: string;
  operator:
    | "equals"
    | "not_equals"
    | "exists"
    | "not_exists"
    | "in"
    | "contains"
    | "gt"
    | "gte"
    | "lt"
    | "lte";
  value?: unknown;
}

export type LinearCondition =
  | LinearConditionLeaf
  | { all: LinearCondition[] }
  | { any: LinearCondition[] };

export interface LinearNode {
  type: LinearNodeType;
  label?: string;
  ui?: { position?: { x: number; y: number } };
  mode?: "collect" | "message";
  entry_prompt?: string;
  message?: string;
  farewell?: string;
  instructions?: string[];
  collect?: Record<string, CollectField>;
  tool?: string;
  arguments?: Record<string, unknown>;
  response_mappings?: Record<string, string>;
  destination?: string;
  reason?: string;
  unresolved_query?: string;
  [key: string]: unknown;
}

export interface LinearEdge {
  id: string;
  source: string;
  target: string;
  source_handle?: "success" | "error" | string;
  label?: string;
  condition?: LinearCondition;
  default?: boolean;
}

export interface SupervisorTaskEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: LinearCondition;
  default?: boolean;
}

export interface LinearIntent {
  id: string;
  description: string;
}

export interface LinearFlow {
  entry_node_id: string;
  nodes: Record<string, LinearNode>;
  edges: LinearEdge[];
  intents?: LinearIntent[];
}

export interface AgentJsonObject {
  state?: StateSection;
  assistant?: AssistantSection;
  workflows?: Record<string, Workflow>;
  task_defaults?: TaskDefaults;
  schema_version?: number;
  architecture?: WorkflowArchitecture;
  flows?: Record<"main" | "global", LinearFlow>;
  max_hops?: number;
  failure_message?: string;
  tool_presentation?: Record<string, ToolPresentation>;
  [key: string]: unknown;
}

export interface CanonicalAgentState {
  agent_type: string;
  json_object: AgentJsonObject;
  include_default_tools: boolean;
  default_tool_names: string[];
}

export interface AgentTool {
  id?: number | string;
  name: string;
  description?: string;
  parameters?: Record<string, AgentToolParameter>;
}

export interface AgentToolParameter {
  type?: string;
  description?: string;
  required?: boolean;
  enum?: unknown[];
  [key: string]: unknown;
}

export interface WorkflowAgentSummary {
  id: number;
  name: string;
  agent_type: string;
  twilio_phone_numbers: string[];
}

export interface WorkflowAgentDefinition extends WorkflowAgentSummary {
  json_object: AgentJsonObject;
  custom_features: AgentTool[];
  include_default_tools: boolean;
  default_tool_names: string[];
}

// Inspector selection
export type SelectedEntityType =
  "router" | "workflow" | "task" | "variable" | "edge" | "json";

export interface SelectedEntity {
  type: SelectedEntityType;
  workflowId?: string;
  taskId?: string;
  fieldPath?: string;
  edgeId?: string;
  inspectorTab?: "instructions" | "routing" | "global" | "tools";
  inspectorRequestId?: number;
}

// Validation
export type ValidationSeverity = "warning" | "error";

export interface ValidationWarning {
  severity: ValidationSeverity;
  message: string;
  context?: string;
}
