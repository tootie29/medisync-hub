
// This file defines the types for site settings

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'text' | 'number' | 'boolean' | 'json' | 'color';
  description?: string;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Logo {
  id: string;
  url: string;
  position: 'primary' | 'secondary';
  created_at?: string;
}

export interface SiteSettingsState {
  logos: {
    primary?: Logo;
    secondary?: Logo;
  };
  settings: Record<string, SiteSetting>;
  isLoading: boolean;
  error: string | null;
}

export const DEFAULT_LOGO_PATH = '/uploads/assets/logos/default-logo.png';
export const CLIENT_FALLBACK_LOGO_PATH = '/placeholder.svg';
