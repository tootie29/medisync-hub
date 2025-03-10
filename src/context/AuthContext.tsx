
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SAMPLE_USERS } from '@/types';
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: Partial<User>, password: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    try {
      // In a real app, this would be an API call to create a new user
      const existingUser = SAMPLE_USERS.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // For the demo, we'll just simulate creating a new user
      const newUser: User = {
        id: `${SAMPLE_USERS.length + 1}`,
        email: userData.email!,
        name: userData.name!,
        role: userData.role || 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...userData
      };

      // In a real app, you would save the user to the database and hash the password
      
      // Set the user in state and localStorage
      setUser(newUser);
      localStorage.setItem('medisyncUser', JSON.stringify(newUser));
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
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
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, updateProfile }}>
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
