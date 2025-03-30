
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Toaster } from './components/ui/sonner';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import HealthMonitoring from './pages/HealthMonitoring';
import BMICalculator from './pages/BMICalculator';
import Profile from './pages/Profile';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import PatientEdit from './pages/PatientEdit';

// Import styles
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/records" element={<MedicalRecords />} />
                <Route path="/health" element={<HealthMonitoring />} />
                <Route path="/bmi" element={<BMICalculator />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Patient edit route for doctors */}
                <Route path="/patients/edit/:id" element={<PatientEdit />} />
              </Route>
              
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate replace to="/404" />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
