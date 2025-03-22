
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Heart,
  BookPlus,
  Clipboard,
  UserCircle,
  Settings,
  Calculator,
  Activity,
  Package2,
  PanelLeft,
  Palette,
  LogOut
} from 'lucide-react';

import {
  Sidebar as UISidebar,
  SidebarSection,
  SidebarItem,
  SidebarMenu,
  SidebarDivider,
} from "@/components/ui/sidebar";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

  return (
    <UISidebar className="pl-2 pr-2">
      <SidebarMenu>
        <SidebarSection>
          <SidebarItem 
            icon={<Heart size={20} />} 
            text="Dashboard" 
            isActive={isActive('/dashboard')}
            onClick={() => handleNavigation('/dashboard')}
          />
          <SidebarItem 
            icon={<BookPlus size={20} />} 
            text="Appointments" 
            isActive={isActive('/appointments')}
            onClick={() => handleNavigation('/appointments')}
          />
          {isDoctor && (
            <SidebarItem 
              icon={<Clipboard size={20} />} 
              text="Medical Records" 
              isActive={isActive('/medical-records')}
              onClick={() => handleNavigation('/medical-records')}
            />
          )}
          <SidebarItem 
            icon={<UserCircle size={20} />} 
            text="Profile" 
            isActive={isActive('/profile')}
            onClick={() => handleNavigation('/profile')}
          />
        </SidebarSection>
        
        <SidebarDivider />
        
        <SidebarSection title="Tools">
          <SidebarItem 
            icon={<Calculator size={20} />} 
            text="BMI Calculator" 
            isActive={isActive('/bmi-calculator')}
            onClick={() => handleNavigation('/bmi-calculator')}
          />
          <SidebarItem 
            icon={<Activity size={20} />} 
            text="Health Monitoring" 
            isActive={isActive('/health-monitoring')}
            onClick={() => handleNavigation('/health-monitoring')}
          />
          {isAdmin && (
            <SidebarItem 
              icon={<Package2 size={20} />} 
              text="Inventory" 
              isActive={isActive('/inventory')}
              onClick={() => handleNavigation('/inventory')}
            />
          )}
        </SidebarSection>
        
        <SidebarDivider />
        
        <SidebarSection title="System">
          <SidebarItem 
            icon={<Settings size={20} />} 
            text="Settings" 
            isActive={isActive('/settings')}
            onClick={() => handleNavigation('/settings')}
          />
          {isAdmin && (
            <SidebarItem 
              icon={<Palette size={20} />} 
              text="Branding Settings" 
              isActive={isActive('/branding-settings')}
              onClick={() => handleNavigation('/branding-settings')}
            />
          )}
          <SidebarItem 
            icon={<LogOut size={20} />} 
            text="Logout" 
            onClick={logout}
          />
        </SidebarSection>
      </SidebarMenu>
    </UISidebar>
  );
}
