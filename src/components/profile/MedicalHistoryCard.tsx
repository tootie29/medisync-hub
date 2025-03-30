
import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { SAMPLE_USERS } from '@/types';
import { Medal, Download } from 'lucide-react';

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
    if (!record.certificateEnabled) return;
    
    // Get patient name
    const patient = SAMPLE_USERS.find(u => u.id === record.patientId);
    if (!patient) return;
    
    // Calculate BMI if needed
    const bmiValue = parseFloat(safeToFixed(record.bmi, 1, record.height, record.weight));
    const isHealthyBMI = bmiValue >= 18.5 && bmiValue < 25;
    
    if (!isHealthyBMI) return;

    // Create certificate HTML
    const certificateHtml = `
      <html>
        <head>
          <title>Health Certificate for ${patient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .certificate { padding: 40px; max-width: 800px; margin: 0 auto; text-align: center; }
            .certificate-header { margin-bottom: 30px; }
            .certificate-title { font-size: 36px; color: #22c55e; margin-bottom: 10px; }
            .certificate-subtitle { font-size: 18px; color: #555; }
            .certificate-body { margin: 30px 0; padding: 20px; border: 2px solid #22c55e; border-radius: 10px; }
            .user-name { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .bmi-result { font-size: 20px; margin-bottom: 10px; }
            .bmi-value { font-weight: bold; color: #22c55e; }
            .bmi-category { font-weight: bold; color: #22c55e; }
            .certificate-date { margin-top: 20px; font-style: italic; color: #555; }
            .certificate-footer { margin-top: 40px; }
            .signature-line { width: 200px; height: 1px; background: #000; margin: 10px auto; }
            .doctor-name { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="certificate-header">
              <h1 class="certificate-title">Health Certificate</h1>
              <h2 class="certificate-subtitle">Body Mass Index (BMI) - Healthy Status</h2>
            </div>
            
            <div class="certificate-body">
              <div class="user-name">
                This is to certify that
                <br />
                <span style="display: block; margin: 10px 0; font-size: 28px; color: #333;">${patient.name}</span>
              </div>
              
              <div class="bmi-result">
                has a BMI of <span class="bmi-value">${bmiValue}</span>
              </div>
              
              <div class="bmi-details" style="margin-bottom: 20px">
                Height: ${record.height} cm | Weight: ${record.weight} kg
              </div>
              
              <div class="bmi-category-result">
                This BMI falls within the <span class="bmi-category">Normal</span> range.
              </div>
              
              <div class="certificate-date">
                Issued on: ${format(new Date(record.date), 'MMMM d, yyyy')}
              </div>
            </div>
            
            <div class="certificate-footer">
              <div class="signature-line"></div>
              <div class="doctor-name">Medical Clinic Authority</div>
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
                      
                      {/* Add download certificate button */}
                      {hasCertificate && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 p-0 h-auto text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => downloadCertificate(record)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          <span className="text-xs">Certificate</span>
                        </Button>
                      )}
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
