
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  HeartPulse,
  Home,
  Package,
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
        isSidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between px-4">
        <div className={cn("font-bold text-white text-xl", !isSidebarOpen && "hidden")}>
          MedCenter
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-full p-1.5 text-white hover:bg-white/20"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-6 w-6" />
          ) : (
            <ChevronRight className="h-6 w-6" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2 py-6 px-3">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                "hover:bg-white/20",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/90",
                !isSidebarOpen && "justify-center px-2"
              )
            }
          >
            <route.icon className="h-5 w-5" />
            {isSidebarOpen && <span className="whitespace-nowrap">{route.name}</span>}
            {!isSidebarOpen && (
              <span className="absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-md bg-sidebar-background px-2 py-1 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg border border-white/10 z-50">
                {route.name}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
