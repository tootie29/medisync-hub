
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

// Sidebar Menu
export interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {}

export function SidebarMenu({ className, children, ...props }: SidebarMenuProps) {
  return (
    <ul className={cn("flex flex-col gap-1", className)} {...props}>
      {children}
    </ul>
  );
}

// Sidebar Menu Item
export interface SidebarMenuItemProps
  extends React.HTMLAttributes<HTMLLIElement> {}

export function SidebarMenuItem({
  className,
  children,
  ...props
}: SidebarMenuItemProps) {
  return (
    <li className={cn("", className)} {...props}>
      {children}
    </li>
  );
}

// Sidebar Menu Button
export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isActive?: boolean;
}

export function SidebarMenuButton({
  className,
  children,
  asChild = false,
  isActive = false,
  ...props
}: SidebarMenuButtonProps) {
  const { open } = useSidebar();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "group flex h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground",
        open ? "" : "justify-center",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
