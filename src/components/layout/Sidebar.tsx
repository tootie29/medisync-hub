
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
  Palette,
  LogOut
} from 'lucide-react';

import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/dashboard')}
                  onClick={() => handleNavigation('/dashboard')}
                >
                  <Heart size={20} />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/appointments')}
                  onClick={() => handleNavigation('/appointments')}
                >
                  <BookPlus size={20} />
                  <span>Appointments</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {isDoctor && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive('/medical-records')}
                    onClick={() => handleNavigation('/medical-records')}
                  >
                    <Clipboard size={20} />
                    <span>Medical Records</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/profile')}
                  onClick={() => handleNavigation('/profile')}
                >
                  <UserCircle size={20} />
                  <span>Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/bmi-calculator')}
                  onClick={() => handleNavigation('/bmi-calculator')}
                >
                  <Calculator size={20} />
                  <span>BMI Calculator</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/health-monitoring')}
                  onClick={() => handleNavigation('/health-monitoring')}
                >
                  <Activity size={20} />
                  <span>Health Monitoring</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive('/inventory')}
                    onClick={() => handleNavigation('/inventory')}
                  >
                    <Package2 size={20} />
                    <span>Inventory</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/settings')}
                  onClick={() => handleNavigation('/settings')}
                >
                  <Settings size={20} />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive('/branding-settings')}
                    onClick={() => handleNavigation('/branding-settings')}
                  >
                    <Palette size={20} />
                    <span>Branding Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout}>
                  <LogOut size={20} />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </UISidebar>
  );
}
