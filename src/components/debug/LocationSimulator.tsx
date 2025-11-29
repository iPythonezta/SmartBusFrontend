import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { busesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Play, RefreshCw, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Bus } from '@/types';

// Lahore coordinates for simulation (NUST area)
const BASE_COORDINATES = {
  lat: 31.4697,
  lng: 74.4121,
};

interface SimulatedLocation {
  busId: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
}

const LocationSimulator: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  
  // Customizable simulation parameters
  const [params, setParams] = useState({
    speedMin: 20,
    speedMax: 60,
    updateIntervalMs: 3000,
  });

  const { data: buses, isLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesApi.getBuses(),
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ busId, latitude, longitude, speed, heading }: SimulatedLocation) =>
      busesApi.updateLocation(busId, { latitude, longitude, speed, heading }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
    onError: (error) => {
      console.error('[LocationSimulator] Error updating location:', error);
    },
  });

  const generateRandomLocation = (busIndex: number): Omit<SimulatedLocation, 'busId'> => {
    // Spread buses in a grid pattern around base coordinates
    const offsetLat = (Math.random() - 0.5) * 0.02 + (busIndex % 3) * 0.005;
    const offsetLng = (Math.random() - 0.5) * 0.02 + Math.floor(busIndex / 3) * 0.005;
    
    return {
      latitude: BASE_COORDINATES.lat + offsetLat,
      longitude: BASE_COORDINATES.lng + offsetLng,
      speed: Math.floor(Math.random() * (params.speedMax - params.speedMin) + params.speedMin),
      heading: Math.floor(Math.random() * 360),
    };
  };

  const simulateSingleBus = async (bus: Bus) => {
    const location = generateRandomLocation(bus.id);
    console.log(`[LocationSimulator] Updating bus ${bus.id} (${bus.registration_number}):`, location);
    
    try {
      await updateLocationMutation.mutateAsync({
        busId: bus.id,
        ...location,
      });
      return { success: true, busId: bus.id };
    } catch (error) {
      return { success: false, busId: bus.id, error };
    }
  };

  const simulateAllBuses = async () => {
    if (!buses || buses.length === 0) {
      toast({
        title: 'No buses found',
        description: 'Add some buses first to simulate locations.',
        variant: 'destructive',
      });
      return;
    }

    const activeBuses = buses.filter(b => b.status === 'active');
    if (activeBuses.length === 0) {
      toast({
        title: 'No active buses',
        description: 'Mark at least one bus as active to simulate locations.',
        variant: 'destructive',
      });
      return;
    }

    console.log(`[LocationSimulator] Simulating locations for ${activeBuses.length} active buses...`);
    
    const results = await Promise.all(activeBuses.map(simulateSingleBus));
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    toast({
      title: 'Location Update Complete',
      description: `Updated ${successCount} buses${failCount > 0 ? `, ${failCount} failed` : ''}`,
      variant: failCount > 0 ? 'destructive' : 'default',
    });
  };

  const startContinuousSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }

    setIsSimulating(true);
    simulateAllBuses(); // Run immediately

    const interval = setInterval(() => {
      simulateAllBuses();
    }, params.updateIntervalMs);

    setSimulationInterval(interval);

    toast({
      title: 'Simulation Started',
      description: `Updating locations every ${params.updateIntervalMs / 1000} seconds`,
    });
  };

  const stopSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    setIsSimulating(false);

    toast({
      title: 'Simulation Stopped',
      description: 'Location updates paused',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading buses...</div>
        </CardContent>
      </Card>
    );
  }

  const activeBusCount = buses?.filter(b => b.status === 'active').length || 0;

  return (
    <Card className="border-dashed border-amber-300 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          GPS Location Simulator
          <span className="text-xs font-normal text-muted-foreground">(Debug Tool)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Simulate GPS location updates for active buses. This is for testing purposes only.
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Min Speed (km/h)</Label>
            <Input
              type="number"
              value={params.speedMin}
              onChange={(e) => setParams(p => ({ ...p, speedMin: Number(e.target.value) }))}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Max Speed (km/h)</Label>
            <Input
              type="number"
              value={params.speedMax}
              onChange={(e) => setParams(p => ({ ...p, speedMax: Number(e.target.value) }))}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Interval (ms)</Label>
            <Input
              type="number"
              value={params.updateIntervalMs}
              onChange={(e) => setParams(p => ({ ...p, updateIntervalMs: Number(e.target.value) }))}
              className="h-8"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm">
            <span className="font-medium">{activeBusCount}</span> active buses will be updated
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={simulateAllBuses}
              disabled={isSimulating || activeBusCount === 0}
              className="gap-1"
            >
              <MapPin className="h-4 w-4" />
              Update Once
            </Button>

            {isSimulating ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopSimulation}
                className="gap-1"
              >
                <RefreshCw className="h-4 w-4 animate-spin" />
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={startContinuousSimulation}
                disabled={activeBusCount === 0}
                className="gap-1 bg-amber-500 hover:bg-amber-600"
              >
                <Play className="h-4 w-4" />
                Start Continuous
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationSimulator;
