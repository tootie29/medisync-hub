
import * as React from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

// Sidebar Header
export interface SidebarHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeader({
  className,
  children,
  ...props
}: SidebarHeaderProps) {
  return (
    <div
      className={cn("flex h-14 items-center border-b px-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Sidebar Content
export interface SidebarContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarContent({
  className,
  children,
  ...props
}: SidebarContentProps) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto overflow-x-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Sidebar Footer
export interface SidebarFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarFooter({
  className,
  children,
  ...props
}: SidebarFooterProps) {
  return (
    <div className={cn("border-t p-4", className)} {...props}>
      {children}
    </div>
  );
}

// Sidebar Group
export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarGroup({ className, children, ...props }: SidebarGroupProps) {
  return (
    <div className={cn("pb-4", className)} {...props}>
      {children}
    </div>
  );
}

// Sidebar Group Label
export interface SidebarGroupLabelProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarGroupLabel({
  className,
  children,
  ...props
}: SidebarGroupLabelProps) {
  const { open } = useSidebar();

  return (
    <div
      className={cn(
        "flex h-8 items-center px-4 text-xs font-medium text-sidebar-foreground/50 transition-opacity",
        open ? "opacity-100" : "opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Sidebar Group Content
export interface SidebarGroupContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarGroupContent({
  className,
  children,
  ...props
}: SidebarGroupContentProps) {
  return (
    <div className={cn("px-2", className)} {...props}>
      {children}
    </div>
  );
}
