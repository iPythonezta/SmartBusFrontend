import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { displaysApi } from '@/services/api';
import { useSMDStore } from '@/store';
import { formatDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bus,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  Globe,
  Maximize,
  Megaphone,
} from 'lucide-react';

const SMDSimulatorPage: React.FC = () => {
  const { displayId } = useParams();
  const { t } = useTranslation();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  
  const {
    isFullscreen,
    isOnline,
    currentLanguage: smdLanguage,
    emergencyOverride,
    setFullscreen: setIsFullscreen,
    setOnline: setIsOnline,
    setSMDLanguage,
    setEmergencyOverride,
  } = useSMDStore();

  const { data, isLoading } = useQuery({
    queryKey: ['display-simulation', displayId],
    queryFn: () => displaysApi.getDisplaySimulation(displayId!),
    enabled: !!displayId,
    refetchInterval: isOnline ? 8000 : false,
  });

  // Ad rotation
  useEffect(() => {
    if (data?.ads && data.ads.length > 0) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % data.ads.length);
      }, (data.ads[currentAdIndex]?.ad.duration_seconds || 10) * 1000);
      return () => clearInterval(interval);
    }
  }, [data?.ads, currentAdIndex]);

  // Fullscreen handler
  useEffect(() => {
    const handleFullscreen = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleFullscreen);
    return () => window.removeEventListener('keydown', handleFullscreen);
  }, [isFullscreen, setIsFullscreen]);

  // Toggle fullscreen API
  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    }
  }, [isFullscreen]);

  const currentTime = new Date();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading SMD Display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-950 ${isFullscreen ? 'p-0' : 'p-8'}`}>
      {/* Admin Controls */}
      {!isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white rounded-2xl p-4 shadow-xl"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">{t('smd.simulator')}</h2>
              <p className="text-muted-foreground">Display: {displayId}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={isOnline ? 'default' : 'outline'}
                onClick={() => setIsOnline(!isOnline)}
                className="gap-2"
              >
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {isOnline ? t('smd.online') : t('smd.offline')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSMDLanguage(smdLanguage === 'en' ? 'ur' : 'en')}
                className="gap-2"
              >
                <Globe className="h-4 w-4" />
                {smdLanguage === 'en' ? 'EN' : 'UR'}
              </Button>
              <Button
                variant={emergencyOverride ? 'destructive' : 'outline'}
                onClick={() => setEmergencyOverride(!emergencyOverride)}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                {t('smd.forceEmergency')}
              </Button>
              <Button variant="outline" onClick={() => setIsFullscreen(true)} className="gap-2">
                <Maximize className="h-4 w-4" />
                {t('smd.fullscreen')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* SMD Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${
          isFullscreen ? 'w-full h-screen' : 'max-w-7xl mx-auto aspect-video'
        } bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl relative`}
        dir={smdLanguage === 'ur' ? 'rtl' : 'ltr'}
      >
        {/* Emergency Banner */}
        <AnimatePresence>
          {(emergencyOverride || data?.announcements?.some((a) => a.severity === 'emergency')) && (
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className="absolute top-0 left-0 right-0 bg-red-600 text-white py-4 px-8 z-50 flex items-center gap-4"
            >
              <AlertCircle className="h-8 w-8 animate-pulse" />
              <div className="flex-1">
                <p className="text-2xl font-bold">
                  {smdLanguage === 'en' ? 'EMERGENCY ALERT' : 'ایمرجنسی الرٹ'}
                </p>
                <p className="text-lg">
                  {smdLanguage === 'en'
                    ? data?.announcements?.[0]?.message
                    : data?.announcements?.[0]?.message_ur || 'Emergency announcement active'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent px-8 py-4 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Bus className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl">
                {smdLanguage === 'en' ? 'Smart Bus Islamabad' : 'سمارٹ بس اسلام آباد'}
              </h1>
              <p className="text-gray-300 text-sm">{data?.stop?.name || 'Loading...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white text-3xl font-bold smd-display">
                {currentTime.toLocaleTimeString(smdLanguage, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-gray-300 text-sm">
                {currentTime.toLocaleDateString(smdLanguage, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
            <div
              className={`h-3 w-3 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="absolute inset-0 pt-24 pb-32 px-8 flex gap-6">
          {/* Left: Route Info */}
          <div className="w-1/4 flex flex-col justify-center">
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl p-8 text-white text-center shadow-2xl">
              <p className="text-sm opacity-80 mb-2">
                {smdLanguage === 'en' ? 'Route' : 'راستہ'}
              </p>
              <div className="text-7xl font-bold mb-2">{data?.route?.code || '—'}</div>
              <p className="text-xl">{data?.route?.name || 'No Route'}</p>
            </div>
          </div>

          {/* Center: ETAs */}
          <div className="flex-1 flex flex-col justify-center gap-4">
            <h2 className="text-white text-3xl font-bold mb-2">
              {smdLanguage === 'en' ? 'Next Buses' : 'اگلی بسیں'}
            </h2>
            <AnimatePresence mode="popLayout">
              {data?.etas?.slice(0, 3).map((eta, idx) => (
                <motion.div
                  key={eta.stop_id + idx}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex items-center justify-between border border-white/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <Bus className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-2xl font-bold">
                        {Math.round(eta.eta_minutes)}{' '}
                        {smdLanguage === 'en' ? 'min' : 'منٹ'}
                      </p>
                      <p className="text-gray-300">
                        {formatDistance(eta.distance_meters, smdLanguage)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        eta.status === 'ontime'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-orange-500/20 text-orange-300'
                      }`}
                    >
                      <Clock className="h-5 w-5 inline mr-2" />
                      {smdLanguage === 'en'
                        ? eta.status === 'ontime'
                          ? 'On Time'
                          : 'Delayed'
                        : eta.status === 'ontime'
                        ? 'وقت پر'
                        : 'تاخیر'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {(!data?.etas || data.etas.length === 0) && (
              <div className="text-center text-gray-400 text-xl py-12">
                {smdLanguage === 'en' ? 'No buses scheduled' : 'کوئی بس شیڈول نہیں'}
              </div>
            )}
          </div>

          {/* Right: Mini Map */}
          <div className="w-1/4 flex flex-col justify-center">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-4 border border-white/10">
              <div className="aspect-square bg-gradient-to-br from-teal-900/50 to-blue-900/50 rounded-2xl flex items-center justify-center">
                <MapPin className="h-16 w-16 text-teal-400" />
              </div>
              <p className="text-white text-center mt-4 text-sm opacity-75">
                {smdLanguage === 'en' ? 'Route Map' : 'راستے کا نقشہ'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Ad Carousel */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent px-8 pb-4 flex items-end">
          <AnimatePresence mode="wait">
            {data?.ads && data.ads.length > 0 && (
              <motion.div
                key={currentAdIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full bg-white/10 backdrop-blur-lg rounded-2xl p-4 flex items-center gap-4 border border-white/20"
              >
                <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Megaphone className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-lg">
                    {data.ads[currentAdIndex]?.ad.title}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {smdLanguage === 'en' ? 'Advertisement' : 'اشتہار'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Offline Overlay */}
        {!isOnline && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="text-center">
              <WifiOff className="h-24 w-24 text-red-500 mx-auto mb-4" />
              <p className="text-white text-3xl font-bold">
                {smdLanguage === 'en' ? 'Display Offline' : 'ڈسپلے آف لائن'}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SMDSimulatorPage;
