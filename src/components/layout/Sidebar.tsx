
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  User, 
  Package2, 
  Settings,
  Calculator,
  Stethoscope,
  HeartPulse
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, active }) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active 
          ? "bg-medical-accent text-medical-primary" 
          : "text-gray-700 hover:bg-gray-100 hover:text-medical-primary"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-10 md:w-64 bg-white border-r border-gray-200 pt-20">
      <div className="h-0 flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavItem 
            to="/dashboard" 
            icon={<LayoutDashboard className="h-5 w-5" />} 
            label="Dashboard" 
            active={isActive('/dashboard')} 
          />
          
          <NavItem 
            to="/appointments" 
            icon={<Calendar className="h-5 w-5" />} 
            label="Appointments" 
            active={isActive('/appointments')} 
          />
          
          {(isDoctor || isAdmin) && (
            <NavItem 
              to="/patients" 
              icon={<Users className="h-5 w-5" />} 
              label="Patients" 
              active={isActive('/patients')} 
            />
          )}

          <NavItem 
            to="/profile" 
            icon={<User className="h-5 w-5" />} 
            label="Profile" 
            active={isActive('/profile')} 
          />

          {(isDoctor || isAdmin || isStaff) && (
            <NavItem 
              to="/bmi-calculator" 
              icon={<Calculator className="h-5 w-5" />} 
              label="BMI Calculator" 
              active={isActive('/bmi-calculator')} 
            />
          )}

          {(isDoctor || isAdmin || isStaff) && (
            <NavItem 
              to="/medical-records" 
              icon={<Stethoscope className="h-5 w-5" />} 
              label="Medical Records" 
              active={isActive('/medical-records')} 
            />
          )}

          {(isDoctor || isAdmin || isStaff) && (
            <NavItem 
              to="/inventory" 
              icon={<Package2 className="h-5 w-5" />} 
              label="Medicine Inventory" 
              active={isActive('/inventory')} 
            />
          )}

          <NavItem 
            to="/settings" 
            icon={<Settings className="h-5 w-5" />} 
            label="Settings" 
            active={isActive('/settings')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-medical-primary flex items-center justify-center">
              <HeartPulse className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-medical-primary">MediSync Hub</p>
              <p className="text-xs text-gray-500">Healthcare Management</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
