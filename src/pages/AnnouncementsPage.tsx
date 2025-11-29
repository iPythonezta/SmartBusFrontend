import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi, routesApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, AlertTriangle, Info, AlertCircle, Calendar, Route, Pencil, Trash2, Search, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import AnnouncementModal from '@/components/modals/AnnouncementModal';
import type { Announcement, CreateAnnouncementInput } from '@/types';

const AnnouncementsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsApi.getAnnouncements(),
  });

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routesApi.getRoutes(),
  });

  // Filter announcements by search query
  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    if (!searchQuery.trim()) return announcements;
    
    const query = searchQuery.toLowerCase();
    return announcements.filter(a => 
      a.title.toLowerCase().includes(query) ||
      a.message.toLowerCase().includes(query) ||
      a.severity.toLowerCase().includes(query)
    );
  }, [announcements, searchQuery]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateAnnouncementInput) => announcementsApi.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsModalOpen(false);
      toast({ title: 'Announcement Created', description: 'The announcement has been created successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create announcement.', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Announcement> }) => 
      announcementsApi.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsModalOpen(false);
      setEditingAnnouncement(null);
      toast({ title: 'Announcement Updated', description: 'The announcement has been updated successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update announcement.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setDeleteConfirmId(null);
      toast({ title: 'Announcement Deleted', description: 'The announcement has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete announcement.', variant: 'destructive' });
    },
  });

  const handleAdd = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      deleteMutation.mutate(id);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const handleModalSubmit = (data: CreateAnnouncementInput) => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'bg-red-100 text-red-700 border-red-300';
      case 'warning': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'info': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'emergency': return AlertCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getRouteNames = (routeIds: string[]) => {
    if (!routes || routeIds.length === 0) return 'All Routes';
    return routeIds
      .map(id => routes.find(r => String(r.id) === id)?.name)
      .filter(Boolean)
      .join(', ') || 'All Routes';
  };

  const isActive = (startTime: string, endTime: string) => {
    const now = new Date();
    return new Date(startTime) <= now && new Date(endTime) >= now;
  };

  const infoCount = announcements?.filter(a => a.severity === 'info').length || 0;
  const warningCount = announcements?.filter(a => a.severity === 'warning').length || 0;
  const emergencyCount = announcements?.filter(a => a.severity === 'emergency').length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('announcements.title')}</h1>
            <p className="text-muted-foreground mt-1">Manage system announcements and alerts</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
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
          <h1 className="text-3xl font-bold">{t('announcements.title')}</h1>
          <p className="text-muted-foreground mt-1">Manage system announcements and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Add Announcement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{announcements?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Info</p>
                <p className="text-2xl font-bold text-blue-600">{infoCount}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warning</p>
                <p className="text-2xl font-bold text-orange-600">{warningCount}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emergency</p>
                <p className="text-2xl font-bold text-red-600">{emergencyCount}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAnnouncements?.map((announcement, index) => {
          const SeverityIcon = getSeverityIcon(announcement.severity);
          const announcementActive = isActive(announcement.start_time, announcement.end_time);
          
          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`hover:shadow-lg transition-all border-l-4 ${getSeverityColor(announcement.severity)}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getSeverityColor(announcement.severity)}`}>
                        <SeverityIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          {announcementActive && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{announcement.message}</p>
                        {announcement.message_ur && (
                          <p className="text-sm text-muted-foreground mt-1 font-urdu" dir="rtl">{announcement.message_ur}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getSeverityColor(announcement.severity)}`}>
                      {announcement.severity}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <p className="text-xs">Start: {new Date(announcement.start_time).toLocaleString()}</p>
                        <p className="text-xs">End: {new Date(announcement.end_time).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Route className="h-4 w-4" />
                      <div>
                        <p className="text-xs font-medium">Routes</p>
                        <p className="text-xs">{getRouteNames(announcement.route_ids || [])}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <p className="text-xs">Created: {new Date(announcement.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => handleEdit(announcement)}>
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`gap-1 ${deleteConfirmId === announcement.id ? 'bg-red-100 text-red-700' : 'text-red-600 hover:text-red-700'}`}
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      {deleteConfirmId === announcement.id ? 'Confirm Delete?' : 'Delete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredAnnouncements?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Announcements Found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery ? 'Try a different search term' : 'Create your first announcement to get started'}
              </p>
              {!searchQuery && (
                <Button className="mt-4 gap-2" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  Add Announcement
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSubmit={handleModalSubmit}
        announcement={editingAnnouncement}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default AnnouncementsPage;
