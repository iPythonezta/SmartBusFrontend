import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { stopsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MapPin, Search, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { StopModal } from '@/components/modals/StopModal';
import type { Stop } from '@/types';

const StopsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<Stop | undefined>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  const { data: stops, isLoading } = useQuery({
    queryKey: ['stops'],
    queryFn: () => stopsApi.getStops(),
  });

  const filteredStops = stops?.filter((stop) =>
    stop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddStop = () => {
    setSelectedStop(undefined);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleEditStop = (stop: Stop) => {
    setSelectedStop(stop);
    setModalMode('edit');
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('stops.title')}</h1>
            <p className="text-muted-foreground mt-1">Manage bus stops and locations</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
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
          <h1 className="text-3xl font-bold">{t('stops.title')}</h1>
          <p className="text-muted-foreground mt-1">Manage bus stops and locations</p>
        </div>
        <Button className="gap-2" onClick={handleAddStop}>
          <Plus className="h-4 w-4" />
          {t('stops.addStop')}
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('stops.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stops</p>
                <p className="text-2xl font-bold">{stops?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStops?.map((stop, index) => (
          <motion.div
            key={stop.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-all hover:border-teal-300 cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{stop.name}</CardTitle>
                    {stop.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {stop.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Navigation className="h-4 w-4" />
                  <span className="font-mono text-xs">
                    {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View on Map
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditStop(stop)}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredStops && filteredStops.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No stops match your search' : 'No stops found'}
              </p>
              <p className="text-sm mt-2">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Add your first stop to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <StopModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        stop={selectedStop}
        mode={modalMode}
      />
    </div>
  );
};

export default StopsPage;
