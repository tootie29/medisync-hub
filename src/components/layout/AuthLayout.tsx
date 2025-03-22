
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
    <div className="min-h-screen green-gradient-bg flex items-center justify-center">
      {/* Left side with logos and tagline */}
      <div className="hidden md:flex md:flex-col md:w-1/2 justify-center items-center p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6 space-x-8">
            <img 
              src="/lovable-uploads/5e5a5fb9-952d-4181-b79f-cf3ec8d29388.png" 
              alt="Olivarez Clinic Logos" 
              className="max-w-[600px] object-contain"
            />
          </div>
          <h1 className="text-5xl font-bold text-black mb-2">OLIVAREZ CLINIC</h1>
          <p className="text-2xl text-gray-800">Health at Your Fingertips</p>
        </div>
      </div>
      
      {/* Right side with auth form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-6 text-center">
            <img 
              src="/lovable-uploads/5e5a5fb9-952d-4181-b79f-cf3ec8d29388.png" 
              alt="Olivarez Clinic Logos" 
              className="h-32 mx-auto object-contain"
            />
            <h1 className="text-3xl font-bold text-black">OLIVAREZ CLINIC</h1>
            <p className="text-lg text-gray-800">Health at Your Fingertips</p>
          </div>
          
          <div className="bg-white border-4 border-medical-primary rounded-lg p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
