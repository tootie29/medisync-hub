import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { AlertCircle, ArrowRight, Download, Medal, Lock } from 'lucide-react';
import { toast } from "sonner";
import { getBMICategory, getBMICategoryColor } from '@/utils/helpers';
import BMICertificate from '@/components/bmi/BMICertificate';
import html2pdf from 'html2pdf.js';

const safeToFixed = (value: any, digits: number = 1): string => {
  if (typeof value === 'number' && !isNaN(value) && value > 0) {
    return value.toFixed(digits);
  }
  return '0.0';
};

const BMICalculator: React.FC = () => {
  const { user } = useAuth();
  const { 
    getMedicalRecordsByPatientId, 
    addMedicalRecord, 
    updateMedicalRecord 
  } = useData();
  
  const [height, setHeight] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);
  const [bmi, setBmi] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastRecord, setLastRecord] = useState<any>(null);
  const [showCertificateControls, setShowCertificateControls] = useState<boolean>(false);
  const [certificateEnabled, setCertificateEnabled] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  
  const isPatient = user?.role === 'student' || user?.role === 'staff';
  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';
  
  const isHealthyBMI = bmi !== null && bmi >= 18.5 && bmi < 25;
  const hasBMICertificate = isHealthyBMI && (lastRecord?.certificateEnabled || false);

  useEffect(() => {
    if (isPatient && user?.id) {
      const records = getMedicalRecordsByPatientId(user.id);
      if (records.length > 0) {
        const latest = records.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        
        setLastRecord(latest);
        setHeight(latest.height);
        setWeight(latest.weight);
        setCertificateEnabled(latest.certificateEnabled || false);
        
        if (typeof latest.bmi === 'number' && latest.bmi > 0) {
          setBmi(latest.bmi);
        } else if (typeof latest.bmi === 'string' && !isNaN(parseFloat(latest.bmi)) && parseFloat(latest.bmi) > 0) {
          setBmi(parseFloat(latest.bmi));
        } else {
          if (latest.height > 0 && latest.weight > 0) {
            const heightInMeters = latest.height / 100;
            const calculatedBMI = latest.weight / (heightInMeters * heightInMeters);
            const roundedBMI = parseFloat(calculatedBMI.toFixed(2));
            setBmi(roundedBMI);
            updateMedicalRecord(latest.id, { bmi: roundedBMI });
          } else {
            setBmi(0);
          }
        }
      }
    }
  }, [isPatient, user?.id, getMedicalRecordsByPatientId]);

  const calculateBMI = () => {
    if (!height || !weight) {
      toast.error('Please enter both height and weight');
      return;
    }
    
    const heightInMeters = height / 100;
    const calculatedBMI = weight / (heightInMeters * heightInMeters);
    const roundedBMI = parseFloat(calculatedBMI.toFixed(2));
    setBmi(roundedBMI);
    
    const shouldEnableCertificate = roundedBMI >= 18.5 && roundedBMI < 25;
    
    if (shouldEnableCertificate && lastRecord && isPatient && !lastRecord.certificateEnabled) {
      toast.info('Your BMI is in the healthy range! A certificate is now available for download.');
    }
  };

  const toggleCertificateAccess = async () => {
    if (!lastRecord?.id) {
      toast.error('No medical record found to update');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Toggling certificate access from', certificateEnabled, 'to', !certificateEnabled);
      console.log('Record ID:', lastRecord.id);
      console.log('Patient ID:', lastRecord.patientId);
      
      const newCertificateValue = !certificateEnabled;
      console.log('New certificate value (before API call):', newCertificateValue);
      
      const updatedRecord = await updateMedicalRecord(lastRecord.id, {
        patientId: lastRecord.patientId,
        certificateEnabled: newCertificateValue
      });
      
      console.log('Updated record received:', updatedRecord);
      console.log('Certificate status in response:', updatedRecord.certificateEnabled);
      
      setCertificateEnabled(Boolean(updatedRecord.certificateEnabled));
      setLastRecord(updatedRecord);
      
      toast.success(`Certificate access ${updatedRecord.certificateEnabled ? 'enabled' : 'disabled'} for patient`);
    } catch (error) {
      console.error('Error updating certificate access:', error);
      toast.error('Failed to update certificate access');
    } finally {
      setLoading(false);
    }
  };

  const saveToMedicalRecord = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to save records');
      return;
    }
    
    if (!height || !weight || !bmi) {
      toast.error('Please calculate BMI first');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isDoctor) {
        toast.error('Select a patient to save their medical record');
      } else {
        const isHealthyBMI = bmi >= 18.5 && bmi < 25;
        
        if (lastRecord) {
          await updateMedicalRecord(lastRecord.id, {
            height,
            weight,
            bmi,
            date: new Date().toISOString().split('T')[0],
            certificateEnabled: isHealthyBMI
          });
          toast.success('Medical record updated successfully');
        } else {
          await addMedicalRecord({
            patientId: user.id,
            doctorId: 'self-recorded',
            date: new Date().toISOString().split('T')[0],
            height,
            weight,
            certificateEnabled: isHealthyBMI
          });
          toast.success('Medical record created successfully');
        }
        
        const records = getMedicalRecordsByPatientId(user.id);
        if (records.length > 0) {
          const latest = records.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          setLastRecord(latest);
          setCertificateEnabled(latest.certificateEnabled || false);
        }
      }
    } catch (error) {
      console.error('Error saving medical record:', error);
      toast.error('An error occurred while saving your medical record');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = () => {
    if (!hasBMICertificate || !user?.name) {
      toast.error('Certificate not available');
      return;
    }
    
    setShowCertificate(true);
    setTimeout(() => {
      const element = document.getElementById('bmi-certificate');
      
      if (element) {
        toast.info('Preparing your PDF certificate...');
        
        const opt = {
          margin: [0, 0, 0, 0],
          filename: `health_certificate_${user.name.replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        html2pdf().from(element).set(opt).save()
          .then(() => {
            toast.success('Certificate downloaded successfully');
            setShowCertificate(false);
          })
          .catch(error => {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF certificate');
            setShowCertificate(false);
          });
      } else {
        toast.error('Certificate element not found');
        setShowCertificate(false);
      }
    }, 100);
  };

  return (
    <MainLayout>
      <div className="medical-container">
        <h1 className="page-title">BMI Calculator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Calculate Your BMI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={height || ''}
                    onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                    placeholder="Enter your height in centimeters"
                  />
                </div>
                
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weight || ''}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    placeholder="Enter your weight in kilograms"
                  />
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button 
                    className="flex-1 bg-medical-primary hover:bg-medical-secondary"
                    onClick={calculateBMI}
                  >
                    Calculate BMI
                  </Button>
                  
                  {isPatient && (
                    <Button 
                      className="flex-1"
                      variant="outline"
                      disabled={!bmi || loading}
                      onClick={saveToMedicalRecord}
                    >
                      {loading ? 'Saving...' : 'Save to Medical Record'}
                    </Button>
                  )}
                </div>

                {isDoctor && lastRecord && (
                  <div className="pt-4 border-t mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Certificate Controls</h3>
                        <p className="text-xs text-gray-500">Toggle certificate access for this patient</p>
                      </div>
                      <Switch 
                        checked={certificateEnabled} 
                        onCheckedChange={toggleCertificateAccess}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {lastRecord && (
                  <div className="text-sm text-gray-500 mt-2">
                    <p>Last updated: {new Date(lastRecord.updatedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Results</CardTitle>
            </CardHeader>
            <CardContent>
              {bmi ? (
                <div className="text-center py-4">
                  <h3 className="text-3xl font-bold mb-2">{safeToFixed(bmi)}</h3>
                  <p className={`text-xl font-medium ${getBMICategoryColor(bmi)}`}>
                    {getBMICategory(bmi)}
                  </p>
                  
                  <div className="mt-6 mb-4">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
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
                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                      <span>Underweight</span>
                      <span>Normal</span>
                      <span>Overweight</span>
                      <span>Obese</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-left p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">What your BMI means:</h4>
                    {bmi < 18.5 && (
                      <p className="text-sm text-gray-600">
                        Your BMI suggests you may be underweight. It's important to maintain a healthy weight for overall wellbeing. Consider consulting a healthcare professional for personalized advice.
                      </p>
                    )}
                    {bmi >= 18.5 && bmi < 25 && (
                      <p className="text-sm text-gray-600">
                        Your BMI falls within the healthy weight range. Maintaining a healthy weight through balanced diet and regular physical activity is important for your health.
                      </p>
                    )}
                    {bmi >= 25 && bmi < 30 && (
                      <p className="text-sm text-gray-600">
                        Your BMI suggests you may be overweight. This may increase your risk of health problems. Consider incorporating healthier eating habits and regular physical activity.
                      </p>
                    )}
                    {bmi >= 30 && (
                      <p className="text-sm text-gray-600">
                        Your BMI suggests obesity, which may increase your risk of health problems such as heart disease and type 2 diabetes. We recommend consulting a healthcare professional for personalized advice.
                      </p>
                    )}
                  </div>

                  {isPatient && hasBMICertificate && (
                    <div className="mt-6">
                      <Button
                        onClick={downloadCertificate} 
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Medal className="w-4 h-4 mr-2" />
                        Download Health Certificate
                      </Button>
                    </div>
                  )}

                  {isPatient && bmi >= 18.5 && bmi < 25 && !hasBMICertificate && (
                    <div className="mt-6 flex items-center justify-center text-gray-500">
                      <Lock className="w-4 h-4 mr-2" />
                      <span className="text-sm">Certificate not available</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <AlertCircle className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium">No Results Yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter your height and weight to calculate your BMI.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Understanding Body Mass Index (BMI)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Body Mass Index (BMI) is a simple calculation using a person's height and weight. The formula is BMI = kg/m² where kg is a person's weight in kilograms and m² is their height in meters squared.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">BMI Categories:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-blue-500 mr-2"></span>
                    <span className="font-medium mr-2">Below 18.5:</span>
                    <span>Underweight</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                    <span className="font-medium mr-2">18.5 – 24.9:</span>
                    <span>Healthy Weight</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></span>
                    <span className="font-medium mr-2">25.0 – 29.9:</span>
                    <span>Overweight</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                    <span className="font-medium mr-2">30.0 and above:</span>
                    <span>Obese</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-500">
                <strong>Note:</strong> BMI is a screening tool, not a diagnostic tool. Factors like muscle mass, age, sex, ethnicity, and body composition are not accounted for in BMI calculations. Always consult a healthcare provider for personalized health advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div style={{ display: showCertificate ? 'block' : 'none', position: 'absolute', left: '-9999px' }}>
        <BMICertificate 
          id="bmi-certificate"
          userName={user?.name || ''}
          bmi={bmi || 0}
          height={height}
          weight={weight}
          date={new Date().toLocaleDateString()}
        />
      </div>
    </MainLayout>
  );
};

export default BMICalculator;
