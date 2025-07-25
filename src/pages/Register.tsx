
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { GraduationCap, Users, ArrowLeft, Mail } from 'lucide-react';
import RegistrationForm from '@/components/forms/RegistrationForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EmailVerification from '@/components/auth/EmailVerification';
import { useAuth } from '@/context/AuthContext';

const Register: React.FC = () => {
  const [activeTab, setActiveTab] = useState('student');
  const navigate = useNavigate();
  const { verificationEmail } = useAuth();
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  
  React.useEffect(() => {
    // If there's a verification email, show the verification screen
    if (verificationEmail) {
      setRegisteredEmail(verificationEmail);
      setShowVerification(true);
    }
  }, [verificationEmail]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleBack = () => {
    if (showVerification) {
      setShowVerification(false);
    } else {
      navigate(-1); // Go back to the previous page
    }
  };

  const handleSuccess = (email: string) => {
    setRegisteredEmail(email);
    setShowVerification(true);
  };

  const handleBackToRegister = () => {
    setShowVerification(false);
  };

  if (showVerification) {
    return (
      <AuthLayout>
        <div className="mb-4">
          <Button 
            variant="ghost" 
            className="p-0 h-auto flex items-center text-medical-primary hover:text-medical-secondary"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        
        <EmailVerification email={registeredEmail} onBack={handleBackToRegister} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-4">
        <Button 
          variant="ghost" 
          className="p-0 h-auto flex items-center text-medical-primary hover:text-medical-secondary"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
      
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-medical-primary">REGISTER ACCOUNT</h2>
      </div>
      
      <Tabs defaultValue="student" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-medical-light">
          <TabsTrigger 
            value="student" 
            className="flex items-center gap-2 data-[state=active]:bg-medical-primary data-[state=active]:text-white"
          >
            <GraduationCap className="h-4 w-4" />
            Student
          </TabsTrigger>
          <TabsTrigger 
            value="staff" 
            className="flex items-center gap-2 data-[state=active]:bg-medical-primary data-[state=active]:text-white"
          >
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

        <div className="mt-6 text-sm text-center space-y-2">
          <div>
            <Link
              to="/login"
              className="font-medium text-medical-primary hover:text-medical-secondary"
            >
              Already have an account? Sign in
            </Link>
          </div>
          <div>
            <Link
              to="/staff-register"
              className="font-medium text-medical-primary hover:text-medical-secondary"
            >
              Are you a doctor, head nurse or admin? Register here
            </Link>
          </div>
        </div>
      </Tabs>
    </AuthLayout>
  );
};

export default Register;
