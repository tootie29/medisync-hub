
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Loader2, Info } from 'lucide-react';

interface EmailVerificationProps {
  email: string | null;
  onBack: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ email, onBack }) => {
  const { resendVerification } = useAuth();
  const [inputEmail, setInputEmail] = useState(email || '');
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState<string | null>(null);
  
  const isPreviewMode = window.location.hostname.includes('lovableproject.com');

  const handleResendVerification = async () => {
    if (!inputEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const result = await resendVerification(inputEmail);
      setResent(true);
      
      // For preview mode, show the verification link directly
      if (isPreviewMode && result.verificationLink) {
        setVerificationInfo(`Since this is a preview environment, your account will be automatically verified in a few seconds. If not, you can visit this verification link: ${result.verificationLink}`);
      }
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
        
        {isPreviewMode && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
              <p className="text-sm text-blue-700">
                <strong>Preview Mode:</strong> In this demonstration environment, your account will be automatically verified 
                after registration. No actual email will be sent.
              </p>
            </div>
          </div>
        )}
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

        {resent && !verificationInfo && (
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
        
        {verificationInfo && (
          <div className="rounded-md bg-blue-50 p-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  {verificationInfo}
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
