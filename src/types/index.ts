// User & Auth types
export type UserType = 'ADMIN' | 'STAFF';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
}

export interface AuthResponse {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
}

// Stop types
export interface Stop {
  id: number;
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

export interface StopQueryParams {
  search?: string;
}

// Route types
export interface Route {
  id: number;
  name: string;
  code: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  route_stops?: RouteStop[];
}

export interface RouteStop {
  id: number;
  route_id: number;
  stop_id: number;
  sequence_number: number;
  distance_from_prev?: number | null;
  stop?: Stop;
}

export interface AddStopToRouteInput {
  stop_id: number;
  sequence_number: number;
}

export interface ReorderStopsInput {
  route_stop_ids: number[];
}

export interface CreateRouteInput {
  name: string;
  code: string;
  description?: string;
  color?: string;
}

export interface RouteQueryParams {
  search?: string;
}

// Bus types
export interface Bus {
  id: number;
  registration_number: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  route_id: number | null;
  route: BusRoute | null;
  last_location: BusLocation | null;
  next_stop?: NextStop | null;
  created_at: string;
  updated_at: string;
}

export interface BusRoute {
  id: number;
  name: string;
  code: string;
  color: string;
  description?: string;
  stops?: RouteStopInfo[];
}

export interface RouteStopInfo {
  sequence: number;
  stop_id: number;
  stop_name: string;
  latitude: number;
  longitude: number;
  distance_from_prev_meters: number;
}

export interface BusLocation {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  current_stop_sequence: number;
  timestamp: string;
}

export interface NextStop {
  sequence: number;
  stop_id: number;
  stop_name: string;
  distance_meters: number;
  eta_minutes: number;
}

export interface BusETA {
  stop_id: number;
  stop_name: string;
  distance_meters: number;
  eta_minutes: number;
  status: 'ontime' | 'delayed';
}

export interface CreateBusInput {
  registration_number: string;
  capacity?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  route_id?: number | null;
}

export interface ActiveBus {
  id: number;
  registration_number: string;
  route_id: number;
  route_code: string;
  route_color: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  current_stop_sequence: number;
  next_stop_name: string;
}

export interface BusTrip {
  id: number;
  route_id: number;
  direction: 'outbound' | 'inbound';
  start_time: string;
  end_time?: string;
  current_stop_sequence?: number;
  status: 'in-progress' | 'completed' | 'cancelled';
  total_duration_minutes?: number;
}

export interface StartTripInput {
  route_id?: number;
  direction?: 'outbound' | 'inbound';
  start_stop_sequence?: number;
}

export interface StartTripResponse {
  bus_id: number;
  status: string;
  trip: BusTrip;
  message: string;
}

export interface EndTripResponse {
  bus_id: number;
  status: string;
  trip: BusTrip;
  message: string;
}

// Display Unit types
export interface DisplayUnit {
  id: number;
  name: string;
  stop_id: number;
  stop?: Stop;
  status: 'online' | 'offline' | 'error';
  location?: string;
  last_heartbeat?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDisplayInput {
  name: string;
  stop_id: number;
  location?: string;
  status?: 'online' | 'offline' | 'error';
}

// Display Content types (for SMD)
export interface UpcomingBus {
  bus_id: number;
  registration_number: string;
  route_id: number;
  route_name: string;
  route_code: string;
  route_color: string;
  eta_minutes: number;
  distance_meters: number;
  arrival_status: 'arriving' | 'approaching' | 'on-route';
}

export interface DisplayAnnouncement {
  id: number;
  title: string;
  message: string;
  message_ur?: string;
  severity: 'info' | 'warning' | 'emergency';
}

export interface DisplayAdvertisement {
  id: number;
  title: string;
  content_url: string;
  media_type: 'image' | 'youtube';
  duration_seconds: number;
  priority: number;
}

export interface DisplayContent {
  display: {
    id: number;
    name: string;
    stop_id: number;
  };
  stop: Stop;
  upcoming_buses: UpcomingBus[];
  announcements: DisplayAnnouncement[];
  advertisements: DisplayAdvertisement[];
  timestamp: string;
}

// Stop ETA types
export interface StopETAResponse {
  stop: {
    id: number;
    name: string;
  };
  etas: StopBusETA[];
  timestamp: string;
}

export interface StopBusETA {
  bus_id: number;
  registration_number: string;
  route_id: number;
  route_name: string;
  route_code: string;
  route_color: string;
  eta_minutes: number;
  distance_meters: number;
  current_latitude: number;
  current_longitude: number;
}

// Route ETA types
export interface RouteETAResponse {
  route: {
    id: number;
    name: string;
    code: string;
    color: string;
  };
  buses: RouteBusETA[];
  timestamp: string;
}

export interface RouteBusETA {
  bus_id: number;
  registration_number: string;
  current_stop_sequence: number;
  next_stops: {
    stop_id: number;
    stop_name: string;
    sequence: number;
    eta_minutes: number;
    distance_meters: number;
  }[];
}

// Heartbeat response
export interface HeartbeatResponse {
  id: number;
  status: 'online' | 'offline' | 'error';
  last_heartbeat: string;
  message: string;
}

// Advertisement types
export interface Advertisement {
  id: number;
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
  id: number;
  ad_id: number;
  display_id: number;
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
  ad_id: number;
  display_ids: number[]; // Changed to array for multi-select
  start_time: string;
  end_time: string;
  priority: number;
}

// Announcement types
export interface Announcement {
  id: number;
  title: string;
  message: string;
  message_ur?: string;
  severity: 'info' | 'warning' | 'emergency';
  start_time: string;
  end_time: string;
  route_ids: number[]; // Routes where announcement will be displayed
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
  route_ids: number[]; // Empty array means all routes
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
  inactive_buses: number;
  maintenance_buses: number;
  total_routes: number;
  total_stops: number;
  online_displays: number;
  offline_displays: number;
  error_displays: number;
  active_announcements: number;
  active_ads: number;
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
