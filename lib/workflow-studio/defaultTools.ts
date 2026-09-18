export const DEFAULT_ROUTER_TOOLS = [
  "send_sms",
  "send_email",
  "end_call",
  "transfer_call",
] as const;

export type DefaultRouterTool = (typeof DEFAULT_ROUTER_TOOLS)[number];

export const DEFAULT_ROUTER_TOOL_DESCRIPTIONS: Record<
  DefaultRouterTool,
  string
> = {
  send_sms: "Send an SMS using the configured telephony provider.",
  send_email: "Send an email using the configured company mail settings.",
  end_call: "Gracefully say a farewell and end the call.",
  transfer_call: "Transfer the caller using the configured call routing.",
};

export function normalizeDefaultRouterTools(value: unknown): DefaultRouterTool[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(DEFAULT_ROUTER_TOOLS);
  return Array.from(
    new Set(
      value
        .map(String)
        .filter((name): name is DefaultRouterTool => allowed.has(name)),
    ),
  );
}
