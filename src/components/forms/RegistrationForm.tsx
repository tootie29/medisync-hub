import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserRole } from '@/types';
import { toast } from "sonner";
import { User, Loader2, BookOpen, Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from 'axios';

const FACULTY_OPTIONS = [
  'Radiology', 'Nursing', 'Business', 'Information Technology', 
  'Tourism Management', 'Communication', 'Education', 'Psychology', 
  'Criminology', 'Accountancy', 'Hospitality Management', 'Customs Administration',
  'IBED', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 
  'DPRO', 'PERSONNELS', 'Cafeteria', 'Technicians', 'Maintenance', 
  'TEACHING', 'College', 'Elementary', 'ALS', 'TESDA'
];

// Fix: Added proper interface definition with correct syntax
interface RegistrationFormProps {
  role: 'student' | 'staff';
  onSuccess?: (email: string) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ role, onSuccess }) => {
  const { register, isRegistering } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: role as UserRole,
    phone: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    address: '',
    emergencyContact: '',
    studentId: '',
    department: '',
    staffId: '',
    position: '',
    faculty: '',
    consentGiven: false,
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateName = (name: string): boolean => {
    // Regex to check if name contains only letters, spaces, and some special characters used in names
    const nameRegex = /^[A-Za-z\s.\-']+$/;
    return nameRegex.test(name);
  };

  const validatePhone = (phone: string): boolean => {
    // Regex to check if phone contains only numbers
    const phoneRegex = /^[0-9]+$/;
    return phoneRegex.test(phone);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle name input - only allow letters
    if (name === 'name') {
      // If attempting to enter a number, don't update the state
      if (value && !validateName(value)) {
        return;
      }
      setNameError(null);
    }
    
    // Handle phone input - only allow numbers and limit to 11 digits
    if (name === 'phone') {
      // If attempting to enter a letter, don't update the state
      if (value && !validatePhone(value)) {
        return;
      }
      
      // Limit to 11 characters
      if (value.length > 11) {
        return;
      }
      
      setPhoneError(null);
    }
    
    // Clear email error when email is changed
    if (name === 'email') {
      setEmailError(null);
    }
    
    // Always update the state for other fields
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsentChange = (checked: boolean) => {
    setConsentChecked(checked);
    setFormData((prev) => ({ ...prev, consentGiven: checked }));
  };

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
      return true; // In case of error, allow the form submission and let the server handle it
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const validateForm = async () => {
    let isValid = true;
    
    // Reset error states
    setNameError(null);
    setPhoneError(null);
    setEmailError(null);
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      isValid = false;
    }
    
    if (formData.name && !validateName(formData.name)) {
      setNameError('Name should only contain letters (no numbers)');
      isValid = false;
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      setPhoneError('Phone number should only contain numbers');
      isValid = false;
    }
    
    // Check if phone number is exactly 11 digits
    if (formData.phone && formData.phone.length < 11) {
      setPhoneError('Phone number must be 11 digits');
      isValid = false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      isValid = false;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      isValid = false;
    }
    
    if (!formData.phone || !formData.dateOfBirth || !formData.gender) {
      toast.error('Please fill in all personal information fields');
      isValid = false;
    }
    
    if (role === 'student' && !formData.studentId) {
      toast.error('Please enter your Student ID');
      isValid = false;
    }
    
    if (role === 'staff' && !formData.staffId) {
      toast.error('Please enter your Staff ID');
      isValid = false;
    }

    if (!formData.faculty) {
      toast.error('Please select your Faculty/College');
      isValid = false;
    }

    if (!formData.consentGiven) {
      toast.error('You must agree to the Privacy Policy and Terms & Conditions');
      isValid = false;
    }
    
    // Check if email is already in use
    if (formData.email && isValid) {
      const emailAvailable = await checkEmailAvailability(formData.email);
      if (!emailAvailable) {
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateForm())) return;
    
    try {
      const result = await register(
        {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender as 'male' | 'female' | 'other',
          address: formData.address,
          emergencyContact: formData.emergencyContact,
          faculty: formData.faculty,
          consentGiven: formData.consentGiven,
          ...(role === 'student' && {
            studentId: formData.studentId,
            department: formData.department,
          }),
          ...(role === 'staff' && {
            staffId: formData.staffId,
            position: formData.position,
          }),
        },
        formData.password
      );
      
      if (result.requiresVerification) {
        // Email verification is required
        if (onSuccess) {
          onSuccess(formData.email);
        } else {
          navigate('/login');
        }
      } else {
        // No verification required, direct login
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Error is already displayed by the AuthContext
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2 text-medical-primary">
          <User className="h-5 w-5" />
          Account Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
              className={`auth-input mt-1 ${nameError ? 'border-red-500' : ''}`}
            />
            {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className={`auth-input mt-1 ${emailError ? 'border-red-500' : ''}`}
              />
              {isCheckingEmail && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-medical-primary" />
                </div>
              )}
            </div>
            {emailError && (
              <div className="flex items-center text-red-500 text-sm mt-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                {emailError}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="auth-input mt-1 pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-medical-primary h-5 w-5"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="auth-input mt-1 pr-10"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-medical-primary h-5 w-5"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2 text-medical-primary">
          <BookOpen className="h-5 w-5" />
          Faculty/College *
        </h3>
        <div>
          <Select 
            value={formData.faculty} 
            onValueChange={(value) => handleSelectChange('faculty', value)}
          >
            <SelectTrigger className="mt-1 border-2 border-medical-primary">
              <SelectValue placeholder="Select your faculty or college" />
            </SelectTrigger>
            <SelectContent>
              {FACULTY_OPTIONS.map((faculty) => (
                <SelectItem key={faculty} value={faculty}>
                  {faculty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-medical-primary">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone Number * (11 digits)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              maxLength={11} 
              placeholder="11 digit number"
              className={`auth-input mt-1 ${phoneError ? 'border-red-500' : ''}`}
            />
            {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className="auth-input mt-1"
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender *</Label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => handleSelectChange('gender', value)}
            >
              <SelectTrigger id="gender" className="mt-1 border-2 border-medical-primary">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              className="auth-input mt-1"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              name="emergencyContact"
              type="text"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="Name: Phone Number"
              className="auth-input mt-1"
            />
          </div>
        </div>
      </div>

      {role === 'student' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-medical-primary">Student Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="studentId">Student ID *</Label>
              <Input
                id="studentId"
                name="studentId"
                type="text"
                value={formData.studentId}
                onChange={handleChange}
                required
                className="auth-input mt-1"
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                className="auth-input mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {role === 'staff' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-medical-primary">Staff Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="staffId">Staff ID *</Label>
              <Input
                id="staffId"
                name="staffId"
                type="text"
                value={formData.staffId}
                onChange={handleChange}
                required
                className="auth-input mt-1"
              />
            </div>

            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                name="position"
                type="text"
                value={formData.position}
                onChange={handleChange}
                className="auth-input mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy and Terms Consent Checkbox */}
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="consent" 
          checked={consentChecked}
          onCheckedChange={handleConsentChange}
          className="mt-1"
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="consent"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the <a href="#" className="text-medical-primary hover:underline">Privacy Policy</a> and <a href="#" className="text-medical-primary hover:underline">Terms & Conditions</a> *
          </label>
          <p className="text-xs text-gray-500">
            By selecting this, you acknowledge that you have read and understood our policies.
          </p>
        </div>
      </div>

      <div>
        <Button
          type="submit"
          className="w-full bg-medical-secondary hover:bg-medical-primary text-white font-bold py-3 px-4 rounded-md"
          disabled={isRegistering || !!nameError || !!phoneError}
        >
          {isRegistering ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <User className="mr-2 h-4 w-4" />
              Register
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};

export default RegistrationForm;
