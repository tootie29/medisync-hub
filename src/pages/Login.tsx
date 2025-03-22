
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [connectivityError, setConnectivityError] = React.useState(false);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setConnectivityError(false);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Check if this is a network connectivity error
      if (error.message && (
          error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('ERR_NETWORK')
        )) {
        setConnectivityError(true);
      } else {
        // Show the error message
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-container">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold">ADMISSION LOG IN</h2>
        </div>

        {connectivityError && (
          <div className="bg-red-100 p-3 rounded-md mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-500">Connection Error</h3>
                <p className="text-sm text-red-500 mt-1">
                  Unable to connect to the server. Please check your internet connection and try again.
                </p>
                <button 
                  className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm"
                  onClick={handleRetry}
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label htmlFor="email" className="block text-xl font-bold mb-2">USERNAME</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="auth-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xl font-bold mb-2">PASSWORD</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="auth-input"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'SIGN IN'
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/register"
                className="font-medium text-green-700 hover:text-green-600"
              >
                Don't have an account? Register
              </Link>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 text-center">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@example.com');
                  setPassword('password');
                }}
                className="text-xs border border-green-600 text-green-600 hover:bg-green-50 p-1 rounded"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('doctor@example.com');
                  setPassword('password');
                }}
                className="text-xs border border-green-600 text-green-600 hover:bg-green-50 p-1 rounded"
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('student@example.com');
                  setPassword('password');
                }}
                className="text-xs border border-green-600 text-green-600 hover:bg-green-50 p-1 rounded"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('staff@example.com');
                  setPassword('password');
                }}
                className="text-xs border border-green-600 text-green-600 hover:bg-green-50 p-1 rounded"
              >
                Staff
              </button>
            </div>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
