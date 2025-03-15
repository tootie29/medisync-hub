
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Moon, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

const Settings = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [sound, setSound] = React.useState(true);
  const { theme, setTheme } = useTheme();
  
  const handleSaveSettings = () => {
    // In a real app, we would save these to the user's profile
    toast.success('Settings saved successfully');
  };

  const toggleDarkMode = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Manage your app preferences and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications about your appointments and messages</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={setNotifications} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Moon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                  </div>
                </div>
                <Switch 
                  checked={theme === 'dark'} 
                  onCheckedChange={toggleDarkMode} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Volume2 className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Sound Effects</p>
                    <p className="text-sm text-gray-500">Play sounds for notifications and actions</p>
                  </div>
                </div>
                <Switch 
                  checked={sound} 
                  onCheckedChange={setSound} 
                />
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={handleSaveSettings}
                  className="bg-medical-primary hover:bg-medical-secondary"
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
