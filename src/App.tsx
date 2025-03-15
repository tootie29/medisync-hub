
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { format, addDays, parseISO, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Appointments from "./pages/Appointments";
import BMICalculator from "./pages/BMICalculator";
import MedicalRecords from "./pages/MedicalRecords";
import Inventory from "./pages/Inventory";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

// Component to check for upcoming appointments
const AppointmentNotifier = () => {
  const { user } = useAuth();
  const { getAppointmentsByPatientId } = useData();
  
  useEffect(() => {
    if (!user) return;
    
    // Get user appointments
    const userAppointments = getAppointmentsByPatientId(user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysFromNow = addDays(today, 2);
    
    // Filter for confirmed appointments in the next 2 days
    const upcomingAppointments = userAppointments.filter(appointment => {
      if (appointment.status !== 'confirmed') return false;
      
      const appointmentDate = parseISO(appointment.date);
      return isWithinInterval(appointmentDate, {
        start: today,
        end: twoDaysFromNow
      });
    });
    
    // Show notifications for upcoming appointments
    upcomingAppointments.forEach(appointment => {
      const appointmentDate = format(parseISO(appointment.date), 'MMMM d, yyyy');
      toast.info(
        "Upcoming Appointment Reminder", 
        { 
          description: `You have an appointment on ${appointmentDate} at ${appointment.startTime}.`,
          duration: 5000
        }
      );
    });
  }, [user]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppointmentNotifier />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/bmi" element={<BMICalculator />} />
              <Route path="/records" element={<MedicalRecords />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
