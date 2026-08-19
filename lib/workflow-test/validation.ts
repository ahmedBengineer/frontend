import type { CallInputs } from "./contracts";

const PHONE_PATTERN = /^\d{10,15}$/;
const DISPATCH_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const ATTRIBUTE_KEY_PATTERN = /^[A-Za-z0-9_.:-]{1,128}$/;
const MAX_ADDITIONAL_ATTRIBUTES = 20;
const MAX_ATTRIBUTE_VALUE_LENGTH = 1024;
const RESERVED_ATTRIBUTE_KEYS = new Set(["agent_number", "human_number"]);

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

export function normalizeDigits(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function validatePhoneNumber(value: unknown, label: string): string {
  const normalized = normalizeDigits(value);
  if (!PHONE_PATTERN.test(normalized))
    throw new InputValidationError(`${label} must contain 10 to 15 digits.`);
  return normalized;
}

export function validateAdditionalAttributes(
  value: unknown,
): Record<string, string> {
  if (value === undefined || value === null || value === "") return {};
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new InputValidationError(
        "Additional attributes must be a valid JSON object.",
      );
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new InputValidationError(
      "Additional attributes must be a JSON object.",
    );
  }
  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length > MAX_ADDITIONAL_ATTRIBUTES) {
    throw new InputValidationError(
      `Additional attributes cannot contain more than ${MAX_ADDITIONAL_ATTRIBUTES} entries.`,
    );
  }
  const attributes: Record<string, string> = {};
  for (const [key, item] of entries) {
    if (!ATTRIBUTE_KEY_PATTERN.test(key) || key.startsWith("lk.")) {
      throw new InputValidationError(
        `Additional attribute key "${key}" is not allowed.`,
      );
    }
    if (RESERVED_ATTRIBUTE_KEYS.has(key)) {
      throw new InputValidationError(
        `Additional attribute "${key}" is managed by the call form.`,
      );
    }
    if (typeof item !== "string") {
      throw new InputValidationError(
        `Additional attribute "${key}" must have a string value.`,
      );
    }
    if (item.length > MAX_ATTRIBUTE_VALUE_LENGTH) {
      throw new InputValidationError(
        `Additional attribute "${key}" is too long.`,
      );
    }
    attributes[key] = item;
  }
  return attributes;
}

export function validateCallInputs(
  value: unknown,
): CallInputs {
  if (!value || typeof value !== "object")
    throw new InputValidationError("Call details are required.");
  const raw = value as Record<string, unknown>;
  const agentId = Number(raw.agentId);
  if (!Number.isInteger(agentId) || agentId <= 0)
    throw new InputValidationError("A valid agent is required.");
  const dispatchName = String(raw.dispatchName ?? "").trim();
  if (!DISPATCH_PATTERN.test(dispatchName)) {
    throw new InputValidationError(
      "The dispatch agent name may contain only letters, numbers, hyphens, and underscores.",
    );
  }
  return {
    agentId,
    dispatchName,
    agentNumber: validatePhoneNumber(raw.agentNumber, "Agent number"),
    humanNumber: validatePhoneNumber(raw.humanNumber, "Human number"),
    additionalAttributes: validateAdditionalAttributes(
      raw.additionalAttributes,
    ),
  };
}
