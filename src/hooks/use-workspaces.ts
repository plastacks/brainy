import React from "react";
import { useStore } from "@nanostores/react";
import {
  $workspaces,
  $activeWorkspace,
  $workspacesState,
  fetchWorkspaces,
  setActiveWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "@/stores";

export function useWorkspaces() {
  const workspaces = useStore($workspaces);
  const activeWorkspace = useStore($activeWorkspace);
  const { isLoading, error, isInitialized } = useStore($workspacesState);

  return {
    workspaces,
    activeWorkspace,
    isLoading,
    isInitialized,
    error,
    fetchWorkspaces,
    setActiveWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  };
}
