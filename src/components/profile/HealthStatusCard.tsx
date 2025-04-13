import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Medal, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SAMPLE_USERS } from '@/types';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

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

  const safeToFixed = (value: any, digits: number = 1): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(digits);
    }
    return '0.0';
  };

  const bmi = typeof latestMedicalRecord.bmi === 'number' ? 
    latestMedicalRecord.bmi : 
    parseFloat(latestMedicalRecord.bmi) || 0;
    
  const hasCertificate = latestMedicalRecord.certificateEnabled && bmi >= 18.5 && bmi < 25;

  const downloadCertificate = () => {
    if (!hasCertificate) {
      toast.error("Certificate not available");
      return;
    }
    
    const patient = SAMPLE_USERS.find(u => u.id === latestMedicalRecord.patientId);
    if (!patient) {
      toast.error("Patient information not found");
      return;
    }
    
    toast.info('Preparing your PDF certificate...');
    
    const certificateContainer = document.createElement('div');
    certificateContainer.style.visibility = 'hidden';
    certificateContainer.style.position = 'absolute';
    certificateContainer.style.left = '-9999px';
    document.body.appendChild(certificateContainer);
    
    certificateContainer.innerHTML = `
      <div style="width: 800px; padding: 40px; font-family: Arial, sans-serif; position: relative; background: white;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.05; background-image: repeating-radial-gradient(circle at 0 0, transparent 0, #e5e7eb 10px), repeating-linear-gradient(#22c55e55, #22c55e55); z-index: 1;"></div>
        
        <div style="position: relative; z-index: 2;">
          <div style="margin-bottom: 30px; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #22c55e; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4V4C14.2091 4 16 5.79086 16 8H8C8 5.79086 9.79086 4 12 4Z" fill="white"/>
                  <path d="M18 8H6C4.89543 8 4 8.89543 4 10V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8Z" fill="white"/>
                  <path d="M12 12V16M12 12L9 14M12 12L15 14" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 style="font-size: 28px; font-weight: bold; color: #22c55e; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Health Certificate</h1>
                <p style="font-size: 14px; color: #666; margin: 0; font-style: italic;">Body Mass Index (BMI) - Healthy Status</p>
              </div>
            </div>
            
            <div style="height: 4px; background: linear-gradient(to right, #22c55e, #4ade80, #22c55e); border-radius: 2px; margin: 0 auto 10px auto; width: 80%;"></div>
          </div>
          
          <div style="margin: 30px auto; padding: 30px; border: 2px solid #22c55e; border-radius: 10px; background-color: rgba(240, 253, 244, 0.5); max-width: 90%; position: relative; text-align: center;">
            <div style="position: absolute; top: -3px; left: -3px; width: 20px; height: 20px; border-top: 3px solid #22c55e; border-left: 3px solid #22c55e;"></div>
            <div style="position: absolute; top: -3px; right: -3px; width: 20px; height: 20px; border-top: 3px solid #22c55e; border-right: 3px solid #22c55e;"></div>
            <div style="position: absolute; bottom: -3px; left: -3px; width: 20px; height: 20px; border-bottom: 3px solid #22c55e; border-left: 3px solid #22c55e;"></div>
            <div style="position: absolute; bottom: -3px; right: -3px; width: 20px; height: 20px; border-bottom: 3px solid #22c55e; border-right: 3px solid #22c55e;"></div>
            
            <div style="font-size: 16px; font-weight: normal; margin-bottom: 25px; color: #333;">This is to certify that</div>
            
            <div style="font-size: 28px; font-weight: bold; margin-bottom: 25px; color: #111; padding: 10px 20px; border-bottom: 1px solid #22c55e; border-top: 1px solid #22c55e; display: inline-block;">${patient.name}</div>
            
            <div style="margin: 25px 0;">
              <div style="font-size: 20px; margin-bottom: 15px; color: #333;">
                has a BMI of <span style="font-weight: bold; color: #22c55e;">${safeToFixed(bmi)}</span>
              </div>
              
              <div style="margin-bottom: 20px; color: #444; font-size: 16px;">
                Height: <span style="font-weight: bold;">${latestMedicalRecord.height} cm</span> | Weight: <span style="font-weight: bold;">${latestMedicalRecord.weight} kg</span>
              </div>
              
              <div style="font-size: 18px; color: #333;">
                This BMI falls within the <span style="font-weight: bold; color: #22c55e;">Normal</span> range.
              </div>
            </div>
            
            <div style="margin-top: 25px; font-style: italic; color: #666; font-size: 14px;">
              Issued on: ${format(new Date(latestMedicalRecord.date), 'MMMM d, yyyy')}
            </div>
          </div>
          
          <div style="margin-top: 40px; display: flex; justify-content: space-around; align-items: flex-end; text-align: center;">
            <div style="flex: 1;">
              <div style="width: 180px; height: 1px; background: #000; margin: 10px auto;"></div>
              <div style="font-weight: bold; font-size: 14px;">Medical Officer</div>
            </div>
            
            <div style="width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 80px; height: 80px; border-radius: 50%; border: 1px solid #22c55e; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(34, 197, 94, 0.1); display: flex; align-items: center; justify-content: center; color: #22c55e; font-size: 12px; font-weight: bold; font-style: italic;">SEAL</div>
              </div>
            </div>
            
            <div style="flex: 1;">
              <div style="width: 180px; height: 1px; background: #000; margin: 10px auto;"></div>
              <div style="font-weight: bold; font-size: 14px;">Medical Clinic Authority</div>
            </div>
          </div>
          
          <div style="margin-top: 30px; font-size: 10px; color: #888; text-align: center;">
            <p>Certificate ID: HC-${Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
            <p>This certificate is valid as of the issue date and can be verified online.</p>
          </div>
        </div>
      </div>
    `;
    
    const opt = {
      margin: [0, 0, 0, 0],
      filename: `health_certificate_${patient.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(certificateContainer).set(opt).save()
      .then(() => {
        document.body.removeChild(certificateContainer);
        toast.success("Certificate downloaded successfully");
      })
      .catch(error => {
        console.error('Error generating PDF:', error);
        document.body.removeChild(certificateContainer);
        toast.error("Failed to generate PDF certificate");
      });
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
          </div>
          
          {hasCertificate && (
            <div className="mt-4 border-t pt-4">
              <Button 
                onClick={downloadCertificate}
                className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
              >
                <Medal className="w-4 h-4 mr-2" />
                Download Health Certificate
              </Button>
              <p className="text-xs text-center text-green-600 mt-1">
                A health certificate has been enabled by your doctor
              </p>
            </div>
          )}
          
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
