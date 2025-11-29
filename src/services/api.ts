// API Services - Uses real API for auth/users/buses/dashboard/stops/routes, mock for other features
import { mockApi } from './mockApi';
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
  Advertisement,
  CreateAdInput,
  AdSchedule,
  CreateAdScheduleInput,
  Announcement,
  CreateAnnouncementInput,
  DashboardStats,
  ListQueryParams,
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

// Display Units API (Mock - to be implemented)
export const displaysApi = {
  getDisplays: (_params?: ListQueryParams) => mockApi.getDisplays(),
  getDisplay: (id: string) => mockApi.getDisplay(id),
  createDisplay: (data: CreateDisplayInput & { status: 'online' | 'offline' }) => mockApi.createDisplay(data),
  updateDisplay: (id: string, data: Partial<DisplayUnit>) => mockApi.updateDisplay(id, data),
  deleteDisplay: (id: string) => mockApi.deleteDisplay(id),
  getDisplaySimulation: (id: string) => mockApi.getDisplaySimulation(id),
  getDisplayContent: (_id: string) => Promise.resolve({ ads: [], announcements: [] }),
};

// Advertisements API (Mock - to be implemented)
export const adsApi = {
  getAds: (_params?: ListQueryParams) => mockApi.getAds(),
  getAd: (id: string) => Promise.resolve(mockApi.getAds().then(ads => ads.find(a => a.id === id) || ads[0])),
  createAd: (data: CreateAdInput) => mockApi.createAd(data),
  updateAd: (id: string, data: Partial<Advertisement>) => mockApi.updateAd(id, data),
  deleteAd: (id: string) => mockApi.deleteAd(id),
  getSchedules: (_params?: ListQueryParams) => mockApi.getSchedules(),
  createSchedule: (data: CreateAdScheduleInput) => mockApi.createSchedule(data),
  updateSchedule: (id: string, data: Partial<AdSchedule>) => mockApi.updateSchedule(id, data),
  deleteSchedule: (id: string) => mockApi.deleteSchedule(id),
};

// Announcements API (Mock - to be implemented)
export const announcementsApi = {
  getAnnouncements: (_params?: ListQueryParams) => mockApi.getAnnouncements(),
  getAnnouncement: (id: string) => Promise.resolve(mockApi.getAnnouncements().then(a => a.find(ann => ann.id === id))),
  createAnnouncement: (data: CreateAnnouncementInput) => mockApi.createAnnouncement(data),
  updateAnnouncement: (id: string, data: Partial<Announcement>) => mockApi.updateAnnouncement(id, data),
  deleteAnnouncement: (id: string) => mockApi.deleteAnnouncement(id),
};

// Dashboard API - Real API
export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats/'),
  getRecentActivity: (_params?: ListQueryParams) =>
    Promise.resolve([]),
};
