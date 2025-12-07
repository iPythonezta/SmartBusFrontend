import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Bus,
  Wifi,
  Signal,
  AlertTriangle,
  Maximize,
  Minimize,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Settings,
  Thermometer,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { displaysApi } from '@/services/api';
import type { UpcomingBus, DisplayAnnouncement, DisplayAdvertisement } from '@/types';

// =============================================================================
// DATA TYPES - Mapped from API responses
// =============================================================================

interface DisplayBus {
  bus_name: string;
  eta_minutes: number;
  status: 'arriving' | 'approaching' | 'on-route';
}

interface DisplayRoute {
  route_name: string;
  route_code: string;
  color: string;
  buses: DisplayBus[];
}

interface DisplayAnnouncementLocal {
  id: number;
  message: string;
  message_ur: string;
  severity: 'info' | 'warning' | 'emergency';
  title: string;
  active: boolean;
}

interface DisplayAdLocal {
  id: number;
  title: string;
  media_type: 'image' | 'youtube';
  content_url: string;
  duration_seconds: number;
}

// Helper to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// SMD Hardware Specs (for status display)
const SMD_SPECS = {
  resolution: '1920×1080',
  pitch: '3.9mm',
  brightness: '5000 nits',
  connectivity: '4G LTE',
  temperature: 42, // Simulated operating temp
  powerMode: 'Normal',
};

// =============================================================================
// HELPER FUNCTIONS - Transform API data to display format
// =============================================================================

// Group buses by route for display
const groupBusesByRoute = (buses: UpcomingBus[]): DisplayRoute[] => {
  const routeMap = new Map<number, DisplayRoute>();
  
  buses.forEach((bus) => {
    if (!routeMap.has(bus.route_id)) {
      routeMap.set(bus.route_id, {
        route_name: bus.route_name,
        route_code: bus.route_code,
        color: bus.route_color,
        buses: [],
      });
    }
    
    const route = routeMap.get(bus.route_id)!;
    route.buses.push({
      bus_name: bus.registration_number,
      eta_minutes: bus.eta_minutes,
      status: bus.arrival_status,
    });
  });
  
  // Sort buses within each route by ETA
  routeMap.forEach((route) => {
    route.buses.sort((a, b) => a.eta_minutes - b.eta_minutes);
  });
  
  return Array.from(routeMap.values());
};

// Transform announcements from API format
const transformAnnouncements = (announcements: DisplayAnnouncement[]): DisplayAnnouncementLocal[] => {
  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    message_ur: a.message_ur || a.message, // Fallback to English if no Urdu
    severity: a.severity,
    active: true, // API only returns active announcements
  }));
};

// Transform ads from API format
const transformAds = (ads: DisplayAdvertisement[]): DisplayAdLocal[] => {
  return ads.map((a) => ({
    id: a.id,
    title: a.title,
    media_type: a.media_type,
    content_url: a.content_url,
    duration_seconds: a.duration_seconds,
  }));
};

// =============================================================================
// SLIDE TYPES & TIMING
// =============================================================================

type SlideType = 'route' | 'announcement' | 'ad';

interface Slide {
  type: SlideType;
  data: DisplayRoute | DisplayAnnouncementLocal | DisplayAdLocal;
  duration: number; // in seconds
}

const ROUTE_SLIDE_DURATION = 10; // seconds
const ANNOUNCEMENT_SLIDE_DURATION = 8; // seconds
const MAX_AD_DURATION = 30; // seconds
const AD_BUDGET_PER_CYCLE = 60; // Total seconds for ads per cycle
const REFRESH_INTERVAL = 5000; // Refresh data every 5 seconds for live ETA updates

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const SMDSimulatorPage: React.FC = () => {
  // Get display ID from URL params
  const { displayId } = useParams<{ displayId: string }>();
  const numericDisplayId = displayId ? parseInt(displayId, 10) : null;

  // Fetch display content from API
  const { 
    data: displayContent, 
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['displayContent', numericDisplayId],
    queryFn: () => displaysApi.getDisplayContent(numericDisplayId!),
    enabled: !!numericDisplayId,
    refetchInterval: REFRESH_INTERVAL, // Auto-refresh every 5 seconds
    staleTime: 2000, // Consider data stale after 2 seconds
  });

  // State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [isMuted, setIsMuted] = useState(true); // Audio muted by default
  
  // Transformed data from API
  const [routes, setRoutes] = useState<DisplayRoute[]>([]);
  const [announcements, setAnnouncements] = useState<DisplayAnnouncementLocal[]>([]);
  const [ads, setAds] = useState<DisplayAdLocal[]>([]);
  
  // Slide management - separate content and ads
  const [contentSlides, setContentSlides] = useState<Slide[]>([]); // Routes + Announcements
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  
  // Independent Ad Cycle State
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [adBudgetRemaining, setAdBudgetRemaining] = useState(AD_BUDGET_PER_CYCLE);
  const [adsShownThisCycle, setAdsShownThisCycle] = useState<Set<number>>(new Set()); // Track which ads have been shown
  const adStartIndexRef = useRef(0); // Remember where ads started in this cycle
  
  // Critical announcement state
  const [criticalAnnouncement, setCriticalAnnouncement] = useState<DisplayAnnouncementLocal | null>(null);
  const [showCritical, setShowCritical] = useState(false);
  const pausedStateRef = useRef<{ contentIndex: number; wasShowingAd: boolean; adIndex: number }>({
    contentIndex: 0,
    wasShowingAd: false,
    adIndex: 0,
  });

  // =============================================================================
  // TRANSFORM API DATA TO LOCAL STATE
  // =============================================================================
  
  useEffect(() => {
    if (displayContent) {
      // Transform and set routes
      const transformedRoutes = groupBusesByRoute(displayContent.upcoming_buses);
      setRoutes(transformedRoutes);
      
      // Transform and set announcements
      const transformedAnnouncements = transformAnnouncements(displayContent.announcements);
      setAnnouncements(transformedAnnouncements);
      
      // Transform and set ads
      const transformedAds = transformAds(displayContent.advertisements);
      setAds(transformedAds);
    }
  }, [displayContent]);

  // =============================================================================
  // BUILD SLIDE DECK - Now separates content from ads
  // =============================================================================
  
  const buildContentSlides = useCallback(() => {
    const newSlides: Slide[] = [];
    
    // Add route slides
    routes.forEach((route) => {
      // Only include routes that have buses arriving within 60 minutes
      const upcomingBuses = route.buses.filter((b) => b.eta_minutes <= 60).slice(0, 5);
      if (upcomingBuses.length > 0) {
        newSlides.push({
          type: 'route',
          data: { ...route, buses: upcomingBuses },
          duration: ROUTE_SLIDE_DURATION,
        });
      }
    });
    
    // Add announcements - show them even if there are no routes!
    const nonEmergencyAnnouncements = announcements.filter(
      (a) => a.severity !== 'emergency'
    );
    
    if (nonEmergencyAnnouncements.length > 0) {
      if (newSlides.length > 0) {
        // Interleave announcements between routes
        const announcementSlide: Slide = {
          type: 'announcement',
          data: nonEmergencyAnnouncements[0],
          duration: ANNOUNCEMENT_SLIDE_DURATION,
        };
        // Insert after first route
        newSlides.splice(1, 0, announcementSlide);
        
        // Add more announcements if we have them
        for (let i = 1; i < nonEmergencyAnnouncements.length; i++) {
          newSlides.push({
            type: 'announcement',
            data: nonEmergencyAnnouncements[i],
            duration: ANNOUNCEMENT_SLIDE_DURATION,
          });
        }
      } else {
        // No routes - just show all announcements
        nonEmergencyAnnouncements.forEach((announcement) => {
          newSlides.push({
            type: 'announcement',
            data: announcement,
            duration: ANNOUNCEMENT_SLIDE_DURATION,
          });
        });
      }
    }
    
    // NOTE: Ads are NOT added here - they have their own independent cycle
    setContentSlides(newSlides);
  }, [routes, announcements]);

  // =============================================================================
  // Get current ad to display
  // =============================================================================
  const getCurrentAd = useCallback((): DisplayAdLocal | null => {
    if (ads.length === 0) return null;
    return ads[currentAdIndex % ads.length];
  }, [currentAdIndex, ads]);

  // =============================================================================
  // Move to next slide (content or ad)
  // =============================================================================
  const moveToNextSlide = useCallback(() => {
    if (isShowingAd) {
      // Currently showing an ad - mark it as shown
      const currentAd = getCurrentAd();
      if (currentAd) {
        // Track that this ad has been shown
        setAdsShownThisCycle(prev => new Set(prev).add(currentAd.id));
        
        // Deduct the ad duration from budget
        const newBudget = adBudgetRemaining - currentAd.duration_seconds;
        
        // Move to next ad in the independent ad cycle
        const nextAdIndex = (currentAdIndex + 1) % ads.length;
        const nextAd = ads[nextAdIndex];
        
        // Check if all ads have been shown at least once this cycle
        const updatedShownAds = new Set(adsShownThisCycle).add(currentAd.id);
        const allAdsShown = ads.length > 0 && ads.every(ad => updatedShownAds.has(ad.id));
        
        // Conditions to continue showing ads:
        // 1. Have budget remaining
        // 2. Next ad fits in budget
        // 3. NOT all ads have been shown (if all shown, we can end early)
        const shouldContinueAds = newBudget > 0 && 
          nextAd && 
          nextAd.duration_seconds <= newBudget && 
          !allAdsShown;
        
        if (shouldContinueAds) {
          // Show next ad
          setAdBudgetRemaining(newBudget);
          setCurrentAdIndex(nextAdIndex);
        } else {
          // End ad cycle - either budget exhausted, next ad too long, or all ads shown
          adStartIndexRef.current = nextAdIndex;
          setIsShowingAd(false);
          setCurrentContentIndex(0); // Start content from beginning
          setAdBudgetRemaining(AD_BUDGET_PER_CYCLE); // Reset budget for next cycle
          setAdsShownThisCycle(new Set()); // Reset shown ads tracker
        }
      }
    } else {
      // Currently showing content
      const nextContentIndex = currentContentIndex + 1;
      
      if (nextContentIndex >= contentSlides.length) {
        // Finished all content slides - time for ads
        if (ads.length > 0 && adBudgetRemaining > 0) {
          // Check if the current ad fits the budget
          const currentAd = ads[adStartIndexRef.current % ads.length];
          if (currentAd && currentAd.duration_seconds <= adBudgetRemaining) {
            setIsShowingAd(true);
            setCurrentAdIndex(adStartIndexRef.current);
            setAdsShownThisCycle(new Set()); // Start fresh tracking for this ad cycle
          } else {
            // No ad fits - restart content cycle
            setCurrentContentIndex(0);
            setAdBudgetRemaining(AD_BUDGET_PER_CYCLE);
          }
        } else {
          // No ads or no budget - restart content cycle
          setCurrentContentIndex(0);
          setAdBudgetRemaining(AD_BUDGET_PER_CYCLE);
        }
      } else {
        // More content to show
        setCurrentContentIndex(nextContentIndex);
      }
    }
    setSlideProgress(0);
  }, [isShowingAd, currentAdIndex, adBudgetRemaining, currentContentIndex, contentSlides.length, getCurrentAd, ads, adsShownThisCycle]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ETA countdown between API refreshes (local simulation)
  // The API refreshes every 30 seconds, this provides smooth countdown in between
  useEffect(() => {
    const interval = setInterval(() => {
      setRoutes((prevRoutes) =>
        prevRoutes.map((route) => ({
          ...route,
          buses: route.buses
            .map((bus) => ({
              ...bus,
              eta_minutes: Math.max(0, bus.eta_minutes - 1),
              status: bus.eta_minutes <= 2 ? 'arriving' as const : bus.eta_minutes <= 4 ? 'approaching' as const : bus.status,
            }))
            .filter((bus) => bus.eta_minutes > 0), // Remove arrived buses
        }))
      );
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Build slides when routes/announcements change
  useEffect(() => {
    buildContentSlides();
  }, [buildContentSlides]);

  // Check for emergency announcements
  useEffect(() => {
    const emergency = announcements.find((a) => a.severity === 'emergency');
    if (emergency) {
      // Save current state before showing emergency
      pausedStateRef.current = {
        contentIndex: currentContentIndex,
        wasShowingAd: isShowingAd,
        adIndex: currentAdIndex,
      };
      setCriticalAnnouncement(emergency);
      setShowCritical(true);
    } else {
      if (showCritical) {
        // Restore state after emergency clears
        setCurrentContentIndex(pausedStateRef.current.contentIndex);
        setIsShowingAd(pausedStateRef.current.wasShowingAd);
        setCurrentAdIndex(pausedStateRef.current.adIndex);
      }
      setShowCritical(false);
      setCriticalAnnouncement(null);
    }
  }, [announcements]);

  // Slide progression timer
  useEffect(() => {
    if (isPaused || showCritical || isLoading) return;
    
    // Get current slide duration
    let currentDuration = ROUTE_SLIDE_DURATION;
    if (isShowingAd) {
      const currentAd = getCurrentAd();
      currentDuration = currentAd ? Math.min(currentAd.duration_seconds, MAX_AD_DURATION) : 10;
    } else if (contentSlides[currentContentIndex]) {
      currentDuration = contentSlides[currentContentIndex].duration;
    }

    const progressInterval = setInterval(() => {
      setSlideProgress((prev) => {
        const increment = 100 / (currentDuration * 10); // Update every 100ms
        if (prev + increment >= 100) {
          // Move to next slide
          moveToNextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [isPaused, showCritical, isLoading, isShowingAd, currentContentIndex, contentSlides, getCurrentAd, moveToNextSlide]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderRouteSlide = (route: DisplayRoute) => (
    <motion.div
      key={`route-${route.route_code}`}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Route Header */}
      <div className="flex items-center gap-6 mb-8">
        <div
          className="px-8 py-4 rounded-2xl text-white font-black text-5xl shadow-2xl"
          style={{ backgroundColor: route.color }}
        >
          {route.route_code}
        </div>
        <div>
          <h2 className="text-white text-4xl font-bold">{route.route_name}</h2>
          <p className="text-gray-400 text-xl mt-1">
            {language === 'en' ? 'Next Arrivals' : 'اگلی آمد'}
          </p>
        </div>
      </div>

      {/* Bus List */}
      <div className="flex-1 grid gap-4">
        {route.buses.length > 0 ? (
          route.buses.map((bus, idx) => (
            <motion.div
              key={bus.bus_name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center justify-between p-6 rounded-2xl border-2 ${
                bus.status === 'arriving' || bus.status === 'approaching'
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-white/10 rounded-xl flex items-center justify-center">
                  <Bus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-white text-2xl font-bold">{bus.bus_name}</p>
                  <p className="text-gray-400">
                    {language === 'en' ? 'Bus ID' : 'بس آئی ڈی'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                {/* Status Badge */}
                <div
                  className={`px-4 py-2 rounded-xl text-lg font-semibold ${
                    bus.status === 'arriving'
                      ? 'bg-green-500 text-white animate-pulse'
                      : bus.status === 'approaching'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {bus.status === 'arriving'
                    ? language === 'en'
                      ? '🚌 ARRIVING NOW'
                      : '🚌 ابھی آ رہی ہے'
                    : bus.status === 'approaching'
                    ? language === 'en'
                      ? '🚌 APPROACHING'
                      : '🚌 قریب آ رہی ہے'
                    : language === 'en'
                    ? '→ ON ROUTE'
                    : '→ راستے میں'}
                </div>

                {/* ETA */}
                <div className="text-right min-w-[120px]">
                  <p className="text-white text-5xl font-black">
                    {bus.eta_minutes}
                  </p>
                  <p className="text-gray-400 text-lg">
                    {language === 'en' ? 'minutes' : 'منٹ'}
                  </p>
                </div>

                {/* Progress indicator */}
                <div className="w-24 h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: route.color }}
                    initial={{ width: '100%' }}
                    animate={{ width: `${Math.max(0, 100 - (bus.eta_minutes / 60) * 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-3xl">
              {language === 'en' ? 'No arrivals in the next hour' : 'اگلے گھنٹے میں کوئی آمد نہیں'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderAnnouncementSlide = (announcement: DisplayAnnouncementLocal) => (
    <motion.div
      key={`announcement-${announcement.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div
        className={`max-w-4xl p-12 rounded-3xl text-center ${
          announcement.severity === 'warning'
            ? 'bg-amber-500/20 border-4 border-amber-500'
            : 'bg-blue-500/20 border-4 border-blue-500'
        }`}
      >
        <div
          className={`h-24 w-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            announcement.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
          }`}
        >
          <AlertTriangle className="h-12 w-12 text-white" />
        </div>
        <h2
          className={`text-4xl font-bold mb-4 ${
            announcement.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
          }`}
        >
          {announcement.severity === 'warning'
            ? language === 'en'
              ? 'NOTICE'
              : 'نوٹس'
            : language === 'en'
            ? 'INFORMATION'
            : 'معلومات'}
        </h2>
        <p className="text-white text-3xl leading-relaxed">
          {language === 'en' ? announcement.message : announcement.message_ur}
        </p>
      </div>
    </motion.div>
  );

  const renderAdSlide = (ad: DisplayAdLocal) => {
    const renderAdContent = () => {
      if (ad.media_type === 'youtube') {
        const videoId = getYouTubeVideoId(ad.content_url);
        if (videoId) {
          return (
            <iframe
              key={`youtube-${videoId}-${isMuted ? 'muted' : 'unmuted'}`}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${videoId}`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={ad.title}
              style={{ border: 'none' }}
            />
          );
        }
      }
      
      // Default: image
      return (
        <img
          src={ad.content_url}
          alt={ad.title}
          className="max-w-full max-h-full object-contain"
        />
      );
    };

    return (
      <motion.div
        key={`ad-${ad.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 flex items-center justify-center bg-black"
      >
        {renderAdContent()}
        {/* Ad indicator */}
        <div className="absolute bottom-8 right-8 bg-black/50 backdrop-blur px-4 py-2 rounded-lg flex items-center gap-2">
          {ad.media_type === 'youtube' && (
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          )}
          <p className="text-white/60 text-sm">
            {language === 'en' ? 'Advertisement' : 'اشتہار'}
          </p>
        </div>
      </motion.div>
    );
  };

  const renderCriticalAnnouncement = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-red-900 flex items-center justify-center z-50"
    >
      {/* Flashing border effect */}
      <motion.div
        className="absolute inset-4 border-8 border-red-500 rounded-3xl"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      
      <div className="text-center p-12 max-w-5xl">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="h-32 w-32 mx-auto mb-8 bg-red-500 rounded-full flex items-center justify-center"
        >
          <AlertTriangle className="h-20 w-20 text-white" />
        </motion.div>
        
        <h1 className="text-red-300 text-6xl font-black mb-8 tracking-wider">
          {language === 'en' ? '⚠️ EMERGENCY ALERT ⚠️' : '⚠️ ایمرجنسی الرٹ ⚠️'}
        </h1>
        
        <p className="text-white text-4xl leading-relaxed font-bold">
          {criticalAnnouncement
            ? language === 'en'
              ? criticalAnnouncement.message
              : criticalAnnouncement.message_ur
            : ''}
        </p>

        <p className="text-red-300 text-2xl mt-12">
          {language === 'en'
            ? 'Please follow instructions from authorities'
            : 'براہ کرم حکام کی ہدایات پر عمل کریں'}
        </p>
      </div>
    </motion.div>
  );

  // Get current slide info for display
  const getCurrentSlideInfo = (): { type: string; data: DisplayRoute | DisplayAnnouncementLocal | DisplayAdLocal | null; duration: number } => {
    if (isShowingAd) {
      const ad = getCurrentAd();
      return { type: 'ad', data: ad, duration: ad ? Math.min(ad.duration_seconds, MAX_AD_DURATION) : 10 };
    }
    const slide = contentSlides[currentContentIndex];
    return slide ? { type: slide.type, data: slide.data, duration: slide.duration } : { type: 'loading', data: null, duration: 0 };
  };

  const currentSlideInfo = getCurrentSlideInfo();

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className={`min-h-screen bg-gray-950 ${isFullscreen ? '' : 'p-4 md:p-8'}`}>
      {/* Admin Control Panel */}
      {showControls && !isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white rounded-2xl p-6 shadow-xl max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SMD Display Simulator</h1>
              <p className="text-gray-500 text-sm">
                Simulating LED display at bus stop • {SMD_SPECS.resolution} @ {SMD_SPECS.brightness}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Playback Controls */}
              <Button
                variant={isPaused ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="gap-2"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>

              {/* Skip Controls */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSlideProgress(0);
                  if (isShowingAd) {
                    // Go to previous ad or back to content
                    if (currentAdIndex > 0) {
                      setCurrentAdIndex(currentAdIndex - 1);
                    } else {
                      setIsShowingAd(false);
                      setCurrentContentIndex(Math.max(0, contentSlides.length - 1));
                    }
                  } else {
                    // Go to previous content
                    if (currentContentIndex > 0) {
                      setCurrentContentIndex(currentContentIndex - 1);
                    }
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSlideProgress(0);
                  moveToNextSlide();
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Language Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage((l) => (l === 'en' ? 'ur' : 'en'))}
                className="gap-2 min-w-[80px]"
              >
                {language === 'en' ? 'EN' : 'اردو'}
              </Button>

              {/* Mute/Unmute Toggle */}
              <Button
                variant={isMuted ? 'outline' : 'default'}
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="gap-2"
                title={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>

              {/* Critical Announcement Toggle */}
              <Button
                variant={showCritical ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => {
                  if (showCritical) {
                    setShowCritical(false);
                    setCriticalAnnouncement(null);
                  } else {
                    // Manual trigger for testing
                    const testEmergency: DisplayAnnouncementLocal = {
                      id: 0,
                      title: 'Test Emergency',
                      message: 'This is a test emergency announcement',
                      message_ur: 'یہ ایک ٹیسٹ ایمرجنسی اعلان ہے',
                      severity: 'emergency',
                      active: true,
                    };
                    setCriticalAnnouncement(testEmergency);
                    setShowCritical(true);
                  }
                }}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {showCritical
                  ? 'Clear Emergency'
                  : 'Trigger Emergency'}
              </Button>

              {/* Fullscreen */}
              <Button variant="outline" size="sm" onClick={toggleFullscreen} className="gap-2">
                <Maximize className="h-4 w-4" />
                Fullscreen
              </Button>
            </div>
          </div>

          {/* Slide Progress */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                {isShowingAd ? 'Ad' : 'Content'} {isShowingAd ? currentAdIndex + 1 : currentContentIndex + 1} of {isShowingAd ? ads.length : contentSlides.length}
              </span>
              <span>•</span>
              <span className="capitalize">
                {currentSlideInfo.type || 'Loading'}
                {currentSlideInfo.type === 'route' && currentSlideInfo.data && ` - ${(currentSlideInfo.data as DisplayRoute).route_code}`}
              </span>
              <span>•</span>
              <span>{currentSlideInfo.duration}s duration</span>
              {isShowingAd && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 font-medium">Ad Budget: {adBudgetRemaining}s remaining</span>
                </>
              )}
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isShowingAd ? 'bg-amber-500' : 'bg-teal-500'}`}
                style={{ width: `${slideProgress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* SMD Display Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${
          isFullscreen ? 'w-full h-screen' : 'max-w-7xl mx-auto aspect-video'
        } bg-black rounded-2xl overflow-hidden shadow-2xl relative border-4 border-gray-800`}
        style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
        dir={language === 'ur' ? 'rtl' : 'ltr'}
      >
        {/* Top Status Bar */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black via-black/90 to-transparent z-40 px-8 flex items-center justify-between">
          {/* Left: Branding */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bus className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">
                {language === 'en' ? 'Smart Metro Bus' : 'سمارٹ میٹرو بس'}
              </h1>
              <p className="text-gray-400 text-sm">
                {displayContent?.stop?.name 
                  ? (language === 'en' 
                      ? `Islamabad • ${displayContent.stop.name}` 
                      : `اسلام آباد • ${displayContent.stop.name}`)
                  : (language === 'en' ? 'Loading stop info...' : 'اسٹاپ کی معلومات لوڈ ہو رہی ہیں...')}
              </p>
            </div>
          </div>

          {/* Center: Scrolling info ticker */}
          <div className="flex-1 mx-8 overflow-hidden">
            <motion.div
              className="flex items-center gap-8 text-gray-400 text-sm whitespace-nowrap"
              animate={{ x: [0, -500] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              {announcements
                .filter((a) => a.severity === 'info' && a.active)
                .map((a) => (
                  <span key={a.id} className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-blue-500 rounded-full" />
                    {language === 'en' ? a.message : a.message_ur}
                  </span>
                ))}
            </motion.div>
          </div>

          {/* Right: Time & Status */}
          <div className="flex items-center gap-6">
            {/* Hardware Status */}
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <div className="flex items-center gap-1">
                <Signal className="h-4 w-4 text-green-500" />
                <span>{SMD_SPECS.connectivity}</span>
              </div>
              <div className="flex items-center gap-1">
                <Thermometer className="h-4 w-4 text-orange-400" />
                <span>{SMD_SPECS.temperature}°C</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span>{SMD_SPECS.powerMode}</span>
              </div>
            </div>

            {/* Time */}
            <div className="text-right">
              <p className="text-white text-3xl font-bold tabular-nums">
                {currentTime.toLocaleTimeString(language === 'en' ? 'en-US' : 'ur-PK', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </p>
              <p className="text-gray-400 text-sm">
                {currentTime.toLocaleDateString(language === 'en' ? 'en-US' : 'ur-PK', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Connection indicator */}
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-500" />
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="absolute inset-0 pt-24 pb-6 px-8">
          <AnimatePresence mode="wait">
            {showCritical && criticalAnnouncement ? (
              renderCriticalAnnouncement()
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Bus className="h-16 w-16 text-teal-500 animate-bounce mb-4" />
                <p className="text-gray-500 text-2xl">Loading display content...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-full">
                <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-red-400 text-2xl">Failed to load display content</p>
                <p className="text-gray-500 text-lg mt-2">Please check your connection</p>
              </div>
            ) : !numericDisplayId ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Settings className="h-16 w-16 text-amber-500 mb-4" />
                <p className="text-amber-400 text-2xl">No Display Selected</p>
                <p className="text-gray-500 text-lg mt-2">Select a display from the Displays page</p>
              </div>
            ) : currentSlideInfo.data ? (
              currentSlideInfo.type === 'route' ? (
                renderRouteSlide(currentSlideInfo.data as DisplayRoute)
              ) : currentSlideInfo.type === 'announcement' ? (
                renderAnnouncementSlide(currentSlideInfo.data as DisplayAnnouncementLocal)
              ) : currentSlideInfo.type === 'ad' ? (
                renderAdSlide(currentSlideInfo.data as DisplayAdLocal)
              ) : null
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Bus className="h-16 w-16 text-gray-600 mb-4" />
                <p className="text-gray-500 text-2xl">No content available</p>
                <p className="text-gray-600 text-lg mt-2">Waiting for bus data...</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Progress Bar */}
        {!showCritical && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-500 to-teal-400"
              style={{ width: `${slideProgress}%` }}
            />
          </div>
        )}

        {/* Slide indicators - shows content slides + ad indicator */}
        {!showCritical && (contentSlides.length > 0 || ads.length > 0) && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            {/* Content slide indicators */}
            {contentSlides.map((_, idx: number) => (
              <div
                key={`content-${idx}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  !isShowingAd && idx === currentContentIndex
                    ? 'w-8 bg-teal-500'
                    : 'w-2 bg-gray-600'
                }`}
              />
            ))}
            {/* Ad cycle indicator (single dot for all ads) */}
            {ads.length > 0 && (
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isShowingAd
                    ? 'w-8 bg-amber-500'
                    : 'w-2 bg-gray-600'
                }`}
              />
            )}
          </div>
        )}

        {/* Fullscreen Exit Button */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
          >
            <Minimize className="h-6 w-6 text-white" />
          </button>
        )}

        {/* Toggle Controls Button (in fullscreen) */}
        {isFullscreen && (
          <button
            onClick={() => setShowControls(!showControls)}
            className="absolute top-4 left-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
          >
            <Settings className="h-6 w-6 text-white" />
          </button>
        )}
      </motion.div>

      {/* Hardware Specs Card */}
      {!isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-7xl mx-auto bg-white rounded-2xl p-6 shadow-xl"
        >
          <h3 className="font-bold text-gray-900 mb-4">SMD Hardware Specifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Display</p>
              <p className="font-semibold">3.9mm LED</p>
            </div>
            <div>
              <p className="text-gray-500">Resolution</p>
              <p className="font-semibold">1920×1080</p>
            </div>
            <div>
              <p className="text-gray-500">Brightness</p>
              <p className="font-semibold">5000 nits</p>
            </div>
            <div>
              <p className="text-gray-500">Material</p>
              <p className="font-semibold">Tamper-proof</p>
            </div>
            <div>
              <p className="text-gray-500">Power</p>
              <p className="font-semibold">220-240V AC</p>
            </div>
            <div>
              <p className="text-gray-500">Connectivity</p>
              <p className="font-semibold">4G/Wi-Fi/ETH</p>
            </div>
            <div>
              <p className="text-gray-500">Dimensions</p>
              <p className="font-semibold">1500×1000mm</p>
            </div>
            <div>
              <p className="text-gray-500">Weight</p>
              <p className="font-semibold">45 kg</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SMDSimulatorPage;
