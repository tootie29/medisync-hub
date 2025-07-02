import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Navigate,
} from "react-router-dom";
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import StaffRegistration from '@/pages/StaffRegistration';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import MedicalRecords from '@/pages/MedicalRecords';
import Appointments from '@/pages/Appointments';
import Inventory from '@/pages/Inventory';
import VerifyEmail from '@/pages/VerifyEmail';
import ResetPassword from '@/pages/ResetPassword';
import Certificate from '@/pages/Certificate';
import BMICalculator from '@/pages/BMICalculator';
import HealthMonitoring from '@/pages/HealthMonitoring';
import NotFound from '@/pages/NotFound';
import Settings from '@/pages/Settings';
import OrangeCard from '@/pages/OrangeCard';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/staff-register",
    element: <StaffRegistration />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/medical-records",
    element: <MedicalRecords />,
  },
  {
    path: "/record",
    element: <Navigate to="/medical-records" replace />,
  },
  {
    path: "/appointments",
    element: <Appointments />,
  },
  {
    path: "/inventory",
    element: <Inventory />,
  },
  {
    path: "/verify/:token", 
    element: <VerifyEmail /> 
  },
  {
    path: "/reset-password/:token", 
    element: <ResetPassword /> 
  },
  {
    path: "/certificate",
    element: <Certificate />
  },
  {
    path: "/bmi",
    element: <BMICalculator />
  },
  {
    path: "/health-monitoring",
    element: <HealthMonitoring />
  },
  {
    path: "/orange-card",
    element: <OrangeCard />
  },
  {
    path: "/settings",
    element: <Settings />
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

export default App;
