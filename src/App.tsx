
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { format, addDays, parseISO, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import axios from "axios";
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
import HealthMonitoring from "./pages/HealthMonitoring";

const queryClient = new QueryClient();

// Check if backend server is running
const ServerChecker = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isServerRunning, setIsServerRunning] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get('http://localhost:3001/api/health');
        setIsServerRunning(true);
      } catch (error) {
        console.error('Backend server is not running:', error);
        toast.error(
          'Backend server not running',
          { 
            description: 'Please start your MAMP/XAMPP MySQL server and run "node server/server.js"',
            duration: 10000
          }
        );
      } finally {
        setIsChecking(false);
      }
    };

    checkServer();
  }, []);

  if (isChecking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-700">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return null;
};

const AppointmentNotifier = () => {
  const { user } = useAuth();
  const { getAppointmentsByPatientId } = useData();
  
  useEffect(() => {
    if (!user) return;
    
    const userAppointments = getAppointmentsByPatientId(user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysFromNow = addDays(today, 2);
    
    const upcomingAppointments = userAppointments.filter(appointment => {
      if (appointment.status !== 'confirmed') return false;
      
      const appointmentDate = parseISO(appointment.date);
      return isWithinInterval(appointmentDate, {
        start: today,
        end: twoDaysFromNow
      });
    });
    
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
          <ServerChecker />
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
              <Route path="/health-monitoring" element={<HealthMonitoring />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
