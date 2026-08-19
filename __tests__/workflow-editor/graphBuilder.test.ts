import { describe, it, expect } from "vitest"
import { buildMainAgentGraph, buildWorkflowGraph } from "../../components/workflow-editor/utils/graphBuilder"
import { setByPath } from "../../components/workflow-editor/utils/jsonPath"
import type { AgentJsonObject } from "../../components/workflow-editor/types"

// Minimal fixture derived from agent_definition.json shape
const FIXTURE: AgentJsonObject = {
  schema_version: 1,
  state: {
    fields: {
      "booking.doctor_name": { type: "string", nullable: true },
      "booking.slot": { type: "string", nullable: true },
      "booking.patient_name": { type: "string", nullable: true },
      "booking.phone": { type: "string", nullable: true },
      "booking.requested_date": { type: "string", nullable: true },
      "information.question": { type: "string", nullable: true },
      "information.answer": { type: "string", nullable: true },
    },
    dependencies: {
      "booking.doctor_name": ["booking.requested_date", "booking.slot"],
    },
  },
  assistant: {
    routing_instructions: [
      "For appointment booking, call run_workflow with create_appointment.",
      "For hospital information, call run_workflow with general_information.",
    ],
    run_workflow_tool_description: "Run the selected workflow.",
    greeting_from_agent_definition: true,
    use_agent_definition_instructions: false,
  },
  workflows: {
    slot_retry: {
      task_group: {
        doctor_and_slot_reselection: {
          kind: "collect",
          tools: ["get_doctor_availability"],
          collect: {
            slot: { state: "booking.slot" },
          },
          instructions: [],
          task_order_position: 0,
        },
      },
      task_order: ["doctor_and_slot_reselection"],
      description: "Internal only.",
      start_phrase: "",
      interruptible_by: ["general_information"],
      resume_after_interrupt: true,
    },
    create_appointment: {
      task_group: {
        doctor_and_slot_selection: {
          kind: "collect",
          tools: ["get_doctor_availability"],
          collect: {
            doctor_name: { state: "booking.doctor_name" },
            slot: { state: "booking.slot" },
          },
          instructions: [],
        },
        personal_details: {
          kind: "collect",
          tools: [],
          collect: {
            patient_name: { state: "booking.patient_name" },
            phone: { state: "booking.phone" },
          },
          instructions: [],
          entry_prompt: "مریض کا پورا نام؟",
        },
        confirm_and_create: {
          kind: "action",
          action_tool: "create_appointment",
          required_state: ["booking.doctor_name", "booking.patient_name"],
          success_message: "آپ کی اپائنٹمنٹ بک ہوگئی ہے۔",
          instructions: [],
        },
      },
      task_order: ["doctor_and_slot_selection", "personal_details", "confirm_and_create"],
      description: "Book an appointment.",
      start_phrase: "آئیے آپ کی اپائنٹمنٹ بک کرتے ہیں۔",
      interruptible_by: ["general_information"],
      resume_after_interrupt: true,
    },
    general_information: {
      task_group: {
        answer_question: {
          kind: "answer",
          tools: ["search_hospital_information"],
          answer_tool: "search_hospital_information",
          answer_paths: ["answer"],
          question_state: "information.question",
          answer_state: "information.answer",
          fallback_answer: "Information not found.",
          instructions: [],
        },
      },
      task_order: ["answer_question"],
      description: "Answer hospital information questions.",
      start_phrase: "میں تصدیق شدہ معلومات دیکھتی ہوں۔",
      interruptible_by: [],
      resume_after_interrupt: false,
    },
  },
  task_defaults: {
    instructions: ["Be concise."],
  },
  tool_presentation: {
    get_doctor_availability: { progress_phrase: "Looking up availability…" },
    create_appointment: { progress_phrase: "Booking appointment…" },
  },
}

describe("buildMainAgentGraph", () => {
  it("Case 1: produces 1 router node + N workflow nodes from fixture", () => {
    const { nodes, edges } = buildMainAgentGraph(FIXTURE)

    const routerNodes = nodes.filter((n) => n.type === "routerNode")
    const workflowNodes = nodes.filter((n) => n.type === "workflowNode")
    const workflowCount = Object.keys(FIXTURE.workflows!).length

    expect(routerNodes).toHaveLength(1)
    expect(routerNodes[0].id).toBe("router")
    expect(workflowNodes).toHaveLength(workflowCount)

    const workflowIds = workflowNodes.map((n) => (n.data as { workflowId: string }).workflowId)
    expect(workflowIds).toContain("create_appointment")
    expect(workflowIds).toContain("general_information")
    expect(workflowIds).toContain("slot_retry")
  })

  it("Case 1: transition edges connect router to every workflow", () => {
    const { edges } = buildMainAgentGraph(FIXTURE)
    const transitionEdges = edges.filter((e) => e.type === "transitionEdge")
    expect(transitionEdges).toHaveLength(Object.keys(FIXTURE.workflows!).length)
    expect(transitionEdges.every((e) => e.source === "router")).toBe(true)
  })

  it("Case 1: interrupt relationships shown on nodes not edges (no spaghetti lines)", () => {
    const { edges, nodes } = buildMainAgentGraph(FIXTURE)
    // Interrupt info is embedded in WorkflowNode.stats.interruptibleBy, not drawn as edges,
    // to avoid crossing lines on the main canvas.
    const interruptEdges = edges.filter((e) => e.type === "interruptEdge")
    expect(interruptEdges.length).toBe(0)
    // The workflow nodes still carry the interruptibleBy data
    const wfNodes = nodes.filter((n) => n.type === "workflowNode")
    const slotRetry = wfNodes.find((n) => (n.data as { workflowId: string }).workflowId === "slot_retry")
    expect((slotRetry?.data as { stats: { interruptibleBy: string[] } }).stats.interruptibleBy).toContain("general_information")
  })

  it("Case 2: extra workflow appears without code changes", () => {
    const withExtra: AgentJsonObject = {
      ...FIXTURE,
      workflows: {
        ...FIXTURE.workflows,
        foo: {
          task_group: {
            foo_task: {
              kind: "collect",
              tools: [],
              collect: {},
              instructions: [],
            },
          },
          task_order: ["foo_task"],
          description: "Extra workflow",
          interruptible_by: [],
          resume_after_interrupt: false,
        },
      },
    }

    const { nodes } = buildMainAgentGraph(withExtra)
    const workflowNodes = nodes.filter((n) => n.type === "workflowNode")
    expect(workflowNodes).toHaveLength(4)
    expect(
      workflowNodes.some((n) => (n.data as { workflowId: string }).workflowId === "foo"),
    ).toBe(true)
  })

  it("Case 3: unknown task property is preserved in node data", () => {
    const withUnknown: AgentJsonObject = {
      ...FIXTURE,
      workflows: {
        ...FIXTURE.workflows,
        create_appointment: {
          ...FIXTURE.workflows!.create_appointment,
          task_group: {
            ...FIXTURE.workflows!.create_appointment.task_group,
            doctor_and_slot_selection: {
              ...FIXTURE.workflows!.create_appointment.task_group.doctor_and_slot_selection,
              some_future_property: { foo: "bar" },
            },
          },
        },
      },
    }

    const { nodes } = buildWorkflowGraph(withUnknown, "create_appointment")
    const taskNode = nodes.find((n) => n.id === "workflow:create_appointment:task:doctor_and_slot_selection")
    expect(taskNode).toBeDefined()
    const task = (taskNode!.data as { task: Record<string, unknown> }).task
    expect(task.some_future_property).toEqual({ foo: "bar" })
  })

  it("Case 4: unknown workflow property is preserved", () => {
    const withUnknown: AgentJsonObject = {
      ...FIXTURE,
      workflows: {
        ...FIXTURE.workflows,
        general_information: {
          ...FIXTURE.workflows!.general_information,
          some_future_workflow_prop: "custom_value",
        },
      },
    }

    const { nodes } = buildMainAgentGraph(withUnknown)
    const wfNode = nodes.find((n) => n.id === "workflow:general_information")
    expect(wfNode).toBeDefined()
    const workflow = (wfNode!.data as { workflow: Record<string, unknown> }).workflow
    expect(workflow.some_future_workflow_prop).toBe("custom_value")
  })
})

describe("buildWorkflowGraph", () => {
  it("Case 1: tasks in correct task_order sequence", () => {
    const { nodes } = buildWorkflowGraph(FIXTURE, "create_appointment")

    const taskNodes = nodes.filter((n) => n.type === "taskNode" && !(n.data as { unsequenced?: boolean }).unsequenced)
    const taskIds = taskNodes.map((n) => (n.data as { taskId: string }).taskId)

    // Must follow task_order, not object insertion order
    expect(taskIds).toEqual(["doctor_and_slot_selection", "personal_details", "confirm_and_create"])
  })

  it("Case 1: Y positions increase top-to-bottom", () => {
    const { nodes } = buildWorkflowGraph(FIXTURE, "create_appointment")
    const sequenced = nodes
      .filter((n) => n.type === "taskNode" && !(n.data as { unsequenced?: boolean }).unsequenced)
      .sort((a, b) => a.position.y - b.position.y)

    for (let i = 1; i < sequenced.length; i++) {
      expect(sequenced[i].position.y).toBeGreaterThan(sequenced[i - 1].position.y)
    }
  })

  it("Case 1: edges connect consecutive tasks", () => {
    const { edges } = buildWorkflowGraph(FIXTURE, "create_appointment")
    expect(edges.some((e) =>
      e.source.includes("doctor_and_slot_selection") &&
      e.target.includes("personal_details")
    )).toBe(true)
    expect(edges.some((e) =>
      e.source.includes("personal_details") &&
      e.target.includes("confirm_and_create")
    )).toBe(true)
  })

  it("Case 5: unsequenced task appears with unsequenced flag", () => {
    const withExtra: AgentJsonObject = {
      ...FIXTURE,
      workflows: {
        ...FIXTURE.workflows,
        create_appointment: {
          ...FIXTURE.workflows!.create_appointment,
          task_group: {
            ...FIXTURE.workflows!.create_appointment.task_group,
            orphan_task: {
              kind: "collect",
              tools: [],
              collect: {},
              instructions: [],
            },
          },
          // orphan_task intentionally NOT in task_order
        },
      },
    }

    const { nodes } = buildWorkflowGraph(withExtra, "create_appointment")
    const orphan = nodes.find(
      (n) =>
        (n.data as { taskId: string }).taskId === "orphan_task" &&
        (n.data as { unsequenced?: boolean }).unsequenced === true,
    )
    expect(orphan).toBeDefined()
  })

  it("Case 6: broken interruptible_by reference does not crash, reflected in stats", () => {
    const withBroken: AgentJsonObject = {
      ...FIXTURE,
      workflows: {
        ...FIXTURE.workflows,
        create_appointment: {
          ...FIXTURE.workflows!.create_appointment,
          interruptible_by: ["nonexistent_workflow"],
        },
      },
    }
    // Should not throw
    expect(() => buildMainAgentGraph(withBroken)).not.toThrow()

    const { nodes } = buildMainAgentGraph(withBroken)
    const wfNode = nodes.find((n) => n.id === "workflow:create_appointment")
    const stats = (wfNode!.data as { stats: { invalidInterrupts: string[] } }).stats
    expect(stats.invalidInterrupts).toContain("nonexistent_workflow")
  })
})

describe("Case 7: lossless round-trip", () => {
  it("structuredClone of json_object is field-identical", () => {
    const original = FIXTURE
    const clone = structuredClone(original)

    // Deep equality check — same keys, same values, same nesting
    expect(JSON.stringify(clone)).toBe(JSON.stringify(original))
  })

  it("setByPath does not mutate the original object", () => {
    const original: Record<string, unknown> = { a: { b: { c: 1 } } }
    const updated = setByPath(original, "a.b.c", 2)
    expect((original.a as Record<string, unknown>).b).toEqual({ c: 1 })
    expect(updated.a).toEqual({ b: { c: 2 } })
  })

  it("unknown fields survive a round-trip through structuredClone", () => {
    const withUnknown = {
      ...FIXTURE,
      some_future_top_level: { x: 42 },
    }
    const cloned = structuredClone(withUnknown)
    expect((cloned as Record<string, unknown>).some_future_top_level).toEqual({ x: 42 })
  })
})
