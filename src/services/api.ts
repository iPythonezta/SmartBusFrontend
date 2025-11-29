// Mock API for demo - replace with real API calls when backend is ready
import { mockApi } from './mockApi';
import type {
  AuthResponse,
  LoginCredentials,
  User,
  Stop,
  CreateStopInput,
  StopQueryParams,
  Route,
  CreateRouteInput,
  Bus,
  CreateBusInput,
  DisplayUnit,
  CreateDisplayInput,
  DisplaySimulation,
  Advertisement,
  CreateAdInput,
  AdSchedule,
  CreateAdScheduleInput,
  Announcement,
  CreateAnnouncementInput,
  DashboardStats,
  AuditLog,
  ListQueryParams,
  PaginatedResponse,
} from '@/types';

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) => mockApi.login(credentials),
  getMe: () => mockApi.getMe(),
  logout: async () => { /* Mock logout */ },
};

// Users API
export const usersApi = {
  getUsers: (params?: ListQueryParams) => mockApi.getUsers(),
  createUser: (data: { name: string; email: string; password: string; role: string }) =>
    Promise.resolve({ id: '3', ...data, created_at: new Date().toISOString() } as User),
  updateUser: (id: string, data: Partial<User>) =>
    Promise.resolve({ id, ...data } as User),
  deleteUser: (id: string) => Promise.resolve(),
  getAuditLogs: (params?: ListQueryParams) =>
    Promise.resolve({ data: [], total: 0, page: 1, per_page: 10, total_pages: 0 }),
};

// Stops API
export const stopsApi = {
  getStops: (params?: StopQueryParams) => mockApi.getStops(),
  getStop: (id: string) => mockApi.getStop(id),
  createStop: (data: CreateStopInput) => mockApi.createStop(data),
  updateStop: (id: string, data: Partial<Stop>) =>
    Promise.resolve({ id, ...data } as Stop),
  deleteStop: (id: string) => Promise.resolve(),
};

// Routes API
export const routesApi = {
  getRoutes: (params?: ListQueryParams) => mockApi.getRoutes(),
  getRoute: (id: string) => mockApi.getRoute(id),
  createRoute: (data: CreateRouteInput) => mockApi.createRoute(data),
  updateRoute: (id: string, data: Partial<Route>) =>
    Promise.resolve({ id, ...data } as Route),
  deleteRoute: (id: string) => Promise.resolve(),
  addStopToRoute: (routeId: string, stopId: string, sequenceNumber: number) =>
    Promise.resolve(),
  reorderRouteStops: (routeId: string, routeStopIds: string[]) =>
    Promise.resolve(),
};

// Buses API
export const busesApi = {
  getBuses: (params?: ListQueryParams) => mockApi.getBuses(),
  getBus: (id: string) => mockApi.getBus(id),
  createBus: (data: CreateBusInput) => mockApi.createBus(data),
  updateBus: (id: string, data: Partial<Bus>) =>
    Promise.resolve({ id, ...data } as Bus),
  deleteBus: (id: string) => Promise.resolve(),
  assignRoute: (busId: string, routeId: string) => Promise.resolve(),
};

// Display Units API
export const displaysApi = {
  getDisplays: (params?: ListQueryParams) => mockApi.getDisplays(),
  getDisplay: (id: string) => mockApi.getDisplay(id),
  createDisplay: (data: CreateDisplayInput & { status: 'online' | 'offline' }) => mockApi.createDisplay(data),
  updateDisplay: (id: string, data: Partial<DisplayUnit>) => mockApi.updateDisplay(id, data),
  deleteDisplay: (id: string) => mockApi.deleteDisplay(id),
  getDisplaySimulation: (id: string) => mockApi.getDisplaySimulation(id),
  getDisplayContent: (id: string) => Promise.resolve({ ads: [], announcements: [] }),
};

// Advertisements API
export const adsApi = {
  getAds: (params?: ListQueryParams) => mockApi.getAds(),
  getAd: (id: string) => Promise.resolve(mockApi.getAds().then(ads => ads.find(a => a.id === id) || ads[0])),
  createAd: (data: CreateAdInput) => mockApi.createAd(data),
  updateAd: (id: string, data: Partial<Advertisement>) => mockApi.updateAd(id, data),
  deleteAd: (id: string) => mockApi.deleteAd(id),
  getSchedules: (params?: ListQueryParams) => mockApi.getSchedules(),
  createSchedule: (data: CreateAdScheduleInput) => mockApi.createSchedule(data),
  updateSchedule: (id: string, data: Partial<AdSchedule>) => mockApi.updateSchedule(id, data),
  deleteSchedule: (id: string) => mockApi.deleteSchedule(id),
};

// Announcements API
export const announcementsApi = {
  getAnnouncements: (params?: ListQueryParams) => mockApi.getAnnouncements(),
  getAnnouncement: (id: string) => Promise.resolve(mockApi.getAnnouncements().then(a => a.find(ann => ann.id === id))),
  createAnnouncement: (data: CreateAnnouncementInput) => mockApi.createAnnouncement(data),
  updateAnnouncement: (id: string, data: Partial<Announcement>) => mockApi.updateAnnouncement(id, data),
  deleteAnnouncement: (id: string) => mockApi.deleteAnnouncement(id),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => mockApi.getStats(),
  getRecentActivity: (params?: ListQueryParams) =>
    Promise.resolve([]),
};
