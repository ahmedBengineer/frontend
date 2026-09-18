export type WorkflowCanvasView = "main" | "detail";

export function getAutoFollowView({
  currentWorkflowId,
  availableWorkflowIds,
  routerActive,
}: {
  currentWorkflowId: string | null;
  availableWorkflowIds: string[];
  routerActive: boolean;
}): { viewMode: WorkflowCanvasView; activeWorkflowId: string | null } | null {
  if (currentWorkflowId && availableWorkflowIds.includes(currentWorkflowId)) {
    return { viewMode: "detail", activeWorkflowId: currentWorkflowId };
  }
  if (!currentWorkflowId && routerActive) {
    return { viewMode: "main", activeWorkflowId: null };
  }
  return null;
}

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
