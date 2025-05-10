
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { CLIENT_FALLBACK_LOGO_PATH } from './SiteSettingsModel';
import LogoUploader from './LogoUploader';
import LogoDisplay from './LogoDisplay';
import LogoControls from './LogoControls';

const LogoManagement = () => {
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState<string>('');
  const [secondaryLogoUrl, setSecondaryLogoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

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
      
      // Try to use relative paths first, which work in development
      try {
        const primaryResponse = await axios.get(`/api/logos/primary${cacheBuster}`);
        console.log('LogoManagement: Primary logo response:', primaryResponse.data);
        
        if (primaryResponse.data && primaryResponse.data.url) {
          setPrimaryLogoUrl(`${primaryResponse.data.url}${cacheBuster}`);
        } else {
          setPrimaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
        }
      } catch (error) {
        console.error('Error fetching primary logo:', error);
        setPrimaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      }
      
      try {
        const secondaryResponse = await axios.get(`/api/logos/secondary${cacheBuster}`);
        console.log('LogoManagement: Secondary logo response:', secondaryResponse.data);
        
        if (secondaryResponse.data && secondaryResponse.data.url) {
          setSecondaryLogoUrl(`${secondaryResponse.data.url}${cacheBuster}`);
        } else {
          setSecondaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
        }
      } catch (error) {
        console.error('Error fetching secondary logo:', error);
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
        hasSelectedLogos={false} // No need for global upload anymore as we handle uploads individually
        onSubmit={async (e) => {
          e.preventDefault();
          handleManualRefresh();
        }}
        onRefresh={handleManualRefresh}
      />
    </div>
  );
};

export default LogoManagement;
