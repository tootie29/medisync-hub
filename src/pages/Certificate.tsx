
import React, { useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import BMICertificate from "@/components/bmi/BMICertificate";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

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

  // Updated logo paths to use the uploaded images
  const schoolLogo = "/lovable-uploads/03f574c6-5504-45d4-8d0e-3eb89db37d70.png"; // Olivarez College logo
  const collegeLogo = "/lovable-uploads/a7ebfcdb-c26c-46e1-a387-dcbc28379e5c.png"; // College of Nursing logo

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
          <FileText size={18} />
          Download Certificate
        </Button>
      </div>
    </MainLayout>
  );
};

export default CertificatePage;
