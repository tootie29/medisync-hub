
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { CLIENT_FALLBACK_LOGO_PATH } from './SiteSettingsModel';
import LogoUploader from './LogoUploader';
import LogoDisplay from './LogoDisplay';
import LogoControls from './LogoControls';

const LogoManagement = () => {
  const [primaryLogo, setPrimaryLogo] = useState<File | null>(null);
  const [secondaryLogo, setSecondaryLogo] = useState<File | null>(null);
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState<string>('');
  const [secondaryLogoUrl, setSecondaryLogoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Reference to uploader components
  const primaryUploaderRef = React.useRef<any>(null);
  const secondaryUploaderRef = React.useRef<any>(null);

  useEffect(() => {
    fetchLogos();
  }, [lastRefresh]);

  const fetchLogos = async () => {
    setIsLoadingLogos(true);
    setError(null);
    try {
      console.log('LogoManagement: Fetching logos...');
      
      // Add cache busting to force refresh
      const timestamp = Date.now();
      const cacheBuster = `?t=${timestamp}`;
      
      const primaryResponse = await axios.get(`/api/logos/primary${cacheBuster}`);
      console.log('LogoManagement: Primary logo response:', primaryResponse.data);
      
      if (primaryResponse.data && primaryResponse.data.url) {
        setPrimaryLogoUrl(`${primaryResponse.data.url}${cacheBuster}`);
      } else {
        setPrimaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      }
      
      const secondaryResponse = await axios.get(`/api/logos/secondary${cacheBuster}`);
      console.log('LogoManagement: Secondary logo response:', secondaryResponse.data);
      
      if (secondaryResponse.data && secondaryResponse.data.url) {
        setSecondaryLogoUrl(`${secondaryResponse.data.url}${cacheBuster}`);
      } else {
        setSecondaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      }
      
      setUploadSuccess(false);
    } catch (error) {
      console.error('LogoManagement: Error fetching logos:', error);
      setError('Failed to load logos. Please try again.');
      toast.error('Failed to load logos');
      
      const timestamp = Date.now();
      setPrimaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      setSecondaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
    } finally {
      setIsLoadingLogos(false);
    }
  };

  const handleLogoUpdated = (type: 'primary' | 'secondary') => {
    toast.success(`${type === 'primary' ? 'Primary' : 'Secondary'} logo updated successfully`);
    setUploadSuccess(true);
    
    // Refresh logos after a short delay
    setTimeout(() => {
      setLastRefresh(Date.now());
      window.dispatchEvent(new CustomEvent('refreshLogos'));
    }, 2000);
  };

  const handleError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const handleManualRefresh = () => {
    setLastRefresh(Date.now());
    fetchLogos();
    toast.info('Refreshing logos...');
    
    window.dispatchEvent(new CustomEvent('refreshLogos'));
  };

  return (
    <div className="space-y-6">
      <LogoDisplay 
        uploadSuccess={uploadSuccess}
        error={error}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LogoUploader
          logoType="primary"
          currentLogoUrl={primaryLogoUrl}
          isLoading={isLoading}
          isLoadingLogos={isLoadingLogos}
          onLogoUpdated={() => handleLogoUpdated('primary')}
          onError={handleError}
        />
        
        <LogoUploader
          logoType="secondary"
          currentLogoUrl={secondaryLogoUrl}
          isLoading={isLoading}
          isLoadingLogos={isLoadingLogos}
          onLogoUpdated={() => handleLogoUpdated('secondary')}
          onError={handleError}
        />
      </div>
      
      <LogoControls
        isLoading={isLoading}
        isLoadingLogos={isLoadingLogos}
        hasSelectedLogos={!!primaryLogo || !!secondaryLogo}
        onSubmit={async (e) => {
          e.preventDefault();
          setIsLoading(true);
          try {
            // This is a legacy method kept for backward compatibility
            // The direct upload in LogoUploader is now the primary method
            handleManualRefresh();
          } finally {
            setIsLoading(false);
          }
        }}
        onRefresh={handleManualRefresh}
      />
    </div>
  );
};

export default LogoManagement;
