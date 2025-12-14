// Routing service to get actual road-based routes between points
// Uses Mapbox Directions API for better coverage worldwide

interface RouteResponse {
  coordinates: [number, number][]; // [lng, lat] pairs
  distance: number; // in meters
  duration: number; // in seconds
}

class RoutingService {
  private cache: Map<string, [number, number][]> = new Map();
  private readonly MAPBOX_DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';

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
      console.log('[RoutingService] Using cached route');
      return this.cache.get(cacheKey)!;
    }

    try {
      const accessToken = import.meta.env.VITE_MAPBOX_API_KEY;
      if (!accessToken) {
        console.warn('[RoutingService] No Mapbox API key, using straight lines');
        return points;
      }

      // Mapbox expects coordinates as lng,lat
      const coordinates = points.map(p => `${p[1]},${p[0]}`).join(';');
      
      // Request route with full geometry
      const url = `${this.MAPBOX_DIRECTIONS_URL}/${coordinates}?geometries=geojson&overview=full&access_token=${accessToken}`;
      
      console.log('[RoutingService] Fetching route from Mapbox...');
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // Mapbox returns coordinates as [lng, lat], convert to [lat, lng]
        const routeCoordinates: [number, number][] = data.routes[0].geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]] as [number, number]
        );

        console.log(`[RoutingService] Got route with ${routeCoordinates.length} points`);

        // Cache the result
        this.cache.set(cacheKey, routeCoordinates);
        
        return routeCoordinates;
      } else {
        console.warn('[RoutingService] Mapbox routing failed, falling back to straight lines:', data);
        return points;
      }
    } catch (error) {
      console.error('[RoutingService] Error fetching route from Mapbox:', error);
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
      const accessToken = import.meta.env.VITE_MAPBOX_API_KEY;
      if (!accessToken) {
        console.warn('[RoutingService] No Mapbox API key');
        return { coordinates: points, distance: 0, duration: 0 };
      }

      const coordinates = points.map(p => `${p[1]},${p[0]}`).join(';');
      const url = `${this.MAPBOX_DIRECTIONS_URL}/${coordinates}?geometries=geojson&overview=full&access_token=${accessToken}`;
      
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
      console.error('[RoutingService] Error fetching route info from Mapbox:', error);
    }

    return {
      coordinates: points,
      distance: 0,
      duration: 0,
    };
  }
}

export const routingService = new RoutingService();
