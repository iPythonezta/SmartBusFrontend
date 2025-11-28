import React, { useState, useEffect } from 'react';
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
import { Loader2, MapPin } from 'lucide-react';
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <div className="relative">
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
