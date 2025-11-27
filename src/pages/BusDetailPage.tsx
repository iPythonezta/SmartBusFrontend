import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { busesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bus, Navigation, MapPin, Activity, Calendar } from 'lucide-react';

const BusDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: bus, isLoading } = useQuery({
    queryKey: ['bus', id],
    queryFn: () => busesApi.getBus(id!),
    enabled: !!id,
  });

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
            {bus.assigned_route ? (
              <div>
                <p className="text-lg font-bold">{bus.assigned_route.name}</p>
                <p className="text-sm text-muted-foreground">{bus.assigned_route.code}</p>
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

      {bus.last_location && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-teal-600" />
              <CardTitle>Live Location</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg flex items-center justify-center border-2 border-dashed border-teal-200">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-teal-400" />
                <p className="font-medium">Map View</p>
                <p className="text-sm">Lat: {bus.last_location.latitude.toFixed(4)}, Lng: {bus.last_location.longitude.toFixed(4)}</p>
                <p className="text-xs mt-2">Map integration placeholder</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Activity className="h-5 w-5 mx-auto mb-1 text-teal-600" />
                <p className="text-xs text-muted-foreground">Speed</p>
                <p className="text-lg font-bold">{bus.last_location.speed} km/h</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Navigation className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-xs text-muted-foreground">Heading</p>
                <p className="text-lg font-bold">{bus.last_location.heading}°</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <MapPin className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <p className="text-xs text-muted-foreground">Last Update</p>
                <p className="text-xs font-medium">{new Date(bus.last_location.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline">Edit Bus Details</Button>
        <Button variant="outline">View Route</Button>
        <Button variant="destructive" className="ml-auto">Remove Bus</Button>
      </div>
    </div>
  );
};

export default BusDetailPage;
