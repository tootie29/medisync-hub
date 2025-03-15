
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { generateTimeSlots, SAMPLE_USERS } from "@/types";
import { CalendarIcon, Clock, User, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const timeSlots = generateTimeSlots();

const Appointments = () => {
  const { user } = useAuth();
  const { addAppointment, appointments, getAppointmentsByPatientId } = useData();
  
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const doctors = SAMPLE_USERS.filter(u => u.role === 'doctor');
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  
  const userAppointments = user ? getAppointmentsByPatientId(user.id) : [];
  
  // Calculate end time (30 min after start time)
  const calculateEndTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    let newMinutes = minutes + 30;
    let newHours = hours;
    
    if (newMinutes >= 60) {
      newMinutes -= 60;
      newHours += 1;
    }
    
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };
  
  // Check if time slot is available
  const isTimeSlotAvailable = (date: Date, time: string, doctorId: string): boolean => {
    if (!date) return false;
    
    const dateString = format(date, 'yyyy-MM-dd');
    const endTime = calculateEndTime(time);
    
    return !appointments.some(appointment => 
      appointment.date === dateString && 
      appointment.doctorId === doctorId &&
      ((time >= appointment.startTime && time < appointment.endTime) || 
       (endTime > appointment.startTime && endTime <= appointment.endTime))
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to book an appointment");
      return;
    }
    
    if (!date || !startTime || !reason || !selectedDoctor) {
      toast.error("Please fill out all required fields");
      return;
    }
    
    const endTime = calculateEndTime(startTime);
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Check if the selected time slot is available
    if (!isTimeSlotAvailable(date, startTime, selectedDoctor)) {
      toast.error("This time slot is not available. Please select another time.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      addAppointment({
        patientId: user.id,
        doctorId: selectedDoctor,
        date: formattedDate,
        startTime,
        endTime,
        status: 'pending',
        reason,
        notes: notes || undefined,
      });
      
      // Reset form
      setDate(undefined);
      setStartTime("");
      setReason("");
      setNotes("");
      setSelectedDoctor("");
      
      toast.success("Appointment request sent successfully! The doctor will be notified.");
    } catch (error) {
      toast.error("Failed to book appointment. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Book an Appointment</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Schedule New Appointment</CardTitle>
            <CardDescription>
              Fill out the form below to request an appointment with a doctor.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Doctor</label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Select value={startTime} onValueChange={setStartTime} disabled={!date || !selectedDoctor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => {
                      const isAvailable = date ? isTimeSlotAvailable(date, time, selectedDoctor) : false;
                      return (
                        <SelectItem 
                          key={time} 
                          value={time}
                          disabled={!isAvailable}
                          className={!isAvailable ? "opacity-50" : ""}
                        >
                          {time} {!isAvailable && "(Not available)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Visit</label>
                <Input 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="E.g., Regular checkup, Flu symptoms, etc." 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Notes (Optional)</label>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific concerns or information the doctor should know" 
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || !date || !startTime || !reason || !selectedDoctor}
              >
                {isSubmitting ? "Booking..." : "Book Appointment"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Your Upcoming Appointments</CardTitle>
              <CardDescription>
                View your scheduled appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userAppointments.length > 0 ? (
                <div className="space-y-4">
                  {userAppointments
                    .filter(app => app.status !== 'cancelled')
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.startTime}`);
                      const dateB = new Date(`${b.date}T${b.startTime}`);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map((appointment) => {
                      const doctor = SAMPLE_USERS.find(u => u.id === appointment.doctorId);
                      return (
                        <div 
                          key={appointment.id}
                          className={`p-4 rounded-lg border ${
                            appointment.status === 'confirmed' ? 'bg-green-50 border-green-200' :
                            appointment.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
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
                                  <User className="h-4 w-4 mr-1" />
                                  <span>Dr. {doctor.name}</span>
                                </div>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="rounded-full bg-gray-100 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No appointments</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    You don't have any scheduled appointments yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                If you need immediate medical attention, please call our emergency helpline at 
                <strong> 123-456-7890</strong>.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                For general inquiries, you can email us at 
                <strong> support@medi-hub.com</strong>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
