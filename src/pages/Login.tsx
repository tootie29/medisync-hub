import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, User, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import EmailVerification from '@/components/auth/EmailVerification';

const Login: React.FC = () => {
  const { login, verificationEmail, setVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [connectivityError, setConnectivityError] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showVerification, setShowVerification] = React.useState(false);

  // Get URL parameters for email verification
  const searchParams = new URLSearchParams(location.search);
  const verified = searchParams.get('verified');
  const verificationMessage = searchParams.get('message');
  const verifiedEmail = searchParams.get('email');

  React.useEffect(() => {
    // Show toast message based on verification result
    if (verified === 'true') {
      toast.success('Email verified successfully! You can now log in.');
      if (verifiedEmail) {
        setEmail(verifiedEmail);
      }
    } else if (verified === 'false' && verificationMessage) {
      toast.error(verificationMessage);
    }
  }, [verified, verificationMessage, verifiedEmail]);

  React.useEffect(() => {
    // If there's a verification email, show the verification screen
    if (verificationEmail) {
      setEmail(verificationEmail);
      setShowVerification(true);
    }
  }, [verificationEmail]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
      
      // Check if this might be due to an unverified email
      if (error.message && error.message.toLowerCase().includes('not verified')) {
        setShowVerification(true);
        return;
      }
      
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

  const handleBackToLogin = () => {
    setShowVerification(false);
    setVerificationEmail(null);
  };

  if (showVerification) {
    return (
      <AuthLayout>
        <EmailVerification email={email} onBack={handleBackToLogin} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-medical-primary">ADMISSION LOG IN</h2>
      </div>

      {/* Verification success message */}
      {verified === 'true' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700">Your email has been verified successfully! You can now log in.</p>
          </div>
        </div>
      )}

      {connectivityError && (
        <div className="bg-destructive/15 p-3 rounded-md mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive">Connection Error</h3>
              <p className="text-sm text-destructive/90 mt-1">
                Unable to connect to the server. Please check your internet connection and try again.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleRetry}
              >
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email" className="text-xl font-bold block mb-2">USERNAME</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="auth-input pl-10"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-primary h-5 w-5" />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="text-xl font-bold block mb-2">PASSWORD</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="auth-input pl-10 pr-10"
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-primary h-5 w-5" />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-medical-primary h-5 w-5"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-medical-secondary hover:bg-medical-primary text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
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
              className="font-medium text-medical-primary hover:text-medical-secondary"
            >
              Don't have an account? Register
            </Link>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500 text-center">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail('admin@example.com');
                setPassword('password');
              }}
              className="text-xs border-medical-primary text-medical-primary hover:bg-medical-light"
            >
              Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail('doctor@example.com');
                setPassword('password');
              }}
              className="text-xs border-medical-primary text-medical-primary hover:bg-medical-light"
            >
              Head Nurse
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail('student@example.com');
                setPassword('password');
              }}
              className="text-xs border-medical-primary text-medical-primary hover:bg-medical-light"
            >
              Student
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail('staff@example.com');
                setPassword('password');
              }}
              className="text-xs border-medical-primary text-medical-primary hover:bg-medical-light"
            >
              Staff
            </Button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
