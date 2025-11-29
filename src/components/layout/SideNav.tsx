import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Bus,
  Route as RouteIcon,
  MapPin,
  Monitor,
  Image,
  Megaphone,
  Users,
  Settings,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

const SideNav: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/buses', icon: Bus, label: t('nav.buses') },
    { to: '/routes', icon: RouteIcon, label: t('nav.routes') },
    { to: '/stops', icon: MapPin, label: t('nav.stops') },
    { to: '/display-units', icon: Monitor, label: t('nav.displays') },
    { to: '/ads', icon: Image, label: t('nav.ads') },
    { to: '/announcements', icon: Megaphone, label: t('nav.announcements') },
    { to: '/gps-simulator', icon: Zap, label: 'GPS Simulator' },
    ...(isAdmin ? [{ to: '/users', icon: Users, label: t('nav.users') }] : []),
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-border z-40 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  'hover:bg-accent hover:scale-[1.02] active:scale-[0.98]',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-foreground'
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideNav;
