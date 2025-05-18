
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import axios from 'axios';

interface ResetPasswordProps {
  token?: string;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token: propToken }) => {
  const { token: urlToken } = useParams<{ token: string }>();
  const token = propToken || urlToken;
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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

  // Validate token when component mounts
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsValidToken(false);
        return;
      }
      
      try {
        if (isPreviewMode) {
          // Simulate API request in preview mode
          await new Promise(resolve => setTimeout(resolve, 1000));
          setIsValidToken(true);
        } else {
          // Real API request
          const response = await apiClient.get(`/users/validate-reset-token/${token}`);
          setIsValidToken(response.data.success);
          
          if (!response.data.success) {
            toast.error(response.data.message || 'Invalid or expired reset token');
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
        toast.error('Invalid or expired reset token');
      } finally {
        setIsValidating(false);
      }
    };
    
    validateToken();
  }, [token, isPreviewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isPreviewMode) {
        // Simulate API request in preview mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSuccess(true);
        
        // Update the password in local storage for preview mode
        const storedUsers = localStorage.getItem('medisyncRegisteredUsers');
        if (storedUsers) {
          try {
            const users = JSON.parse(storedUsers);
            // This is just for preview demonstration - in a real app we would match by the token
            const updatedUsers = users.map((user: any) => ({
              ...user,
              password: user.email.includes('@') ? password : user.password
            }));
            localStorage.setItem('medisyncRegisteredUsers', JSON.stringify(updatedUsers));
          } catch (error) {
            console.error('Failed to update stored user password', error);
          }
        }
        
      } else {
        // Real API request
        await apiClient.post('/users/reset-password', { token, password });
        setIsSuccess(true);
      }
      
      toast.success('Your password has been reset successfully');
      
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to reset password';
      
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

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isValidating) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="animate-spin h-8 w-8 text-medical-primary" />
          <p className="text-gray-600">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken && !isPreviewMode) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/15 p-4 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-destructive">Invalid Reset Link</h3>
              <p className="text-sm text-destructive/90 mt-1">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
          </div>
        </div>
        
        <Button
          type="button"
          onClick={() => navigate('/login?forgot=true')}
          className="w-full bg-medical-secondary hover:bg-medical-primary text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
        >
          Request New Reset Link
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-green-800">Password Reset Successful</h3>
              <p className="text-sm text-green-700 mt-1">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
            </div>
          </div>
        </div>
        
        <Button
          type="button"
          onClick={handleGoToLogin}
          className="w-full bg-medical-secondary hover:bg-medical-primary text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-medical-primary">Reset Password</h2>
        <p className="text-gray-600">
          Enter a new password for your account.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              disabled={isLoading}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
          </div>
          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-sm text-destructive mt-1">Passwords do not match</p>
          )}
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
                Resetting Password...
              </div>
            ) : (
              'Reset Password'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
