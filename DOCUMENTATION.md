# Smart Bus Management Dashboard (SMDB) - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Authentication System](#authentication-system)
5. [API Integration Layer](#api-integration-layer)
6. [Type Definitions](#type-definitions)
7. [State Management](#state-management)
8. [Pages Documentation](#pages-documentation)
9. [Components Documentation](#components-documentation)
10. [GPS Simulator](#gps-simulator)
11. [SMD Display Simulator](#smd-display-simulator)
12. [Map Integration](#map-integration)
13. [Internationalization](#internationalization)
14. [Configuration Files](#configuration-files)

---

## 1. Project Overview

The Smart Bus Management Dashboard (SMDB) is a comprehensive web application for managing a public transportation system. It provides:

- **Fleet Management**: Track and manage buses, their routes, and real-time locations
- **Route Management**: Create and manage bus routes with stops
- **Stop Management**: Define bus stops with geographic coordinates
- **Display Units (SMD)**: Manage digital signage displays at bus stops
- **Advertisements**: Schedule and manage ads displayed on SMD units
- **Announcements**: Broadcast messages to passengers via displays
- **GPS Simulation**: Test bus tracking without physical hardware
- **SMD Simulation**: Preview how content appears on display units

### Backend API

The frontend connects to a Django REST API backend. Base URL is configured via `VITE_API_URL` environment variable (default: `http://localhost:8000/api`).

---

## 2. Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool & Dev Server |
| TanStack Query | 5.x | Server State Management |
| Zustand | 4.x | Client State Management |
| React Router | 6.x | Client-Side Routing |
| Tailwind CSS | 3.x | Utility-First Styling |

### Additional Libraries

| Library | Purpose |
|---------|---------|
| Mapbox GL JS | Interactive Maps |
| Axios | HTTP Client |
| React Hook Form | Form Management |
| Zod | Schema Validation |
| Framer Motion | Animations |
| i18next | Internationalization |
| @dnd-kit | Drag and Drop (route stop reordering) |
| Lucide React | Icons |

---

## 3. Project Structure

```
src/
├── App.tsx                 # Main application component with routing
├── main.tsx                # Application entry point
├── index.css               # Global styles (Tailwind imports)
│
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx    # Route guard for authentication
│   ├── layout/
│   │   ├── MainLayout.tsx        # Dashboard layout wrapper
│   │   ├── SideNav.tsx           # Sidebar navigation
│   │   └── TopNav.tsx            # Top navigation bar
│   ├── map/
│   │   ├── MapboxMap.tsx         # Mapbox map component
│   │   ├── MapCanvas.tsx         # Canvas-based map (legacy)
│   │   └── index.ts              # Map exports
│   ├── modals/
│   │   ├── AdModal.tsx           # Create/Edit advertisement
│   │   ├── AdScheduleModal.tsx   # Schedule ads to displays
│   │   ├── AnnouncementModal.tsx # Create/Edit announcement
│   │   ├── BusModal.tsx          # Create/Edit bus
│   │   ├── DisplayModal.tsx      # Create/Edit display unit
│   │   ├── RouteModal.tsx        # Create/Edit route
│   │   ├── StopModal.tsx         # Create/Edit stop
│   │   └── UserModal.tsx         # Create user (Admin only)
│   └── ui/                       # Reusable UI components (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
│
├── contexts/
│   └── AuthContext.tsx     # Authentication context & provider
│
├── i18n/
│   ├── index.ts            # i18next configuration
│   └── locales/
│       ├── en.json         # English translations
│       └── ur.json         # Urdu translations
│
├── lib/
│   ├── api-client.ts       # Axios instance with interceptors
│   └── utils.ts            # Utility functions (cn, formatDateTime)
│
├── pages/
│   ├── AdsPage.tsx         # Advertisements management
│   ├── AnnouncementsPage.tsx # Announcements management
│   ├── BusDetailPage.tsx   # Individual bus details
│   ├── BusesPage.tsx       # Fleet management
│   ├── DashboardPage.tsx   # Overview dashboard
│   ├── DisplaysPage.tsx    # SMD display units management
│   ├── GPSSimulatorPage.tsx # GPS simulation tool
│   ├── LoginPage.tsx       # Authentication
│   ├── RouteDetailPage.tsx # Route details with stop management
│   ├── RoutesPage.tsx      # Routes listing
│   ├── SettingsPage.tsx    # Application settings
│   ├── SMDSimulatorPage.tsx # Display simulator
│   ├── StopsPage.tsx       # Stops management
│   └── UsersPage.tsx       # User management (Admin)
│
├── providers/
│   └── QueryProvider.tsx   # TanStack Query provider
│
├── services/
│   ├── api.ts              # API service functions
│   ├── realtime.ts         # WebSocket/real-time simulation
│   └── routing.ts          # OSRM routing service
│
├── store/
│   └── index.ts            # Zustand stores
│
├── tests/
│   └── components.test.tsx # Component tests
│
└── types/
    └── index.ts            # TypeScript type definitions
```

---

## 4. Authentication System

### Location: `src/contexts/AuthContext.tsx`

The authentication system uses token-based authentication with the backend API.

### Authentication Flow

```
1. User enters credentials on LoginPage
2. AuthContext.login() is called
3. POST /api/login/ with {email, password}
4. Backend returns {token: "..."}
5. Token stored in localStorage as 'auth_token'
6. GET /api/me/ to fetch user details
7. User data stored in context and localStorage
8. Navigate to /dashboard
```

### AuthContext Interface

```typescript
interface AuthContextType {
  user: User | null;           // Current user object
  isLoading: boolean;          // Initial auth check in progress
  isAuthenticated: boolean;    // Is user logged in
  isAdmin: boolean;            // Is user an admin (user_type === 'ADMIN')
  login: (credentials) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Token Management

**Location**: `src/lib/api-client.ts`

```typescript
// Token stored in localStorage
localStorage.setItem('auth_token', token);

// Request interceptor adds token to headers
config.headers.Authorization = `Token ${token}`;

// Response interceptor handles 401 errors
if (error.response?.status === 401 && !isLoginEndpoint && token) {
  this.clearAuth();
  window.location.href = '/login';
}
```

### Protected Routes

**Location**: `src/components/auth/ProtectedRoute.tsx`

```typescript
// Wraps routes that require authentication
<ProtectedRoute>
  <MainLayout />
</ProtectedRoute>

// For admin-only routes
<ProtectedRoute requireAdmin>
  <UsersPage />
</ProtectedRoute>
```

### User Types

```typescript
type UserType = 'ADMIN' | 'STAFF';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
}
```

---

## 5. API Integration Layer

### Location: `src/services/api.ts`

All API calls are organized by resource type. Each API module exports functions that call the backend.

### API Client Configuration

**Location**: `src/lib/api-client.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  // Axios instance with base URL
  private client: AxiosInstance;
  
  // Generic methods
  async get<T>(url: string): Promise<T>
  async post<T>(url: string, data?: any): Promise<T>
  async patch<T>(url: string, data?: any): Promise<T>
  async put<T>(url: string, data?: any): Promise<T>
  async delete<T>(url: string): Promise<T>
  
  // Auth helpers
  setAuthToken(token: string): void
  clearAuth(): void
  isAuthenticated(): boolean
}
```

### API Modules

#### Auth API

```typescript
export const authApi = {
  // POST /api/login/
  // Body: { email, password }
  // Returns: { token: string }
  login: (credentials: LoginCredentials) => 
    apiClient.post<AuthResponse>('/login/', credentials),
  
  // GET /api/me/
  // Headers: Authorization: Token <token>
  // Returns: User object
  getMe: () => 
    apiClient.get<User>('/me/'),
  
  // Clears local storage tokens
  logout: async () => {
    apiClient.clearAuth();
  },
};
```

#### Users API (Admin Only)

```typescript
export const usersApi = {
  // GET /api/users/
  // Returns: User[]
  getUsers: () => 
    apiClient.get<User[]>('/users/'),
  
  // POST /api/register/
  // Body: { email, password, first_name, last_name, user_type }
  // Returns: { token: string }
  registerUser: (data: RegisterUserInput) =>
    apiClient.post<{ token: string }>('/register/', data),
};
```

#### Stops API

```typescript
export const stopsApi = {
  // GET /api/stops/?search=<query>
  // Returns: Stop[]
  getStops: async (params?: StopQueryParams) => {...},
  
  // GET /api/stops/<id>/
  // Returns: Stop
  getStop: (id: number) => apiClient.get<Stop>(`/stops/${id}/`),
  
  // POST /api/stops/
  // Body: { name, description?, latitude, longitude }
  // Returns: Stop
  createStop: (data: CreateStopInput) => apiClient.post<Stop>('/stops/', data),
  
  // PATCH /api/stops/<id>/
  // Body: Partial<CreateStopInput>
  // Returns: Stop
  updateStop: (id: number, data: Partial<CreateStopInput>) =>
    apiClient.patch<Stop>(`/stops/${id}/`, data),
  
  // DELETE /api/stops/<id>/
  deleteStop: (id: number) => apiClient.delete<void>(`/stops/${id}/`),
  
  // GET /api/stops/<id>/etas/?route_id=<id>
  // Returns: { stop, etas: StopBusETA[], timestamp }
  getETAs: async (stopId: number, params?: { route_id?: number }) => {...},
};
```

#### Routes API

```typescript
export const routesApi = {
  // GET /api/routes/?search=<query>
  // Returns: Route[] (includes route_stops with stop details)
  getRoutes: async (params?: RouteQueryParams) => {...},
  
  // GET /api/routes/<id>/
  // Returns: Route with route_stops
  getRoute: (id: number) => apiClient.get<Route>(`/routes/${id}/`),
  
  // POST /api/routes/
  // Body: { name, code, description?, color? }
  // Returns: Route
  createRoute: (data: CreateRouteInput) => apiClient.post<Route>('/routes/', data),
  
  // PATCH /api/routes/<id>/
  updateRoute: (id: number, data: Partial<CreateRouteInput>) =>
    apiClient.patch<Route>(`/routes/${id}/`, data),
  
  // DELETE /api/routes/<id>/
  deleteRoute: (id: number) => apiClient.delete<void>(`/routes/${id}/`),
  
  // --- Route-Stop Management ---
  
  // POST /api/routes/<routeId>/stops/
  // Body: { stop_id, sequence_number }
  // Returns: RouteStop
  addStopToRoute: (routeId: number, data: AddStopToRouteInput) =>
    apiClient.post<RouteStop>(`/routes/${routeId}/stops/`, data),
  
  // DELETE /api/routes/<routeId>/stops/<routeStopId>/
  removeStopFromRoute: (routeId: number, routeStopId: number) =>
    apiClient.delete<void>(`/routes/${routeId}/stops/${routeStopId}/`),
  
  // PUT /api/routes/<routeId>/stops/reorder/
  // Body: { route_stop_ids: number[] }
  // Returns: { message, route_stops: RouteStop[] }
  reorderRouteStops: (routeId: number, routeStopIds: number[]) =>
    apiClient.put<{ message: string; route_stops: RouteStop[] }>(
      `/routes/${routeId}/stops/reorder/`,
      { route_stop_ids: routeStopIds }
    ),
  
  // GET /api/routes/<id>/etas/
  // Returns: { route, buses: RouteBusETA[], timestamp }
  getETAs: (routeId: number) => 
    apiClient.get<RouteETAResponse>(`/routes/${routeId}/etas/`),
};
```

#### Buses API

```typescript
export const busesApi = {
  // GET /api/buses/?status=<status>&route_id=<id>&search=<query>
  // Returns: Bus[] (includes route details, last_location, next_stop)
  getBuses: async (params?: { status?: string; route_id?: number; search?: string }) => {...},
  
  // GET /api/buses/<id>/
  // Returns: Bus with full details
  getBus: async (id: number) => {...},
  
  // POST /api/buses/
  // Body: { registration_number, capacity?, status?, route_id? }
  // Returns: Bus
  createBus: (data: CreateBusInput) => apiClient.post<Bus>('/buses/', data),
  
  // PATCH /api/buses/<id>/
  updateBus: (id: number, data: Partial<CreateBusInput>) => 
    apiClient.patch<Bus>(`/buses/${id}/`, data),
  
  // DELETE /api/buses/<id>/
  deleteBus: (id: number) => apiClient.delete<void>(`/buses/${id}/`),
  
  // --- Location & Trip Management ---
  
  // POST /api/buses/<id>/location/
  // Body: { latitude, longitude, speed?, heading? }
  // Returns: { id, bus_id, latitude, longitude, speed, heading, current_stop_sequence, timestamp }
  // Note: Backend calculates current_stop_sequence based on position
  updateLocation: (id: number, data: { latitude: number; longitude: number; speed?: number; heading?: number }) =>
    apiClient.post<...>(`/buses/${id}/location/`, data),
  
  // POST /api/buses/<id>/start-trip/
  // Body: { route_id?, direction?, start_stop_sequence? } (all optional)
  // Returns: { bus_id, status, trip: BusTrip, message }
  startTrip: (id: number, data?: StartTripInput) => 
    apiClient.post<StartTripResponse>(`/buses/${id}/start-trip/`, data || {}),
  
  // POST /api/buses/<id>/end-trip/
  // Body: { status?: 'inactive' | 'maintenance' }
  // Returns: { bus_id, status, trip: BusTrip, message }
  endTrip: (id: number, data?: { status?: 'inactive' | 'maintenance' }) => 
    apiClient.post<EndTripResponse>(`/buses/${id}/end-trip/`, data || {}),
  
  // GET /api/buses/active/
  // Returns: ActiveBus[] (simplified bus data for real-time tracking)
  getActiveBuses: () => apiClient.get<ActiveBus[]>('/buses/active/'),
};
```

#### Display Units API

```typescript
export const displaysApi = {
  // GET /api/displays/?search=<query>&status=<status>&stop_id=<id>
  // Returns: DisplayUnit[]
  getDisplays: async (params?: { search?: string; status?: string; stop_id?: number }) => {...},
  
  // GET /api/displays/<id>/
  // Returns: DisplayUnit with stop details
  getDisplay: (id: number) => apiClient.get<DisplayUnit>(`/displays/${id}/`),
  
  // POST /api/displays/
  // Body: { name, stop_id, location?, status? }
  // Returns: DisplayUnit
  createDisplay: (data: CreateDisplayInput) => apiClient.post<DisplayUnit>('/displays/', data),
  
  // PATCH /api/displays/<id>/
  updateDisplay: (id: number, data: Partial<DisplayUnit>) => 
    apiClient.patch<DisplayUnit>(`/displays/${id}/`, data),
  
  // DELETE /api/displays/<id>/
  deleteDisplay: (id: number) => apiClient.delete<void>(`/displays/${id}/`),
  
  // POST /api/displays/<id>/heartbeat/
  // Body: { status: 'online' | 'offline' | 'error' }
  // Returns: HeartbeatResponse
  sendHeartbeat: (id: number, status: 'online' | 'offline' | 'error') => 
    apiClient.post<HeartbeatResponse>(`/displays/${id}/heartbeat/`, { status }),
  
  // GET /api/displays/<id>/content/
  // Returns: DisplayContent (buses, announcements, ads for this display)
  getDisplayContent: (id: number) => 
    apiClient.get<DisplayContent>(`/displays/${id}/content/`),
};
```

#### Advertisements API

```typescript
export const adsApi = {
  // GET /api/advertisements/?search=<query>&media_type=<type>
  // Returns: Advertisement[]
  getAds: async (params?: { search?: string; media_type?: string }) => {...},
  
  // GET /api/advertisements/<id>/
  getAd: (id: number) => apiClient.get<Advertisement>(`/advertisements/${id}/`),
  
  // POST /api/advertisements/
  // Body: { title, content_url, media_type, duration_seconds, advertiser_name, advertiser_contact?, metadata? }
  // Returns: Advertisement
  createAd: (data: CreateAdInput) => apiClient.post<Advertisement>('/advertisements/', data),
  
  // PATCH /api/advertisements/<id>/
  updateAd: (id: number, data: Partial<Advertisement>) => 
    apiClient.patch<Advertisement>(`/advertisements/${id}/`, data),
  
  // DELETE /api/advertisements/<id>/
  deleteAd: (id: number) => apiClient.delete<void>(`/advertisements/${id}/`),
  
  // --- Ad Schedules ---
  
  // GET /api/ad-schedules/?ad_id=<id>&display_id=<id>&active=<bool>
  // Returns: AdSchedule[]
  getSchedules: async (params?: { ad_id?: number; display_id?: number; active?: boolean }) => {...},
  
  // GET /api/ad-schedules/<id>/
  getSchedule: (id: number) => apiClient.get<AdSchedule>(`/ad-schedules/${id}/`),
  
  // POST /api/ad-schedules/
  // Body: { ad_id, display_ids: number[], start_time, end_time, priority }
  // Note: display_ids is an array - creates multiple schedules at once
  // Returns: AdSchedule[]
  createSchedule: (data: CreateAdScheduleInput) => 
    apiClient.post<AdSchedule[]>('/ad-schedules/', data),
  
  // PATCH /api/ad-schedules/<id>/
  updateSchedule: (id: number, data: Partial<AdSchedule>) => 
    apiClient.patch<AdSchedule>(`/ad-schedules/${id}/`, data),
  
  // DELETE /api/ad-schedules/<id>/
  deleteSchedule: (id: number) => apiClient.delete<void>(`/ad-schedules/${id}/`),
};
```

#### Announcements API

```typescript
export const announcementsApi = {
  // GET /api/announcements/?search=<query>&severity=<level>&active=<bool>&route_id=<id>
  // Returns: Announcement[]
  getAnnouncements: async (params?: { search?: string; severity?: string; active?: boolean; route_id?: number }) => {...},
  
  // GET /api/announcements/<id>/
  getAnnouncement: (id: number) => apiClient.get<Announcement>(`/announcements/${id}/`),
  
  // POST /api/announcements/
  // Body: { title, message, message_ur?, severity, start_time, end_time, route_ids: number[] }
  // Note: route_ids empty = all routes
  // Returns: Announcement
  createAnnouncement: (data: CreateAnnouncementInput) => 
    apiClient.post<Announcement>('/announcements/', data),
  
  // PATCH /api/announcements/<id>/
  updateAnnouncement: (id: number, data: Partial<Announcement>) => 
    apiClient.patch<Announcement>(`/announcements/${id}/`, data),
  
  // DELETE /api/announcements/<id>/
  deleteAnnouncement: (id: number) => apiClient.delete<void>(`/announcements/${id}/`),
};
```

#### Dashboard API

```typescript
export const dashboardApi = {
  // GET /api/dashboard/stats/
  // Returns: DashboardStats
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats/'),
};
```

---

## 6. Type Definitions

### Location: `src/types/index.ts`

All TypeScript interfaces and types are centralized in this file.

### Core Entity Types

```typescript
// User & Authentication
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'ADMIN' | 'STAFF';
}

// Stop - Bus stop location
interface Stop {
  id: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

// Route - Bus route definition
interface Route {
  id: number;
  name: string;
  code: string;           // Short code like "R1", "B2"
  description?: string;
  color?: string;         // Hex color for map display
  created_at: string;
  updated_at: string;
  route_stops?: RouteStop[];  // Stops on this route
}

// RouteStop - Junction between Route and Stop
interface RouteStop {
  id: number;
  route_id: number;
  stop_id: number;
  sequence_number: number;    // Order in route (1, 2, 3...)
  distance_from_prev?: number | null;  // Meters from previous stop
  stop?: Stop;                // Populated stop details
}

// Bus - Vehicle in fleet
interface Bus {
  id: number;
  registration_number: string;  // License plate
  capacity: number;             // Passenger capacity
  status: 'active' | 'inactive' | 'maintenance';
  route_id: number | null;
  route: BusRoute | null;       // Simplified route info
  last_location: BusLocation | null;
  next_stop?: NextStop | null;
  created_at: string;
  updated_at: string;
}

// BusLocation - Last known position
interface BusLocation {
  latitude: number;
  longitude: number;
  speed: number;              // km/h
  heading: number;            // Degrees (0-360)
  current_stop_sequence: number;  // Which stop in route
  timestamp: string;
}

// NextStop - ETA to next stop
interface NextStop {
  sequence: number;
  stop_id: number;
  stop_name: string;
  distance_meters: number;
  eta_minutes: number;
}

// DisplayUnit - SMD display at bus stop
interface DisplayUnit {
  id: number;
  name: string;
  stop_id: number;
  stop?: Stop;
  status: 'online' | 'offline' | 'error';
  location?: string;          // Physical location description
  last_heartbeat?: string;
  created_at: string;
  updated_at: string;
}

// Advertisement
interface Advertisement {
  id: number;
  title: string;
  content_url: string;        // Image URL or YouTube URL
  media_type: 'image' | 'youtube';
  duration_seconds: number;   // How long to display
  advertiser_name: string;
  advertiser_contact?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// AdSchedule - When to show an ad on a display
interface AdSchedule {
  id: number;
  ad_id: number;
  display_id: number;
  display_name?: string;
  start_time: string;         // ISO datetime
  end_time: string;           // ISO datetime
  priority: number;           // Higher = more important
  ad?: Advertisement;
  created_at: string;
}

// Announcement
interface Announcement {
  id: number;
  title: string;
  message: string;            // English message
  message_ur?: string;        // Urdu message (optional)
  severity: 'info' | 'warning' | 'emergency';
  start_time: string;
  end_time: string;
  route_ids: number[];        // Empty = all routes
  routes?: Route[];
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### Display Content Types (for SMD Simulator)

```typescript
// API response for display content
interface DisplayContent {
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

// Bus approaching this display's stop
interface UpcomingBus {
  bus_id: number;
  registration_number: string;
  route_id: number;
  route_name: string;
  route_code: string;
  route_color: string;
  eta_minutes: number;
  distance_meters: number;
  arrival_status: 'arriving' | 'approaching' | 'on-route';
  // arriving = ≤1 min
  // approaching = ≤3 min
  // on-route = >3 min
}

// Announcement for display
interface DisplayAnnouncement {
  id: number;
  title: string;
  message: string;
  message_ur?: string;
  severity: 'info' | 'warning' | 'emergency';
}

// Ad for display
interface DisplayAdvertisement {
  id: number;
  title: string;
  content_url: string;
  media_type: 'image' | 'youtube';
  duration_seconds: number;
  priority: number;
}
```

### Dashboard Types

```typescript
interface DashboardStats {
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
```

---

## 7. State Management

### Zustand Stores

**Location**: `src/store/index.ts`

#### UI Store

Manages global UI state with persistence to localStorage.

```typescript
interface UIState {
  sidebarOpen: boolean;          // Is sidebar expanded
  language: 'en' | 'ur';         // Current language
  theme: 'light' | 'dark';       // Color theme
  mapCenter: [number, number];   // Default map center [lat, lng]
  mapZoom: number;               // Default map zoom level
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setLanguage: (lang: 'en' | 'ur') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
}

// Usage:
const { language, setLanguage } = useUIStore();
```

#### SMD Store

Manages SMD simulator state.

```typescript
interface SMDState {
  isFullscreen: boolean;
  isOnline: boolean;
  currentLanguage: 'en' | 'ur';
  simulatedTime: Date;
  emergencyOverride: boolean;    // Is emergency announcement showing
  
  // Actions
  setFullscreen: (fullscreen: boolean) => void;
  setOnline: (online: boolean) => void;
  setSMDLanguage: (lang: 'en' | 'ur') => void;
  setSimulatedTime: (time: Date) => void;
  setEmergencyOverride: (override: boolean) => void;
}
```

### TanStack Query

Server state is managed with TanStack Query. Each page uses `useQuery` and `useMutation` hooks.

```typescript
// Example: Fetching buses with auto-refresh
const { data: buses, isLoading } = useQuery({
  queryKey: ['buses'],
  queryFn: () => busesApi.getBuses(),
  refetchInterval: 3000,  // Refresh every 3 seconds
});

// Example: Creating a bus
const createMutation = useMutation({
  mutationFn: (data) => busesApi.createBus(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['buses'] });
    toast({ title: 'Success', description: 'Bus created' });
  },
});
```

---

## 8. Pages Documentation

### Dashboard Page

**Location**: `src/pages/DashboardPage.tsx`

**Purpose**: Overview of the entire system with key statistics and live map.

**Features**:
- Displays 6 stat cards: Total Buses, Active Buses, Total Routes, Total Stops, Online Displays, Active Announcements
- Interactive map showing all buses with last known location
- Auto-refreshes bus data

**API Calls**:
- `GET /api/dashboard/stats/` - Statistics
- `GET /api/buses/` - Bus list for map

---

### Buses Page

**Location**: `src/pages/BusesPage.tsx`

**Purpose**: Fleet management - view, create, edit buses.

**Features**:
- Grid view of all buses with status indicators
- Stats: Total, Active, With Location
- Color-coded status badges (active=green, inactive=gray, maintenance=orange)
- Quick view of last location timestamp
- Add bus button opens BusModal

**API Calls**:
- `GET /api/buses/` - With 3-second auto-refresh

---

### Bus Detail Page

**Location**: `src/pages/BusDetailPage.tsx`

**Purpose**: Detailed view of a single bus.

**Features**:
- Shows registration, capacity, status, assigned route
- Map with current position
- Next stop ETA if on trip
- Edit/Delete options

**API Calls**:
- `GET /api/buses/<id>/`

---

### Routes Page

**Location**: `src/pages/RoutesPage.tsx`

**Purpose**: Manage bus routes.

**Features**:
- Grid view with route color badges
- Shows first and last stop names
- Stop count
- Click to view route details

**API Calls**:
- `GET /api/routes/`

---

### Route Detail Page

**Location**: `src/pages/RouteDetailPage.tsx`

**Purpose**: Manage stops within a route.

**Features**:
- **Drag-and-drop stop reordering** using @dnd-kit
- Add stops from available stops list
- Remove stops from route
- Map showing all stops with route line
- Distance between stops

**API Calls**:
- `GET /api/routes/<id>/`
- `POST /api/routes/<id>/stops/` - Add stop
- `DELETE /api/routes/<id>/stops/<routeStopId>/` - Remove stop
- `PUT /api/routes/<id>/stops/reorder/` - Reorder stops

**Drag-and-Drop Logic**:
```typescript
// Uses @dnd-kit for sortable list
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

// On drag end
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (active.id !== over?.id) {
    const oldIndex = sortedStops.findIndex(s => s.id === active.id);
    const newIndex = sortedStops.findIndex(s => s.id === over?.id);
    const newOrder = arrayMove(sortedStops, oldIndex, newIndex);
    setSortedStops(newOrder);
    // API call to persist order
    reorderMutation.mutate(newOrder.map(s => s.id));
  }
};
```

---

### Stops Page

**Location**: `src/pages/StopsPage.tsx`

**Purpose**: Manage bus stops.

**Features**:
- Searchable list of stops
- Map showing all stops
- Click stop to view on map
- Add/Edit/Delete stops

**API Calls**:
- `GET /api/stops/`

---

### Displays Page

**Location**: `src/pages/DisplaysPage.tsx`

**Purpose**: Manage SMD display units.

**Features**:
- List of displays with status indicators
- Stats: Online, Offline, Error counts
- Link to SMD Simulator for each display
- Add/Edit/Delete displays

**API Calls**:
- `GET /api/displays/`

---

### Ads Page

**Location**: `src/pages/AdsPage.tsx`

**Purpose**: Manage advertisements and schedules.

**Features**:
- **Two sections**: Advertisements and Schedules
- Search/filter ads
- Preview images/YouTube thumbnails
- Schedule ads to multiple displays at once
- Active schedule indicator

**API Calls**:
- `GET /api/advertisements/`
- `GET /api/ad-schedules/`

---

### Announcements Page

**Location**: `src/pages/AnnouncementsPage.tsx`

**Purpose**: Manage system announcements.

**Features**:
- Severity badges (info, warning, emergency)
- Route targeting (all routes or specific)
- Bilingual support (English + Urdu)
- Active/upcoming/expired indicators

**API Calls**:
- `GET /api/announcements/`
- `GET /api/routes/` - For route selection

---

### Users Page (Admin Only)

**Location**: `src/pages/UsersPage.tsx`

**Purpose**: User management (Admin only).

**Features**:
- List all users
- Add new users (Admin or Staff)
- Stats: Admin count, Staff count

**API Calls**:
- `GET /api/users/`
- `POST /api/register/`

---

### Login Page

**Location**: `src/pages/LoginPage.tsx`

**Purpose**: User authentication.

**Features**:
- Email/Password form
- Error display
- Redirects to dashboard on success
- Auto-redirect if already authenticated

**API Calls**:
- `POST /api/login/`

---

## 9. Components Documentation

### Modal Components

All modals follow a consistent pattern:

```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  existingData?: EntityType | null;  // For edit mode
}

// Pattern:
// 1. Use react-hook-form with zod validation
// 2. Detect create vs edit mode from existingData
// 3. Call appropriate mutation
// 4. Invalidate queries on success
// 5. Show toast notification
```

### BusModal

**File**: `src/components/modals/BusModal.tsx`

**Fields**:
- Registration Number (required, 3-20 chars)
- Capacity (required, 10-100)
- Status (select: active/inactive/maintenance)
- Route (select from available routes, optional)

**Validation**: Zod schema

---

### StopModal

**File**: `src/components/modals/StopModal.tsx`

**Fields**:
- Name (required)
- Description (optional)
- Latitude (required, -90 to 90)
- Longitude (required, -180 to 180)

**Feature**: Can be opened with pre-filled coordinates

---

### RouteModal

**File**: `src/components/modals/RouteModal.tsx`

**Fields**:
- Name (required)
- Code (required, 1-10 chars)
- Description (optional)
- Color (color picker)

---

### DisplayModal

**File**: `src/components/modals/DisplayModal.tsx`

**Fields**:
- Name (required)
- Stop (select from available stops)
- Location Description (optional)
- Status (select: online/offline/error)

---

### AdModal

**File**: `src/components/modals/AdModal.tsx`

**Fields**:
- Title (required)
- Content URL (required, must be valid URL)
- Media Type (image/youtube)
- Duration (required, seconds)
- Advertiser Name (required)
- Advertiser Contact (optional)

---

### AdScheduleModal

**File**: `src/components/modals/AdScheduleModal.tsx`

**Fields**:
- Advertisement (select)
- Display Units (multi-select)
- Start Time (datetime)
- End Time (datetime)
- Priority (1-10)

**Special**: Creates multiple schedules at once (one per display)

---

### AnnouncementModal

**File**: `src/components/modals/AnnouncementModal.tsx`

**Fields**:
- Title (required)
- Message (English, required)
- Message Urdu (optional)
- Severity (info/warning/emergency)
- Start Time (datetime)
- End Time (datetime)
- Routes (multi-select, empty = all routes)

---

### UserModal

**File**: `src/components/modals/UserModal.tsx`

**Fields**:
- Email (required, valid email)
- Password (required, min 6 chars)
- First Name (required)
- Last Name (required)
- User Type (ADMIN/STAFF)

---

## 10. GPS Simulator

### Location: `src/pages/GPSSimulatorPage.tsx`

### Purpose

Simulates GPS location updates for buses without physical hardware. Useful for:
- Testing the tracking system
- Development without real buses

### How It Works

1. **Select a bus** with an assigned route
2. **Click "Start Simulation"**
3. The simulator:
   - Calls `startTrip` API
   - Fetches road geometry from Mapbox Directions API
   - Moves the bus along the route at configured speed
   - Sends location updates every second
4. When reaching the end, calls `endTrip` API

### Key Components

```typescript
// Simulation state for each bus
interface BusSimulationState {
  busId: number;
  busName: string;
  routeName: string;
  isSimulating: boolean;
  distanceTraveled: number;      // Meters traveled
  totalRouteDistance: number;    // Total route length
  stops: RouteStopInfo[];        // Route stops
  pathPoints: PathPoint[];       // Road geometry points
  currentPathIndex: number;
}

// Path point from Mapbox
interface PathPoint {
  lat: number;
  lng: number;
  distanceFromStart: number;     // Cumulative distance
}
```

### Route Geometry Fetching

```typescript
// Uses Mapbox Directions API
async function fetchRouteGeometry(stops: RouteStopInfo[]): Promise<PathPoint[]> {
  const coordinates = stops
    .map(s => `${s.longitude},${s.latitude}`)
    .join(';');
  
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
    `geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  // Extract coordinates and calculate cumulative distances
  return data.routes[0].geometry.coordinates.map(...);
}
```

### Position Calculation

```typescript
// Finds position on path based on distance traveled
const getPositionOnPath = (pathPoints, distanceTraveled) => {
  // Find which segment we're on
  for (let i = 0; i < pathPoints.length - 1; i++) {
    if (distanceTraveled >= pathPoints[i].distanceFromStart &&
        distanceTraveled <= pathPoints[i+1].distanceFromStart) {
      // Interpolate between points
      const progress = (distanceTraveled - p1.distanceFromStart) / segmentLength;
      return {
        lat: p1.lat + (p2.lat - p1.lat) * progress,
        lng: p1.lng + (p2.lng - p1.lng) * progress,
      };
    }
  }
};
```

### Speed Calculation

```typescript
// Convert km/h to meters per tick
// speed is in km/h, interval is in ms
const metersPerTick = (speedKmh * updateIntervalMs) / 3600;
// At 40 km/h with 1000ms interval: 40 * 1000 / 3600 = 11.11 meters/tick
```

### Race Condition Prevention

```typescript
// Track pending API calls to prevent overlapping requests
const pendingUpdatesRef = useRef<Set<number>>(new Set());

const advanceAndUpdateBus = async (busId: number) => {
  // Skip if previous update still pending
  if (pendingUpdatesRef.current.has(busId)) {
    console.log(`Skipping update for bus ${busId} - previous update still pending`);
    return;
  }
  
  pendingUpdatesRef.current.add(busId);
  try {
    // ... update logic
  } finally {
    pendingUpdatesRef.current.delete(busId);
  }
};
```

### Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| Speed | 40 km/h | Simulated bus speed |
| Update Interval | 1000ms | How often to send location |

### API Calls

- `POST /api/buses/<id>/start-trip/` - Begin trip
- `POST /api/buses/<id>/location/` - Update position (every second)
- `POST /api/buses/<id>/end-trip/` - End trip

### Important Notes

1. **Backend handles arrival detection** - Frontend only sends lat/lng, backend determines which stop the bus is at
2. **Only active/inactive buses** can be simulated (not maintenance)
3. **Route with 2+ stops required** for simulation
4. **Mapbox token required** for road geometry (falls back to straight lines)

---

## 11. SMD Display Simulator

### Location: `src/pages/SMDSimulatorPage.tsx`

### Purpose

Simulates how content appears on physical SMD (Surface Mount Display) units at bus stops. Shows:
- Upcoming bus arrivals
- Announcements
- Advertisements

### Access

- Direct URL: `/smd-simulator/:displayId`
- Or via Displays page → "View Simulator" button

### Content Cycle Logic

The display cycles through content in this pattern:

```
[Route 1] → [Announcement] → [Route 2] → [Route 3] → [Ads Cycle] → [Repeat]
```

### Slide Types

```typescript
type SlideType = 'route' | 'announcement' | 'ad';

interface Slide {
  type: SlideType;
  data: DisplayRoute | DisplayAnnouncement | DisplayAd;
  duration: number;  // seconds
}
```

### Timing Configuration

```typescript
const ROUTE_SLIDE_DURATION = 10;      // Show each route for 10 seconds
const ANNOUNCEMENT_SLIDE_DURATION = 8; // Show announcements for 8 seconds
const AD_BUDGET_PER_CYCLE = 60;        // Max 60 seconds of ads per cycle
const REFRESH_INTERVAL = 30000;        // Fetch new data every 30 seconds
```

### Content Building Logic

```typescript
const buildContentSlides = () => {
  const newSlides = [];
  
  // 1. Add routes (only buses within 60 min, max 5 per route)
  routes.forEach((route) => {
    const upcomingBuses = route.buses
      .filter(b => b.eta_minutes <= 60)
      .slice(0, 5);
    if (upcomingBuses.length > 0) {
      newSlides.push({ type: 'route', data: route, duration: 10 });
    }
  });
  
  // 2. Interleave announcements (non-emergency)
  const nonEmergency = announcements.filter(a => a.severity !== 'emergency');
  if (nonEmergency.length > 0 && newSlides.length > 0) {
    // Insert first announcement after first route
    newSlides.splice(1, 0, { type: 'announcement', data: nonEmergency[0], duration: 8 });
    // Add remaining announcements at end
  } else if (nonEmergency.length > 0) {
    // No routes - just show announcements
    nonEmergency.forEach(a => newSlides.push({ type: 'announcement', data: a }));
  }
  
  // NOTE: Ads are NOT added here - they have independent cycle
};
```

### Ad Cycle Logic

Ads have their own budget-based cycle:

```typescript
const [adBudgetRemaining, setAdBudgetRemaining] = useState(60); // 60 seconds
const [adsShownThisCycle, setAdsShownThisCycle] = useState<Set<number>>(new Set());

const moveToNextSlide = () => {
  if (isShowingAd) {
    const currentAd = getCurrentAd();
    
    // Track shown ad
    adsShownThisCycle.add(currentAd.id);
    
    // Deduct from budget
    const newBudget = adBudgetRemaining - currentAd.duration_seconds;
    
    // Check if all ads shown at least once
    const allAdsShown = ads.every(ad => adsShownThisCycle.has(ad.id));
    
    // Continue if: budget > 0 AND next ad fits AND not all shown
    if (newBudget > 0 && nextAd.duration <= newBudget && !allAdsShown) {
      // Show next ad
    } else {
      // End ad cycle, return to content
      setAdBudgetRemaining(60); // Reset budget
      setAdsShownThisCycle(new Set()); // Reset tracker
    }
  }
};
```

### Emergency Announcements

Emergency announcements (severity='emergency') interrupt everything:

```typescript
// Check for emergency announcements
const emergency = announcements.find(a => a.severity === 'emergency');
if (emergency && !showCritical) {
  // Save current state
  pausedStateRef.current = {
    contentIndex: currentContentIndex,
    wasShowingAd: isShowingAd,
    adIndex: currentAdIndex,
  };
  
  // Show emergency fullscreen
  setCriticalAnnouncement(emergency);
  setShowCritical(true);
}
```

### Data Transformation

API data is transformed for display:

```typescript
// Group buses by route
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
    
    routeMap.get(bus.route_id)!.buses.push({
      bus_name: bus.registration_number,
      eta_minutes: bus.eta_minutes,
      status: bus.arrival_status,
    });
  });
  
  // Sort buses by ETA within each route
  routeMap.forEach(route => {
    route.buses.sort((a, b) => a.eta_minutes - b.eta_minutes);
  });
  
  return Array.from(routeMap.values());
};
```

### ETA Countdown

Between API refreshes (30s), ETAs count down locally:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setRoutes(prevRoutes =>
      prevRoutes.map(route => ({
        ...route,
        buses: route.buses.map(bus => ({
          ...bus,
          eta_minutes: Math.max(0, bus.eta_minutes - 1),
          // Update status based on new ETA
          status: bus.eta_minutes <= 2 ? 'arriving' :
                  bus.eta_minutes <= 4 ? 'approaching' : bus.status,
        }))
      }))
    );
  }, 60000); // Every minute
  
  return () => clearInterval(interval);
}, []);
```

### Display Features

- **Fullscreen mode**: Toggle with button
- **Pause/Play**: Pause slideshow
- **Language toggle**: English/Urdu
- **Audio toggle**: Mute/unmute (for YouTube ads)
- **Time display**: Current time
- **Stop name header**: Shows which stop this display is at
- **Hardware status**: Shows simulated SMD specs

### YouTube Ad Handling

```typescript
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Render YouTube embed
{ad.media_type === 'youtube' && (
  <iframe
    src={`https://www.youtube.com/embed/${getYouTubeVideoId(ad.content_url)}?autoplay=1&mute=${isMuted ? 1 : 0}`}
    allow="autoplay"
  />
)}
```

---

## 12. Map Integration

### Location: `src/components/map/MapboxMap.tsx`

### Setup

Requires Mapbox access token in environment variable:
```
VITE_MAPBOX_API_KEY=pk.xxx...
```

### Props

```typescript
interface MapboxMapProps {
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  buses?: Bus[];           // Buses to display as markers
  stops?: Stop[];          // Stops to display as markers
  showRoute?: boolean;     // Draw route line between stops
  routeColor?: string;     // Color of route line
  height?: string;         // Map container height
  interactive?: boolean;   // Enable pan/zoom
  showControls?: boolean;  // Show zoom controls
  fitToBounds?: boolean;   // Auto-fit to show all markers
}
```

### Bus Markers

- **Active buses** (location < 1 min old): Teal color with rotation based on heading
- **Stale buses** (location > 1 min old): Gray color with warning indicator
- **Popup**: Shows registration, speed, last update time

```typescript
// Marker styling
const markerEl = document.createElement('div');
markerEl.className = isStale ? 'bus-marker stale' : 'bus-marker';
markerEl.innerHTML = `
  <div class="bus-icon" style="transform: rotate(${bus.last_location.heading}deg)">
    🚌
  </div>
`;
```

### Stop Markers

- Blue circle with white center
- Popup shows stop name

### Route Line

When `showRoute=true` and multiple stops provided:

```typescript
// Fetch actual road route from OSRM
const routeCoords = await routingService.getRoute(
  stops.map(s => [s.latitude, s.longitude])
);

// Add as GeoJSON line layer
map.addSource('route', {
  type: 'geojson',
  data: {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: routeCoords.map(([lat, lng]) => [lng, lat]),
    },
  },
});

map.addLayer({
  id: 'route',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': routeColor,
    'line-width': 4,
  },
});
```

### OSRM Routing Service

**Location**: `src/services/routing.ts`

Uses free OSRM (Open Source Routing Machine) for road-following routes:

```typescript
class RoutingService {
  private readonly OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
  
  async getRoute(points: [number, number][]): Promise<[number, number][]> {
    // OSRM expects lng,lat (opposite of Leaflet's lat,lng)
    const coordinates = points.map(p => `${p[1]},${p[0]}`).join(';');
    
    const url = `${this.OSRM_URL}/${coordinates}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Convert back to lat,lng
    return data.routes[0].geometry.coordinates.map(
      ([lng, lat]) => [lat, lng]
    );
  }
}
```

---

## 13. Internationalization

### Location: `src/i18n/`

### Setup

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ur from './locales/ur.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
    },
    lng: 'en',
    fallbackLng: 'en',
  });
```

### Usage

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return <h1>{t('dashboard.title')}</h1>;
};
```

### Language Files

**English**: `src/i18n/locales/en.json`
**Urdu**: `src/i18n/locales/ur.json`

### RTL Support

When Urdu is selected, the app switches to RTL:

```typescript
// In App.tsx
useEffect(() => {
  i18n.changeLanguage(language);
  document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
}, [language]);
```

---

## 14. Configuration Files

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
VITE_MAPBOX_API_KEY=pk.eyJ1Ijoi...
```

### Vite Configuration

**File**: `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### TypeScript Configuration

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Tailwind Configuration

**File**: `tailwind.config.js`

```javascript
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {...},
        // shadcn/ui theme colors
      },
    },
  },
};
```

---

## Appendix: API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/login/ | Authenticate user |
| GET | /api/me/ | Get current user |
| GET | /api/users/ | List all users (Admin) |
| POST | /api/register/ | Create new user (Admin) |
| GET | /api/stops/ | List stops |
| POST | /api/stops/ | Create stop |
| PATCH | /api/stops/:id/ | Update stop |
| DELETE | /api/stops/:id/ | Delete stop |
| GET | /api/stops/:id/etas/ | Get ETAs for stop |
| GET | /api/routes/ | List routes |
| POST | /api/routes/ | Create route |
| PATCH | /api/routes/:id/ | Update route |
| DELETE | /api/routes/:id/ | Delete route |
| POST | /api/routes/:id/stops/ | Add stop to route |
| DELETE | /api/routes/:id/stops/:rsId/ | Remove stop from route |
| PUT | /api/routes/:id/stops/reorder/ | Reorder route stops |
| GET | /api/buses/ | List buses |
| POST | /api/buses/ | Create bus |
| PATCH | /api/buses/:id/ | Update bus |
| DELETE | /api/buses/:id/ | Delete bus |
| POST | /api/buses/:id/location/ | Update bus location |
| POST | /api/buses/:id/start-trip/ | Start bus trip |
| POST | /api/buses/:id/end-trip/ | End bus trip |
| GET | /api/buses/active/ | Get active buses |
| GET | /api/displays/ | List displays |
| POST | /api/displays/ | Create display |
| PATCH | /api/displays/:id/ | Update display |
| DELETE | /api/displays/:id/ | Delete display |
| POST | /api/displays/:id/heartbeat/ | Send heartbeat |
| GET | /api/displays/:id/content/ | Get display content |
| GET | /api/advertisements/ | List ads |
| POST | /api/advertisements/ | Create ad |
| PATCH | /api/advertisements/:id/ | Update ad |
| DELETE | /api/advertisements/:id/ | Delete ad |
| GET | /api/ad-schedules/ | List schedules |
| POST | /api/ad-schedules/ | Create schedules |
| PATCH | /api/ad-schedules/:id/ | Update schedule |
| DELETE | /api/ad-schedules/:id/ | Delete schedule |
| GET | /api/announcements/ | List announcements |
| POST | /api/announcements/ | Create announcement |
| PATCH | /api/announcements/:id/ | Update announcement |
| DELETE | /api/announcements/:id/ | Delete announcement |
| GET | /api/dashboard/stats/ | Get dashboard stats |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Nov 2024 | Initial prototype release |

---

*Documentation generated for SMDB Frontend v1.0.0*
