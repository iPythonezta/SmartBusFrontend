import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { routesApi } from '@/services/api';
import type { Route } from '@/types';
import { Loader2 } from 'lucide-react';

const routeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code must not exceed 10 characters'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #14b8a6)'),
});

type RouteFormData = z.infer<typeof routeSchema>;

interface RouteModalProps {
  open: boolean;
  onClose: () => void;
  route?: Route | null;
}

export const RouteModal: React.FC<RouteModalProps> = ({ open, onClose, route }) => {
  const queryClient = useQueryClient();
  const isEdit = !!route;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      color: '#14b8a6',
    },
  });

  const colorValue = watch('color');

  useEffect(() => {
    if (route) {
      reset({
        name: route.name,
        code: route.code,
        description: route.description || '',
        color: route.color || '#14b8a6',
      });
    } else {
      reset({
        name: '',
        code: '',
        description: '',
        color: '#14b8a6',
      });
    }
  }, [route, reset, open]);

  const createMutation = useMutation({
    mutationFn: (data: RouteFormData) => routesApi.createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast({
        title: 'Success',
        description: 'Route created successfully',
      });
      onClose();
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create route',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RouteFormData) => routesApi.updateRoute(route!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route', route!.id] });
      toast({
        title: 'Success',
        description: 'Route updated successfully',
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update route',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: RouteFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Preset colors
  const presetColors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Route' : 'Add New Route'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the route details below.'
              : 'Create a new bus route. You can add stops after creating the route.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Route Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Blue Line"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Route Code *</Label>
            <Input
              id="code"
              placeholder="e.g., BL-01"
              {...register('code')}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g., Blue Area to Faizabad"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Route Color *</Label>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border-2 border-gray-300 flex-shrink-0"
                style={{ backgroundColor: colorValue }}
              />
              <Input
                type="text"
                placeholder="#14b8a6"
                {...register('color')}
                className="font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                    colorValue === color ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                />
              ))}
            </div>
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Route' : 'Create Route'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
