import { atom, map } from "nanostores";
import type { Workspace } from "@/firebase/db/types";

// Store for the list of workspaces
export const $workspaces = atom<(Workspace & { id: string })[]>([]);

// Store for the currently selected workspace
export const $activeWorkspace = atom<(Workspace & { id: string }) | null>(null);

// Store for loading state
export const $workspacesState = map({
  isLoading: false,
  isInitialized: false,
  error: null as string | null,
});

// Fetch workspaces from the API
export async function fetchWorkspaces() {
  try {
    $workspacesState.setKey("isLoading", true);
    $workspacesState.setKey("error", null);

    const response = await fetch("/api/workspaces");

    if (!response.ok) {
      throw new Error(`Failed to fetch workspaces: ${response.status}`);
    }

    const data = await response.json();
    const workspaces = data.workspaces || [];

    $workspaces.set(workspaces);

    // Set the first workspace as active if available and no active workspace
    if (workspaces.length > 0 && !$activeWorkspace.get()) {
      setActiveWorkspace(workspaces[0]);
    }

    $workspacesState.setKey("isInitialized", true);
    return workspaces;
  } catch (err) {
    console.error("Error fetching workspaces:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to load workspaces";
    $workspacesState.setKey("error", errorMessage);
    throw err;
  } finally {
    $workspacesState.setKey("isLoading", false);
  }
}

// Set the active workspace
export function setActiveWorkspace(
  workspace: (Workspace & { id: string }) | null
) {
  $activeWorkspace.set(workspace);
}

// Create a new workspace
export async function createWorkspace(name: string) {
  try {
    $workspacesState.setKey("isLoading", true);

    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create workspace: ${response.status}`);
    }

    const newWorkspace = await response.json();

    // Update the workspaces list
    const currentWorkspaces = $workspaces.get();
    $workspaces.set([...currentWorkspaces, newWorkspace]);

    // Set as active workspace
    setActiveWorkspace(newWorkspace);

    return newWorkspace;
  } catch (err) {
    console.error("Error creating workspace:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to create workspace";
    $workspacesState.setKey("error", errorMessage);
    throw err;
  } finally {
    $workspacesState.setKey("isLoading", false);
  }
}

// Update a workspace
export async function updateWorkspace(id: string, name: string) {
  try {
    $workspacesState.setKey("isLoading", true);

    const response = await fetch(`/api/workspaces/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update workspace: ${response.status}`);
    }

    const updatedWorkspace = await response.json();

    // Update the workspaces list
    const currentWorkspaces = $workspaces.get();
    $workspaces.set(
      currentWorkspaces.map((workspace) =>
        workspace.id === id ? { ...workspace, name } : workspace
      )
    );

    // Update active workspace if it's the one being edited
    const activeWorkspace = $activeWorkspace.get();
    if (activeWorkspace && activeWorkspace.id === id) {
      setActiveWorkspace({ ...activeWorkspace, name });
    }

    return updatedWorkspace;
  } catch (err) {
    console.error("Error updating workspace:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to update workspace";
    $workspacesState.setKey("error", errorMessage);
    throw err;
  } finally {
    $workspacesState.setKey("isLoading", false);
  }
}

// Delete a workspace
export async function deleteWorkspace(id: string) {
  try {
    $workspacesState.setKey("isLoading", true);

    const response = await fetch(`/api/workspaces/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete workspace: ${response.status}`);
    }

    // Update the workspaces list
    const currentWorkspaces = $workspaces.get();
    const updatedWorkspaces = currentWorkspaces.filter(
      (workspace) => workspace.id !== id
    );
    $workspaces.set(updatedWorkspaces);

    // If the active workspace was deleted, set a new active workspace
    const activeWorkspace = $activeWorkspace.get();
    if (activeWorkspace && activeWorkspace.id === id) {
      setActiveWorkspace(
        updatedWorkspaces.length > 0 ? updatedWorkspaces[0] : null
      );
    }

    return true;
  } catch (err) {
    console.error("Error deleting workspace:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to delete workspace";
    $workspacesState.setKey("error", errorMessage);
    throw err;
  } finally {
    $workspacesState.setKey("isLoading", false);
  }
}
