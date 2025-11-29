import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stopsApi } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import type { Stop } from '@/types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY || '';

const stopSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type StopFormData = z.infer<typeof stopSchema>;

// Mapbox Geocoding result types
interface GeocodingFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  text: string;
}

interface StopModalProps {
  open: boolean;
  onClose: () => void;
  stop?: Stop;
  mode: 'add' | 'edit';
}

export const StopModal: React.FC<StopModalProps> = ({ open, onClose, stop, mode }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const markerRef = React.useRef<mapboxgl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  const [markerPosition, setMarkerPosition] = useState<{
    lng: number;
    lat: number;
  }>({ lng: 73.0479, lat: 33.6844 });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StopFormData>({
    resolver: zodResolver(stopSchema),
    defaultValues: {
      name: '',
      description: '',
      latitude: 33.6844,
      longitude: 73.0479,
    },
  });

  // Location search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search function
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    console.log('[StopModal] Search query:', query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      console.log('[StopModal] Searching for:', query);
      try {
        // Use OpenStreetMap Nominatim API - better coverage for Pakistan
        const url = `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query + ', Islamabad, Pakistan')}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=8&` +
          `countrycodes=pk&` +
          `viewbox=72.8,33.4,73.5,34.0&` + // Islamabad region
          `bounded=0`; // Don't strictly bound, just prefer this area
        
        console.log('[StopModal] Nominatim URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'Accept-Language': 'en',
          }
        });
        const data = await response.json();
        console.log('[StopModal] Search results:', data?.length || 0, 'features');
        console.log('[StopModal] Results data:', data);
        
        // Transform Nominatim results to match our expected format
        const transformedResults: GeocodingFeature[] = (data || []).map((item: {
          place_id: number;
          display_name: string;
          lon: string;
          lat: string;
          name?: string;
          type?: string;
        }) => ({
          id: String(item.place_id),
          place_name: item.display_name,
          center: [parseFloat(item.lon), parseFloat(item.lat)] as [number, number],
          text: item.name || item.display_name.split(',')[0],
        }));
        
        if (transformedResults.length > 0) {
          console.log('[StopModal] First result:', transformedResults[0].place_name);
        }
        setSearchResults(transformedResults);
        setShowResults(true);
        console.log('[StopModal] showResults set to true, searchResults length:', transformedResults.length);
      } catch (error) {
        console.error('[StopModal] Geocoding search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Slightly longer debounce for Nominatim rate limits
  }, []);

  // Handle selecting a search result
  const handleSelectResult = useCallback((result: GeocodingFeature) => {
    const [lng, lat] = result.center;
    
    // Update marker position
    setMarkerPosition({ lng, lat });
    setValue('latitude', lat);
    setValue('longitude', lng);
    
    // Optionally use the place name as the stop name if empty
    const currentName = (document.getElementById('name') as HTMLInputElement)?.value;
    if (!currentName) {
      setValue('name', result.text);
    }

    // Move map and marker
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 16,
        duration: 1000,
      });
    }
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }, [setValue]);

  // Reset form when stop changes or modal opens
  useEffect(() => {
    if (open) {
      if (stop && mode === 'edit') {
        reset({
          name: stop.name,
          description: stop.description || '',
          latitude: stop.latitude,
          longitude: stop.longitude,
        });
        setMarkerPosition({ lng: stop.longitude, lat: stop.latitude });
      } else {
        reset({
          name: '',
          description: '',
          latitude: 33.6844,
          longitude: 73.0479,
        });
        setMarkerPosition({ lng: 73.0479, lat: 33.6844 });
      }
    }
  }, [open, stop, mode, reset]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!open) {
      setMapReady(false);
      return;
    }

    // Cleanup existing map first
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    markerRef.current = null;

    // Wait for container to be ready with proper dimensions
    const initMap = () => {
      const container = mapContainerRef.current;
      if (!container) return false;
      
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      const initialCenter: [number, number] = stop && mode === 'edit' 
        ? [stop.longitude, stop.latitude]
        : [73.0479, 33.6844];

      try {
        mapRef.current = new mapboxgl.Map({
          container: container,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: initialCenter,
          zoom: 14,
        });

        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Create draggable marker
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
          ">
            <svg width="32" height="40" viewBox="0 0 24 30" style="filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                    fill="#14b8a6" 
                    stroke="white" 
                    stroke-width="2"/>
              <circle cx="12" cy="9" r="3" fill="white"/>
            </svg>
          </div>
        `;

        markerRef.current = new mapboxgl.Marker({
          element: el,
          draggable: true,
          anchor: 'bottom',
        })
          .setLngLat(initialCenter)
          .addTo(mapRef.current);

        // Update position on marker drag
        markerRef.current.on('dragend', () => {
          const lngLat = markerRef.current!.getLngLat();
          setMarkerPosition({ lng: lngLat.lng, lat: lngLat.lat });
          setValue('latitude', lngLat.lat);
          setValue('longitude', lngLat.lng);
        });

        // Update marker position on map click
        mapRef.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          markerRef.current?.setLngLat([lng, lat]);
          setMarkerPosition({ lng, lat });
          setValue('latitude', lat);
          setValue('longitude', lng);
        });

        mapRef.current.on('load', () => {
          setMapReady(true);
        });

        return true;
      } catch (error) {
        console.error('Failed to initialize map:', error);
        return false;
      }
    };

    // Try multiple times with increasing delays
    let attempts = 0;
    const maxAttempts = 10;
    const tryInit = () => {
      if (initMap()) return;
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryInit, 100);
      }
    };
    
    // Start trying after a short delay
    const timeoutId = setTimeout(tryInit, 50);

    return () => {
      clearTimeout(timeoutId);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [open, stop?.id, mode, setValue]);

  // Update marker when position changes externally
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLngLat([markerPosition.lng, markerPosition.lat]);
    }
  }, [markerPosition]);

  const createMutation = useMutation({
    mutationFn: stopsApi.createStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stops'] });
      toast({
        title: t('common.success'),
        description: t('stops.addStop') + ' successful',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: 'Failed to create stop',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Stop>) => stopsApi.updateStop(stop!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stops'] });
      toast({
        title: t('common.success'),
        description: t('stops.editStop') + ' successful',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: 'Failed to update stop',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: StopFormData) => {
    if (mode === 'add') {
      createMutation.mutate({
        name: data.name,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    } else {
      updateMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-visible">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? t('stops.addStop') : t('stops.editStop')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? t('stops.clickToPlace')
              : t('stops.dragToAdjust')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('stops.stopName')}*</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter stop name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('stops.description')}</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">{t('stops.latitude')}*</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register('latitude', { valueAsNumber: true })}
                readOnly
              />
              {errors.latitude && (
                <p className="text-sm text-red-500">{errors.latitude.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">{t('stops.longitude')}*</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register('longitude', { valueAsNumber: true })}
                readOnly
              />
              {errors.longitude && (
                <p className="text-sm text-red-500">{errors.longitude.message}</p>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Click on map to place stop marker (drag to adjust)
            </Label>
            
            {/* Location Search - positioned above map with high z-index */}
            <div className="relative" style={{ zIndex: 1000 }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search for a location in Islamabad..."
                  className="pl-9 pr-9"
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  onBlur={() => {
                    // Delay hiding to allow click on results
                    setTimeout(() => setShowResults(false), 300);
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowResults(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isSearching && (
                  <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {/* Search Results Dropdown - using fixed positioning */}
              {(() => { console.log('[StopModal] Render check - showResults:', showResults, 'searchResults.length:', searchResults.length); return null; })()}
              {showResults && searchResults.length > 0 && (
                <div 
                  className="absolute left-0 right-0 mt-1 bg-white border-2 border-teal-500 rounded-lg shadow-2xl max-h-60 overflow-auto"
                  style={{ zIndex: 9999, position: 'absolute', top: '100%' }}
                >
                  <div className="bg-teal-100 px-2 py-1 text-xs text-teal-700">
                    Found {searchResults.length} results
                  </div>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur
                        e.stopPropagation();
                        handleSelectResult(result);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-teal-50 flex items-start gap-2 border-b last:border-b-0 cursor-pointer"
                    >
                      <MapPin className="h-4 w-4 mt-0.5 text-teal-600 flex-shrink-0" />
                      <span className="line-clamp-2">{result.place_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map container with lower z-index */}
            <div className="relative" style={{ zIndex: 1 }}>
              <div
                ref={mapContainerRef}
                style={{
                  width: '100%',
                  height: '400px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#e5e7eb',
                }}
              />
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-xl">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                    <span className="text-sm text-gray-600">Loading map...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'add' ? t('common.add') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
