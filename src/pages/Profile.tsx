
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { isFuture, parseISO } from 'date-fns';
import ProfileForm from '@/components/profile/ProfileForm';
import MedicalHistoryCard from '@/components/profile/MedicalHistoryCard';
import HealthStatusCard from '@/components/profile/HealthStatusCard';
import AppointmentsCard from '@/components/profile/AppointmentsCard';
import { getBMICategory, getBMICategoryColor } from '@/components/profile/ProfileUtils';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { getAppointmentsByPatientId, getMedicalRecordsByPatientId } = useData();

  const userAppointments = user ? getAppointmentsByPatientId(user.id) : [];
  
  const userMedicalRecords = user ? getMedicalRecordsByPatientId(user.id) : [];
  
  const latestMedicalRecord = userMedicalRecords.length > 0
    ? userMedicalRecords.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
    : null;

  const upcomingAppointments = userAppointments
    .filter(app => 
      app.status !== 'cancelled' && 
      isFuture(parseISO(app.date))
    )
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <MainLayout>
      <div className="medical-container">
        <h1 className="page-title">Your Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2">
            <ProfileForm />
            
            <MedicalHistoryCard 
              userMedicalRecords={userMedicalRecords}
              getBMICategoryColor={getBMICategoryColor}
            />
          </div>

          <div className="md:col-span-1 space-y-6">
            <HealthStatusCard 
              latestMedicalRecord={latestMedicalRecord}
              getBMICategory={getBMICategory}
              getBMICategoryColor={getBMICategoryColor}
            />
            
            <AppointmentsCard 
              upcomingAppointments={upcomingAppointments}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
