
import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { SAMPLE_USERS } from '@/types';
import { Medal, Download } from 'lucide-react';
import { toast } from 'sonner';

interface MedicalHistoryCardProps {
  userMedicalRecords: any[];
  getBMICategoryColor: (bmi: number) => string;
}

const MedicalHistoryCard: React.FC<MedicalHistoryCardProps> = ({ 
  userMedicalRecords, 
  getBMICategoryColor 
}) => {
  // Calculate BMI if it's 0 or invalid
  const calculateBmi = (height: number, weight: number): number => {
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      return weight / (heightInMeters * heightInMeters);
    }
    return 0;
  };

  // Safe toFixed function to handle non-number BMI values
  const safeToFixed = (value: any, digits: number = 1, height?: number, weight?: number): string => {
    if (typeof value === 'number' && !isNaN(value) && value > 0) {
      return value.toFixed(digits);
    } else if (typeof value === 'string' && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      return parseFloat(value).toFixed(digits);
    }
    
    // If invalid, calculate from height and weight
    if (height && weight && height > 0 && weight > 0) {
      const calculatedBmi = calculateBmi(height, weight);
      if (calculatedBmi > 0) {
        return calculatedBmi.toFixed(digits);
      }
    }
    
    return '0.0'; // Default value when bmi is not a valid number
  };

  // Function to download health certificate
  const downloadCertificate = (record: any) => {
    if (!record.certificateEnabled) {
      toast.error("Certificate not available");
      return;
    }
    
    // Get patient name
    const patient = SAMPLE_USERS.find(u => u.id === record.patientId);
    if (!patient) {
      toast.error("Patient information not found");
      return;
    }
    
    // Calculate BMI if needed
    const bmiValue = parseFloat(safeToFixed(record.bmi, 1, record.height, record.weight));
    const isHealthyBMI = bmiValue >= 18.5 && bmiValue < 25;
    
    if (!isHealthyBMI) {
      toast.error("Certificate only available for healthy BMI range");
      return;
    }

    // Create certificate HTML with professional styling
    const certificateHtml = `
      <html>
        <head>
          <title>Health Certificate for ${patient.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
            }
            .certificate {
              padding: 40px;
              max-width: 800px;
              margin: 40px auto;
              text-align: center;
              background-color: #fff;
              border-radius: 12px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
              border: 1px solid #eaeaea;
              position: relative;
              overflow: hidden;
            }
            .pattern-bg {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              opacity: 0.05;
              background-image: repeating-radial-gradient(circle at 0 0, transparent 0, #e5e7eb 10px), repeating-linear-gradient(#22c55e55, #22c55e55);
              z-index: 1;
            }
            .content {
              position: relative;
              z-index: 2;
            }
            .certificate-header {
              margin-bottom: 30px;
            }
            .header-content {
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 20px;
            }
            .header-logo {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background-color: #22c55e;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
            }
            .certificate-title {
              font-size: 28px;
              font-weight: bold;
              color: #22c55e;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .certificate-subtitle {
              font-size: 14px;
              color: #666;
              margin: 0;
              font-style: italic;
            }
            .header-line {
              height: 4px;
              background: linear-gradient(to right, #22c55e, #4ade80, #22c55e);
              border-radius: 2px;
              margin: 0 auto 10px auto;
              width: 80%;
            }
            .certificate-body {
              margin: 30px auto;
              padding: 30px;
              border: 2px solid #22c55e;
              border-radius: 10px;
              background-color: rgba(240, 253, 244, 0.5);
              max-width: 90%;
              position: relative;
            }
            .corner {
              position: absolute;
              width: 20px;
              height: 20px;
            }
            .corner-top-left {
              top: -3px;
              left: -3px;
              border-top: 3px solid #22c55e;
              border-left: 3px solid #22c55e;
            }
            .corner-top-right {
              top: -3px;
              right: -3px;
              border-top: 3px solid #22c55e;
              border-right: 3px solid #22c55e;
            }
            .corner-bottom-left {
              bottom: -3px;
              left: -3px;
              border-bottom: 3px solid #22c55e;
              border-left: 3px solid #22c55e;
            }
            .corner-bottom-right {
              bottom: -3px;
              right: -3px;
              border-bottom: 3px solid #22c55e;
              border-right: 3px solid #22c55e;
            }
            .intro-text {
              font-size: 16px;
              font-weight: normal;
              margin-bottom: 25px;
              color: #333;
            }
            .user-name {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 25px;
              color: #111;
              padding: 10px 20px;
              border-bottom: 1px solid #22c55e;
              border-top: 1px solid #22c55e;
              display: inline-block;
            }
            .bmi-details-container {
              margin: 25px 0;
            }
            .bmi-result {
              font-size: 20px;
              margin-bottom: 15px;
              color: #333;
            }
            .bmi-value {
              font-weight: bold;
              color: #22c55e;
            }
            .bmi-details {
              margin-bottom: 20px;
              color: #444;
              font-size: 16px;
            }
            .detail-value {
              font-weight: bold;
            }
            .bmi-category-result {
              font-size: 18px;
              color: #333;
            }
            .bmi-category {
              font-weight: bold;
              color: #22c55e;
            }
            .certificate-date {
              margin-top: 25px;
              font-style: italic;
              color: #666;
              font-size: 14px;
            }
            .certificate-footer {
              margin-top: 40px;
              display: flex;
              justify-content: space-around;
              align-items: flex-end;
            }
            .signature-container {
              text-align: center;
              flex: 1;
            }
            .signature-line {
              width: 180px;
              height: 1px;
              background: #000;
              margin: 10px auto;
            }
            .signature-title {
              font-weight: bold;
              font-size: 14px;
            }
            .seal-container {
              width: 100px;
              height: 100px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .seal {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              border: 1px solid #22c55e;
              position: relative;
              overflow: hidden;
            }
            .seal-text {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(34, 197, 94, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #22c55e;
              font-size: 12px;
              font-weight: bold;
              font-style: italic;
            }
            .certificate-meta {
              margin-top: 30px;
              font-size: 10px;
              color: #888;
              text-align: center;
            }
            .certificate-meta p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="pattern-bg"></div>
            <div class="content">
              <div class="certificate-header">
                <div class="header-content">
                  <div class="header-logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4V4C14.2091 4 16 5.79086 16 8H8C8 5.79086 9.79086 4 12 4Z" fill="white"/>
                      <path d="M18 8H6C4.89543 8 4 8.89543 4 10V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8Z" fill="white"/>
                      <path d="M12 12V16M12 12L9 14M12 12L15 14" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h1 class="certificate-title">Health Certificate</h1>
                    <p class="certificate-subtitle">Body Mass Index (BMI) - Healthy Status</p>
                  </div>
                </div>
                <div class="header-line"></div>
              </div>
              
              <div class="certificate-body">
                <div class="corner corner-top-left"></div>
                <div class="corner corner-top-right"></div>
                <div class="corner corner-bottom-left"></div>
                <div class="corner corner-bottom-right"></div>
                
                <div class="intro-text">This is to certify that</div>
                
                <div class="user-name">${patient.name}</div>
                
                <div class="bmi-details-container">
                  <div class="bmi-result">
                    has a BMI of <span class="bmi-value">${bmiValue}</span>
                  </div>
                  
                  <div class="bmi-details">
                    Height: <span class="detail-value">${record.height} cm</span> | Weight: <span class="detail-value">${record.weight} kg</span>
                  </div>
                  
                  <div class="bmi-category-result">
                    This BMI falls within the <span class="bmi-category">Normal</span> range.
                  </div>
                </div>
                
                <div class="certificate-date">
                  Issued on: ${format(new Date(record.date), 'MMMM d, yyyy')}
                </div>
              </div>
              
              <div class="certificate-footer">
                <div class="signature-container">
                  <div class="signature-line"></div>
                  <div class="signature-title">Medical Officer</div>
                </div>
                
                <div class="seal-container">
                  <div class="seal">
                    <div class="seal-text">SEAL</div>
                  </div>
                </div>
                
                <div class="signature-container">
                  <div class="signature-line"></div>
                  <div class="signature-title">Medical Clinic Authority</div>
                </div>
              </div>
              
              <div class="certificate-meta">
                <p>Certificate ID: HC-${Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                <p>This certificate is valid as of the issue date and can be verified online.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Create and trigger download
    const blob = new Blob([certificateHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_certificate_${patient.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success toast
    toast.success("Certificate downloaded successfully");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Medical History
      </h2>
      
      {userMedicalRecords.length > 0 ? (
        <div className="space-y-4">
          {userMedicalRecords
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(record => {
              const doctor = SAMPLE_USERS.find(u => u.id === record.doctorId);
              
              // Calculate and ensure BMI is properly displayed
              const calculatedBmi = (() => {
                if (record.bmi && record.bmi > 0) {
                  return typeof record.bmi === 'number' ? 
                    record.bmi : 
                    parseFloat(record.bmi);
                }
                
                if (record.height && record.weight && record.height > 0 && record.weight > 0) {
                  const heightInMeters = record.height / 100;
                  return record.weight / (heightInMeters * heightInMeters);
                }
                
                return 0;
              })();
              
              // Check if certificate is enabled and BMI is in healthy range
              const hasCertificate = record.certificateEnabled && calculatedBmi >= 18.5 && calculatedBmi < 25;
                
              return (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium flex items-center">
                        {record.diagnosis || 'General Checkup'}
                        {hasCertificate && (
                          <Medal className="h-4 w-4 ml-2 text-green-600" aria-label="Health Certificate Available" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(record.date), 'MMMM d, yyyy')}
                      </p>
                      {doctor && (
                        <p className="text-sm text-gray-500">
                          Doctor: {doctor.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="text-gray-500">Height:</span> {record.height} cm
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Weight:</span> {record.weight} kg
                      </p>
                      <p className="text-sm">
                        <span className={getBMICategoryColor(calculatedBmi)}>
                          BMI: {safeToFixed(calculatedBmi, 1, record.height, record.weight)}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Display vital signs if available */}
                  {record.vitalSigns && (
                    <div className="mt-2 border-t pt-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Vital Signs:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {record.vitalSigns.heartRate && (
                          <p className="text-sm">
                            <span className="text-gray-500">Heart Rate:</span> {record.vitalSigns.heartRate} BPM
                          </p>
                        )}
                        {record.vitalSigns.bloodPressure && (
                          <p className="text-sm">
                            <span className="text-gray-500">Blood Pressure:</span> {record.vitalSigns.bloodPressure}
                          </p>
                        )}
                        {record.vitalSigns.bloodGlucose && (
                          <p className="text-sm">
                            <span className="text-gray-500">Blood Glucose:</span> {record.vitalSigns.bloodGlucose} mg/dL
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {record.notes && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm text-gray-700">{record.notes}</p>
                    </div>
                  )}
                  
                  {/* Add prominent certificate download button */}
                  {hasCertificate && (
                    <div className="mt-3 pt-3 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 flex items-center justify-center"
                        onClick={() => downloadCertificate(record)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Health Certificate
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          
          {userMedicalRecords.length > 5 && (
            <div className="text-center mt-2">
              <Button 
                variant="link" 
                className="text-medical-primary"
                onClick={() => window.location.href = '/records'}
              >
                View all medical records
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">
            No medical records found.
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryCard;
