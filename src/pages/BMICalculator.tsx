
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from "sonner";

const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy Weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

const getBMICategoryColor = (bmi: number): string => {
  if (bmi < 18.5) return 'text-blue-500';
  if (bmi < 25) return 'text-green-500';
  if (bmi < 30) return 'text-yellow-500';
  return 'text-red-500';
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
  
  const isPatient = user?.role === 'student' || user?.role === 'staff';
  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

  // Fetch the latest record for the current user (if patient)
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
        setBmi(latest.bmi);
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
    setBmi(parseFloat(calculatedBMI.toFixed(2)));
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
        // Show an error if no patient is selected (future enhancement)
        toast.error('Select a patient to save their medical record');
      } else {
        // For patients updating their own record
        if (lastRecord) {
          // Update the existing record
          updateMedicalRecord(lastRecord.id, {
            height,
            weight,
            date: new Date().toISOString().split('T')[0],
          });
          toast.success('Medical record updated successfully');
        } else {
          // Create a new record
          addMedicalRecord({
            patientId: user.id,
            doctorId: 'self-recorded', // Placeholder for self-recorded
            date: new Date().toISOString().split('T')[0],
            height,
            weight,
          });
          toast.success('Medical record created successfully');
        }
        
        // Refresh the last record
        const records = getMedicalRecordsByPatientId(user.id);
        if (records.length > 0) {
          const latest = records.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          setLastRecord(latest);
        }
      }
    } catch (error) {
      console.error('Error saving medical record:', error);
      toast.error('An error occurred while saving your medical record');
    } finally {
      setLoading(false);
    }
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
                  <h3 className="text-3xl font-bold mb-2">{bmi.toFixed(1)}</h3>
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
    </MainLayout>
  );
};

export default BMICalculator;
