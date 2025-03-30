
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SAMPLE_USERS, UserRole } from '@/types';
import { toast } from "sonner";
import axios from 'axios';

// Define the API URL with improved environment detection
const getApiUrl = () => {
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
console.log('Using API URL in AuthContext:', API_URL);

// Create API client
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

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
  const isPreviewMode = window.location.hostname.includes('lovableproject.com');

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
      
      // Format the data for the API
      const formattedData = {
        id: userData.id || `user-${Date.now()}`,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        date_of_birth: userData.dateOfBirth,
        gender: userData.gender,
        address: userData.address,
        emergency_contact: userData.emergencyContact,
        student_id: userData.studentId,
        department: userData.department,
        staff_id: userData.staffId,
        position: userData.position,
        // In a real app, you would handle password securely
        // For this demo, we're not implementing actual authentication yet
      };
      
      if (isPreviewMode) {
        console.log('Running in preview mode - using mock user registration');
        // Create a mock user based on sample data structure
        const newUser: User = {
          id: formattedData.id,
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
        toast.success('Registration successful!');
        return;
      }
      
      // Create user through API
      const response = await apiClient.post('/users', formattedData);
      console.log('Registration API response:', response.data);
      
      // Transform the API response to match our User type
      const newUser: User = {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role as UserRole,
        phone: response.data.phone || '',
        dateOfBirth: response.data.date_of_birth || '',
        gender: response.data.gender as 'male' | 'female' | 'other',
        address: response.data.address || '',
        emergencyContact: response.data.emergency_contact || '',
        ...(response.data.role === 'student' && {
          studentId: response.data.student_id || '',
          department: response.data.department || '',
        }),
        ...(response.data.role === 'staff' && {
          staffId: response.data.staff_id || '',
          position: response.data.position || '',
        }),
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
      };
      
      // Set the user in state and localStorage
      setUser(newUser);
      localStorage.setItem('medisyncUser', JSON.stringify(newUser));
      toast.success('Registration successful!');
      
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed';
      
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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
      if (isPreviewMode) {
        // In preview mode, just update locally
        const updatedUser = {
          ...user,
          ...userData,
          updatedAt: new Date().toISOString()
        };

        // Update user in state and localStorage
        setUser(updatedUser);
        localStorage.setItem('medisyncUser', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully!');
        return;
      }
      
      // Format the data for the API
      const formattedData = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        date_of_birth: userData.dateOfBirth,
        gender: userData.gender,
        address: userData.address,
        emergency_contact: userData.emergencyContact,
        ...(user.role === 'student' && {
          student_id: userData.studentId,
          department: userData.department,
        }),
        ...(user.role === 'staff' && {
          staff_id: userData.staffId,
          position: userData.position,
        }),
      };
      
      // Update user through API
      const response = await apiClient.put(`/users/${user.id}`, formattedData);
      
      // Transform the API response to match our User type
      const updatedUser: User = {
        ...user,
        ...userData,
        updatedAt: new Date().toISOString()
      };

      // Update user in state and localStorage
      setUser(updatedUser);
      localStorage.setItem('medisyncUser', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully!');
    } catch (error) {
      let errorMessage = 'Failed to update profile';
      
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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
