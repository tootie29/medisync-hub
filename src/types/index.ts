export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'student' | 'staff' | 'head nurse';
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  address?: string;
  phone?: string;
  profilePicture?: string;
  medicalHistory?: string;
  allergies?: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface VitalSigns {
  heartRate?: number;
  bloodPressure?: string;
  bloodGlucose?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export const SAMPLE_USERS: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'student',
    gender: 'male',
    birthDate: '2002-04-03',
    address: '123 Highland, Silang, Cavite',
    phone: '09123456789',
    profilePicture: '/placeholder-profile.jpg',
    medicalHistory: 'None',
    allergies: ['None'],
    insuranceProvider: 'None',
    insurancePolicyNumber: 'None',
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'doctor',
    gender: 'female',
    birthDate: '1985-08-15',
    address: '456 Lowland, Dasmarinas, Cavite',
    phone: '09987654321',
    profilePicture: '/placeholder-profile.jpg',
    medicalHistory: 'None',
    allergies: ['None'],
    insuranceProvider: 'None',
    insurancePolicyNumber: 'None',
  },
  {
    id: 'user-3',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    role: 'staff',
    gender: 'female',
    birthDate: '1990-02-20',
    address: '789 Midlands, General Trias, Cavite',
    phone: '09234567890',
    profilePicture: '/placeholder-profile.jpg',
    medicalHistory: 'None',
    allergies: ['Pollen'],
    insuranceProvider: 'MediShield',
    insurancePolicyNumber: 'MS12345',
  },
  {
    id: 'user-4',
    name: 'Bob Williams',
    email: 'bob.williams@example.com',
    role: 'admin',
    gender: 'male',
    birthDate: '1978-11-10',
    address: '101 Seashore, Tanza, Cavite',
    phone: '09345678901',
    profilePicture: '/placeholder-profile.jpg',
    medicalHistory: 'Hypertension',
    allergies: ['Dust'],
    insuranceProvider: 'HealthFirst',
    insurancePolicyNumber: 'HF67890',
  },
  {
    id: 'user-5',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    role: 'student',
    gender: 'male',
    birthDate: '2001-06-25',
    address: '222 Lakeside, Naic, Cavite',
    phone: '09456789012',
    profilePicture: '/placeholder-profile.jpg',
    medicalHistory: 'Asthma',
    allergies: ['Peanuts'],
    insuranceProvider: 'CarePlus',
    insurancePolicyNumber: 'CP23456',
  },
  {
    id: 'user-6',
    name: 'Diana Miller',
    email: 'diana.miller@example.com',
    role: 'head nurse',
    gender: 'female',
    birthDate: '1982-09-01',
    address: '333 Riverside, Maragondon, Cavite',
    phone: '09567890123',
    profilePicture: '/placeholder-profile.jpg',
    medicalHistory: 'None',
    allergies: ['None'],
    insuranceProvider: 'None',
    insurancePolicyNumber: 'None',
  },
  {
    id: 'user-7',
    name: 'Ethan Davis',
    email: 'ethan.davis@example.com',
    role: 'staff',
    gender: 'male',
    birthDate: '1995-03-18',
    address: '444 Hilltop, Ternate, Cavite',
    phone: '09678901234',
    profilePicture: '/placeholder-profile.jpg',
    medicalHistory: 'Diabetes',
    allergies: ['Shellfish'],
    insuranceProvider: 'SecureHealth',
    insurancePolicyNumber: 'SH34567',
  },
  {
    id: 'user-8',
    name: 'Fiona White',
    email: 'fiona.white@example.com',
    role: 'student',
    gender: 'female',
    birthDate: '2003-07-07',
    address: '555 Valleyview, Alfonso, Cavite',
    phone: '09789012345',
    profilePicture: '/placeholder-profile.jpg',
    medicalHistory: 'None',
    allergies: ['Latex'],
    insuranceProvider: 'FamilyCare',
    insurancePolicyNumber: 'FC45678',
  },
  {
    id: 'user-9',
    name: 'George Green',
    email: 'george.green@example.com',
    role: 'doctor',
    gender: 'male',
    birthDate: '1975-12-24',
    address: '666 Forestside, Magallanes, Cavite',
    phone: '09890123456',
    profilePicture: '/placeholder-profile.jpg',
    medicalHistory: 'None',
    allergies: ['None'],
    insuranceProvider: 'None',
    insurancePolicyNumber: 'None',
  },
  {
    id: 'user-10',
    name: 'Hannah Black',
    email: 'hannah.black@example.com',
    role: 'head nurse',
    gender: 'female',
    birthDate: '1988-04-12',
    address: '777 Oceanfront, Rosario, Cavite',
    phone: '09012345678',
    profilePicture: '/placeholder-profile.jpg',
    medicalHistory: 'None',
    allergies: ['None'],
    insuranceProvider: 'None',
    insurancePolicyNumber: 'None',
  },
];

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  supplier?: string;
  costPerUnit?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vaccination {
  id: string;
  name: string;
  dateAdministered: string;
  doseNumber?: number;
  manufacturer?: string;
  lotNumber?: string;
  administeredBy?: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  height: number;
  weight: number;
  bmi?: number;
  bloodPressure?: string;
  temperature?: number;
  diagnosis?: string;
  notes?: string;
  medications?: string[];
  followUpDate?: string;
  certificateEnabled?: boolean;
  vitalSigns?: VitalSigns;
  createdAt: string;
  updatedAt: string;
  appointmentId?: string;
  type?: string;
  gender?: string;
  vaccinations?: Vaccination[];
}
