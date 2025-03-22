
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { toast } from "sonner";

interface BrandingSettings {
  primaryLogo: string;
  secondaryLogo: string;
  clinicName: string;
  tagline: string;
}

interface SettingsContextType {
  branding: BrandingSettings;
  isLoading: boolean;
  updateBranding: (settings: Partial<BrandingSettings>) => Promise<void>;
}

const defaultBranding: BrandingSettings = {
  primaryLogo: "/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png",
  secondaryLogo: "/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png",
  clinicName: "OLIVAREZ CLINIC",
  tagline: "Health at Your Fingertips"
};

// Define the API URL with improved environment detection
const getApiUrl = () => {
  // First check if we're running in the Lovable preview environment
  const isLovablePreview = window.location.hostname.includes('lovableproject.com');
  if (isLovablePreview) {
    console.log('Running in Lovable preview - using sample data instead of API');
    return null;
  }
  
  // For production environments
  const hostname = window.location.hostname;
  if (hostname === "climasys.entrsolutions.com" || hostname === "app.climasys.entrsolutions.com") {
    return 'https://api.climasys.entrsolutions.com/api';
  }
  
  // Environment variable (if set)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Local development fallback
  return 'http://localhost:8080/api';
};

const API_URL = getApiUrl();

// Create a custom axios instance
const apiClient = axios.create({
  baseURL: API_URL || 'http://localhost:8080/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const isPreviewMode = window.location.hostname.includes('lovableproject.com');

  // Load settings on initial mount
  useEffect(() => {
    loadBrandingSettings();
  }, []);

  const loadBrandingSettings = async () => {
    setIsLoading(true);
    
    try {
      if (isPreviewMode) {
        // In preview mode, check if we have settings in localStorage
        const storedSettings = localStorage.getItem('brandingSettings');
        if (storedSettings) {
          setBranding(JSON.parse(storedSettings));
        }
        setIsLoading(false);
        return;
      }
      
      // In production, fetch from API
      const response = await apiClient.get('/settings/branding');
      setBranding(response.data || defaultBranding);
    } catch (error) {
      console.error('Error loading branding settings:', error);
      // Fallback to default settings on error
      setBranding(defaultBranding);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBranding = async (settings: Partial<BrandingSettings>) => {
    // Only admins can update settings
    if (!user || user.role !== 'admin') {
      toast.error('Only administrators can update branding settings');
      throw new Error('Permission denied: Only administrators can update branding settings');
    }

    setIsLoading(true);
    
    try {
      const updatedSettings = { ...branding, ...settings };
      
      if (isPreviewMode) {
        // In preview mode, save to localStorage
        localStorage.setItem('brandingSettings', JSON.stringify(updatedSettings));
        setBranding(updatedSettings);
        toast.success('Branding settings updated successfully (preview mode)');
        setIsLoading(false);
        return;
      }
      
      // In production, save to API
      await apiClient.post('/settings/branding', updatedSettings);
      setBranding(updatedSettings);
      toast.success('Branding settings updated successfully');
    } catch (error) {
      console.error('Error updating branding settings:', error);
      toast.error('Failed to update branding settings');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ branding, isLoading, updateBranding }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
