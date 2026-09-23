import { NextRequest, NextResponse } from "next/server";
import { getWorkflowTestDispatchConfiguration } from "@/lib/workflow-test/serverEnv";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!request.cookies.get("Token")?.value) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  const { defaultDispatchName, allowedDispatchNames } =
    getWorkflowTestDispatchConfiguration();
  return NextResponse.json(
    {
      dispatchName: defaultDispatchName,
      dispatchNames: allowedDispatchNames,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
