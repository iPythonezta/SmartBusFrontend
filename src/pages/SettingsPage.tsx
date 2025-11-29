import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Globe, Bell, Database, Save } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and system configuration</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" />
            <CardTitle>Profile Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" defaultValue={user?.first_name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" defaultValue={user?.last_name} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input 
                id="role" 
                defaultValue={user?.user_type === 'ADMIN' ? 'Administrator' : 'Staff'} 
                disabled 
                className="bg-muted" 
              />
            </div>
          </div>
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <CardTitle>Language & Localization</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Interface Language</p>
              <p className="text-sm text-muted-foreground">
                Current: {i18n.language === 'en' ? 'English' : 'اردو (Urdu)'}
              </p>
            </div>
            <Button variant="outline" onClick={handleLanguageToggle}>
              Switch to {i18n.language === 'en' ? 'اردو' : 'English'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">Right-to-Left (RTL) Support</p>
              <p className="text-sm text-muted-foreground">Automatically enabled for Urdu</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              i18n.language === 'ur' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {i18n.language === 'ur' ? 'Active' : 'Inactive'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <CardTitle>Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Emergency Announcements</p>
              <p className="text-sm text-muted-foreground">Receive alerts for critical system events</p>
            </div>
            <Button variant="outline">
              Configure
            </Button>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">System Updates</p>
              <p className="text-sm text-muted-foreground">Get notified about bus status changes</p>
            </div>
            <Button variant="outline">
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            <CardTitle>API Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">API Base URL</Label>
            <Input 
              id="api-url" 
              defaultValue={import.meta.env.VITE_API_URL || 'http://localhost:8000/api'} 
              placeholder="http://localhost:8000/api"
            />
            <p className="text-xs text-muted-foreground">
              Currently using <span className="font-mono bg-yellow-100 px-1 rounded">mock data</span> for demo
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ws-url">WebSocket URL (Real-time Updates)</Label>
            <Input 
              id="ws-url" 
              defaultValue={import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'} 
              placeholder="ws://localhost:8000/ws"
            />
          </div>

          <Button variant="outline" className="gap-2">
            <Database className="h-4 w-4" />
            Test Connection
          </Button>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="text-orange-700">About This Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-orange-900">
          <p>
            <strong>Smart Bus Islamabad Management Dashboard</strong> - Phase 1
          </p>
          <p>
            This is a demonstration frontend using mock data. All changes are simulated and won't persist.
          </p>
          <p className="pt-2 border-t border-orange-200">
            Built with: React 19 • TypeScript • Vite • Tailwind CSS • React Query • Framer Motion
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
