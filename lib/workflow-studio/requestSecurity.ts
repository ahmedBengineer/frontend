import "server-only";

import type { NextRequest } from "next/server";

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV === "test";
  try {
    const originUrl = new URL(origin);
    const forwardedHost =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const forwardedProto =
      request.headers.get("x-forwarded-proto") ??
      request.nextUrl.protocol.replace(":", "");
    return (
      Boolean(forwardedHost) &&
      originUrl.host === forwardedHost &&
      originUrl.protocol === `${forwardedProto}:`
    );
  } catch {
    return false;
  }
}
