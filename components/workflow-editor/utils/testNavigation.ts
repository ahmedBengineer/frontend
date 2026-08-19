export type WorkflowCanvasView = "main" | "detail";

export function getAutoFollowNodeId({
  viewMode,
  activeWorkflowId,
  currentWorkflowId,
  currentTaskId,
}: {
  viewMode: WorkflowCanvasView;
  activeWorkflowId: string | null;
  currentWorkflowId: string | null;
  currentTaskId: string | null;
}): string | null {
  if (!currentWorkflowId) return null;
  if (viewMode === "main") return `workflow:${currentWorkflowId}`;
  if (activeWorkflowId !== currentWorkflowId || !currentTaskId) return null;
  return `workflow:${currentWorkflowId}:task:${currentTaskId}`;
}
