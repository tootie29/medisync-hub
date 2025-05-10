import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
} from "react-router-dom";
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import MedicalRecords from '@/pages/MedicalRecords';
import Appointments from '@/pages/Appointments';
import Medicines from '@/pages/Medicines';
import AdminDashboard from '@/pages/AdminDashboard';
import VerifyEmail from '@/pages/VerifyEmail';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
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
    path: "/appointments",
    element: <Appointments />,
  },
  {
    path: "/medicines",
    element: <Medicines />,
  },
  {
    path: "/admin-dashboard",
    element: <AdminDashboard />,
  },
  { 
    path: "/verify/:token", 
    element: <VerifyEmail /> 
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
