
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
              <span className={`font-medium ${getBMICategoryColor(latestMedicalRecord.bmi)}`}>
                {latestMedicalRecord.bmi.toFixed(1)} - {getBMICategory(latestMedicalRecord.bmi)}
              </span>
            </div>
            <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(latestMedicalRecord.bmi * 2, 100)}%`,
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
