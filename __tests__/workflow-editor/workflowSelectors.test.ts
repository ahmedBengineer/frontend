import { describe, it, expect } from "vitest"
import {
  getTaskToolReferences,
  getWorkflowToolReferences,
  getWorkflowVariables,
  getOrderedTasks,
} from "../../components/workflow-editor/utils/workflowSelectors"
import type { Task, Workflow } from "../../components/workflow-editor/types"

describe("getTaskToolReferences", () => {
  it("deduplicates tools from multiple sources", () => {
    const task: Task = {
      kind: "action",
      tools: ["toolA", "toolB"],
      action_tool: "toolB", // duplicate
      completion_validators: [{ tool: "toolC", type: "equals_tool_argument", field: "f" }],
      required_tool_calls_before_complete: ["toolA", "toolD"],
    }
    const refs = getTaskToolReferences(task)
    expect(new Set(refs).size).toBe(refs.length) // no duplicates
    expect(refs).toContain("toolA")
    expect(refs).toContain("toolB")
    expect(refs).toContain("toolC")
    expect(refs).toContain("toolD")
  })

  it("returns empty array for task with no tools", () => {
    const task: Task = { kind: "collect", tools: [], collect: {} }
    expect(getTaskToolReferences(task)).toHaveLength(0)
  })
})

describe("getWorkflowVariables", () => {
  it("collects unique state paths from all collect fields", () => {
    const workflow: Workflow = {
      task_group: {
        task1: {
          kind: "collect",
          tools: [],
          collect: {
            fieldA: { state: "booking.doctor_name" },
            fieldB: { state: "booking.slot" },
          },
        },
        task2: {
          kind: "collect",
          tools: [],
          collect: {
            fieldC: { state: "booking.doctor_name" }, // duplicate
            fieldD: { state: "booking.patient_name" },
          },
        },
      },
      task_order: ["task1", "task2"],
      interruptible_by: [],
      resume_after_interrupt: false,
    }
    const vars = getWorkflowVariables(workflow)
    expect(new Set(vars).size).toBe(vars.length)
    expect(vars).toContain("booking.doctor_name")
    expect(vars).toContain("booking.slot")
    expect(vars).toContain("booking.patient_name")
    expect(vars).toHaveLength(3) // deduplicated
  })
})

describe("getOrderedTasks", () => {
  it("returns tasks in task_order sequence", () => {
    const workflow: Workflow = {
      task_group: {
        c: { kind: "collect", tools: [], collect: {} },
        a: { kind: "collect", tools: [], collect: {} },
        b: { kind: "collect", tools: [], collect: {} },
      },
      task_order: ["a", "b", "c"], // different from object insertion order
      interruptible_by: [],
      resume_after_interrupt: false,
    }
    const { ordered } = getOrderedTasks(workflow)
    expect(ordered.map((t) => t.key)).toEqual(["a", "b", "c"])
  })

  it("reports tasks in task_group but not task_order as unsequenced", () => {
    const workflow: Workflow = {
      task_group: {
        main: { kind: "collect", tools: [], collect: {} },
        orphan: { kind: "collect", tools: [], collect: {} },
      },
      task_order: ["main"],
      interruptible_by: [],
      resume_after_interrupt: false,
    }
    const { ordered, unsequenced } = getOrderedTasks(workflow)
    expect(ordered.map((t) => t.key)).toEqual(["main"])
    expect(unsequenced.map((t) => t.key)).toEqual(["orphan"])
  })

  it("reports task_order items missing from task_group", () => {
    const workflow: Workflow = {
      task_group: {
        main: { kind: "collect", tools: [], collect: {} },
      },
      task_order: ["main", "ghost"],
      interruptible_by: [],
      resume_after_interrupt: false,
    }
    const { missingFromGroup } = getOrderedTasks(workflow)
    expect(missingFromGroup).toContain("ghost")
  })
})
