"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AgentJsonObject, AgentTool, Workflow } from "./types";
import { addTask, addWorkflow, createTask } from "./utils/editorMutations";

type Kind = "collect" | "action" | "answer";

export function StudioActions({
  jsonObject,
  tools,
  onUpdate,
}: {
  jsonObject: AgentJsonObject;
  tools: AgentTool[];
  onUpdate: (updater: (current: AgentJsonObject) => AgentJsonObject) => void;
}) {
  const workflowIds = Object.keys(jsonObject.workflows ?? {});
  const stateFields = Object.keys(jsonObject.state?.fields ?? {});
  const [dialog, setDialog] = useState<"workflow" | "task" | null>(null);
  const [workflowId, setWorkflowId] = useState(workflowIds[0] ?? "");
  const [newWorkflowId, setNewWorkflowId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<Kind>("collect");
  const [stateField, setStateField] = useState(stateFields[0] ?? "");
  const [toolName, setToolName] = useState(tools[0]?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  const canCreate = useMemo(
    () => taskId.trim() && (kind === "collect" ? stateField : toolName),
    [kind, stateField, taskId, toolName],
  );

  function reset(type: "workflow" | "task") {
    setDialog(type);
    setError(null);
    setNewWorkflowId("");
    setTaskId("");
    setDescription("");
    setKind("collect");
    setWorkflowId(workflowIds[0] ?? "");
    setStateField(stateFields[0] ?? "");
    setToolName(tools[0]?.name ?? "");
  }

  function submit() {
    try {
      const task = createTask(kind, { description, stateField, toolName });
      if (dialog === "workflow") {
        const workflow: Workflow = {
          description,
          task_group: { [taskId.trim()]: task },
          task_order: [taskId.trim()],
          interruptible_by: [],
          resume_after_interrupt: false,
        };
        onUpdate((current) =>
          addWorkflow(current, newWorkflowId.trim(), workflow),
        );
      } else {
        onUpdate((current) =>
          addTask(current, workflowId, taskId.trim(), task),
        );
      }
      setDialog(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not create item",
      );
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 dark:border-slate-700 dark:bg-slate-900"
          onClick={() => reset("workflow")}
        >
          <Plus className="h-3.5 w-3.5" /> Workflow
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 dark:border-slate-700 dark:bg-slate-900"
          onClick={() => reset("task")}
          disabled={!workflowIds.length}
        >
          <Plus className="h-3.5 w-3.5" /> Task
        </Button>
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-lg dark:border-slate-700 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle>
              {dialog === "workflow" ? "Create workflow" : "Create task"}
            </DialogTitle>
            <DialogDescription>
              IDs are stable runtime identifiers and cannot be renamed after
              creation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {dialog === "workflow" ? (
              <div className="grid gap-1.5">
                <Label htmlFor="new-workflow-id">Workflow ID</Label>
                <Input
                  id="new-workflow-id"
                  value={newWorkflowId}
                  onChange={(event) => setNewWorkflowId(event.target.value)}
                  placeholder="create_appointment"
                />
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label htmlFor="target-workflow">Workflow</Label>
                <select
                  id="target-workflow"
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={workflowId}
                  onChange={(event) => setWorkflowId(event.target.value)}
                >
                  {workflowIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="new-task-id">First task ID</Label>
              <Input
                id="new-task-id"
                value={taskId}
                onChange={(event) => setTaskId(event.target.value)}
                placeholder="personal_details"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-description">Description</Label>
              <Input
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this task does"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-kind">Task kind</Label>
              <select
                id="task-kind"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={kind}
                onChange={(event) => setKind(event.target.value as Kind)}
              >
                <option value="collect">Collect</option>
                <option value="action">Action</option>
                <option value="answer">Answer</option>
              </select>
            </div>
            {kind === "collect" ? (
              <div className="grid gap-1.5">
                <Label htmlFor="state-field">State field</Label>
                <select
                  id="state-field"
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={stateField}
                  onChange={(event) => setStateField(event.target.value)}
                >
                  <option value="">Choose a state field</option>
                  {stateFields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
                {!stateFields.length && (
                  <p className="text-xs text-amber-600">
                    Create a state field from Variables first.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label htmlFor="task-tool">Tool</Label>
                <select
                  id="task-tool"
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={toolName}
                  onChange={(event) => setToolName(event.target.value)}
                >
                  <option value="">Choose an assigned tool</option>
                  {tools.map((tool) => (
                    <option key={tool.name} value={tool.name}>
                      {tool.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={
                !canCreate || (dialog === "workflow" && !newWorkflowId.trim())
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
