
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      // Toast notification is already handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              to="/register"
              className="font-medium text-medical-secondary hover:text-medical-primary"
            >
              Don't have an account? Register
            </Link>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full bg-medical-primary hover:bg-medical-secondary"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
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
              className="text-xs"
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
              className="text-xs"
            >
              Doctor
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail('student@example.com');
                setPassword('password');
              }}
              className="text-xs"
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
              className="text-xs"
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
