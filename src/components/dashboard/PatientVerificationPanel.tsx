import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { User as UserType } from '@/types';
import axios from 'axios';

interface PatientVerificationPanelProps {
  className?: string;
}

const PatientVerificationPanel: React.FC<PatientVerificationPanelProps> = ({ className }) => {
  const [unverifiedPatients, setUnverifiedPatients] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState<Record<string, boolean>>({});

  // Function to get API URL
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

  // Fetch unverified patients
  const fetchUnverifiedPatients = async () => {
    setIsLoading(true);
    const isPreviewMode = window.location.hostname.includes('lovableproject.com');
    
    if (isPreviewMode) {
      // Use sample data in preview mode
      import('@/types').then(({ SAMPLE_USERS }) => {
        const unverified = SAMPLE_USERS.filter(user => 
          (user.role === 'student' || user.role === 'staff') &&
          !user.email_verified
        );
        setUnverifiedPatients(unverified);
        setIsLoading(false);
      });
      return;
    }

    try {
      const API_URL = getApiUrl();
      console.log('Fetching unverified patients from:', API_URL);
      
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      console.log('All users from API:', response.data);

      // Filter for unverified patients (students and staff)
      const unverified = response.data.filter((user: UserType) => 
        (user.role === 'student' || user.role === 'staff') &&
        !user.email_verified
      );

      console.log('Filtered unverified patients:', unverified);
      setUnverifiedPatients(unverified);
    } catch (error) {
      console.error('Error fetching unverified patients:', error);
      toast.error('Failed to fetch unverified patients');
      setUnverifiedPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify a patient manually
  const verifyPatient = async (patientId: string) => {
    setIsVerifying(prev => ({ ...prev, [patientId]: true }));
    console.log('Verifying patient with ID:', patientId);

    try {
      const API_URL = getApiUrl();
      
      // Send the correct property name that matches the backend userController
      const updateData = {
        emailVerified: true  // This matches the camelCase property the backend expects
      };
      
      console.log('Sending update request to:', `${API_URL}/users/${patientId}`);
      console.log('Update data:', updateData);
      
      const response = await axios.put(`${API_URL}/users/${patientId}`, updateData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      console.log('Update response:', response.data);

      // Remove the patient from the unverified list
      setUnverifiedPatients(prev => prev.filter(patient => patient.id !== patientId));
      
      toast.success('Patient verified successfully');
    } catch (error) {
      console.error('Error verifying patient:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to verify patient');
    } finally {
      setIsVerifying(prev => ({ ...prev, [patientId]: false }));
    }
  };

  // Reject/delete a patient registration
  const rejectPatient = async (patientId: string) => {
    setIsVerifying(prev => ({ ...prev, [patientId]: true }));
    console.log('Rejecting patient with ID:', patientId);

    try {
      const API_URL = getApiUrl();
      
      console.log('Sending delete request to:', `${API_URL}/users/${patientId}`);
      
      const response = await axios.delete(`${API_URL}/users/${patientId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      console.log('Delete response:', response.data);

      // Remove the patient from the unverified list
      setUnverifiedPatients(prev => prev.filter(patient => patient.id !== patientId));
      
      toast.success('Patient registration rejected');
    } catch (error) {
      console.error('Error rejecting patient:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to reject patient');
    } finally {
      setIsVerifying(prev => ({ ...prev, [patientId]: false }));
    }
  };

  useEffect(() => {
    fetchUnverifiedPatients();
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Patient Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Verification
            {unverifiedPatients.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unverifiedPatients.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchUnverifiedPatients}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {unverifiedPatients.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All patients verified</h3>
            <p className="text-sm text-gray-500">
              No pending patient registrations to review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {unverifiedPatients.map((patient) => (
              <div
                key={patient.id}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{patient.name}</h4>
                      <Badge variant="outline" className="capitalize">
                        {patient.role}
                      </Badge>
                      <Badge variant="secondary">
                        Unverified
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {patient.email}
                      </div>
                      
                      {patient.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {patient.phone}
                        </div>
                      )}
                      
                      {patient.studentId && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Student ID: {patient.studentId}
                        </div>
                      )}
                      
                      {patient.staffId && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Staff ID: {patient.staffId}
                        </div>
                      )}
                      
                      {patient.department && (
                        <div className="text-xs">
                          Department: {patient.department}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => verifyPatient(patient.id)}
                      disabled={isVerifying[patient.id]}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isVerifying[patient.id] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectPatient(patient.id)}
                      disabled={isVerifying[patient.id]}
                    >
                      {isVerifying[patient.id] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientVerificationPanel;
