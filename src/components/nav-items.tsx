"use client";

import { ItemActions } from "@/components/items-actions";
import { TreeView, type TreeDataItem } from "@/components/tree-view";
import { Button } from "@/components/ui/button";
import type { DocumentItem } from "@/firebase/db/types";
import { useItems } from "@/hooks/use-items";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { setEditorContent } from "@/stores";
import { FileText, Folder, FolderOpen, Loader2 } from "lucide-react";
import * as React from "react";
export function NavItems() {
  const { activeWorkspace } = useWorkspaces();
  const {
    itemsTree,
    items,
    activeItem,
    isLoading,
    error,
    fetchItems,
    setActiveItem,
  } = useItems();

  // Fetch items when active workspace changes
  React.useEffect(() => {
    if (activeWorkspace) {
      fetchItems(activeWorkspace.id).catch(console.error);
    }
  }, [activeWorkspace, fetchItems]);

  // Handle tree item selection
  const handleSelectChange = (item: TreeDataItem | undefined) => {
    if (item && item.id && !item.children) {
      const selectedItem = items.find((i) => i.id === item.id);
      if (selectedItem) {
        setActiveItem(selectedItem);
        setEditorContent((selectedItem as DocumentItem).content);
      }
    }
  };

  // Display loading state
  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-20 text-muted-foreground px-4 py-8">
        Select a workspace to view items
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="text-sm">Loading items...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-destructive mb-2">Error loading items</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => activeWorkspace && fetchItems(activeWorkspace.id)}
        >
          Retry
        </Button>
      </div>
    );
  }

  const enachantDataWithActions = (item: TreeDataItem): TreeDataItem => {
    if (item.children) {
      return {
        ...item,
        children: item.children.map(enachantDataWithActions),
        actions: (
          <ItemActions id={item.id} isFolder orientation="vertical" labels />
        ),
      };
    }
    return {
      ...item,
      actions: <ItemActions id={item.id} orientation="vertical" labels />,
    };
  };

  return (
    <div className="relative">
      <div className="mb-16">
        <ItemActions isFolder className="sticky top-0 z-10 bg-sidebar" />

        {itemsTree.length > 0 ? (
          <TreeView
            data={itemsTree.map(enachantDataWithActions)}
            initialSelectedItemId={activeItem?.id}
            onSelectChange={handleSelectChange}
            defaultNodeIcon={Folder}
            defaultLeafIcon={FileText}
            defaultOpenNodeIcon={FolderOpen}
          />
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No items in this workspace
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
