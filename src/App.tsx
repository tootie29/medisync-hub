import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import Inventory from './pages/Inventory';
import HealthMonitoring from './pages/HealthMonitoring';
import BMICalculator from './pages/BMICalculator';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
// Add the new import for the LogoManagement page
import LogoManagement from './pages/LogoManagement';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/medical-records" element={<MedicalRecords />} />
              <Route path="/medical-records/:patientId" element={<MedicalRecords />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/health-monitoring" element={<HealthMonitoring />} />
              <Route path="/bmi-calculator" element={<BMICalculator />} />
              <Route path="/settings" element={<Settings />} />
              {/* Add the new route for logo management */}
              <Route path="/logo-management" element={<LogoManagement />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
