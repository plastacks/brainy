"use client";

import * as React from "react";

import { NavItems } from "@/components/nav-items";
import { NavUser } from "@/components/nav-user";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { Skeleton } from "@/components/ui/skeleton";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isLoading, isInitialized } = useWorkspaces();
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Label className="text-xs text-muted-foreground">Workspace</Label>
        {isLoading || !isInitialized ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <WorkspaceSwitcher />
        )}
      </SidebarHeader>
      <Separator className="my-2" />
      <SidebarContent>
        {isLoading || !isInitialized ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ) : (
          <NavItems />
        )}
      </SidebarContent>
      <SidebarFooter>
        {isLoading || !isInitialized ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <NavUser />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
