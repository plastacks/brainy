import { atom, map } from "nanostores";
import type { Item, DocumentItem, FolderItem } from "@/firebase/db/types";

// Store for the list of items
export const $items = atom<(Item & { id: string })[]>([]);

// Store for the currently selected item
export const $activeItem = atom<(Item & { id: string }) | null>(null);

// Store for loading state
export const $itemsState = map({
  isLoading: false,
  error: null as string | null,
});

// Add sort state
export const $itemsSort = map({
  field: "name" as "name" | "createdAt" | "updatedAt",
  direction: "asc" as "asc" | "desc",
});

// Type definitions for tree structure
type TreeItem = Item & { id: string; children?: TreeItem[] };

// Store for the tree structure of items
export const $itemsTree = atom<TreeItem[]>([]);

// Helper function to build tree structure
function buildItemsTree(items: (Item & { id: string })[]) {
  const itemMap = new Map<string, TreeItem>();
  const rootItems: TreeItem[] = [];

  // First pass: Create all items without children
  items.forEach((item) => {
    itemMap.set(item.id, {
      ...item,
      ...(item.type === "folder" && { children: [] }),
    });
  });

  // Second pass: Build parent-child relationships
  items.forEach((item) => {
    if (item.type === "folder") {
      const folder = item as FolderItem & { id: string };
      const folderNode = itemMap.get(folder.id)!;

      folder.itemsIds?.forEach((childId) => {
        const childNode = itemMap.get(childId);
        if (childNode) {
          folderNode.children?.push(childNode);
        }
      });
    }
  });

  // Add items to root if they're not in any folder
  items.forEach((item) => {
    const isInFolder = items.some(
      (potentialParent) =>
        potentialParent.type === "folder" &&
        (potentialParent as FolderItem).itemsIds?.includes(item.id)
    );

    if (!isInFolder) {
      const rootItem = itemMap.get(item.id);
      if (rootItem) {
        rootItems.push(rootItem);
      }
    }
  });

  // Sort root items before returning
  const { field, direction } = $itemsSort.get();
  return sortItems(rootItems, field, direction);
}

// Add sorting helper function
function sortItems(
  items: TreeItem[],
  field: string,
  direction: "asc" | "desc"
) {
  return [...items].sort((a, b) => {
    let comparison = 0;

    if (field === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (field === "createdAt" || field === "updatedAt") {
      const aDate = a[field]?.toDate?.() || new Date(0);
      const bDate = b[field]?.toDate?.() || new Date(0);
      comparison = aDate.getTime() - bDate.getTime();
    }

    return direction === "asc" ? comparison : -comparison;
  });
}

// Fetch items from the API for a specific workspace
export async function fetchItems(workspaceId: string) {
  if (!workspaceId) return [];

  try {
    $itemsState.setKey("isLoading", true);
    $itemsState.setKey("error", null);

    // Fetch items
    const response = await fetch(`/api/items?workspaceId=${workspaceId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];

    // Add id to each item from its document ID
    const itemsWithIds = items.map((item: Item & { id: string }) => item);

    $items.set(itemsWithIds);

    // Fetch workspace preferences to get sort settings
    const prefsResponse = await fetch(
      `/api/workspaces/${workspaceId}/preferences`
    );

    if (prefsResponse.ok) {
      const preferences = await prefsResponse.json();

      if (preferences.itemsSort) {
        // Update sort settings from saved preferences
        $itemsSort.set({
          field: preferences.itemsSort.field || "name",
          direction: preferences.itemsSort.direction || "asc",
        });
      }
    }

    // Build tree with current sort settings
    $itemsTree.set(buildItemsTree(itemsWithIds));

    return itemsWithIds;
  } catch (err) {
    console.error("Error fetching items:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to load items";
    $itemsState.setKey("error", errorMessage);
    throw err;
  } finally {
    $itemsState.setKey("isLoading", false);
  }
}

// Set the active item
export function setActiveItem(item: (Item & { id: string }) | null) {
  $activeItem.set(item);
}

// Create a new document item
export async function createDocumentItem(
  workspaceId: string,
  name: string,
  content = ""
) {
  try {
    $itemsState.setKey("isLoading", true);

    const response = await fetch("/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        workspaceId,
        type: "document",
        content,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create document: ${response.status}`);
    }

    const newItem = (await response.json()) as Item & { id: string };

    // Update the items list
    const currentItems = $items.get();
    $items.set([...currentItems, newItem]);
    $itemsTree.set(buildItemsTree([...currentItems, newItem]));

    return newItem;
  } catch (err) {
    console.error("Error creating document:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to create document";
    $itemsState.setKey("error", errorMessage);
    throw err;
  } finally {
    $itemsState.setKey("isLoading", false);
  }
}

// Create a new folder item
export async function createFolderItem(
  workspaceId: string,
  name: string,
  itemsIds: string[] = []
) {
  try {
    $itemsState.setKey("isLoading", true);

    const response = await fetch("/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        workspaceId,
        type: "folder",
        itemsIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.status}`);
    }

    const newItem = (await response.json()) as Item & { id: string };

    // Update the items list
    const currentItems = $items.get();
    $items.set([...currentItems, newItem]);
    $itemsTree.set(buildItemsTree([...currentItems, newItem]));

    return newItem;
  } catch (err) {
    console.error("Error creating folder:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to create folder";
    $itemsState.setKey("error", errorMessage);
    throw err;
  } finally {
    $itemsState.setKey("isLoading", false);
  }
}

// Update an item
export async function updateItem(
  id: string,
  updateData: Partial<DocumentItem | FolderItem>
) {
  try {
    $itemsState.setKey("isLoading", true);

    const response = await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update item: ${response.status}`);
    }

    const updatedItem = (await response.json()) as Item & { id: string };

    // Update the items list
    const currentItems = $items.get();
    $items.set(
      currentItems.map((item) =>
        item.id === id ? { ...item, ...(updateData as typeof item) } : item
      )
    );
    $itemsTree.set(buildItemsTree(currentItems));

    // Update active item if it's the one being edited
    const activeItem = $activeItem.get();
    if (activeItem && activeItem.id === id) {
      setActiveItem({ ...activeItem, ...updateData } as typeof activeItem);
    }

    return updatedItem;
  } catch (err) {
    console.error("Error updating item:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to update item";
    $itemsState.setKey("error", errorMessage);
    throw err;
  } finally {
    $itemsState.setKey("isLoading", false);
  }
}

// Delete an item
export async function deleteItem(id: string) {
  try {
    $itemsState.setKey("isLoading", true);

    const response = await fetch(`/api/items/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete item: ${response.status}`);
    }

    // Update the items list
    const currentItems = $items.get();
    const updatedItems = currentItems.filter((item) => item.id !== id);
    $items.set(updatedItems);
    $itemsTree.set(buildItemsTree(updatedItems));

    // Reset active item if it was deleted
    const activeItem = $activeItem.get();
    if (activeItem && activeItem.id === id) {
      setActiveItem(null);
    }

    return true;
  } catch (err) {
    console.error("Error deleting item:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to delete item";
    $itemsState.setKey("error", errorMessage);
    throw err;
  } finally {
    $itemsState.setKey("isLoading", false);
  }
}

// Move an item to a folder
export async function moveItemToFolder(itemId: string, folderId: string) {
  try {
    $itemsState.setKey("isLoading", true);

    const currentItems = $items.get();
    const folder = currentItems.find(
      (item) => item.id === folderId && item.type === "folder"
    ) as (FolderItem & { id: string }) | undefined;

    if (!folder) {
      throw new Error("Folder not found");
    }

    // Update folder with new item ID
    const updatedItemsIds = [...(folder.itemsIds || []), itemId];

    const updatedFolder = await updateItem(folderId, {
      name: folder.name,
      itemsIds: updatedItemsIds,
    });

    const newItems = currentItems.map((item) =>
      item.id === folderId ? updatedFolder : item
    );
    $items.set(newItems);
    $itemsTree.set(buildItemsTree(newItems));

    return updatedFolder;
  } catch (err) {
    console.error("Error moving item:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to move item";
    $itemsState.setKey("error", errorMessage);
    throw err;
  } finally {
    $itemsState.setKey("isLoading", false);
  }
}

// Remove an item from a folder
export async function removeItemFromFolder(itemId: string, folderId: string) {
  try {
    $itemsState.setKey("isLoading", true);

    const currentItems = $items.get();
    const folder = currentItems.find(
      (item) => item.id === folderId && item.type === "folder"
    ) as (FolderItem & { id: string }) | undefined;

    if (!folder) {
      throw new Error("Folder not found");
    }

    // Remove item ID from folder's itemsIds
    const updatedItemsIds = (folder.itemsIds || []).filter(
      (id) => id !== itemId
    );

    const updatedFolder = await updateItem(folderId, {
      itemsIds: updatedItemsIds,
    });

    const newItems = currentItems.map((item) =>
      item.id === folderId ? updatedFolder : item
    );
    $items.set(newItems);
    $itemsTree.set(buildItemsTree(newItems));

    return updatedFolder;
  } catch (err) {
    console.error("Error removing item from folder:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to remove item from folder";
    $itemsState.setKey("error", errorMessage);
    throw err;
  } finally {
    $itemsState.setKey("isLoading", false);
  }
}

// Add sort function that persists to the database
export async function setSortOrder(
  workspaceId: string,
  field: "name" | "createdAt" | "updatedAt",
  direction: "asc" | "desc"
) {
  try {
    $itemsState.setKey("isLoading", true);

    // Update local state first for immediate UI response
    $itemsSort.set({ field, direction });

    // Re-sort the tree with new settings
    const currentItems = $items.get();
    $itemsTree.set(buildItemsTree(currentItems));

    // Save sort preferences to the workspace
    const response = await fetch(`/api/workspaces/${workspaceId}/preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemsSort: { field, direction },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save sort preferences: ${response.status}`);
    }

    return true;
  } catch (err) {
    console.error("Error saving sort preferences:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to save sort preferences";
    $itemsState.setKey("error", errorMessage);
    throw err;
  } finally {
    $itemsState.setKey("isLoading", false);
  }
}
