import React, { useEffect, useState } from 'react';
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
import { Calendar, Monitor, Check } from 'lucide-react';
import { displaysApi } from '@/services/api';
import type { Advertisement, AdSchedule, DisplayUnit } from '@/types';

const scheduleSchema = z.object({
  ad_id: z.string().min(1, 'Ad is required'),
  display_ids: z.array(z.string()).min(1, 'At least one display is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  priority: z.number().min(1, 'Priority must be at least 1').max(10, 'Priority cannot exceed 10'),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: 'End time must be after start time',
  path: ['end_time'],
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface AdScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => void;
  ads: Advertisement[];
  schedule?: AdSchedule | null;
  preselectedAdId?: string;
  isLoading?: boolean;
}

const AdScheduleModal: React.FC<AdScheduleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ads,
  schedule,
  preselectedAdId,
  isLoading,
}) => {
  const isEditing = !!schedule;
  const [selectedDisplayIds, setSelectedDisplayIds] = useState<string[]>([]);

  const { data: displays } = useQuery({
    queryKey: ['displays'],
    queryFn: () => displaysApi.getDisplays(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      ad_id: '',
      display_ids: [],
      start_time: '',
      end_time: '',
      priority: 1,
    },
  });

  const watchedAdId = watch('ad_id');
  const selectedAd = ads.find(a => a.id === watchedAdId);

  // Helper to format datetime for input
  const formatDateTimeLocal = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  // Reset form when modal opens/closes or schedule changes
  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        // Editing single schedule
        setSelectedDisplayIds([schedule.display_id]);
        reset({
          ad_id: schedule.ad_id,
          display_ids: [schedule.display_id],
          start_time: formatDateTimeLocal(new Date(schedule.start_time)),
          end_time: formatDateTimeLocal(new Date(schedule.end_time)),
          priority: schedule.priority,
        });
      } else {
        // Default: start now, end in 7 days
        const now = new Date();
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        setSelectedDisplayIds([]);
        reset({
          ad_id: preselectedAdId || '',
          display_ids: [],
          start_time: formatDateTimeLocal(now),
          end_time: formatDateTimeLocal(endDate),
          priority: 1,
        });
      }
    }
  }, [isOpen, schedule, preselectedAdId, reset]);

  // Sync selected displays with form
  useEffect(() => {
    setValue('display_ids', selectedDisplayIds);
  }, [selectedDisplayIds, setValue]);

  const toggleDisplay = (displayId: string) => {
    setSelectedDisplayIds(prev => 
      prev.includes(displayId) 
        ? prev.filter(id => id !== displayId)
        : [...prev, displayId]
    );
  };

  const selectAllDisplays = () => {
    if (displays) {
      setSelectedDisplayIds(displays.map(d => d.id));
    }
  };

  const clearAllDisplays = () => {
    setSelectedDisplayIds([]);
  };

  const handleFormSubmit = (data: ScheduleFormData) => {
    // Convert to ISO strings
    const submitData = {
      ...data,
      start_time: new Date(data.start_time).toISOString(),
      end_time: new Date(data.end_time).toISOString(),
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEditing ? 'Edit Schedule' : 'Schedule Advertisement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Ad Selection */}
          <div className="space-y-2">
            <Label htmlFor="ad_id">Advertisement *</Label>
            <Select
              value={watchedAdId}
              onValueChange={(value) => setValue('ad_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an ad" />
              </SelectTrigger>
              <SelectContent>
                {ads.map((ad) => (
                  <SelectItem key={ad.id} value={ad.id}>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        ad.media_type === 'youtube' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {ad.media_type}
                      </span>
                      {ad.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ad_id && (
              <p className="text-sm text-red-500">{errors.ad_id.message}</p>
            )}
            {selectedAd && (
              <p className="text-xs text-muted-foreground">
                Duration: {selectedAd.duration_seconds}s • Type: {selectedAd.media_type}
              </p>
            )}
          </div>

          {/* Display Selection - Multi-Select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Display Units *</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllDisplays}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAllDisplays}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="border rounded-lg max-h-40 overflow-y-auto">
              {displays?.map((display: DisplayUnit) => {
                const isSelected = selectedDisplayIds.includes(display.id);
                return (
                  <div
                    key={display.id}
                    onClick={() => toggleDisplay(display.id)}
                    className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <Monitor className="h-4 w-4 text-gray-500" />
                    <span className="flex-1 text-sm">{display.name}</span>
                    <span className={`h-2 w-2 rounded-full ${
                      display.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                );
              })}
            </div>
            {selectedDisplayIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedDisplayIds.length} display{selectedDisplayIds.length > 1 ? 's' : ''} selected
              </p>
            )}
            {errors.display_ids && (
              <p className="text-sm text-red-500">{errors.display_ids.message}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                {...register('start_time')}
              />
              {errors.start_time && (
                <p className="text-sm text-red-500">{errors.start_time.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                {...register('end_time')}
              />
              {errors.end_time && (
                <p className="text-sm text-red-500">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority (1-10) *</Label>
            <Input
              id="priority"
              type="number"
              min={1}
              max={10}
              {...register('priority', { valueAsNumber: true })}
            />
            {errors.priority && (
              <p className="text-sm text-red-500">{errors.priority.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Higher priority ads are shown more frequently. 1 = lowest, 10 = highest
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdScheduleModal;
