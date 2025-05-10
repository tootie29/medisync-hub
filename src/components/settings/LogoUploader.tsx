
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, RefreshCw } from 'lucide-react';
import { CLIENT_FALLBACK_LOGO_PATH } from './SiteSettingsModel';
import { fileToBase64 } from '@/utils/fileUploader';
import axios from 'axios';

interface LogoUploaderProps {
  logoType: 'primary' | 'secondary';
  currentLogoUrl: string;
  isLoading: boolean;
  isLoadingLogos: boolean;
  onLogoUpdated: () => void;
  onError: (message: string) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({
  logoType,
  currentLogoUrl,
  isLoading,
  isLoadingLogos,
  onLogoUpdated,
  onError
}) => {
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentLogoUrl);
  const [uploading, setUploading] = useState<boolean>(false);

  React.useEffect(() => {
    setPreviewUrl(currentLogoUrl);
  }, [currentLogoUrl]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1 * 1024 * 1024) { // 1MB max
        onError('Logo file is too large. Maximum size is 1MB.');
        e.target.value = ''; // Reset input
        return;
      }
      console.log(`Selected ${logoType} logo file:`, file.name, file.type, file.size);
      setLogo(file);
      
      // Preview the image immediately
      try {
        const base64Preview = await fileToBase64(file);
        console.log(`Generated preview for ${logoType} logo`);
        setPreviewUrl(base64Preview);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }
  };

  const handleUpload = async () => {
    if (!logo) return;
    
    try {
      setUploading(true);
      console.log(`LogoManagement: Uploading ${logoType} logo`);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', logo);
      
      // For development and testing, try using the local server first
      const localEndpoint = `/api/logos/upload-logo/${logoType}`;
      console.log(`LogoUploader: First trying local endpoint ${localEndpoint}`);
      
      try {
        // Try local upload first
        const response = await axios.post(localEndpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 30000,
          transformResponse: [(data) => {
            try {
              return JSON.parse(data);
            } catch (e) {
              return data;
            }
          }],
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        });
        
        // Check if we got HTML instead of JSON
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          console.error('LogoUploader: Received HTML instead of JSON - trying base64 upload instead');
          // We'll handle this by falling back to base64 upload
          throw new Error('HTML response received instead of JSON');
        }
        
        console.log('LogoUploader: Local upload response:', response);
        
        if (response.data && response.data.success) {
          console.log(`LogoManagement: ${logoType} logo uploaded successfully`);
          setLogo(null);
          
          // Clear file input field
          const fileInput = document.querySelector(`input#${logoType}Logo`) as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
          
          onLogoUpdated();
          return true;
        } else {
          throw new Error(response.data?.error || 'Upload failed without specific error');
        }
      } catch (localError) {
        // If local upload fails, try base64 upload as fallback
        console.warn('Local file upload failed, falling back to base64 upload:', localError);
        
        try {
          // Convert the file to base64
          const base64Data = await fileToBase64(logo);
          
          // Create payload for base64 upload
          const base64Payload = {
            [`${logoType}Logo`]: base64Data
          };
          
          // Send base64 data directly
          const base64Response = await axios.post(`/api/logos/upload-base64-logo/${logoType}`, base64Payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 30000
          });
          
          console.log('LogoUploader: Base64 upload response:', base64Response);
          
          if (base64Response.data && base64Response.data.success) {
            console.log(`LogoManagement: ${logoType} logo uploaded successfully via base64`);
            setLogo(null);
            
            // Clear file input field
            const fileInput = document.querySelector(`input#${logoType}Logo`) as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
            
            onLogoUpdated();
            return true;
          } else {
            throw new Error(base64Response.data?.error || 'Base64 upload failed without specific error');
          }
        } catch (base64Error) {
          console.error(`Base64 upload also failed for ${logoType} logo:`, base64Error);
          throw base64Error;
        }
      }
    } catch (error) {
      console.error(`Error uploading ${logoType} logo:`, error);
      onError(`Failed to upload ${logoType} logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="font-medium">{logoType === 'primary' ? 'Primary' : 'Secondary'} Logo</div>
      {isLoadingLogos ? (
        <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        previewUrl ? (
          <div className="h-40 flex items-center justify-center border rounded-md p-4">
            <img 
              src={previewUrl} 
              alt={`${logoType === 'primary' ? 'Primary' : 'Secondary'} Logo`} 
              className="max-h-full object-contain"
              onError={(e) => {
                console.error(`Failed to load ${logoType} logo:`, previewUrl);
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
        <Label htmlFor={`${logoType}Logo`} className="block mb-2">
          Upload new {logoType === 'primary' ? 'primary' : 'secondary'} logo
        </Label>
        <Input 
          id={`${logoType}Logo`} 
          type="file" 
          accept="image/*"
          onChange={handleLogoChange}
          className="cursor-pointer"
          disabled={isLoading || uploading}
        />
        {logo && (
          <p className="text-xs text-gray-500 mt-1">
            Selected: {logo.name} ({Math.round(logo.size / 1024)} KB)
          </p>
        )}
      </div>
      
      {logo && (
        <Button
          onClick={handleUpload}
          disabled={isLoading || uploading || !logo}
          className="mt-2 bg-medical-primary hover:bg-medical-secondary text-white w-full"
          size="sm"
        >
          {uploading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload {logoType === 'primary' ? 'Primary' : 'Secondary'} Logo
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default LogoUploader;
