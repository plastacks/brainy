"use client";

import * as React from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./app-sidebar";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { Logo } from "./logo";
import { useItems } from "@/hooks/use-items";
import { Button } from "@/components/ui/button";
import { useStore } from "@nanostores/react";
import { $editorContent, updateItem } from "@/stores";
import type { DocumentItem } from "@/firebase/db/types";
interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { fetchWorkspaces } = useWorkspaces();
  const { activeItem } = useItems();
  const editorContent = useStore($editorContent);

  React.useEffect(() => {
    fetchWorkspaces().catch(console.error);
  }, [fetchWorkspaces]);

  const handleSave = () => {
    if (activeItem && editorContent) {
      const { id, ...item } = activeItem;
      updateItem(id, {
        ...item,
        //@ts-ignore
        content: editorContent,
      });
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col gap-4">
        <div className="z-50 sticky top-0 bg-background">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-baseline gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1" />
              <h2 className="text-lg font-semibold">{activeItem?.name}</h2>
              <div className="flex-1 flex justify-end">
                {activeItem && (
                  <Button
                    disabled={
                      !activeItem ||
                      (activeItem as DocumentItem).content === editorContent
                    }
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                )}
              </div>
            </div>
          </header>
          <Separator />
        </div>
        <div className="flex flex-1 flex-col p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
