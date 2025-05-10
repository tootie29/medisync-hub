
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface LogoDisplayProps {
  uploadSuccess: boolean;
  error: string | null;
}

const LogoDisplay: React.FC<LogoDisplayProps> = ({ uploadSuccess, error }) => {
  return (
    <>
      {uploadSuccess && (
        <Alert variant="info" className="bg-green-100 border-green-200">
          <AlertTitle className="text-green-600 font-medium flex items-center gap-2">
            <div className="h-5 w-5 text-green-600 mt-0.5">✓</div>
            Logo upload successful!
          </AlertTitle>
          <AlertDescription className="text-green-600/80">
            The logos have been successfully uploaded and saved. They should appear on the login page shortly.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default LogoDisplay;
