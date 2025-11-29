// Mock data for demo purposes
import type {
  User,
  Stop,
  Route,
  Bus,
  DisplayUnit,
  Advertisement,
  AdSchedule,
  Announcement,
  DashboardStats,
  BusLocation,
  DisplaySimulation,
  BusETA,
} from '@/types';

// Mock Users (kept for backwards compatibility, real API used for auth)
export const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@smartbus.pk',
    first_name: 'Admin',
    last_name: 'User',
    user_type: 'ADMIN',
  },
  {
    id: 2,
    email: 'staff@smartbus.pk',
    first_name: 'Staff',
    last_name: 'User',
    user_type: 'STAFF',
  },
];

// Mock Stops
export const mockStops: Stop[] = [
  {
    id: '1',
    name: 'Blue Area',
    description: 'Main business district',
    latitude: 33.7077,
    longitude: 73.0469,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Secretariat',
    description: 'Government offices',
    latitude: 33.7295,
    longitude: 73.0931,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Aabpara',
    description: 'Shopping area',
    latitude: 33.7184,
    longitude: 73.0630,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Melody',
    description: 'Food Street',
    latitude: 33.6973,
    longitude: 73.0515,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Zero Point',
    description: 'Junction',
    latitude: 33.6938,
    longitude: 73.0635,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    name: 'Faizabad',
    description: 'Interchange',
    latitude: 33.6507,
    longitude: 73.0681,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Mock Routes
export const mockRoutes: Route[] = [
  {
    id: '1',
    name: 'Blue Line',
    code: 'BL-01',
    description: 'Blue Area to Faizabad',
    color: '#3b82f6',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    route_stops: [
      { id: '1', route_id: '1', stop_id: '1', sequence_number: 1, distance_from_prev: 0, stop: mockStops[0] },
      { id: '2', route_id: '1', stop_id: '3', sequence_number: 2, distance_from_prev: 1500, stop: mockStops[2] },
      { id: '3', route_id: '1', stop_id: '5', sequence_number: 3, distance_from_prev: 2000, stop: mockStops[4] },
      { id: '4', route_id: '1', stop_id: '6', sequence_number: 4, distance_from_prev: 4500, stop: mockStops[5] },
    ],
  },
  {
    id: '2',
    name: 'Green Line',
    code: 'GL-01',
    description: 'Secretariat to Melody',
    color: '#10b981',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    route_stops: [
      { id: '5', route_id: '2', stop_id: '2', sequence_number: 1, distance_from_prev: 0, stop: mockStops[1] },
      { id: '6', route_id: '2', stop_id: '3', sequence_number: 2, distance_from_prev: 2500, stop: mockStops[2] },
      { id: '7', route_id: '2', stop_id: '4', sequence_number: 3, distance_from_prev: 2000, stop: mockStops[3] },
    ],
  },
];

// Mock Bus Locations
export const mockBusLocations: BusLocation[] = [
  {
    latitude: 33.7077,
    longitude: 73.0469,
    speed: 45,
    heading: 180,
    current_stop_sequence: 2,
    timestamp: new Date().toISOString(),
  },
  {
    latitude: 33.7184,
    longitude: 73.0630,
    speed: 35,
    heading: 90,
    current_stop_sequence: 1,
    timestamp: new Date().toISOString(),
  },
];

// Mock Buses
export const mockBuses: Bus[] = [
  {
    id: 1,
    registration_number: 'ISB-1234',
    capacity: 50,
    status: 'active',
    route_id: 1,
    route: {
      id: 1,
      name: mockRoutes[0].name,
      code: mockRoutes[0].code,
      color: mockRoutes[0].color || '#3B82F6',
    },
    last_location: mockBusLocations[0],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    registration_number: 'ISB-5678',
    capacity: 45,
    status: 'active',
    route_id: 2,
    route: {
      id: 2,
      name: mockRoutes[1].name,
      code: mockRoutes[1].code,
      color: mockRoutes[1].color || '#22C55E',
    },
    last_location: mockBusLocations[1],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    registration_number: 'ISB-9012',
    capacity: 50,
    status: 'inactive',
    route_id: null,
    route: null,
    last_location: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Mock Display Units
export let mockDisplays: DisplayUnit[] = [
  {
    id: '1',
    name: 'Blue Area Display',
    stop_id: '1',
    stop: mockStops[0],
    status: 'online',
    location: 'Main pole near bus shelter',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Aabpara Display',
    stop_id: '3',
    stop: mockStops[2],
    status: 'online',
    location: 'Market entrance',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Faizabad Display',
    stop_id: '6',
    stop: mockStops[5],
    status: 'offline',
    location: 'Near interchange',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Mock Advertisements
export let mockAds: Advertisement[] = [
  {
    id: '1',
    title: 'Local Business Ad',
    content_url: 'https://via.placeholder.com/1920x1080/14b8a6/ffffff?text=Local+Business',
    media_type: 'image',
    duration_seconds: 10,
    advertiser_name: 'Metro Business Solutions',
    advertiser_contact: 'contact@metrobiz.pk',
    metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Public Service Message',
    content_url: 'https://via.placeholder.com/1920x1080/f97316/ffffff?text=Stay+Safe',
    media_type: 'image',
    duration_seconds: 8,
    advertiser_name: 'Islamabad Traffic Police',
    advertiser_contact: 'info@itp.gov.pk',
    metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Mock Ad Schedules
export let mockAdSchedules: AdSchedule[] = [
  {
    id: '1',
    ad_id: '1',
    display_id: '1',
    start_time: '2024-01-01T00:00:00Z',
    end_time: '2024-12-31T23:59:59Z',
    priority: 1,
    ad: mockAds[0],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    ad_id: '2',
    display_id: '1',
    start_time: '2024-01-01T00:00:00Z',
    end_time: '2024-12-31T23:59:59Z',
    priority: 2,
    ad: mockAds[1],
    created_at: '2024-01-01T00:00:00Z',
  },
];

// Mock Announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Normal Service',
    message: 'All services operating normally',
    message_ur: 'تمام خدمات معمول کے مطابق چل رہی ہیں',
    severity: 'info',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 86400000).toISOString(),
    route_ids: [],
    created_by: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Traffic Delay on Blue Line',
    message: 'Slight delay on Blue Line due to heavy traffic near Secretariat',
    message_ur: 'سیکرٹیریٹ کے قریب بھاری ٹریفک کی وجہ سے بلیو لائن میں معمولی تاخیر',
    severity: 'warning',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    route_ids: ['1'],
    created_by: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    title: 'Route Closure Notice',
    message: 'Green Line service suspended due to road maintenance. Expected to resume at 6:00 PM.',
    message_ur: 'سڑک کی مرمت کی وجہ سے گرین لائن سروس معطل ہے۔ شام 6 بجے بحال ہونے کی توقع ہے۔',
    severity: 'emergency',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 18000000).toISOString(),
    route_ids: ['2'],
    created_by: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  total_buses: 3,
  active_buses: 2,
  inactive_buses: 1,
  maintenance_buses: 0,
  total_routes: 2,
  total_stops: 6,
  online_displays: 2,
  offline_displays: 1,
  error_displays: 0,
  active_announcements: 2,
  active_ads: 3,
};

// Mock ETAs
export const mockETAs: BusETA[] = [
  {
    stop_id: 1,
    stop_name: 'Blue Area',
    distance_meters: 500,
    eta_minutes: 2,
    status: 'ontime',
  },
  {
    stop_id: 3,
    stop_name: 'Aabpara',
    distance_meters: 2000,
    eta_minutes: 8,
    status: 'ontime',
  },
  {
    stop_id: 5,
    stop_name: 'Zero Point',
    distance_meters: 4000,
    eta_minutes: 15,
    status: 'delayed',
  },
];

// Mock Display Simulation
export const mockDisplaySimulation: DisplaySimulation = {
  display_id: '1',
  stop: mockStops[0],
  route: mockRoutes[0],
  etas: mockETAs,
  announcements: mockAnnouncements.filter(a => a.severity !== 'info'),
  ads: mockAdSchedules.map(s => ({ ad: s.ad!, schedule: s })),
  timestamp: new Date().toISOString(),
};

// Helper to simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    await delay(500);
    const user = mockUsers.find(u => u.email === credentials.email);
    if (user) {
      return {
        access_token: 'mock_access_token_' + Math.random(),
        refresh_token: 'mock_refresh_token_' + Math.random(),
        user,
      };
    }
    throw new Error('Invalid credentials');
  },

  getMe: async () => {
    await delay(300);
    return { user: mockUsers[0] };
  },

  // Dashboard
  getStats: async () => {
    await delay(500);
    return mockDashboardStats;
  },

  // Stops
  getStops: async () => {
    await delay(400);
    return mockStops;
  },

  getStop: async (id: string) => {
    await delay(300);
    return mockStops.find(s => s.id === id) || mockStops[0];
  },

  createStop: async (data: any) => {
    await delay(500);
    const newStop: Stop = {
      id: String(mockStops.length + 1),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStops.push(newStop);
    return newStop;
  },

  // Routes
  getRoutes: async () => {
    await delay(400);
    return mockRoutes;
  },

  getRoute: async (id: string) => {
    await delay(300);
    return mockRoutes.find(r => r.id === id) || mockRoutes[0];
  },

  createRoute: async (data: any) => {
    await delay(500);
    const newRoute: Route = {
      id: String(mockRoutes.length + 1),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      route_stops: [],
    };
    mockRoutes.push(newRoute);
    return newRoute;
  },

  // Buses
  getBuses: async () => {
    await delay(400);
    return mockBuses;
  },

  getBus: async (id: string) => {
    await delay(300);
    const numId = parseInt(id, 10);
    return mockBuses.find(b => b.id === numId) || mockBuses[0];
  },

  createBus: async (data: any) => {
    await delay(500);
    const newBus: Bus = {
      id: mockBuses.length + 1,
      ...data,
      status: data.status || 'inactive',
      route_id: data.route_id || null,
      route: null,
      last_location: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockBuses.push(newBus);
    return newBus;
  },

  // Displays
  getDisplays: async () => {
    await delay(400);
    return mockDisplays;
  },

  getDisplay: async (id: string) => {
    await delay(300);
    return mockDisplays.find(d => d.id === id) || mockDisplays[0];
  },

  createDisplay: async (data: { name: string; stop_id: string; location?: string; status: 'online' | 'offline' }) => {
    await delay(500);
    const stop = mockStops.find(s => s.id === data.stop_id);
    const newDisplay: DisplayUnit = {
      id: String(mockDisplays.length + 1 + Date.now()),
      name: data.name,
      stop_id: data.stop_id,
      stop: stop,
      status: data.status,
      location: data.location,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDisplays.push(newDisplay);
    return newDisplay;
  },

  updateDisplay: async (id: string, data: Partial<DisplayUnit>) => {
    await delay(500);
    const index = mockDisplays.findIndex(d => d.id === id);
    if (index !== -1) {
      const stop = data.stop_id ? mockStops.find(s => s.id === data.stop_id) : mockDisplays[index].stop;
      mockDisplays[index] = {
        ...mockDisplays[index],
        ...data,
        stop: stop,
        updated_at: new Date().toISOString(),
      };
      return mockDisplays[index];
    }
    throw new Error('Display not found');
  },

  deleteDisplay: async (id: string) => {
    await delay(500);
    const index = mockDisplays.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDisplays.splice(index, 1);
    }
  },

  getDisplaySimulation: async (_id: string) => {
    await delay(300);
    return mockDisplaySimulation;
  },

  // Ads
  getAds: async () => {
    await delay(400);
    return mockAds;
  },

  getSchedules: async () => {
    await delay(400);
    return mockAdSchedules;
  },

  createAd: async (data: any) => {
    await delay(500);
    const newAd: Advertisement = {
      id: String(Date.now()),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockAds.push(newAd);
    return newAd;
  },

  updateAd: async (id: string, data: Partial<Advertisement>) => {
    await delay(500);
    const index = mockAds.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAds[index] = {
        ...mockAds[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return mockAds[index];
    }
    throw new Error('Ad not found');
  },

  deleteAd: async (id: string) => {
    await delay(500);
    const index = mockAds.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAds.splice(index, 1);
      // Also remove any schedules for this ad
      mockAdSchedules = mockAdSchedules.filter(s => s.ad_id !== id);
    }
  },

  createSchedule: async (data: { ad_id: string; display_ids: string[]; start_time: string; end_time: string; priority: number }) => {
    await delay(500);
    const ad = mockAds.find(a => a.id === data.ad_id);
    const newSchedules: AdSchedule[] = [];
    
    // Create a schedule for each display
    for (const displayId of data.display_ids) {
      const display = mockDisplays.find(d => d.id === displayId);
      const newSchedule: AdSchedule = {
        id: String(Date.now() + Math.random()),
        ad_id: data.ad_id,
        display_id: displayId,
        display_name: display?.name,
        start_time: data.start_time,
        end_time: data.end_time,
        priority: data.priority,
        ad: ad,
        created_at: new Date().toISOString(),
      };
      mockAdSchedules.push(newSchedule);
      newSchedules.push(newSchedule);
    }
    
    return newSchedules;
  },

  updateSchedule: async (id: string, data: Partial<AdSchedule>) => {
    await delay(500);
    const index = mockAdSchedules.findIndex(s => s.id === id);
    if (index !== -1) {
      const ad = data.ad_id ? mockAds.find(a => a.id === data.ad_id) : mockAdSchedules[index].ad;
      mockAdSchedules[index] = {
        ...mockAdSchedules[index],
        ...data,
        ad: ad,
      };
      return mockAdSchedules[index];
    }
    throw new Error('Schedule not found');
  },

  deleteSchedule: async (id: string) => {
    await delay(500);
    const index = mockAdSchedules.findIndex(s => s.id === id);
    if (index !== -1) {
      mockAdSchedules.splice(index, 1);
    }
  },

  // Announcements
  getAnnouncements: async () => {
    await delay(400);
    return mockAnnouncements;
  },

  createAnnouncement: async (data: any) => {
    await delay(500);
    const newAnnouncement: Announcement = {
      id: String(mockAnnouncements.length + 1),
      ...data,
      created_by: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockAnnouncements.push(newAnnouncement);
    return newAnnouncement;
  },

  updateAnnouncement: async (id: string, data: Partial<Announcement>) => {
    await delay(500);
    const index = mockAnnouncements.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAnnouncements[index] = {
        ...mockAnnouncements[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return mockAnnouncements[index];
    }
    throw new Error('Announcement not found');
  },

  deleteAnnouncement: async (id: string) => {
    await delay(500);
    const index = mockAnnouncements.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAnnouncements.splice(index, 1);
    }
  },

  // Users
  getUsers: async () => {
    await delay(400);
    return { data: mockUsers, total: mockUsers.length, page: 1, per_page: 10, total_pages: 1 };
  },
};
