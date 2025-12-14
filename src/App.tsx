import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import { useUIStore } from './store';
import { useEffect } from 'react';
import { Toaster } from './components/ui/toaster';

// Pages (will create these)
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BusesPage from './pages/BusesPage';
import BusDetailPage from './pages/BusDetailPage';
import RoutesPage from './pages/RoutesPage';
import RouteDetailPage from './pages/RouteDetailPage';
import StopsPage from './pages/StopsPage';
import DisplaysPage from './pages/DisplaysPage';
import SMDSimulatorPage from './pages/SMDSimulatorPage';
import AdsPage from './pages/AdsPage';
import AdvertisersPage from './pages/AdvertisersPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import GPSSimulatorPage from './pages/GPSSimulatorPage';

// Layout
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { i18n } = useTranslation();
  const language = useUIStore((state) => state.language);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, i18n]);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/smd-simulator" element={<SMDSimulatorPage />} />
        <Route path="/smd-simulator/:displayId" element={<SMDSimulatorPage />} />
        
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/buses" element={<BusesPage />} />
          <Route path="/buses/:id" element={<BusDetailPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/routes/:id" element={<RouteDetailPage />} />
          <Route path="/stops" element={<StopsPage />} />
          <Route path="/display-units" element={<DisplaysPage />} />
          <Route path="/ads" element={<AdsPage />} />
          <Route path="/advertisers" element={<AdvertisersPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/gps-simulator" element={<GPSSimulatorPage />} />
          <Route path="/users" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
