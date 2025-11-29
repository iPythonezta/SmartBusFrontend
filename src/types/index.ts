// User & Auth types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Stop types
export interface Stop {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStopInput {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
}

// Route types
export interface Route {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  route_stops?: RouteStop[];
}

export interface RouteStop {
  id: string;
  route_id: string;
  stop_id: string;
  sequence_number: number;
  distance_from_prev?: number;
  stop?: Stop;
}

export interface CreateRouteInput {
  name: string;
  code: string;
  description?: string;
  color?: string;
}

// Bus types
export interface Bus {
  id: string;
  registration_number: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  assigned_route_id?: string;
  assigned_route?: Route;
  last_location?: BusLocation;
  created_at: string;
  updated_at: string;
}

export interface BusLocation {
  id: string;
  bus_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface BusETA {
  stop_id: string;
  stop_name: string;
  distance_meters: number;
  eta_minutes: number;
  status: 'ontime' | 'delayed';
}

export interface CreateBusInput {
  registration_number: string;
  capacity: number;
  status?: 'active' | 'inactive' | 'maintenance';
  assigned_route_id?: string;
}

// Display Unit types
export interface DisplayUnit {
  id: string;
  name: string;
  stop_id: string;
  stop?: Stop;
  status: 'online' | 'offline';
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface DisplaySimulation {
  display_id: string;
  stop: Stop;
  route?: Route;
  etas: BusETA[];
  announcements: Announcement[];
  ads: AdContent[];
  timestamp: string;
}

export interface CreateDisplayInput {
  name: string;
  stop_id: string;
  location?: string;
}

// Advertisement types
export interface Advertisement {
  id: string;
  title: string;
  content_url: string;
  media_type: 'image' | 'youtube';
  duration_seconds: number;
  advertiser_name: string;
  advertiser_contact?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AdSchedule {
  id: string;
  ad_id: string;
  display_id: string;
  display_name?: string;
  start_time: string;
  end_time: string;
  priority: number;
  ad?: Advertisement;
  created_at: string;
}

export interface AdContent {
  ad: Advertisement;
  schedule: AdSchedule;
}

export interface CreateAdInput {
  title: string;
  content_url: string;
  media_type: 'image' | 'youtube';
  duration_seconds: number;
  advertiser_name: string;
  advertiser_contact?: string;
  metadata?: Record<string, any>;
}

export interface CreateAdScheduleInput {
  ad_id: string;
  display_ids: string[]; // Changed to array for multi-select
  start_time: string;
  end_time: string;
  priority: number;
}

// Announcement types
export interface Announcement {
  id: string;
  title: string;
  message: string;
  message_ur?: string;
  severity: 'info' | 'warning' | 'emergency';
  start_time: string;
  end_time: string;
  route_ids: string[]; // Routes where announcement will be displayed
  routes?: Route[]; // Populated route objects
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementInput {
  title: string;
  message: string;
  message_ur?: string;
  severity: 'info' | 'warning' | 'emergency';
  start_time: string;
  end_time: string;
  route_ids: string[]; // Empty array means all routes
}

// Real-time types
export interface RealtimeUpdate {
  type: 'bus_location' | 'eta_update' | 'announcement' | 'display_status';
  data: any;
  timestamp: string;
}

export interface BusLocationUpdate {
  bus_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Query params
export interface StopQueryParams {
  search?: string;
  near?: string; // "lat,lng"
  radius?: number;
}

export interface ListQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

// Dashboard types
export interface DashboardStats {
  total_buses: number;
  active_buses: number;
  total_routes: number;
  total_stops: number;
  online_displays: number;
  active_announcements: number;
}

// Audit log types
export interface AuditLog {
  id: string;
  user_id: string;
  user?: User;
  action: string;
  entity_type: string;
  entity_id: string;
  changes?: Record<string, any>;
  timestamp: string;
}
