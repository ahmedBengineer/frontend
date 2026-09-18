"use client"

import { useCallback, useState } from "react"
import type { SelectedEntity } from "../types"

export interface UseWorkflowEditorReturn {
  selectedEntity: SelectedEntity | null
  activeWorkflowId: string | null
  searchQuery: string
  setSelectedEntity: (entity: SelectedEntity | null) => void
  openWorkflow: (workflowId: string) => void
  closeWorkflow: () => void
  setSearchQuery: (q: string) => void
}

export function useWorkflowEditor(): UseWorkflowEditorReturn {
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const openWorkflow = useCallback((workflowId: string) => {
    setActiveWorkflowId(workflowId)
    setSelectedEntity(null)
  }, [])

  const closeWorkflow = useCallback(() => {
    setActiveWorkflowId(null)
    setSelectedEntity(null)
  }, [])

  return {
    selectedEntity,
    activeWorkflowId,
    searchQuery,
    setSelectedEntity,
    openWorkflow,
    closeWorkflow,
    setSearchQuery,
  }
}
