
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/layout/AuthLayout';

const getApiUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === "climasys.entrsolutions.com" || hostname === "app.climasys.entrsolutions.com") {
    return 'https://api.climasys.entrsolutions.com/api';
  }
  
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  return 'http://localhost:8080/api';
};

const API_URL = getApiUrl();

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // For preview mode, simulate verification
        if (window.location.hostname.includes('lovableproject.com')) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const isSuccess = Math.random() > 0.2; // 80% success rate for simulation
          
          if (isSuccess) {
            setStatus('success');
            setMessage('Your email has been verified successfully!');
          } else {
            setStatus('error');
            setMessage('Invalid or expired verification token. Please request a new verification link.');
          }
          
          return;
        }

        // Real verification
        const response = await axios.get(`${API_URL}/users/verify/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Your email has been verified successfully!');
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(
          axios.isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : 'Unable to verify your email. Please try again or request a new verification link.'
        );
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
    }
  }, [token]);

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-medical-primary">Email Verification</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-medical-primary animate-spin mb-4" />
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-green-600 mb-2">Verification Successful!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button onClick={goToLogin} className="bg-medical-primary hover:bg-medical-secondary">
                Proceed to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold text-destructive mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button onClick={goToLogin} className="bg-medical-primary hover:bg-medical-secondary">
                Return to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
