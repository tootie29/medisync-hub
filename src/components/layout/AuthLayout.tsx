import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMediaQuery } from '@/hooks/use-mobile';
import axios from 'axios';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface Logo {
  id: string;
  url: string;
  position: 'primary' | 'secondary';
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery("(max-width: 1023px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isSmallDesktop = useMediaQuery("(min-width: 1024px) and (max-width: 1279px)");
  
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState<string>('/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png');
  const [secondaryLogoUrl, setSecondaryLogoUrl] = useState<string>('/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png');
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      const response = await axios.get('/api/logos');
      const logos: Logo[] = response.data;
      
      const primary = logos.find(logo => logo.position === 'primary');
      const secondary = logos.find(logo => logo.position === 'secondary');
      
      if (primary) {
        setPrimaryLogoUrl(primary.url);
      }
      
      if (secondary) {
        setSecondaryLogoUrl(secondary.url);
      }
    } catch (error) {
      console.error('Error fetching logos:', error);
      // Keep default logos on error
    } finally {
      setIsLoadingLogos(false);
    }
  };

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
          {/* Two logos side by side with spacing - responsiveness for small desktop */}
          <div className="flex justify-center items-center space-x-6 mb-6">
            <div className="flex flex-col justify-center items-center">
              <img 
                src={primaryLogoUrl} 
                alt="Olivarez Clinic Logo" 
                className={`${isSmallDesktop ? 'h-32 w-auto' : 'h-56 w-auto'} object-contain`}
              />
            </div>
            <div className="flex flex-col justify-center items-center">
              <img 
                src={secondaryLogoUrl} 
                alt="Olivarez Clinic Logo" 
                className={`${isSmallDesktop ? 'h-32 w-auto' : 'h-56 w-auto'} object-contain`}
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
            {/* Responsive logos for different screen sizes */}
            <div className="flex justify-center items-center mb-4 px-4">
              {isTablet ? (
                // Tablet view - with better spacing and size control
                <div className="flex justify-center items-center gap-6">
                  <div className="flex flex-col justify-center">
                    <img 
                      src={primaryLogoUrl} 
                      alt="Olivarez Clinic Logo" 
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <img 
                      src={secondaryLogoUrl} 
                      alt="Olivarez Clinic Logo" 
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                </div>
              ) : (
                // Mobile view - vertically aligned logos
                <div className="flex flex-col space-y-3 justify-center items-center">
                  <div className="flex justify-center">
                    <img 
                      src={primaryLogoUrl} 
                      alt="Olivarez Clinic Logo" 
                      className="h-14 w-auto object-contain"
                    />
                  </div>
                  <div className="flex justify-center">
                    <img 
                      src={secondaryLogoUrl} 
                      alt="Olivarez Clinic Logo" 
                      className="h-14 w-auto object-contain"
                    />
                  </div>
                </div>
              )}
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
