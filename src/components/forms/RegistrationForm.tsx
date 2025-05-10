import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserRole } from '@/types';
import { toast } from "sonner";
import { UserPlus, User, Loader2, BookOpen, Eye, EyeOff } from 'lucide-react';

interface RegistrationFormProps {
  role: 'student' | 'staff';
  onSuccess?: () => void;
}

const FACULTY_OPTIONS = [
  'Radiology', 'Nursing', 'Business', 'Information Technology', 
  'Tourism Management', 'Communication', 'Education', 'Psychology', 
  'Criminology', 'Accountancy', 'Hospitality Management', 'Customs Administration',
  'IBED', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 
  'DPRO', 'PERSONNELS', 'Cafeteria', 'Technicians', 'Maintenance', 
  'TEACHING', 'College', 'Elementary', 'ALS', 'TESDA'
];

const RegistrationForm: React.FC<RegistrationFormProps> = ({ role, onSuccess }) => {
  const { register, isRegistering } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    
    if (!formData.phone || !formData.dateOfBirth || !formData.gender) {
      toast.error('Please fill in all personal information fields');
      return false;
    }
    
    if (role === 'student' && !formData.studentId) {
      toast.error('Please enter your Student ID');
      return false;
    }
    
    if (role === 'staff' && !formData.staffId) {
      toast.error('Please enter your Staff ID');
      return false;
    }

    if (!formData.faculty) {
      toast.error('Please select your Faculty/College');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await register(
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
      
      if (onSuccess) {
        onSuccess();
      } else {
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
              className="auth-input mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="auth-input mt-1"
            />
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
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              className="auth-input mt-1"
            />
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

      <div>
        <Button
          type="submit"
          className="w-full bg-medical-secondary hover:bg-medical-primary text-white font-bold py-3 px-4 rounded-md"
          disabled={isRegistering}
        >
          {isRegistering ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Register
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};

export default RegistrationForm;
