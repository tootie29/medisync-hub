import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PatientRecordsTable from '@/components/dashboard/PatientRecordsTable';
import {
  Calendar,
  Clock,
  User,
  Pill,
  Activity,
  AlertCircle,
  FileText,
  FilePlus,
  Search,
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User as UserType } from '@/types';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    appointments, 
    medicalRecords, 
    medicines,
    getAppointmentsByPatientId, 
    getAppointmentsByDoctorId, 
    getMedicalRecordsByPatientId,
    getUserById
  } = useData();
  
  const navigate = useNavigate();
  const [isPatientSelectOpen, setIsPatientSelectOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [allAvailablePatients, setAllAvailablePatients] = useState<UserType[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Check user roles more explicitly - make sure staff can see proper data
  const isStudent = user?.role === 'student';
  const isStaff = user?.role === 'staff';
  const isDoctor = user?.role === 'head nurse';
  const isAdmin = user?.role === 'admin';
  
  // Consider staff and students as patients for medical records purposes
  const isPatient = isStudent || isStaff;
  
  // Medical staff includes doctors and admins
  const isMedicalStaff = isDoctor || isAdmin;

  console.log("User role:", user?.role);
  console.log("isPatient:", isPatient);
  console.log("isMedicalStaff:", isMedicalStaff);
  console.log("isStaff:", isStaff);

  // Get appointments based on user role
  const userAppointments = isPatient
    ? getAppointmentsByPatientId(user?.id || '')
    : isDoctor
    ? getAppointmentsByDoctorId(user?.id || '')
    : appointments;

  // Filter upcoming appointments
  const upcomingAppointments = userAppointments
    .filter(appointment => 
      appointment.status === 'confirmed' || 
      appointment.status === 'pending'
    )
    .filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      return appointmentDate >= today;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.startTime);
      const dateB = new Date(b.date + 'T' + b.startTime);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  // Get unique patients from appointments for medical staff to choose from
  const allPatients = appointments.reduce((uniquePatients, appointment) => {
    const patientId = appointment.patientId;
    const patientDetails = getUserById(patientId);
    
    if (patientDetails && !uniquePatients.some(p => p.id === patientId)) {
      uniquePatients.push(patientDetails);
    }
    return uniquePatients;
  }, [] as UserType[]);  // Fix: Use UserType[] instead of a custom type);

  // Get medical records for patients only (students and staff)
  const userMedicalRecords = isPatient
    ? getMedicalRecordsByPatientId(user?.id || '')
    : [];

  const latestRecord = userMedicalRecords.length > 0
    ? userMedicalRecords.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
    : null;

  // Safe toFixed function to handle non-number BMI values
  const safeToFixed = (value: any, digits: number = 1): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(digits);
    }
    return '0.0'; // Default value when value is not a valid number
  };

  // Get medicines with low stock for medical staff
  const lowStockMedicines = medicines.filter(med => med.quantity < 10);

  // Effect to fetch all patients (students and staff) when dialog opens
  useEffect(() => {
    if (isPatientSelectOpen) {
      fetchAllPatients();
    }
  }, [isPatientSelectOpen]);

  // Function to fetch all patients from the API
  const fetchAllPatients = async () => {
    setIsLoadingPatients(true);
    console.log("Fetching all patients...");
    
    const isPreviewMode = window.location.hostname.includes('lovableproject.com');
    
    if (isPreviewMode) {
      // Use sample data in preview mode
      import('@/types').then(({ SAMPLE_USERS }) => {
        const patients = SAMPLE_USERS.filter(user => 
          (user.role === 'student' || user.role === 'staff') &&
          user.email !== 'student@example.com' && 
          user.email !== 'staff@example.com'
        );
        console.log(`Found ${patients.length} patients in sample data`);
        setAllAvailablePatients(patients);
        setIsLoadingPatients(false);
      });
      return;
    }
    
    try {
      // Get API URL using the same logic as in DataContext
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
      console.log('Fetching patients from API:', API_URL);
      
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000
      });
      
      // Filter to only include students and staff (patients)
      const patients = response.data.filter((user: UserType) => 
        user.role === 'student' || user.role === 'staff'
      );
      
      console.log(`Found ${patients.length} patients from API`);
      setAllAvailablePatients(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Unable to fetch patients. Please try again later.');
      
      // Fallback to patients from appointments if API fails
      console.log('Falling back to appointment-based patient list');
      setAllAvailablePatients(allPatients);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleAddMedicalRecord = () => {
    console.log("Add medical record button clicked");
    fetchAllPatients(); // Fetch patients when button is clicked
    setPatientSearchTerm(''); // Reset search term
    setSelectedPatientId(''); // Reset selection
    setIsPatientSelectOpen(true);
  };

  const handlePatientSelection = () => {
    console.log("Selected patient ID:", selectedPatientId);
    
    if (!selectedPatientId) {
      toast.error("Please select a patient");
      return;
    }
    
    setIsPatientSelectOpen(false);
    
    // Use navigate instead of window.location for smoother transitions
    navigate(`/medical-records?patient=${selectedPatientId}`);
  };

  // Filter patients based on search term
  const filteredPatients = patientSearchTerm
    ? allAvailablePatients.filter(patient =>
        patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()))
    : allAvailablePatients;

  return (
    <MainLayout>
      <div className="medical-container">
        <h1 className="page-title">Dashboard</h1>
        
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-medical-secondary">
            Welcome back, {user?.name}
          </h2>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Quick Actions Panel for Medical Staff */}
        {isMedicalStaff && (
          <div className="mt-6 mb-4">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleAddMedicalRecord} className="flex items-center gap-2">
                <FilePlus className="h-5 w-5" />
                Add New Medical Record
              </Button>
              
              <Link to="/appointments">
                <Button variant="outline" className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Manage Appointments
                </Button>
              </Link>
              
              {isAdmin && (
                <Link to="/inventory">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Manage Inventory
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Patient Selection Dialog */}
        <Dialog open={isPatientSelectOpen} onOpenChange={setIsPatientSelectOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Patient</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search patients..."
                  className="pl-9 w-full"
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                />
              </div>
              
              <Label htmlFor="patient-select">Choose a patient to add medical record</Label>
              
              {isLoadingPatients ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-medical-primary"></div>
                </div>
              ) : filteredPatients.length > 0 ? (
                <div className="mt-2 max-h-60 overflow-auto border rounded-md">
                  {filteredPatients.map((patient) => (
                    <div 
                      key={patient.id}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedPatientId === patient.id 
                          ? 'bg-medical-light text-medical-primary' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{patient.role}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No patients found matching your search.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPatientSelectOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePatientSelection}
                disabled={!selectedPatientId || isLoadingPatients}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Appointments card - visible to all users */}
          <Card className="stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isPatient ? 'Your Appointments' : 'Total Appointments'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">
                  {isPatient 
                    ? userAppointments.length 
                    : appointments.length}
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {upcomingAppointments.length} upcoming
              </p>
            </CardContent>
          </Card>

          {/* Patients card - only visible to medical staff */}
          {isMedicalStaff && (
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">
                    {medicalRecords.reduce((acc, record) => {
                      if (!acc.includes(record.patientId)) {
                        acc.push(record.patientId);
                      }
                      return acc;
                    }, [] as string[]).length}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Across all departments
                </p>
              </CardContent>
            </Card>
          )}

          {/* Medical Records card - visible to patients (students and staff) and medical staff */}
          <Card className="stats-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isPatient ? 'Your Medical Records' : 'Medical Records'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">
                  {isPatient 
                    ? userMedicalRecords.length 
                    : medicalRecords.length}
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isPatient && latestRecord 
                  ? `Last updated on ${formatDate(latestRecord.date)}` 
                  : 'From all patients'}
              </p>
            </CardContent>
          </Card>

          {/* Medicine Inventory card - only visible to medical staff */}
          {isMedicalStaff && (
            <Card className="stats-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Medicine Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{medicines.length}</div>
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Pill className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {lowStockMedicines.length} items low in stock
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Upcoming Appointments section - visible to all users */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Upcoming Appointments</CardTitle>
                {isMedicalStaff && (
                  <Link to="/medical-records">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      All Records
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => {
                    // Find patient and doctor names for each appointment
                    const patientUser = getUserById(appointment.patientId);
                    const doctorUser = appointment.doctorId ? getUserById(appointment.doctorId) : null;
                    
                    return (
                      <div
                        key={appointment.id}
                        className="flex items-start p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-medical-light flex items-center justify-center mr-3">
                          <Clock className="h-5 w-5 text-medical-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{appointment.reason}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              appointment.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(appointment.date)} at {appointment.startTime}
                          </p>
                          {/* Show patient name for medical staff */}
                          {isMedicalStaff && patientUser && (
                            <div className="flex justify-between mt-2">
                              <p className="text-sm text-gray-600">
                                Patient: {patientUser.name}
                              </p>
                              {/* Add quick action button to add medical record */}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 px-2 text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedPatientId(appointment.patientId);
                                  navigate(`/medical-records?patient=${appointment.patientId}`);
                                }}
                              >
                                <FilePlus className="h-3 w-3 mr-1" /> Add Record
                              </Button>
                            </div>
                          )}
                          {/* Show doctor name for patients */}
                          {isPatient && doctorUser && (
                            <p className="text-sm text-gray-600">
                              Doctor: {doctorUser.name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No upcoming appointments</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any scheduled appointments.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/appointments"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-medical-primary hover:bg-medical-secondary"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Health Status card - only visible to patients (students and staff) */}
            {isPatient && latestRecord && (
              <Card>
                <CardHeader>
                  <CardTitle>Health Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">BMI</span>
                      <span className="font-medium">
                        {typeof latestRecord.bmi === 'number' 
                          ? safeToFixed(latestRecord.bmi) 
                          : safeToFixed(parseFloat(latestRecord.bmi) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Height</span>
                      <span className="font-medium">{latestRecord.height} cm</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Weight</span>
                      <span className="font-medium">{latestRecord.weight} kg</span>
                    </div>
                    {latestRecord.bloodPressure && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Blood Pressure</span>
                        <span className="font-medium">{latestRecord.bloodPressure}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Low Stock Alert card - only visible to medical staff */}
            {isMedicalStaff && lowStockMedicines.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Alert</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockMedicines.slice(0, 3).map((medicine) => (
                      <div key={medicine.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm font-medium">{medicine.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-red-500">
                          {medicine.quantity} left
                        </span>
                      </div>
                    ))}
                    {lowStockMedicines.length > 3 && (
                      <Link
                        to="/inventory"
                        className="flex items-center justify-center mt-2 text-sm text-medical-secondary hover:text-medical-primary"
                      >
                        View all ({lowStockMedicines.length}) low stock items
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Patient Records Table - only visible to medical staff */}
        {isMedicalStaff && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Patient Records</h2>
              <Button onClick={handleAddMedicalRecord} className="flex items-center gap-2">
                <FilePlus className="h-5 w-5" />
                Add New Medical Record
              </Button>
            </div>
            <PatientRecordsTable />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
