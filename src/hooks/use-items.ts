import { useStore } from "@nanostores/react";
import {
  $items,
  $activeItem,
  $itemsState,
  fetchItems,
  setActiveItem,
  createDocumentItem,
  createFolderItem,
  updateItem,
  deleteItem,
  moveItemToFolder,
  removeItemFromFolder,
  $itemsTree,
  $itemsSort,
  setSortOrder,
} from "@/stores";

export function useItems() {
  const items = useStore($items);
  const itemsTree = useStore($itemsTree);
  const activeItem = useStore($activeItem);
  const { isLoading, error } = useStore($itemsState);
  const sortState = useStore($itemsSort);

  return {
    items,
    itemsTree,
    activeItem,
    isLoading,
    error,
    sortState,
    setSortOrder,
    fetchItems,
    setActiveItem,
    createDocumentItem,
    createFolderItem,
    updateItem,
    deleteItem,
    moveItemToFolder,
    removeItemFromFolder,
  };
}
