import type {
  AgentJsonObject,
  WorkflowArchitecture,
} from "@/components/workflow-editor/types";

/**
 * Returns a complete, editable workflow definition for a newly created agent.
 * The router is implicit in Workflow Studio; having a valid workflow here gives
 * it a route immediately while keeping the definition runnable and saveable.
 */
export function createSupervisorWorkflowDefinition(): AgentJsonObject {
  return {
    schema_version: 1,
    assistant: {
      routing_instructions: [
        "Identify the caller's request and run the workflow that best matches it.",
        "Use the main workflow until more specific workflows are added.",
      ],
      run_workflow_tool_description:
        "Run the workflow selected for the caller's current request.",
      greeting_from_agent_definition: true,
      use_agent_definition_instructions: true,
    },
    state: {
      fields: {
        "session.request": {
          type: "string",
          nullable: true,
          minLength: 1,
          maxLength: 2000,
          normalizers: ["strip", "collapse_spaces"],
        },
      },
      dependencies: {},
    },
    workflows: {
      main: {
        description:
          "Understand the caller's request. Add or replace tasks as this agent is configured.",
        task_group: {
          understand_request: {
            kind: "collect",
            description: "Understand what the caller needs.",
            entry_prompt: "How can I help you today?",
            collect: {
              request: {
                state: "session.request",
                schema: {
                  type: "string",
                  description: "The caller's current request.",
                },
              },
            },
            instructions: [
              "Ask what the caller needs if their request is not already clear.",
              "Capture the caller's request without inventing details.",
            ],
          },
        },
        task_order: ["understand_request"],
        interruptible_by: [],
        resume_after_interrupt: false,
        summarize_chat_ctx: false,
      },
    },
    task_defaults: {
      instructions: [
        "Keep responses concise and never mention workflows, tasks, tools, or state fields.",
      ],
    },
    tool_presentation: {},
  };
}

export function createLinearWorkflowDefinition(): AgentJsonObject {
  const endNode = (label: string, farewell: string, x: number, y: number) => ({
    type: "end_call" as const,
    label,
    farewell,
    ui: { position: { x, y } },
  });
  return {
    schema_version: 2,
    architecture: "linear",
    max_hops: 100,
    failure_message:
      "I'm sorry, I couldn't complete this request right now. Please try again later. Goodbye.",
    task_defaults: {
      instructions: [
        "Speak concise, natural English and ask only one necessary question at a time.",
        "Never mention workflow nodes, state fields, conditions, or tools.",
        "Never claim that a transfer, callback, or external action succeeded before its result confirms success.",
      ],
    },
    state: {
      fields: {
        "session.global_intent": {
          type: "string",
          nullable: true,
          enum: ["end_request", "transfer_request", "callback_request"],
        },
        "session.inbound_phone": {
          type: "string",
          nullable: true,
          normalizers: ["strip"],
        },
        "lead.engaged": { type: "boolean", nullable: true },
        "lead.has_need": { type: "boolean", nullable: true },
        "lead.need_summary": {
          type: "string",
          nullable: true,
          minLength: 1,
          maxLength: 1000,
          normalizers: ["strip", "collapse_spaces"],
        },
        "lead.role": {
          type: "string",
          nullable: true,
          enum: ["decision_maker", "influencer", "other"],
        },
        "lead.timeline": {
          type: "string",
          nullable: true,
          enum: ["now", "30_days", "90_days", "later", "unknown"],
        },
        "sales.name": { type: "string", nullable: true },
        "sales.phone": { type: "string", nullable: true },
        "callback.phone": {
          type: "string",
          nullable: true,
          normalizers: ["strip"],
        },
        "callback.preferred_time": {
          type: "string",
          nullable: true,
          maxLength: 200,
          normalizers: ["strip", "collapse_spaces"],
        },
      },
      dependencies: {},
    },
    flows: {
      main: {
        entry_node_id: "start",
        nodes: {
          start: {
            type: "start",
            label: "Start",
            ui: { position: { x: 40, y: 260 } },
          },
          welcome: {
            type: "conversation",
            label: "Welcome and engage",
            mode: "collect",
            entry_prompt:
              "Hello! I would like to understand whether our solution could help your team. Is now a good time for two quick questions?",
            instructions: [
              "Greet the caller and ask permission to continue.",
              "Set engaged true only when the caller agrees to continue; otherwise set it false.",
            ],
            collect: {
              engaged: {
                state: "lead.engaged",
                schema: {
                  type: "boolean",
                  description: "Whether the caller agrees to continue.",
                },
              },
            },
            ui: { position: { x: 260, y: 260 } },
          },
          engagement_split: {
            type: "logic_split",
            label: "Caller engaged?",
            ui: { position: { x: 530, y: 260 } },
          },
          discover_need: {
            type: "conversation",
            label: "Discover need",
            mode: "collect",
            entry_prompt:
              "What is the main challenge your team is trying to solve right now?",
            instructions: [
              "Determine whether the caller describes a relevant business need and summarize it faithfully.",
            ],
            collect: {
              has_need: {
                state: "lead.has_need",
                schema: {
                  type: "boolean",
                  description: "Whether a relevant need exists.",
                },
              },
              need_summary: {
                state: "lead.need_summary",
                schema: {
                  type: "string",
                  description: "A concise summary of the caller's need.",
                },
              },
            },
            ui: { position: { x: 790, y: 180 } },
          },
          introduce_solution: {
            type: "conversation",
            label: "Introduce solution",
            mode: "message",
            message:
              "Thank you. Based on what you shared, our team may be able to help with {state.lead.need_summary}. I just need to understand your role and timing.",
            ui: { position: { x: 1060, y: 180 } },
          },
          authority_timeline: {
            type: "conversation",
            label: "Authority and timeline",
            mode: "collect",
            entry_prompt:
              "Are you the decision-maker or involved in the decision, and when are you hoping to act?",
            instructions: [
              "Classify role as decision_maker, influencer, or other.",
              "Classify timeline as now, 30_days, 90_days, later, or unknown.",
            ],
            collect: {
              role: {
                state: "lead.role",
                schema: {
                  type: "string",
                  enum: ["decision_maker", "influencer", "other"],
                },
              },
              timeline: {
                state: "lead.timeline",
                schema: {
                  type: "string",
                  enum: ["now", "30_days", "90_days", "later", "unknown"],
                },
              },
            },
            ui: { position: { x: 1330, y: 180 } },
          },
          qualified: {
            type: "logic_split",
            label: "Qualified lead?",
            ui: { position: { x: 1600, y: 180 } },
          },
          qualified_message: {
            type: "conversation",
            label: "Qualified message",
            mode: "message",
            message:
              "It sounds like a conversation with our Sales team would be useful. I will connect you now.",
            ui: { position: { x: 1860, y: 80 } },
          },
          sales_lookup: {
            type: "function",
            label: "Find Sales contact",
            tool: "getbroker",
            arguments: { department: "Sales" },
            response_mappings: {
              "sales.name": "members.0.name",
              "sales.phone": "members.0.phone",
            },
            ui: { position: { x: 2120, y: 80 } },
          },
          sales_transfer: {
            type: "call_transfer",
            label: "Transfer to Sales",
            destination: "{state.sales.phone}",
            reason: "qualified_lead",
            unresolved_query: "Qualified lead requested a Sales conversation.",
            ui: { position: { x: 2380, y: 80 } },
          },
          unavailable: {
            type: "conversation",
            label: "Transfer unavailable",
            mode: "message",
            message:
              "I'm sorry, I couldn't connect you to Sales right now. Please try again later.",
            ui: { position: { x: 2380, y: 300 } },
          },
          unavailable_end: endNode(
            "End after failure",
            "Thank you for your time. Goodbye.",
            2640,
            300,
          ),
          nurture: {
            type: "conversation",
            label: "Nurture message",
            mode: "message",
            message:
              "Thank you for sharing that. It may be best to reconnect when the need or timeline becomes more immediate.",
            ui: { position: { x: 1860, y: 300 } },
          },
          nurture_end: endNode(
            "End nurture path",
            "Thank you for your time. Goodbye.",
            2120,
            420,
          ),
          declined_end: endNode(
            "End declined path",
            "No problem. Thank you for your time. Goodbye.",
            790,
            430,
          ),
        },
        edges: [
          { id: "main_start", source: "start", target: "welcome" },
          { id: "main_welcome", source: "welcome", target: "engagement_split" },
          {
            id: "main_engaged",
            source: "engagement_split",
            target: "discover_need",
            label: "Yes",
            condition: {
              path: "lead.engaged",
              operator: "equals",
              value: true,
            },
          },
          {
            id: "main_declined",
            source: "engagement_split",
            target: "declined_end",
            label: "No",
            default: true,
          },
          { id: "main_need", source: "discover_need", target: "introduce_solution" },
          { id: "main_intro", source: "introduce_solution", target: "authority_timeline" },
          { id: "main_authority", source: "authority_timeline", target: "qualified" },
          {
            id: "main_qualified",
            source: "qualified",
            target: "qualified_message",
            label: "Qualified",
            condition: {
              all: [
                { path: "lead.has_need", operator: "equals", value: true },
                {
                  path: "lead.role",
                  operator: "in",
                  value: ["decision_maker", "influencer"],
                },
                {
                  path: "lead.timeline",
                  operator: "in",
                  value: ["now", "30_days", "90_days"],
                },
              ],
            },
          },
          {
            id: "main_unqualified",
            source: "qualified",
            target: "nurture",
            label: "Not qualified",
            default: true,
          },
          { id: "main_qualified_message", source: "qualified_message", target: "sales_lookup" },
          {
            id: "main_sales_found",
            source: "sales_lookup",
            target: "sales_transfer",
            source_handle: "success",
          },
          {
            id: "main_lookup_failed",
            source: "sales_lookup",
            target: "unavailable",
            source_handle: "error",
          },
          {
            id: "main_transfer_failed",
            source: "sales_transfer",
            target: "unavailable",
            source_handle: "error",
          },
          { id: "main_unavailable_end", source: "unavailable", target: "unavailable_end" },
          { id: "main_nurture_end", source: "nurture", target: "nurture_end" },
        ],
      },
      global: {
        entry_node_id: "global_start",
        intents: [
          { id: "end_request", description: "The caller clearly wants to end the call." },
          { id: "transfer_request", description: "The caller asks to speak with Sales or a person." },
          { id: "callback_request", description: "The caller asks to record a preferred callback time." },
        ],
        nodes: {
          global_start: {
            type: "start",
            label: "Global start",
            ui: { position: { x: 60, y: 240 } },
          },
          global_intent: {
            type: "logic_split",
            label: "Global intent",
            ui: { position: { x: 310, y: 240 } },
          },
          global_end: endNode(
            "End call",
            "Thank you for calling. Goodbye.",
            620,
            40,
          ),
          global_sales_lookup: {
            type: "function",
            label: "Find Sales contact",
            tool: "getbroker",
            arguments: { department: "Sales" },
            response_mappings: {
              "sales.name": "members.0.name",
              "sales.phone": "members.0.phone",
            },
            ui: { position: { x: 620, y: 200 } },
          },
          global_transfer: {
            type: "call_transfer",
            label: "Transfer to Sales",
            message: "I will connect you with our Sales team now.",
            destination: "{state.sales.phone}",
            reason: "caller_requested_transfer",
            unresolved_query: "Caller requested a Sales representative.",
            ui: { position: { x: 900, y: 200 } },
          },
          global_unavailable: {
            type: "conversation",
            label: "Transfer unavailable",
            mode: "message",
            message:
              "I'm sorry, I couldn't connect you to Sales right now. Please try again later.",
            ui: { position: { x: 900, y: 370 } },
          },
          global_unavailable_end: endNode(
            "End unavailable",
            "Thank you for calling. Goodbye.",
            1180,
            370,
          ),
          callback_details: {
            type: "conversation",
            label: "Record callback preference",
            mode: "collect",
            entry_prompt:
              "What phone number and preferred time should I record for this call?",
            instructions: [
              "Use the inbound phone already shown in state when the caller wants to use that number.",
              "Do not promise that a callback has been scheduled.",
            ],
            collect: {
              phone: {
                state: "callback.phone",
                schema: { type: "string", description: "Preferred callback phone number." },
              },
              preferred_time: {
                state: "callback.preferred_time",
                schema: { type: "string", description: "Preferred callback time in the caller's own words." },
              },
            },
            ui: { position: { x: 620, y: 520 } },
          },
          callback_disclosure: {
            type: "conversation",
            label: "Callback disclosure",
            mode: "message",
            message:
              "I recorded {state.callback.phone} and {state.callback.preferred_time} for this call only. This does not schedule or guarantee a callback.",
            ui: { position: { x: 900, y: 520 } },
          },
          callback_end: endNode(
            "End callback path",
            "Thank you for calling. Goodbye.",
            1180,
            520,
          ),
        },
        edges: [
          { id: "global_start_edge", source: "global_start", target: "global_intent" },
          {
            id: "global_end_edge",
            source: "global_intent",
            target: "global_end",
            label: "End",
            condition: {
              path: "session.global_intent",
              operator: "equals",
              value: "end_request",
            },
          },
          {
            id: "global_transfer_edge",
            source: "global_intent",
            target: "global_sales_lookup",
            label: "Transfer",
            condition: {
              path: "session.global_intent",
              operator: "equals",
              value: "transfer_request",
            },
          },
          {
            id: "global_callback_edge",
            source: "global_intent",
            target: "callback_details",
            label: "Callback",
            default: true,
          },
          {
            id: "global_sales_found",
            source: "global_sales_lookup",
            target: "global_transfer",
            source_handle: "success",
          },
          {
            id: "global_lookup_failed",
            source: "global_sales_lookup",
            target: "global_unavailable",
            source_handle: "error",
          },
          {
            id: "global_transfer_failed",
            source: "global_transfer",
            target: "global_unavailable",
            source_handle: "error",
          },
          { id: "global_unavailable_end", source: "global_unavailable", target: "global_unavailable_end" },
          { id: "global_callback_details", source: "callback_details", target: "callback_disclosure" },
          { id: "global_callback_end", source: "callback_disclosure", target: "callback_end" },
        ],
      },
    },
    tool_presentation: {},
  };
}

export function createStarterWorkflowDefinition(
  architecture: WorkflowArchitecture = "supervisor",
): AgentJsonObject {
  return architecture === "linear"
    ? createLinearWorkflowDefinition()
    : createSupervisorWorkflowDefinition();
}
