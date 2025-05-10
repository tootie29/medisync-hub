
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/health-monitoring" element={<HealthMonitoring />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/bmi-calculator" element={<BMICalculator />} />
        <Route path="/certificate/:id?" element={<Certificate />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" />
    </Router>
  );
};

export default App;
