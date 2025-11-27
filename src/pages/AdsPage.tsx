import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Image, Calendar, CheckCircle, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const AdsPage: React.FC = () => {
  const { t } = useTranslation();
  
  const { data: ads, isLoading: adsLoading } = useQuery({
    queryKey: ['ads'],
    queryFn: () => adsApi.getAds(),
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['ad-schedules'],
    queryFn: () => adsApi.getSchedules(),
  });

  const isLoading = adsLoading || schedulesLoading;

  const isScheduleActive = (startTime: string, endTime: string) => {
    const now = new Date();
    return now >= new Date(startTime) && now <= new Date(endTime);
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('ads.uploadAd')}
        </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads?.map((ad, index) => {
          const adSchedules = schedules?.filter(s => s.ad_id === ad.id) || [];
          const activeSchedule = adSchedules.find(s => isScheduleActive(s.start_time, s.end_time));
          
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
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      {ad.media_type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {ad.content_url ? (
                      <img src={ad.content_url} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="h-12 w-12 text-purple-300" />
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Duration: {ad.duration_seconds}s</span>
                    </div>
                    
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

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Schedule
                    </Button>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AdsPage;
