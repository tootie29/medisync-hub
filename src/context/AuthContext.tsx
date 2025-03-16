
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SAMPLE_USERS, UserRole } from '@/types';
import { toast } from "sonner";
import axios from 'axios';

// Define the API URL with fallback options to make it more robust
const getApiUrl = () => {
  // First try the environment variable
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  // Check if we're running in the Lovable preview environment
  const isLovablePreview = window.location.hostname.includes('lovableproject.com');
  
  if (envApiUrl) {
    return envApiUrl;
  } else if (isLovablePreview) {
    // For Lovable preview, use sample data instead of API calls
    console.log('Running in Lovable preview - using sample data instead of API');
    return null;
  } else {
    // Local development fallback
    return 'http://localhost:8080/api';
  }
};

const API_URL = getApiUrl();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: Partial<User>, password: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  isRegistering: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('medisyncUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data', error);
        localStorage.removeItem('medisyncUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate authentication with our sample data
      const foundUser = SAMPLE_USERS.find(u => u.email === email);
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }
      
      // In a real app, you would verify the password here
      // For the demo, we'll just assume the password is correct if the email matches
      
      // Set the user in state and localStorage
      setUser(foundUser);
      localStorage.setItem('medisyncUser', JSON.stringify(foundUser));
      toast.success(`Welcome, ${foundUser.name}!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medisyncUser');
    toast.info('You have been logged out');
  };

  const register = async (userData: Partial<User>, password: string) => {
    setIsLoading(true);
    setIsRegistering(true);
    try {
      console.log('Registering user with data:', userData);
      
      // If API_URL is null (in preview mode), use sample data instead
      if (!API_URL) {
        console.log('Using sample data for registration in preview mode');
        // Create a mock user based on sample data structure
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: userData.email || '',
          name: userData.name || '',
          role: userData.role as UserRole,
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth || '',
          gender: userData.gender as 'male' | 'female' | 'other',
          address: userData.address || '',
          emergencyContact: userData.emergencyContact || '',
          ...(userData.role === 'student' && {
            studentId: userData.studentId || '',
            department: userData.department || '',
          }),
          ...(userData.role === 'staff' && {
            staffId: userData.staffId || '',
            position: userData.position || '',
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set the user in state and localStorage
        setUser(newUser);
        localStorage.setItem('medisyncUser', JSON.stringify(newUser));
        toast.success('Registration successful (preview mode)!');
        return;
      }

      // Prepare the user data for API submission
      const userForAPI = {
        ...userData,
        password, // Include password in the API call
        // Convert camelCase to snake_case for backend compatibility
        date_of_birth: userData.dateOfBirth,
        emergency_contact: userData.emergencyContact,
        student_id: userData.studentId,
        staff_id: userData.staffId,
      };
      
      console.log('Sending registration data to API:', userForAPI);
      
      // Make the actual API call to create the user
      const response = await axios.post(`${API_URL}/users`, userForAPI);
      console.log('Registration API response:', response);
      
      if (response.status !== 201) {
        throw new Error('Registration failed');
      }
      
      const newUser = response.data;
      
      // Convert API response format to match our frontend User type
      const userForFrontend: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role as UserRole,
        phone: newUser.phone || '',
        dateOfBirth: newUser.date_of_birth || newUser.dateOfBirth || '',
        gender: newUser.gender || undefined,
        address: newUser.address || '',
        emergencyContact: newUser.emergency_contact || newUser.emergencyContact || '',
        ...(newUser.role === 'student' && {
          studentId: newUser.student_id || newUser.studentId || '',
          department: newUser.department || '',
        }),
        ...(newUser.role === 'staff' && {
          staffId: newUser.staff_id || newUser.staffId || '',
          position: newUser.position || '',
        }),
        createdAt: newUser.created_at || new Date().toISOString(),
        updatedAt: newUser.updated_at || new Date().toISOString(),
      };
      
      // Set the user in state and localStorage
      setUser(userForFrontend);
      localStorage.setItem('medisyncUser', JSON.stringify(userForFrontend));
      toast.success('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
      setIsRegistering(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) {
      throw new Error('User not logged in');
    }

    setIsLoading(true);
    try {
      // In a real app, this would be an API call to update the user
      const updatedUser = {
        ...user,
        ...userData,
        updatedAt: new Date().toISOString()
      };

      // Update user in state and localStorage
      setUser(updatedUser);
      localStorage.setItem('medisyncUser', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isRegistering, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
