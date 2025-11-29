import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { busesApi, routesApi } from '@/services/api';
import type { Bus } from '@/types';
import { useQuery } from '@tanstack/react-query';

const busSchema = z.object({
  registration_number: z
    .string()
    .min(3, 'Registration number must be at least 3 characters')
    .max(20, 'Registration number must not exceed 20 characters'),
  capacity: z
    .number()
    .min(10, 'Capacity must be at least 10')
    .max(100, 'Capacity must not exceed 100'),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  route_id: z.number().nullable().optional(),
});

type BusFormData = z.infer<typeof busSchema>;

interface BusModalProps {
  open: boolean;
  onClose: () => void;
  bus?: Bus | null;
}

export const BusModal: React.FC<BusModalProps> = ({ open, onClose, bus }) => {
  const queryClient = useQueryClient();
  const isEdit = !!bus;

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routesApi.getRoutes(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BusFormData>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      registration_number: '',
      capacity: 50,
      status: 'inactive',
      route_id: null,
    },
  });

  const statusValue = watch('status');
  const routeId = watch('route_id');

  useEffect(() => {
    if (bus) {
      reset({
        registration_number: bus.registration_number,
        capacity: bus.capacity,
        status: bus.status as 'active' | 'inactive' | 'maintenance',
        route_id: bus.route_id || null,
      });
    } else {
      reset({
        registration_number: '',
        capacity: 50,
        status: 'inactive',
        route_id: null,
      });
    }
  }, [bus, reset]);

  const createMutation = useMutation({
    mutationFn: (data: BusFormData) => busesApi.createBus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      toast({
        title: 'Success',
        description: 'Bus created successfully',
      });
      onClose();
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bus',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BusFormData) => busesApi.updateBus(bus!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['bus', bus!.id] });
      toast({
        title: 'Success',
        description: 'Bus updated successfully',
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bus',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BusFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Registration Number */}
          <div className="space-y-2">
            <Label htmlFor="registration_number">
              Registration Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="registration_number"
              placeholder="e.g., ISB-1234"
              {...register('registration_number')}
            />
            {errors.registration_number && (
              <p className="text-sm text-red-500">{errors.registration_number.message}</p>
            )}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">
              Capacity (passengers) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="capacity"
              type="number"
              min={10}
              max={100}
              {...register('capacity', { valueAsNumber: true })}
            />
            {errors.capacity && (
              <p className="text-sm text-red-500">{errors.capacity.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={statusValue}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>

          {/* Assigned Route */}
          <div className="space-y-2">
            <Label htmlFor="route_id">Assigned Route (Optional)</Label>
            <Select
              value={routeId ? String(routeId) : 'none'}
              onValueChange={(value) => setValue('route_id', value === 'none' ? null : parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Route</SelectItem>
                {routes?.map((route) => (
                  <SelectItem key={route.id} value={String(route.id)}>
                    {route.name} ({route.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEdit
                ? 'Update Bus'
                : 'Create Bus'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
