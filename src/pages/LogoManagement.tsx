
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import LogoUploader from '@/components/admin/LogoUploader';

const LogoManagement: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Logo Management</h1>
        <LogoUploader />
      </div>
    </MainLayout>
  );
};

export default LogoManagement;
