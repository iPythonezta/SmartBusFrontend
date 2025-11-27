import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { routesApi, busesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Route as RouteIcon, MapPin, Bus } from 'lucide-react';
import { MapCanvas } from '@/components/map';
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
  const [sortedStops, setSortedStops] = React.useState<RouteStop[]>([]);

  const { data: route, isLoading: routeLoading } = useQuery({
    queryKey: ['route', id],
    queryFn: () => routesApi.getRoute(id!),
    enabled: !!id,
  });

  const { data: buses } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesApi.getBuses(),
  });

  const assignedBuses = buses?.filter((b) => b.assigned_route_id === id);

  // Initialize sorted stops
  React.useEffect(() => {
    if (route?.route_stops) {
      const sorted = [...route.route_stops].sort(
        (a, b) => a.sequence_number - b.sequence_number
      );
      setSortedStops(sorted);
    }
  }, [route]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSortedStops((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      // In real app, call API to update sequence
      // routesApi.reorderRouteStops(id!, reorderedIds)
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

  // Generate polyline from stops
  const routePolyline = sortedStops.length > 0
    ? {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: sortedStops.map((rs) => [
            rs.stop!.longitude,
            rs.stop!.latitude,
          ]),
        },
        properties: {
          color: route.color || '#14b8a6',
        },
      }
    : undefined;

  // Generate markers for stops
  const stopMarkers = sortedStops.map((rs, idx) => ({
    id: rs.id,
    longitude: rs.stop!.longitude,
    latitude: rs.stop!.latitude,
    color: route.color || '#14b8a6',
    label: `${idx + 1}. ${rs.stop!.name}`,
  }));

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
          <MapCanvas
            initialViewState={{
              longitude: sortedStops[0]?.stop?.longitude || 73.0479,
              latitude: sortedStops[0]?.stop?.latitude || 33.6844,
              zoom: 12,
            }}
            markers={stopMarkers}
            routePolyline={routePolyline}
            height="500px"
            interactive={false}
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
        <Button variant="outline">Edit Route</Button>
        <Button variant="outline">Manage Stops</Button>
        <Button variant="destructive" className="ml-auto">
          Delete Route
        </Button>
      </div>
    </div>
  );
};

export default RouteDetailPageEnhanced;
