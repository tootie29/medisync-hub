import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { format, addDays, parseISO, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Server, ExternalLink, RefreshCw, Database } from "lucide-react";
import axios from "axios";

const getApiBaseUrl = () => {
  const isLovablePreview = window.location.hostname.includes('lovableproject.com');
  if (isLovablePreview) {
    console.log('Running in Lovable preview - using sample data instead of API');
    return null;
  }
  
  const hostname = window.location.hostname;
  if (hostname === "climasys.entrsolutions.com" || hostname === "app.climasys.entrsolutions.com") {
    return 'https://api.climasys.entrsolutions.com';
  }
  
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  return 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl();
console.log('Using API URL in App:', API_BASE_URL);

axios.interceptors.response.use(undefined, async (error) => {
  const config = error.config;
  
  if (error.message === 'canceled' || config._retryCount >= 2) {
    return Promise.reject(error);
  }
  
  config._retryCount = config._retryCount || 0;
  config._retryCount += 1;
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return axios(config);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 5 * 60 * 1000,
    },
  },
});

const CPanelSetupInstructions = () => (
  <div className="mt-6 text-left text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
    <h4 className="font-semibold mb-2">cPanel Setup Instructions:</h4>
    <ol className="list-decimal pl-4 space-y-2">
      <li>Log in to your cPanel account at your hosting provider</li>
      <li>Navigate to the Node.js section</li>
      <li>Make sure your application is set up with:</li>
      <ul className="list-disc pl-6 mt-1 mb-2">
        <li>Node.js version: 14 or higher</li>
        <li>Application root: The directory where your server.js is located</li>
        <li>Application URL: / (just a single slash for root domain access)</li>
        <li>Application startup file: server.js</li>
      </ul>
      <li>Create a .env file in your server directory with these settings:</li>
      <div className="bg-gray-100 dark:bg-gray-800 p-2 my-2 rounded overflow-auto">
        <pre className="text-xs text-gray-800 dark:text-gray-200">
          DB_HOST=localhost<br/>
          DB_USER=entrsolu_medisyncuser<br/>
          DB_PASSWORD=your_database_password<br/>
          DB_NAME=entrsolu_medisync<br/>
          NODE_ENV=production
        </pre>
      </div>
      <li>Click "Run NPM Install" to install dependencies</li>
      <li>Click "Run JS script" to start your server</li>
      <li>Test your server by visiting:<br/>
        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
          https://climasys.entrsolutions.com/api/health
        </code>
      </li>
    </ol>
    <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md">
      <p className="text-yellow-800 dark:text-yellow-300 text-xs">
        <strong>Note:</strong> If the server is still unavailable after following these steps, 
        check your cPanel error logs for Node.js errors and ensure your MySQL database exists
        with correct credentials.
      </p>
    </div>
  </div>
);

const ServerConfigurationChecker = ({ isProduction }) => {
  if (!isProduction) return null;

  return (
    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md text-sm">
      <h5 className="font-medium mb-2 text-blue-800 dark:text-blue-300 flex items-center">
        <Server className="h-4 w-4 mr-1" /> API Server Configuration:
      </h5>
      <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400 text-xs">
        <li>Your frontend is hosted at: <strong>{window.location.origin}</strong></li>
        <li>Your API server is configured at: <strong>{API_BASE_URL}</strong></li>
        <li>Ensure CORS is configured on your API server to allow requests from this domain</li>
        <li>DNS records must be properly configured for both domains</li>
      </ul>
    </div>
  );
};

const ServerChecker = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [serverError, setServerError] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [serverDetails, setServerDetails] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState(new Date());
  const [skipCheck, setSkipCheck] = useState(false);
  const maxRetries = 3;
  const isProduction = window.location.hostname === "climasys.entrsolutions.com";
  const isLovablePreview = window.location.hostname.includes('lovableproject.com');

  const handleManualCheck = () => {
    setIsChecking(true);
    setRetryCount(0);
    setLastChecked(new Date());
  };
  
  const handleSkipCheck = () => {
    setSkipCheck(true);
    setIsChecking(false);
    localStorage.setItem('skipServerCheck', 'true');
  };

  useEffect(() => {
    if (isLovablePreview) {
      setSkipCheck(true);
      setIsChecking(false);
      console.log('Running in Lovable preview - skipping server check');
      return;
    }
    
    const shouldSkipCheck = localStorage.getItem('skipServerCheck') === 'true';
    if (shouldSkipCheck) {
      setSkipCheck(true);
      setIsChecking(false);
      return;
    }
    
    if (!API_BASE_URL) {
      setSkipCheck(true);
      setIsChecking(false);
      return;
    }
    
    const healthCheckUrl = `${API_BASE_URL}/api/health`;
    setServerUrl(healthCheckUrl);
    console.log('Checking server health at:', healthCheckUrl);
    
    const rootUrl = API_BASE_URL;
    
    const checkServer = async () => {
      try {
        console.log('Attempting server health check...');
        const response = await axios.get(healthCheckUrl, { timeout: 8000 });
        console.log('Server health check response:', response.data);
        setIsServerRunning(true);
        setServerError('');
        setServerDetails(response.data);
        
        if (response.data.status === 'WARNING') {
          toast.warning(
            'Database connection issue',
            { 
              description: response.data.database.message,
              duration: 5000
            }
          );
        }
        
        localStorage.setItem('lastSuccessfulServerCheck', new Date().toISOString());
        setIsChecking(false);
      } catch (error) {
        console.error('Health endpoint error:', error);
        
        try {
          console.log('Trying server root URL as fallback...');
          const rootResponse = await axios.get(rootUrl, { timeout: 5000 });
          console.log('Server root response:', rootResponse.data);
          setIsServerRunning(true);
          setServerError('');
          setServerDetails({ 
            note: 'Connected to server root, but health check failed',
            rootData: rootResponse.data
          });
          setIsChecking(false);
          
          localStorage.setItem('lastSuccessfulServerCheck', new Date().toISOString());
        } catch (rootError) {
          console.error('Backend server connection issue:', rootError);
          
          let errorMessage = 'Connection to the server failed';
          let errorType = 'server';
          
          if (rootError.code === 'ECONNABORTED') {
            errorMessage = 'Connection timeout. Server may be overloaded.';
          } else if (rootError.response) {
            if (rootError.response.status === 503) {
              errorMessage = 'Server is unavailable (503). The Node.js application is not running.';
              errorType = 'server';
            } else if (rootError.response.status === 404) {
              errorMessage = 'Path not found (404). The server path may be incorrect.';
              errorType = 'path';
            } else {
              errorMessage = `Server error: ${rootError.response.status}`;
            }
          } else if (rootError.code === 'ERR_NETWORK') {
            errorMessage = 'Network error. Server may be offline or blocked by firewall.';
            errorType = 'firewall';
          }
          
          setServerError(errorMessage);
          
          if (retryCount < maxRetries) {
            setRetryCount(prevCount => prevCount + 1);
            
            toast.error(
              'Server connection error',
              { 
                description: `${errorMessage}. Retrying... (${retryCount + 1}/${maxRetries})`,
                duration: 3000
              }
            );
            
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
        }
      }
    };

    if (isChecking) {
      checkServer();
    }
  }, [retryCount, isChecking, isLovablePreview, API_BASE_URL]);

  if (isChecking && !skipCheck) {
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
          <button 
            onClick={handleSkipCheck}
            className="mt-4 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:underline"
          >
            Skip check and continue to app
          </button>
        </div>
      </div>
    );
  }

  if (!isServerRunning && !isChecking && !skipCheck) {
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
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Last check: {lastChecked.toLocaleTimeString()}</p>
            
            {isProduction ? (
              <>
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
                  <div className="flex items-center mb-2">
                    <Server className="h-4 w-4 text-red-500 mr-2" />
                    <p className="text-red-800 dark:text-red-300 font-semibold">
                      Node.js Server Not Running
                    </p>
                  </div>
                  <p className="text-red-700 dark:text-red-400 text-xs">
                    The server application is not running in cPanel. You need to start the Node.js application in your cPanel interface.
                  </p>
                </div>
                
                <ServerConfigurationChecker isProduction={isProduction} />
                <CPanelSetupInstructions />
              </>
            ) : (
              <>
                <p className="mb-2">Common issues:</p>
                <ul className="list-disc list-inside text-left mb-4">
                  <li>Server is not running at <code>{API_BASE_URL}</code></li> 
                  <li>Path structure may be incorrect (should be "/server/api/health")</li>
                  <li>Database connection issue on the server side</li>
                </ul>
              </>
            )}
            
            <div className="flex justify-center space-x-3 mt-4">
              <button 
                onClick={handleManualCheck} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Again
              </button>
              <button 
                onClick={handleSkipCheck}
                className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
              >
                Skip & Continue
              </button>
              {isProduction && (
                <a
                  href="https://climasys.entrsolutions.com/cpanel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to cPanel
                </a>
              )}
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
  
  useEffect(() => {
    if (!user) return;
    
    const { getAppointmentsByPatientId } = require('@/context/DataContext').useData();
    
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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/Login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/Register" element={<Register />} />
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
