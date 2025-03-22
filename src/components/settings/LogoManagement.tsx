
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { Upload, RefreshCw, AlertCircle } from 'lucide-react';

interface Logo {
  id: string;
  url: string;
  position: 'primary' | 'secondary';
}

const LogoManagement = () => {
  const [primaryLogo, setPrimaryLogo] = useState<File | null>(null);
  const [secondaryLogo, setSecondaryLogo] = useState<File | null>(null);
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState<string>('');
  const [secondaryLogoUrl, setSecondaryLogoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Default logo path - make sure this points to a valid image in your public folder
  const defaultLogoPath = '/lovable-uploads/e4352921-3b28-44c3-a2f8-02b0923e132f.png';

  useEffect(() => {
    // Fetch the current logos from the database
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    setIsLoadingLogos(true);
    setError(null);
    try {
      console.log('Fetching logos...');
      const response = await axios.get('/api/logos');
      console.log('Logos response:', response.data);
      
      // Make sure we have an array of logos
      const logos = Array.isArray(response.data) ? response.data : [];
      
      // Find logos by position using direct array methods
      const primary = logos.find((logo: Logo) => logo.position === 'primary');
      const secondary = logos.find((logo: Logo) => logo.position === 'secondary');
      
      if (primary && primary.url) {
        console.log('Primary logo URL:', primary.url);
        setPrimaryLogoUrl(primary.url);
      } else {
        // Fallback to default logo
        setPrimaryLogoUrl(defaultLogoPath);
      }
      
      if (secondary && secondary.url) {
        console.log('Secondary logo URL:', secondary.url);
        setSecondaryLogoUrl(secondary.url);
      } else {
        // Fallback to default logo
        setSecondaryLogoUrl(defaultLogoPath);
      }
    } catch (error) {
      console.error('Error fetching logos:', error);
      setError('Failed to load logos. Please try again.');
      toast.error('Failed to load logos');
      
      // Fallback to default logo if API fails
      setPrimaryLogoUrl(defaultLogoPath);
      setSecondaryLogoUrl(defaultLogoPath);
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
        console.log('Uploading logos...');
        const response = await axios.post('/api/logos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Upload response:', response.data);
        
        toast.success('Logos updated successfully');
        // Reset file input
        setPrimaryLogo(null);
        setSecondaryLogo(null);
        
        // Refresh the logos from server
        fetchLogos();
      } else {
        toast.error('Please select at least one logo to update');
      }
    } catch (error) {
      console.error('Error updating logos:', error);
      setError('Failed to upload logos. Please try again.');
      toast.error('Failed to update logos');
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
                    e.currentTarget.src = defaultLogoPath;
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
                    e.currentTarget.src = defaultLogoPath;
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
