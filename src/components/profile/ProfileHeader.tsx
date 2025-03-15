
import React from 'react';
import { Button } from '@/components/ui/button';

interface ProfileHeaderProps {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ isEditing, setIsEditing }) => {
  return (
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
  );
};

export default ProfileHeader;
