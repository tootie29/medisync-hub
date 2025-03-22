
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';

const LogoManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Load the current logo from localStorage
    const savedLogo = localStorage.getItem('customLogo');
    if (savedLogo) {
      setCurrentLogo(savedLogo);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check if file is an image
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size should not exceed 2MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // In a real application, you would upload to server
      // For now, we'll save to localStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('customLogo', base64String);
        setCurrentLogo(base64String);
        
        toast.success('Logo uploaded successfully');
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('customLogo');
    setCurrentLogo(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    toast.success('Logo reset to default');
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Unauthorized Access</CardTitle>
              <CardDescription>
                You do not have permission to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Logo Management</CardTitle>
            <CardDescription>
              Upload and manage your application logo. The logo will be displayed on the login and register pages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">Current Logo</h3>
                {currentLogo ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={currentLogo} 
                      alt="Current Logo" 
                      className="max-h-32 mb-4" 
                    />
                    <Button variant="outline" onClick={handleReset}>
                      Reset to Default
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Using default logo</p>
                )}
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">Upload New Logo</h3>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mb-4"
                />
                
                {previewUrl && (
                  <div className="mt-4 flex flex-col items-center">
                    <h4 className="text-sm font-medium mb-2">Preview:</h4>
                    <img 
                      src={previewUrl} 
                      alt="Logo Preview" 
                      className="max-h-32 mb-4" 
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              className="w-full md:w-auto"
            >
              {isUploading ? 'Uploading...' : 'Upload Logo'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default LogoManagement;
