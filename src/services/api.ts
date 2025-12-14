// API Services - Uses real API for all features
import { apiClient } from '@/lib/api-client';
import type {
  AuthResponse,
  LoginCredentials,
  User,
  RegisterUserInput,
  Stop,
  CreateStopInput,
  StopQueryParams,
  Route,
  CreateRouteInput,
  RouteQueryParams,
  RouteStop,
  AddStopToRouteInput,
  Bus,
  CreateBusInput,
  ActiveBus,
  StartTripInput,
  StartTripResponse,
  EndTripResponse,
  DisplayUnit,
  CreateDisplayInput,
  DisplayContent,
  HeartbeatResponse,
  StopETAResponse,
  RouteETAResponse,
  Advertisement,
  CreateAdInput,
  AdSchedule,
  CreateAdScheduleInput,
  Announcement,
  CreateAnnouncementInput,
  DashboardStats,
} from '@/types';

// Auth API - Real API
export const authApi = {
  login: (credentials: LoginCredentials) => 
    apiClient.post<AuthResponse>('/login/', credentials),
  
  getMe: () => 
    apiClient.get<User>('/me/'),
  
  logout: async () => {
    apiClient.clearAuth();
  },
};

// Users API - Real API (Admin only)
export const usersApi = {
  getUsers: () => 
    apiClient.get<User[]>('/users/'),
  
  registerUser: (data: RegisterUserInput) =>
    apiClient.post<{ token: string }>('/register/', data),
};

// Stops API - Real API
export const stopsApi = {
  getStops: async (params?: StopQueryParams) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    const queryString = searchParams.toString();
    return apiClient.get<Stop[]>(`/stops/${queryString ? `?${queryString}` : ''}`);
  },
  getStop: (id: number) => apiClient.get<Stop>(`/stops/${id}/`),
  createStop: (data: CreateStopInput) => apiClient.post<Stop>('/stops/', data),
  updateStop: (id: number, data: Partial<CreateStopInput>) =>
    apiClient.patch<Stop>(`/stops/${id}/`, data),
  deleteStop: (id: number) => apiClient.delete<void>(`/stops/${id}/`),
  // ETA endpoint
  getETAs: async (stopId: number, params?: { route_id?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.route_id) searchParams.append('route_id', params.route_id.toString());
    const queryString = searchParams.toString();
    return apiClient.get<StopETAResponse>(`/stops/${stopId}/etas/${queryString ? `?${queryString}` : ''}`);
  },
};

// Routes API - Real API
export const routesApi = {
  getRoutes: async (params?: RouteQueryParams) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    const queryString = searchParams.toString();
    return apiClient.get<Route[]>(`/routes/${queryString ? `?${queryString}` : ''}`);
  },
  getRoute: (id: number) => apiClient.get<Route>(`/routes/${id}/`),
  createRoute: (data: CreateRouteInput) => apiClient.post<Route>('/routes/', data),
  updateRoute: (id: number, data: Partial<CreateRouteInput>) =>
    apiClient.patch<Route>(`/routes/${id}/`, data),
  deleteRoute: (id: number) => apiClient.delete<void>(`/routes/${id}/`),
  // Route-stops management
  addStopToRoute: (routeId: number, data: AddStopToRouteInput) =>
    apiClient.post<RouteStop>(`/routes/${routeId}/stops/`, data),
  removeStopFromRoute: (routeId: number, routeStopId: number) =>
    apiClient.delete<void>(`/routes/${routeId}/stops/${routeStopId}/`),
  reorderRouteStops: (routeId: number, routeStopIds: number[]) =>
    apiClient.put<{ message: string; route_stops: RouteStop[] }>(
      `/routes/${routeId}/stops/reorder/`,
      { route_stop_ids: routeStopIds }
    ),
  // ETA endpoint
  getETAs: (routeId: number) => 
    apiClient.get<RouteETAResponse>(`/routes/${routeId}/etas/`),
};

// Buses API - Real API
export const busesApi = {
  getBuses: async (params?: { status?: string; route_id?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.route_id) searchParams.append('route_id', params.route_id.toString());
    if (params?.search) searchParams.append('search', params.search);
    const queryString = searchParams.toString();
    const response = await apiClient.get<Bus[]>(`/buses/${queryString ? `?${queryString}` : ''}`);
    console.log('[DEBUG] getBuses response:', response);
    return response;
  },
  getBus: async (id: number) => {
    const response = await apiClient.get<Bus>(`/buses/${id}/`);
    console.log('[DEBUG] getBus response:', response);
    return response;
  },
  createBus: (data: CreateBusInput) => apiClient.post<Bus>('/buses/', data),
  updateBus: (id: number, data: Partial<CreateBusInput>) => 
    apiClient.patch<Bus>(`/buses/${id}/`, data),
  deleteBus: (id: number) => apiClient.delete<void>(`/buses/${id}/`),
  updateLocation: (id: number, data: { latitude: number; longitude: number; speed?: number; heading?: number }) =>
    apiClient.post<{ id: number; bus_id: number; latitude: number; longitude: number; speed: number; heading: number; current_stop_sequence: number; timestamp: string }>(`/buses/${id}/location/`, data),
  startTrip: (id: number, data?: StartTripInput) => 
    apiClient.post<StartTripResponse>(`/buses/${id}/start-trip/`, data || {}),
  endTrip: (id: number, data?: { status?: 'inactive' | 'maintenance' }) => 
    apiClient.post<EndTripResponse>(`/buses/${id}/end-trip/`, data || {}),
  getActiveBuses: () => apiClient.get<ActiveBus[]>('/buses/active/'),
};

// Display Units API - Real API
export const displaysApi = {
  getDisplays: async (params?: { search?: string; status?: string; stop_id?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.stop_id) searchParams.append('stop_id', params.stop_id.toString());
    const queryString = searchParams.toString();
    return apiClient.get<DisplayUnit[]>(`/displays/${queryString ? `?${queryString}` : ''}`);
  },
  getDisplay: (id: number) => apiClient.get<DisplayUnit>(`/displays/${id}/`),
  createDisplay: (data: CreateDisplayInput) => apiClient.post<DisplayUnit>('/displays/', data),
  updateDisplay: (id: number, data: Partial<DisplayUnit>) => 
    apiClient.patch<DisplayUnit>(`/displays/${id}/`, data),
  deleteDisplay: (id: number) => apiClient.delete<void>(`/displays/${id}/`),
  sendHeartbeat: (id: number, status: 'online' | 'offline' | 'error') => 
    apiClient.post<HeartbeatResponse>(`/displays/${id}/heartbeat/`, { status }),
  getDisplayContent: (id: number) => 
    apiClient.get<DisplayContent>(`/displays/${id}/content/`),
};

// Advertisements API - Real API
export const adsApi = {
  getAds: async (params?: { search?: string; media_type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.media_type) searchParams.append('media_type', params.media_type);
    const queryString = searchParams.toString();
    return apiClient.get<Advertisement[]>(`/advertisements/${queryString ? `?${queryString}` : ''}`);
  },
  getAd: (id: number) => apiClient.get<Advertisement>(`/advertisements/${id}/`),
  createAd: (data: CreateAdInput) => apiClient.post<Advertisement>('/advertisements/', data),
  updateAd: (id: number, data: Partial<Advertisement>) => 
    apiClient.patch<Advertisement>(`/advertisements/${id}/`, data),
  deleteAd: (id: number) => apiClient.delete<void>(`/advertisements/${id}/`),
  
  // Ad Schedules
  getSchedules: async (params?: { ad_id?: number; display_id?: number; active?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.ad_id) searchParams.append('ad_id', params.ad_id.toString());
    if (params?.display_id) searchParams.append('display_id', params.display_id.toString());
    if (params?.active !== undefined) searchParams.append('active', params.active.toString());
    const queryString = searchParams.toString();
    return apiClient.get<AdSchedule[]>(`/ad-schedules/${queryString ? `?${queryString}` : ''}`);
  },
  getSchedule: (id: number) => apiClient.get<AdSchedule>(`/ad-schedules/${id}/`),
  createSchedule: (data: CreateAdScheduleInput) => 
    apiClient.post<AdSchedule[]>('/ad-schedules/', data),
  updateSchedule: (id: number, data: Partial<AdSchedule>) => 
    apiClient.patch<AdSchedule>(`/ad-schedules/${id}/`, data),
  deleteSchedule: (id: number) => apiClient.delete<void>(`/ad-schedules/${id}/`),
};

// Advertisers API - Real API (added for 3NF migration)
export const advertisersApi = {
  getAdvertisers: async (params?: { search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    const queryString = searchParams.toString();
    return apiClient.get(`/advertisers/${queryString ? `?${queryString}` : ''}`);
  },
  getAdvertiser: (id: number) => apiClient.get(`/advertisers/${id}/`),
  createAdvertiser: (data: { advertiser_name: string; contact_phone?: string; contact_email?: string; address?: string }) =>
    apiClient.post('/advertisers/', data),
  updateAdvertiser: (id: number, data: Partial<{ advertiser_name: string; contact_phone?: string; contact_email?: string; address?: string }>) =>
    apiClient.patch(`/advertisers/${id}/`, data),
  deleteAdvertiser: (id: number) => apiClient.delete(`/advertisers/${id}/`),
};

// Announcements API - Real API
export const announcementsApi = {
  getAnnouncements: async (params?: { search?: string; severity?: string; active?: boolean; route_id?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.active !== undefined) searchParams.append('active', params.active.toString());
    if (params?.route_id) searchParams.append('route_id', params.route_id.toString());
    const queryString = searchParams.toString();
    return apiClient.get<Announcement[]>(`/announcements/${queryString ? `?${queryString}` : ''}`);
  },
  getAnnouncement: (id: number) => apiClient.get<Announcement>(`/announcements/${id}/`),
  createAnnouncement: (data: CreateAnnouncementInput) => 
    apiClient.post<Announcement>('/announcements/', data),
  updateAnnouncement: (id: number, data: Partial<Announcement>) => 
    apiClient.patch<Announcement>(`/announcements/${id}/`, data),
  deleteAnnouncement: (id: number) => apiClient.delete<void>(`/announcements/${id}/`),
};

// Dashboard API - Real API
export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats/'),
  getRecentActivity: () => Promise.resolve([]),
};
