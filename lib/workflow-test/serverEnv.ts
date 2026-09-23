export interface WorkflowTestServerEnvironment {
  livekitUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
  backendApiBaseUrl: string;
  defaultDispatchName: string;
  allowedDispatchNames: string[];
}

export interface WorkflowTestDispatchConfiguration {
  defaultDispatchName: string;
  allowedDispatchNames: string[];
}

export const DEFAULT_WORKFLOW_DISPATCH_NAME = "pentagonai-hostinger";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getWorkflowTestDispatchConfiguration(): WorkflowTestDispatchConfiguration {
  const defaultDispatchName =
    process.env.LIVEKIT_AGENT_DISPATCH?.trim() ||
    process.env.AGENT_NAME?.trim() ||
    DEFAULT_WORKFLOW_DISPATCH_NAME;
  const allowedDispatchNames = (process.env.LIVEKIT_ALLOWED_AGENT_NAMES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!allowedDispatchNames.includes(defaultDispatchName))
    allowedDispatchNames.unshift(defaultDispatchName);
  return { defaultDispatchName, allowedDispatchNames };
}

export function getWorkflowTestServerEnvironment(): WorkflowTestServerEnvironment {
  const dispatch = getWorkflowTestDispatchConfiguration();
  return {
    livekitUrl: required("LIVEKIT_URL"),
    livekitApiKey: required("LIVEKIT_API_KEY"),
    livekitApiSecret: required("LIVEKIT_API_SECRET"),
    backendApiBaseUrl: required("NEXT_PUBLIC_BASE_URL").replace(/\/$/, ""),
    ...dispatch,
  };
}
