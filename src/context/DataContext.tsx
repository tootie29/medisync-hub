
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MedicalRecord, 
  Appointment, 
  Medicine, 
  User,
  SAMPLE_USERS 
} from '@/types';
import { toast } from "sonner";
import axios from 'axios';

const getApiUrl = () => {
  const isLovablePreview = window.location.hostname.includes('lovableproject.com');
  if (isLovablePreview) {
    console.log('Running in Lovable preview - using sample data instead of API');
    return null;
  }
  
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
console.log('Using API URL in DataContext:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL || 'http://localhost:8080/api',
  timeout: 15000,
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
    
    if (window.location.hostname.includes('lovableproject.com')) {
      console.log('API error in preview mode, will fall back to sample data');
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;
    
    if (originalRequest._retryCount >= 3) {
      console.error('Request failed after multiple retries:', error.message);
      return Promise.reject(error);
    }
    
    if (originalRequest._retryCount === undefined) {
      originalRequest._retryCount = 0;
    }
    
    originalRequest._retryCount++;
    
    console.log(`Retrying request (${originalRequest._retryCount}/3)...`);
    
    const delay = originalRequest._retryCount * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return apiClient(originalRequest);
  }
);

interface DataContextType {
  medicalRecords: MedicalRecord[];
  appointments: Appointment[];
  medicines: Medicine[];
  
  isLoadingRecords: boolean;
  isLoadingAppointments: boolean;
  isLoadingMedicines: boolean;
  
  getUserById: (id: string) => User | undefined;
  
  getMedicalRecordsByPatientId: (patientId: string) => MedicalRecord[];
  getMedicalRecordById: (id: string) => MedicalRecord | undefined;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'bmi'>) => Promise<MedicalRecord>;
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(true);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(true);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState<boolean>(true);
  
  const isPreviewMode = window.location.hostname.includes('lovableproject.com');

  useEffect(() => {
    if (isPreviewMode) {
      console.log('Running in preview mode - using sample data');
      setIsLoadingRecords(false);
      setIsLoadingAppointments(false);
      setIsLoadingMedicines(false);
      return;
    }

    refreshMedicalRecords();
    refreshAppointments();
    refreshMedicines();
  }, []);

  const refreshMedicalRecords = async () => {
    if (isPreviewMode) return;
    
    setIsLoadingRecords(true);
    try {
      const response = await apiClient.get('/medical-records');
      setMedicalRecords(response.data);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setMedicalRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const refreshAppointments = async () => {
    if (isPreviewMode) return;
    
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
    if (isPreviewMode) return;
    
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
    return SAMPLE_USERS.find(user => user.id === id);
  };

  const getMedicalRecordsByPatientId = (patientId: string): MedicalRecord[] => {
    return medicalRecords.filter(record => record.patientId === patientId);
  };

  const getMedicalRecordById = (id: string): MedicalRecord | undefined => {
    return medicalRecords.find(record => record.id === id);
  };

  const calculateBMI = (height: number, weight: number): number => {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(2));
  };

  const addMedicalRecord = async (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'bmi'>): Promise<MedicalRecord> => {
    try {
      const bmi = calculateBMI(record.height, record.weight);
      
      let updatedVitalSigns = record.vitalSigns || {};
      if (record.bloodPressure && !updatedVitalSigns.bloodPressure) {
        updatedVitalSigns = {
          ...updatedVitalSigns,
          bloodPressure: record.bloodPressure
        };
      }
      
      // Set certificateEnabled automatically based on BMI if not set
      const isHealthyBMI = bmi >= 18.5 && bmi < 25;
      const certificateEnabled = record.certificateEnabled !== undefined ? 
        record.certificateEnabled : isHealthyBMI;
      
      const recordToCreate = {
        ...record,
        bmi,
        certificateEnabled,
        vitalSigns: Object.keys(updatedVitalSigns).length > 0 ? updatedVitalSigns : undefined
      };
      
      if (isPreviewMode) {
        const mockRecord: MedicalRecord = {
          ...recordToCreate,
          id: `record-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bmi,
          certificateEnabled
        };
        
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
    try {
      // Calculate BMI if height or weight changes
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
      
      // Handle certificate updates in preview mode
      if (isPreviewMode) {
        const index = medicalRecords.findIndex(r => r.id === id);
        if (index !== -1) {
          const updatedRecord = {
            ...medicalRecords[index],
            ...record,
            updatedAt: new Date().toISOString()
          };
          
          const newRecords = [...medicalRecords];
          newRecords[index] = updatedRecord;
          
          setMedicalRecords(newRecords);
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
      refreshMedicines
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
