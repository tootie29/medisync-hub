
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMediaQuery } from '@/hooks/use-mobile';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery("(max-width: 1023px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isSmallDesktop = useMediaQuery("(min-width: 1024px) and (max-width: 1279px)");
  
  // Only using the primary logo now (School logo)
  const primaryLogoUrl = "/lovable-uploads/f843d17e-c042-4114-8d85-23f87017db35.png"; // School logo

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
          {/* Only one logo now (centered) */}
          <div className="flex justify-center items-center mb-6">
            <div className="flex flex-col justify-center items-center">
              <img 
                src={primaryLogoUrl} 
                alt="Olivarez College Logo" 
                className={`${isSmallDesktop ? 'h-40 w-auto' : 'h-64 w-auto'} object-contain`}
              />
            </div>
          </div>
          <h1 className={`${isSmallDesktop ? 'text-3xl' : 'text-5xl'} font-bold text-black mb-2`}>OLIVAREZ CLINIC</h1>
          <p className={`${isSmallDesktop ? 'text-lg' : 'text-2xl'} text-gray-800`}>Health at Your Fingertips</p>
        </div>
      </div>
      
      {/* Right side with auth form */}
      <div className="w-full lg:w-1/3 flex items-center justify-center p-4">
        <div className="olivarez-card w-full max-w-md">
          {/* Mobile and Tablet view */}
          <div className="lg:hidden mb-6 text-center">
            {/* Single logo for responsive views */}
            <div className="flex justify-center items-center mb-4 px-4">
              <div className="flex flex-col justify-center">
                <img 
                  src={primaryLogoUrl} 
                  alt="Olivarez College Logo" 
                  className={`${isTablet ? 'h-20' : 'h-16'} w-auto object-contain`}
                />
              </div>
            </div>
            <h1 className={`font-bold text-medical-primary ${isTablet ? 'text-3xl' : 'text-2xl'}`}>OLIVAREZ CLINIC</h1>
            <p className={`text-gray-700 ${isTablet ? 'text-lg' : 'text-base'}`}>Health at Your Fingertips</p>
          </div>
          
          <div className="border-2 border-medical-primary rounded-md p-6">
            {title && <h2 className="text-2xl font-bold text-medical-primary mb-6 text-center">{title}</h2>}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
