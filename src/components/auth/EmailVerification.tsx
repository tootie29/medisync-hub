
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

interface EmailVerificationProps {
  email: string | null;
  onBack: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ email, onBack }) => {
  const { resendVerification } = useAuth();
  const [inputEmail, setInputEmail] = useState(email || '');
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResendVerification = async () => {
    if (!inputEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      await resendVerification(inputEmail);
      setResent(true);
    } catch (error) {
      console.error('Failed to resend verification:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <Mail className="mx-auto h-12 w-12 text-medical-primary" />
        <h2 className="mt-2 text-2xl font-bold text-medical-primary">Verify Your Email</h2>
        <p className="mt-1 text-sm text-gray-500">
          We've sent a verification link to your email address. 
          Please check your inbox and click on the link to verify your account.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            className="mt-1"
            disabled={isResending}
          />
        </div>

        <Button
          onClick={handleResendVerification}
          className="w-full bg-medical-secondary hover:bg-medical-primary"
          disabled={isResending || !inputEmail}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Resend Verification Link'
          )}
        </Button>

        {resent && (
          <div className="rounded-md bg-green-50 p-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Verification email sent! Please check your inbox.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-sm font-medium text-medical-primary hover:underline"
            type="button"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
