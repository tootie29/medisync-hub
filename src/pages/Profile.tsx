
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";
import { User } from '@/types';
import { CalendarIcon, Clock, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { getAppointmentsByPatientId } = useData();
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

  // Get user appointments
  const userAppointments = user ? getAppointmentsByPatientId(user.id) : [];

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

  return (
    <MainLayout>
      <div className="medical-container">
        <h1 className="page-title">Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  User Information
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
          </div>

          {/* New appointments section */}
          <div className="md:col-span-1">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Your Appointments</CardTitle>
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
                            className={`p-3 rounded-lg border ${
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
                              <div className="mt-2">
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
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      You don't have any appointments yet.
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

