
import React, { useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import BMICertificate from "@/components/bmi/BMICertificate";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";

const CertificatePage: React.FC = () => {
  const { user } = useAuth();
  const { getMedicalRecordsByPatientId } = useData();

  // Get patient's medical records that have certificate enabled (assuming sorted desc by date)
  const records = user ? getMedicalRecordsByPatientId(user.id).filter(r => r.certificateEnabled) : [];
  const latestRecord = records.length > 0 ? records[0] : null;

  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!certificateRef.current) return;
    const element = certificateRef.current;

    // Use html2pdf.js to generate the PDF
    html2pdf()
      .set({
        margin: 0.4,
        filename: `health-certificate-${user?.name?.replace(/\s+/g, "_") || "patient"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

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

  // School logos URLs - explicitly use schoollogo.jpeg and collegelogo.jpeg
  const schoolLogo = "/schoollogo.jpeg";
  const collegeLogo = "/collegelogo.jpeg";

  return (
    <MainLayout>
      <div className="medical-container flex flex-col items-center space-y-4">
        <h1 className="page-title">Certificate</h1>
        <div ref={certificateRef}>
          <BMICertificate
            id={id}
            userName={displayUserName}
            bmi={typeof bmi === 'number' ? bmi : parseFloat(bmi) || 0}
            height={height}
            weight={weight}
            date={date}
            schoolLogo={schoolLogo}
            collegeLogo={collegeLogo}
          />
        </div>
        <Button variant="default" onClick={handleDownload} className="mt-4 flex items-center gap-2">
          <div className="flex items-center">
            <img 
              src={schoolLogo} 
              alt="School Logo" 
              className="h-5 w-5 object-contain" 
            />
            <img 
              src={collegeLogo} 
              alt="College Logo" 
              className="h-5 w-5 object-contain ml-1" 
            />
          </div>
          Download Certificate
        </Button>
      </div>
    </MainLayout>
  );
};

export default CertificatePage;
