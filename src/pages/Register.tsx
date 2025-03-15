
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { GraduationCap, Users } from 'lucide-react';
import RegistrationForm from '@/components/forms/RegistrationForm';

const Register: React.FC = () => {
  const [activeTab, setActiveTab] = useState('student');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
        
        <TabsContent value="student">
          <RegistrationForm role="student" />
        </TabsContent>

        <TabsContent value="staff">
          <RegistrationForm role="staff" />
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
