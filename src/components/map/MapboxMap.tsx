import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Bus, Stop } from '@/types';
import { realtimeService } from '@/services/realtime';
import { routingService } from '@/services/routing';

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY || '';

interface MapboxMapProps {
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  buses?: Bus[];
  stops?: Stop[];
  showRoute?: boolean;
  routeColor?: string;
  height?: string;
  interactive?: boolean;
  showControls?: boolean;
}

export const MapboxMap: React.FC<MapboxMapProps> = ({
  initialViewState = { longitude: 73.0479, latitude: 33.6844, zoom: 12 },
  buses = [],
  stops = [],
  showRoute = false,
  routeColor = '#0ea5e9',
  height = '400px',
  interactive = true,
  showControls = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const busMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const stopMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialViewState.longitude, initialViewState.latitude],
        zoom: initialViewState.zoom,
        interactive,
      });

      if (showControls && interactive) {
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      }

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Helper function to create distinctive bus marker element
  const createBusMarkerElement = (bus: Bus, location: { speed: number; heading: number }) => {
    const el = document.createElement('div');
    el.className = 'bus-marker';
    el.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
    `;

    el.innerHTML = `
      <div style="
        background: #1e40af;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        font-family: system-ui, -apple-system, sans-serif;
      ">${location.speed} km/h</div>
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
      ">
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${location.heading}deg);
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7v10c0 5 10 5 10 5s10 0 10-5V7L12 2z"/>
            <path d="M12 2v20" stroke="white" stroke-width="2"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 40px;
          height: 40px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          animation: busPulse 2s infinite;
          pointer-events: none;
        "></div>
      </div>
      <div style="
        background: white;
        color: #1e40af;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        border: 1px solid #3b82f6;
        font-family: system-ui, -apple-system, sans-serif;
      ">${bus.registration_number}</div>
      <style>
        @keyframes busPulse {
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
    `;

    return el;
  };

  // Helper function to create distinctive stop marker element
  const createStopMarkerElement = (stop: Stop) => {
    const el = document.createElement('div');
    el.className = 'stop-marker';
    el.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    `;

    el.innerHTML = `
      <svg width="32" height="40" viewBox="0 0 24 30" style="filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
              fill="${routeColor}" 
              stroke="white" 
              stroke-width="2"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
      <div style="
        margin-top: 2px;
        background: white;
        border: 2px solid ${routeColor};
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 700;
        color: ${routeColor};
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        font-family: system-ui, -apple-system, sans-serif;
      ">${stop.name}</div>
    `;

    return el;
  };

  // Add/update stop markers - Only re-run when stop IDs change, not when objects change
  useEffect(() => {
    if (!map.current || !mapLoaded || !showRoute) return;

    // Remove old stop markers that are no longer in the list
    const currentStopIds = new Set(stops.map(s => s.id));
    stopMarkers.current.forEach((marker, stopId) => {
      if (!currentStopIds.has(stopId)) {
        marker.remove();
        stopMarkers.current.delete(stopId);
      }
    });

    // Add or update stop markers
    stops.forEach((stop) => {
      const existingMarker = stopMarkers.current.get(stop.id);
      
      if (existingMarker) {
        // Just update position if marker already exists (stops don't move usually)
        existingMarker.setLngLat([stop.longitude, stop.latitude]);
      } else {
        // Create new marker only if it doesn't exist
        const el = createStopMarkerElement(stop);
        
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom',
        })
          .setLngLat([stop.longitude, stop.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="font-family: system-ui; padding: 12px; min-width: 150px;">
                <h3 style="font-weight: 700; color: ${routeColor}; margin: 0 0 8px 0; font-size: 14px;">
                  ${stop.name}
                </h3>
                <div style="font-size: 12px; color: #64748b;">
                  Bus Stop
                </div>
              </div>
            `)
          )
          .addTo(map.current!);

        stopMarkers.current.set(stop.id, marker);
      }
    });
  }, [stops.map(s => s.id).join(','), mapLoaded, showRoute, routeColor]); // Only re-run when stop IDs change

  // Draw route polyline with actual road-based routing - Only re-run when stop IDs/coordinates change
  useEffect(() => {
    if (!map.current || !mapLoaded || !showRoute || stops.length < 2) return;

    const drawRoute = async () => {
      try {
        const mapInstance = map.current;
        if (!mapInstance || !mapInstance.getStyle()) return;

        // Check if route already exists with same data
        const existingSource = mapInstance.getSource('route') as mapboxgl.GeoJSONSource;
        if (existingSource) {
          // Update line color if it changed
          if (mapInstance.getLayer('route')) {
            mapInstance.setPaintProperty('route', 'line-color', routeColor);
          }
          return; // Route already drawn, no need to redraw
        }

        // Get coordinates for route (assuming stops are already sorted)
        const coordinates = stops.map(stop => [stop.latitude, stop.longitude] as [number, number]);

        // Fetch actual road-based route
        const routeCoordinates = await routingService.getRoute(coordinates);

        // Convert to GeoJSON format [lng, lat]
        const geojsonCoordinates = routeCoordinates.map(coord => [coord[1], coord[0]]);

        // Add route as a line layer
        mapInstance.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: geojsonCoordinates,
            },
          },
        });

        mapInstance.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': routeColor,
            'line-width': 5,
            'line-opacity': 0.8,
          },
        });
      } catch (error) {
        console.error('Error drawing route:', error);
      }
    };

    drawRoute();

    return () => {
      try {
        const mapInstance = map.current;
        if (mapInstance && mapInstance.getStyle()) {
          if (mapInstance.getLayer('route')) {
            mapInstance.removeLayer('route');
          }
          if (mapInstance.getSource('route')) {
            mapInstance.removeSource('route');
          }
        }
      } catch (error) {
        console.error('Error cleaning up route:', error);
      }
    };
  }, [stops.map(s => s.id).join(','), showRoute, routeColor, mapLoaded]); // Only re-run when stop IDs change

  // Add bus markers with real-time updates - CRITICAL: Only re-run when bus IDs change
  useEffect(() => {
    if (!map.current || !mapLoaded || buses.length === 0) return;

    const unsubscribeFunctions: (() => void)[] = [];
    
    // Create a stable reference to buses data
    const busesData = buses.map(bus => ({
      id: bus.id,
      registration_number: bus.registration_number,
      capacity: bus.capacity,
      status: bus.status,
      last_location: bus.last_location,
    }));

    busesData.forEach((bus) => {
      if (!bus.last_location || bus.status !== 'active') return;

      const location = bus.last_location;
      
      // Check if marker already exists
      const existingMarker = busMarkers.current.get(bus.id);
      if (existingMarker) {
        // Just update the existing marker's position and visual
        existingMarker.setLngLat([location.longitude, location.latitude]);
        const newEl = createBusMarkerElement(bus as Bus, location);
        existingMarker.getElement().innerHTML = newEl.innerHTML;
        return;
      }
      
      // Create new marker
      const el = createBusMarkerElement(bus as Bus, location);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: system-ui; padding: 12px; min-width: 200px;">
              <h3 style="font-weight: 700; color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">
                ${bus.registration_number}
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                <div>
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Speed</div>
                  <div style="font-weight: 600; color: #1e40af;">${location.speed} km/h</div>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Heading</div>
                  <div style="font-weight: 600; color: #1e40af;">${location.heading}°</div>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Status</div>
                  <div style="font-weight: 600; color: #059669; text-transform: capitalize;">${bus.status}</div>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Capacity</div>
                  <div style="font-weight: 600; color: #1e40af;">${bus.capacity}</div>
                </div>
              </div>
            </div>
          `)
        )
        .addTo(map.current!);

      busMarkers.current.set(bus.id, marker);

      // Subscribe to real-time updates - this updates the marker WITHOUT re-rendering the component
      const unsubscribe = realtimeService.subscribe(bus.id, (_busId, newLocation) => {
        const existingMarker = busMarkers.current.get(bus.id);
        if (existingMarker) {
          // Update marker position smoothly
          existingMarker.setLngLat([newLocation.longitude, newLocation.latitude]);
          
          // Update marker element with new speed and heading
          const newEl = createBusMarkerElement(bus as Bus, newLocation);
          existingMarker.getElement().innerHTML = newEl.innerHTML;
          
          // Update popup content
          existingMarker.setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="font-family: system-ui; padding: 12px; min-width: 200px;">
                <h3 style="font-weight: 700; color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">
                  ${bus.registration_number}
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                  <div>
                    <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Speed</div>
                    <div style="font-weight: 600; color: #1e40af;">${newLocation.speed} km/h</div>
                  </div>
                  <div>
                    <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Heading</div>
                    <div style="font-weight: 600; color: #1e40af;">${newLocation.heading}°</div>
                  </div>
                  <div>
                    <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Status</div>
                    <div style="font-weight: 600; color: #059669; text-transform: capitalize;">${bus.status}</div>
                  </div>
                  <div>
                    <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Capacity</div>
                    <div style="font-weight: 600; color: #1e40af;">${bus.capacity}</div>
                  </div>
                </div>
              </div>
            `)
          );
        }
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(fn => fn());
      // Only remove markers for buses that are no longer in the list
      const currentBusIds = new Set(busesData.map(b => b.id));
      busMarkers.current.forEach((marker, busId) => {
        if (!currentBusIds.has(busId)) {
          marker.remove();
          busMarkers.current.delete(busId);
        }
      });
    };
  }, [buses.map(b => b.id).join(','), mapLoaded]); // Only re-run when bus IDs change, not the entire objects

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height,
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  );
};
