
import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

// Define the API URL
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

const API_URL = getApiUrl();

interface PatientEditFormProps {
  patientId: string;
  onSuccess?: () => void;
}

const PatientEditForm: React.FC<PatientEditFormProps> = ({ patientId, onSuccess }) => {
  const { user, updatePatient } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [patient, setPatient] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      setIsLoading(true);
      try {
        // Check if in preview mode
        if (window.location.hostname.includes('lovableproject.com')) {
          // Use sample data in preview mode
          const sampleUsers = (window as any).sampleUsers || [];
          const samplePatient = sampleUsers.find((u: any) => u.id === patientId);
          if (samplePatient) {
            setPatient(samplePatient);
            setFormData({
              name: samplePatient.name,
              email: samplePatient.email,
              phone: samplePatient.phone,
              dateOfBirth: samplePatient.dateOfBirth,
              gender: samplePatient.gender,
              address: samplePatient.address,
              emergencyContact: samplePatient.emergencyContact,
              studentId: samplePatient.studentId,
              department: samplePatient.department,
            });
          }
          setIsLoading(false);
          return;
        }

        // Fetch from API in non-preview mode
        const response = await axios.get(`${API_URL}/users/${patientId}`);
        const patientData = response.data;
        
        setPatient({
          id: patientData.id,
          name: patientData.name,
          email: patientData.email,
          role: patientData.role,
          phone: patientData.phone || '',
          dateOfBirth: patientData.date_of_birth || '',
          gender: patientData.gender,
          address: patientData.address || '',
          emergencyContact: patientData.emergency_contact || '',
          studentId: patientData.student_id || '',
          department: patientData.department || '',
          staffId: patientData.staff_id || '',
          position: patientData.position || '',
          createdAt: patientData.created_at,
          updatedAt: patientData.updated_at,
        });
        
        setFormData({
          name: patientData.name,
          email: patientData.email,
          phone: patientData.phone || '',
          dateOfBirth: patientData.date_of_birth || '',
          gender: patientData.gender,
          address: patientData.address || '',
          emergencyContact: patientData.emergency_contact || '',
          studentId: patientData.student_id || '',
          department: patientData.department || '',
        });
      } catch (error) {
        console.error('Error fetching patient data:', error);
        toast.error('Failed to load patient data');
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value as 'male' | 'female' | 'other' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updatePatient(patientId, formData);
      toast.success('Patient data updated successfully');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating patient data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-500">
            You don't have permission to edit patient data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Patient Information</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center">Loading patient data...</p>
        ) : patient ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="form-group">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={handleGenderChange}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {patient.role === 'student' && (
                <>
                  <div className="form-group">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      name="studentId"
                      value={formData.studentId || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department || ''}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}

              <div className="form-group md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group md:col-span-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Textarea
                  id="emergencyContact"
                  name="emergencyContact"
                  rows={2}
                  placeholder="Name: Relationship: Phone number:"
                  value={formData.emergencyContact || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6">
              <Button
                type="submit"
                className="bg-medical-primary hover:bg-medical-secondary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-center text-red-500">
            Failed to load patient data. Please try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientEditForm;
