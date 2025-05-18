
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Loader2, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

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
  const [autoVerified, setAutoVerified] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [emailDetails, setEmailDetails] = useState<{
    previewUrl?: string; 
    success: boolean;
    requiresManualVerification?: boolean;
    verificationLink?: string;
    errorDetails?: any;
  } | null>(null);
  
  const isPreviewMode = window.location.hostname.includes('lovableproject.com');

  // Handle auto-verification countdown in preview mode
  useEffect(() => {
    if (isPreviewMode && email && !autoVerified) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setAutoVerified(true);
            toast.success("Your account has been automatically verified!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isPreviewMode, email, autoVerified]);

  const handleResendVerification = async () => {
    if (!inputEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    setEmailDetails(null); // Reset previous results
    
    try {
      console.log('Resending verification email to:', inputEmail);
      const result = await resendVerification(inputEmail);
      console.log('Resend verification result:', result);
      setResent(true);
      
      // For preview mode, show the verification link directly
      if (isPreviewMode && result.verificationLink) {
        setVerificationInfo(`Since this is a preview environment, your account will be automatically verified in a few seconds. If not, you can visit this verification link: ${result.verificationLink}`);
      } else if (result.requiresManualVerification) {
        // Case where manual verification is required (no nodemailer)
        setEmailDetails({
          success: false,
          requiresManualVerification: true,
          verificationLink: result.verificationLink,
          errorDetails: result.errorDetails
        });
        toast.warning('Email system could not send verification email. Please use the manual verification link.');
      } else if (result.emailSent) {
        // For production mode with real email sending
        setEmailDetails({
          success: true,
          previewUrl: result.emailPreviewUrl
        });
        toast.success('Verification email sent successfully!');
      } else {
        // Email sending failed
        setEmailDetails({
          success: false,
          errorDetails: result.errorDetails
        });
        toast.error('Failed to send verification email.');
      }
    } catch (error) {
      console.error('Failed to resend verification:', error);
      toast.error('Failed to resend verification email. Please try again.');
      setEmailDetails({
        success: false
      });
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
              <div className="text-sm text-blue-700">
                <p>
                  <strong>Preview Mode:</strong> In this demonstration environment, your account will be automatically verified 
                  after registration. No actual email will be sent.
                </p>
                {!autoVerified && countdown > 0 && (
                  <p className="mt-1 font-medium">
                    Auto-verifying in {countdown} seconds...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {!isPreviewMode && emailDetails?.requiresManualVerification && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
              <div className="text-sm text-amber-700">
                <p>
                  <strong>Manual Verification Required:</strong> The email verification system is currently 
                  unable to send emails. This could be due to SMTP configuration issues or server limitations.
                  Please use the manual verification link below:
                </p>
                {emailDetails.verificationLink && (
                  <div className="mt-2 p-2 bg-amber-100 rounded text-xs overflow-x-auto break-all">
                    {emailDetails.verificationLink}
                  </div>
                )}
                {emailDetails.errorDetails && (
                  <div className="mt-2 text-xs">
                    <p><strong>Error details:</strong> {JSON.stringify(emailDetails.errorDetails)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {!isPreviewMode && !emailDetails?.requiresManualVerification && !autoVerified && !emailDetails?.success && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
              <div className="text-sm text-amber-700">
                <p>
                  <strong>Email Configuration Required:</strong> For email verification to work properly, 
                  the server needs to be configured with SMTP settings in the .env file:
                </p>
                <pre className="mt-1 p-2 bg-amber-100 rounded text-xs overflow-x-auto">
                  SMTP_HOST=your-smtp-server.com<br />
                  SMTP_PORT=587<br />
                  SMTP_USER=your-username<br />
                  SMTP_PASS=your-password<br />
                  SMTP_SECURE=false<br />
                  SMTP_FROM=noreply@yourcompany.com
                </pre>
                <p className="mt-2 text-xs">
                  <strong>Note:</strong> For Gmail accounts, you need to use an App Password instead of your regular password.
                  <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="block underline ml-1">
                    Learn how to create an App Password
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
        
        {autoVerified && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              <p className="text-sm text-green-700">
                <strong>Auto-verification complete!</strong> You can now login with your credentials.
              </p>
            </div>
          </div>
        )}
        
        {emailDetails && !emailDetails.requiresManualVerification && (
          <div className={`mt-4 p-3 ${emailDetails.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} rounded-md`}>
            <div className="flex items-start">
              {emailDetails.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
              )}
              <div className="text-sm text-gray-700">
                {emailDetails.success ? (
                  <>
                    <p className="font-medium text-green-700">Email sent successfully!</p>
                    <p>Please check your inbox and spam folders for the verification link.</p>
                    {emailDetails.previewUrl && (
                      <>
                        <p className="mt-2">Using test email service. View the email at:</p>
                        <a 
                          href={emailDetails.previewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {emailDetails.previewUrl}
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-red-700">Failed to send verification email. Please try again or contact support if the issue persists.</p>
                    {emailDetails.errorDetails && (
                      <details className="mt-2 p-2 bg-red-50 rounded text-xs">
                        <summary className="font-medium">Error details</summary>
                        <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(emailDetails.errorDetails, null, 2)}
                        </pre>
                      </details>
                    )}
                  </>
                )}
              </div>
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
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          disabled={isResending || !inputEmail || autoVerified}
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

        {resent && !verificationInfo && !autoVerified && !emailDetails && (
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
            className="text-sm font-medium text-green-700 hover:underline"
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
