import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { routesApi, busesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Route as RouteIcon, MapPin, Bus } from 'lucide-react';

const RouteDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: route, isLoading: routeLoading } = useQuery({
    queryKey: ['route', id],
    queryFn: () => routesApi.getRoute(id!),
    enabled: !!id,
  });

  const { data: buses } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesApi.getBuses(),
  });

  const assignedBuses = buses?.filter(b => b.assigned_route_id === id);

  if (routeLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/routes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="animate-pulse">
          <CardContent className="h-64"></CardContent>
        </Card>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/routes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <RouteIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Route not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedStops = route.route_stops?.sort((a, b) => a.sequence_number - b.sequence_number) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/routes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{route.name}</h1>
              {route.color && (
                <div 
                  className="h-8 w-8 rounded" 
                  style={{ backgroundColor: route.color }}
                ></div>
              )}
            </div>
            <p className="text-muted-foreground">{route.code}</p>
          </div>
        </div>
      </div>

      {route.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{route.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Stops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-600" />
              <p className="text-2xl font-bold">{sortedStops.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Assigned Buses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-blue-600" />
              <p className="text-2xl font-bold">{assignedBuses?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Route Code</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-mono font-bold">{route.code}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route Stops</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedStops.map((routeStop, index) => (
              <div 
                key={routeStop.id}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-teal-100 text-teal-700 font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{routeStop.stop?.name || 'Unknown Stop'}</p>
                  {routeStop.distance_from_prev && index > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {routeStop.distance_from_prev}m from previous stop
                    </p>
                  )}
                </div>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {assignedBuses && assignedBuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Buses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assignedBuses.map(bus => (
                <div 
                  key={bus.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/buses/${bus.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Bus className="h-5 w-5 text-teal-600" />
                    <div>
                      <p className="font-medium">{bus.registration_number}</p>
                      <p className="text-xs text-muted-foreground capitalize">{bus.status}</p>
                    </div>
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline">Edit Route</Button>
        <Button variant="outline">Manage Stops</Button>
        <Button variant="destructive" className="ml-auto">Delete Route</Button>
      </div>
    </div>
  );
};

export default RouteDetailPage;
