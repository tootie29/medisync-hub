
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showRegisterLink?: boolean;
  showLoginLink?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showRegisterLink = false,
  showLoginLink = false,
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    // Check if a custom logo exists in localStorage
    const savedLogo = localStorage.getItem('customLogo');
    if (savedLogo) {
      setCustomLogo(savedLogo);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {customLogo ? (
            <img
              src={customLogo}
              alt="Logo"
              className="mx-auto h-16 w-auto"
            />
          ) : (
            <div className="flex justify-center">
              <div className="h-16 w-auto text-gray-700 text-3xl font-bold flex items-center">
                MediSync
              </div>
            </div>
          )}
          {title && (
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        
        {children}
        
        <div className="text-center mt-4">
          {showRegisterLink && (
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
                Register now
              </Link>
            </p>
          )}
          
          {showLoginLink && (
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
