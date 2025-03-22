
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center green-gradient-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side with green gradient */}
      <div className="w-1/5 green-gradient-bg"></div>
      
      {/* Middle section with logos and clinic name */}
      <div className="w-3/5 bg-white flex flex-col justify-center items-center p-8">
        <div className="text-center">
          <div className="flex justify-center gap-8 mb-8">
            <img 
              src="/lovable-uploads/8992c8e4-85b3-4819-b2b5-238b581a4f05.png" 
              alt="Olivarez Clinic Logos" 
              className="h-64 object-contain"
            />
          </div>
          <h1 className="text-6xl font-bold text-black mb-4">OLIVAREZ CLINIC</h1>
          <p className="text-2xl text-gray-800">Health at Your Fingertips</p>
        </div>
      </div>
      
      {/* Right side with auth form */}
      <div className="w-1/5 bg-white flex items-center justify-center p-4">
        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
