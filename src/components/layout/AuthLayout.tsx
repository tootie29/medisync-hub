
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMediaQuery } from '@/hooks/use-mobile';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery("(max-width: 1023px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");

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

  const columnWidth = 300; // Width of the three green columns combined

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left side with logo, tagline and green columns */}
      <div className="hidden lg:flex lg:flex-col lg:w-2/3 justify-center items-center p-8 relative">
        {/* Three vertical color columns */}
        <div className="absolute top-0 left-0 h-full flex">
          <div className="w-[100px] h-full bg-medical-primary"></div>
          <div className="w-[100px] h-full bg-medical-secondary"></div>
          <div className="w-[100px] h-full bg-medical-accent"></div>
        </div>
        
        {/* Content positioned to the right of the green columns with appropriate spacing */}
        <div className="text-center z-10 ml-[300px]">
          {/* Two logos side by side with spacing */}
          <div className="flex justify-center items-center space-x-10 mb-4">
            <img 
              src="/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png" 
              alt="Olivarez Clinic Logo" 
              className="h-64 object-contain"
            />
            <img 
              src="/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png" 
              alt="Olivarez Clinic Logo" 
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
          {/* Mobile and Tablet view */}
          <div className="lg:hidden mb-6 text-center">
            {/* Responsive logos for different screen sizes */}
            <div className="flex justify-center items-center mb-4 px-4">
              {isTablet ? (
                // Tablet view - adjust spacing and size for better fit
                <div className="flex justify-center items-center space-x-4">
                  <img 
                    src="/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png" 
                    alt="Olivarez Clinic Logo" 
                    className="h-24 w-auto object-contain"
                  />
                  <img 
                    src="/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png" 
                    alt="Olivarez Clinic Logo" 
                    className="h-24 w-auto object-contain"
                  />
                </div>
              ) : (
                // Mobile view - smaller logos with less spacing
                <div className="flex justify-center items-center space-x-4">
                  <img 
                    src="/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png" 
                    alt="Olivarez Clinic Logo" 
                    className="h-16 w-auto object-contain"
                  />
                  <img 
                    src="/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png" 
                    alt="Olivarez Clinic Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
              )}
            </div>
            <h1 className={`font-bold text-medical-primary ${isTablet ? 'text-4xl' : 'text-3xl'}`}>OLIVAREZ CLINIC</h1>
            <p className={`text-gray-700 ${isTablet ? 'text-xl' : 'text-lg'}`}>Health at Your Fingertips</p>
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
