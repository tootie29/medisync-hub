export type UserRole = 'student' | 'staff' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergencyContact?: string;
  studentId?: string;
  department?: string;
  staffId?: string;
  position?: string;
  faculty?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VitalSigns {
  heartRate?: number;
  bloodPressure?: string;
  bloodGlucose?: number;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  height: number; // in cm
  weight: number; // in kg
  bmi: number;
  bloodPressure?: string;
  temperature?: number; // in Celsius
  diagnosis?: string;
  medications?: string[];
  notes?: string;
  followUpDate?: string;
  vitalSigns?: VitalSigns;
  certificateEnabled?: boolean; // Add the new property
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordInput {
  patientId: string;
  doctorId: string;
  date: string;
  height: number;
  weight: number;
  bloodPressure?: string;
  temperature?: number;
  diagnosis?: string;
  medications?: string[];
  notes?: string;
  followUpDate?: string;
  vitalSigns?: VitalSigns;
  certificateEnabled?: boolean;
  bmi?: number; // Added bmi property to match what we're sending
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  unit: string;
  description?: string;
  dosage?: string;
  expiryDate?: string;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export const ROLES: UserRole[] = ['student', 'staff', 'doctor', 'admin'];

export const SAMPLE_USERS: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    phone: '123-456-7890',
    dateOfBirth: '1980-01-01',
    gender: 'male',
    address: '123 Admin St',
    emergencyContact: 'Jane Admin: 123-456-7890',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'doctor@example.com',
    name: 'Dr. Smith',
    role: 'doctor',
    phone: '123-456-7891',
    dateOfBirth: '1975-05-15',
    gender: 'female',
    address: '456 Doctor Ave',
    emergencyContact: 'John Smith: 123-456-7892',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
  {
    id: '3',
    email: 'student@example.com',
    name: 'John Student',
    role: 'student',
    phone: '123-456-7893',
    dateOfBirth: '2000-10-20',
    gender: 'male',
    address: '789 Student Blvd',
    emergencyContact: 'Mary Student: 123-456-7894',
    studentId: '12345',
    department: 'Engineering',
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-03T00:00:00Z',
  },
  {
    id: '4',
    email: 'staff@example.com',
    name: 'Sarah Staff',
    role: 'staff',
    phone: '123-456-7895',
    dateOfBirth: '1990-08-12',
    gender: 'female',
    address: '101 Staff Road',
    emergencyContact: 'Mike Staff: 123-456-7896',
    staffId: '67890',
    position: 'Nurse',
    createdAt: '2023-01-04T00:00:00Z',
    updatedAt: '2023-01-04T00:00:00Z',
  },
];

export const SAMPLE_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: '1',
    patientId: '3',
    doctorId: '2',
    date: '2023-03-15',
    height: 175,
    weight: 70,
    bmi: 22.9,
    bloodPressure: '120/80',
    temperature: 36.6,
    diagnosis: 'Common cold',
    medications: ['Paracetamol', 'Vitamin C'],
    notes: 'Patient should rest and drink plenty of fluids.',
    followUpDate: '2023-03-22',
    vitalSigns: {
      heartRate: 72,
      bloodPressure: '120/80',
      bloodGlucose: 95
    },
    certificateEnabled: false,
    createdAt: '2023-03-15T10:30:00Z',
    updatedAt: '2023-03-15T10:30:00Z',
  },
  {
    id: '2',
    patientId: '4',
    doctorId: '2',
    date: '2023-04-10',
    height: 165,
    weight: 65,
    bmi: 23.9,
    bloodPressure: '130/85',
    temperature: 37.2,
    diagnosis: 'Mild fever',
    medications: ['Ibuprofen'],
    notes: 'Monitor temperature for the next 48 hours.',
    followUpDate: '2023-04-17',
    vitalSigns: {
      heartRate: 78,
      bloodPressure: '130/85',
      bloodGlucose: 100
    },
    certificateEnabled: false,
    createdAt: '2023-04-10T14:15:00Z',
    updatedAt: '2023-04-10T14:15:00Z',
  },
];

export const SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    patientId: '3',
    doctorId: '2',
    date: '2023-05-20',
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed',
    reason: 'Follow-up checkup',
    notes: 'Bring previous prescription.',
    createdAt: '2023-05-10T09:00:00Z',
    updatedAt: '2023-05-10T09:00:00Z',
  },
  {
    id: '2',
    patientId: '4',
    doctorId: '2',
    date: '2023-05-21',
    startTime: '11:00',
    endTime: '11:30',
    status: 'pending',
    reason: 'Annual physical examination',
    notes: '',
    createdAt: '2023-05-12T13:45:00Z',
    updatedAt: '2023-05-12T13:45:00Z',
  },
];

export const SAMPLE_MEDICINES: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol',
    category: 'Painkillers',
    quantity: 100,
    threshold: 20,
    unit: 'tablets',
    description: 'Pain reliever and fever reducer',
    dosage: '500mg',
    expiryDate: '2024-06-30',
    supplier: 'PharmaCorp',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2023-01-15T08:00:00Z',
  },
  {
    id: '2',
    name: 'Ibuprofen',
    category: 'Anti-inflammatory',
    quantity: 50,
    threshold: 15,
    unit: 'tablets',
    description: 'Non-steroidal anti-inflammatory drug',
    dosage: '400mg',
    expiryDate: '2024-08-15',
    supplier: 'MediSupply',
    createdAt: '2023-01-20T10:15:00Z',
    updatedAt: '2023-01-20T10:15:00Z',
  },
  {
    id: '3',
    name: 'Amoxicillin',
    category: 'Antibiotics',
    quantity: 30,
    threshold: 10,
    unit: 'capsules',
    description: 'Antibiotic medication',
    dosage: '250mg',
    expiryDate: '2023-12-31',
    supplier: 'PharmaCorp',
    createdAt: '2023-02-01T14:30:00Z',
    updatedAt: '2023-02-01T14:30:00Z',
  },
];
