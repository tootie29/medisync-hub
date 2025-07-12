import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MedicalRecord, 
  Appointment, 
  Medicine, 
  User,
  SAMPLE_USERS,
  CreateMedicalRecordInput
} from '@/types';
import { toast } from "sonner";
import axios from 'axios';

// Move this function inside the component or keep it as a standalone non-hook function
const getApiUrl = () => {
  // Always try to connect to API first, even in Lovable preview
  const hostname = window.location.hostname;
  
  // Check for environment variable first
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    console.log('Using environment API URL:', envApiUrl);
    return envApiUrl;
  }
  
  // Check if we're in a production environment
  if (hostname === "climasys.entrsolutions.com" || hostname === "app.climasys.entrsolutions.com") {
    console.log('Using production API URL');
    return 'https://api.climasys.entrsolutions.com/api';
  }
  
  // Always try localhost first, even in Lovable preview
  console.log('Using localhost API URL');
  return 'http://localhost:8080/api';
};

interface DataContextType {
  medicalRecords: MedicalRecord[];
  appointments: Appointment[];
  medicines: Medicine[];
  
  isLoadingRecords: boolean;
  isLoadingAppointments: boolean;
  isLoadingMedicines: boolean;
  
  getUserById: (id: string) => User | undefined;
  getUsersByRole: (role: string) => Promise<User[]>;
  
  getMedicalRecordsByPatientId: (patientId: string) => MedicalRecord[];
  getMedicalRecordById: (id: string) => MedicalRecord | undefined;
  addMedicalRecord: (record: CreateMedicalRecordInput) => Promise<MedicalRecord>;
  updateMedicalRecord: (id: string, record: Partial<MedicalRecord>) => Promise<MedicalRecord>;
  deleteMedicalRecord: (id: string) => Promise<void>;
  
  getAppointmentsByPatientId: (patientId: string) => Appointment[];
  getAppointmentsByDoctorId: (doctorId: string) => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Appointment>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  
  getMedicineById: (id: string) => Medicine | undefined;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Medicine>;
  updateMedicine: (id: string, medicine: Partial<Medicine>) => Promise<Medicine>;
  deleteMedicine: (id: string) => Promise<void>;
  
  refreshMedicalRecords: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
  refreshMedicines: () => Promise<void>;
  
  getApiUrl: () => string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Configure API client inside the component to avoid hooks outside components
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const API_URL = getApiUrl();
  console.log('Using API URL in DataContext:', API_URL);
  
  const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  apiClient.interceptors.response.use(
    response => response,
    async error => {
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }
      
      const originalRequest = error.config;
      
      if (originalRequest._retryCount >= 2) {
        console.error('Request failed after multiple retries:', error.message);
        return Promise.reject(error);
      }
      
      if (originalRequest._retryCount === undefined) {
        originalRequest._retryCount = 0;
      }
      
      originalRequest._retryCount++;
      
      console.log(`Retrying request (${originalRequest._retryCount}/2)...`);
      
      const delay = originalRequest._retryCount * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return apiClient(originalRequest);
    }
  );

  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(true);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(true);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState<boolean>(true);
  
  // Determine if we should use preview mode (only if API is completely unavailable)
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  useEffect(() => {
    // Always try to fetch from API first
    refreshMedicalRecords();
    refreshAppointments();
    refreshMedicines();
  }, []);

  const refreshMedicalRecords = async () => {
    setIsLoadingRecords(true);
    try {
      console.log('=== REFRESHING MEDICAL RECORDS ===');
      console.log('Attempting to fetch medical records from API:', API_URL);
      const response = await apiClient.get('/medical-records');
      console.log('Medical records API response:', response.data);
      console.log('Total records fetched from API:', response.data.length);
      
      // Log each record to see what data we're getting
      response.data.forEach((record: any, index: number) => {
        console.log(`Record ${index + 1}:`, {
          id: record.id,
          patientId: record.patientId,
          bmi: record.bmi,
          weight: record.weight,
          height: record.height,
          date: record.date
        });
      });
      
      setMedicalRecords(response.data);
      setIsPreviewMode(false);
      console.log('Medical records state updated successfully');
    } catch (error) {
      console.error('=== API ERROR FETCHING MEDICAL RECORDS ===');
      console.error('Error details:', error);
      console.log('API completely unavailable, entering preview mode');
      setMedicalRecords([]);
      setIsPreviewMode(true);
    } finally {
      setIsLoadingRecords(false);
      console.log('=== MEDICAL RECORDS REFRESH COMPLETE ===');
    }
  };

  const refreshAppointments = async () => {
    if (isPreviewMode) {
      setIsLoadingAppointments(false);
      return;
    }
    
    setIsLoadingAppointments(true);
    try {
      const response = await apiClient.get('/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const refreshMedicines = async () => {
    if (isPreviewMode) {
      setIsLoadingMedicines(false);
      return;
    }
    
    setIsLoadingMedicines(true);
    try {
      const response = await apiClient.get('/medicines');
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setMedicines([]);
    } finally {
      setIsLoadingMedicines(false);
    }
  };

  const getUserById = (id: string): User | undefined => {
    console.log('=== GETTING USER BY ID ===');
    console.log('Requested user ID:', id);
    
    if (!id) {
      console.log('No ID provided to getUserById');
      return undefined;
    }
    
    // First try exact match
    const exactMatch = SAMPLE_USERS.find(user => user.id === id);
    if (exactMatch) {
      console.log('Found exact user match:', exactMatch.name, 'with ID:', id);
      return exactMatch;
    }
    
    // If the ID has a prefix like 'user-'
    if (id.startsWith('user-')) {
      console.log('ID has user- prefix, trying to find user with numeric part');
      const numericId = id.replace('user-', '');
      
      // Try to find by numeric part
      const numericMatch = SAMPLE_USERS.find(user => user.id === numericId);
      if (numericMatch) {
        console.log('Found user with numeric ID part:', numericMatch.name, 'ID:', numericMatch.id);
        return numericMatch;
      }
      
      // Special handling for demo purposes - if in preview mode, find any user with matching role
      if (isPreviewMode) {
        console.log('In preview mode, trying to find any matching user by role');
        // For prefixed IDs that match pattern but not found, try to find any student/staff
        const fallbackUser = SAMPLE_USERS.find(u => u.role === 'student' || u.role === 'staff');
        if (fallbackUser) {
          console.log('Using fallback user for preview mode:', fallbackUser.name, 'ID:', fallbackUser.id);
          return fallbackUser;
        }
      }
    }
    
    console.log('No user found for ID:', id);
    console.log('Available users:', SAMPLE_USERS.map(u => ({ id: u.id, name: u.name })));
    return undefined;
  };

  const getUsersByRole = async (role: string): Promise<User[]> => {
    try {
      if (isPreviewMode) {
        // Return users from SAMPLE_USERS if in preview mode
        return SAMPLE_USERS.filter(user => user.role === role);
      }
      
      const response = await apiClient.get(`/users/role/${role}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users by role:', error);
      // Fallback to SAMPLE_USERS if API fails
      return SAMPLE_USERS.filter(user => user.role === role);
    }
  };

  const getMedicalRecordsByPatientId = (patientId: string): MedicalRecord[] => {
    console.log('=== GETTING MEDICAL RECORDS FOR PATIENT ===');
    console.log('Requested patient ID:', patientId);
    console.log('Total medical records available:', medicalRecords.length);
    console.log('Is preview mode:', isPreviewMode);
    console.log('Is loading records:', isLoadingRecords);
    
    // Log all available records and their patient IDs
    if (medicalRecords.length > 0) {
      console.log('Available medical records:');
      medicalRecords.forEach((record, index) => {
        console.log(`  Record ${index + 1}:`, {
          id: record.id,
          patientId: record.patientId,
          bmi: record.bmi,
          weight: record.weight,
          height: record.height,
          date: record.date
        });
      });
    } else {
      console.log('No medical records available in state');
    }
    
    // If we have real data from the API, use it
    if (!isPreviewMode && medicalRecords.length > 0) {
      console.log('Using real medical records from API');
      
      // Try exact match first
      const exactMatch = medicalRecords.filter(record => record.patientId === patientId);
      if (exactMatch.length > 0) {
        console.log('Found exact patient ID match:', exactMatch.length, 'records');
        console.log('Matched records:', exactMatch.map(r => ({ 
          id: r.id, 
          bmi: r.bmi, 
          weight: r.weight, 
          height: r.height 
        })));
        return exactMatch;
      }
      
      // Try with numeric ID if prefixed (user-1 -> 1)
      if (patientId && patientId.startsWith('user-')) {
        const numericId = patientId.replace('user-', '');
        console.log('Trying numeric ID:', numericId);
        const numericMatch = medicalRecords.filter(record => record.patientId === numericId);
        if (numericMatch.length > 0) {
          console.log('Found numeric patient ID match:', numericMatch.length, 'records');
          console.log('Matched records:', numericMatch.map(r => ({ 
            id: r.id, 
            bmi: r.bmi, 
            weight: r.weight, 
            height: r.height 
          })));
          return numericMatch;
        }
      }
      
      // Try with prefixed ID if numeric (1 -> user-1)  
      if (patientId && !patientId.startsWith('user-')) {
        const prefixedId = `user-${patientId}`;
        console.log('Trying prefixed ID:', prefixedId);
        const prefixedMatch = medicalRecords.filter(record => record.patientId === prefixedId);
        if (prefixedMatch.length > 0) {
          console.log('Found prefixed patient ID match:', prefixedMatch.length, 'records');
          console.log('Matched records:', prefixedMatch.map(r => ({ 
            id: r.id, 
            bmi: r.bmi, 
            weight: r.weight, 
            height: r.height 
          })));
          return prefixedMatch;
        }
      }
      
      // Check if any records exist for any user (for debugging)
      if (medicalRecords.length > 0) {
        console.log('No records found for patient ID, but records exist for other patients:');
        const uniquePatientIds = [...new Set(medicalRecords.map(r => r.patientId))];
        console.log('Available patient IDs in database:', uniquePatientIds);
      }
      
      console.log('No records found for patient ID in real data');
      return [];
    }
    
    // If we're in preview mode or no data available, return empty array
    console.log('No real medical records available - returning empty array');
    console.log('=== END MEDICAL RECORDS LOOKUP ===');
    return [];
  };

  const getMedicalRecordById = (id: string): MedicalRecord | undefined => {
    return medicalRecords.find(record => record.id === id);
  };

  const calculateBMI = (height: number, weight: number): number => {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(2));
  };

  const addMedicalRecord = async (record: CreateMedicalRecordInput): Promise<MedicalRecord> => {
    try {
      const bmi = calculateBMI(record.height, record.weight);
      
      let updatedVitalSigns = record.vitalSigns || {};
      if (record.bloodPressure && !updatedVitalSigns.bloodPressure) {
        updatedVitalSigns = {
          ...updatedVitalSigns,
          bloodPressure: record.bloodPressure
        };
      }
      
      const isHealthyBMI = bmi >= 18.5 && bmi < 25;
      const certificateEnabled = record.certificateEnabled !== undefined ? 
        record.certificateEnabled : isHealthyBMI;
      
      let finalPatientId = record.patientId;
      
      if (isPreviewMode && record.patientId.startsWith('user-')) {
        console.log('Using prefixed patient ID in preview mode:', finalPatientId);
      }
      
      const recordToCreate = {
        ...record,
        patientId: finalPatientId,
        bmi,
        certificateEnabled,
        vitalSigns: Object.keys(updatedVitalSigns).length > 0 ? updatedVitalSigns : undefined
      };
      
      console.log('Record to create with final patientId:', finalPatientId);
      
      if (isPreviewMode) {
        const mockRecord: MedicalRecord = {
          ...recordToCreate,
          id: `record-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bmi,
          certificateEnabled,
          vaccinations: record.vaccinations || []
        };
        
        console.log('Created mock record with certificate status:', mockRecord.certificateEnabled);
        console.log('Mock record vaccinations:', mockRecord.vaccinations);
        setMedicalRecords(prev => [...prev, mockRecord]);
        toast.success('Medical record added successfully (preview mode)');
        
        return mockRecord;
      }
      
      const response = await apiClient.post('/medical-records', recordToCreate);
      const newRecord = response.data;
      
      setMedicalRecords(prev => [...prev, newRecord]);
      toast.success('Medical record added successfully');
      
      return newRecord;
    } catch (error) {
      console.error('Error adding medical record:', error);
      toast.error('Failed to add medical record');
      throw error;
    }
  };

  const updateMedicalRecord = async (id: string, record: Partial<MedicalRecord>): Promise<MedicalRecord> => {
    console.log('Updating medical record:', id);
    console.log('With data:', record);
    console.log('Certificate enabled value:', record.certificateEnabled);
    
    try {
      if (record.height !== undefined || record.weight !== undefined) {
        const currentRecord = getMedicalRecordById(id);
        if (currentRecord) {
          const height = record.height ?? currentRecord.height;
          const weight = record.weight ?? currentRecord.weight;
          record.bmi = calculateBMI(height, weight);
        }
      }
      
      if (record.bloodPressure && record.vitalSigns) {
        record.vitalSigns.bloodPressure = record.bloodPressure;
      }
      
      if (isPreviewMode) {
        console.log('Updating record in preview mode with certificate:', record.certificateEnabled);
        
        const index = medicalRecords.findIndex(r => r.id === id);
        if (index !== -1) {
          const updatedRecord = {
            ...medicalRecords[index],
            ...record,
            certificateEnabled: record.certificateEnabled !== undefined ? record.certificateEnabled : medicalRecords[index].certificateEnabled,
            updatedAt: new Date().toISOString()
          };
          
          console.log('Preview mode updated record with certificate:', updatedRecord.certificateEnabled);
          
          const newRecords = [...medicalRecords];
          newRecords[index] = updatedRecord;
          
          setMedicalRecords(newRecords);
          toast.success('Medical record updated successfully (preview mode)');
          return updatedRecord;
        }
        throw new Error('Record not found');
      }
      
      const response = await apiClient.put(`/medical-records/${id}`, record);
      const updatedRecord = response.data;
      
      setMedicalRecords(prev => 
        prev.map(r => r.id === id ? updatedRecord : r)
      );
      
      toast.success('Medical record updated successfully');
      return updatedRecord;
    } catch (error) {
      console.error('Error updating medical record:', error);
      toast.error('Failed to update medical record');
      throw error;
    }
  };

  const deleteMedicalRecord = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/medical-records/${id}`);
      
      setMedicalRecords(prev => 
        prev.filter(r => r.id !== id)
      );
      
      toast.success('Medical record deleted successfully');
    } catch (error) {
      console.error('Error deleting medical record:', error);
      toast.error('Failed to delete medical record');
      throw error;
    }
  };

  const getAppointmentsByPatientId = (patientId: string): Appointment[] => {
    return appointments.filter(appointment => appointment.patientId === patientId);
  };

  const getAppointmentsByDoctorId = (doctorId: string): Appointment[] => {
    return appointments.filter(appointment => appointment.doctorId === doctorId);
  };

  const getAppointmentById = (id: string): Appointment | undefined => {
    return appointments.find(appointment => appointment.id === id);
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> => {
    try {
      if (isPreviewMode) {
        const mockAppointment: Appointment = {
          ...appointment,
          id: `appointment-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setAppointments(prev => [...prev, mockAppointment]);
        
        const patient = SAMPLE_USERS.find(user => user.id === appointment.patientId);
        const doctor = SAMPLE_USERS.find(user => user.id === appointment.doctorId);
        
        if (patient && doctor) {
          toast.info(
            `Notification sent to Dr. ${doctor.name}`,
            {
              description: `New appointment request from ${patient.name} on ${appointment.date} at ${appointment.startTime}.`,
              duration: 5000,
            }
          );
        }
        
        toast.success('Appointment scheduled successfully (preview mode)');
        return mockAppointment;
      }
      
      let appointmentToSend = { ...appointment };
      
      const storedUser = localStorage.getItem('currentUser');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      
      if (currentUser && currentUser.id && 
          (appointmentToSend.patientId.startsWith('user-') || 
           appointmentToSend.patientId.includes('-temp-'))) {
        console.log(`Replacing temporary patient ID with actual user ID: ${currentUser.id}`);
        appointmentToSend.patientId = currentUser.id;
      }
      
      const response = await apiClient.post('/appointments', appointmentToSend);
      const newAppointment = response.data;
      
      setAppointments(prev => [...prev, newAppointment]);
      
      const patient = SAMPLE_USERS.find(user => user.id === appointment.patientId);
      const doctor = SAMPLE_USERS.find(user => user.id === appointment.doctorId);
      
      if (patient && doctor) {
        toast.info(
          `Notification sent to Dr. ${doctor.name}`,
          {
            description: `New appointment request from ${patient.name} on ${appointment.date} at ${appointment.startTime}.`,
            duration: 5000,
          }
        );
      }
      
      toast.success('Appointment scheduled successfully');
      return newAppointment;
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast.error('Failed to schedule appointment');
      throw error;
    }
  };

  const updateAppointment = async (id: string, appointment: Partial<Appointment>): Promise<Appointment> => {
    try {
      const response = await apiClient.put(`/appointments/${id}`, appointment);
      const updatedAppointment = response.data;
      
      setAppointments(prev => 
        prev.map(a => a.id === id ? updatedAppointment : a)
      );
      
      toast.success('Appointment updated successfully');
      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
      throw error;
    }
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/appointments/${id}`);
      
      setAppointments(prev => 
        prev.filter(a => a.id !== id)
      );
      
      toast.success('Appointment cancelled successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to cancel appointment');
      throw error;
    }
  };

  const getMedicineById = (id: string): Medicine | undefined => {
    return medicines.find(medicine => medicine.id === id);
  };

  const addMedicine = async (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medicine> => {
    try {
      if (isPreviewMode) {
        const mockMedicine: Medicine = {
          ...medicine,
          id: `medicine-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setMedicines(prev => [...prev, mockMedicine]);
        toast.success('Medicine added to inventory (preview mode)');
        
        return mockMedicine;
      }
      
      const response = await apiClient.post('/medicines', medicine);
      const newMedicine = response.data;
      
      setMedicines(prev => [...prev, newMedicine]);
      toast.success('Medicine added to inventory');
      
      return newMedicine;
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error('Failed to add medicine');
      throw error;
    }
  };

  const updateMedicine = async (id: string, medicine: Partial<Medicine>): Promise<Medicine> => {
    try {
      const response = await apiClient.put(`/medicines/${id}`, medicine);
      const updatedMedicine = response.data;
      
      setMedicines(prev => 
        prev.map(m => m.id === id ? updatedMedicine : m)
      );
      
      toast.success('Medicine inventory updated');
      return updatedMedicine;
    } catch (error) {
      console.error('Error updating medicine:', error);
      toast.error('Failed to update medicine');
      throw error;
    }
  };

  const deleteMedicine = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/medicines/${id}`);
      
      setMedicines(prev => 
        prev.filter(m => m.id !== id)
      );
      
      toast.success('Medicine removed from inventory');
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error('Failed to remove medicine');
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      medicalRecords,
      appointments,
      medicines,
      
      isLoadingRecords,
      isLoadingAppointments,
      isLoadingMedicines,
      
      getUserById,
      getUsersByRole,
      
      getMedicalRecordsByPatientId,
      getMedicalRecordById,
      addMedicalRecord,
      updateMedicalRecord,
      deleteMedicalRecord,
      
      getAppointmentsByPatientId,
      getAppointmentsByDoctorId,
      getAppointmentById,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      
      getMedicineById,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      
      refreshMedicalRecords,
      refreshAppointments,
      refreshMedicines,
      
      getApiUrl
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export { getApiUrl };
