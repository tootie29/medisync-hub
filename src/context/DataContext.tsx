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

// Define the API URL with improved environment detection
const getApiUrl = () => {
  // First check if we're running in the Lovable preview environment
  const isLovablePreview = window.location.hostname.includes('lovableproject.com');
  if (isLovablePreview) {
    console.log('Running in Lovable preview - using sample data instead of API');
    return null;
  }
  
  // For production environments
  const hostname = window.location.hostname;
  if (hostname === "climasys.entrsolutions.com" || hostname === "app.climasys.entrsolutions.com") {
    return 'https://api.climasys.entrsolutions.com/api';
  }
  
  // Environment variable (if set)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Local development fallback
  return 'http://localhost:8080/api';
};

const API_URL = getApiUrl();
console.log('Using API URL in DataContext:', API_URL);

// Create a custom axios instance with improved retry logic and connection diagnostics
const apiClient = axios.create({
  baseURL: API_URL || 'http://localhost:8080/api', // Fallback for preview mode
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for error handling with detailed diagnostics
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    
    // For Lovable preview, return mock data instead of retrying
    if (window.location.hostname.includes('lovableproject.com')) {
      console.log('API error in preview mode, will fall back to sample data');
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;
    
    // Don't retry if we've already tried 3 times
    if (originalRequest._retryCount >= 3) {
      // Log detailed error information for troubleshooting
      console.error('Request failed after multiple retries:', {
        url: originalRequest.url,
        method: originalRequest.method,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Check for specific database connection errors from the server
      if (error.response?.data?.error === 'Database connection error' || 
          (error.response?.data?.error && error.response?.data?.error.includes('database'))) {
        toast.error('Database connection issue', {
          description: 'The server is having trouble connecting to the database. Please try again later or contact support.',
          duration: 5000
        });
      }
      
      return Promise.reject(error);
    }
    
    // Initialize retry count
    if (originalRequest._retryCount === undefined) {
      originalRequest._retryCount = 0;
    }
    
    // Increment retry count
    originalRequest._retryCount++;
    
    console.log(`Retrying request (${originalRequest._retryCount}/3)...`);
    
    // Wait before retrying (exponential backoff)
    const delay = originalRequest._retryCount * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return apiClient(originalRequest);
  }
);

// Add request interceptor to check server health
let serverHealthChecked = false;
apiClient.interceptors.request.use(
  async config => {
    // Check server health only once per session
    if (!serverHealthChecked && !window.location.hostname.includes('lovableproject.com')) {
      try {
        await apiClient.get('/health');
        serverHealthChecked = true;
      } catch (error) {
        console.warn('Server health check failed:', error.message);
        // Don't block the original request, just log the issue
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

interface DataContextType {
  medicalRecords: MedicalRecord[];
  appointments: Appointment[];
  medicines: Medicine[];
  
  // Loading states
  isLoadingRecords: boolean;
  isLoadingAppointments: boolean;
  isLoadingMedicines: boolean;
  
  // User functions
  getUserById: (id: string) => User | undefined;
  
  // Medical Records functions
  getMedicalRecordsByPatientId: (patientId: string) => MedicalRecord[];
  getMedicalRecordById: (id: string) => MedicalRecord | undefined;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'bmi'>) => Promise<MedicalRecord>;
  updateMedicalRecord: (id: string, record: Partial<MedicalRecord>) => Promise<MedicalRecord>;
  deleteMedicalRecord: (id: string) => Promise<void>;
  
  // Appointments functions
  getAppointmentsByPatientId: (patientId: string) => Appointment[];
  getAppointmentsByDoctorId: (doctorId: string) => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Appointment>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  
  // Medicines functions
  getMedicineById: (id: string) => Medicine | undefined;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Medicine>;
  updateMedicine: (id: string, medicine: Partial<Medicine>) => Promise<Medicine>;
  deleteMedicine: (id: string) => Promise<void>;
  
  // Refresh data functions
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
  
  const [serverConnectionIssue, setServerConnectionIssue] = useState(false);
  
  const isPreviewMode = window.location.hostname.includes('lovableproject.com');

  useEffect(() => {
    if (isPreviewMode) {
      console.log('Running in preview mode - using sample data');
      setIsLoadingRecords(false);
      setIsLoadingAppointments(false);
      setIsLoadingMedicines(false);
      // In preview mode, we won't load any data from API
      return;
    }

    // Check API server connectivity first
    apiClient.get('/health')
      .then(response => {
        console.log('API server health check:', response.data);
        // If database is not connected, show a warning toast
        if (response.data.database && !response.data.database.connected) {
          toast.warning('Database Connection Issue', {
            description: 'The server is having trouble connecting to the database. Some features may not work properly.',
            duration: 10000
          });
          setServerConnectionIssue(true);
        } else {
          // Load data only if server is healthy
          refreshMedicalRecords();
          refreshAppointments();
          refreshMedicines();
        }
      })
      .catch(error => {
        console.error('Failed to check API server health:', error);
        toast.error('Server Connection Issue', {
          description: 'Unable to connect to the API server. Please check your internet connection or try again later.',
          duration: 10000
        });
        setServerConnectionIssue(true);
        setIsLoadingRecords(false);
        setIsLoadingAppointments(false);
        setIsLoadingMedicines(false);
      });
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
      
      const recordToCreate = {
        ...record,
        bmi,
        vitalSigns: Object.keys(updatedVitalSigns).length > 0 ? updatedVitalSigns : undefined
      };
      
      if (isPreviewMode) {
        // In preview mode, create a mock record with a fake ID
        const mockRecord: MedicalRecord = {
          ...recordToCreate,
          id: `record-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bmi
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
        // In preview mode, create a mock appointment with a fake ID
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
      
      const response = await apiClient.post('/appointments', appointment);
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
        // In preview mode, create a mock medicine with a fake ID
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
      {serverConnectionIssue && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-md max-w-md z-50">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Database Connection Warning</p>
              <p className="text-sm">We're having trouble connecting to our database. Some features may not work properly. Please try again later.</p>
            </div>
          </div>
        </div>
      )}
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
