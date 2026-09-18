import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 5000;

function getTargetUrl() {
  const raw =
    process.env.HEALTHCHECK_TARGET_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";

  return raw.replace(/\/+$/, "");
}

async function probeUrl(url: string) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown probe error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const targetUrl = getTargetUrl();

  if (!targetUrl) {
    return NextResponse.json(
      {
        status: "degraded",
        service: "frontend",
        timestamp: new Date().toISOString(),
        checks: {
          upstreamApi: {
            ok: false,
            error:
              "No target configured. Set HEALTHCHECK_TARGET_URL or NEXT_PUBLIC_BASE_URL.",
          },
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  }

  const upstreamApi = await probeUrl(targetUrl);
  const overallOk = upstreamApi.ok;

  return NextResponse.json(
    {
      status: overallOk ? "ok" : "degraded",
      service: "frontend",
      timestamp: new Date().toISOString(),
      checks: {
        upstreamApi: {
          target: targetUrl,
          ...upstreamApi,
        },
      },
    },
    {
      status: overallOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
}
