
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PatientEditForm from '@/components/patients/PatientEditForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PatientEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect if user is not a doctor or admin
  React.useEffect(() => {
    if (user && user.role !== 'doctor' && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  if (!id) {
    return (
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
          No patient ID provided.
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)} 
        className="mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <PatientEditForm 
        patientId={id} 
        onSuccess={() => navigate('/dashboard')} 
      />
    </div>
  );
};

export default PatientEdit;
