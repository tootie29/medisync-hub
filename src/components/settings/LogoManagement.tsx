import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { Upload, RefreshCw, AlertCircle, Info, Server } from 'lucide-react';
import { CLIENT_FALLBACK_LOGO_PATH } from './SiteSettingsModel';
import { fileToBase64, uploadLogo } from '@/utils/fileUploader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  const handlePrimaryLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1 * 1024 * 1024) { // 1MB max
        toast.error('Logo file is too large. Maximum size is 1MB.');
        e.target.value = ''; // Reset input
        return;
      }
      console.log('Selected primary logo file:', file.name, file.type, file.size);
      setPrimaryLogo(file);
      
      // Preview the image immediately
      try {
        const base64Preview = await fileToBase64(file);
        console.log('Generated preview for primary logo');
        setPrimaryLogoUrl(base64Preview);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }
  };

  const handleSecondaryLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1 * 1024 * 1024) { // 1MB max
        toast.error('Logo file is too large. Maximum size is 1MB.');
        e.target.value = ''; // Reset input
        return;
      }
      console.log('Selected secondary logo file:', file.name, file.type, file.size);
      setSecondaryLogo(file);
      
      // Preview the image immediately
      try {
        const base64Preview = await fileToBase64(file);
        console.log('Generated preview for secondary logo');
        setSecondaryLogoUrl(base64Preview);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }
  };

  // Updated approach using direct file uploads
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('LogoManagement: Starting logo upload process');
      let uploadedLogos = 0;
      
      if (!primaryLogo && !secondaryLogo) {
        toast.error('Please select at least one logo to upload');
        setIsLoading(false);
        return;
      }
      
      // Use separate uploads for each logo
      const uploads = [];
      
      if (primaryLogo) {
        try {
          console.log('LogoManagement: Uploading primary logo');
          await uploadLogo(primaryLogo, 'primary');
          uploadedLogos++;
          uploads.push('primary');
        } catch (error: any) {
          console.error('Error uploading primary logo:', error);
          const errorMsg = error.message || 'Failed to upload primary logo';
          toast.error(errorMsg);
        }
      }
      
      if (secondaryLogo) {
        try {
          console.log('LogoManagement: Uploading secondary logo');
          await uploadLogo(secondaryLogo, 'secondary');
          uploadedLogos++;
          uploads.push('secondary');
        } catch (error: any) {
          console.error('Error uploading secondary logo:', error);
          const errorMsg = error.message || 'Failed to upload secondary logo';
          toast.error(errorMsg);
        }
      }
      
      if (uploadedLogos > 0) {
        setUploadSuccess(true);
        
        // Reset state
        setPrimaryLogo(null);
        setSecondaryLogo(null);
        
        // Clear file input fields
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input: any) => {
          input.value = '';
        });
        
        toast.success(`${uploadedLogos} logo(s) updated successfully`);
        
        // Refresh logos after a short delay
        setTimeout(() => {
          setLastRefresh(Date.now());
          window.dispatchEvent(new CustomEvent('refreshLogos'));
        }, 2000);
      } else {
        toast.error('No logos were uploaded successfully');
      }
      
    } catch (error: any) {
      console.error('Error uploading logos:', error);
      
      let errorMessage = 'Failed to upload logos. Please try again.';
      if (error.response) {
        errorMessage = `Error: ${error.response.data?.error || error.response.statusText}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setLastRefresh(Date.now());
    fetchLogos();
    toast.info('Refreshing logos...');
    
    window.dispatchEvent(new CustomEvent('refreshLogos'));
  };

  return (
    <div className="space-y-6">
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="font-medium">Primary Logo</div>
          {isLoadingLogos ? (
            <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            primaryLogoUrl ? (
              <div className="h-40 flex items-center justify-center border rounded-md p-4">
                <img 
                  src={primaryLogoUrl} 
                  alt="Primary Logo" 
                  className="max-h-full object-contain"
                  onError={(e) => {
                    console.error('Failed to load primary logo:', primaryLogoUrl);
                    e.currentTarget.src = CLIENT_FALLBACK_LOGO_PATH;
                  }}
                />
              </div>
            ) : (
              <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500">No logo uploaded</p>
              </div>
            )
          )}
          <div className="pt-2">
            <Label htmlFor="primaryLogo" className="block mb-2">Upload new primary logo</Label>
            <Input 
              id="primaryLogo" 
              type="file" 
              accept="image/*"
              onChange={handlePrimaryLogoChange}
              className="cursor-pointer"
            />
            {primaryLogo && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {primaryLogo.name} ({Math.round(primaryLogo.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="font-medium">Secondary Logo</div>
          {isLoadingLogos ? (
            <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            secondaryLogoUrl ? (
              <div className="h-40 flex items-center justify-center border rounded-md p-4">
                <img 
                  src={secondaryLogoUrl} 
                  alt="Secondary Logo" 
                  className="max-h-full object-contain"
                  onError={(e) => {
                    console.error('Failed to load secondary logo:', secondaryLogoUrl);
                    e.currentTarget.src = CLIENT_FALLBACK_LOGO_PATH;
                  }}
                />
              </div>
            ) : (
              <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500">No logo uploaded</p>
              </div>
            )
          )}
          <div className="pt-2">
            <Label htmlFor="secondaryLogo" className="block mb-2">Upload new secondary logo</Label>
            <Input 
              id="secondaryLogo" 
              type="file" 
              accept="image/*"
              onChange={handleSecondaryLogoChange}
              className="cursor-pointer"
            />
            {secondaryLogo && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {secondaryLogo.name} ({Math.round(secondaryLogo.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || (!primaryLogo && !secondaryLogo)}
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
          onClick={handleManualRefresh}
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
    </div>
  );
};

export default LogoManagement;
