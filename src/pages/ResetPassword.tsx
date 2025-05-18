
import React from 'react';
import { useParams } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import ResetPasswordComponent from '@/components/auth/ResetPassword';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  
  return (
    <AuthLayout title="Reset Password">
      <ResetPasswordComponent token={token} />
    </AuthLayout>
  );
};

export default ResetPassword;
