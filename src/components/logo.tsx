import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 text-primary", className)}>
      <Brain className="w-6 h-6" />
      <span className="text-lg font-bold mt-2">Brainy</span>
    </div>
  );
}
