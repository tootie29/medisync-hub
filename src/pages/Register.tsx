
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/layout/AuthLayout';
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { ROLES } from '@/types';
import { toast } from "sonner";
import { GraduationCap, Users } from 'lucide-react';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as const,
    phone: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    address: '',
    emergencyContact: '',
    studentId: '',
    department: '',
    staffId: '',
    position: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setFormData((prev) => ({ 
      ...prev, 
      role: value === 'student' ? 'student' : 'staff'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (!formData.phone || !formData.dateOfBirth || !formData.gender) {
      toast.error('Please fill in all personal information fields');
      return;
    }
    
    if (activeTab === 'student' && !formData.studentId) {
      toast.error('Please enter your Student ID');
      return;
    }
    
    if (activeTab === 'staff' && !formData.staffId) {
      toast.error('Please enter your Staff ID');
      return;
    }
    
    setIsLoading(true);
    
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
          ...(activeTab === 'student' && {
            studentId: formData.studentId,
            department: formData.department,
          }),
          ...(activeTab === 'staff' && {
            staffId: formData.staffId,
            position: formData.position,
          }),
        },
        formData.password
      );
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Tabs defaultValue="student" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="student" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Student
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Information</h3>
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
                  className="mt-1"
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
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
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
                  className="mt-1"
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
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => handleSelectChange('gender', value)}
                >
                  <SelectTrigger id="gender" className="mt-1">
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
                  className="mt-1"
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
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <TabsContent value="student" className="space-y-4 mt-0">
            <h3 className="text-lg font-medium">Student Information</h3>
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
                  className="mt-1"
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
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4 mt-0">
            <h3 className="text-lg font-medium">Staff Information</h3>
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
                  className="mt-1"
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
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/login"
                className="font-medium text-medical-secondary hover:text-medical-primary"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-medical-primary hover:bg-medical-secondary"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </div>
              ) : (
                'Register'
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </AuthLayout>
  );
};

export default Register;
