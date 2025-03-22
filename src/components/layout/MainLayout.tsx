
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Add some debug logs
  console.log("MainLayout rendering", { user, isLoading });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center green-gradient-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    console.log("No user detected, will redirect to login");
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen bg-medical-light/30">
      <Navbar />
      <div className="flex">
        <SidebarProvider defaultOpen={true}>
          <Sidebar />
          <main className="flex-1 p-4 md:p-8 pt-24 transition-all duration-300 md:ml-64">
            {children}
          </main>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default MainLayout;
