import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { busesApi } from '@/services/api';
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

// Islamabad coordinates for buses without routes
const ISB_BASE_COORDINATES = {
  lat: 33.6844,
  lng: 73.0479,
};

interface BusSimulationState {
  busId: number;
  isSimulating: boolean;
  currentStopIndex: number;
  progress: number; // 0-1 progress between stops
  direction: 'forward' | 'backward';
  intervalId: ReturnType<typeof setInterval> | null;
}

const GPSSimulatorPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Global simulation state
  const [globalSimulating, setGlobalSimulating] = useState(false);
  const [busSimulations, setBusSimulations] = useState<Map<number, BusSimulationState>>(new Map());
  const globalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Simulation parameters
  const [params, setParams] = useState({
    speedKmh: 40,
    updateIntervalMs: 2000,
  });

  const { data: buses, isLoading, refetch } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesApi.getBuses(),
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ busId, latitude, longitude, speed, heading }: {
      busId: number;
      latitude: number;
      longitude: number;
      speed: number;
      heading: number;
    }) => busesApi.updateLocation(busId, { latitude, longitude, speed, heading }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
    onError: (error) => {
      console.error('[GPSSimulator] Error updating location:', error);
    },
  });

  // Calculate heading between two points
  const calculateHeading = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
  };

  // Interpolate position between two stops
  const interpolatePosition = (
    stop1: RouteStopInfo,
    stop2: RouteStopInfo,
    progress: number
  ): { lat: number; lng: number } => {
    return {
      lat: stop1.latitude + (stop2.latitude - stop1.latitude) * progress,
      lng: stop1.longitude + (stop2.longitude - stop1.longitude) * progress,
    };
  };

  // Get current position for a bus based on its simulation state
  const getCurrentPosition = useCallback((bus: BusType, simState: BusSimulationState) => {
    const stops = bus.route?.stops;
    
    if (!stops || stops.length < 2) {
      // No route - return random Islamabad position (stationary)
      const offsetLat = (Math.random() - 0.5) * 0.02;
      const offsetLng = (Math.random() - 0.5) * 0.02;
      return {
        latitude: ISB_BASE_COORDINATES.lat + offsetLat,
        longitude: ISB_BASE_COORDINATES.lng + offsetLng,
        speed: 0,
        heading: 0,
      };
    }

    const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
    let currentIndex = simState.currentStopIndex;
    let nextIndex: number;

    if (simState.direction === 'forward') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= sortedStops.length) {
        nextIndex = currentIndex - 1;
      }
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = currentIndex + 1;
      }
    }

    const currentStop = sortedStops[currentIndex];
    const nextStop = sortedStops[nextIndex];

    const position = interpolatePosition(currentStop, nextStop, simState.progress);
    const heading = calculateHeading(
      currentStop.latitude, currentStop.longitude,
      nextStop.latitude, nextStop.longitude
    );

    return {
      latitude: position.lat,
      longitude: position.lng,
      speed: params.speedKmh,
      heading: Math.round(heading),
    };
  }, [params.speedKmh]);

  // Update simulation state for a bus
  const advanceSimulation = useCallback((busId: number, bus: BusType) => {
    setBusSimulations(prev => {
      const current = prev.get(busId);
      if (!current || !current.isSimulating) return prev;

      const stops = bus.route?.stops;
      if (!stops || stops.length < 2) return prev;

      const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
      let { currentStopIndex, progress, direction } = current;

      // Advance progress
      progress += 0.1; // 10% progress per tick

      if (progress >= 1) {
        progress = 0;
        
        if (direction === 'forward') {
          currentStopIndex++;
          if (currentStopIndex >= sortedStops.length - 1) {
            direction = 'backward';
            currentStopIndex = sortedStops.length - 1;
          }
        } else {
          currentStopIndex--;
          if (currentStopIndex <= 0) {
            direction = 'forward';
            currentStopIndex = 0;
          }
        }
      }

      const newMap = new Map(prev);
      newMap.set(busId, { ...current, currentStopIndex, progress, direction });
      return newMap;
    });
  }, []);

  // Start simulation for a single bus
  const startBusSimulation = useCallback(async (bus: BusType) => {
    const hasRoute = bus.route?.stops && bus.route.stops.length >= 2;
    
    if (!hasRoute) {
      // No route - just set a static position in Islamabad
      const offsetLat = (Math.random() - 0.5) * 0.02;
      const offsetLng = (Math.random() - 0.5) * 0.02;
      
      try {
        await updateLocationMutation.mutateAsync({
          busId: bus.id,
          latitude: ISB_BASE_COORDINATES.lat + offsetLat,
          longitude: ISB_BASE_COORDINATES.lng + offsetLng,
          speed: 0,
          heading: 0,
        });
        toast({
          title: 'Static Position Set',
          description: `${bus.registration_number} placed in Islamabad (no route - stationary)`,
        });
      } catch (error) {
        console.error('Failed to set static position:', error);
      }
      return;
    }

    // Has route - start continuous simulation
    const newState: BusSimulationState = {
      busId: bus.id,
      isSimulating: true,
      currentStopIndex: 0,
      progress: 0,
      direction: 'forward',
      intervalId: null,
    };

    const intervalId = setInterval(async () => {
      advanceSimulation(bus.id, bus);
      
      const simState = busSimulations.get(bus.id) || newState;
      const position = getCurrentPosition(bus, simState);
      
      try {
        await updateLocationMutation.mutateAsync({
          busId: bus.id,
          ...position,
        });
      } catch (error) {
        console.error(`Failed to update bus ${bus.id}:`, error);
      }
    }, params.updateIntervalMs);

    newState.intervalId = intervalId;
    setBusSimulations(prev => {
      const newMap = new Map(prev);
      newMap.set(bus.id, newState);
      return newMap;
    });

    toast({
      title: 'Simulation Started',
      description: `${bus.registration_number} is now following its route`,
    });
  }, [advanceSimulation, getCurrentPosition, params.updateIntervalMs, toast, updateLocationMutation, busSimulations]);

  // Stop simulation for a single bus
  const stopBusSimulation = useCallback((busId: number, busName: string) => {
    setBusSimulations(prev => {
      const current = prev.get(busId);
      if (current?.intervalId) {
        clearInterval(current.intervalId);
      }
      const newMap = new Map(prev);
      newMap.delete(busId);
      return newMap;
    });

    toast({
      title: 'Simulation Stopped',
      description: `${busName} simulation stopped`,
    });
  }, [toast]);

  // Start all buses simulation
  const startAllSimulation = useCallback(() => {
    if (!buses || buses.length === 0) {
      toast({
        title: 'No Buses',
        description: 'Add some buses first to simulate.',
        variant: 'destructive',
      });
      return;
    }

    const activeBuses = buses.filter(b => b.status === 'active');
    if (activeBuses.length === 0) {
      toast({
        title: 'No Active Buses',
        description: 'Mark at least one bus as active to simulate.',
        variant: 'destructive',
      });
      return;
    }

    setGlobalSimulating(true);
    activeBuses.forEach(bus => {
      if (!busSimulations.has(bus.id)) {
        startBusSimulation(bus);
      }
    });

    toast({
      title: 'All Simulations Started',
      description: `Started simulation for ${activeBuses.length} active buses`,
    });
  }, [buses, busSimulations, startBusSimulation, toast]);

  // Stop all buses simulation
  const stopAllSimulation = useCallback(() => {
    busSimulations.forEach((sim) => {
      if (sim.intervalId) {
        clearInterval(sim.intervalId);
      }
    });
    setBusSimulations(new Map());
    setGlobalSimulating(false);

    if (globalIntervalRef.current) {
      clearInterval(globalIntervalRef.current);
      globalIntervalRef.current = null;
    }

    toast({
      title: 'All Simulations Stopped',
      description: 'All bus simulations have been stopped',
    });
  }, [busSimulations, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      busSimulations.forEach((sim) => {
        if (sim.intervalId) {
          clearInterval(sim.intervalId);
        }
      });
      if (globalIntervalRef.current) {
        clearInterval(globalIntervalRef.current);
      }
    };
  }, []);

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

  const activeBuses = buses?.filter(b => b.status === 'active') || [];
  const busesWithRoute = activeBuses.filter(b => b.route?.stops && b.route.stops.length >= 2);
  const busesWithoutRoute = activeBuses.filter(b => !b.route?.stops || b.route.stops.length < 2);

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
            Simulate GPS location updates for testing. Buses with routes will follow their stops.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
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
                min={500}
                step={500}
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm">
                <span className="font-bold text-lg">{activeBuses.length}</span>
                <span className="text-muted-foreground ml-1">active buses</span>
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
                  disabled={activeBuses.length === 0}
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
              <p className="text-xs text-muted-foreground">No Route (Static)</p>
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
              (will follow route stops)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {busesWithRoute.map(bus => {
              const simState = busSimulations.get(bus.id);
              const isSimulating = simState?.isSimulating || false;
              const stopCount = bus.route?.stops?.length || 0;

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
                        <span className="font-medium">{bus.route?.name}</span>
                        <span className="text-muted-foreground">({bus.route?.code})</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{stopCount} stops</span>
                      </div>
                      {isSimulating && simState && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            Stop {simState.currentStopIndex + 1}/{stopCount} • 
                            {simState.direction === 'forward' ? ' →' : ' ←'}
                          </span>
                        </div>
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
              (static position only - will be placed in Islamabad)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {busesWithoutRoute.map(bus => (
              <Card key={bus.id} className="border-orange-200 bg-orange-50/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-base">{bus.registration_number}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-orange-600 bg-orange-100 p-2 rounded">
                    No route assigned. Bus will be placed at a random location in Islamabad and remain stationary.
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
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeBuses.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Bus className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Active Buses</p>
              <p className="text-sm mt-2">
                Mark buses as "active" in the Buses page to simulate their GPS.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GPSSimulatorPage;
