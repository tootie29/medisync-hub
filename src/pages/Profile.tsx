import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { SAMPLE_USERS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from "sonner";
import { User } from '@/types';
import { CalendarIcon, Clock, User as UserIcon, Activity, ArrowUpRight } from 'lucide-react';
import { format, parseISO, isFuture, addDays } from 'date-fns';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { getAppointmentsByPatientId, getMedicalRecordsByPatientId } = useData();
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<User>>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || undefined,
    address: user?.address || '',
    emergencyContact: user?.emergencyContact || '',
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const userAppointments = user ? getAppointmentsByPatientId(user.id) : [];
  
  const userMedicalRecords = user ? getMedicalRecordsByPatientId(user.id) : [];
  
  const latestMedicalRecord = userMedicalRecords.length > 0
    ? userMedicalRecords.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
    : null;

  const upcomingAppointments = userAppointments
    .filter(app => 
      app.status !== 'cancelled' && 
      isFuture(parseISO(app.date))
    )
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value as any }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <MainLayout>
      <div className="medical-container">
        <h1 className="page-title">Your Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Personal Information
                </h2>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-medical-primary hover:bg-medical-secondary"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="form-group">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={handleGenderChange}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="form-group md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group md:col-span-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Textarea
                      id="emergencyContact"
                      name="emergencyContact"
                      rows={2}
                      placeholder="Name: Relationship: Phone number:"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 mt-6">
                  {isEditing && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            dateOfBirth: user?.dateOfBirth || '',
                            gender: user?.gender || undefined,
                            address: user?.address || '',
                            emergencyContact: user?.emergencyContact || '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-medical-primary hover:bg-medical-secondary"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </div>
            
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
                                <span className={getBMICategoryColor(record.bmi)}>
                                  {record.bmi.toFixed(1)}
                                </span>
                              </p>
                            </div>
                          </div>
                          
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
          </div>

          <div className="md:col-span-1 space-y-6">
            {latestMedicalRecord && (
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
            )}
            
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
