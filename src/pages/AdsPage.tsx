import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Image, Calendar, CheckCircle, Clock, Star, Pencil, Trash2, Youtube, Search, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import AdModal from '@/components/modals/AdModal';
import AdScheduleModal from '@/components/modals/AdScheduleModal';
import type { Advertisement, AdSchedule, CreateAdInput, CreateAdScheduleInput } from '@/types';

// Helper to get YouTube thumbnail
const getYouTubeThumbnail = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return null;
};

const AdsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Modal state
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AdSchedule | null>(null);
  const [schedulingAdId, setSchedulingAdId] = useState<number | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteScheduleConfirmId, setDeleteScheduleConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: ads, isLoading: adsLoading } = useQuery({
    queryKey: ['ads'],
    queryFn: () => adsApi.getAds(),
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['ad-schedules'],
    queryFn: () => adsApi.getSchedules(),
  });

  // Filter ads by search query
  const filteredAds = useMemo(() => {
    if (!ads) return [];
    if (!searchQuery.trim()) return ads;
    
    const query = searchQuery.toLowerCase();
    return ads.filter(ad => 
      ad.title.toLowerCase().includes(query) ||
      ad.advertiser_name?.toLowerCase().includes(query) ||
      ad.media_type.toLowerCase().includes(query)
    );
  }, [ads, searchQuery]);

  // Ad mutations
  const createAdMutation = useMutation({
    mutationFn: (data: CreateAdInput) => adsApi.createAd(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      setIsAdModalOpen(false);
      toast({ title: 'Ad Created', description: 'Advertisement has been added successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create advertisement.', variant: 'destructive' });
    },
  });

  const updateAdMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Advertisement> }) => adsApi.updateAd(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['ad-schedules'] });
      setIsAdModalOpen(false);
      setEditingAd(null);
      toast({ title: 'Ad Updated', description: 'Advertisement has been updated successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update advertisement.', variant: 'destructive' });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: (id: number) => adsApi.deleteAd(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['ad-schedules'] });
      setDeleteConfirmId(null);
      toast({ title: 'Ad Deleted', description: 'Advertisement has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete advertisement.', variant: 'destructive' });
    },
  });

  // Schedule mutations
  const createScheduleMutation = useMutation({
    mutationFn: (data: CreateAdScheduleInput) => adsApi.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-schedules'] });
      setIsScheduleModalOpen(false);
      setSchedulingAdId(undefined);
      toast({ title: 'Schedule Created', description: 'Ad schedule has been created successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create schedule.', variant: 'destructive' });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdSchedule> }) => adsApi.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-schedules'] });
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
      toast({ title: 'Schedule Updated', description: 'Ad schedule has been updated successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update schedule.', variant: 'destructive' });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: number) => adsApi.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-schedules'] });
      setDeleteScheduleConfirmId(null);
      toast({ title: 'Schedule Deleted', description: 'Ad schedule has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete schedule.', variant: 'destructive' });
    },
  });

  const isLoading = adsLoading || schedulesLoading;

  const isScheduleActive = (startTime: string, endTime: string) => {
    const now = new Date();
    return now >= new Date(startTime) && now <= new Date(endTime);
  };

  // Handlers
  const handleAddAd = () => {
    setEditingAd(null);
    setIsAdModalOpen(true);
  };

  const handleEditAd = (ad: Advertisement) => {
    setEditingAd(ad);
    setIsAdModalOpen(true);
  };

  const handleScheduleAd = (adId: number) => {
    setEditingSchedule(null);
    setSchedulingAdId(adId);
    setIsScheduleModalOpen(true);
  };

  const handleAdModalSubmit = (data: CreateAdInput) => {
    if (editingAd) {
      updateAdMutation.mutate({ id: editingAd.id, data });
    } else {
      createAdMutation.mutate(data);
    }
  };

  const handleScheduleModalSubmit = (data: CreateAdScheduleInput) => {
    if (editingSchedule) {
      updateScheduleMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createScheduleMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('ads.title')}</h1>
            <p className="text-muted-foreground mt-1">Manage advertisements and promotions</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded w-full"></div>
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
          <h1 className="text-3xl font-bold">{t('ads.title')}</h1>
          <p className="text-muted-foreground mt-1">Manage advertisements and promotions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button className="gap-2" onClick={handleAddAd}>
            <Plus className="h-4 w-4" />
            Upload Ad
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ads</p>
                <p className="text-2xl font-bold">{ads?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{schedules?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-green-600">
                  {schedules?.filter(s => isScheduleActive(s.start_time, s.end_time)).length || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ad Schedules Section */}
      {schedules && schedules.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Ad Schedules
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules.map((schedule) => {
                const ad = ads?.find(a => a.id === schedule.ad_id);
                const isActive = isScheduleActive(schedule.start_time, schedule.end_time);
                
                return (
                  <div
                    key={schedule.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium text-sm">{ad?.title || 'Unknown Ad'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(schedule.start_time).toLocaleString()} - {new Date(schedule.end_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        Priority: {schedule.priority}
                      </span>
                      
                      {deleteScheduleConfirmId === schedule.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                            disabled={deleteScheduleMutation.isPending}
                          >
                            {deleteScheduleMutation.isPending ? '...' : 'Yes'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteScheduleConfirmId(null)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSchedule(schedule);
                              setSchedulingAdId(undefined);
                              setIsScheduleModalOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteScheduleConfirmId(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAds?.map((ad, index) => {
          const adSchedules = schedules?.filter(s => s.ad_id === ad.id) || [];
          const activeSchedule = adSchedules.find(s => isScheduleActive(s.start_time, s.end_time));
          const isYouTube = ad.media_type === 'youtube';
          const thumbnail = isYouTube ? getYouTubeThumbnail(ad.content_url) : ad.content_url;
          
          return (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all hover:border-purple-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{ad.title}</CardTitle>
                    {activeSchedule && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                      isYouTube ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {isYouTube ? <Youtube className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                      {ad.media_type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {thumbnail ? (
                      <>
                        <img src={thumbnail} alt={ad.title} className="w-full h-full object-cover" />
                        {isYouTube && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="bg-red-600 rounded-full p-2">
                              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <Image className="h-12 w-12 text-purple-300" />
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Duration: {ad.duration_seconds}s</span>
                    </div>
                    
                    {ad.advertiser_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="text-xs">{ad.advertiser_name}</span>
                      </div>
                    )}
                    
                    {adSchedules.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs">{adSchedules.length} schedule(s)</span>
                      </div>
                    )}

                    {activeSchedule && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span className="text-xs">Priority: {activeSchedule.priority}</span>
                      </div>
                    )}
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirmId === ad.id ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                      <p className="text-sm text-red-700">Delete this ad and all its schedules?</p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAdMutation.mutate(ad.id)}
                          disabled={deleteAdMutation.isPending}
                        >
                          {deleteAdMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
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
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleScheduleAd(ad.id)}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAd(ad)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteConfirmId(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {ads?.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Advertisements</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first advertisement.</p>
            <Button onClick={handleAddAd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Advertisement
            </Button>
          </div>
        </Card>
      )}

      {/* Ad Modal */}
      <AdModal
        isOpen={isAdModalOpen}
        onClose={() => {
          setIsAdModalOpen(false);
          setEditingAd(null);
        }}
        onSubmit={handleAdModalSubmit}
        ad={editingAd}
        isLoading={createAdMutation.isPending || updateAdMutation.isPending}
      />

      {/* Schedule Modal */}
      <AdScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
          setSchedulingAdId(undefined);
        }}
        onSubmit={handleScheduleModalSubmit}
        ads={ads || []}
        schedule={editingSchedule}
        preselectedAdId={schedulingAdId}
        isLoading={createScheduleMutation.isPending || updateScheduleMutation.isPending}
      />
    </div>
  );
};

export default AdsPage;
