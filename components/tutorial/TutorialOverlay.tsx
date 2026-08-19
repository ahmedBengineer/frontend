"use client"

import React, { useEffect, useState, useRef } from "react"
import { useTutorial, type TutorialStep } from "./TutorialProvider"
import { X, ChevronRight, Sparkles } from "lucide-react"

const PAD = 8 // padding around the highlighted element

// ─── Spotlight Overlay ────────────────────────────────────────────────────────
// Uses 4 separate panels around the target so the target itself is never
// covered, blurred, or blocked — it stays fully clickable.

export function TutorialOverlay() {
  const { isActive, currentStep, stepInfo, stepIndex, totalSteps, nextStep, skipTutorial } = useTutorial()
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const retryCount = useRef<number>(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Steps that auto-advance when user performs the action (no "Next" button)
  const actionSteps: TutorialStep[] = [
    "click-agents-sidebar",
    "click-add-agent",
    "click-next-step2",
    "click-next-step3",
    "click-create-agent",
    "click-agent-settings-btn",
  ]

  const isActionStep = currentStep && actionSteps.includes(currentStep)

  useEffect(() => {
    if (!isActive || !stepInfo) return

    retryCount.current = 0

    const positionTooltip = () => {
      if (!stepInfo.target) {
        setTargetRect(null)
        setTooltipPos(null)
        return
      }

      const el = document.querySelector(stepInfo.target)
      if (!el) {
        // For steps that require waiting for an API fetch (e.g. agents list),
        // use a slower 200ms retry interval for up to 30 retries (= 6 seconds).
        // For other steps use rAF retries (~500ms total).
        const isSlowRetryStep = stepInfo.target === ".tutorial-first-agent-settings"
        const maxRetries = isSlowRetryStep ? 30 : 30
        if (retryCount.current < maxRetries) {
          retryCount.current += 1
          if (isSlowRetryStep) {
            retryTimerRef.current = setTimeout(positionTooltip, 200)
          } else {
            rafRef.current = requestAnimationFrame(positionTooltip)
          }
        } else {
          setTargetRect(null)
          setTooltipPos(null)
        }
        return
      }
      retryCount.current = 0

      // Scroll the target into view so getBoundingClientRect reflects its actual viewport position
      ;(el as HTMLElement).scrollIntoView({ block: "nearest", behavior: "instant" } as ScrollIntoViewOptions)

      // Wait a frame for scroll/layout to settle before measuring
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)

        // We need tooltip dimensions — read after next paint
        requestAnimationFrame(() => {
          const tooltip = tooltipRef.current
          if (!tooltip) return
          const tRect = tooltip.getBoundingClientRect()
          const vw = window.innerWidth
          const vh = window.innerHeight

          // Spotlight bounds (with padding)
          const sx = rect.left - PAD
          const sy = rect.top - PAD
          const sr = rect.right + PAD
          const sb = rect.bottom + PAD

          let top = 0
          let left = 0

          switch (stepInfo.position) {
            case "bottom":
              top = sb + 12
              left = rect.left + rect.width / 2 - tRect.width / 2
              break
            case "top":
              top = sy - tRect.height - 12
              left = rect.left + rect.width / 2 - tRect.width / 2
              break
            case "right":
              top = rect.top + rect.height / 2 - tRect.height / 2
              left = sr + 12
              break
            case "left":
              top = rect.top + rect.height / 2 - tRect.height / 2
              left = sx - tRect.width - 12
              break
          }

          top = Math.max(8, Math.min(vh - tRect.height - 8, top))
          left = Math.max(8, Math.min(vw - tRect.width - 8, left))
          setTooltipPos({ top, left })
        })
      })
    }

    // Use a shorter delay for steps where the element is already in the DOM
    const delay = stepInfo.target === ".tutorial-first-agent-settings" ? 0 : 300
    const timer = setTimeout(positionTooltip, delay)

    const handleReposition = () => positionTooltip()
    window.addEventListener("scroll", handleReposition, true)
    window.addEventListener("resize", handleReposition)
    // When the agents list finishes loading, immediately re-run positioning
    window.addEventListener("tutorial:agents-loaded", handleReposition)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafRef.current)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      window.removeEventListener("scroll", handleReposition, true)
      window.removeEventListener("resize", handleReposition)
      window.removeEventListener("tutorial:agents-loaded", handleReposition)
    }
  }, [isActive, stepInfo, currentStep])

  if (!isActive || !currentStep || !stepInfo) return null

  const progress = ((stepIndex + 1) / totalSteps) * 100

  // Three states:
  // 1. Element found → 4-panel spotlight (blocks everything outside target)
  // 2. Has a target but element not yet found (retrying):
  //    - For steps that must block (settings gear), show full overlay immediately
  //    - For others, no blocking overlay so page stays interactive
  // 3. No target (info step) → full dark overlay, tooltip centered
  const isCentered = !stepInfo.target
  const isSearching = !!stepInfo.target && !targetRect
  // Steps that must block the page even while searching for the element
  const alwaysBlockSteps: TutorialStep[] = ["click-agent-settings-btn"]
  const blockWhileSearching = isSearching && alwaysBlockSteps.includes(currentStep)

  // Spotlight bounds
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080
  const sx = targetRect ? targetRect.left - PAD : 0
  const sy = targetRect ? targetRect.top - PAD : 0
  const sw = targetRect ? targetRect.width + PAD * 2 : 0
  const sh = targetRect ? targetRect.height + PAD * 2 : 0

  const overlayColor = "rgba(15, 23, 42, 0.72)"

  return (
    <>
      {/* Always-visible escape button — sits above everything, never blocked */}
      <button
        onClick={skipTutorial}
        className="fixed z-[10220] pointer-events-auto flex items-center gap-1.5 text-xs text-white/80 hover:text-white border border-white/20 hover:border-white/40 bg-slate-900/80 hover:bg-slate-900 rounded-lg px-3 py-1.5 transition-colors"
        style={{ bottom: 20, right: 20 }}
        title="End tutorial"
      >
        <X className="w-3 h-3" />
        End Tutorial
      </button>

      {/* ── Overlay / Spotlight ── */}
      {targetRect ? (
        /* State 1: Element found — 4-panel spotlight blocking everything outside */
        <>
          <div className="fixed z-[10200] pointer-events-auto" style={{ top: 0, left: 0, right: 0, height: sy, background: overlayColor }} />
          <div className="fixed z-[10200] pointer-events-auto" style={{ top: sy + sh, left: 0, right: 0, bottom: 0, background: overlayColor }} />
          <div className="fixed z-[10200] pointer-events-auto" style={{ top: sy, left: 0, width: sx, height: sh, background: overlayColor }} />
          <div className="fixed z-[10200] pointer-events-auto" style={{ top: sy, left: sx + sw, right: 0, height: sh, background: overlayColor }} />
          {/* Highlight ring — pointer-events-none so target stays clickable */}
          <div
            className="fixed z-[10201] pointer-events-none"
            style={{ top: sy, left: sx, width: sw, height: sh, borderRadius: 12, border: "2px solid rgba(16, 185, 129, 0.7)", boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.15)", transition: "all 0.25s ease" }}
          />
        </>
      ) : isCentered || blockWhileSearching ? (
        /* State 3 / blocking-search: full dark overlay */
        <div className="fixed inset-0 z-[10200] pointer-events-auto" style={{ background: overlayColor }} />
      ) : null /* State 2 non-blocking: no overlay, page stays interactive */ }

      {/* ── Tooltip ── */}
      <div
        ref={tooltipRef}
        className="fixed z-[10210] pointer-events-auto"
        style={
          targetRect && tooltipPos
            ? { top: tooltipPos.top, left: tooltipPos.left }
            : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden ${
            isCentered || isSearching ? "w-[420px]" : "w-[340px]"
          }`}
          style={{ animation: "tutorialFadeIn 0.25s ease-out" }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-slate-100">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Header */}
          <div className="px-5 pt-4 pb-2 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 leading-tight">{stepInfo.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Step {stepIndex + 1} of {totalSteps}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 pb-4">
            {isSearching && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3 border border-amber-200">
                Looking for the target element on this page…
              </p>
            )}
            <p className="text-sm text-slate-600 font-light leading-relaxed whitespace-pre-line">
              {stepInfo.description.split("\n").map((line, i, arr) => (
                <span key={i}>
                  {line.startsWith("• **")
                    ? <>• <strong className="font-medium text-slate-800">{line.slice(4, line.indexOf("**", 4))}</strong>{line.slice(line.indexOf("**", 4) + 2)}</>
                    : line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 flex items-center justify-between gap-2">
            <button
              onClick={skipTutorial}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <X className="w-3 h-3" />
              End Tutorial
            </button>

            {!isActionStep && (
              <button
                onClick={nextStep}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-all"
              >
                {currentStep === "completed" ? "Finish" : "Next"}
                <ChevronRight className="w-3 h-3" />
              </button>
            )}

            {isActionStep && !isSearching && (
              <span className="text-[10px] text-emerald-600 font-medium animate-pulse">
                👆 Perform this action to continue
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tutorialFadeIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
