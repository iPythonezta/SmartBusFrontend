import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routesApi, busesApi, stopsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Route as RouteIcon, MapPin, Bus, Plus, Trash2, Loader2 } from 'lucide-react';
import { MapboxMap } from '@/components/map/MapboxMap';
import { RouteModal } from '@/components/modals/RouteModal';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { RouteStop } from '@/types';

interface SortableStopItemProps {
  stop: RouteStop;
  index: number;
}

const SortableStopItem: React.FC<SortableStopItemProps> = ({ stop, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-move"
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-teal-100 text-teal-700 font-bold text-sm flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1">
        <p className="font-medium">{stop.stop?.name || 'Unknown Stop'}</p>
        {stop.distance_from_prev && index > 0 && (
          <p className="text-xs text-muted-foreground">
            {stop.distance_from_prev}m from previous stop
          </p>
        )}
      </div>
      <MapPin className="h-4 w-4 text-muted-foreground" />
    </div>
  );
};

const RouteDetailPageEnhanced: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sortedStops, setSortedStops] = useState<RouteStop[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageStopsDialog, setShowManageStopsDialog] = useState(false);
  const [selectedStopToAdd, setSelectedStopToAdd] = useState<string>('');

  // Parse route ID as number
  const routeId = id ? parseInt(id, 10) : undefined;

  const { data: route, isLoading: routeLoading } = useQuery({
    queryKey: ['route', routeId],
    queryFn: () => routesApi.getRoute(routeId!),
    enabled: !!routeId,
  });

  const { data: buses } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesApi.getBuses(),
  });

  const { data: allStops } = useQuery({
    queryKey: ['stops'],
    queryFn: () => stopsApi.getStops(),
  });

  const assignedBuses = buses?.filter((b) => b.route_id === routeId);

  // Get available stops (not already in this route)
  const availableStops = allStops?.filter(
    (stop) => !sortedStops.some((rs) => rs.stop_id === stop.id)
  );

  // Initialize sorted stops
  React.useEffect(() => {
    if (route?.route_stops) {
      const sorted = [...route.route_stops].sort(
        (a, b) => a.sequence_number - b.sequence_number
      );
      setSortedStops(sorted);
    }
  }, [route]);

  // Delete route mutation
  const deleteMutation = useMutation({
    mutationFn: () => routesApi.deleteRoute(routeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast({
        title: 'Success',
        description: 'Route deleted successfully',
      });
      navigate('/routes');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete route',
        variant: 'destructive',
      });
    },
  });

  // Add stop to route mutation
  const addStopMutation = useMutation({
    mutationFn: ({ stopId }: { stopId: number }) =>
      routesApi.addStopToRoute(routeId!, { stop_id: stopId, sequence_number: sortedStops.length + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route', routeId] });
      toast({
        title: 'Success',
        description: 'Stop added to route',
      });
      setSelectedStopToAdd('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add stop',
        variant: 'destructive',
      });
    },
  });

  // Remove stop from route mutation
  const removeStopMutation = useMutation({
    mutationFn: ({ routeStopId }: { routeStopId: number }) =>
      routesApi.removeStopFromRoute(routeId!, routeStopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route', routeId] });
      toast({
        title: 'Success',
        description: 'Stop removed from route',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove stop',
        variant: 'destructive',
      });
    },
  });

  // Reorder stops mutation
  const reorderStopsMutation = useMutation({
    mutationFn: (routeStopIds: number[]) =>
      routesApi.reorderRouteStops(routeId!, routeStopIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route', routeId] });
      toast({
        title: 'Success',
        description: 'Stops reordered successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reorder stops',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteRoute = () => {
    deleteMutation.mutate();
  };

  const handleAddStop = () => {
    if (selectedStopToAdd) {
      addStopMutation.mutate({ stopId: parseInt(selectedStopToAdd, 10) });
    }
  };

  const handleRemoveStop = (routeStopId: number) => {
    removeStopMutation.mutate({ routeStopId });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedStops.findIndex((item) => item.id === active.id);
      const newIndex = sortedStops.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(sortedStops, oldIndex, newIndex);
      
      // Optimistically update UI
      setSortedStops(reordered);
      
      // Call API to persist the new order
      const reorderedIds = reordered.map((rs) => rs.id);
      reorderStopsMutation.mutate(reorderedIds);
    }
  };

  if (routeLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/routes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="animate-pulse">
          <CardContent className="h-64"></CardContent>
        </Card>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/routes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <RouteIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Route not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get stops for the map
  const mapStops = sortedStops
    .filter(rs => rs.stop)
    .map(rs => rs.stop!);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/routes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{route.name}</h1>
              {route.color && (
                <div
                  className="h-8 w-8 rounded"
                  style={{ backgroundColor: route.color }}
                ></div>
              )}
            </div>
            <p className="text-muted-foreground">{route.code}</p>
          </div>
        </div>
      </div>

      {route.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{route.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Stops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-600" />
              <p className="text-2xl font-bold">{sortedStops.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Assigned Buses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-blue-600" />
              <p className="text-2xl font-bold">{assignedBuses?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Route Code</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-mono font-bold">{route.code}</p>
          </CardContent>
        </Card>
      </div>

      {/* Route Map */}
      <Card>
        <CardHeader>
          <CardTitle>Route Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <MapboxMap
            initialViewState={{
              longitude: sortedStops[0]?.stop?.longitude || 73.0479,
              latitude: sortedStops[0]?.stop?.latitude || 33.6844,
              zoom: 12,
            }}
            stops={mapStops}
            showRoute={mapStops.length >= 2}
            routeColor={route.color || '#14b8a6'}
            height="500px"
            interactive={true}
            showControls={true}
          />
        </CardContent>
      </Card>

      {/* Drag & Drop Stop Ordering */}
      <Card>
        <CardHeader>
          <CardTitle>Route Stops (Drag to Reorder)</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedStops.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sortedStops.map((routeStop, index) => (
                  <SortableStopItem
                    key={routeStop.id}
                    stop={routeStop}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {assignedBuses && assignedBuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Buses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assignedBuses.map((bus) => (
                <motion.div
                  key={bus.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/buses/${bus.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Bus className="h-5 w-5 text-teal-600" />
                    <div>
                      <p className="font-medium">{bus.registration_number}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {bus.status}
                      </p>
                    </div>
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setShowEditModal(true)}>
          Edit Route
        </Button>
        <Button variant="outline" onClick={() => setShowManageStopsDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Manage Stops
        </Button>
        <Button
          variant="destructive"
          className="ml-auto"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Route
        </Button>
      </div>

      {/* Edit Route Modal */}
      <RouteModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        route={route}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Route</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{route?.name}"? This action cannot be undone.
              All stops will be unassigned from this route.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRoute}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Stops Dialog */}
      <Dialog open={showManageStopsDialog} onOpenChange={setShowManageStopsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Route Stops</DialogTitle>
            <DialogDescription>
              Add or remove stops from this route. Drag stops in the list above to reorder them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add New Stop */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add a Stop</label>
              <div className="flex gap-2">
                <Select value={selectedStopToAdd} onValueChange={setSelectedStopToAdd}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a stop to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStops?.map((stop) => (
                      <SelectItem key={stop.id} value={String(stop.id)}>
                        {stop.name}
                      </SelectItem>
                    ))}
                    {(!availableStops || availableStops.length === 0) && (
                      <SelectItem value="none" disabled>
                        No more stops available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddStop}
                  disabled={!selectedStopToAdd || addStopMutation.isPending}
                >
                  {addStopMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Current Stops */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Stops ({sortedStops.length})</label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {sortedStops.map((rs, index) => (
                  <div
                    key={rs.id}
                    className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-teal-100 text-teal-700 font-bold text-xs">
                        {index + 1}
                      </span>
                      <span className="text-sm">{rs.stop?.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      disabled={removeStopMutation.isPending}
                      onClick={() => handleRemoveStop(rs.id)}
                    >
                      {removeStopMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
                {sortedStops.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No stops added yet. Add some stops to define the route.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowManageStopsDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RouteDetailPageEnhanced;
