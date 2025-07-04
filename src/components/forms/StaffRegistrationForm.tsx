import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

interface StaffRegistrationFormProps {
  role: 'doctor' | 'head nurse' | 'admin';
  onSuccess: (email: string) => void;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().min(6, {
    message: 'Phone number must be at least 6 characters.',
  }).optional(),
  position: z.string().min(2, {
    message: 'Position must be at least 2 characters.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  confirmPassword: z.string(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const StaffRegistrationForm: React.FC<StaffRegistrationFormProps> = ({ role, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { register, isRegistering } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      position: '',
      password: '',
      confirmPassword: '',
      consent: undefined,
    },
  });

  // Function to check if email is already in use
  const checkEmailAvailability = async (email: string) => {
    if (!email) return true;
    
    try {
      setIsCheckingEmail(true);
      setEmailError(null);
      
      const isPreviewMode = window.location.hostname.includes('lovableproject.com');
      
      if (isPreviewMode) {
        // In preview mode, check local storage for registered users
        const storedUsers = localStorage.getItem('medisyncRegisteredUsers');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const emailExists = users.some((user: any) => user.email === email);
          
          if (emailExists) {
            setEmailError('This email is already registered');
            return false;
          }
          return true;
        }
        return true;
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      const response = await axios.get(`${apiUrl}/users/check-email/${encodeURIComponent(email)}`);
      
      if (response.data.available === false) {
        setEmailError('This email is already registered');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking email availability:', error);
      return true; // In case of error, allow submission and let server handle it
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Watch for email changes
  const emailValue = form.watch('email');
  React.useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (emailValue && form.formState.errors.email === undefined) {
        checkEmailAvailability(emailValue);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [emailValue]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check email availability before submitting
    if (values.email) {
      const emailAvailable = await checkEmailAvailability(values.email);
      if (!emailAvailable) {
        return; // Stop submission if email is already in use
      }
    }

    setIsLoading(true);
    try {
      const { confirmPassword, consent, ...userData } = values;
      
      const staffData = {
        name: userData.name,
        email: userData.email,
        role: role as UserRole,
        phone: userData.phone,
        position: userData.position,
        consentGiven: consent
      };
      
      await register(staffData, userData.password);
      onSuccess(userData.email);
    } catch (error) {
      console.error('Registration error:', error);
      // Error message already handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="doctor@example.com" 
                    {...field} 
                    className={emailError ? 'border-red-500' : ''}
                    onChange={(e) => {
                      field.onChange(e);
                      setEmailError(null);
                    }}
                  />
                </FormControl>
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-medical-primary" />
                  </div>
                )}
              </div>
              {emailError ? (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {emailError}
                </div>
              ) : (
                <FormMessage />
              )}
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position/Specialty</FormLabel>
              <FormControl>
                <Input placeholder={role === 'doctor' ? "Cardiologist" : role === 'head nurse' ? "Senior Head Nurse" : "System Administrator"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">
                  I agree to the <a href="#" className="text-medical-primary hover:underline">Terms and Conditions</a> and <a href="#" className="text-medical-primary hover:underline">Privacy Policy</a>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-medical-primary hover:bg-medical-secondary" 
          disabled={isLoading || isRegistering || isCheckingEmail || !!emailError}
        >
          {(isLoading || isRegistering) ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </Form>
  );
};

export default StaffRegistrationForm;
