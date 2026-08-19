import { describe, it, expect } from "vitest"
import { validateWorkflowReferences } from "../../components/workflow-editor/utils/validation"
import type { AgentJsonObject } from "../../components/workflow-editor/types"

const VALID: AgentJsonObject = {
  workflows: {
    wf1: {
      task_group: {
        t1: { kind: "collect", tools: [], collect: {} },
        t2: { kind: "collect", tools: [], collect: {} },
      },
      task_order: ["t1", "t2"],
      interruptible_by: ["wf2"],
      resume_after_interrupt: true,
    },
    wf2: {
      task_group: {
        t3: { kind: "action", tools: [], action_tool: "some_tool" },
      },
      task_order: ["t3"],
      interruptible_by: [],
      resume_after_interrupt: false,
    },
  },
}

describe("validateWorkflowReferences", () => {
  it("returns no warnings for valid structure", () => {
    const warnings = validateWorkflowReferences(VALID)
    expect(warnings).toHaveLength(0)
  })

  it("warns about task_order referencing missing task", () => {
    const broken: AgentJsonObject = {
      workflows: {
        wf1: {
          task_group: { t1: { kind: "collect", tools: [], collect: {} } },
          task_order: ["t1", "ghost"],
          interruptible_by: [],
          resume_after_interrupt: false,
        },
      },
    }
    const warnings = validateWorkflowReferences(broken)
    expect(warnings.some((w) => w.message.includes("ghost"))).toBe(true)
    expect(warnings.some((w) => w.message.includes("task_order"))).toBe(true)
  })

  it("warns about task in task_group missing from task_order", () => {
    const broken: AgentJsonObject = {
      workflows: {
        wf1: {
          task_group: {
            t1: { kind: "collect", tools: [], collect: {} },
            orphan: { kind: "collect", tools: [], collect: {} },
          },
          task_order: ["t1"],
          interruptible_by: [],
          resume_after_interrupt: false,
        },
      },
    }
    const warnings = validateWorkflowReferences(broken)
    expect(warnings.some((w) => w.message.includes("orphan"))).toBe(true)
  })

  it("warns about interruptible_by referencing unknown workflow", () => {
    const broken: AgentJsonObject = {
      workflows: {
        wf1: {
          task_group: { t1: { kind: "collect", tools: [], collect: {} } },
          task_order: ["t1"],
          interruptible_by: ["nonexistent"],
          resume_after_interrupt: true,
        },
      },
    }
    const warnings = validateWorkflowReferences(broken)
    expect(warnings.some((w) => w.message.includes("nonexistent"))).toBe(true)
  })

  it("does NOT mutate the input JSON object", () => {
    const original = JSON.stringify(VALID)
    validateWorkflowReferences(VALID)
    expect(JSON.stringify(VALID)).toBe(original)
  })
})
