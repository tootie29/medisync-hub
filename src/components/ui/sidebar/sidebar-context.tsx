
import * as React from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Close sidebar on mobile by default
  React.useEffect(() => {
    if (isDesktop === undefined) return;
    if (!isDesktop) {
      setOpen(false);
    } else {
      setOpen(defaultOpen);
    }
  }, [isDesktop, defaultOpen]);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export interface SidebarTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SidebarTrigger({
  className,
  children,
  ...props
}: SidebarTriggerProps) {
  const { open, setOpen } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setOpen((prev) => !prev)}
      className={cn("flex h-9 w-9 shrink-0", className)}
      {...props}
    >
      {children ?? (open ? <ChevronLeft /> : <ChevronRight />)}
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}
