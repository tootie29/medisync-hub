
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const BrandingSettings = () => {
  const { user } = useAuth();
  const { branding, updateBranding, isLoading } = useSettings();
  
  const [clinicName, setClinicName] = useState(branding.clinicName);
  const [tagline, setTagline] = useState(branding.tagline);
  const [primaryLogoPreview, setPrimaryLogoPreview] = useState(branding.primaryLogo);
  const [secondaryLogoPreview, setSecondaryLogoPreview] = useState(branding.secondaryLogo);
  
  const primaryLogoInputRef = useRef<HTMLInputElement>(null);
  const secondaryLogoInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user is an admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="medical-container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page. Only administrators can manage branding settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  const handlePrimaryLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrimaryLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSecondaryLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSecondaryLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      await updateBranding({
        primaryLogo: primaryLogoPreview,
        secondaryLogo: secondaryLogoPreview,
        clinicName,
        tagline
      });
    } catch (error) {
      console.error('Error saving branding settings:', error);
    }
  };
  
  return (
    <div className="medical-container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Branding Settings</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Branding Information</CardTitle>
          <CardDescription>
            Customize how your institution is presented to users. Changes will be visible on the login and registration pages.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Clinic Name */}
          <div className="space-y-2">
            <Label htmlFor="clinicName">Clinic Name</Label>
            <Input
              id="clinicName"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Enter clinic name"
            />
          </div>
          
          {/* Tagline */}
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Enter tagline"
            />
          </div>
          
          <Separator className="my-4" />
          
          {/* Primary Logo */}
          <div className="space-y-4">
            <Label>Primary Logo</Label>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="border rounded-md p-4 w-40 h-40 flex items-center justify-center">
                <img 
                  src={primaryLogoPreview} 
                  alt="Primary Logo Preview" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  onClick={() => primaryLogoInputRef.current?.click()}
                >
                  Change Primary Logo
                </Button>
                <p className="text-sm text-gray-500">
                  Recommended size: 300x300 pixels. PNG or JPG format.
                </p>
                <input
                  type="file"
                  ref={primaryLogoInputRef}
                  onChange={handlePrimaryLogoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>
          
          {/* Secondary Logo */}
          <div className="space-y-4">
            <Label>Secondary Logo</Label>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="border rounded-md p-4 w-40 h-40 flex items-center justify-center">
                <img 
                  src={secondaryLogoPreview} 
                  alt="Secondary Logo Preview" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  onClick={() => secondaryLogoInputRef.current?.click()}
                >
                  Change Secondary Logo
                </Button>
                <p className="text-sm text-gray-500">
                  Recommended size: 300x300 pixels. PNG or JPG format.
                </p>
                <input
                  type="file"
                  ref={secondaryLogoInputRef}
                  onChange={handleSecondaryLogoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reset Changes
          </Button>
          <Button 
            onClick={handleSaveSettings} 
            disabled={isLoading}
            className="bg-medical-primary hover:bg-medical-secondary"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Preview Section */}
      <div className="mt-10">
        <h2 className="section-title">Preview</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex flex-col items-center">
                <img 
                  src={primaryLogoPreview} 
                  alt="Primary Logo" 
                  className="h-20 w-auto object-contain"
                />
              </div>
              <div className="flex flex-col items-center">
                <img 
                  src={secondaryLogoPreview} 
                  alt="Secondary Logo" 
                  className="h-20 w-auto object-contain"
                />
              </div>
            </div>
            <div className="text-center mt-4">
              <h3 className="text-xl font-bold">{clinicName}</h3>
              <p className="text-gray-700">{tagline}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrandingSettings;
