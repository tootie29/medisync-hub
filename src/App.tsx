
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Layouts
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Pages
import Index from './pages/Index'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Appointments from './pages/Appointments'
import MedicalRecords from './pages/MedicalRecords'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import BMICalculator from './pages/BMICalculator'
import HealthMonitoring from './pages/HealthMonitoring'
import Inventory from './pages/Inventory'
import BrandingSettings from './pages/BrandingSettings'

// Auth
import { useAuth } from './context/AuthContext'

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-primary"></div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Route Wrapper
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-primary"></div>
    </div>;
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/appointments" element={
        <ProtectedRoute>
          <MainLayout>
            <Appointments />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/medical-records" element={
        <ProtectedRoute>
          <MainLayout>
            <MedicalRecords />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <MainLayout>
            <Profile />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/bmi-calculator" element={
        <ProtectedRoute>
          <MainLayout>
            <BMICalculator />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/health-monitoring" element={
        <ProtectedRoute>
          <MainLayout>
            <HealthMonitoring />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/inventory" element={
        <ProtectedRoute>
          <MainLayout>
            <Inventory />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/branding-settings" element={
        <AdminRoute>
          <MainLayout>
            <BrandingSettings />
          </MainLayout>
        </AdminRoute>
      } />
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App;
