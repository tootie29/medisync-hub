
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
      {/* Three columns with different shades of green */}
      <div className="w-[10%] bg-[#00a651]"></div> {/* Dark green */}
      <div className="w-[10%] bg-[#73c35c]"></div> {/* Medium green */}
      <div className="w-[15%] bg-[#d8ef8b]"></div> {/* Light green */}
      
      {/* Middle white section with logos and clinic name */}
      <div className="w-[40%] bg-white flex flex-col justify-center items-center p-8">
        <div className="text-center">
          <div className="flex justify-center gap-8 mb-8">
            <img 
              src="/lovable-uploads/8992c8e4-85b3-4819-b2b5-238b581a4f05.png" 
              alt="College of Nursing Logo" 
              className="h-48 object-contain"
            />
            <img 
              src="/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png" 
              alt="Olivarez College Logo" 
              className="h-48 object-contain"
            />
          </div>
          <h1 className="text-6xl font-bold text-black mb-4">OLIVAREZ CLINIC</h1>
          <p className="text-2xl text-gray-800">Health at Your Fingertips</p>
        </div>
      </div>
      
      {/* Right side with auth form */}
      <div className="w-[25%] bg-white flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
