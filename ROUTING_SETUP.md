# Road-Based Route Rendering

## Overview
The application now uses **OSRM (Open Source Routing Machine)** to display realistic routes that follow actual roads and streets, instead of straight lines between stops.

## How It Works

### Service: `src/services/routing.ts`
- Uses OSRM's free public API: `https://router.project-osrm.org`
- **No API key required** - completely free to use
- Caches route results to minimize API calls
- Falls back to straight lines if routing fails

### Key Features
1. **Road-Based Routes**: Routes follow actual streets and roads
2. **Caching**: Routes are cached to improve performance
3. **Fallback**: If OSRM is unavailable, displays straight lines
4. **No Cost**: OSRM is open-source and free

## Implementation

### BusDetailPage
```typescript
<RoutePolyline 
  routeStops={bus.assigned_route.route_stops}
  color={bus.assigned_route.color || '#0d9488'}
/>
```
- Shows the complete bus route following actual roads
- Highlights all stops along the route
- Live bus marker moves smoothly along the route

### MapCanvas Component
```typescript
<SmartRoutePolyline
  geometry={routePolyline.geometry}
  color={routePolyline.properties?.color || '#14b8a6'}
  weight={5}
  opacity={0.8}
/>
```
- Used in RouteDetailPage and other pages that show routes
- Automatically fetches road-based routing
- Displays smooth, realistic route paths

## OSRM vs Google Maps Directions API

| Feature | OSRM | Google Maps |
|---------|------|-------------|
| Cost | Free | Requires billing account |
| API Key | Not required | Required |
| Data Source | OpenStreetMap | Google's proprietary data |
| Accuracy | Very good | Excellent |
| Rate Limits | Generous | Limited free tier |

## Testing
1. Navigate to **Buses** page
2. Click on any bus's **View Details**
3. If the bus is assigned to a route, you'll see:
   - The route following actual roads (not straight lines)
   - All stops marked along the route
   - Blue pulsing marker showing live bus location
   - The marker moves smoothly along the route

## Cache Management
The routing service caches routes automatically. To clear the cache:
```typescript
import { routingService } from '@/services/routing';

// Clear all cached routes
routingService.clearCache();
```

## Error Handling
- If OSRM API is unreachable: Falls back to straight lines
- If route points are invalid: Returns original points
- Network errors are logged to console
- Map still renders with whatever data is available

## Performance
- Initial route fetch: ~500ms - 2s (depending on route complexity)
- Cached routes: Instant
- Reduces API calls with intelligent caching
- Loads routes in background without blocking UI

## Future Improvements
- Add loading indicators while fetching routes
- Support alternative routing profiles (walking, cycling)
- Add route distance and duration display
- Implement route optimization
