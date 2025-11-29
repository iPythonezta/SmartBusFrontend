import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Bus, Stop } from '@/types';
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
  fitToBounds?: boolean; // Auto-fit map to show all stops
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
  fitToBounds = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const busMarkers = useRef<Map<number | string, mapboxgl.Marker>>(new Map());
  const stopMarkers = useRef<Map<number, mapboxgl.Marker>>(new Map());
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

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  };

  // Check if timestamp is older than 1 minute
  const isOlderThanOneMinute = (timestamp: string): boolean => {
    const now = new Date();
    const then = new Date(timestamp);
    return (now.getTime() - then.getTime()) > 60000; // 60 seconds
  };

  // Helper function to create distinctive bus marker element
  const createBusMarkerElement = (
    bus: Bus, 
    location: { speed: number; heading: number; timestamp: string },
    status: 'active' | 'inactive' | 'maintenance'
  ) => {
    const el = document.createElement('div');
    el.className = 'bus-marker';
    
    const isActive = status === 'active';
    const isStale = isOlderThanOneMinute(location.timestamp);
    const showLastSeen = !isActive || isStale;
    
    // Colors based on status
    const colors = {
      active: { bg: '#1e40af', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', shadow: 'rgba(59, 130, 246, 0.5)' },
      inactive: { bg: '#6b7280', gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)', shadow: 'rgba(107, 114, 128, 0.5)' },
      maintenance: { bg: '#d97706', gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', shadow: 'rgba(217, 119, 6, 0.5)' },
    };
    const color = colors[status];
    
    el.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
    `;

    // Status badge for inactive/maintenance
    const statusBadge = !isActive ? `
      <div style="
        background: ${status === 'maintenance' ? '#fef3c7' : '#f3f4f6'};
        color: ${status === 'maintenance' ? '#92400e' : '#374151'};
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 2px;
        font-family: system-ui, -apple-system, sans-serif;
      ">${status}</div>
    ` : '';

    // Speed or Last Seen display
    const topLabel = showLastSeen 
      ? `<div style="
          background: ${isActive ? '#1e40af' : color.bg};
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          font-family: system-ui, -apple-system, sans-serif;
        ">🕐 ${formatTimeAgo(location.timestamp)}</div>`
      : `<div style="
          background: #1e40af;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          font-family: system-ui, -apple-system, sans-serif;
        ">${location.speed != null ? location.speed + ' km/h' : 'N/A'}</div>`;

    // Pulse animation only for active buses
    const pulseAnimation = isActive && !isStale ? `
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 40px;
        height: 40px;
        background: ${color.shadow.replace('0.5', '0.2')};
        border-radius: 50%;
        animation: busPulse 2s infinite;
        pointer-events: none;
      "></div>
    ` : '';

    el.innerHTML = `
      ${statusBadge}
      ${topLabel}
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
      ">
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          background: ${color.gradient};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px ${color.shadow};
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${location.heading || 0}deg);
          ${!isActive ? 'opacity: 0.7;' : ''}
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7v10c0 5 10 5 10 5s10 0 10-5V7L12 2z"/>
            <path d="M12 2v20" stroke="white" stroke-width="2"/>
          </svg>
        </div>
        ${pulseAnimation}
      </div>
      <div style="
        background: white;
        color: ${color.bg};
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        border: 1px solid ${color.bg};
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
  const createStopMarkerElement = (stop: Stop, index?: number, totalStops?: number) => {
    const el = document.createElement('div');
    el.className = 'stop-marker';
    el.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    `;

    // Determine if this is start, end, or middle stop
    const isStart = index === 0;
    const isEnd = totalStops !== undefined && index === totalStops - 1;
    
    // Different colors for start/end/middle
    let fillColor = routeColor;
    let iconInner = '<circle cx="12" cy="9" r="3" fill="white"/>';
    let label = stop.name;
    let labelBg = 'white';
    let labelColor = routeColor;
    let size = { width: 32, height: 40, viewBox: '0 0 24 30' };
    
    if (isStart) {
      fillColor = '#22c55e'; // Green for start
      iconInner = `
        <text x="12" y="13" text-anchor="middle" fill="white" font-size="10" font-weight="bold">A</text>
      `;
      labelBg = '#22c55e';
      labelColor = 'white';
      label = `🚩 ${stop.name}`;
    } else if (isEnd) {
      fillColor = '#ef4444'; // Red for end
      iconInner = `
        <text x="12" y="13" text-anchor="middle" fill="white" font-size="10" font-weight="bold">B</text>
      `;
      labelBg = '#ef4444';
      labelColor = 'white';
      label = `🏁 ${stop.name}`;
    } else if (index !== undefined) {
      // Middle stops - show sequence number
      iconInner = `
        <text x="12" y="13" text-anchor="middle" fill="white" font-size="9" font-weight="bold">${index + 1}</text>
      `;
    }

    el.innerHTML = `
      <svg width="${size.width}" height="${size.height}" viewBox="${size.viewBox}" style="filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
              fill="${fillColor}" 
              stroke="white" 
              stroke-width="2"/>
        ${iconInner}
      </svg>
      <div style="
        margin-top: 2px;
        background: ${labelBg};
        border: 2px solid ${fillColor};
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 700;
        color: ${labelColor};
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        font-family: system-ui, -apple-system, sans-serif;
      ">${label}</div>
    `;

    return el;
  };

  // Add/update stop markers - Only re-run when stop IDs change, not when objects change
  useEffect(() => {
    if (!map.current || !mapLoaded || stops.length === 0) return;

    // Remove old stop markers that are no longer in the list
    const currentStopIds = new Set(stops.map(s => s.id));
    stopMarkers.current.forEach((marker, stopId) => {
      if (!currentStopIds.has(stopId)) {
        marker.remove();
        stopMarkers.current.delete(stopId);
      }
    });

    const totalStops = stops.length;

    // Add or update stop markers
    stops.forEach((stop, index) => {
      const existingMarker = stopMarkers.current.get(stop.id);
      
      if (existingMarker) {
        // Update position and recreate element to update styling (for sequence changes)
        existingMarker.setLngLat([stop.longitude, stop.latitude]);
        const newEl = createStopMarkerElement(stop, index, totalStops);
        existingMarker.getElement().innerHTML = newEl.innerHTML;
      } else {
        // Create new marker only if it doesn't exist
        const el = createStopMarkerElement(stop, index, totalStops);
        
        // Determine label type for popup
        const isStart = index === 0;
        const isEnd = index === totalStops - 1;
        const stopType = isStart ? 'Starting Point' : isEnd ? 'Final Destination' : `Stop #${index + 1}`;
        const stopColor = isStart ? '#22c55e' : isEnd ? '#ef4444' : routeColor;
        
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom',
        })
          .setLngLat([stop.longitude, stop.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="font-family: system-ui; padding: 12px; min-width: 150px;">
                <div style="
                  display: inline-block;
                  background: ${stopColor};
                  color: white;
                  padding: 2px 8px;
                  border-radius: 8px;
                  font-size: 10px;
                  font-weight: 600;
                  margin-bottom: 8px;
                ">${stopType}</div>
                <h3 style="font-weight: 700; color: ${stopColor}; margin: 0 0 4px 0; font-size: 14px;">
                  ${stop.name}
                </h3>
                ${stop.description ? `<div style="font-size: 12px; color: #64748b;">${stop.description}</div>` : ''}
              </div>
            `)
          )
          .addTo(map.current!);

        stopMarkers.current.set(stop.id, marker);
      }
    });
  }, [stops.map(s => s.id).join(','), mapLoaded, routeColor]); // Only re-run when stop IDs change

  // Auto-fit bounds to show all stops
  useEffect(() => {
    if (!map.current || !mapLoaded || !fitToBounds || stops.length === 0) return;

    // Calculate bounds
    const bounds = new mapboxgl.LngLatBounds();
    
    stops.forEach(stop => {
      bounds.extend([stop.longitude, stop.latitude]);
    });

    // Also include bus positions if any
    buses.forEach(bus => {
      if (bus.last_location) {
        bounds.extend([bus.last_location.longitude, bus.last_location.latitude]);
      }
    });

    // Fit the map to the bounds with padding
    map.current.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 15,
      duration: 1000,
    });
  }, [stops.map(s => s.id).join(','), fitToBounds, mapLoaded]);

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

  // Add bus markers - Updates when bus data changes (from backend polling)
  useEffect(() => {
    if (!map.current || !mapLoaded || buses.length === 0) return;

    // Create a stable reference to buses data
    const busesData = buses.map(bus => ({
      id: bus.id,
      registration_number: bus.registration_number,
      capacity: bus.capacity,
      status: bus.status,
      last_location: bus.last_location,
    }));

    // Remove markers for buses no longer in the list
    const currentBusIds = new Set(busesData.map(b => b.id));
    busMarkers.current.forEach((marker, busId) => {
      if (!currentBusIds.has(busId as number)) {
        marker.remove();
        busMarkers.current.delete(busId);
      }
    });

    busesData.forEach((bus) => {
      // Show bus on map if it has location data (regardless of status)
      if (!bus.last_location) {
        // Remove marker if bus has no location
        const existingMarker = busMarkers.current.get(bus.id);
        if (existingMarker) {
          existingMarker.remove();
          busMarkers.current.delete(bus.id);
        }
        return;
      }

      const location = bus.last_location;
      const isStale = isOlderThanOneMinute(location.timestamp);
      const statusColor = bus.status === 'active' ? '#059669' : bus.status === 'maintenance' ? '#d97706' : '#6b7280';
      
      // Check if marker already exists
      const existingMarker = busMarkers.current.get(bus.id);
      if (existingMarker) {
        // Update the existing marker's position and visual
        existingMarker.setLngLat([location.longitude, location.latitude]);
        const newEl = createBusMarkerElement(bus as Bus, location, bus.status);
        existingMarker.getElement().innerHTML = newEl.innerHTML;
        return;
      }
      
      // Create new marker
      const el = createBusMarkerElement(bus as Bus, location, bus.status);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: system-ui; padding: 12px; min-width: 220px;">
              <h3 style="font-weight: 700; color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">
                ${bus.registration_number}
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                <div>
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Speed</div>
                  <div style="font-weight: 600; color: #1e40af;">${location.speed != null ? location.speed + ' km/h' : 'N/A'}</div>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Heading</div>
                  <div style="font-weight: 600; color: #1e40af;">${location.heading != null ? location.heading + '°' : 'N/A'}</div>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Status</div>
                  <div style="font-weight: 600; color: ${statusColor}; text-transform: capitalize;">${bus.status}</div>
                </div>
                <div>
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Capacity</div>
                  <div style="font-weight: 600; color: #1e40af;">${bus.capacity}</div>
                </div>
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">Last Update</div>
                <div style="font-weight: 600; color: ${isStale ? '#d97706' : '#059669'}; font-size: 12px;">
                  ${isStale ? '🕐 ' + formatTimeAgo(location.timestamp) : '✓ Just now'}
                </div>
                <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">
                  ${new Date(location.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          `)
        )
        .addTo(map.current!);

      busMarkers.current.set(bus.id, marker);
    });

    return () => {
      // Cleanup is handled above - we only remove markers for buses no longer in the list
    };
  }, [buses, mapLoaded]); // Re-run when buses data changes (from backend polling)

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
