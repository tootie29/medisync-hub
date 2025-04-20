
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import BMICertificate from "@/components/bmi/BMICertificate";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const CertificatePage: React.FC = () => {
  const { user } = useAuth();
  const { getMedicalRecordsByPatientId } = useData();

  // Get patient's medical records that have certificate enabled (assuming sorted desc by date)
  const records = user ? getMedicalRecordsByPatientId(user.id).filter(r => r.certificateEnabled) : [];
  const latestRecord = records.length > 0 ? records[0] : null;

  if (!latestRecord)
    return (
      <MainLayout>
        <div className="medical-container">
          <h1 className="page-title">Certificate</h1>
          <p>You have no certificate available.</p>
        </div>
      </MainLayout>
    );

  const {
    id,
    date,
    bmi,
    height,
    weight,
    patientId,
    certificateEnabled,
  } = latestRecord;

  const displayUserName = user?.name || "Patient";

  return (
    <MainLayout>
      <div className="medical-container">
        <h1 className="page-title">Certificate</h1>
        <BMICertificate
          id={id}
          userName={displayUserName}
          bmi={typeof bmi === 'number' ? bmi : parseFloat(bmi) || 0}
          height={height}
          weight={weight}
          date={date}
        />
      </div>
    </MainLayout>
  );
};

export default CertificatePage;
