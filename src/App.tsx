
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import HealthMonitoring from './pages/HealthMonitoring';
import MedicalRecords from './pages/MedicalRecords';
import Appointments from './pages/Appointments';
import BMICalculator from './pages/BMICalculator';
import Certificate from './pages/Certificate';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import VerifyEmail from './pages/VerifyEmail';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';

// Protected route component to handle authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/health-monitoring" element={<ProtectedRoute><HealthMonitoring /></ProtectedRoute>} />
        <Route path="/medical-records" element={<ProtectedRoute><MedicalRecords /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
        <Route path="/bmi-calculator" element={<ProtectedRoute><BMICalculator /></ProtectedRoute>} />
        <Route path="/certificate/:id?" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" />
    </Router>
  );
};

export default App;
