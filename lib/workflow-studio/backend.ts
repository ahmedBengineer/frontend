import "server-only";

import type { NextRequest } from "next/server";

export class WorkflowStudioBackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function backendBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!value)
    throw new WorkflowStudioBackendError(
      "NEXT_PUBLIC_BASE_URL is not configured.",
      500,
    );
  return value.replace(/\/$/, "");
}

export function requestToken(request: NextRequest): string {
  const token = request.cookies.get("Token")?.value;
  if (!token)
    throw new WorkflowStudioBackendError("Authentication is required.", 401);
  return token;
}

export async function fetchFromBackend(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = requestToken(request);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Token ${token}`);
  headers.set("Accept", "application/json");
  return fetch(`${backendBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function sanitizeToolParameters(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([name, raw]) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
      const schema = raw as Record<string, unknown>;
      return [[
        name,
        {
          ...(typeof schema.type === "string" ? { type: schema.type } : {}),
          ...(typeof schema.description === "string"
            ? { description: schema.description }
            : {}),
          ...(typeof schema.required === "boolean"
            ? { required: schema.required }
            : {}),
          ...(Array.isArray(schema.enum)
            ? {
                enum: schema.enum.filter(
                  (item) =>
                    item === null ||
                    ["string", "number", "boolean"].includes(typeof item),
                ),
              }
            : {}),
        },
      ]];
    }),
  );
}

export function sanitizeWorkflowAgentSummary(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = Number(raw.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return {
    id,
    name:
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : `Agent ${id}`,
    agent_type: typeof raw.agent_type === "string" ? raw.agent_type : "",
    twilio_phone_numbers: stringArray(raw.twilio_phone_numbers),
  };
}

export function sanitizeWorkflowAgent(value: unknown) {
  const summary = sanitizeWorkflowAgentSummary(value);
  if (!summary) return null;
  const raw = value as Record<string, unknown>;
  const customFeatures = Array.isArray(raw.custom_features)
    ? raw.custom_features.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const feature = item as Record<string, unknown>;
        const name =
          typeof feature.name === "string" ? feature.name.trim() : "";
        if (!name) return [];
        const parameters = sanitizeToolParameters(
          feature.parameters ?? feature.request_parameters,
        );
        return [
          {
            id:
              typeof feature.id === "number" || typeof feature.id === "string"
                ? feature.id
                : undefined,
            name,
            description:
              typeof feature.description === "string"
                ? feature.description
                : undefined,
            ...(Object.keys(parameters).length ? { parameters } : {}),
          },
        ];
      })
    : [];

  return {
    ...summary,
    json_object:
      raw.json_object && typeof raw.json_object === "object"
        ? raw.json_object
        : {},
    custom_features: customFeatures,
    include_default_tools: raw.include_default_tools === true,
    default_tool_names: stringArray(raw.default_tool_names),
  };
}

export function backendErrorStatus(response: Response): number {
  if (response.status === 401 || response.status === 403) return 401;
  if (response.status === 404) return 404;
  return 502;
}
