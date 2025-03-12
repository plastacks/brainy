import { FolderPlus, Plus, Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useItems } from "@/hooks/use-items";
import { useWorkspaces } from "@/hooks/use-workspaces";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
interface ItemActionsProps {
  isFolder?: boolean;
  id?: string;
  orientation?: "horizontal" | "vertical";
  labels?: boolean;
  className?: string;
}

export function ItemActions({
  id,
  orientation,
  labels,
  className,
  isFolder,
}: ItemActionsProps) {
  const { createDocumentItem, createFolderItem, moveItemToFolder, deleteItem } =
    useItems();
  const { activeWorkspace } = useWorkspaces();

  const handleAddDocument = async (name: string) => {
    if (activeWorkspace) {
      try {
        const { id: newItemId } = await createDocumentItem(
          activeWorkspace.id,
          name
        );
        if (id && isFolder) {
          await moveItemToFolder(newItemId, id);
        }
      } catch (error) {
        console.error("Error creating document:", error);
      }
    }
  };

  const handleAddFolder = async (name: string) => {
    if (activeWorkspace) {
      try {
        const { id: newItemId } = await createFolderItem(
          activeWorkspace.id,
          name
        );
        if (id && isFolder) {
          await moveItemToFolder(newItemId, id);
        }
      } catch (error) {
        console.error("Error creating folder:", error);
      }
    }
  };

  const handleDeleteItem = async () => {
    if (id) {
      try {
        await deleteItem(id);
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          orientation === "vertical"
            ? "flex flex-col gap-1"
            : "flex justify-end items-center gap-0 px-2",
          className
        )}
      >
        {isFolder && (
          <Popover>
            <PopoverTrigger
              asChild
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {labels ? (
                <div className="flex items-center gap-1 p-1.5 rounded bg-transparent opacity-80 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-sm">Add a new Document</span>
                </div>
              ) : (
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 p-1.5 rounded bg-transparent opacity-80 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Add a new Document</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </PopoverTrigger>
            {orientation == "horizontal" && (
              <Separator orientation="vertical" className="min-h-4! mx-1" />
            )}
            <PopoverContent className="w-60" side="right">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get("name") as string;
                  if (name) {
                    handleAddDocument(name);
                    e.currentTarget.reset();
                  }
                }}
                className="flex flex-col gap-2"
              >
                <input
                  name="name"
                  placeholder="Document name"
                  className="border rounded px-2 py-1"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-primary text-primary-foreground rounded"
                >
                  Create Document
                </button>
              </form>
            </PopoverContent>
          </Popover>
        )}
        {isFolder && (
          <Popover>
            <PopoverTrigger
              asChild
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {labels ? (
                <div className="flex items-center gap-1 p-1.5 rounded bg-transparent opacity-80 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span className="text-sm">Add a new Folder</span>
                </div>
              ) : (
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 p-1.5 rounded bg-transparent opacity-80 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                        <FolderPlus className="h-3.5 w-3.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Add a new Folder</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-60" side="right">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get("name") as string;
                  if (name) {
                    handleAddFolder(name);
                    e.currentTarget.reset();
                  }
                }}
                className="flex flex-col gap-2"
              >
                <input
                  name="name"
                  placeholder="Folder name"
                  className="border rounded px-2 py-1"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-primary text-primary-foreground rounded"
                >
                  Create Folder
                </button>
              </form>
            </PopoverContent>
          </Popover>
        )}
        {id && (
          <Tooltip>
            <TooltipTrigger>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div className="flex items-center gap-1 p-1.5 rounded bg-transparent opacity-80 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                    <Trash className="h-3.5 w-3.5" />
                    {labels && <span className="text-sm">Delete</span>}
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the item and all of its data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteItem}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
