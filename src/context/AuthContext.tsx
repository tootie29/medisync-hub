
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SAMPLE_USERS, UserRole } from '@/types';
import { toast } from "sonner";
import axios from 'axios';

const getApiUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === "climasys.entrsolutions.com" || hostname === "app.climasys.entrsolutions.com") {
    return 'https://api.climasys.entrsolutions.com/api';
  }
  
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  return 'http://localhost:8080/api';
};

const API_URL = getApiUrl();
console.log('Using API URL in AuthContext:', API_URL);

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
  register: (userData: Partial<User>, password: string) => Promise<{ requiresVerification?: boolean, verificationLink?: string }>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  isRegistering: boolean;
  resendVerification: (email: string) => Promise<{ 
    verificationLink?: string;
    emailSent?: boolean;
    emailPreviewUrl?: string;
    success?: boolean;
  }>;
  verificationEmail: string | null;
  setVerificationEmail: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface RegisteredUser extends User {
  password: string;
  emailVerified?: boolean;
  consentGiven?: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const isPreviewMode = window.location.hostname.includes('lovableproject.com');
  
  const getRegisteredUsers = (): RegisteredUser[] => {
    const storedUsers = localStorage.getItem('medisyncRegisteredUsers');
    if (storedUsers) {
      try {
        return JSON.parse(storedUsers);
      } catch (error) {
        console.error('Failed to parse stored registered users', error);
        return [];
      }
    }
    return [];
  };
  
  const saveRegisteredUsers = (users: RegisteredUser[]) => {
    localStorage.setItem('medisyncRegisteredUsers', JSON.stringify(users));
  };

  useEffect(() => {
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
      if (isPreviewMode) {
        console.log('Login in preview mode - checking registered users first');
        const registeredUsers = getRegisteredUsers();
        const foundRegisteredUser = registeredUsers.find(u => 
          u.email === email && u.password === password
        );
        
        if (foundRegisteredUser) {
          // Skip email verification check for demo accounts
          const isDemoAccount = SAMPLE_USERS.some(demo => demo.email === email);
          
          if (foundRegisteredUser.emailVerified === false && !isDemoAccount) {
            setVerificationEmail(email);
            setIsLoading(false);
            throw new Error('Email not verified. Please check your email for the verification link or request a new one.');
          }

          const { password: _, ...userWithoutPassword } = foundRegisteredUser;
          setUser(userWithoutPassword);
          localStorage.setItem('medisyncUser', JSON.stringify(userWithoutPassword));
          toast.success(`Welcome, ${userWithoutPassword.name}!`);
          setIsLoading(false);
          return;
        }
        
        // Demo accounts always bypass verification
        const foundSampleUser = SAMPLE_USERS.find(u => u.email === email);
        
        if (foundSampleUser) {
          setUser(foundSampleUser);
          localStorage.setItem('medisyncUser', JSON.stringify(foundSampleUser));
          toast.success(`Welcome, ${foundSampleUser.name}!`);
          setIsLoading(false);
          return;
        }
        
        throw new Error('Invalid email or password');
      }
      
      try {
        const response = await apiClient.post('/users/login', { 
          email, 
          password 
        });
        
        const loggedInUser: User = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          role: response.data.role as UserRole,
          phone: response.data.phone || '',
          dateOfBirth: response.data.date_of_birth || '',
          gender: response.data.gender as 'male' | 'female' | 'other',
          address: response.data.address || '',
          emergencyContact: response.data.emergency_contact || '',
          faculty: response.data.faculty || '',
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
        
        setUser(loggedInUser);
        localStorage.setItem('medisyncUser', JSON.stringify(loggedInUser));
        toast.success(`Welcome, ${loggedInUser.name}!`);
      } catch (error: any) {
        console.error('Login API error:', error);
        
        // Skip verification check for demo accounts
        const isDemoAccount = SAMPLE_USERS.some(demo => demo.email === email);
        
        if (error.response?.status === 403 && error.response?.data?.requiresVerification && !isDemoAccount) {
          setVerificationEmail(email);
          throw new Error('Email not verified. Please check your email for the verification link or request a new one.');
        }
        
        const foundUser = SAMPLE_USERS.find(u => u.email === email);
        
        if (!foundUser) {
          throw new Error('Invalid email or password');
        }
        
        setUser(foundUser);
        localStorage.setItem('medisyncUser', JSON.stringify(foundUser));
        toast.success(`Welcome, ${foundUser.name}!`);
      }
      
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
        faculty: userData.faculty,
        consent_given: userData.consentGiven,
        password: password
      };
      
      if (isPreviewMode) {
        console.log('Running in preview mode - using mock user registration');
        
        // Check if email already exists
        const registeredUsers = getRegisteredUsers();
        const existingUser = registeredUsers.find(u => u.email === userData.email);
        if (existingUser) {
          throw new Error('Email already registered. Please use a different email address.');
        }
        
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
          faculty: userData.faculty || '',
          consentGiven: userData.consentGiven || false,
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
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate mock verification token
        const verificationToken = Math.random().toString(36).substring(2, 15) + 
                               Math.random().toString(36).substring(2, 15);
                                
        // Create verification link that works in preview mode
        const verificationLink = `/verify/${verificationToken}`;
        
        const registeredUser: RegisteredUser = {
          ...newUser,
          password: password,
          emailVerified: false, // Email is not verified by default
        };
        
        // Store the user with the verification token in localStorage
        const currentUsers = getRegisteredUsers();
        currentUsers.push(registeredUser);
        saveRegisteredUsers(currentUsers);
        
        console.log('Saved registered user:', registeredUser.email, 'with verification link:', verificationLink);
        
        // Set the email for verification
        setVerificationEmail(userData.email || null);
        
        toast.success('Registration successful! Please verify your email before logging in.');
        
        // In preview mode, automatically "verify" the user for testing purposes
        setTimeout(() => {
          const users = getRegisteredUsers();
          const userIndex = users.findIndex(u => u.email === userData.email);
          
          if (userIndex >= 0) {
            users[userIndex].emailVerified = true;
            saveRegisteredUsers(users);
            console.log('Auto-verified user in preview mode:', userData.email);
          }
        }, 5000);
        
        return { 
          requiresVerification: true,
          verificationLink
        };
      }
      
      const response = await apiClient.post('/users', formattedData);
      console.log('Registration API response:', response.data);
      
      // Set the email for verification
      setVerificationEmail(userData.email || null);
      
      toast.success('Registration successful! Please verify your email before logging in.');

      return { 
        requiresVerification: true,
        verificationLink: response.data.verificationLink
      };
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
        const updatedUser = {
          ...user,
          ...userData,
          updatedAt: new Date().toISOString()
        };

        setUser(updatedUser);
        localStorage.setItem('medisyncUser', JSON.stringify(updatedUser));
        
        const registeredUsers = getRegisteredUsers();
        const updatedRegisteredUsers = registeredUsers.map(ru => {
          if (ru.id === user.id) {
            return { ...ru, ...userData, updatedAt: new Date().toISOString() };
          }
          return ru;
        });
        saveRegisteredUsers(updatedRegisteredUsers);
        
        toast.success('Profile updated successfully!');
        return;
      }
      
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
          staffId: userData.staffId,
          position: userData.position,
        }),
      };
      
      const response = await apiClient.put(`/users/${user.id}`, formattedData);
      
      const updatedUser: User = {
        ...user,
        ...userData,
        updatedAt: new Date().toISOString()
      };

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

  const resendVerification = async (email: string) => {
    setIsLoading(true);
    try {
      if (isPreviewMode) {
        // Generate mock verification token
        const verificationToken = Math.random().toString(36).substring(2, 15) + 
                               Math.random().toString(36).substring(2, 15);
                               
        const verificationLink = `http://localhost:5173/verify/${verificationToken}`;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success('Verification email sent. Please check your inbox.');
        
        return { 
          verificationLink,
          emailSent: true,
          success: true
        };
      }
      
      const response = await apiClient.post('/users/resend-verification', { email });
      
      toast.success('Verification email sent. Please check your inbox.');
      
      return { 
        verificationLink: response.data.verificationLink,
        emailSent: response.data.emailSent,
        emailPreviewUrl: response.data.emailPreviewUrl,
        success: true
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      let errorMessage = 'Failed to resend verification email';
      
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
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isRegistering, 
        login, 
        logout, 
        register, 
        updateProfile,
        resendVerification,
        verificationEmail,
        setVerificationEmail
      }}
    >
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
