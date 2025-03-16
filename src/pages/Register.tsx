
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { GraduationCap, Users, ArrowLeft } from 'lucide-react';
import RegistrationForm from '@/components/forms/RegistrationForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Register: React.FC = () => {
  const [activeTab, setActiveTab] = useState('student');
  const navigate = useNavigate();
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  const handleSuccess = () => {
    toast.success("Registration successful! Redirecting to dashboard...");
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <AuthLayout>
      <div className="mb-4">
        <Button 
          variant="ghost" 
          className="p-0 h-auto flex items-center text-gray-500 hover:text-gray-700"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
      
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
        
        <TabsContent value="student">
          <RegistrationForm role="student" onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="staff">
          <RegistrationForm role="staff" onSuccess={handleSuccess} />
        </TabsContent>

        <div className="mt-6 text-sm text-center">
          <Link
            to="/login"
            className="font-medium text-medical-secondary hover:text-medical-primary"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </Tabs>
    </AuthLayout>
  );
};

export default Register;
