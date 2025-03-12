"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  Plus,
  Loader2,
  Edit3,
  Trash2,
  Check,
} from "lucide-react";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const {
    workspaces,
    activeWorkspace,
    isLoading,
    error,
    fetchWorkspaces,
    setActiveWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspaces();

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [workspaceName, setWorkspaceName] = React.useState("");

  // Reset workspace name when dialogs open
  React.useEffect(() => {
    if (isCreateOpen) {
      setWorkspaceName("");
    } else if (isRenameOpen && activeWorkspace) {
      setWorkspaceName(activeWorkspace.name);
    }
  }, [isCreateOpen, isRenameOpen, activeWorkspace]);

  // Create a new workspace
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaceName.trim()) {
      try {
        await createWorkspace(workspaceName.trim());
        setIsCreateOpen(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Rename the currently active workspace
  const handleRenameWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;

    if (workspaceName.trim() && workspaceName.trim() !== activeWorkspace.name) {
      try {
        await updateWorkspace(activeWorkspace.id, workspaceName.trim());
        setIsRenameOpen(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Delete the currently active workspace
  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;

    try {
      await deleteWorkspace(activeWorkspace.id);
      setIsDeleteOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Show loader if workspaces are loading
  if (isLoading) {
    return (
      <Button variant="ghost" className="w-full justify-start" disabled>
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading workspaces...
      </Button>
    );
  }

  // Show an error and a retry option if the workspace list failed to load
  if (error) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start text-destructive"
        onClick={() => fetchWorkspaces()}
      >
        Error loading workspaces
      </Button>
    );
  }

  // If there are no workspaces or no current active workspace, prompt to create one
  if (workspaces.length === 0 || !activeWorkspace) {
    return (
      <>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="mr-2 size-4" />
          Create new workspace
        </Button>

        <WorkspaceCreateDialog
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          workspaceName={workspaceName}
          onWorkspaceNameChange={setWorkspaceName}
          onSubmit={handleCreateWorkspace}
        />
      </>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                variant="outline"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-background border"
              >
                <div className="grid flex-1 text-left text-sm leading-tight truncate font-semibold">
                  {activeWorkspace.name}
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((workspace, index) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => setActiveWorkspace(workspace)}
                  className="gap-2 p-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-sm border">
                    {activeWorkspace.id === workspace.id ? (
                      <Check className="size-4" />
                    ) : (
                      <span className="text-xs font-medium">
                        {workspace.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="flex-1">{workspace.name}</span>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setIsCreateOpen(true)}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Add workspace
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setIsRenameOpen(true)}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
                  <Edit3 className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Rename workspace
                </div>
                <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setIsDeleteOpen(true)}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
                  <Trash2 className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Delete workspace
                </div>
                <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Create Workspace Dialog */}
      <WorkspaceCreateDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        workspaceName={workspaceName}
        onWorkspaceNameChange={setWorkspaceName}
        onSubmit={handleCreateWorkspace}
      />

      {/* Rename Workspace Dialog */}
      <WorkspaceRenameDialog
        isOpen={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        workspaceName={workspaceName}
        onWorkspaceNameChange={setWorkspaceName}
        onSubmit={handleRenameWorkspace}
        workspaceToRename={activeWorkspace}
      />

      {/* Delete Workspace Dialog */}
      <WorkspaceDeleteDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteWorkspace}
        workspaceToDelete={activeWorkspace}
      />
    </>
  );
}

// Create Workspace Dialog Component
interface WorkspaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  onWorkspaceNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function WorkspaceCreateDialog({
  isOpen,
  onOpenChange,
  workspaceName,
  onWorkspaceNameChange,
  onSubmit,
}: WorkspaceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new workspace</DialogTitle>
          <DialogDescription>
            Enter a name for your new workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                value={workspaceName}
                onChange={(e) => onWorkspaceNameChange(e.target.value)}
                placeholder="My Workspace"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!workspaceName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Rename Workspace Dialog Component
interface WorkspaceRenameDialogProps extends WorkspaceDialogProps {
  workspaceToRename: { id: string; name: string } | null;
}

function WorkspaceRenameDialog({
  isOpen,
  onOpenChange,
  workspaceName,
  onWorkspaceNameChange,
  onSubmit,
  workspaceToRename,
}: WorkspaceRenameDialogProps) {
  if (!workspaceToRename) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename workspace</DialogTitle>
          <DialogDescription>
            Enter a new name for "{workspaceToRename.name}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename">New name</Label>
              <Input
                id="rename"
                value={workspaceName}
                onChange={(e) => onWorkspaceNameChange(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={
                !workspaceName.trim() ||
                workspaceName.trim() === workspaceToRename.name
              }
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Workspace Dialog Component
interface WorkspaceDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  workspaceToDelete: { id: string; name: string } | null;
}

function WorkspaceDeleteDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  workspaceToDelete,
}: WorkspaceDeleteDialogProps) {
  if (!workspaceToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete workspace</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the workspace "
            {workspaceToDelete.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
