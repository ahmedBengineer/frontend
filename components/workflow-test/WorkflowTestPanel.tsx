"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ChevronDown, Loader2, PhoneCall, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useWorkflowTelemetry } from "@/hooks/useWorkflowTelemetry";
import type {
  ConnectionDetails,
  WorkflowExecutionState,
} from "@/lib/workflow-test/contracts";
import { createExecutionState } from "@/lib/workflow-test/telemetry";
import {
  InputValidationError,
  normalizeDigits,
  validateAdditionalAttributes,
} from "@/lib/workflow-test/validation";
import { ConnectedCallPanel } from "./ConnectedCallPanel";

type TestableAgent = {
  id: number;
  twilio_phone_numbers: string[];
};

const ignoreExecution: (state: WorkflowExecutionState) => void = () =>
  undefined;

async function responseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(
      payload.error || `Request failed (HTTP ${response.status})`,
    );
  return payload;
}

function ConnectedSession({
  agentId,
  details,
  onEnd,
  onExecution,
}: {
  agentId: number;
  details: ConnectionDetails;
  onEnd: () => void;
  onExecution: (state: WorkflowExecutionState) => void;
}) {
  const voiceAssistant = useVoiceAssistant();
  const execution = useWorkflowTelemetry(agentId, voiceAssistant.agent);
  const hadAgent = React.useRef(false);
  useEffect(() => onExecution(execution), [execution, onExecution]);
  useEffect(() => {
    if (voiceAssistant.agent) {
      hadAgent.current = true;
      return;
    }
    if (hadAgent.current) onEnd();
  }, [onEnd, voiceAssistant.agent]);
  return (
    <>
      <ConnectedCallPanel
        details={details}
        execution={execution}
        onEnd={onEnd}
      />
      <RoomAudioRenderer />
    </>
  );
}

export function WorkflowTestPanel({
  definition,
  canStart,
  disabledReason,
  onExecution,
  title = "Start workflow call",
  onClose,
}: {
  definition: TestableAgent;
  canStart: boolean;
  disabledReason?: string;
  onExecution?: (state: WorkflowExecutionState) => void;
  title?: string;
  onClose?: () => void;
}) {
  const executionHandler = onExecution ?? ignoreExecution;
  const [dispatchNames, setDispatchNames] = useState<string[]>([]);
  const [dispatchName, setDispatchName] = useState("pentagonai-hostinger");
  const [agentNumber, setAgentNumber] = useState(
    definition.twilio_phone_numbers[0] ?? "",
  );
  const [humanNumber, setHumanNumber] = useState("03094836196");
  const [additionalAttributes, setAdditionalAttributes] = useState("{}");
  const [showAdditionalAttributes, setShowAdditionalAttributes] =
    useState(false);
  const [connection, setConnection] = useState<ConnectionDetails | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/workflow-test/config", { cache: "no-store" })
      .then((response) =>
        responseJson<{ dispatchName: string; dispatchNames: string[] }>(
          response,
        ),
      )
      .then((result) => {
        if (!active) return;
        setDispatchNames(result.dispatchNames);
        setDispatchName(result.dispatchName || "pentagonai-hostinger");
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "LiveKit is not configured",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setAgentNumber(definition.twilio_phone_numbers[0] ?? "");
    setConnection(null);
    setHumanNumber("03094836196");
    setAdditionalAttributes("{}");
    setShowAdditionalAttributes(false);
    executionHandler(createExecutionState());
  }, [definition.id, definition.twilio_phone_numbers, executionHandler]);

  const disconnect = useCallback(() => {
    setConnection(null);
    executionHandler(createExecutionState());
  }, [executionHandler]);

  async function startCall() {
    setStarting(true);
    setError(null);
    executionHandler(createExecutionState());
    try {
      const response = await fetch("/api/workflow-test/token", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: definition.id,
          agentNumber: normalizeDigits(agentNumber),
          humanNumber: normalizeDigits(humanNumber),
          additionalAttributes: validateAdditionalAttributes(
            additionalAttributes,
          ),
          dispatchName,
        }),
      });
      setConnection(await responseJson<ConnectionDetails>(response));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The call could not be started",
      );
    } finally {
      setStarting(false);
    }
  }

  if (connection) {
    return (
      <LiveKitRoom
        key={connection.roomName}
        serverUrl={connection.serverUrl}
        token={connection.accessToken}
        connect
        audio={false}
        video={false}
        onDisconnected={disconnect}
        onError={(reason) => setError(reason.message)}
      >
        <ConnectedSession
          agentId={definition.id}
          details={connection}
          onEnd={disconnect}
          onExecution={executionHandler}
        />
      </LiveKitRoom>
    );
  }

  let attributesError: string | null = null;
  try {
    validateAdditionalAttributes(additionalAttributes);
  } catch (reason) {
    attributesError =
      reason instanceof InputValidationError
        ? reason.message
        : "Additional attributes are invalid.";
  }
  const formValid =
    /^[A-Za-z0-9_-]{1,128}$/.test(dispatchName.trim()) &&
    /^\d{10,15}$/.test(normalizeDigits(agentNumber)) &&
    /^\d{10,15}$/.test(normalizeDigits(humanNumber)) &&
    !attributesError;
  return (
    <aside className="flex h-full min-h-0 flex-col border-l bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4 dark:border-slate-800">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-600">
            WebRTC test session
          </p>
          <h2 className="mt-1 text-lg font-semibold">{title}</h2>
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close test panel"
            onClick={onClose}
            className="-mr-2 -mt-1 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div className="grid gap-1.5">
          <Label htmlFor="dispatch-name">Agent dispatch</Label>
          <Input
            id="dispatch-name"
            value={dispatchName}
            onChange={(event) => setDispatchName(event.target.value)}
            list="dispatch-name-options"
            autoComplete="off"
            maxLength={128}
            placeholder="pentagonai-hostinger"
            className="font-mono"
          />
          <datalist id="dispatch-name-options">
            {dispatchNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <p className="text-[10px] text-slate-400">
            Defaults from the server environment and remains editable. Any
            valid LiveKit agent deployment name is accepted.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="agent-number">Agent number</Label>
          <select
            id="agent-number"
            value={agentNumber}
            onChange={(event) => setAgentNumber(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 font-mono text-sm"
          >
            {!definition.twilio_phone_numbers.length && (
              <option value="">No assigned number</option>
            )}
            {definition.twilio_phone_numbers.map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="human-number">Human number</Label>
          <Input
            id="human-number"
            inputMode="tel"
            autoComplete="off"
            value={humanNumber}
            onChange={(event) => setHumanNumber(event.target.value)}
            placeholder="10–15 digits"
            className="font-mono"
          />
          <p className="text-[10px] text-slate-400">
            Used only as a participant attribute; never persisted.
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border dark:border-slate-700">
          <button
            type="button"
            aria-expanded={showAdditionalAttributes}
            aria-controls="additional-attributes-panel"
            onClick={() =>
              setShowAdditionalAttributes((current) => !current)
            }
            className="flex w-full items-center justify-between gap-3 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Additional attributes
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showAdditionalAttributes && "rotate-180",
              )}
            />
          </button>
          {showAdditionalAttributes && (
            <div
              id="additional-attributes-panel"
              className="grid gap-1.5 border-t p-3 dark:border-slate-700"
            >
              <Label htmlFor="additional-attributes" className="sr-only">
                Additional attributes (JSON)
              </Label>
              <Textarea
                id="additional-attributes"
                value={additionalAttributes}
                onChange={(event) =>
                  setAdditionalAttributes(event.target.value)
                }
                placeholder={'{"customer_id":"123","language":"ur"}'}
                className="min-h-24 resize-y font-mono text-xs"
                spellCheck={false}
                aria-invalid={Boolean(attributesError)}
                aria-describedby="additional-attributes-help"
              />
              <p
                id="additional-attributes-help"
                className={cn(
                  "text-[10px]",
                  attributesError ? "text-red-600" : "text-slate-400",
                )}
              >
                {attributesError ||
                  "Optional string attributes sent to the call participant."}
              </p>
            </div>
          )}
        </div>
        {!canStart && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {disabledReason || "Save a valid workflow before testing."}
          </p>
        )}
        {error && (
          <p
            className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
      <div className="border-t p-5 dark:border-slate-800">
        <Button
          className="h-11 w-full gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400"
          disabled={!canStart || !formValid || starting}
          onClick={startCall}
        >
          {starting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PhoneCall className="h-4 w-4" />
          )}
          {starting ? "Connecting…" : "Start test call"}
        </Button>
      </div>
    </aside>
  );
}
