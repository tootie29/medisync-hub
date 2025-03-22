
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Logo {
  id: string;
  url: string;
  name: string;
  createdAt: string;
}

const LogoUploader: React.FC = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoHistory, setLogoHistory] = useState<Logo[]>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('logoHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Access Denied</h3>
            <p className="text-sm text-red-700">
              Only administrators can access the logo management tool.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image/(jpeg|jpg|png|svg+xml|gif)')) {
      toast.error('Invalid file type. Please upload an image file (JPEG, PNG, SVG, or GIF).');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB. Please upload a smaller image.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!previewUrl) {
      toast.error('Please select a logo to upload.');
      return;
    }

    setIsUploading(true);
    
    try {
      // In a real application, you would upload to a server here
      // For this demo, we'll simulate saving to localStorage
      
      // Create a new logo entry
      const newLogo: Logo = {
        id: `logo-${Date.now()}`,
        url: previewUrl,
        name: fileInputRef.current?.files?.[0]?.name || 'logo.png',
        createdAt: new Date().toISOString()
      };
      
      // Update logo history
      const updatedHistory = [newLogo, ...logoHistory].slice(0, 10); // Keep only the 10 most recent
      setLogoHistory(updatedHistory);
      
      // Save to localStorage
      localStorage.setItem('logoHistory', JSON.stringify(updatedHistory));
      
      // Update the current logo in localStorage
      localStorage.setItem('currentLogo', previewUrl);
      
      toast.success('Logo uploaded successfully!');
      
      // Clear preview
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const selectLogo = (logo: Logo) => {
    // Set the selected logo as current
    localStorage.setItem('currentLogo', logo.url);
    toast.success('Logo selected and applied!');
    
    // Force a reload to apply the logo change
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="olivarez-card p-6">
        <h2 className="text-xl font-semibold text-medical-primary mb-4">Upload New Logo</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="logo-upload" className="block mb-2">Select Logo File</Label>
            <Input 
              ref={fileInputRef}
              id="logo-upload" 
              type="file" 
              accept="image/jpeg,image/png,image/svg+xml,image/gif"
              onChange={handleFileChange}
              className="border-2 border-medical-primary mb-4"
            />
            
            <Button
              onClick={uploadLogo}
              disabled={!previewUrl || isUploading}
              className="bg-medical-primary hover:bg-medical-secondary flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Logo
                </>
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 h-40">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Logo Preview" 
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <p className="text-gray-500 text-center">
                Logo preview will appear here
              </p>
            )}
          </div>
        </div>
      </div>
      
      {logoHistory.length > 0 && (
        <div className="olivarez-card p-6">
          <h2 className="text-xl font-semibold text-medical-primary mb-4">Logo History</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {logoHistory.map((logo) => (
              <div 
                key={logo.id} 
                className="border border-gray-200 rounded-lg p-3 hover:border-medical-primary transition-colors relative"
              >
                <div className="h-24 flex items-center justify-center mb-2">
                  <img 
                    src={logo.url} 
                    alt={logo.name} 
                    className="max-h-full max-w-full object-contain" 
                  />
                </div>
                <div className="text-xs text-gray-500 truncate mb-1">{logo.name}</div>
                <div className="text-xs text-gray-400">
                  {new Date(logo.createdAt).toLocaleDateString()}
                </div>
                <Button
                  onClick={() => selectLogo(logo)}
                  className="w-full mt-2 bg-medical-light text-medical-primary hover:bg-medical-primary hover:text-white text-xs py-1 h-auto flex items-center justify-center gap-1"
                >
                  <Check size={12} />
                  Use This Logo
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoUploader;
