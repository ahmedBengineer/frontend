import {
  useDataChannel,
  useParticipantAttributes,
} from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { useCallback, useEffect, useState } from "react";

import {
  WORKFLOW_EXECUTION_TOPIC,
  WORKFLOW_SNAPSHOT_ATTRIBUTE,
  type AgentId,
  type WorkflowExecutionState,
} from "@/lib/workflow-test/contracts";
import {
  applyTelemetryEvent,
  applyWorkflowSnapshot,
  createExecutionState,
  parseTelemetryEvent,
  parseWorkflowSnapshot,
} from "@/lib/workflow-test/telemetry";

export function useWorkflowTelemetry(
  agentId: AgentId,
  agentParticipant?: Participant,
): WorkflowExecutionState {
  const [state, setState] =
    useState<WorkflowExecutionState>(createExecutionState);
  const { attributes } = useParticipantAttributes({
    participant: agentParticipant,
  });

  const onMessage = useCallback(
    (message: { payload: Uint8Array; from?: Participant }) => {
      if (message.from && !message.from.isAgent) return;
      const event = parseTelemetryEvent(message.payload, agentId);
      if (event) setState((current) => applyTelemetryEvent(current, event));
    },
    [agentId],
  );
  useDataChannel(WORKFLOW_EXECUTION_TOPIC, onMessage);

  const snapshotValue = attributes?.[WORKFLOW_SNAPSHOT_ATTRIBUTE];
  useEffect(() => {
    if (!snapshotValue) return;
    const snapshot = parseWorkflowSnapshot(snapshotValue, agentId);
    if (snapshot)
      setState((current) => applyWorkflowSnapshot(current, snapshot));
  }, [agentId, snapshotValue]);

  return state;
}
