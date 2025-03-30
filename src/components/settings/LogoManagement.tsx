
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { Logo, DEFAULT_LOGO_PATH, CLIENT_FALLBACK_LOGO_PATH } from './SiteSettingsModel';

const LogoManagement = () => {
  const [primaryLogo, setPrimaryLogo] = useState<File | null>(null);
  const [secondaryLogo, setSecondaryLogo] = useState<File | null>(null);
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState<string>('');
  const [secondaryLogoUrl, setSecondaryLogoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  useEffect(() => {
    // Fetch the current logos from the database
    fetchLogos();
  }, [lastRefresh]);

  const fetchLogos = async () => {
    setIsLoadingLogos(true);
    setError(null);
    try {
      console.log('LogoManagement: Fetching logos...');
      // Add a timestamp to prevent caching
      const timestamp = Date.now();
      
      // Fetch primary logo directly (more reliable than getting all logos)
      const primaryResponse = await axios.get(`/api/logos/primary?t=${timestamp}`);
      console.log('LogoManagement: Primary logo response:', primaryResponse.data);
      
      if (primaryResponse.data && primaryResponse.data.url) {
        console.log('LogoManagement: Primary logo URL:', primaryResponse.data.url);
        // Add a timestamp to prevent browser caching
        const url = new URL(primaryResponse.data.url, window.location.origin);
        url.searchParams.append('t', timestamp.toString());
        setPrimaryLogoUrl(url.toString());
      } else {
        setPrimaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      }
      
      // Fetch secondary logo directly (more reliable than getting all logos)
      const secondaryResponse = await axios.get(`/api/logos/secondary?t=${timestamp}`);
      console.log('LogoManagement: Secondary logo response:', secondaryResponse.data);
      
      if (secondaryResponse.data && secondaryResponse.data.url) {
        console.log('LogoManagement: Secondary logo URL:', secondaryResponse.data.url);
        // Add a timestamp to prevent browser caching
        const url = new URL(secondaryResponse.data.url, window.location.origin);
        url.searchParams.append('t', timestamp.toString());
        setSecondaryLogoUrl(url.toString());
      } else {
        setSecondaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      }
    } catch (error) {
      console.error('LogoManagement: Error fetching logos:', error);
      setError('Failed to load logos. Please try again.');
      toast.error('Failed to load logos');
      
      // Fallback to placeholder if API fails
      const timestamp = Date.now();
      setPrimaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      setSecondaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
    } finally {
      setIsLoadingLogos(false);
    }
  };

  const handlePrimaryLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size before setting
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        toast.error('Logo file is too large. Maximum size is 5MB.');
        e.target.value = ''; // Reset input
        return;
      }
      console.log('Selected primary logo file:', file.name, file.type, file.size);
      setPrimaryLogo(file);
    }
  };

  const handleSecondaryLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size before setting
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        toast.error('Logo file is too large. Maximum size is 5MB.');
        e.target.value = ''; // Reset input
        return;
      }
      console.log('Selected secondary logo file:', file.name, file.type, file.size);
      setSecondaryLogo(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      if (primaryLogo) {
        formData.append('primaryLogo', primaryLogo);
        console.log('LogoManagement: Added primaryLogo to formData:', primaryLogo.name);
      }
      
      if (secondaryLogo) {
        formData.append('secondaryLogo', secondaryLogo);
        console.log('LogoManagement: Added secondaryLogo to formData:', secondaryLogo.name);
      }
      
      // Only proceed if at least one file is selected
      if (primaryLogo || secondaryLogo) {
        console.log('LogoManagement: Uploading logos...', 
          primaryLogo ? `primary: ${primaryLogo.name}` : 'no primary', 
          secondaryLogo ? `secondary: ${secondaryLogo.name}` : 'no secondary'
        );
        
        // Debug formData
        console.log('LogoManagement: FormData contents:');
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File ${value.name}, size: ${value.size}, type: ${value.type}`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }
        
        // Set a longer timeout for uploads and a longer response timeout
        const response = await axios.post('/api/logos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000, // 60 seconds timeout
          onUploadProgress: (progressEvent) => {
            console.log('Upload progress:', progressEvent.loaded, '/', progressEvent.total);
          }
        });
        
        console.log('LogoManagement: Upload response:', response.data);
        
        if (response.data.uploads && response.data.uploads.length > 0) {
          // Check for any errors in the uploads
          const uploadErrors = response.data.uploads.filter(upload => upload.error);
          
          if (uploadErrors.length > 0) {
            const errorMsg = uploadErrors.map(err => 
              `${err.position} logo: ${err.error} - ${err.details}`
            ).join('; ');
            
            setError(`Some logos failed to upload: ${errorMsg}`);
            toast.error('Some logos failed to upload');
          } else {
            toast.success('Logos updated successfully');
            
            // Reset file inputs
            setPrimaryLogo(null);
            setSecondaryLogo(null);
            
            // Clear file input fields by resetting the form
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach((input: any) => {
              input.value = '';
            });
            
            // Force refresh the logos
            setLastRefresh(Date.now());
            
            // Trigger a refresh of the authentication layout
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshLogos'));
              console.log('LogoManagement: Dispatched refreshLogos event');
            }, 500);
          }
        } else {
          console.error('Server returned no upload results:', response.data);
          toast.error('No logos were updated. Please try again.');
          setError('Upload completed but no logos were updated by the server');
        }
      } else {
        toast.error('Please select at least one logo to update');
      }
    } catch (error: any) {
      console.error('LogoManagement: Error updating logos:', error);
      
      let errorMessage = 'Failed to upload logos. Please try again.';
      if (error.name === 'CanceledError' || error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Please try with a smaller image or check your connection.';
      } else if (error.response) {
        errorMessage = `Error: ${error.response.data.error || error.response.statusText}`;
        if (error.response.data.details) {
          errorMessage += ` - ${error.response.data.details}`;
        }
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
    
    // Also refresh in the auth layout
    window.dispatchEvent(new CustomEvent('refreshLogos'));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/15 p-4 rounded-md mb-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-destructive/80 text-sm mt-1">
              Try refreshing the page or contact support if the issue persists.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
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
      
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || (!primaryLogo && !secondaryLogo)}
          className="bg-medical-primary hover:bg-medical-secondary text-white"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Updating Logos...
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
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingLogos ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default LogoManagement;
