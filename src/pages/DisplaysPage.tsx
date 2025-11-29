import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { displaysApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Plus, MapPin, Activity, Power, PowerOff, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import DisplayModal from '@/components/modals/DisplayModal';
import type { DisplayUnit } from '@/types';

const DisplaysPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState<DisplayUnit | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const { data: displays, isLoading } = useQuery({
    queryKey: ['displays'],
    queryFn: () => displaysApi.getDisplays(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; stop_id: string; location?: string; status: 'online' | 'offline' }) =>
      displaysApi.createDisplay(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['displays'] });
      setIsModalOpen(false);
      toast({
        title: 'Display Added',
        description: 'New display unit has been created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create display unit.',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DisplayUnit> }) =>
      displaysApi.updateDisplay(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['displays'] });
      setIsModalOpen(false);
      setEditingDisplay(null);
      toast({
        title: 'Display Updated',
        description: 'Display unit has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update display unit.',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => displaysApi.deleteDisplay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['displays'] });
      setDeleteConfirmId(null);
      toast({
        title: 'Display Deleted',
        description: 'Display unit has been removed.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete display unit.',
        variant: 'destructive',
      });
    },
  });

  const onlineCount = displays?.filter(d => d.status === 'online').length || 0;
  const offlineCount = (displays?.length || 0) - onlineCount;

  const handleAddClick = () => {
    setEditingDisplay(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (display: DisplayUnit) => {
    setEditingDisplay(display);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
    }
  };

  const handleModalSubmit = (data: { name: string; stop_id: string; location?: string; status: 'online' | 'offline' }) => {
    if (editingDisplay) {
      updateMutation.mutate({ id: editingDisplay.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('displays.title')}</h1>
            <p className="text-muted-foreground mt-1">Manage SMD display units</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('displays.title')}</h1>
          <p className="text-muted-foreground mt-1">Manage SMD display units</p>
        </div>
        <Button className="gap-2" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />
          {t('displays.addDisplay')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Displays</p>
                <p className="text-2xl font-bold">{displays?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Monitor className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Power className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-red-600">{offlineCount}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <PowerOff className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Displays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displays?.map((display, index) => (
          <motion.div
            key={display.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all hover:border-blue-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Monitor className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{display.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`h-2 w-2 rounded-full ${display.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className={`text-xs font-medium ${display.status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
                          {display.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{display.stop?.name || 'Unknown Stop'}</span>
                  </div>
                  
                  {display.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs">{display.location}</span>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation */}
                {deleteConfirmId === display.id ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                    <p className="text-sm text-red-700">Are you sure you want to delete this display?</p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={confirmDelete}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/smd-simulator/${display.id}`)}
                    >
                      <Monitor className="h-4 w-4 mr-1" />
                      Simulate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(display)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteClick(display.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {displays?.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Monitor className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Display Units</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first SMD display unit.</p>
            <Button onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add Display
            </Button>
          </div>
        </Card>
      )}

      {/* Display Modal */}
      <DisplayModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDisplay(null);
        }}
        onSubmit={handleModalSubmit}
        display={editingDisplay}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default DisplaysPage;
