import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { busesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Navigation, Activity, MapPinOff } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BusModal } from '@/components/modals/BusModal';

const BusesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { data: buses, isLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesApi.getBuses(),
    // Refetch every 3 seconds to get latest location data from backend
    refetchInterval: 3000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('buses.title')}</h1>
            <p className="text-muted-foreground mt-1">Manage your fleet of buses</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('buses.title')}</h1>
          <p className="text-muted-foreground mt-1">Manage your fleet of buses</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          {t('buses.addBus')}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Buses</p>
                <p className="text-2xl font-bold">{buses?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Navigation className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Buses</p>
                <p className="text-2xl font-bold">
                  {buses?.filter((b) => b.status === 'active').length || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Maintenance</p>
                <p className="text-2xl font-bold">
                  {buses?.filter((b) => b.status === 'maintenance').length || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buses?.map((bus, index) => (
          <motion.div
            key={bus.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{bus.registration_number}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Capacity: {bus.capacity} passengers
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium border',
                      getStatusColor(bus.status)
                    )}
                  >
                    {bus.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {bus.route ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="h-4 w-4 text-teal-600" />
                    <span className="font-medium">{bus.route.name}</span>
                    <span className="text-muted-foreground">({bus.route.code})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Navigation className="h-4 w-4" />
                    <span>No route assigned</span>
                  </div>
                )}

                {bus.last_location ? (
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Speed: {bus.last_location.speed} km/h</span>
                      <span>•</span>
                      <span>Last seen: {formatDateTime(bus.last_location.timestamp)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinOff className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-600 font-medium">No GPS Data</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => navigate(`/buses/${bus.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!buses || buses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Navigation className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No buses found</p>
              <p className="text-sm mt-2">Add your first bus to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <BusModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
};

export default BusesPage;
