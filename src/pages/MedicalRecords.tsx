
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { MedicalRecord, SAMPLE_USERS, VitalSigns } from '@/types';
import { format } from 'date-fns';
import { Activity, Calendar, FileText, Filter, Award, User } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocation, useNavigate } from 'react-router-dom';

const MedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const { 
    getMedicalRecordsByPatientId, 
    addMedicalRecord, 
    updateMedicalRecord,
    deleteMedicalRecord,
    getUserById
  } = useData();
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const patientIdFromUrl = queryParams.get('patient');
  
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>('date-desc');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [formData, setFormData] = useState<Partial<MedicalRecord>>({
    height: 0,
    weight: 0,
    bloodPressure: '',
    temperature: 36.6,
    diagnosis: '',
    notes: '',
    medications: [],
    followUpDate: '',
    certificateEnabled: false,
    vitalSigns: {
      heartRate: 0,
      bloodGlucose: 0,
      respiratoryRate: 0,
      oxygenSaturation: 0
    }
  });

  const isDoctor = user?.role === 'head nurse' || user?.role === 'doctor';
  const isPatient = user?.role === 'student' || user?.role === 'staff';
  
  // Check if user is medical staff (specifically doctor or head nurse, NOT admin)
  const isMedicalStaffNotAdmin = user?.role === 'head nurse' || user?.role === 'doctor';
  
  console.log("MedicalRecords component rendering");
  console.log("User:", user);
  console.log("Patient ID from URL:", patientIdFromUrl);
  console.log("Is doctor:", isDoctor);
  console.log("Is patient:", isPatient);
  console.log("Is medical staff not admin:", isMedicalStaffNotAdmin);
  
  useEffect(() => {
    if (patientIdFromUrl) {
      console.log("Attempting to set patient ID from URL:", patientIdFromUrl);
      setSelectedPatientId(patientIdFromUrl);
    } else if (isPatient && user) {
      console.log("Setting selected patient ID from user:", user.id);
      setSelectedPatientId(user.id);
    }
  }, [patientIdFromUrl, isPatient, user]);
  
  const selectedPatient = selectedPatientId ? getUserById(selectedPatientId) : null;
  console.log("Selected patient:", selectedPatient);
  console.log("Selected patient ID:", selectedPatientId);
  
  const unsortedMedicalRecords = selectedPatientId 
    ? getMedicalRecordsByPatientId(selectedPatientId)
    : [];
      
  console.log("Unsorted medical records:", unsortedMedicalRecords);
      
  const medicalRecords = [...unsortedMedicalRecords].sort((a, b) => {
    switch (sortOption) {
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  console.log("Sorted medical records:", medicalRecords);

  const calculateBmi = (height: number, weight: number): number => {
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      return weight / (heightInMeters * heightInMeters);
    }
    return 0;
  };

  const safeToFixed = (value: any, digits: number = 1, height?: number, weight?: number): string => {
    if (typeof value === 'number' && !isNaN(value) && value > 0) {
      return value.toFixed(digits);
    } else if (typeof value === 'string' && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      return parseFloat(value).toFixed(digits);
    }
    
    if (height && weight && height > 0 && weight > 0) {
      const calculatedBmi = calculateBmi(height, weight);
      if (calculatedBmi > 0) {
        return calculatedBmi.toFixed(digits);
      }
    }
    
    return '0.0';
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let parsedValue: any = value;
    
    if (name === 'height' || name === 'weight' || name === 'temperature') {
      parsedValue = parseFloat(value) || 0;
    }
    
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };
  
  const handleMedicationsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const medicationsList = e.target.value.split(',').map(med => med.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, medications: medicationsList }));
  };

  const resetForm = (record?: MedicalRecord) => {
    if (record) {
      setFormData({
        height: record.height,
        weight: record.weight,
        bloodPressure: record.bloodPressure || '',
        temperature: record.temperature || 36.6,
        diagnosis: record.diagnosis || '',
        notes: record.notes || '',
        medications: record.medications || [],
        followUpDate: record.followUpDate || '',
        certificateEnabled: record.certificateEnabled !== undefined ? record.certificateEnabled : false,
        vitalSigns: {
          heartRate: record.vitalSigns?.heartRate || 0,
          bloodGlucose: record.vitalSigns?.bloodGlucose || 0,
          respiratoryRate: record.vitalSigns?.respiratoryRate || 0,
          oxygenSaturation: record.vitalSigns?.oxygenSaturation || 0
        }
      });
      setEditingRecordId(record.id);
    } else {
      setFormData({
        height: 0,
        weight: 0,
        bloodPressure: '',
        temperature: 36.6,
        diagnosis: '',
        notes: '',
        medications: [],
        followUpDate: '',
        certificateEnabled: false,
        vitalSigns: {
          heartRate: 0,
          bloodGlucose: 0,
          respiratoryRate: 0,
          oxygenSaturation: 0
        }
      });
      setEditingRecordId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.height || !formData.weight) {
      toast.error('Height and weight are required');
      return;
    }
    
    if (!selectedPatientId) {
      toast.error('No patient selected');
      return;
    }
    
    const heightInMeters = formData.height as number / 100;
    const calculatedBmi = (formData.weight as number) / (heightInMeters * heightInMeters);
    const isHealthyBmi = calculatedBmi >= 18.5 && calculatedBmi < 25;
    
    try {
      console.log('Submitting form with certificateEnabled:', formData.certificateEnabled);
      console.log('Selected patient ID:', selectedPatientId);
      
      if (editingRecordId) {
        console.log('Updating record:', editingRecordId);
        console.log('With data:', {
          ...formData,
          patientId: selectedPatientId,
          bmi: calculatedBmi,
          certificateEnabled: Boolean(formData.certificateEnabled)
        });
        
        updateMedicalRecord(editingRecordId, {
          ...formData,
          patientId: selectedPatientId,
          bmi: calculatedBmi,
          certificateEnabled: Boolean(formData.certificateEnabled)
        });
        setEditingRecordId(null);
      } else {
        const patientId = selectedPatientId;
        console.log('Adding new record for patient:', patientId);
        console.log('With data:', {
          patientId,
          doctorId: user?.id,
          date: new Date().toISOString().split('T')[0],
          height: formData.height,
          weight: formData.weight,
          certificateEnabled: formData.certificateEnabled !== undefined ? 
            Boolean(formData.certificateEnabled) : isHealthyBmi,
        });
        
        addMedicalRecord({
          patientId,
          doctorId: user?.id as string,
          date: new Date().toISOString().split('T')[0],
          height: formData.height as number,
          weight: formData.weight as number,
          bloodPressure: formData.bloodPressure,
          temperature: formData.temperature,
          diagnosis: formData.diagnosis,
          notes: formData.notes,
          medications: formData.medications,
          followUpDate: formData.followUpDate,
          certificateEnabled: formData.certificateEnabled !== undefined ? 
            Boolean(formData.certificateEnabled) : isHealthyBmi,
          vitalSigns: {
            heartRate: formData.vitalSigns?.heartRate || 0,
            bloodGlucose: formData.vitalSigns?.bloodGlucose || 0,
            respiratoryRate: formData.vitalSigns?.respiratoryRate || 0,
            oxygenSaturation: formData.vitalSigns?.oxygenSaturation || 0
          }
        });
      }
      
      setIsAddingRecord(false);
      resetForm();
    } catch (error) {
      console.error('Error saving medical record:', error);
      toast.error('An error occurred while saving the medical record');
    }
  };

  const formatMedications = (medications?: string[]) => {
    if (!medications || medications.length === 0) return 'None';
    return medications.join(', ');
  };

  const handleDeleteRecord = (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this medical record?')) {
      deleteMedicalRecord(recordId);
    }
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = getUserById(doctorId);
    return doctor ? `Dr. ${doctor.name}` : 'Unknown Doctor';
  };

  useEffect(() => {
    if (isDoctor && !selectedPatientId && !patientIdFromUrl) {
      console.log("No patient selected, navigating to dashboard");
      navigate('/dashboard');
    }
  }, [isDoctor, selectedPatientId, patientIdFromUrl, navigate]);

  useEffect(() => {
    if (selectedPatientId && unsortedMedicalRecords.length === 0) {
      console.log("Patient selected but no records found:", selectedPatientId);
      const patientExists = SAMPLE_USERS.some(u => u.id === selectedPatientId);
      console.log("Patient exists in sample data:", patientExists);
    }
  }, [selectedPatientId, unsortedMedicalRecords]);

  // Check whether the current user can add records for this patient
  const canAddRecords = () => {
    // Only doctors and head nurse roles can add records (not admin)
    return isMedicalStaffNotAdmin;
  };

  return (
    <MainLayout>
      <div className="medical-container">
        <h1 className="page-title">Medical Records</h1>

        <div className="mt-6">
          {selectedPatient && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
              <h2 className="text-xl font-semibold">
                {isPatient ? 'Your Medical Records' : `Medical Records for ${selectedPatient.name}`}
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {canAddRecords() && (
                  <Button 
                    onClick={() => {
                      setIsAddingRecord(true);
                      resetForm();
                    }}
                    className="bg-medical-primary hover:bg-medical-secondary"
                  >
                    Add New Record
                  </Button>
                )}
                
                <div className="flex items-center">
                  <label htmlFor="sortOption" className="mr-2 text-sm">Sort by:</label>
                  <select 
                    id="sortOption"
                    className="text-sm border rounded px-2 py-1"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                  </select>
                </div>
                
                <div className="flex border rounded overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`px-3 ${viewMode === 'card' ? 'bg-gray-100' : ''}`}
                    onClick={() => setViewMode('card')}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`px-3 ${viewMode === 'table' ? 'bg-gray-100' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {(isAddingRecord || editingRecordId) && selectedPatientId && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingRecordId ? 'Edit Medical Record' : 'Add New Medical Record'}
                  {selectedPatient && (
                    <span className="ml-2 text-base text-gray-500 flex items-center">
                      <User className="h-4 w-4 mr-1" /> 
                      for <span className="font-semibold ml-1">{selectedPatient.name}</span>
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  {selectedPatient && (
                    <div className="bg-gray-50 p-3 rounded-md mb-4 flex items-center">
                      <User className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        Adding medical record for patient: 
                        <span className="font-medium ml-1">{selectedPatient.name}</span>
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        name="height"
                        type="number"
                        value={formData.height}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        value={formData.weight}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2 mt-2 pb-2 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="certificateEnabled" className="font-medium">Health Certificate</Label>
                          <p className="text-sm text-gray-500">
                            Enable health certificate for this patient
                            {formData.height && formData.weight ? (
                              <span className="ml-1">
                                (BMI: {calculateBmi(formData.height as number, formData.weight as number).toFixed(1)})
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="certificateEnabled"
                            checked={formData.certificateEnabled}
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({
                                ...prev,
                                certificateEnabled: checked
                              }));
                            }}
                          />
                          <Award className={`h-5 w-5 ${formData.certificateEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bloodPressure">Blood Pressure</Label>
                      <Input
                        id="bloodPressure"
                        name="bloodPressure"
                        placeholder="e.g., 120/80"
                        value={formData.bloodPressure}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        name="temperature"
                        type="number"
                        step="0.1"
                        value={formData.temperature}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="heartRate">Heart Rate (BPM)</Label>
                      <Input
                        id="heartRate"
                        name="heartRate"
                        type="number"
                        value={formData.vitalSigns?.heartRate || ''}
                        onChange={(e) => {
                          const heartRate = e.target.value ? Number(e.target.value) : 0;
                          setFormData(prev => ({
                            ...prev,
                            vitalSigns: {
                              ...prev.vitalSigns,
                              heartRate
                            }
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bloodGlucose">Blood Glucose (mg/dL)</Label>
                      <Input
                        id="bloodGlucose"
                        name="bloodGlucose"
                        type="number"
                        value={formData.vitalSigns?.bloodGlucose || ''}
                        onChange={(e) => {
                          const bloodGlucose = e.target.value ? Number(e.target.value) : 0;
                          setFormData(prev => ({
                            ...prev,
                            vitalSigns: {
                              ...prev.vitalSigns,
                              bloodGlucose
                            }
                          }));
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
                      <Input
                        id="respiratoryRate"
                        name="respiratoryRate"
                        type="number"
                        value={formData.vitalSigns?.respiratoryRate || ''}
                        onChange={(e) => {
                          const respiratoryRate = e.target.value ? Number(e.target.value) : 0;
                          setFormData(prev => ({
                            ...prev,
                            vitalSigns: {
                              ...prev.vitalSigns,
                              respiratoryRate
                            }
                          }));
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="oxygenSaturation">Oxygen Saturation (%)</Label>
                      <Input
                        id="oxygenSaturation"
                        name="oxygenSaturation"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.vitalSigns?.oxygenSaturation || ''}
                        onChange={(e) => {
                          const oxygenSaturation = e.target.value ? Number(e.target.value) : 0;
                          setFormData(prev => ({
                            ...prev,
                            vitalSigns: {
                              ...prev.vitalSigns,
                              oxygenSaturation
                            }
                          }));
                        }}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="diagnosis">Diagnosis</Label>
                      <Input
                        id="diagnosis"
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="medications">Medications (comma separated)</Label>
                      <Textarea
                        id="medications"
                        name="medications"
                        value={formData.medications?.join(', ')}
                        onChange={handleMedicationsChange}
                        rows={2}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="followUpDate">Follow-up Date</Label>
                      <Input
                        id="followUpDate"
                        name="followUpDate"
                        type="date"
                        value={formData.followUpDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingRecord(false);
                        setEditingRecordId(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-medical-primary hover:bg-medical-secondary">
                      {editingRecordId ? 'Update Record' : 'Add Record'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {medicalRecords.length > 0 ? (
            <>
              {viewMode === 'card' ? (
                <div className="space-y-4">
                  {medicalRecords.map(record => {
                    const doctor = getUserById(record.doctorId);
                    
                    const displayBmi = (() => {
                      if (record.bmi && record.bmi > 0) {
                        return safeToFixed(record.bmi);
                      }
                      
                      if (record.height && record.weight && record.height > 0 && record.weight > 0) {
                        const heightInMeters = record.height / 100;
                        const calculatedBmi = record.weight / (heightInMeters * heightInMeters);
                        return safeToFixed(calculatedBmi);
                      }
                      
                      return "0.0";
                    })();
                    
                    const bmiValue = parseFloat(displayBmi);
                    const isHealthyBmi = bmiValue >= 18.5 && bmiValue < 25;
                    
                    return (
                      <Card key={record.id} className="overflow-hidden">
                        <CardHeader className="bg-gray-50">
                          <div className="flex justify-between">
                            <CardTitle className="text-lg">
                              Medical Record - {format(new Date(record.date), 'PPP')}
                            </CardTitle>
                            {isDoctor && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    resetForm(record);
                                    setIsAddingRecord(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteRecord(record.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {doctor ? `Examined by Dr. ${doctor.name}` : 'Self-recorded'}
                            <span className="mx-2">•</span>
                            Last updated: {format(new Date(record.updatedAt), 'PPP')}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                            <div>
                              <p className="text-sm text-gray-500">Height</p>
                              <p className="font-medium">{record.height} cm</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Weight</p>
                              <p className="font-medium">{record.weight} kg</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">BMI</p>
                              <p className="font-medium">{displayBmi}</p>
                            </div>
                            
                            {isHealthyBmi && (
                              <div>
                                <p className="text-sm text-gray-500">Certificate</p>
                                <p className="font-medium text-green-500">
                                  {record.certificateEnabled ? "Available" : "Not enabled"}
                                </p>
                              </div>
                            )}
                            
                            {(record.bloodPressure || record.vitalSigns?.bloodPressure) && (
                              <div>
                                <p className="text-sm text-gray-500">Blood Pressure</p>
                                <p className="font-medium">{record.vitalSigns?.bloodPressure || record.bloodPressure}</p>
                              </div>
                            )}
                            
                            {record.temperature && (
                              <div>
                                <p className="text-sm text-gray-500">Temperature</p>
                                <p className="font-medium">{record.temperature} °C</p>
                              </div>
                            )}
                            
                            {record.vitalSigns?.heartRate && (
                              <div>
                                <p className="text-sm text-gray-500">Heart Rate</p>
                                <p className="font-medium">{record.vitalSigns.heartRate} BPM</p>
                              </div>
                            )}
                            
                            {record.vitalSigns?.bloodGlucose && (
                              <div>
                                <p className="text-sm text-gray-500">Blood Glucose</p>
                                <p className="font-medium">{record.vitalSigns.bloodGlucose} mg/dL</p>
                              </div>
                            )}
                            
                            {record.vitalSigns?.respiratoryRate && (
                              <div>
                                <p className="text-sm text-gray-500">Respiratory Rate</p>
                                <p className="font-medium">{record.vitalSigns.respiratoryRate} breaths/min</p>
                              </div>
                            )}
                            
                            {record.vitalSigns?.oxygenSaturation && (
                              <div>
                                <p className="text-sm text-gray-500">Oxygen Saturation</p>
                                <p className="font-medium">{record.vitalSigns.oxygenSaturation}%</p>
                              </div>
                            )}
                            
                            {doctor && (
                              <div>
                                <p className="text-sm text-gray-500">Attending Doctor</p>
                                <p className="font-medium">Dr. {doctor.name}</p>
                              </div>
                            )}
                            {record.diagnosis && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Diagnosis</p>
                                <p className="font-medium">{record.diagnosis}</p>
                              </div>
                            )}
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500">Medications</p>
                              <p className="font-medium">{formatMedications(record.medications)}</p>
                            </div>
                            {record.notes && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Notes</p>
                                <p className="font-medium whitespace-pre-wrap">{record.notes}</p>
                              </div>
                            )}
                            {record.followUpDate && (
                              <div>
                                <p className="text-sm text-gray-500">Follow-up Date</p>
                                <p className="font-medium">{format(new Date(record.followUpDate), 'PPP')}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>BMI</TableHead>
                        <TableHead>Certificate</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Follow-up</TableHead>
                        {isDoctor && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalRecords.map(record => {
                        const displayBmi = (() => {
                          if (record.bmi && record.bmi > 0) {
                            return safeToFixed(record.bmi);
                          }
                          
                          if (record.height && record.weight && record.height > 0 && record.weight > 0) {
                            const heightInMeters = record.height / 100;
                            const calculatedBmi = record.weight / (heightInMeters * heightInMeters);
                            return safeToFixed(calculatedBmi);
                          }
                          
                          return "0.0";
                        })();
                        
                        const bmiValue = parseFloat(displayBmi);
                        const isHealthyBmi = bmiValue >= 18.5 && bmiValue < 25;
                        
                        return (
                          <TableRow key={record.id}>
                            <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
                            <TableCell>{getDoctorName(record.doctorId)}</TableCell>
                            <TableCell>{displayBmi}</TableCell>
                            <TableCell>
                              {isHealthyBmi && record.certificateEnabled 
                                ? <span className="text-green-500">Available</span>
                                : <span className="text-gray-400">N/A</span>
                              }
                            </TableCell>
                            <TableCell>{record.diagnosis || 'N/A'}</TableCell>
                            <TableCell>
                              {record.followUpDate 
                                ? format(new Date(record.followUpDate), 'PPP')
                                : 'None'
                              }
                            </TableCell>
                            {isDoctor && (
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mr-2"
                                  onClick={() => {
                                    resetForm(record);
                                    setIsAddingRecord(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteRecord(record.id)}
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </>
          ) : (
            <Card className="text-center p-6">
              <div className="py-8">
                <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Medical Records Found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedPatientId 
                    ? "This patient doesn't have any medical records yet." 
                    : "Select a patient to view or add medical records."}
                </p>
                {canAddRecords() && selectedPatientId && (
                  <div className="mt-6">
                    <Button
                      onClick={() => {
                        setIsAddingRecord(true);
                        resetForm();
                      }}
                      className="bg-medical-primary hover:bg-medical-secondary"
                    >
                      Add First Record
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MedicalRecords;
