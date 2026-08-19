import { Activity, Radio, TriangleAlert } from "lucide-react";
import type { WorkflowExecutionState } from "@/lib/workflow-test/contracts";

export function ExecutionTimeline({
  state,
}: {
  state: WorkflowExecutionState;
}) {
  if (!state.telemetrySeen)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500">
        <span className="rounded-full bg-cyan-50 p-3 text-cyan-600 dark:bg-cyan-950/40">
          <Radio className="h-5 w-5" />
        </span>
        Waiting for workflow telemetry.
        <small className="text-xs text-slate-400">
          The audio call continues independently.
        </small>
      </div>
    );
  return (
    <div className="h-full overflow-y-auto p-3" aria-live="polite">
      {state.gapDetected && (
        <div className="mb-3 flex gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <TriangleAlert className="h-4 w-4 shrink-0" />A sequence gap was
          observed. Missing state was not inferred.
        </div>
      )}
      {!state.events.length && (
        <div className="flex gap-2 rounded-lg bg-cyan-50 p-2 text-xs text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
          <Activity className="h-4 w-4" />
          Current position restored from the participant snapshot.
        </div>
      )}
      <div className="space-y-2">
        {[...state.events].reverse().map((event) => (
          <article
            key={`${event.session_id}:${event.seq}`}
            className="grid grid-cols-[auto_1fr] gap-2 rounded-xl border p-3 dark:border-slate-800"
          >
            <span className="font-mono text-[10px] text-slate-400">
              #{event.seq}
            </span>
            <div className="min-w-0">
              <strong className="block text-xs">{event.type}</strong>
              <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                {[event.workflow_id, event.task_id, event.tool_name]
                  .filter(Boolean)
                  .join(" / ") || "router"}
              </p>
              {event.state_fields && event.state_fields.length > 0 && (
                <p className="mt-1 font-mono text-[10px] text-violet-600">
                  {event.state_fields.join(", ")}
                </p>
              )}
              <div className="mt-1 flex justify-between text-[9px] text-slate-400">
                <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
                <span className="uppercase">{event.status || "event"}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
