import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ClipboardCheck,
  HeartPulse,
  Home,
  Package,
  RefreshCcw,
  Settings,
  UserCircle,
} from "lucide-react";

export default function Sidebar({ isSidebarOpen, toggleSidebar }) {
  const routes = [
    {
      path: "/",
      name: "Home",
      icon: Home,
    },
    {
      path: "/appointments",
      name: "Appointments",
      icon: Calendar,
    },
    {
      path: "/bmi",
      name: "BMI Calculator",
      icon: HeartPulse,
    },
    {
      path: "/records",
      name: "Medical Records",
      icon: ClipboardCheck,
    },
    {
      path: "/inventory",
      name: "Inventory",
      icon: Package,
    },
  ];

  return (
    <div
      className={cn(
        "bg-sidebar-background fixed left-0 top-0 z-50 flex h-full shrink-0 flex-col overflow-y-auto border-r border-sidebar-border py-4 transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-16",
        !isSidebarOpen && "hover:w-64",
      )}
    >
      <div className="flex items-center justify-end px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-full p-1.5"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4 py-4">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground",
                !isSidebarOpen && "justify-center",
              )
            }
          >
            <route.icon className="h-5 w-5" />
            {isSidebarOpen && <span>{route.name}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
