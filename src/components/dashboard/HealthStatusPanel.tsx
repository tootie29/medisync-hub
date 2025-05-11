
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicalRecord } from '@/types';

interface HealthStatusPanelProps {
  latestRecord: MedicalRecord;
}

const HealthStatusPanel: React.FC<HealthStatusPanelProps> = ({ latestRecord }) => {
  // Safe toFixed function to handle non-number BMI values
  const safeToFixed = (value: any, digits: number = 1): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(digits);
    }
    return '0.0'; // Default value when value is not a valid number
  };

  // Make sure bmi is treated as a number
  const bmi = typeof latestRecord.bmi === 'number' ? 
    latestRecord.bmi : 
    parseFloat(latestRecord.bmi as string) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">BMI</span>
            <span className="font-medium">
              {safeToFixed(bmi)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Height</span>
            <span className="font-medium">{latestRecord.height} cm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Weight</span>
            <span className="font-medium">{latestRecord.weight} kg</span>
          </div>
          {latestRecord.bloodPressure && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Blood Pressure</span>
              <span className="font-medium">{latestRecord.bloodPressure}</span>
            </div>
          )}
          {/* Add Respiratory Rate display */}
          {latestRecord.vitalSigns?.respiratoryRate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Respiratory Rate</span>
              <span className="font-medium">{latestRecord.vitalSigns.respiratoryRate} breaths/min</span>
            </div>
          )}
          {/* Add Oxygen Saturation display */}
          {latestRecord.vitalSigns?.oxygenSaturation && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Oxygen Saturation</span>
              <span className="font-medium">{latestRecord.vitalSigns.oxygenSaturation}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthStatusPanel;
