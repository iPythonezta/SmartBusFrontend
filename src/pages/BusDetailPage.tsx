import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { busesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bus, Navigation, MapPin, Activity, Calendar, MapPinOff } from 'lucide-react';
import { BusModal } from '@/components/modals/BusModal';
import { toast } from '@/components/ui/use-toast';
import { MapboxMap } from '@/components/map/MapboxMap';

const BusDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  
  const busId = id ? parseInt(id, 10) : undefined;
  
  const { data: bus, isLoading } = useQuery({
    queryKey: ['bus', busId],
    queryFn: () => busesApi.getBus(busId!),
    enabled: !!busId,
    // Refetch every 3 seconds to get latest location from backend
    refetchInterval: 3000,
  });

  // Only use location data from the backend - no simulation
  const displayLocation = bus?.last_location;

  const deleteMutation = useMutation({
    mutationFn: () => busesApi.deleteBus(busId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      toast({
        title: 'Success',
        description: 'Bus removed successfully',
      });
      navigate('/buses');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove bus',
        variant: 'destructive',
      });
    },
  });

  const handleRemoveBus = () => {
    if (window.confirm('Are you sure you want to remove this bus? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const handleViewRoute = () => {
    if (bus?.route_id) {
      navigate(`/routes/${bus.route_id}`);
    } else {
      toast({
        title: 'No Route Assigned',
        description: 'This bus is not assigned to any route yet',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/buses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/buses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Bus className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Bus not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'maintenance': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/buses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{bus.registration_number}</h1>
            <p className="text-muted-foreground">Bus Details</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${getStatusColor(bus.status)}`}>
          {bus.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-teal-600" />
              <p className="text-2xl font-bold">{bus.capacity} seats</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Route</CardTitle>
          </CardHeader>
          <CardContent>
            {bus.route ? (
              <div>
                <p className="text-lg font-bold">{bus.route.name}</p>
                <p className="text-sm text-muted-foreground">{bus.route.code}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No route assigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <p className="text-sm">{new Date(bus.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {displayLocation && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-teal-600" />
              <CardTitle>Location Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200 relative" style={{ zIndex: 1 }}>
              <MapboxMap
                initialViewState={{
                  longitude: displayLocation.longitude,
                  latitude: displayLocation.latitude,
                  zoom: 14,
                }}
                buses={bus.last_location ? [bus] : []}
                stops={bus.route?.stops?.map(s => ({
                  id: s.stop_id,
                  name: s.stop_name,
                  latitude: s.latitude,
                  longitude: s.longitude,
                  created_at: '',
                  updated_at: '',
                })) || []}
                showRoute={!!bus.route?.stops && bus.route.stops.length > 1}
                routeColor={bus.route?.color || '#0d9488'}
                height="100%"
                interactive={true}
                showControls={true}
                fitToBounds={!!bus.route?.stops && bus.route.stops.length > 0}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Activity className="h-5 w-5 mx-auto mb-1 text-teal-600" />
                <p className="text-xs text-muted-foreground">Speed</p>
                <p className="text-lg font-bold">
                  {displayLocation.speed != null ? `${displayLocation.speed} km/h` : 'N/A'}
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Navigation className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-xs text-muted-foreground">Heading</p>
                <p className="text-lg font-bold">
                  {displayLocation.heading != null ? `${displayLocation.heading}°` : 'N/A'}
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <MapPin className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <p className="text-xs text-muted-foreground">Last Update</p>
                <p className="text-xs font-medium">{new Date(displayLocation.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!displayLocation && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPinOff className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-amber-700">No GPS Data Available</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <MapPinOff className="h-16 w-16 mx-auto mb-4 text-amber-400 opacity-50" />
              <p className="text-lg font-medium text-amber-700">
                This bus has not reported its location yet
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Location data will appear here once the bus starts transmitting GPS signals.
              </p>
              {bus.last_location?.timestamp && (
                <p className="text-xs text-muted-foreground mt-4">
                  Last data received: {new Date(bus.last_location.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setShowEditModal(true)}>
          Edit Bus Details
        </Button>
        <Button variant="outline" onClick={handleViewRoute}>
          View Route
        </Button>
        <Button 
          variant="destructive" 
          className="ml-auto"
          onClick={handleRemoveBus}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Removing...' : 'Remove Bus'}
        </Button>
      </div>

      <BusModal 
        open={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        bus={bus}
      />
    </div>
  );
};

export default BusDetailPage;
