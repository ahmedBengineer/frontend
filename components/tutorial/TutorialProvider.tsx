"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"
import Cookies from "js-cookie"
import { usePathname, useRouter } from "next/navigation"

// ─── Tutorial Step Definitions ────────────────────────────────────────────────

export type TutorialStep =
  | "welcome"
  | "click-agents-sidebar"
  | "click-add-agent"
  | "fill-agent-name"
  | "fill-persona"
  | "click-next-step2"
  | "fill-goals-prompt"
  | "fill-system-prompt"
  | "click-next-step3"
  | "click-create-agent"
  | "click-agent-settings-btn"
  | "agent-settings-overview"
  | "completed"

export const TUTORIAL_STEPS: TutorialStep[] = [
  "welcome",
  "click-agents-sidebar",
  "click-add-agent",
  "fill-agent-name",
  "fill-persona",
  "click-next-step2",
  "fill-goals-prompt",
  "fill-system-prompt",
  "click-next-step3",
  "click-create-agent",
  "click-agent-settings-btn",
  "agent-settings-overview",
  "completed",
]

/** Which route a given step expects to be on */
export const STEP_ROUTE: Record<TutorialStep, string> = {
  "welcome": "/dashboard",
  "click-agents-sidebar": "/dashboard",
  "click-add-agent": "/dashboard/agents",
  "fill-agent-name": "/dashboard/agents",
  "fill-persona": "/dashboard/agents",
  "click-next-step2": "/dashboard/agents",
  "fill-goals-prompt": "/dashboard/agents",
  "fill-system-prompt": "/dashboard/agents",
  "click-next-step3": "/dashboard/agents",
  "click-create-agent": "/dashboard/agents",
  "click-agent-settings-btn": "/dashboard/agents",
  "agent-settings-overview": "/dashboard/agent-settings",
  "completed": "/dashboard",
}

export interface TutorialStepInfo {
  id: TutorialStep
  title: string
  description: string
  /** CSS selector for element to highlight (null = centered tooltip) */
  target: string | null
  /** Position of the tooltip relative to the target */
  position: "top" | "bottom" | "left" | "right" | "center"
}

export const STEP_INFO: Record<TutorialStep, TutorialStepInfo> = {
  "welcome": {
    id: "welcome",
    title: "Welcome to Smart Convo! 👋",
    description: "Let's set up your first AI agent in just a few steps. This tutorial will guide you through creating an agent and configuring its settings.",
    target: null,
    position: "center",
  },
  "click-agents-sidebar": {
    id: "click-agents-sidebar",
    title: "Go to Agents",
    description: "Click on 'Agents' in the sidebar to manage your AI agents.",
    target: ".sidebar-agents-link",
    position: "right",
  },
  "click-add-agent": {
    id: "click-add-agent",
    title: "Create Your First Agent",
    description: "Click the 'Add New Agent' button to open the agent creation wizard.",
    target: ".create-agent-button",
    position: "bottom",
  },
  "fill-agent-name": {
    id: "fill-agent-name",
    title: "Name Your Agent",
    description: "Give your agent a descriptive name — e.g. 'Customer Support' or 'Sales Assistant'.",
    target: ".agent-modal-input-name",
    position: "bottom",
  },
  "fill-persona": {
    id: "fill-persona",
    title: "Define the Persona",
    description: "Describe who your agent is — their personality, tone, and role. This shapes how they interact with callers.",
    target: "#persona",
    position: "top",
  },
  "click-next-step2": {
    id: "click-next-step2",
    title: "Continue to Goals",
    description: "Click 'Next' to proceed to the Goals & Instructions step.",
    target: ".agent-modal-next-btn",
    position: "top",
  },
  "fill-goals-prompt": {
    id: "fill-goals-prompt",
    title: "Set Goals",
    description: "Describe what your agent should accomplish — its purpose and objectives.",
    target: "#goals",
    position: "bottom",
  },
  "fill-system-prompt": {
    id: "fill-system-prompt",
    title: "Add System Prompt ⚡",
    description: "This is the most important field. Write detailed instructions that tell your agent exactly how to behave, respond, and handle every situation.",
    target: "#prompt",
    position: "top",
  },
  "click-next-step3": {
    id: "click-next-step3",
    title: "Final Step",
    description: "Click 'Next' to proceed to the final step where you'll create your agent.",
    target: ".agent-modal-next-btn",
    position: "top",
  },
  "click-create-agent": {
    id: "click-create-agent",
    title: "Create Your Agent",
    description: "You're all set! Click 'Create Agent' to finish and deploy your new AI agent.",
    target: ".agent-modal-finish-btn",
    position: "top",
  },
  "click-agent-settings-btn": {
    id: "click-agent-settings-btn",
    title: "Open Your Agent's Settings ⚙️",
    description: "Your agent was created! Click the settings gear on your new agent card to configure it.",
    target: ".tutorial-first-agent-settings",
    position: "top",
  },
  "agent-settings-overview": {
    id: "agent-settings-overview",
    title: "Agent Settings Tabs",
    description: "Here you can configure:\n• **Voiceprint** — Upload/train your agent's voice\n• **Voice Prompts** — Customize greeting & hold messages\n• **Agent Prompts** — Fine-tune AI instructions & guardrails\n• **Voice Settings** — Adjust speed, pitch, language\n• **Tools & Numbers** — Assign phone numbers & tools\n• **FAQ** — Add quick-answer knowledge\n• **Additional Settings** — Transfer rules, hours, etc.",
    target: null,
    position: "center",
  },
  "completed": {
    id: "completed",
    title: "Tutorial Complete! 🚀",
    description: "You're ready to go. Your agent is set up and configured. You can always re-watch this tutorial from Personal Settings.",
    target: null,
    position: "center",
  },
}

// ─── Checkpoint-based persistent state ──────────────────────────────────────
// Three checkpoints gate resumption:
//   "sidebar"  → user clicked Agents in sidebar
//   "agent"    → agent was successfully created (stores agentId)
//   "settings" → user clicked the settings gear on their agent

interface TutorialCheckpoints {
  sidebar?: boolean
  agent?: { agentId: string }
  settings?: boolean
}

interface TutorialPersistState {
  status: "in_progress" | "completed" | "skipped"
  welcomeShown?: boolean
  checkpoints: TutorialCheckpoints
}

const STATE_KEY = "smartconvo_tutorial_state"

function loadState(): TutorialPersistState {
  if (typeof window === "undefined") return { status: "in_progress", checkpoints: {} }
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return { status: "in_progress", checkpoints: {} }
    return JSON.parse(raw) as TutorialPersistState
  } catch {
    return { status: "in_progress", checkpoints: {} }
  }
}

function saveState(state: TutorialPersistState) {
  if (typeof window === "undefined") return
  localStorage.setItem(STATE_KEY, JSON.stringify(state))
}

function syncBackend(payload: object) {
  const token = Cookies.get("Token")
  if (!token) return
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/update_tutorial/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface TutorialContextValue {
  isActive: boolean
  currentStep: TutorialStep | null
  stepInfo: TutorialStepInfo | null
  stepIndex: number
  totalSteps: number
  nextStep: () => void
  jumpToStep: (step: TutorialStep) => void
  skipTutorial: () => void
  startTutorial: (fromStep?: TutorialStep) => void
  isCompleted: boolean
  createdAgentId: string | null
  /** Mark a checkpoint as done. "agent" requires agentId. */
  markCheckpoint: (name: keyof TutorialCheckpoints, data?: { agentId?: string }) => void
}

const TutorialContext = createContext<TutorialContextValue | null>(null)

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error("useTutorial must be used inside TutorialProvider")
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [createdAgentId, setCreatedAgentIdState] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  // ── Mount: checkpoint-based resume ──────────────────────────────────────
  useEffect(() => {
    const currentPath = window.location.pathname
    if (!currentPath.startsWith("/dashboard")) return
    if (!Cookies.get("Token")) return

    const state = loadState()
    if (state.status === "completed" || state.status === "skipped") return

    const { checkpoints } = state

    if (!checkpoints.sidebar) {
      // CHECKPOINT 1 not done: force sidebar click
      // Show welcome first if it hasn't been shown yet
      const step: TutorialStep = state.welcomeShown ? "click-agents-sidebar" : "welcome"
      setCurrentStep(step)
      setIsActive(true)
      if (currentPath !== "/dashboard") router.push("/dashboard")
    } else if (!checkpoints.agent) {
      // CHECKPOINT 2 not done: force create-agent flow from the beginning
      setCurrentStep("click-add-agent")
      setIsActive(true)
      if (!currentPath.startsWith("/dashboard/agents")) router.push("/dashboard/agents")
    } else {
      // Agent created — restore its ID
      setCreatedAgentIdState(checkpoints.agent.agentId)
      if (!checkpoints.settings) {
        // CHECKPOINT 3 not done: route to agents page, force settings gear click
        setCurrentStep("click-agent-settings-btn")
        setIsActive(true)
        if (!currentPath.startsWith("/dashboard/agents")) router.push("/dashboard/agents")
      } else {
        // All checkpoints done — show final overview/completed
        setCurrentStep("agent-settings-overview")
        setIsActive(true)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mark welcome as shown when that step is active
  useEffect(() => {
    if (currentStep === "welcome") {
      const state = loadState()
      if (!state.welcomeShown) {
        state.welcomeShown = true
        saveState(state)
      }
    }
  }, [currentStep])

  const stepIndex = useMemo(
    () => (currentStep ? TUTORIAL_STEPS.indexOf(currentStep) : -1),
    [currentStep]
  )

  const stepInfo = useMemo(
    () => (currentStep ? STEP_INFO[currentStep] : null),
    [currentStep]
  )

  const isCompleted = useMemo(() => {
    if (typeof window === "undefined") return false
    return loadState().status === "completed" || loadState().status === "skipped"
  }, [currentStep])

  // ── markCheckpoint ────────────────────────────────────────────────────────
  const markCheckpoint = useCallback(
    (name: keyof TutorialCheckpoints, data?: { agentId?: string }) => {
      const state = loadState()
      if (name === "agent" && data?.agentId) {
        state.checkpoints.agent = { agentId: data.agentId }
        setCreatedAgentIdState(data.agentId)
      } else {
        ;(state.checkpoints as Record<string, unknown>)[name] = true
      }
      saveState(state)
      syncBackend({ checkpoint: name, ...(data ?? {}) })
    },
    []
  )

  // ── nextStep ──────────────────────────────────────────────────────────────
  const nextStep = useCallback(() => {
    if (!currentStep) return
    const idx = TUTORIAL_STEPS.indexOf(currentStep)
    if (idx >= TUTORIAL_STEPS.length - 1) {
      setIsActive(false)
      setCurrentStep(null)
      const state = loadState()
      state.status = "completed"
      saveState(state)
      syncBackend({ status: "completed" })
      return
    }
    const next = TUTORIAL_STEPS[idx + 1]
    setCurrentStep(next)
    // Navigate to the correct page for the next step
    // agent-settings-overview navigation is handled by the caller (agents page)
    if (next !== "agent-settings-overview") {
      const targetRoute = STEP_ROUTE[next]
      if (targetRoute && !pathname.startsWith(targetRoute)) {
        router.push(targetRoute)
      }
    }
  }, [currentStep, pathname, router])

  // ── jumpToStep ────────────────────────────────────────────────────────────
  const jumpToStep = useCallback((step: TutorialStep) => {
    setCurrentStep(step)
    const targetRoute = STEP_ROUTE[step]
    if (step !== "agent-settings-overview" && targetRoute && !pathname.startsWith(targetRoute)) {
      router.push(targetRoute)
    }
  }, [pathname, router])

  // ── skipTutorial ──────────────────────────────────────────────────────────
  const skipTutorial = useCallback(() => {
    setIsActive(false)
    setCurrentStep(null)
    const state = loadState()
    state.status = "skipped"
    saveState(state)
    syncBackend({ status: "skipped" })
  }, [])

  // ── startTutorial (Watch Tutorial button) ─────────────────────────────────
  const startTutorial = useCallback((fromStep?: TutorialStep) => {
    if (!Cookies.get("Token")) return
    const step = fromStep ?? "welcome"
    // Full reset — clear checkpoints so the whole flow restarts
    saveState({ status: "in_progress", welcomeShown: true, checkpoints: {} })
    setCreatedAgentIdState(null)
    setCurrentStep(step)
    setIsActive(true)
    const targetRoute = STEP_ROUTE[step]
    if (targetRoute && !pathname.startsWith(targetRoute)) {
      router.push(targetRoute)
    }
  }, [pathname, router])

  const value: TutorialContextValue = useMemo(
    () => ({
      isActive,
      currentStep,
      stepInfo,
      stepIndex,
      totalSteps: TUTORIAL_STEPS.length,
      nextStep,
      jumpToStep,
      skipTutorial,
      startTutorial,
      isCompleted,
      createdAgentId,
      markCheckpoint,
    }),
    [isActive, currentStep, stepInfo, stepIndex, nextStep, jumpToStep, skipTutorial, startTutorial, isCompleted, createdAgentId, markCheckpoint]
  )

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  )
}
