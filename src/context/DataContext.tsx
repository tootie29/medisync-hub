
import React, { createContext, useContext, useState } from 'react';
import { 
  MedicalRecord, 
  Appointment, 
  Medicine, 
  User,
  SAMPLE_MEDICAL_RECORDS, 
  SAMPLE_APPOINTMENTS, 
  SAMPLE_MEDICINES, 
  SAMPLE_USERS
} from '@/types';
import { toast } from "sonner";

interface DataContextType {
  medicalRecords: MedicalRecord[];
  appointments: Appointment[];
  medicines: Medicine[];
  
  // User functions
  getUserById: (id: string) => User | undefined;
  
  // Medical Records functions
  getMedicalRecordsByPatientId: (patientId: string) => MedicalRecord[];
  getMedicalRecordById: (id: string) => MedicalRecord | undefined;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'bmi'>) => MedicalRecord;
  updateMedicalRecord: (id: string, record: Partial<MedicalRecord>) => MedicalRecord;
  deleteMedicalRecord: (id: string) => void;
  
  // Appointments functions
  getAppointmentsByPatientId: (patientId: string) => Appointment[];
  getAppointmentsByDoctorId: (doctorId: string) => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Appointment;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Appointment;
  deleteAppointment: (id: string) => void;
  
  // Medicines functions
  getMedicineById: (id: string) => Medicine | undefined;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => Medicine;
  updateMedicine: (id: string, medicine: Partial<Medicine>) => Medicine;
  deleteMedicine: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(SAMPLE_MEDICAL_RECORDS);
  const [appointments, setAppointments] = useState<Appointment[]>(SAMPLE_APPOINTMENTS);
  const [medicines, setMedicines] = useState<Medicine[]>(SAMPLE_MEDICINES);

  // User functions
  const getUserById = (id: string): User | undefined => {
    return SAMPLE_USERS.find(user => user.id === id);
  };

  // Medical Records functions
  const getMedicalRecordsByPatientId = (patientId: string): MedicalRecord[] => {
    return medicalRecords.filter(record => record.patientId === patientId);
  };

  const getMedicalRecordById = (id: string): MedicalRecord | undefined => {
    return medicalRecords.find(record => record.id === id);
  };

  const calculateBMI = (height: number, weight: number): number => {
    // BMI = weight(kg) / (height(m))^2
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(2));
  };

  const addMedicalRecord = (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'bmi'>): MedicalRecord => {
    const bmi = calculateBMI(record.height, record.weight);
    
    const newRecord: MedicalRecord = {
      ...record,
      id: `${Date.now()}`,
      bmi,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setMedicalRecords(prev => [...prev, newRecord]);
    toast.success('Medical record added successfully');
    return newRecord;
  };

  const updateMedicalRecord = (id: string, record: Partial<MedicalRecord>): MedicalRecord => {
    let updatedRecord: MedicalRecord;
    
    setMedicalRecords(prev => {
      const index = prev.findIndex(r => r.id === id);
      if (index === -1) {
        toast.error('Medical record not found');
        throw new Error('Medical record not found');
      }
      
      const currentRecord = prev[index];
      const height = record.height ?? currentRecord.height;
      const weight = record.weight ?? currentRecord.weight;
      
      // Recalculate BMI if height or weight has changed
      const bmi = (record.height !== undefined || record.weight !== undefined) 
        ? calculateBMI(height, weight) 
        : currentRecord.bmi;
      
      updatedRecord = {
        ...currentRecord,
        ...record,
        bmi,
        updatedAt: new Date().toISOString()
      };
      
      const newRecords = [...prev];
      newRecords[index] = updatedRecord;
      return newRecords;
    });
    
    toast.success('Medical record updated successfully');
    return updatedRecord!;
  };

  const deleteMedicalRecord = (id: string): void => {
    setMedicalRecords(prev => {
      const index = prev.findIndex(r => r.id === id);
      if (index === -1) {
        toast.error('Medical record not found');
        throw new Error('Medical record not found');
      }
      
      const newRecords = [...prev];
      newRecords.splice(index, 1);
      return newRecords;
    });
    
    toast.success('Medical record deleted successfully');
  };

  // Appointments functions
  const getAppointmentsByPatientId = (patientId: string): Appointment[] => {
    return appointments.filter(appointment => appointment.patientId === patientId);
  };

  const getAppointmentsByDoctorId = (doctorId: string): Appointment[] => {
    return appointments.filter(appointment => appointment.doctorId === doctorId);
  };

  const getAppointmentById = (id: string): Appointment | undefined => {
    return appointments.find(appointment => appointment.id === id);
  };

  const addAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Appointment => {
    const newAppointment: Appointment = {
      ...appointment,
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setAppointments(prev => [...prev, newAppointment]);
    
    // Find patient and doctor info for notification
    const patient = SAMPLE_USERS.find(user => user.id === appointment.patientId);
    const doctor = SAMPLE_USERS.find(user => user.id === appointment.doctorId);
    
    // Notify with more detailed information
    if (patient && doctor) {
      // This would normally send an email or push notification to the doctor
      // For now, we'll just show a toast notification
      toast.info(
        `Notification sent to Dr. ${doctor.name}`,
        {
          description: `New appointment request from ${patient.name} on ${appointment.date} at ${appointment.startTime}.`,
          duration: 5000,
        }
      );
      
      console.log(`NOTIFICATION: New appointment request from ${patient.name} for Dr. ${doctor.name} on ${appointment.date} at ${appointment.startTime}`);
    }
    
    toast.success('Appointment scheduled successfully');
    return newAppointment;
  };

  const updateAppointment = (id: string, appointment: Partial<Appointment>): Appointment => {
    let updatedAppointment: Appointment;
    
    setAppointments(prev => {
      const index = prev.findIndex(a => a.id === id);
      if (index === -1) {
        toast.error('Appointment not found');
        throw new Error('Appointment not found');
      }
      
      updatedAppointment = {
        ...prev[index],
        ...appointment,
        updatedAt: new Date().toISOString()
      };
      
      const newAppointments = [...prev];
      newAppointments[index] = updatedAppointment;
      return newAppointments;
    });
    
    toast.success('Appointment updated successfully');
    return updatedAppointment!;
  };

  const deleteAppointment = (id: string): void => {
    setAppointments(prev => {
      const index = prev.findIndex(a => a.id === id);
      if (index === -1) {
        toast.error('Appointment not found');
        throw new Error('Appointment not found');
      }
      
      const newAppointments = [...prev];
      newAppointments.splice(index, 1);
      return newAppointments;
    });
    
    toast.success('Appointment cancelled successfully');
  };

  // Medicines functions
  const getMedicineById = (id: string): Medicine | undefined => {
    return medicines.find(medicine => medicine.id === id);
  };

  const addMedicine = (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Medicine => {
    const newMedicine: Medicine = {
      ...medicine,
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setMedicines(prev => [...prev, newMedicine]);
    toast.success('Medicine added to inventory');
    return newMedicine;
  };

  const updateMedicine = (id: string, medicine: Partial<Medicine>): Medicine => {
    let updatedMedicine: Medicine;
    
    setMedicines(prev => {
      const index = prev.findIndex(m => m.id === id);
      if (index === -1) {
        toast.error('Medicine not found');
        throw new Error('Medicine not found');
      }
      
      updatedMedicine = {
        ...prev[index],
        ...medicine,
        updatedAt: new Date().toISOString()
      };
      
      const newMedicines = [...prev];
      newMedicines[index] = updatedMedicine;
      return newMedicines;
    });
    
    toast.success('Medicine inventory updated');
    return updatedMedicine!;
  };

  const deleteMedicine = (id: string): void => {
    setMedicines(prev => {
      const index = prev.findIndex(m => m.id === id);
      if (index === -1) {
        toast.error('Medicine not found');
        throw new Error('Medicine not found');
      }
      
      const newMedicines = [...prev];
      newMedicines.splice(index, 1);
      return newMedicines;
    });
    
    toast.success('Medicine removed from inventory');
  };

  return (
    <DataContext.Provider value={{
      medicalRecords,
      appointments,
      medicines,
      
      // User functions
      getUserById,
      
      // Medical Records functions
      getMedicalRecordsByPatientId,
      getMedicalRecordById,
      addMedicalRecord,
      updateMedicalRecord,
      deleteMedicalRecord,
      
      // Appointments functions
      getAppointmentsByPatientId,
      getAppointmentsByDoctorId,
      getAppointmentById,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      
      // Medicines functions
      getMedicineById,
      addMedicine,
      updateMedicine,
      deleteMedicine
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
