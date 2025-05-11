
import React, { useState, useEffect } from "react";
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
import { SAMPLE_USERS } from "@/types";
import { generateTimeSlots } from "@/utils/helpers";
import { CalendarIcon, Clock, User, AlertCircle, FileText, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import MainLayout from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const timeSlots = generateTimeSlots();

const Appointments = () => {
  const { user } = useAuth();
  const { addAppointment, appointments, getAppointmentsByPatientId, updateAppointment } = useData();
  
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const doctors = SAMPLE_USERS.filter(u => u.role === 'head nurse' || u.role === 'doctor');
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  
  const effectiveUserId = user?.id || 'user-preview';
  const userRole = user?.role || 'student';
  
  // Filter appointments based on user role
  // If doctor/head nurse, show all appointments assigned to them
  // If patient, show only their appointments
  const filteredAppointments = userRole === 'doctor' || userRole === 'head nurse' 
    ? appointments.filter(app => app.doctorId === effectiveUserId)
    : getAppointmentsByPatientId(effectiveUserId);
    
  const isMedicalStaff = userRole === 'doctor' || userRole === 'head nurse';
  
  useEffect(() => {
    if (!user?.id && window.location.hostname.includes('lovableproject.com')) {
      console.log('Running in preview mode without authenticated user - using sample data');
    }
  }, [user]);
  
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
    
    const patientId = user?.id || `user-${Date.now()}`;
    
    if (!date || !startTime || !reason || !selectedDoctor) {
      toast.error("Please fill out all required fields");
      return;
    }
    
    const endTime = calculateEndTime(startTime);
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    if (!isTimeSlotAvailable(date, startTime, selectedDoctor)) {
      toast.error("This time slot is not available. Please select another time.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      addAppointment({
        patientId,
        doctorId: selectedDoctor,
        date: formattedDate,
        startTime,
        endTime,
        status: 'pending',
        reason,
        notes: notes || undefined,
      })
      .then(() => {
        setDate(undefined);
        setStartTime("");
        setReason("");
        setNotes("");
        setSelectedDoctor("");
        
        toast.success("Appointment request sent successfully! The doctor will be notified.");
      })
      .catch(error => {
        console.error("Appointment creation error:", error);
        const errorMessage = error.response?.data?.message || error.message || "Unknown error";
        toast.error(`Failed to book appointment: ${errorMessage}`);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
    } catch (error) {
      console.error("Error in appointment submission:", error);
      toast.error("Failed to book appointment. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Handler for updating appointment status
  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      console.log(`Updating appointment ${appointmentId} status to ${newStatus}`);
      await updateAppointment(appointmentId, { status: newStatus });
      toast.success(`Appointment status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Failed to update appointment status");
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          {isMedicalStaff ? "Manage Appointments" : "Book an Appointment"}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {!isMedicalStaff && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Schedule New Appointment</CardTitle>
                <CardDescription>
                  Fill out the form below to request an appointment with a doctor.
                  {!user?.id && (
                    <div className="mt-2 text-yellow-600 text-sm">
                      Note: You are using the system in preview mode. In production, users need to be logged in.
                    </div>
                  )}
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
          )}
          
          <div className={`space-y-6 ${isMedicalStaff ? "col-span-2" : ""}`}>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>
                  {isMedicalStaff ? "Today's Appointments" : "Your Upcoming Appointments"}
                </CardTitle>
                <CardDescription>
                  {isMedicalStaff 
                    ? "Manage your patients' appointments" 
                    : "View your scheduled appointments"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAppointments
                      .filter(app => app.status !== 'cancelled')
                      .sort((a, b) => {
                        const dateA = new Date(`${a.date}T${a.startTime}`);
                        const dateB = new Date(`${b.date}T${b.startTime}`);
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map((appointment) => {
                        const doctor = SAMPLE_USERS.find(u => u.id === appointment.doctorId);
                        const patient = SAMPLE_USERS.find(u => u.id === appointment.patientId);
                        
                        // Get the appointment date as a Date object
                        const appointmentDate = new Date(`${appointment.date}T${appointment.startTime}`);
                        const isToday = new Date().toDateString() === appointmentDate.toDateString();
                        
                        // Determine if the appointment is today or upcoming
                        const cardStyle = isToday
                          ? 'bg-blue-50 border-blue-200'
                          : appointment.status === 'confirmed' 
                            ? 'bg-green-50 border-green-200' 
                            : appointment.status === 'pending' 
                              ? 'bg-yellow-50 border-yellow-200'
                              : appointment.status === 'completed'
                                ? 'bg-gray-50 border-gray-200'
                                : 'bg-gray-50 border-gray-200';
                        
                        return (
                          <div 
                            key={appointment.id}
                            className={`p-4 rounded-lg border ${cardStyle}`}
                          >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
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
                                
                                {isMedicalStaff && patient && (
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <User className="h-4 w-4 mr-1" />
                                    <span>Patient: {patient.name}</span>
                                  </div>
                                )}
                                
                                {!isMedicalStaff && doctor && (
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <User className="h-4 w-4 mr-1" />
                                    <span>Dr. {doctor.name}</span>
                                  </div>
                                )}
                                
                                {appointment.notes && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    <p><strong>Notes:</strong> {appointment.notes}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <Badge className={`w-fit ${
                                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                  appointment.status === 'in-progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                  appointment.status === 'completed' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' :
                                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                  'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                }`}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </Badge>
                                
                                {/* Doctor/Head Nurse Actions */}
                                {isMedicalStaff && (
                                  <div className="flex flex-col gap-2 mt-2">
                                    {appointment.status === 'pending' && (
                                      <Button 
                                        size="sm" 
                                        onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Confirm
                                      </Button>
                                    )}
                                    
                                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                      <Button 
                                        size="sm" 
                                        onClick={() => handleStatusChange(appointment.id, 'in-progress')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        Start Visit
                                      </Button>
                                    )}
                                    
                                    {appointment.status === 'in-progress' && (
                                      <>
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                                          className="bg-gray-600 hover:bg-gray-700 text-white"
                                        >
                                          Complete Visit
                                        </Button>
                                        
                                        <Button 
                                          asChild 
                                          size="sm"
                                          variant="outline"
                                        >
                                          <Link to={`/medical-records?patient=${appointment.patientId}&action=add&appointment=${appointment.id}`}>
                                            <FileText className="h-4 w-4 mr-1" />
                                            Create Record
                                          </Link>
                                        </Button>
                                      </>
                                    )}
                                    
                                    {appointment.status === 'completed' && (
                                      <Button 
                                        asChild 
                                        size="sm"
                                        variant="outline"
                                      >
                                        <Link to={`/medical-records?patient=${appointment.patientId}`}>
                                          <FileText className="h-4 w-4 mr-1" />
                                          View Records
                                        </Link>
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
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
                      {isMedicalStaff 
                        ? "You don't have any scheduled appointments yet" 
                        : "You don't have any scheduled appointments yet"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {!isMedicalStaff && (
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
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Appointments;
