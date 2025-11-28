import type { BusLocation } from '@/types';

type LocationUpdateCallback = (busId: string, location: BusLocation) => void;

interface SimulatedBus {
  currentLat: number;
  currentLng: number;
  targetLat: number;
  targetLng: number;
  speed: number;
  heading: number;
  routeIndex: number;
  routePoints: [number, number][];
}

class RealtimeService {
  private callbacks: Map<string, LocationUpdateCallback[]> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private simulatedBuses: Map<string, SimulatedBus> = new Map();

  private demoRoutes: { [key: string]: [number, number][] } = {
    '1': [
      [33.7077, 73.0469],
      [33.7150, 73.0550],
      [33.7184, 73.0630],
      [33.7100, 73.0700],
      [33.6938, 73.0635],
      [33.6700, 73.0700],
      [33.6507, 73.0681],
    ],
    '2': [
      [33.7295, 73.0931],
      [33.7250, 73.0850],
      [33.7200, 73.0750],
      [33.7184, 73.0630],
      [33.7100, 73.0580],
      [33.7000, 73.0530],
      [33.6973, 73.0515],
    ],
    '3': [
      [33.7077, 73.0469],
      [33.7100, 73.0500],
      [33.7150, 73.0550],
      [33.7184, 73.0630],
      [33.7200, 73.0700],
      [33.7150, 73.0750],
      [33.7100, 73.0700],
    ],
  };

  subscribe(busId: string, callback: LocationUpdateCallback): () => void {
    if (!this.callbacks.has(busId)) {
      this.callbacks.set(busId, []);
    }
    this.callbacks.get(busId)!.push(callback);

    if (!this.intervals.has(busId)) {
      this.startSimulation(busId);
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

  private startSimulation(busId: string): void {
    const routePoints = this.demoRoutes[busId] || this.demoRoutes['1'];
    const startPoint = routePoints[0];

    this.simulatedBuses.set(busId, {
      currentLat: startPoint[0],
      currentLng: startPoint[1],
      targetLat: routePoints[1][0],
      targetLng: routePoints[1][1],
      speed: 35 + Math.random() * 15,
      heading: 0,
      routeIndex: 1,
      routePoints,
    });

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
    if (!bus) return;

    const callbacks = this.callbacks.get(busId);
    if (!callbacks || callbacks.length === 0) return;

    const latDiff = bus.targetLat - bus.currentLat;
    const lngDiff = bus.targetLng - bus.currentLng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    const stepSize = 0.0008;

    if (distance < stepSize) {
      bus.currentLat = bus.targetLat;
      bus.currentLng = bus.targetLng;
      bus.routeIndex = (bus.routeIndex + 1) % bus.routePoints.length;
      const nextPoint = bus.routePoints[bus.routeIndex];
      bus.targetLat = nextPoint[0];
      bus.targetLng = nextPoint[1];
    } else {
      const ratio = stepSize / distance;
      bus.currentLat += latDiff * ratio;
      bus.currentLng += lngDiff * ratio;
    }

    bus.heading = (Math.atan2(lngDiff, latDiff) * (180 / Math.PI) + 360) % 360;
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
    if (!bus) return null;

    return {
      id: `loc-${busId}-current`,
      bus_id: busId,
      latitude: bus.currentLat,
      longitude: bus.currentLng,
      speed: bus.speed,
      heading: bus.heading,
      timestamp: new Date().toISOString(),
    };
  }
}

export const realtimeService = new RealtimeService();
