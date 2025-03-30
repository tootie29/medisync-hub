
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

  useEffect(() => {
    // Fetch the current logos from the database
    fetchLogos();
  }, []);

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
      setPrimaryLogo(e.target.files[0]);
    }
  };

  const handleSecondaryLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSecondaryLogo(e.target.files[0]);
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
      }
      
      if (secondaryLogo) {
        formData.append('secondaryLogo', secondaryLogo);
      }
      
      // Only proceed if at least one file is selected
      if (primaryLogo || secondaryLogo) {
        console.log('LogoManagement: Uploading logos...', primaryLogo, secondaryLogo);
        
        // Add a client-side timeout of 30 seconds for the upload
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await axios.post('/api/logos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('LogoManagement: Upload response:', response.data);
        
        if (response.data.uploads && response.data.uploads.length > 0) {
          toast.success('Logos updated successfully');
          // Reset file inputs
          setPrimaryLogo(null);
          setSecondaryLogo(null);
          
          // Clear file input fields by resetting the form
          const fileInputs = document.querySelectorAll('input[type="file"]');
          fileInputs.forEach((input: any) => {
            input.value = '';
          });
          
          // Refresh the logos from server after a short delay to allow server processing
          setTimeout(() => {
            fetchLogos();
            
            // Trigger a refresh of the authentication layout if it's loaded
            // This will update the logos in the login/register pages
            window.dispatchEvent(new CustomEvent('refreshLogos'));
          }, 1000);
        } else {
          toast.error('No logos were updated. Please try again.');
        }
      } else {
        toast.error('Please select at least one logo to update');
      }
    } catch (error: any) {
      console.error('LogoManagement: Error updating logos:', error);
      
      let errorMessage = 'Failed to upload logos. Please try again.';
      if (error.name === 'AbortError') {
        errorMessage = 'Upload timed out. Please try with a smaller image or check your connection.';
      } else if (error.response) {
        errorMessage = `Error: ${error.response.data.error || error.response.statusText}`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
              onClick={fetchLogos}
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
          </div>
        </div>
      </div>
      
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
    </div>
  );
};

export default LogoManagement;
