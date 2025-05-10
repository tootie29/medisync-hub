
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw, Info } from 'lucide-react';

interface LogoControlsProps {
  isLoading: boolean;
  isLoadingLogos: boolean;
  hasSelectedLogos: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onRefresh: () => void;
}

const LogoControls: React.FC<LogoControlsProps> = ({
  isLoading,
  isLoadingLogos,
  hasSelectedLogos,
  onSubmit,
  onRefresh
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <Button
        onClick={onSubmit}
        disabled={isLoading || !hasSelectedLogos}
        className="bg-medical-primary hover:bg-medical-secondary text-white w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Update Logos
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingLogos ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      
      <div className="flex items-center mt-2 sm:mt-0 text-xs text-gray-500">
        <Info className="h-3 w-3 mr-1" />
        Recommended size: 500KB or less
      </div>
    </div>
  );
};

export default LogoControls;
