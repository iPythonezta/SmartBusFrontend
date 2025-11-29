import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// =============================================================================
// DUMMY DATA - All data is generated here, no backend calls
// =============================================================================

interface DummyBus {
  bus_name: string;
  eta_minutes: number;
  status: 'on-time' | 'delayed' | 'approaching';
}

interface DummyRoute {
  route_name: string;
  route_code: string;
  color: string;
  buses: DummyBus[];
}

interface DummyAnnouncement {
  id: string;
  message: string;
  message_ur: string;
  severity: 'critical' | 'moderate' | 'info';
  active: boolean;
}

interface DummyAd {
  id: string;
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

// Dummy Routes with upcoming buses
const DUMMY_ROUTES: DummyRoute[] = [
  {
    route_name: 'Saddar to Faisal Mosque',
    route_code: 'R-11',
    color: '#0ea5e9',
    buses: [
      { bus_name: 'ISB-1142', eta_minutes: 3, status: 'approaching' },
      { bus_name: 'ISB-1156', eta_minutes: 12, status: 'on-time' },
      { bus_name: 'ISB-1189', eta_minutes: 24, status: 'on-time' },
      { bus_name: 'ISB-1203', eta_minutes: 38, status: 'delayed' },
      { bus_name: 'ISB-1217', eta_minutes: 52, status: 'on-time' },
    ],
  },
  {
    route_name: 'F-10 Markaz to PIMS',
    route_code: 'R-22',
    color: '#8b5cf6',
    buses: [
      { bus_name: 'ISB-2201', eta_minutes: 6, status: 'on-time' },
      { bus_name: 'ISB-2215', eta_minutes: 18, status: 'on-time' },
      { bus_name: 'ISB-2234', eta_minutes: 31, status: 'delayed' },
      { bus_name: 'ISB-2248', eta_minutes: 45, status: 'on-time' },
    ],
  },
  {
    route_name: 'G-9 to Blue Area',
    route_code: 'R-33',
    color: '#f59e0b',
    buses: [
      { bus_name: 'ISB-3301', eta_minutes: 8, status: 'on-time' },
      { bus_name: 'ISB-3318', eta_minutes: 22, status: 'approaching' },
      { bus_name: 'ISB-3329', eta_minutes: 41, status: 'on-time' },
    ],
  },
];

// Dummy Announcements
const DUMMY_ANNOUNCEMENTS: DummyAnnouncement[] = [
  {
    id: 'critical-1',
    message: '⚠️ EMERGENCY: All services temporarily suspended due to VIP movement. Resume in 30 minutes.',
    message_ur: '⚠️ ایمرجنسی: وی آئی پی نقل و حرکت کی وجہ سے تمام سروسز عارضی طور پر معطل۔ 30 منٹ میں دوبارہ شروع۔',
    severity: 'critical',
    active: false, // Toggle this to test critical announcements
  },
  {
    id: 'moderate-1',
    message: '🚌 Route R-11 is running 10 minutes behind schedule due to traffic congestion.',
    message_ur: '🚌 روٹ R-11 ٹریفک کی وجہ سے 10 منٹ تاخیر سے چل رہی ہے۔',
    severity: 'moderate',
    active: true,
  },
  {
    id: 'moderate-2',
    message: '🔧 Scheduled maintenance on Route R-33 tonight from 11 PM to 5 AM.',
    message_ur: '🔧 روٹ R-33 پر آج رات 11 بجے سے صبح 5 بجے تک شیڈول مینٹیننس۔',
    severity: 'moderate',
    active: true,
  },
  {
    id: 'info-1',
    message: '😷 Please wear a mask inside the bus for your safety.',
    message_ur: '😷 اپنی حفاظت کے لیے بس میں ماسک پہنیں۔',
    severity: 'info',
    active: true,
  },
  {
    id: 'info-2',
    message: '📱 Download the Smart Bus app for real-time tracking!',
    message_ur: '📱 ریئل ٹائم ٹریکنگ کے لیے سمارٹ بس ایپ ڈاؤن لوڈ کریں!',
    severity: 'info',
    active: true,
  },
];

// Dummy Ads - supports image, video, and YouTube
const DUMMY_ADS: DummyAd[] = [
  {
    id: 'ad-1',
    title: 'Jazz 4G - Digital Pakistan',
    media_type: 'youtube',
    content_url: 'https://youtu.be/J4Fwn0WvQf0',
    duration_seconds: 30, // YouTube ads capped at 30s for display
  },
  {
    id: 'ad-2',
    title: 'Jazz 4G - Stay Connected',
    media_type: 'image',
    content_url: 'https://placehold.co/1920x1080/e11d48/ffffff?text=Jazz+4G+-+Pakistan%27s+Fastest+Network',
    duration_seconds: 10,
  },
  {
    id: 'ad-3',
    title: 'HBL - Banking Made Easy',
    media_type: 'image',
    content_url: 'https://placehold.co/1920x1080/059669/ffffff?text=HBL+-+Banking+On+The+Go',
    duration_seconds: 10,
  },
  {
    id: 'ad-4',
    title: 'Pepsi - Refresh Your Day',
    media_type: 'image',
    content_url: 'https://placehold.co/1920x1080/1d4ed8/ffffff?text=Pepsi+-+Refresh+Your+Journey',
    duration_seconds: 8,
  },
  {
    id: 'ad-5',
    title: 'Telenor - Internet For All',
    media_type: 'youtube',
    content_url: 'https://www.youtube.com/watch?v=nmNSHPeRDRc',
    duration_seconds: 30,
  },
];

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
// SLIDE TYPES & TIMING
// =============================================================================

type SlideType = 'route' | 'announcement' | 'ad';

interface Slide {
  type: SlideType;
  data: DummyRoute | DummyAnnouncement | DummyAd;
  duration: number; // in seconds
}

const ROUTE_SLIDE_DURATION = 10; // seconds
const ANNOUNCEMENT_SLIDE_DURATION = 8; // seconds
const MAX_AD_DURATION = 30; // seconds
const AD_BUDGET_PER_CYCLE = 60; // Total seconds for ads per cycle

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const SMDSimulatorPage: React.FC = () => {
  // State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [isMuted, setIsMuted] = useState(true); // Audio muted by default
  
  // Slide management - separate content and ads
  const [contentSlides, setContentSlides] = useState<Slide[]>([]); // Routes + Announcements
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  
  // Independent Ad Cycle State
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [adBudgetRemaining, setAdBudgetRemaining] = useState(AD_BUDGET_PER_CYCLE);
  const adStartIndexRef = useRef(0); // Remember where ads started in this cycle
  
  // Critical announcement state
  const [criticalAnnouncement, setCriticalAnnouncement] = useState<DummyAnnouncement | null>(null);
  const [showCritical, setShowCritical] = useState(false);
  const pausedStateRef = useRef<{ contentIndex: number; wasShowingAd: boolean; adIndex: number }>({
    contentIndex: 0,
    wasShowingAd: false,
    adIndex: 0,
  });
  
  // ETA countdown (simulated)
  const [routes, setRoutes] = useState<DummyRoute[]>(DUMMY_ROUTES);
  
  // Announcements state (for toggling in demo)
  const [announcements, setAnnouncements] = useState<DummyAnnouncement[]>(DUMMY_ANNOUNCEMENTS);

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
    
    // Add moderate/info announcements between routes
    const activeAnnouncements = announcements.filter(
      (a) => a.active && a.severity !== 'critical'
    );
    
    // Interleave announcements
    if (activeAnnouncements.length > 0 && newSlides.length > 0) {
      const announcementSlide: Slide = {
        type: 'announcement',
        data: activeAnnouncements[0],
        duration: ANNOUNCEMENT_SLIDE_DURATION,
      };
      // Insert after first route
      if (newSlides.length >= 1) {
        newSlides.splice(1, 0, announcementSlide);
      }
    }
    
    // NOTE: Ads are NOT added here - they have their own independent cycle
    setContentSlides(newSlides);
  }, [routes, announcements]);

  // =============================================================================
  // Get current ad to display
  // =============================================================================
  const getCurrentAd = useCallback((): DummyAd | null => {
    if (DUMMY_ADS.length === 0) return null;
    return DUMMY_ADS[currentAdIndex % DUMMY_ADS.length];
  }, [currentAdIndex]);

  // =============================================================================
  // Move to next slide (content or ad)
  // =============================================================================
  const moveToNextSlide = useCallback(() => {
    if (isShowingAd) {
      // Currently showing an ad - check if we can show another
      const currentAd = getCurrentAd();
      if (currentAd) {
        // Deduct the ad duration from budget
        const newBudget = adBudgetRemaining - currentAd.duration_seconds;
        
        // Move to next ad in the independent ad cycle
        const nextAdIndex = (currentAdIndex + 1) % DUMMY_ADS.length;
        const nextAd = DUMMY_ADS[nextAdIndex];
        
        // Check if next ad fits in remaining budget
        if (newBudget > 0 && nextAd && nextAd.duration_seconds <= newBudget) {
          // Show next ad
          setAdBudgetRemaining(newBudget);
          setCurrentAdIndex(nextAdIndex);
        } else {
          // Budget exhausted or next ad too long - go back to content
          // Save where we left off in ad cycle for next time
          adStartIndexRef.current = nextAdIndex;
          setIsShowingAd(false);
          setCurrentContentIndex(0); // Start content from beginning
          setAdBudgetRemaining(AD_BUDGET_PER_CYCLE); // Reset budget for next cycle
        }
      }
    } else {
      // Currently showing content
      const nextContentIndex = currentContentIndex + 1;
      
      if (nextContentIndex >= contentSlides.length) {
        // Finished all content slides - time for ads
        if (DUMMY_ADS.length > 0 && adBudgetRemaining > 0) {
          // Check if the current ad fits the budget
          const currentAd = DUMMY_ADS[adStartIndexRef.current % DUMMY_ADS.length];
          if (currentAd && currentAd.duration_seconds <= adBudgetRemaining) {
            setIsShowingAd(true);
            setCurrentAdIndex(adStartIndexRef.current);
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
  }, [isShowingAd, currentAdIndex, adBudgetRemaining, currentContentIndex, contentSlides.length, getCurrentAd]);

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

  // Simulate ETA countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRoutes((prevRoutes) =>
        prevRoutes.map((route) => ({
          ...route,
          buses: route.buses
            .map((bus) => ({
              ...bus,
              eta_minutes: Math.max(0, bus.eta_minutes - 1),
              status: bus.eta_minutes <= 2 ? 'approaching' : bus.status,
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

  // Check for critical announcements
  useEffect(() => {
    const critical = announcements.find((a) => a.severity === 'critical' && a.active);
    if (critical) {
      // Save current state before showing critical
      pausedStateRef.current = {
        contentIndex: currentContentIndex,
        wasShowingAd: isShowingAd,
        adIndex: currentAdIndex,
      };
      setCriticalAnnouncement(critical);
      setShowCritical(true);
    } else {
      if (showCritical) {
        // Restore state after critical clears
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
    if (isPaused || showCritical) return;
    
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
  }, [isPaused, showCritical, isShowingAd, currentContentIndex, contentSlides, getCurrentAd, moveToNextSlide]);

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
  // TOGGLE CRITICAL (for demo purposes)
  // =============================================================================
  
  const toggleCriticalAnnouncement = () => {
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.severity === 'critical' ? { ...a, active: !a.active } : a
      )
    );
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderRouteSlide = (route: DummyRoute) => (
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
                bus.status === 'approaching'
                  ? 'bg-green-500/20 border-green-500'
                  : bus.status === 'delayed'
                  ? 'bg-orange-500/10 border-orange-500/50'
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
                    bus.status === 'approaching'
                      ? 'bg-green-500 text-white animate-pulse'
                      : bus.status === 'delayed'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {bus.status === 'approaching'
                    ? language === 'en'
                      ? '🚌 ARRIVING'
                      : '🚌 آ رہی ہے'
                    : bus.status === 'delayed'
                    ? language === 'en'
                      ? '⏰ DELAYED'
                      : '⏰ تاخیر'
                    : language === 'en'
                    ? '✓ ON TIME'
                    : '✓ وقت پر'}
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

  const renderAnnouncementSlide = (announcement: DummyAnnouncement) => (
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
          announcement.severity === 'moderate'
            ? 'bg-amber-500/20 border-4 border-amber-500'
            : 'bg-blue-500/20 border-4 border-blue-500'
        }`}
      >
        <div
          className={`h-24 w-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            announcement.severity === 'moderate' ? 'bg-amber-500' : 'bg-blue-500'
          }`}
        >
          <AlertTriangle className="h-12 w-12 text-white" />
        </div>
        <h2
          className={`text-4xl font-bold mb-4 ${
            announcement.severity === 'moderate' ? 'text-amber-400' : 'text-blue-400'
          }`}
        >
          {announcement.severity === 'moderate'
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

  const renderAdSlide = (ad: DummyAd) => {
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
  const getCurrentSlideInfo = (): { type: string; data: DummyRoute | DummyAnnouncement | DummyAd | null; duration: number } => {
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
                variant={announcements.find((a) => a.severity === 'critical')?.active ? 'destructive' : 'outline'}
                size="sm"
                onClick={toggleCriticalAnnouncement}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {announcements.find((a) => a.severity === 'critical')?.active
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
                {isShowingAd ? 'Ad' : 'Content'} {isShowingAd ? currentAdIndex + 1 : currentContentIndex + 1} of {isShowingAd ? DUMMY_ADS.length : contentSlides.length}
              </span>
              <span>•</span>
              <span className="capitalize">
                {currentSlideInfo.type || 'Loading'}
                {currentSlideInfo.type === 'route' && currentSlideInfo.data && ` - ${(currentSlideInfo.data as DummyRoute).route_code}`}
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
                {language === 'en' ? 'Islamabad • F-10 Markaz Stop' : 'اسلام آباد • ایف-10 مرکز اسٹاپ'}
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
            ) : currentSlideInfo.data ? (
              currentSlideInfo.type === 'route' ? (
                renderRouteSlide(currentSlideInfo.data as DummyRoute)
              ) : currentSlideInfo.type === 'announcement' ? (
                renderAnnouncementSlide(currentSlideInfo.data as DummyAnnouncement)
              ) : currentSlideInfo.type === 'ad' ? (
                renderAdSlide(currentSlideInfo.data as DummyAd)
              ) : null
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-2xl">Loading display...</p>
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
        {!showCritical && (contentSlides.length > 0 || DUMMY_ADS.length > 0) && (
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
            {DUMMY_ADS.length > 0 && (
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
