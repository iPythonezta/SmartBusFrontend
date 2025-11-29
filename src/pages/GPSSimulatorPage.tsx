import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { busesApi, routesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MapPin, Play, Square, RefreshCw, Zap, Bus, Navigation, 
  AlertTriangle, Route, Clock, Gauge
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { Bus as BusType, RouteStopInfo } from '@/types';

// Mapbox access token for directions API
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY || '';

// Islamabad coordinates for buses without routes
const ISB_BASE_COORDINATES = {
  lat: 33.6844,
  lng: 73.0479,
};

// A point along the route path
interface PathPoint {
  lat: number;
  lng: number;
  distanceFromStart: number; // cumulative distance from route start in meters
}

// Calculate distance between two coordinates in meters using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fetch road geometry between stops using Mapbox Directions API
async function fetchRouteGeometry(stops: RouteStopInfo[]): Promise<PathPoint[]> {
  if (stops.length < 2) return [];
  
  // Build coordinates string for Mapbox API (max 25 waypoints per request)
  const coordinates = stops
    .map(s => `${s.longitude},${s.latitude}`)
    .join(';');
  
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
      `geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes[0] && data.routes[0].geometry) {
      const coords = data.routes[0].geometry.coordinates;
      const pathPoints: PathPoint[] = [];
      let cumulativeDistance = 0;
      
      for (let i = 0; i < coords.length; i++) {
        const [lng, lat] = coords[i];
        
        if (i > 0) {
          const prevPoint = coords[i - 1];
          cumulativeDistance += calculateDistance(prevPoint[1], prevPoint[0], lat, lng);
        }
        
        pathPoints.push({
          lat,
          lng,
          distanceFromStart: cumulativeDistance,
        });
      }
      
      console.log(`[GPSSimulator] Fetched route with ${pathPoints.length} points, total distance: ${Math.round(cumulativeDistance)}m`);
      return pathPoints;
    }
  } catch (error) {
    console.error('[GPSSimulator] Failed to fetch route geometry:', error);
  }
  
  // Fallback: create simple path from stops
  console.log('[GPSSimulator] Using fallback linear path between stops');
  const pathPoints: PathPoint[] = [];
  let cumulativeDistance = 0;
  
  for (let i = 0; i < stops.length; i++) {
    if (i > 0) {
      cumulativeDistance += calculateDistance(
        stops[i-1].latitude, stops[i-1].longitude,
        stops[i].latitude, stops[i].longitude
      );
    }
    pathPoints.push({
      lat: stops[i].latitude,
      lng: stops[i].longitude,
      distanceFromStart: cumulativeDistance,
    });
  }
  
  return pathPoints;
}

interface BusSimulationState {
  busId: number;
  busName: string;
  routeName: string;
  isSimulating: boolean;
  distanceTraveled: number; // total meters traveled along the path
  totalRouteDistance: number; // total route distance in meters
  stops: RouteStopInfo[];
  pathPoints: PathPoint[]; // detailed road geometry
  currentPathIndex: number; // current index in pathPoints array
}

const GPSSimulatorPage = () => {
  const { toast } = useToast();
  
  // Simulation state - use ref to avoid stale closure issues
  const [busSimulations, setBusSimulations] = useState<Map<number, BusSimulationState>>(new Map());
  const simulationsRef = useRef<Map<number, BusSimulationState>>(new Map());
  const intervalsRef = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  
  // Global state
  const [globalSimulating, setGlobalSimulating] = useState(false);
  
  // Simulation parameters - speed in km/h, update every 1 second
  const [params, setParams] = useState({
    speedKmh: 40,
    updateIntervalMs: 1000, // Update every 1 second
  });
  const paramsRef = useRef(params);

  // Keep refs in sync with state
  useEffect(() => {
    simulationsRef.current = busSimulations;
  }, [busSimulations]);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // Query buses
  const { data: buses, isLoading, refetch: refetchBuses } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesApi.getBuses(),
    staleTime: 0, // Always fetch fresh data
  });

  // Also fetch routes to get stop details when needed
  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routesApi.getRoutes(),
    staleTime: 0,
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ busId, latitude, longitude, speed, heading }: {
      busId: number;
      latitude: number;
      longitude: number;
      speed: number;
      heading: number;
    }) => busesApi.updateLocation(busId, { latitude, longitude, speed, heading }),
    onError: (error) => {
      console.error('[GPSSimulator] Error updating location:', error);
    },
  });

  // Start trip mutation
  const startTripMutation = useMutation({
    mutationFn: (busId: number) => busesApi.startTrip(busId),
    onError: (error) => {
      console.error('[GPSSimulator] Error starting trip:', error);
    },
  });

  // End trip mutation
  const endTripMutation = useMutation({
    mutationFn: (busId: number) => busesApi.endTrip(busId),
    onError: (error) => {
      console.error('[GPSSimulator] Error ending trip:', error);
    },
  });

  // Calculate heading between two points in degrees
  const calculateHeading = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
  }, []);

  // Find position along the path based on distance traveled
  const getPositionOnPath = useCallback((
    pathPoints: PathPoint[],
    distanceTraveled: number
  ): { lat: number; lng: number; pathIndex: number } => {
    if (pathPoints.length === 0) {
      return { lat: ISB_BASE_COORDINATES.lat, lng: ISB_BASE_COORDINATES.lng, pathIndex: 0 };
    }
    
    const totalDistance = pathPoints[pathPoints.length - 1].distanceFromStart;
    
    // Clamp to valid range
    const effectiveDistance = Math.max(0, Math.min(distanceTraveled, totalDistance));
    
    // Find the two points we're between
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      
      if (effectiveDistance >= p1.distanceFromStart && effectiveDistance <= p2.distanceFromStart) {
        // Interpolate between these two points
        const segmentLength = p2.distanceFromStart - p1.distanceFromStart;
        const progress = segmentLength > 0 
          ? (effectiveDistance - p1.distanceFromStart) / segmentLength 
          : 0;
        
        return {
          lat: p1.lat + (p2.lat - p1.lat) * progress,
          lng: p1.lng + (p2.lng - p1.lng) * progress,
          pathIndex: i,
        };
      }
    }
    
    // Return last point if we've reached the end
    const lastPoint = pathPoints[pathPoints.length - 1];
    return { lat: lastPoint.lat, lng: lastPoint.lng, pathIndex: pathPoints.length - 1 };
  }, []);

  // Get current position based on simulation state
  const getCurrentPosition = useCallback((simState: BusSimulationState) => {
    const { pathPoints, distanceTraveled } = simState;
    
    if (!pathPoints || pathPoints.length < 2) {
      return {
        latitude: ISB_BASE_COORDINATES.lat,
        longitude: ISB_BASE_COORDINATES.lng,
        speed: 0,
        heading: 0,
      };
    }

    const position = getPositionOnPath(pathPoints, distanceTraveled);
    
    // Calculate heading based on direction of travel
    let heading = 0;
    const idx = position.pathIndex;
    if (idx < pathPoints.length - 1) {
      const p1 = pathPoints[idx];
      const p2 = pathPoints[idx + 1];
      heading = calculateHeading(p1.lat, p1.lng, p2.lat, p2.lng);
    }

    return {
      latitude: position.lat,
      longitude: position.lng,
      speed: paramsRef.current.speedKmh,
      heading: Math.round(heading),
    };
  }, [calculateHeading, getPositionOnPath]);

  // Helper to stop simulation and end trip
  const stopSimulationAndEndTrip = useCallback(async (busId: number, busName: string, showToast: boolean = true) => {
    // Clear interval
    const intervalId = intervalsRef.current.get(busId);
    if (intervalId) {
      clearInterval(intervalId);
      intervalsRef.current.delete(busId);
    }

    // Remove from state
    setBusSimulations(prev => {
      const newMap = new Map(prev);
      newMap.delete(busId);
      return newMap;
    });

    // Call end trip API
    try {
      await endTripMutation.mutateAsync(busId);
      console.log(`[GPSSimulator] Trip ended for bus ${busId}`);
    } catch (error) {
      console.error(`[GPSSimulator] Failed to end trip for bus ${busId}:`, error);
    }

    if (showToast) {
      toast({
        title: 'Trip Completed',
        description: `${busName} has reached the destination`,
      });
    }
  }, [endTripMutation, toast]);

  // Advance simulation - called every second
  const advanceAndUpdateBus = useCallback(async (busId: number) => {
    const currentSim = simulationsRef.current.get(busId);
    if (!currentSim || !currentSim.isSimulating) return;

    const { pathPoints, totalRouteDistance, busName } = currentSim;
    if (!pathPoints || pathPoints.length < 2 || totalRouteDistance <= 0) return;

    // Calculate distance traveled in this tick based on speed
    // speed is in km/h, interval is in ms
    // distance = speed * time = (km/h) * (ms / 3600000) * 1000m = speed * interval / 3600 meters
    const metersPerTick = (paramsRef.current.speedKmh * paramsRef.current.updateIntervalMs) / 3600;

    let { distanceTraveled } = currentSim;
    
    // Add distance traveled
    distanceTraveled += metersPerTick;

    // Check if we've reached the end of the route
    if (distanceTraveled >= totalRouteDistance) {
      // Set to exact end position
      distanceTraveled = totalRouteDistance;
      
      // Update state one last time with final position
      const finalState: BusSimulationState = {
        ...currentSim,
        distanceTraveled,
        isSimulating: false,
      };

      // Send final position (at the last stop)
      const finalPosition = getCurrentPosition(finalState);
      try {
        await updateLocationMutation.mutateAsync({
          busId,
          ...finalPosition,
        });
      } catch (error) {
        console.error(`Failed to send final position for bus ${busId}:`, error);
      }

      // Stop simulation and end trip
      await stopSimulationAndEndTrip(busId, busName);
      return;
    }

    // Update state
    const newSimState: BusSimulationState = {
      ...currentSim,
      distanceTraveled,
    };

    setBusSimulations(prev => {
      const newMap = new Map(prev);
      newMap.set(busId, newSimState);
      return newMap;
    });

    // Calculate and send position
    const position = getCurrentPosition(newSimState);
    
    try {
      await updateLocationMutation.mutateAsync({
        busId,
        ...position,
      });
    } catch (error) {
      console.error(`Failed to update bus ${busId}:`, error);
    }
  }, [getCurrentPosition, stopSimulationAndEndTrip, updateLocationMutation]);

  // Start simulation for a single bus
  const startBusSimulation = useCallback(async (bus: BusType) => {
    console.log('[GPSSimulator] Starting simulation for bus:', bus.id, bus.registration_number);
    
    // First, fetch the latest bus data to ensure we have the current route
    let freshBus = bus;
    try {
      freshBus = await busesApi.getBus(bus.id);
      console.log('[GPSSimulator] Fresh bus data:', freshBus);
    } catch (error) {
      console.error('Failed to fetch fresh bus data, using cached:', error);
    }

    // Check if bus has route with stops
    let stops: RouteStopInfo[] = [];
    let routeName = '';

    if (freshBus.route?.stops && freshBus.route.stops.length >= 2) {
      // Bus has route with stops embedded (from BusRoute type)
      stops = [...freshBus.route.stops].sort((a, b) => a.sequence - b.sequence);
      routeName = freshBus.route.name;
      console.log('[GPSSimulator] Using embedded route stops:', stops.length);
    } else if (freshBus.route_id && routes) {
      // Try to get stops from routes data
      const route = routes.find(r => r.id === freshBus.route_id);
      if (route?.route_stops && route.route_stops.length >= 2) {
        // Transform RouteStop[] to RouteStopInfo[]
        stops = route.route_stops
          .filter(rs => rs.stop) // Only include stops with stop data
          .sort((a, b) => a.sequence_number - b.sequence_number)
          .map(rs => ({
            sequence: rs.sequence_number,
            stop_id: rs.stop_id,
            stop_name: rs.stop?.name || 'Unknown',
            latitude: rs.stop?.latitude || 0,
            longitude: rs.stop?.longitude || 0,
            distance_from_prev_meters: rs.distance_from_prev || 0,
          }));
        routeName = route.name;
        console.log('[GPSSimulator] Using stops from routes query:', stops.length);
      }
    }

    if (stops.length < 2) {
      // No route - just set a static position in Islamabad
      console.log('[GPSSimulator] No route found, setting static position');
      const offsetLat = (Math.random() - 0.5) * 0.02;
      const offsetLng = (Math.random() - 0.5) * 0.02;
      
      try {
        await updateLocationMutation.mutateAsync({
          busId: freshBus.id,
          latitude: ISB_BASE_COORDINATES.lat + offsetLat,
          longitude: ISB_BASE_COORDINATES.lng + offsetLng,
          speed: 0,
          heading: 0,
        });
        toast({
          title: 'Static Position Set',
          description: `${freshBus.registration_number} placed in Islamabad (no route with stops)`,
        });
      } catch (error) {
        console.error('Failed to set static position:', error);
      }
      return;
    }

    // Fetch detailed road geometry from Mapbox Directions API
    console.log('[GPSSimulator] Fetching road geometry for', stops.length, 'stops...');
    let pathPoints: PathPoint[] = [];
    let totalRouteDistance = 0;
    
    try {
      pathPoints = await fetchRouteGeometry(stops);
      if (pathPoints.length > 0) {
        totalRouteDistance = pathPoints[pathPoints.length - 1].distanceFromStart;
      }
      console.log('[GPSSimulator] Got', pathPoints.length, 'path points, total distance:', totalRouteDistance, 'm');
    } catch (error) {
      console.error('[GPSSimulator] Failed to fetch route geometry, falling back to straight lines:', error);
      // Fallback: create path points from stops directly (straight lines between stops)
      let cumulativeDistance = 0;
      pathPoints = stops.map((stop, index) => {
        if (index > 0) {
          cumulativeDistance += calculateDistance(
            stops[index - 1].latitude, stops[index - 1].longitude,
            stop.latitude, stop.longitude
          );
        }
        return {
          lat: stop.latitude,
          lng: stop.longitude,
          distanceFromStart: cumulativeDistance,
        };
      });
      totalRouteDistance = cumulativeDistance;
    }

    if (pathPoints.length < 2) {
      console.error('[GPSSimulator] Not enough path points');
      return;
    }

    // Create simulation state - start at beginning of route
    const newState: BusSimulationState = {
      busId: freshBus.id,
      busName: freshBus.registration_number,
      routeName: routeName,
      isSimulating: true,
      currentPathIndex: 0, // Start at first path point
      distanceTraveled: 0, // Start at the beginning
      totalRouteDistance: totalRouteDistance,
      pathPoints: pathPoints,
      stops: stops,
    };

    // Call start trip API first
    try {
      await startTripMutation.mutateAsync(freshBus.id);
      console.log(`[GPSSimulator] Trip started for bus ${freshBus.id}`);
    } catch (error) {
      console.error(`[GPSSimulator] Failed to start trip for bus ${freshBus.id}:`, error);
      toast({
        title: 'Failed to Start Trip',
        description: `Could not start trip for ${freshBus.registration_number}. The bus may already be on a trip.`,
        variant: 'destructive',
      });
      return;
    }

    // Update state
    setBusSimulations(prev => {
      const newMap = new Map(prev);
      newMap.set(freshBus.id, newState);
      return newMap;
    });

    // Clear any existing interval
    const existingInterval = intervalsRef.current.get(freshBus.id);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Start new interval - update every second
    const intervalId = setInterval(() => {
      advanceAndUpdateBus(freshBus.id);
    }, params.updateIntervalMs);

    intervalsRef.current.set(freshBus.id, intervalId);

    // Send initial position (at first stop)
    const position = getCurrentPosition(newState);
    try {
      await updateLocationMutation.mutateAsync({
        busId: freshBus.id,
        ...position,
      });
    } catch (error) {
      console.error('Failed to send initial position:', error);
    }

    toast({
      title: 'Trip Started',
      description: `${freshBus.registration_number} starting from ${stops[0].stop_name} (${stops.length} stops)`,
    });
  }, [advanceAndUpdateBus, getCurrentPosition, params.updateIntervalMs, routes, startTripMutation, toast, updateLocationMutation]);

  // Stop simulation for a single bus (manual stop)
  const stopBusSimulation = useCallback(async (busId: number, busName: string) => {
    // Clear interval
    const intervalId = intervalsRef.current.get(busId);
    if (intervalId) {
      clearInterval(intervalId);
      intervalsRef.current.delete(busId);
    }

    // Remove from state
    setBusSimulations(prev => {
      const newMap = new Map(prev);
      newMap.delete(busId);
      return newMap;
    });

    // Call end trip API
    try {
      await endTripMutation.mutateAsync(busId);
      console.log(`[GPSSimulator] Trip ended for bus ${busId}`);
    } catch (error) {
      console.error(`[GPSSimulator] Failed to end trip for bus ${busId}:`, error);
    }

    toast({
      title: 'Trip Stopped',
      description: `${busName} trip has been stopped`,
    });
  }, [endTripMutation, toast]);

  // Refresh buses manually
  const handleRefresh = useCallback(async () => {
    console.log('[GPSSimulator] Refreshing buses...');
    await refetchBuses();
    toast({
      title: 'Refreshed',
      description: 'Bus data has been refreshed',
    });
  }, [refetchBuses, toast]);

  // Start all buses simulation
  const startAllSimulation = useCallback(async () => {
    if (!buses || buses.length === 0) {
      toast({
        title: 'No Buses',
        description: 'Add some buses first to simulate.',
        variant: 'destructive',
      });
      return;
    }

    // Get buses that can be simulated (active or inactive, not maintenance)
    const simulatable = buses.filter(b => b.status === 'active' || b.status === 'inactive');
    if (simulatable.length === 0) {
      toast({
        title: 'No Simulatable Buses',
        description: 'Add buses with active or inactive status to simulate.',
        variant: 'destructive',
      });
      return;
    }

    setGlobalSimulating(true);
    
    // Start simulations sequentially
    for (const bus of simulatable) {
      if (!busSimulations.has(bus.id)) {
        await startBusSimulation(bus);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    toast({
      title: 'All Simulations Started',
      description: `Started simulation for ${simulatable.length} buses`,
    });
  }, [buses, busSimulations, startBusSimulation, toast]);

  // Stop all buses simulation
  const stopAllSimulation = useCallback(() => {
    // Clear all intervals
    intervalsRef.current.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    intervalsRef.current.clear();

    // Clear state
    setBusSimulations(new Map());
    setGlobalSimulating(false);

    toast({
      title: 'All Simulations Stopped',
      description: 'All bus simulations have been stopped',
    });
  }, [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
    };
  }, []);

  // Helper to check if bus has route with stops
  const busHasRoute = useCallback((bus: BusType): boolean => {
    // Check embedded route (BusRoute type has 'stops')
    if (bus.route?.stops && bus.route.stops.length >= 2) {
      return true;
    }
    // Check routes data (Route type has 'route_stops')
    if (bus.route_id && routes) {
      const route = routes.find(r => r.id === bus.route_id);
      if (route?.route_stops && route.route_stops.length >= 2) {
        // Check if stops have location data
        const validStops = route.route_stops.filter(rs => rs.stop);
        return validStops.length >= 2;
      }
    }
    return false;
  }, [routes]);

  // Get route info for display
  const getBusRouteInfo = useCallback((bus: BusType): { name: string; stopCount: number } | null => {
    // Check embedded route (BusRoute type)
    if (bus.route?.stops && bus.route.stops.length >= 2) {
      return { name: bus.route.name, stopCount: bus.route.stops.length };
    }
    // Check routes data (Route type)
    if (bus.route_id && routes) {
      const route = routes.find(r => r.id === bus.route_id);
      if (route?.route_stops && route.route_stops.length >= 2) {
        const validStops = route.route_stops.filter(rs => rs.stop);
        return { name: route.name, stopCount: validStops.length };
      }
      if (route) {
        return { name: route.name, stopCount: route.route_stops?.length || 0 };
      }
    }
    return null;
  }, [routes]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-amber-500" />
            GPS Simulator
          </h1>
          <p className="text-muted-foreground mt-1">Loading buses...</p>
        </div>
        <Card className="animate-pulse">
          <CardContent className="py-12">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show active and inactive buses (not maintenance)
  const simulatableBuses = buses?.filter(b => b.status === 'active' || b.status === 'inactive') || [];
  const busesWithRoute = simulatableBuses.filter(b => busHasRoute(b));
  const busesWithoutRoute = simulatableBuses.filter(b => !busHasRoute(b));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-amber-500" />
            GPS Simulator
          </h1>
          <p className="text-muted-foreground mt-1">
            Simulate GPS location updates. Buses follow their routes from start to end.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Buses
        </Button>
      </div>

      {/* Global Controls */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5 text-amber-600" />
            Global Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Speed (km/h)</Label>
              <Input
                type="number"
                value={params.speedKmh}
                onChange={(e) => setParams(p => ({ ...p, speedKmh: Number(e.target.value) }))}
                className="h-9"
                min={1}
                max={120}
              />
            </div>
            <div>
              <Label className="text-xs">Update Interval (ms)</Label>
              <Input
                type="number"
                value={params.updateIntervalMs}
                onChange={(e) => setParams(p => ({ ...p, updateIntervalMs: Number(e.target.value) }))}
                className="h-9"
                min={100}
                step={100}
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm">
                <span className="font-bold text-lg">{simulatableBuses.length}</span>
                <span className="text-muted-foreground ml-1">simulatable buses</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              {globalSimulating ? (
                <Button 
                  variant="destructive" 
                  onClick={stopAllSimulation}
                  className="gap-2 flex-1"
                >
                  <Square className="h-4 w-4" />
                  Stop All
                </Button>
              ) : (
                <Button 
                  onClick={startAllSimulation}
                  disabled={simulatableBuses.length === 0}
                  className="gap-2 flex-1 bg-amber-500 hover:bg-amber-600"
                >
                  <Play className="h-4 w-4" />
                  Start All
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center p-3 bg-white rounded-lg border">
              <Route className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <p className="text-xs text-muted-foreground">With Route</p>
              <p className="text-lg font-bold text-green-600">{busesWithRoute.length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-xs text-muted-foreground">No Route</p>
              <p className="text-lg font-bold text-orange-500">{busesWithoutRoute.length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <Gauge className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-xs text-muted-foreground">Simulating</p>
              <p className="text-lg font-bold text-blue-600">{busSimulations.size}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buses with Routes */}
      {busesWithRoute.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Route className="h-5 w-5 text-green-600" />
            Buses with Routes
            <span className="text-sm font-normal text-muted-foreground">
              (will follow route from start to end)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {busesWithRoute.map(bus => {
              const simState = busSimulations.get(bus.id);
              const isSimulating = simState?.isSimulating || false;
              const routeInfo = getBusRouteInfo(bus);

              return (
                <Card key={bus.id} className={cn(
                  "transition-all",
                  isSimulating && "border-green-300 bg-green-50/30"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bus className="h-5 w-5 text-teal-600" />
                        <CardTitle className="text-base">{bus.registration_number}</CardTitle>
                      </div>
                      {isSimulating && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                          LIVE
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{routeInfo?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{routeInfo?.stopCount || 0} stops</span>
                      </div>
                      {isSimulating && simState && (
                        <>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {simState.stops.length} stops • Simulating
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Navigation className="h-3 w-3" />
                            <span>
                              {Math.round(simState.distanceTraveled)}m / {Math.round(simState.totalRouteDistance)}m ({Math.round(simState.distanceTraveled / simState.totalRouteDistance * 100)}%)
                            </span>
                          </div>
                        </>
                      )}
                      {bus.last_location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Gauge className="h-3 w-3" />
                          <span>Last: {bus.last_location.speed} km/h</span>
                        </div>
                      )}
                    </div>

                    {isSimulating ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => stopBusSimulation(bus.id, bus.registration_number)}
                      >
                        <Square className="h-4 w-4" />
                        Stop
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => startBusSimulation(bus)}
                      >
                        <Play className="h-4 w-4" />
                        Start Simulation
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Buses without Routes */}
      {busesWithoutRoute.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Buses without Routes
            <span className="text-sm font-normal text-muted-foreground">
              (assign a route with stops first)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {busesWithoutRoute.map(bus => {
              const routeInfo = getBusRouteInfo(bus);
              return (
                <Card key={bus.id} className="border-orange-200 bg-orange-50/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Bus className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-base">{bus.registration_number}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-orange-600 bg-orange-100 p-2 rounded">
                      {routeInfo ? (
                        <>Route "{routeInfo.name}" has no stops. Add stops to the route first.</>
                      ) : (
                        <>No route assigned. Assign a route with stops in the Buses page.</>
                      )}
                    </div>
                    {bus.last_location && (
                      <div className="text-xs text-muted-foreground">
                        Last seen: {new Date(bus.last_location.timestamp).toLocaleString()}
                      </div>
                    )}
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => startBusSimulation(bus)}
                    >
                      <MapPin className="h-4 w-4" />
                      Set Static Position
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {simulatableBuses.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Bus className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Simulatable Buses</p>
              <p className="text-sm mt-2">
                Add buses with "active" or "inactive" status to simulate GPS. Buses in "maintenance" cannot be simulated.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GPSSimulatorPage;
