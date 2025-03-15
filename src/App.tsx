
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { format, addDays, parseISO, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Server } from "lucide-react";
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
import Settings from "./pages/Settings";

// Define API_URL based on environment or domain
const API_BASE_URL = window.location.hostname === "medisync.entrsolutions.com" 
  ? 'https://medisync.entrsolutions.com'
  : 'http://localhost:3001';

// Add axios retry configuration
axios.interceptors.response.use(undefined, async (error) => {
  const config = error.config;
  
  // If the request was canceled or already retried, just throw the error
  if (error.message === 'canceled' || config._retryCount >= 2) {
    return Promise.reject(error);
  }
  
  // Initialize retry count
  config._retryCount = config._retryCount || 0;
  config._retryCount += 1;
  
  // Wait for 1 second before retrying
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return the promise from the new axios request
  return axios(config);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Retry failed queries 2 times
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000), // Exponential backoff
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const ServerChecker = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [serverError, setServerError] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const maxRetries = 3;

  useEffect(() => {
    // Show the actual server URL we're trying to connect to
    setServerUrl(API_BASE_URL);
    
    const checkServer = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
        console.log('Server health check response:', response.data);
        setIsServerRunning(true);
        setServerError('');
        
        // Check if DB is connected
        if (response.data.status === 'WARNING') {
          toast.warning(
            'Database connection issue',
            { 
              description: response.data.message,
              duration: 5000
            }
          );
        }
      } catch (error) {
        console.error('Backend server connection issue:', error);
        
        // Extract a more specific error message
        let errorMessage = 'Connection to the server failed';
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Connection timeout. Server may be overloaded.';
        } else if (error.response) {
          errorMessage = `Server error: ${error.response.status}`;
        } else if (error.code === 'ERR_NETWORK') {
          errorMessage = 'Network error. Server may be offline.';
        }
        
        setServerError(errorMessage);
        
        // Implement retry logic
        if (retryCount < maxRetries) {
          setRetryCount(prevCount => prevCount + 1);
          
          toast.error(
            'Server connection error',
            { 
              description: `${errorMessage}. Retrying... (${retryCount + 1}/${maxRetries})`,
              duration: 3000
            }
          );
          
          // Try again after a delay
          setTimeout(checkServer, 2000);
        } else {
          setIsChecking(false);
          toast.error(
            'Backend server not running',
            { 
              description: 'Unable to connect to the backend server after multiple attempts.',
              duration: 10000
            }
          );
        }
      } finally {
        if (isServerRunning || retryCount >= maxRetries) {
          setIsChecking(false);
        }
      }
    };

    checkServer();
  }, [retryCount]);

  if (isChecking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-80 dark:bg-opacity-80 z-50">
        <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-w-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-700 dark:text-gray-300 mb-2">Connecting to server...</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{serverUrl}</p>
          {retryCount > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Retry attempt {retryCount}/{maxRetries}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isServerRunning && !isChecking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-80 dark:bg-opacity-80 z-50">
        <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-w-md">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Server Connection Failed</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {serverError || 'Unable to connect to the backend server.'}
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400 border-t pt-4 mt-2">
            <p className="font-medium mb-1">Attempted to connect to:</p>
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs block mb-4">{serverUrl}</code>
            <p className="mb-2">Troubleshooting steps:</p>
            <ol className="list-decimal list-inside text-left mb-4">
              <li>Check if your backend server is running</li>
              <li>Verify the server URL is correct ({API_BASE_URL})</li>
              <li>Ensure your MySQL server is running</li>
              <li>Check network connectivity and firewall settings</li>
              <li>Look for errors in your server console</li>
            </ol>
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Retry Connection
              </button>
              <a
                href={`${API_BASE_URL}/api/health`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
              >
                <Server className="h-4 w-4 mr-2" />
                Test API
              </a>
            </div>
          </div>
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
      <ThemeProvider>
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
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
