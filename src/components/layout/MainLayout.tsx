import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import SideNav from './SideNav';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

const MainLayout: React.FC = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="flex pt-16">
        <SideNav />
        <main
          className={cn(
            'flex-1 transition-all duration-300 ease-in-out p-6',
            sidebarOpen ? 'ml-64' : 'ml-0'
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
