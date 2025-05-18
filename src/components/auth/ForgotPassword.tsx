
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import axios from 'axios';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess?: (email: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const isPreviewMode = window.location.hostname.includes('lovableproject.com');

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
  
  const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isPreviewMode) {
        // Simulate API request in preview mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock reset link
        const mockToken = Math.random().toString(36).substring(2, 15);
        const mockResetLink = `/reset-password/${mockToken}`;
        
        setResetLink(mockResetLink);
        setIsSuccess(true);
        if (onSuccess) onSuccess(email);
        
      } else {
        // Real API request
        const response = await apiClient.post('/users/forgot-password', { email });
        
        if (response.data.resetLink) {
          setResetLink(response.data.resetLink);
        }
        
        if (response.data.requiresManualReset) {
          toast.warning('Email system is offline. Please use the manual reset link provided.');
        } else {
          toast.success('Password reset instructions sent to your email.');
        }
        
        setIsSuccess(true);
        if (onSuccess) onSuccess(email);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      let errorMessage = 'Failed to process password reset request';
      
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-green-800">Check your email</h3>
              <p className="text-sm text-green-700 mt-1">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              {resetLink && isPreviewMode && (
                <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                  <p className="font-medium">Preview Mode: Use this link to reset your password:</p>
                  <a 
                    href={resetLink} 
                    className="text-blue-600 underline break-all block mt-1"
                  >
                    {resetLink}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            If you don't see the email in your inbox, check your spam folder or request another reset link.
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={onBack}
              className="flex-1"
            >
              Back to Login
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setResetLink(null);
              }}
              className="flex-1 bg-medical-primary"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-medical-primary">Forgot Password?</h2>
        <p className="text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="pl-10"
              disabled={isLoading}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
          </div>
        </div>
        
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full bg-medical-secondary hover:bg-medical-primary text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Sending Reset Link...
              </div>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </div>
      </form>
      
      <div className="pt-4">
        <Button
          variant="ghost"
          type="button"
          onClick={onBack}
          className="flex items-center justify-center text-medical-primary hover:text-medical-secondary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>
      </div>
    </div>
  );
};

export default ForgotPassword;
