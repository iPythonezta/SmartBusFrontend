import React, { useState } from 'react';
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
import { MapCanvas } from '@/components/map';
import { toast } from '@/components/ui/use-toast';
import { Loader2, MapPin } from 'lucide-react';
import type { Stop } from '@/types';

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
  const [markerPosition, setMarkerPosition] = useState<{
    lng: number;
    lat: number;
  } | null>(
    stop
      ? { lng: stop.longitude, lat: stop.latitude }
      : { lng: 73.0479, lat: 33.6844 } // Default to Islamabad center
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StopFormData>({
    resolver: zodResolver(stopSchema),
    defaultValues: stop
      ? {
          name: stop.name,
          description: stop.description || '',
          latitude: stop.latitude,
          longitude: stop.longitude,
        }
      : {
          name: '',
          description: '',
          latitude: 33.6844,
          longitude: 73.0479,
        },
  });

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

  const handleMapClick = (lng: number, lat: number) => {
    setMarkerPosition({ lng, lat });
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  const handleMarkerDrag = (id: string, lng: number, lat: number) => {
    setMarkerPosition({ lng, lat });
    setValue('latitude', lat);
    setValue('longitude', lng);
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
            <MapCanvas
              initialViewState={{
                longitude: markerPosition?.lng || 73.0479,
                latitude: markerPosition?.lat || 33.6844,
                zoom: 13,
              }}
              markers={
                markerPosition
                  ? [
                      {
                        id: 'new-stop',
                        longitude: markerPosition.lng,
                        latitude: markerPosition.lat,
                        color: '#14b8a6',
                        label: watch('name') || 'New Stop',
                      },
                    ]
                  : []
              }
              onClick={handleMapClick}
              onMarkerDrag={handleMarkerDrag}
              draggableMarker="new-stop"
              height="400px"
            />
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
