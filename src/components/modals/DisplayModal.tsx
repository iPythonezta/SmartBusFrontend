import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DisplayUnit, Stop } from '@/types';
import { stopsApi } from '@/services/api';

const displaySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  stop_id: z.string().min(1, 'Stop is required'),
  location: z.string().optional(),
  status: z.enum(['online', 'offline', 'error']),
});

type DisplayFormData = z.infer<typeof displaySchema>;

interface DisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DisplayFormData) => void;
  display?: DisplayUnit | null;
  isLoading?: boolean;
}

const DisplayModal: React.FC<DisplayModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  display,
  isLoading,
}) => {
  const isEditing = !!display;

  const { data: stops } = useQuery({
    queryKey: ['stops'],
    queryFn: () => stopsApi.getStops(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DisplayFormData>({
    resolver: zodResolver(displaySchema),
    defaultValues: {
      name: '',
      stop_id: '',
      location: '',
      status: 'offline',
    },
  });

  const watchedStopId = watch('stop_id');
  const watchedStatus = watch('status');

  // Reset form when modal opens/closes or display changes
  useEffect(() => {
    if (isOpen) {
      if (display) {
        reset({
          name: display.name,
          stop_id: display.stop_id.toString(), // Convert number to string for form
          location: display.location || '',
          status: display.status,
        });
      } else {
        reset({
          name: '',
          stop_id: '',
          location: '',
          status: 'offline',
        });
      }
    }
  }, [isOpen, display, reset]);

  const handleFormSubmit = (data: DisplayFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Display Unit' : 'Add New Display Unit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Blue Area Display"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Stop Selection */}
          <div className="space-y-2">
            <Label htmlFor="stop_id">Assigned Stop *</Label>
            <Select
              value={watchedStopId}
              onValueChange={(value) => setValue('stop_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a stop" />
              </SelectTrigger>
              <SelectContent>
                {stops?.map((stop: Stop) => (
                  <SelectItem key={stop.id} value={String(stop.id)}>
                    {stop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stop_id && (
              <p className="text-sm text-red-500">{errors.stop_id.message}</p>
            )}
          </div>

          {/* Location Description */}
          <div className="space-y-2">
            <Label htmlFor="location">Physical Location (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Main pole near bus shelter"
              {...register('location')}
            />
            <p className="text-xs text-muted-foreground">
              Describe where the display is physically installed
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watchedStatus}
              onValueChange={(value) => setValue('status', value as 'online' | 'offline' | 'error')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Online
                  </div>
                </SelectItem>
                <SelectItem value="offline">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                    Offline
                  </div>
                </SelectItem>
                <SelectItem value="error">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Error
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Display' : 'Add Display'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DisplayModal;
