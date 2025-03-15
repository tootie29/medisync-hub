
import * as React from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const { open, setOpen } = useSidebar();

  return (
    <div
      data-state={open ? "open" : "closed"}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r bg-sidebar-background transition-[width] duration-300",
        open ? "w-60 sm:w-72" : "w-16",
        className
      )}
      {...props}
    />
  );
}
