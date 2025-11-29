import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Bell, User, LogOut, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUIStore } from '@/store';
import { Button } from '@/components/ui/button';

const TopNav: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { toggleSidebar, language, setLanguage } = useUIStore();

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border z-50 px-4">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SB</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none">{t('app.title')}</span>
              <span className="text-xs text-muted-foreground">{t('app.subtitle')}</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleLanguageToggle}>
            <Globe className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent">
            <User className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.user_type === 'ADMIN' ? 'Admin' : 'Staff'}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
