import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Bus } from '@/types';
import { realtimeService } from '@/services/realtime';
import { routingService } from '@/services/routing';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapCanvasProps {
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  markers?: Array<{
    id: string;
    longitude: number;
    latitude: number;
    color?: string;
    label?: string;
    onClick?: () => void;
  }>;
  buses?: Bus[];
  routePolyline?: {
    type: 'Feature';
    geometry: {
      type: 'LineString';
      coordinates: number[][];
    };
    properties: any;
  };
  onClick?: (lng: number, lat: number) => void;
  onMarkerDrag?: (id: string, lng: number, lat: number) => void;
  draggableMarker?: string | null;
  height?: string;
  interactive?: boolean;
  showControls?: boolean;
}

// Component to handle map clicks
function MapClickHandler({ onClick }: { onClick?: (lng: number, lat: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick(e.latlng.lng, e.latlng.lat);
      }
    },
  });
  return null;
}

// Component to update map view
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

// Component to handle real-time bus location updates
function RealtimeBusMarkers({ buses }: { buses: Bus[] }) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to real-time updates for each bus
    buses.forEach(bus => {
      if (bus.last_location && bus.status === 'active') {
        const unsubscribe = realtimeService.subscribe(bus.id, (_busId, location) => {
          const marker = markersRef.current.get(bus.id);
          if (marker) {
            // Update marker position without re-rendering
            const newLatLng = L.latLng(location.latitude, location.longitude);
            marker.setLatLng(newLatLng);
            
            // Update popup content
            const popupContent = `
              <div class="text-sm">
                <p class="font-bold">${bus.registration_number}</p>
                <p>Speed: ${location.speed} km/h</p>
                <p class="capitalize">Status: ${bus.status}</p>
                ${bus.assigned_route ? `<p>Route: ${bus.assigned_route.name}</p>` : ''}
              </div>
            `;
            marker.getPopup()?.setContent(popupContent);
          }
        });
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [buses]);

  // Initial render of markers
  useEffect(() => {
    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Create new markers
    buses.forEach(bus => {
      if (bus.last_location) {
        const icon = createBusIcon(bus.last_location.speed, bus.status === 'active');
        const marker = L.marker(
          [bus.last_location.latitude, bus.last_location.longitude],
          { icon }
        ).addTo(map);

        const popupContent = `
          <div class="text-sm">
            <p class="font-bold">${bus.registration_number}</p>
            <p>Speed: ${bus.last_location.speed} km/h</p>
            <p class="capitalize">Status: ${bus.status}</p>
            ${bus.assigned_route ? `<p>Route: ${bus.assigned_route.name}</p>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);
        markersRef.current.set(bus.id, marker);
      }
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
    };
  }, [buses, map]);

  return null;
}

// Component to render route polyline with actual road-based routing
function SmartRoutePolyline({ 
  geometry, 
  color, 
  weight = 4, 
  opacity = 0.8 
}: { 
  geometry: { type: 'LineString'; coordinates: number[][] };
  color: string;
  weight?: number;
  opacity?: number;
}) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      setIsLoading(true);
      
      // Convert from [lng, lat] to [lat, lng]
      const points = geometry.coordinates.map(
        coord => [coord[1], coord[0]] as [number, number]
      );

      if (points.length < 2) {
        setRouteCoordinates(points);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the actual road-based route
        const coordinates = await routingService.getRoute(points);
        setRouteCoordinates(coordinates);
      } catch (error) {
        console.error('Error fetching route:', error);
        // Fallback to straight lines
        setRouteCoordinates(points);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [geometry.coordinates]);

  if (isLoading || routeCoordinates.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={routeCoordinates}
      pathOptions={{
        color,
        weight,
        opacity,
      }}
    />
  );
}

// Create custom icons
const createCustomIcon = (color: string, label?: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          width: 14px;
          height: 14px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        "></div>
        ${label ? `
          <div style="
            margin-top: 4px;
            padding: 2px 8px;
            background: white;
            border: 1px solid ${color};
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            color: ${color};
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            font-family: system-ui, -apple-system, sans-serif;
          ">${label}</div>
        ` : ''}
      </div>
    `,
    iconSize: [120, 40],
    iconAnchor: [60, 14],
  });
};

const createBusIcon = (speed: number, isActive: boolean) => {
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div class="relative flex items-center justify-center" style="width: 48px; height: 48px;">
        ${isActive ? '<div class="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75"></div>' : ''}
        <div class="relative z-10 bg-blue-600 rounded-lg border-4 border-white shadow-xl p-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6" />
            <path d="M15 6v6" />
            <path d="M2 12h19.6" />
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
            <circle cx="7" cy="18" r="2" />
            <path d="M9 18h5" />
            <circle cx="16" cy="18" r="2" />
          </svg>
        </div>
        <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
          ${speed} km/h
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

export const MapCanvas: React.FC<MapCanvasProps> = ({
  initialViewState = {
    longitude: 73.0479,
    latitude: 33.6844,
    zoom: 12,
  },
  markers = [],
  buses = [],
  routePolyline,
  onClick,
  onMarkerDrag,
  draggableMarker,
  height = '500px',
  interactive = true,
  showControls = true,
}) => {
  const center: [number, number] = [initialViewState.latitude, initialViewState.longitude];

  return (
    <div style={{ width: '100%', height }} className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
      <MapContainer
        center={center}
        zoom={initialViewState.zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={showControls}
        dragging={interactive}
        scrollWheelZoom={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onClick={onClick} />
        <MapViewController center={center} zoom={initialViewState.zoom} />

        {/* Route Polyline with actual road-based routing */}
        {routePolyline && (
          <SmartRoutePolyline
            geometry={routePolyline.geometry}
            color={routePolyline.properties?.color || '#14b8a6'}
            weight={5}
            opacity={0.8}
          />
        )}

        {/* Stop Markers */}
        {markers.map((marker) => {
          const position: [number, number] = [marker.latitude, marker.longitude];
          const isDraggable = draggableMarker === marker.id;

          return (
            <Marker
              key={marker.id}
              position={position}
              icon={createCustomIcon(marker.color || '#14b8a6', marker.label)}
              draggable={isDraggable}
              eventHandlers={{
                click: marker.onClick,
                dragend: (e) => {
                  if (onMarkerDrag) {
                    const newPos = e.target.getLatLng();
                    onMarkerDrag(marker.id, newPos.lng, newPos.lat);
                  }
                },
              }}
            >
              {marker.label && <Popup>{marker.label}</Popup>}
            </Marker>
          );
        })}

        {/* Real-time Bus Markers - Updates positions without re-rendering parent */}
        <RealtimeBusMarkers buses={buses} />
      </MapContainer>
    </div>
  );
};
