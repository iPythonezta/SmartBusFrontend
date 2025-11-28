import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, busesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, Route, MapPin, Monitor, Activity, AlertCircle } from 'lucide-react';
import { MapCanvas } from '@/components/map/MapCanvas';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesApi.getBuses(),
  });

  const statCards = [
    {
      title: t('dashboard.totalBuses'),
      value: stats?.total_buses || 0,
      icon: Bus,
      color: 'text-teal-600 bg-teal-50',
    },
    {
      title: t('dashboard.activeBuses'),
      value: stats?.active_buses || 0,
      icon: Activity,
      color: 'text-green-600 bg-green-50',
    },
    {
      title: t('dashboard.totalRoutes'),
      value: stats?.total_routes || 0,
      icon: Route,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: t('dashboard.totalStops'),
      value: stats?.total_stops || 0,
      icon: MapPin,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: t('dashboard.onlineDisplays'),
      value: stats?.online_displays || 0,
      icon: Monitor,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      title: t('dashboard.activeAnnouncements'),
      value: stats?.active_announcements || 0,
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.overview')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.liveMap')}</CardTitle>
        </CardHeader>
        <CardContent>
          {busesLoading ? (
            <div className="h-96 bg-muted rounded-xl flex items-center justify-center">
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : (
            <MapCanvas
              initialViewState={{
                longitude: 73.0479,
                latitude: 33.6844,
                zoom: 12,
              }}
              buses={buses?.filter(b => b.last_location) || []}
              height="384px"
              interactive={true}
              showControls={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
