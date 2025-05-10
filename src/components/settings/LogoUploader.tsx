
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
      
      // Use absolute path to explicitly hit the API server
      const endpoint = `/api/logos/upload-logo/${logoType}`;
      console.log(`LogoUploader: Using endpoint ${endpoint}`);
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add X-Requested-With header to help identify AJAX requests
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 30000, // 30 seconds timeout
        // Don't transform the response - critical for proper error detection
        transformResponse: [(data) => {
          try {
            return JSON.parse(data);
          } catch (e) {
            // If it's not JSON, return as-is
            return data;
          }
        }],
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });
      
      console.log('LogoUploader: Server response:', response);
      
      // Check if we got HTML instead of JSON
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.error('LogoUploader: Received HTML instead of JSON - API routing issue');
        throw new Error('API routing issue - received HTML instead of JSON');
      }
      
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
        console.error('LogoUploader: Upload failed with response:', response.data);
        throw new Error(response.data?.error || 'Upload failed without specific error');
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
