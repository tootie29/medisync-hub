
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Users, ArrowLeft, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EmailVerification from '@/components/auth/EmailVerification';
import { useAuth } from '@/context/AuthContext';
import StaffRegistrationForm from '@/components/forms/StaffRegistrationForm';

const StaffRegistration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('doctor');
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
        <h2 className="text-2xl font-bold text-medical-primary">MEDICAL STAFF REGISTRATION</h2>
      </div>
      
      <Tabs defaultValue="doctor" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-medical-light">
          <TabsTrigger 
            value="doctor" 
            className="flex items-center gap-2 data-[state=active]:bg-medical-primary data-[state=active]:text-white"
          >
            <UserCheck className="h-4 w-4" />
            Doctor
          </TabsTrigger>
          <TabsTrigger 
            value="head nurse" 
            className="flex items-center gap-2 data-[state=active]:bg-medical-primary data-[state=active]:text-white"
          >
            <Users className="h-4 w-4" />
            Head Nurse
          </TabsTrigger>
          <TabsTrigger 
            value="admin" 
            className="flex items-center gap-2 data-[state=active]:bg-medical-primary data-[state=active]:text-white"
          >
            <Users className="h-4 w-4" />
            Admin
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="doctor">
          <StaffRegistrationForm role="doctor" onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="head nurse">
          <StaffRegistrationForm role="head nurse" onSuccess={handleSuccess} />
        </TabsContent>
        
        <TabsContent value="admin">
          <StaffRegistrationForm role="admin" onSuccess={handleSuccess} />
        </TabsContent>

        <div className="mt-6 text-sm text-center">
          <Link
            to="/login"
            className="font-medium text-medical-primary hover:text-medical-secondary"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </Tabs>
    </AuthLayout>
  );
};

export default StaffRegistration;
