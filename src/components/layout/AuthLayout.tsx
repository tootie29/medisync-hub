
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-primary"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side with logo, tagline and green columns */}
      <div className="hidden lg:flex lg:flex-col lg:w-2/3 justify-center items-center p-8 relative">
        {/* Three vertical color columns */}
        <div className="absolute top-0 left-0 h-full flex">
          <div className="w-[100px] h-full bg-medical-primary"></div>
          <div className="w-[100px] h-full bg-medical-secondary"></div>
          <div className="w-[100px] h-full bg-medical-accent"></div>
        </div>
        
        <div className="text-center z-10">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png" 
              alt="Olivarez Clinic Logos" 
              className="h-64 object-contain"
            />
          </div>
          <h1 className="text-5xl font-bold text-black mb-2">OLIVAREZ CLINIC</h1>
          <p className="text-2xl text-gray-800">Health at Your Fingertips</p>
        </div>
      </div>
      
      {/* Right side with auth form */}
      <div className="w-full lg:w-1/3 flex items-center justify-center p-4">
        <div className="olivarez-card w-full max-w-md">
          <div className="lg:hidden mb-6 text-center">
            <img 
              src="/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png" 
              alt="Olivarez Clinic Logos" 
              className="h-32 mx-auto object-contain"
            />
            <h1 className="text-3xl font-bold text-medical-primary">OLIVAREZ CLINIC</h1>
            <p className="text-lg text-gray-700">Health at Your Fingertips</p>
          </div>
          
          <div className="border-2 border-medical-primary rounded-md p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
