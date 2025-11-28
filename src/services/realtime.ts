import type { BusLocation } from '@/types';
import { routingService } from './routing';

type LocationUpdateCallback = (busId: string, location: BusLocation) => void;

interface SimulatedBus {
  currentLat: number;
  currentLng: number;
  targetLat: number;
  targetLng: number;
  speed: number;
  heading: number;
  routeIndex: number;
  roadCoordinates: [number, number][]; // Actual road coordinates from OSRM
  isInitialized: boolean;
}

class RealtimeService {
  private callbacks: Map<string, LocationUpdateCallback[]> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private simulatedBuses: Map<string, SimulatedBus> = new Map();

  private demoRoutes: { [key: string]: [number, number][] } = {
    '1': [
      // Blue Line: Blue Area to Faizabad via major roads
      [33.7077, 73.0469], // Blue Area
      [33.7150, 73.0550], // Aabpara Market
      [33.7184, 73.0630], // Aabpara Chowk
      [33.7120, 73.0680], // Committee Chowk
      [33.7000, 73.0720], // Karachi Company
      [33.6938, 73.0635], // Zero Point
      [33.6800, 73.0650], // Faiz Ahmed Faiz Road
      [33.6700, 73.0700], // Kashmir Highway
      [33.6600, 73.0720], // Tramri Chowk
      [33.6507, 73.0681], // Faizabad
    ],
    '2': [
      // Green Line: Secretariat to Melody via Constitution Avenue
      [33.7295, 73.0931], // Secretariat
      [33.7280, 73.0900], // Supreme Court
      [33.7250, 73.0850], // Constitution Avenue
      [33.7220, 73.0800], // Parliament House
      [33.7200, 73.0750], // President House
      [33.7184, 73.0630], // Aabpara
      [33.7150, 73.0600], // Kohsar Market
      [33.7100, 73.0580], // Margalla Road
      [33.7050, 73.0550], // Club Road
      [33.7000, 73.0530], // Ataturk Avenue
      [33.6973, 73.0515], // Melody Food Street
    ],
    '3': [
      // Red Line: Blue Area circular route
      [33.7077, 73.0469], // Blue Area Start
      [33.7100, 73.0500], // Jinnah Avenue
      [33.7150, 73.0550], // Stock Exchange
      [33.7184, 73.0630], // Aabpara
      [33.7200, 73.0700], // G-6 Markaz
      [33.7180, 73.0750], // Melody
      [33.7150, 73.0750], // F-7 Markaz  
      [33.7120, 73.0720], // F-8 Markaz
      [33.7100, 73.0680], // Committee Chowk
      [33.7077, 73.0469], // Back to Blue Area
    ],
  };

  subscribe(busId: string, callback: LocationUpdateCallback): () => void {
    if (!this.callbacks.has(busId)) {
      this.callbacks.set(busId, []);
    }
    this.callbacks.get(busId)!.push(callback);

    if (!this.intervals.has(busId)) {
      // Start simulation asynchronously
      this.startSimulation(busId).catch(error => {
        console.error(`Failed to start simulation for bus ${busId}:`, error);
      });
    }

    return () => {
      const callbacks = this.callbacks.get(busId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.stopSimulation(busId);
        }
      }
    };
  }

  private async startSimulation(busId: string): Promise<void> {
    const routePoints = this.demoRoutes[busId] || this.demoRoutes['1'];
    const startPoint = routePoints[0];

    // Initialize with basic data first
    this.simulatedBuses.set(busId, {
      currentLat: startPoint[0],
      currentLng: startPoint[1],
      targetLat: startPoint[0],
      targetLng: startPoint[1],
      speed: 35 + Math.random() * 15,
      heading: 0,
      routeIndex: 0,
      roadCoordinates: [startPoint], // Start with just the first point
      isInitialized: false,
    });

    // Fetch actual road coordinates asynchronously
    try {
      const roadCoordinates = await routingService.getRoute(routePoints);
      const bus = this.simulatedBuses.get(busId);
      
      if (bus && roadCoordinates.length > 1) {
        // Update with real road coordinates
        bus.roadCoordinates = roadCoordinates;
        bus.currentLat = roadCoordinates[0][0];
        bus.currentLng = roadCoordinates[0][1];
        bus.targetLat = roadCoordinates[1][0];
        bus.targetLng = roadCoordinates[1][1];
        bus.routeIndex = 1;
        bus.isInitialized = true;
        
        console.log(`🚌 Bus ${busId}: Following ${roadCoordinates.length} road points instead of ${routePoints.length} waypoints`);
      }
    } catch (error) {
      console.error(`Failed to fetch road route for bus ${busId}:`, error);
      // Fallback to original waypoints
      const bus = this.simulatedBuses.get(busId);
      if (bus) {
        bus.roadCoordinates = routePoints;
        bus.targetLat = routePoints[1][0];
        bus.targetLng = routePoints[1][1];
        bus.routeIndex = 1;
        bus.isInitialized = true;
      }
    }

    const interval = setInterval(() => {
      this.updateBusPosition(busId);
    }, 2000);

    this.intervals.set(busId, interval);
    this.updateBusPosition(busId);
  }

  private stopSimulation(busId: string): void {
    const interval = this.intervals.get(busId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(busId);
    }
    this.simulatedBuses.delete(busId);
  }

  private updateBusPosition(busId: string): void {
    const bus = this.simulatedBuses.get(busId);
    if (!bus || !bus.isInitialized) return;

    const callbacks = this.callbacks.get(busId);
    if (!callbacks || callbacks.length === 0) return;

    const latDiff = bus.targetLat - bus.currentLat;
    const lngDiff = bus.targetLng - bus.currentLng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // Smaller step size for smoother movement along roads
    const stepSize = 0.0003; // Reduced for more precise road following

    if (distance < stepSize) {
      // Reached current target, move to next road coordinate
      bus.currentLat = bus.targetLat;
      bus.currentLng = bus.targetLng;
      
      // Move to next point in road coordinates
      bus.routeIndex = (bus.routeIndex + 1) % bus.roadCoordinates.length;
      const nextPoint = bus.roadCoordinates[bus.routeIndex];
      bus.targetLat = nextPoint[0];
      bus.targetLng = nextPoint[1];
      
      // Recalculate direction to new target
      const newLatDiff = bus.targetLat - bus.currentLat;
      const newLngDiff = bus.targetLng - bus.currentLng;
      bus.heading = (Math.atan2(newLngDiff, newLatDiff) * (180 / Math.PI) + 360) % 360;
    } else {
      // Move towards current target along the road
      const ratio = stepSize / distance;
      bus.currentLat += latDiff * ratio;
      bus.currentLng += lngDiff * ratio;
      
      // Update heading based on movement direction
      bus.heading = (Math.atan2(lngDiff, latDiff) * (180 / Math.PI) + 360) % 360;
    }

    // Realistic speed variation (buses slow down/speed up realistically)
    const speedVariation = Math.sin(Date.now() / 10000) * 8;
    bus.speed = Math.max(15, Math.min(60, 40 + speedVariation + (Math.random() - 0.5) * 5));

    const location: BusLocation = {
      id: `loc-${busId}-${Date.now()}`,
      bus_id: busId,
      latitude: bus.currentLat,
      longitude: bus.currentLng,
      speed: Math.round(bus.speed * 10) / 10,
      heading: Math.round(bus.heading),
      timestamp: new Date().toISOString(),
    };

    callbacks.forEach(callback => {
      try {
        callback(busId, location);
      } catch (error) {
        console.error('Error in location callback:', error);
      }
    });
  }

  unsubscribeAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.callbacks.clear();
    this.simulatedBuses.clear();
  }

  isTracking(busId: string): boolean {
    return this.intervals.has(busId);
  }

  getCurrentPosition(busId: string): BusLocation | null {
    const bus = this.simulatedBuses.get(busId);
    if (!bus || !bus.isInitialized) return null;

    return {
      id: `loc-${busId}-current`,
      bus_id: busId,
      latitude: bus.currentLat,
      longitude: bus.currentLng,
      speed: Math.round(bus.speed * 10) / 10,
      heading: Math.round(bus.heading),
      timestamp: new Date().toISOString(),
    };
  }
}

export const realtimeService = new RealtimeService();
