import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { busesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bus, Navigation, MapPin, Activity, Calendar } from 'lucide-react';
import { BusModal } from '@/components/modals/BusModal';
import { toast } from '@/components/ui/use-toast';
import { realtimeService } from '@/services/realtime';
import { routingService } from '@/services/routing';
import type { BusLocation } from '@/types';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create a custom blue pulsing marker icon (like Google Maps)
const createPulsingIcon = () => {
  return L.divIcon({
    className: 'custom-pulsing-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          background: rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Create a custom marker icon with label for bus stops
const createStopIcon = (stopName: string) => {
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          width: 12px;
          height: 12px;
          background: #0d9488;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        "></div>
        <div style="
          margin-top: 4px;
          padding: 2px 6px;
          background: white;
          border: 1px solid #0d9488;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #0d9488;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          font-family: system-ui, -apple-system, sans-serif;
        ">${stopName}</div>
      </div>
    `,
    iconSize: [120, 40],
    iconAnchor: [60, 12],
  });
};

// Component to handle smooth real-time marker updates
function LiveBusMarker({ busId, initialLocation }: { busId: string; initialLocation: BusLocation }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Create marker with pulsing icon
    const marker = L.marker(
      [initialLocation.latitude, initialLocation.longitude],
      { icon: createPulsingIcon() }
    ).addTo(map);

    marker.bindPopup(`
      <div style="font-family: system-ui; min-width: 150px;">
        <strong style="color: #0f766e; font-size: 14px;">Live Position</strong>
        <div style="margin-top: 8px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #64748b;">Speed:</span>
            <strong id="popup-speed">${initialLocation.speed} km/h</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Heading:</span>
            <strong id="popup-heading">${initialLocation.heading}°</strong>
          </div>
        </div>
      </div>
    `);

    markerRef.current = marker;

    // Subscribe to real-time updates
    const unsubscribe = realtimeService.subscribe(busId, (_busId, location) => {
      if (marker) {
        // Smooth marker position update
        marker.setLatLng([location.latitude, location.longitude]);
        
        // Update popup content if open
        const popup = marker.getPopup();
        if (popup) {
          const speedEl = document.getElementById('popup-speed');
          const headingEl = document.getElementById('popup-heading');
          if (speedEl) speedEl.textContent = `${location.speed} km/h`;
          if (headingEl) headingEl.textContent = `${location.heading}°`;
        }
      }
    });

    return () => {
      unsubscribe();
      if (marker) {
        map.removeLayer(marker);
      }
    };
  }, [busId, map, initialLocation.latitude, initialLocation.longitude]);

  return null;
}

// Component to render the route polyline with actual road-based routing
function RoutePolyline({ routeStops, color }: { 
  routeStops: Array<{ stop?: { latitude: number; longitude: number }; sequence_number: number }>;
  color: string;
}) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      setIsLoading(true);
      
      // Get stop coordinates in order
      const stopPoints = routeStops
        .filter(rs => rs.stop)
        .sort((a, b) => a.sequence_number - b.sequence_number)
        .map(rs => [rs.stop!.latitude, rs.stop!.longitude] as [number, number]);

      if (stopPoints.length < 2) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the actual road-based route
        const coordinates = await routingService.getRoute(stopPoints);
        setRouteCoordinates(coordinates);
      } catch (error) {
        console.error('Error fetching route:', error);
        // Fallback to straight lines
        setRouteCoordinates(stopPoints);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [routeStops]);

  if (isLoading || routeCoordinates.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={routeCoordinates}
      color={color}
      weight={5}
      opacity={0.8}
    />
  );
}

const BusDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [liveLocation, setLiveLocation] = useState<BusLocation | null>(null);
  
  const { data: bus, isLoading } = useQuery({
    queryKey: ['bus', id],
    queryFn: () => busesApi.getBus(id!),
    enabled: !!id,
  });

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!bus || !id) return;

    const unsubscribe = realtimeService.subscribe(id, (_busId, location) => {
      setLiveLocation(location);
    });

    return () => {
      unsubscribe();
    };
  }, [bus, id]);

  // Use live location if available, otherwise use last known location
  const displayLocation = liveLocation || bus?.last_location;

  const deleteMutation = useMutation({
    mutationFn: () => busesApi.deleteBus(id!),
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
    if (bus?.assigned_route_id) {
      navigate(`/routes/${bus.assigned_route_id}`);
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

      {displayLocation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-teal-600" />
                <CardTitle>Live Location</CardTitle>
              </div>
              {liveLocation && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium">LIVE</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200 relative" style={{ zIndex: 1 }}>
              <MapContainer
                center={[displayLocation.latitude, displayLocation.longitude]}
                zoom={14}
                style={{ width: '100%', height: '100%', zIndex: 1 }}
                zoomControl={true}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Show route polyline with actual road-based routing */}
                {bus.assigned_route?.route_stops && bus.assigned_route.route_stops.length > 1 && (
                  <RoutePolyline 
                    routeStops={bus.assigned_route.route_stops}
                    color={bus.assigned_route.color || '#0d9488'}
                  />
                )}

                {/* Show route stops with permanent labels */}
                {bus.assigned_route?.route_stops?.map((routeStop) => (
                  routeStop.stop && (
                    <Marker
                      key={routeStop.stop.id}
                      position={[routeStop.stop.latitude, routeStop.stop.longitude]}
                      icon={createStopIcon(routeStop.stop.name)}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'system-ui', minWidth: '150px' }}>
                          <strong style={{ color: '#0f766e', fontSize: '14px' }}>
                            Stop {routeStop.sequence_number}: {routeStop.stop.name}
                          </strong>
                          {routeStop.stop.description && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                              {routeStop.stop.description}
                            </div>
                          )}
                          <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                            {routeStop.stop.latitude.toFixed(6)}, {routeStop.stop.longitude.toFixed(6)}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
                
                {/* Live bus marker with pulsing effect */}
                <LiveBusMarker busId={bus.id} initialLocation={displayLocation} />
              </MapContainer>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Activity className="h-5 w-5 mx-auto mb-1 text-teal-600" />
                <p className="text-xs text-muted-foreground">Speed</p>
                <p className="text-lg font-bold">{displayLocation.speed} km/h</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Navigation className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-xs text-muted-foreground">Heading</p>
                <p className="text-lg font-bold">{displayLocation.heading}°</p>
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
