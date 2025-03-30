
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Medal, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SAMPLE_USERS } from '@/types';

interface HealthStatusCardProps {
  latestMedicalRecord: any;
  getBMICategory: (bmi: number) => string;
  getBMICategoryColor: (bmi: number) => string;
}

const HealthStatusCard: React.FC<HealthStatusCardProps> = ({ 
  latestMedicalRecord, 
  getBMICategory, 
  getBMICategoryColor 
}) => {
  if (!latestMedicalRecord) return null;

  // Safe toFixed function to handle non-number BMI values
  const safeToFixed = (value: any, digits: number = 1): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(digits);
    }
    return '0.0'; // Default value when bmi is not a valid number
  };

  // Make sure bmi is treated as a number
  const bmi = typeof latestMedicalRecord.bmi === 'number' ? 
    latestMedicalRecord.bmi : 
    parseFloat(latestMedicalRecord.bmi) || 0;
    
  // Check if certificate is enabled and BMI is in healthy range
  const hasCertificate = latestMedicalRecord.certificateEnabled && bmi >= 18.5 && bmi < 25;

  // Function to download health certificate
  const downloadCertificate = () => {
    if (!hasCertificate) return;
    
    // Get patient name
    const patient = SAMPLE_USERS.find(u => u.id === latestMedicalRecord.patientId);
    if (!patient) return;
    
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
                has a BMI of <span class="bmi-value">${safeToFixed(bmi)}</span>
              </div>
              
              <div class="bmi-details" style="margin-bottom: 20px">
                Height: ${latestMedicalRecord.height} cm | Weight: ${latestMedicalRecord.weight} kg
              </div>
              
              <div class="bmi-category-result">
                This BMI falls within the <span class="bmi-category">Normal</span> range.
              </div>
              
              <div class="certificate-date">
                Issued on: ${format(new Date(latestMedicalRecord.date), 'MMMM d, yyyy')}
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
    a.download = `health_certificate_${patient?.name.replace(/\s+/g, '_') || 'patient'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Health Status</CardTitle>
        <CardDescription>
          Last updated: {format(new Date(latestMedicalRecord.date), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">BMI</span>
              <span className={`font-medium ${getBMICategoryColor(bmi)}`}>
                {safeToFixed(bmi)} - {getBMICategory(bmi)}
              </span>
            </div>
            <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(bmi * 2, 100)}%`,
                  background: `linear-gradient(to right, 
                    #3b82f6 0%, #3b82f6 18.5%, 
                    #22c55e 18.5%, #22c55e 25%, 
                    #eab308 25%, #eab308 30%, 
                    #ef4444 30%, #ef4444 100%)`
                }}
              ></div>
            </div>
          </div>
          
          <div className="pt-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Height</span>
              <span className="font-medium">{latestMedicalRecord.height} cm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Weight</span>
              <span className="font-medium">{latestMedicalRecord.weight} kg</span>
            </div>
            {latestMedicalRecord.bloodPressure && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Blood Pressure</span>
                <span className="font-medium">{latestMedicalRecord.bloodPressure}</span>
              </div>
            )}
            
            {hasCertificate && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm text-green-600 flex items-center">
                  <Medal className="h-3 w-3 mr-1" />
                  Health Certificate
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-auto text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={downloadCertificate}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-center text-medical-primary"
              onClick={() => window.location.href = '/records'}
            >
              View Medical Records
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthStatusCard;
