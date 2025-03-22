
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
      {/* Left column - dark green */}
      <div className="w-1/3 bg-medical-primary"></div>
      
      {/* Middle section with logos and clinic name */}
      <div className="w-1/3 bg-white flex flex-col justify-center items-center p-8">
        <div className="text-center">
          <div className="flex flex-col justify-center items-center gap-4 mb-8">
            <img 
              src="/lovable-uploads/8992c8e4-85b3-4819-b2b5-238b581a4f05.png" 
              alt="Olivarez Clinic Logo 1" 
              className="h-32 object-contain"
            />
            <img 
              src="/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png" 
              alt="Olivarez Clinic Logo 2" 
              className="h-32 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-black mb-4">OLIVAREZ CLINIC</h1>
          <p className="text-xl text-gray-800">Health at Your Fingertips</p>
        </div>
      </div>
      
      {/* Right column - light green */}
      <div className="w-1/3 bg-medical-light flex items-center justify-center p-8">
        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
