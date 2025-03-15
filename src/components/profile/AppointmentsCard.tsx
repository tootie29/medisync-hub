
import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, User as UserIcon, ArrowUpRight } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SAMPLE_USERS } from '@/types';

interface AppointmentsCardProps {
  upcomingAppointments: any[];
}

const AppointmentsCard: React.FC<AppointmentsCardProps> = ({ upcomingAppointments }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Upcoming Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => {
              const doctor = SAMPLE_USERS.find(u => u.id === appointment.doctorId);
              const isWithinTwoDays = parseISO(appointment.date) <= addDays(new Date(), 2);
              
              return (
                <div 
                  key={appointment.id}
                  className={`p-3 rounded-lg border ${
                    isWithinTwoDays ? 'bg-amber-50 border-amber-200' :
                    appointment.status === 'confirmed' ? 'bg-green-50 border-green-200' :
                    appointment.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex flex-col">
                    <h3 className="font-medium">{appointment.reason}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{format(new Date(appointment.date), 'PPP')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{appointment.startTime} - {appointment.endTime}</span>
                    </div>
                    {doctor && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <span>Dr. {doctor.name}</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      
                      {isWithinTwoDays && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                          Coming soon!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center text-medical-primary"
                onClick={() => window.location.href = '/appointments'}
              >
                Manage Appointments
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              You don't have any upcoming appointments.
            </p>
            <Button 
              variant="link" 
              className="mt-2 text-medical-primary"
              onClick={() => window.location.href = '/appointments'}
            >
              Book an appointment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentsCard;
