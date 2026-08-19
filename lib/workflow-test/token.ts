import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol";
import {
  AccessToken,
  type AccessTokenOptions,
  type VideoGrant,
} from "livekit-server-sdk";
import type { CallInputs, ConnectionDetails } from "./contracts";
import type { WorkflowTestServerEnvironment } from "./serverEnv";

function compactId(value: string): string {
  return value.replace(/-/g, "").slice(0, 12);
}

export async function createWorkflowTestToken(
  inputs: CallInputs,
  environment: WorkflowTestServerEnvironment,
  randomId: () => string = () => crypto.randomUUID(),
): Promise<ConnectionDetails> {
  const roomName = `workflow-studio-${compactId(randomId())}`;
  const identity = `workflow-user-${compactId(randomId())}`;
  const options: AccessTokenOptions = {
    identity,
    name: "Workflow Studio tester",
    attributes: {
      ...(inputs.additionalAttributes ?? {}),
      agent_number: inputs.agentNumber,
      human_number: inputs.humanNumber,
    },
    ttl: "15m",
  };
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
  };
  const token = new AccessToken(
    environment.livekitApiKey,
    environment.livekitApiSecret,
    options,
  );
  token.addGrant(grant);
  // Generated protocol types are duplicated across the pinned SDK packages.
  // @ts-expect-error Equivalent generated RoomConfiguration types.
  token.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: inputs.dispatchName })],
  });
  return {
    serverUrl: environment.livekitUrl,
    roomName,
    identity,
    accessToken: await token.toJwt(),
  };
}
