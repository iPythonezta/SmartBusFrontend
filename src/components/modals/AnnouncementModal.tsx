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
import { Megaphone, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { routesApi } from '@/services/api';
import type { Announcement, Route as RouteType } from '@/types';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  message_ur: z.string().optional(),
  severity: z.enum(['info', 'warning', 'emergency']),
  route_ids: z.array(z.string()),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: 'End time must be after start time',
  path: ['end_time'],
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AnnouncementFormData) => void;
  announcement?: Announcement | null;
  isLoading?: boolean;
}

const severityOptions = [
  { value: 'info', label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-700' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'emergency', label: 'Emergency', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
];

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  announcement,
  isLoading,
}) => {
  const isEditing = !!announcement;
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routesApi.getRoutes(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      message: '',
      message_ur: '',
      severity: 'info',
      route_ids: [],
      start_time: '',
      end_time: '',
    },
  });

  const watchedSeverity = watch('severity');

  // Helper to format datetime for input
  const formatDateTimeLocal = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  // Reset form when modal opens/closes or announcement changes
  useEffect(() => {
    if (isOpen) {
      if (announcement) {
        setSelectedRouteIds(announcement.route_ids || []);
        reset({
          title: announcement.title,
          message: announcement.message,
          message_ur: announcement.message_ur || '',
          severity: announcement.severity,
          route_ids: announcement.route_ids || [],
          start_time: formatDateTimeLocal(new Date(announcement.start_time)),
          end_time: formatDateTimeLocal(new Date(announcement.end_time)),
        });
      } else {
        // Default: start now, end in 24 hours
        const now = new Date();
        const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        setSelectedRouteIds([]);
        reset({
          title: '',
          message: '',
          message_ur: '',
          severity: 'info',
          route_ids: [],
          start_time: formatDateTimeLocal(now),
          end_time: formatDateTimeLocal(endDate),
        });
      }
    }
  }, [isOpen, announcement, reset]);

  // Sync selected routes with form
  useEffect(() => {
    setValue('route_ids', selectedRouteIds);
  }, [selectedRouteIds, setValue]);

  const toggleRoute = (routeId: string) => {
    setSelectedRouteIds(prev => 
      prev.includes(routeId) 
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  const selectAllRoutes = () => {
    if (routes) {
      setSelectedRouteIds(routes.map(r => String(r.id)));
    }
  };

  const clearAllRoutes = () => {
    setSelectedRouteIds([]);
  };

  const handleFormSubmit = (data: AnnouncementFormData) => {
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {isEditing ? 'Edit Announcement' : 'Create Announcement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Service Disruption on Route 5"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (English) *</Label>
            <textarea
              id="message"
              placeholder="Enter the announcement message..."
              className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('message')}
            />
            {errors.message && (
              <p className="text-sm text-red-500">{errors.message.message}</p>
            )}
          </div>

          {/* Message Urdu (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="message_ur">Message (Urdu) - Optional</Label>
            <textarea
              id="message_ur"
              placeholder="اردو میں پیغام درج کریں..."
              className="w-full min-h-[60px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring text-right"
              dir="rtl"
              {...register('message_ur')}
            />
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label>Severity *</Label>
            <div className="grid grid-cols-3 gap-2">
              {severityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = watchedSeverity === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('severity', option.value as 'info' | 'warning' | 'emergency')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? `${option.color} border-current` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route Selection - Multi-Select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Target Routes</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllRoutes}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAllRoutes}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="border rounded-lg max-h-40 overflow-y-auto">
              {routes?.map((route: RouteType) => {
                const isSelected = selectedRouteIds.includes(String(route.id));
                return (
                  <div
                    key={route.id}
                    onClick={() => toggleRoute(String(route.id))}
                    className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div 
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: route.color || '#6B7280' }}
                    />
                    <span className="flex-1 text-sm">{route.name}</span>
                    <span className="text-xs text-muted-foreground">{route.code}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedRouteIds.length === 0 
                ? 'No routes selected - announcement will show on all routes'
                : `${selectedRouteIds.length} route${selectedRouteIds.length > 1 ? 's' : ''} selected`
              }
            </p>
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Announcement' : 'Create Announcement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementModal;
