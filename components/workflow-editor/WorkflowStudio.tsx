"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  GitBranch,
  Loader2,
  Moon,
  RefreshCw,
  Save,
  Search,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import { createExecutionState } from "@/lib/workflow-test/telemetry";
import type { WorkflowExecutionState } from "@/lib/workflow-test/contracts";
import { WorkflowTestPanel } from "@/components/workflow-test/WorkflowTestPanel";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { LinearWorkflowCanvas } from "./LinearWorkflowCanvas";
import { useAgentDefinition } from "./hooks/useAgentDefinition";
import { useWorkflowAgents } from "./hooks/useWorkflowAgents";
import { validateWorkflowDefinition } from "./utils/validation";
import {
  createLinearWorkflowDefinition,
  createSupervisorWorkflowDefinition,
} from "@/lib/workflow-studio/starterDefinition";

function AgentPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number) => void;
}) {
  const { workflowAgents, isLoading, error, reload } = useWorkflowAgents();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = workflowAgents.find((agent) => agent.id === value);
  const normalized = query.toLowerCase().trim();
  const filtered = workflowAgents.filter(
    (agent) =>
      !normalized ||
      agent.name.toLowerCase().includes(normalized) ||
      String(agent.id).includes(normalized) ||
      agent.twilio_phone_numbers.some((number) => number.includes(normalized)),
  );

  return (
    <div className="relative z-[1001] min-w-[260px]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-full items-center gap-2 rounded-lg border bg-white px-3 text-left text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <GitBranch className="h-3.5 w-3.5 text-cyan-600" />
        <span className="min-w-0 flex-1 truncate">
          {isLoading
            ? "Loading workflow agents…"
            : selected
              ? `${selected.name} · Agent ${selected.id}`
              : "Choose workflow agent"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[300] mt-1 w-[360px] overflow-hidden rounded-xl border bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="border-b p-2 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, ID, or number"
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {error && (
              <div className="p-3 text-xs text-red-600">
                {error}
                <button
                  className="ml-2 underline"
                  onClick={() => void reload()}
                >
                  Retry
                </button>
              </div>
            )}
            {!error && !filtered.length && (
              <p className="p-3 text-xs text-slate-400">
                No workflow agents found.
              </p>
            )}
            {filtered.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => {
                  onChange(agent.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <span className="block text-xs font-semibold">
                  {agent.name}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-400">
                  Agent {agent.id}
                  {agent.twilio_phone_numbers.length
                    ? ` · ${agent.twilio_phone_numbers.join(", ")}`
                    : " · no assigned number"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkflowStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = Number(searchParams.get("agentId"));
  const selectedAgentId =
    Number.isInteger(queryId) && queryId > 0 ? queryId : null;
  const { workflowAgents } = useWorkflowAgents();
  const { theme, toggleTheme, mounted } = useTheme();
  const [mode, setMode] = useState<"edit" | "test">("edit");
  const [execution, setExecution] = useState<WorkflowExecutionState>(() =>
    createExecutionState(),
  );
  const [autoFollow, setAutoFollow] = useState(true);
  const agent = useAgentDefinition(selectedAgentId);
  const architecture =
    agent.jsonObject.schema_version === 2 &&
    agent.jsonObject.architecture === "linear"
      ? "linear"
      : "supervisor";
  const validation = useMemo(
    () =>
      validateWorkflowDefinition(
        agent.jsonObject,
        agent.availableTools.map((tool) => tool.name),
      ),
    [agent.availableTools, agent.jsonObject],
  );

  useEffect(() => {
    if (!selectedAgentId && workflowAgents[0])
      router.replace(
        `/dashboard/workflow-studio?agentId=${workflowAgents[0].id}`,
      );
  }, [router, selectedAgentId, workflowAgents]);

  useEffect(() => {
    const preventClose = (event: BeforeUnloadEvent) => {
      if (!agent.isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventClose);
    return () => window.removeEventListener("beforeunload", preventClose);
  }, [agent.isDirty]);

  const selectAgent = useCallback(
    (id: number) => {
      if (agent.isDirty && !window.confirm("Discard unsaved workflow changes?"))
        return;
      setMode("edit");
      setExecution(createExecutionState());
      router.push(`/dashboard/workflow-studio?agentId=${id}`);
    },
    [agent.isDirty, router],
  );

  const handleExecution = useCallback(
    (state: WorkflowExecutionState) => setExecution(state),
    [],
  );
  const canSave = agent.isDirty && !agent.isSaving;
  const canTest = Boolean(
    agent.definition && validation.isValid && !agent.isDirty && !agent.isSaving,
  );
  const disabledReason = !validation.isValid
    ? validation.errors[0]?.message
    : agent.isDirty
      ? "Save your changes before starting a test call."
      : undefined;

  if (!selectedAgentId || agent.isLoading) {
    return (
      <div className="flex h-full min-h-[620px] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (agent.loadError || !agent.definition) {
    return (
      <div className="flex h-full min-h-[620px] items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <h2 className="mt-3 font-semibold">Could not load workflow agent</h2>
          <p className="mt-2 text-sm text-slate-500">{agent.loadError}</p>
          <Button className="mt-4" onClick={() => void agent.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (agent.agentType !== "workflow") {
    return (
      <div className="flex h-full min-h-[620px] items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
          <h2 className="mt-3 font-semibold">
            {agent.agentName} is not workflow based
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            This Studio only supports agents whose agent_type is workflow.
          </p>
          <div className="mt-4">
            <AgentPicker value={selectedAgentId} onChange={selectAgent} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[620px] flex-col overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="relative z-[1000] flex min-h-14 flex-wrap items-center gap-2 overflow-visible border-b bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
        <AgentPicker value={selectedAgentId} onChange={selectAgent} />
        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
          {(["edit", "test"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold capitalize ${mode === value ? "bg-white shadow-sm dark:bg-slate-800" : "text-slate-500"}`}
            >
              {value}
            </button>
          ))}
        </div>
        {mode === "edit" && (
          <label className="flex items-center gap-2 rounded-lg border bg-white px-2 py-1 text-[10px] dark:border-slate-700 dark:bg-slate-900">
            Architecture
            <select
              aria-label="Workflow architecture"
              value={architecture}
              onChange={(event) => {
                const next = event.target.value as "supervisor" | "linear";
                if (next === architecture) return;
                if (
                  !window.confirm(
                    `Switch to ${next} architecture? This resets architecture-specific flows and keeps Global Instructions.`,
                  )
                )
                  return;
                const replacement =
                  next === "linear"
                    ? createLinearWorkflowDefinition()
                    : createSupervisorWorkflowDefinition();
                replacement.task_defaults = {
                  ...replacement.task_defaults,
                  instructions: [
                    ...(agent.jsonObject.task_defaults?.instructions ?? []),
                  ],
                };
                agent.replaceJsonObject(replacement);
              }}
              className="rounded border-0 bg-transparent font-semibold capitalize outline-none"
            >
              <option value="supervisor">Supervisor</option>
              <option value="linear">Linear</option>
            </select>
          </label>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`hidden items-center gap-1 text-[10px] sm:flex ${validation.isValid ? "text-emerald-600" : "text-red-600"}`}
          >
            {validation.isValid ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {validation.isValid
              ? "Valid workflow"
              : `${validation.errors.length} errors`}
          </span>
          {mode === "test" && (
            <label className="hidden items-center gap-1.5 text-[10px] text-slate-500 md:flex">
              <input
                type="checkbox"
                checked={autoFollow}
                onChange={(event) => setAutoFollow(event.target.checked)}
              />
              Auto-follow
            </label>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={toggleTheme}
            title="Toggle theme"
            disabled={!mounted}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => void agent.reload()}
            title="Reload"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {mode === "edit" && (
            <Button
              size="sm"
              variant={validation.isValid ? "default" : "outline"}
              className="h-8 gap-1.5"
              disabled={!canSave}
              onClick={() => void agent.save("PATCH")}
              title={validation.isValid ? "Save workflow" : "Save draft with validation errors"}
            >
              <Save className="h-3.5 w-3.5" />
              {validation.isValid ? "Save" : "Save draft"}
            </Button>
          )}
        </div>
      </header>

      {(agent.saveError || validation.errors.length > 0) && mode === "edit" && (
        <div className="flex flex-wrap items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="h-4 w-4" />
          <span className="min-w-0 flex-1 truncate">
            {agent.saveError ||
              validation.errors
                .map(
                  (item) =>
                    `${item.context ? `${item.context}: ` : ""}${item.message}`,
                )
                .join(" · ")}
          </span>
          {agent.hasConflict && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => void agent.reload()}
              >
                Reload server version
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7"
                onClick={() => void agent.save("PATCH", true)}
              >
                Overwrite
              </Button>
            </>
          )}
        </div>
      )}

      <div
        className={`relative z-0 min-h-0 flex-1 ${mode === "test" ? "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px]" : "block"}`}
      >
        <div className="min-h-0 h-full">
          <ReactFlowProvider>
            {architecture === "linear" ? (
              <LinearWorkflowCanvas
                key={`${agent.definition.id}:${mode}:linear`}
                jsonObject={agent.jsonObject}
                tools={agent.availableTools}
                onUpdate={agent.updateJsonObject}
                onReplaceJson={agent.replaceJsonObject}
                readOnly={mode === "test"}
                execution={execution}
                autoFollow={autoFollow}
                colorMode={theme}
              />
            ) : (
              <WorkflowCanvas
                key={`${agent.definition.id}:${mode}:supervisor`}
                agentId={agent.definition.id}
                jsonObject={agent.jsonObject}
                availableTools={agent.availableTools}
                includeDefaultTools={agent.definition.include_default_tools}
                defaultToolNames={agent.definition.default_tool_names}
                onDefaultToolsChange={agent.updateDefaultTools}
                agentName={agent.agentName}
                agentType={agent.agentType}
                isDirty={agent.isDirty}
                isSaving={agent.isSaving}
                saveSuccess={agent.saveSuccess}
                saveError={agent.saveError}
                onSave={(method) => {
                  if (validation.isValid) void agent.save(method);
                }}
                onReload={() => void agent.reload()}
                onUpdate={agent.updateJsonObject}
                onReplaceJson={agent.replaceJsonObject}
                onAgentTypeChange={() => undefined}
                validationErrorCount={validation.errors.length}
                readOnly={mode === "test"}
                execution={execution}
                autoFollow={autoFollow}
              />
            )}
          </ReactFlowProvider>
        </div>
        {mode === "test" && (
          <div className="min-h-[520px] xl:min-h-0">
            <WorkflowTestPanel
              definition={agent.definition}
              canStart={canTest}
              disabledReason={disabledReason}
              onExecution={handleExecution}
            />
          </div>
        )}
      </div>
    </div>
  );
}
