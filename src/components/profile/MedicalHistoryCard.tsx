
import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { SAMPLE_USERS } from '@/types';

interface MedicalHistoryCardProps {
  userMedicalRecords: any[];
  getBMICategoryColor: (bmi: number) => string;
}

const MedicalHistoryCard: React.FC<MedicalHistoryCardProps> = ({ 
  userMedicalRecords, 
  getBMICategoryColor 
}) => {
  // Safe toFixed function to handle non-number BMI values
  const safeToFixed = (value: any, digits: number = 1): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(digits);
    }
    return '0.0'; // Default value when bmi is not a valid number
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
              // Make sure bmi is treated as a number
              const bmi = typeof record.bmi === 'number' ? 
                record.bmi : 
                parseFloat(record.bmi) || 0;
                
              return (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">
                        {record.diagnosis || 'General Checkup'}
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
                        <span className={getBMICategoryColor(bmi)}>
                          BMI: {safeToFixed(bmi)}
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
