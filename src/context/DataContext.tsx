
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

// Define API_URL based on domain - updated for production with correct path
const API_URL = window.location.hostname === "climasys.entrsolutions.com" 
  ? 'https://climasys.entrsolutions.com/server/api'  // Updated domain with /server prefix
  : 'http://localhost:3001/api';

console.log('Using API URL:', API_URL);

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

  useEffect(() => {
    refreshMedicalRecords();
    refreshAppointments();
    refreshMedicines();
  }, []);

  const refreshMedicalRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const response = await axios.get(`${API_URL}/medical-records`);
      setMedicalRecords(response.data);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      toast.error('Failed to load medical records');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const refreshAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const response = await axios.get(`${API_URL}/appointments`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const refreshMedicines = async () => {
    setIsLoadingMedicines(true);
    try {
      const response = await axios.get(`${API_URL}/medicines`);
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast.error('Failed to load medicines');
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
      
      const response = await axios.post(`${API_URL}/medical-records`, recordToCreate);
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
      
      const response = await axios.put(`${API_URL}/medical-records/${id}`, record);
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
      await axios.delete(`${API_URL}/medical-records/${id}`);
      
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
      const response = await axios.post(`${API_URL}/appointments`, appointment);
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
      const response = await axios.put(`${API_URL}/appointments/${id}`, appointment);
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
      await axios.delete(`${API_URL}/appointments/${id}`);
      
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
      const response = await axios.post(`${API_URL}/medicines`, medicine);
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
      const response = await axios.put(`${API_URL}/medicines/${id}`, medicine);
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
      await axios.delete(`${API_URL}/medicines/${id}`);
      
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
