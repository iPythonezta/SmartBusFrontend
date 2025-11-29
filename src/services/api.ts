// API Services - Uses real API for auth/users/buses/dashboard, mock for other features
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

// Stops API (Mock - to be implemented)
export const stopsApi = {
  getStops: (_params?: StopQueryParams) => mockApi.getStops(),
  getStop: (id: string) => mockApi.getStop(id),
  createStop: (data: CreateStopInput) => mockApi.createStop(data),
  updateStop: (id: string, data: Partial<Stop>) =>
    Promise.resolve({ id, ...data } as Stop),
  deleteStop: (_id: string) => Promise.resolve(),
};

// Routes API (Mock - to be implemented)
export const routesApi = {
  getRoutes: (_params?: ListQueryParams) => mockApi.getRoutes(),
  getRoute: (id: string) => mockApi.getRoute(id),
  createRoute: (data: CreateRouteInput) => mockApi.createRoute(data),
  updateRoute: (id: string, data: Partial<Route>) =>
    Promise.resolve({ id, ...data } as Route),
  deleteRoute: (_id: string) => Promise.resolve(),
  addStopToRoute: (_routeId: string, _stopId: string, _sequenceNumber: number) =>
    Promise.resolve(),
  reorderRouteStops: (_routeId: string, _routeStopIds: string[]) =>
    Promise.resolve(),
};

// Buses API - Real API
export const busesApi = {
  getBuses: (params?: { status?: string; route_id?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.route_id) searchParams.append('route_id', params.route_id.toString());
    if (params?.search) searchParams.append('search', params.search);
    const queryString = searchParams.toString();
    return apiClient.get<Bus[]>(`/buses/${queryString ? `?${queryString}` : ''}`);
  },
  getBus: (id: number) => apiClient.get<Bus>(`/buses/${id}/`),
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
