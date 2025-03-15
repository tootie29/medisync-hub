
import React from 'react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import ProfileHeader from './ProfileHeader';

const ProfileForm: React.FC = () => {
  const { user, updateProfile } = useAuth();
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <ProfileHeader isEditing={isEditing} setIsEditing={setIsEditing} />

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
  );
};

export default ProfileForm;
