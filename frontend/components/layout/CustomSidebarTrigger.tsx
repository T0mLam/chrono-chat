"use client";

import { MenuIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

export function CustomSidebarTrigger() {
  const { open, openMobile, toggleSidebar } = useSidebar();

  return (
    <div className="absolute top-2 left-2">
      {open || openMobile ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="backdrop-blur-sm rounded-lg"
                variant="ghost"
                onClick={toggleSidebar}
              >
                <PanelLeftClose className="w-4 h-4 mr-1" />
                Close sidebar
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-white text-xs flex items-center gap-1 whitespace-nowrap">
                Press{" "}
                <kbd className="ml-1 z-10 bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono font-medium opacity-100 select-none">
                  T
                </kbd>
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="backdrop-blur-sm rounded-lg"
                variant="ghost"
                onClick={toggleSidebar}
              >
                <PanelLeftOpen className="w-4 h-4 mr-1" />
                Open sidebar
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-white text-xs flex items-center gap-1 whitespace-nowrap">
                Press{" "}
                <kbd className="ml-1 z-10 bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono font-medium opacity-100 select-none">
                  T
                </kbd>
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
