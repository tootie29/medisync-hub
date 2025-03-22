
import React from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';

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

  // Check user roles more explicitly - make sure staff can see proper data
  const isStudent = user?.role === 'student';
  const isStaff = user?.role === 'staff';
  const isDoctor = user?.role === 'doctor';
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

  // Get medical records for patients only (students and staff)
  const userMedicalRecords = isPatient
    ? getMedicalRecordsByPatientId(user?.id || '')
    : [];

  const latestRecord = userMedicalRecords.length > 0
    ? userMedicalRecords.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
    : null;

  // Get medicines with low stock for medical staff
  const lowStockMedicines = medicines.filter(med => med.quantity < 10);

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
              <CardTitle>Upcoming Appointments</CardTitle>
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
                            <p className="text-sm text-gray-600">
                              Patient: {patientUser.name}
                            </p>
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
                      <span className="font-medium">{latestRecord.bmi.toFixed(1)}</span>
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
            <PatientRecordsTable />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
