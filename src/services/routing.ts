// Routing service to get actual road-based routes between points
// Uses OSRM (Open Source Routing Machine) - completely free, no API key needed

interface RouteResponse {
  coordinates: [number, number][]; // [lng, lat] pairs
  distance: number; // in meters
  duration: number; // in seconds
}

class RoutingService {
  private cache: Map<string, [number, number][]> = new Map();
  private readonly OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

  /**
   * Get the actual road route between multiple points
   * @param points Array of [lat, lng] coordinates
   * @returns Promise with array of [lat, lng] coordinates following roads
   */
  async getRoute(points: [number, number][]): Promise<[number, number][]> {
    if (points.length < 2) {
      return points;
    }

    // Create cache key from points
    const cacheKey = points.map(p => `${p[0]},${p[1]}`).join('|');
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // OSRM expects coordinates as lng,lat (opposite of Leaflet)
      const coordinates = points.map(p => `${p[1]},${p[0]}`).join(';');
      
      // Request route with full geometry
      const url = `${this.OSRM_URL}/${coordinates}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // OSRM returns coordinates as [lng, lat], convert to [lat, lng] for Leaflet
        const routeCoordinates: [number, number][] = data.routes[0].geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]] as [number, number]
        );

        // Cache the result
        this.cache.set(cacheKey, routeCoordinates);
        
        return routeCoordinates;
      } else {
        console.warn('OSRM routing failed, falling back to straight lines:', data);
        return points;
      }
    } catch (error) {
      console.error('Error fetching route from OSRM:', error);
      // Fallback to straight lines if routing fails
      return points;
    }
  }

  /**
   * Clear the route cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get route with distance and duration info
   */
  async getRouteWithInfo(points: [number, number][]): Promise<RouteResponse> {
    if (points.length < 2) {
      return {
        coordinates: points,
        distance: 0,
        duration: 0,
      };
    }

    try {
      const coordinates = points.map(p => `${p[1]},${p[0]}`).join(';');
      const url = `${this.OSRM_URL}/${coordinates}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const routeCoordinates: [number, number][] = route.geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]] as [number, number]
        );

        return {
          coordinates: routeCoordinates,
          distance: route.distance,
          duration: route.duration,
        };
      }
    } catch (error) {
      console.error('Error fetching route info from OSRM:', error);
    }

    return {
      coordinates: points,
      distance: 0,
      duration: 0,
    };
  }
}

export const routingService = new RoutingService();
