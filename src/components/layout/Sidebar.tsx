import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
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
  Activity,
  BadgeCheck,
  CreditCard,
  FileText,
  Award,
} from "lucide-react";

export default function Sidebar({ isSidebarOpen, toggleSidebar }) {
  const { user } = useAuth();
  const { getMedicalRecordsByPatientId } = useData();
  
  // Updated to use Olivarez College logo
  const schoolLogo = "/lovable-uploads/03f574c6-5504-45d4-8d0e-3eb89db37d70.png";
  
  // Determine if user can access inventory (admin and staff only)
  const canAccessInventory = user && (user.role === "staff" || user.role === "admin");

  // Determine if user is patient
  const isPatient = user && (user.role === "student" || user.role === "staff");

  // Allow both doctors and head nurses to access permission slip and medical certificate
  const canAccessPermissionSlip = user && (user.role === "doctor" || user.role === "head nurse");
  const canAccessMedicalCertificate = user && (user.role === "doctor" || user.role === "head nurse");

  // Debug logging
  console.log('User data for sidebar:', {
    role: user?.role,
    position: user?.position,
    canAccessPermissionSlip,
    canAccessMedicalCertificate
  });

  // Check if any certificate-enabled medical record exists for this patient
  let patientHasCertificate = false;
  if (isPatient) {
    const records = getMedicalRecordsByPatientId(user.id);
    patientHasCertificate = records.some(record => record.certificateEnabled);
  }

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
      path: "/medical-records",
      name: "Medical Records",
      icon: ClipboardCheck,
    },
    {
      path: "/health-monitoring",
      name: "Health Monitoring",
      icon: Activity,
    },
    // Add Orange Card route for patients (students and staff)
    ...(isPatient ? [{
      path: "/orange-card",
      name: "Orange Card",
      icon: CreditCard,
    }] : []),
    // Only show inventory to admin and staff roles
    ...(canAccessInventory ? [{
      path: "/inventory",
      name: "Inventory",
      icon: Package,
    }] : []),
    // Show permission slip to both doctors and head nurses
    ...(canAccessPermissionSlip ? [{
      path: "/permission-slip",
      name: "Permission Slip",
      icon: FileText,
    }] : []),
    // Show medical certificate to both doctors and head nurses
    ...(canAccessMedicalCertificate ? [{
      path: "/medical-certificate",
      name: "Medical Certificate",
      icon: Award,
    }] : []),
    // Show certificate menu only to patients who have enabled certificate medical records
    ...(isPatient && patientHasCertificate ? [{
      path: "/certificate",
      name: "Certificate",
      icon: BadgeCheck,
    }] : []),
    // Add Settings route for all users
    {
      path: "/settings",
      name: "Settings",
      icon: Settings,
    }
  ];

  return (
    <div
      className={cn(
        "bg-medical-primary fixed left-0 top-0 z-50 flex h-full shrink-0 flex-col overflow-y-auto border-r border-medical-secondary py-4 transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between px-4 mb-4">
        <div className={cn("font-bold text-white", !isSidebarOpen && "hidden")}>
          {isSidebarOpen ? (
            <img 
              src={schoolLogo} 
              alt="Olivarez College" 
              className="h-12 w-auto"
            />
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-full p-1.5 text-white hover:bg-medical-secondary/50"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-6 w-6" />
          ) : (
            <ChevronRight className="h-6 w-6" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2 py-2 px-3">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                "text-white hover:bg-medical-secondary/70",
                isActive
                  ? "bg-medical-secondary text-white"
                  : "text-white/90",
                !isSidebarOpen && "justify-center px-2"
              )
            }
          >
            <route.icon className="h-5 w-5" />
            {isSidebarOpen && <span className="whitespace-nowrap">{route.name}</span>}
            {!isSidebarOpen && (
              <span className="absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-md bg-medical-primary px-2 py-1 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg border border-medical-secondary z-50">
                {route.name}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
