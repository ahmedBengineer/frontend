"use client";

import {
  StartAudio,
  useConnectionState,
  useLocalParticipant,
  useRoomInfo,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import {
  Bot,
  Clock3,
  Headphones,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura";
import { ExecutionTimeline } from "./ExecutionTimeline";
import { Transcript } from "./Transcript";
import { ToolCallHistory } from "./ToolCallHistory";
import type {
  ConnectionDetails,
  WorkflowExecutionState,
} from "@/lib/workflow-test/contracts";

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function ConnectedCallPanel({
  details,
  execution,
  onEnd,
}: {
  details: ConnectionDetails;
  execution: WorkflowExecutionState;
  onEnd: () => void;
}) {
  const voiceAssistant = useVoiceAssistant();
  const connectionState = useConnectionState();
  const { name: roomName } = useRoomInfo();
  const { localParticipant } = useLocalParticipant();
  const [tab, setTab] = useState<"conversation" | "execution" | "tools">(
    "conversation",
  );
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const enabledMic = useRef(false);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected || enabledMic.current)
      return;
    enabledMic.current = true;
    localParticipant.setMicrophoneEnabled(true).catch(() => {
      enabledMic.current = false;
      setMicError("Microphone access was denied. Allow it and try again.");
    });
  }, [connectionState, localParticipant]);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    const timer = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [connectionState]);

  const currentPath = useMemo(
    () =>
      [execution.currentWorkflowId, execution.currentTaskId]
        .filter(Boolean)
        .join(" / ") || "Router",
    [execution.currentTaskId, execution.currentWorkflowId],
  );
  const microphoneEnabled = localParticipant.isMicrophoneEnabled;

  async function toggleMicrophone() {
    setMicError(null);
    try {
      await localParticipant.setMicrophoneEnabled(
        !localParticipant.isMicrophoneEnabled,
      );
    } catch {
      setMicError("The microphone could not be changed.");
    }
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b p-4 dark:border-slate-800">
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-4 text-white dark:bg-slate-900">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.12),transparent_58%)]" />
          <div className="relative flex h-28 items-center justify-center">
            <AgentAudioVisualizerAura
              state={voiceAssistant.state}
              audioTrack={voiceAssistant.audioTrack}
              size="md"
              color="#22D3EE"
              colorShift={0.08}
              themeMode="dark"
              aria-label={`Agent is ${voiceAssistant.state || "connected"}`}
            />
          </div>
          <div className="relative mt-2 flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              <Bot className="h-3.5 w-3.5" />
              {voiceAssistant.agent?.identity || "Waiting for agent"}
            </span>
            <span className="flex items-center gap-2">
              <i
                className={`h-2 w-2 rounded-full ${connectionState === ConnectionState.Connected ? "bg-emerald-400" : "bg-amber-400"}`}
              />
              <strong className="capitalize text-cyan-300">
                {voiceAssistant.state || connectionState}
              </strong>
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          <span
            className="flex items-center gap-1 truncate"
            title={roomName || details.roomName}
          >
            <Radio className="h-3 w-3" />
            {roomName || details.roomName}
          </span>
          <span className="flex items-center justify-end gap-1">
            <Clock3 className="h-3 w-3" />
            {formatDuration(seconds)}
          </span>
        </div>
        <div className="mt-3 rounded-lg border px-3 py-2 dark:border-slate-700">
          <span className="block text-[9px] uppercase tracking-wide text-slate-400">
            Current position
          </span>
          <strong className="mt-0.5 block truncate font-mono text-xs">
            {currentPath}
          </strong>
        </div>
      </div>
      <nav
        className="grid grid-cols-3 border-b dark:border-slate-800"
        role="tablist"
        aria-label="Call information"
      >
        {(["conversation", "execution", "tools"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`border-b-2 px-3 py-3 text-xs font-semibold capitalize ${tab === value ? "border-cyan-500 text-cyan-600" : "border-transparent text-slate-400"}`}
          >
            {value}
            {value === "execution" && execution.events.length
              ? ` (${execution.events.length})`
              : ""}
            {value === "tools" && execution.toolCalls.length
              ? ` (${execution.toolCalls.length})`
              : ""}
          </button>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "conversation" ? (
          <Transcript agentAudioTrack={voiceAssistant.audioTrack} />
        ) : tab === "execution" ? (
          <ExecutionTimeline state={execution} />
        ) : (
          <ToolCallHistory state={execution} />
        )}
      </div>
      <div className="space-y-3 border-t p-4 dark:border-slate-800">
        <StartAudio label="Enable agent audio" />
        {micError && (
          <p className="text-xs text-red-600" role="alert">
            {micError}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={toggleMicrophone}
          >
            {microphoneEnabled ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
            {microphoneEnabled ? "Mic on" : "Mic off"}
          </Button>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Headphones className="h-3.5 w-3.5" />
            Audio
          </span>
        </div>
        <Button variant="destructive" className="w-full gap-2" onClick={onEnd}>
          <PhoneOff className="h-4 w-4" />
          End the call
        </Button>
      </div>
    </aside>
  );
}
