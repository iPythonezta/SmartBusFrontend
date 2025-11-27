# Smart Bus Islamabad - Frontend Implementation Summary

## Overview
This project is a comprehensive React-based frontend for the Smart Bus Islamabad public transport management system. It includes real-time bus tracking, route management, SMD (Smart Multimedia Display) simulation, and administrative features.

## Technology Stack

### Core
- **React 19** with TypeScript
- **Vite** - Build tool
- **TailwindCSS** - Styling with utility classes
- **React Router v7** - Client-side routing

### UI & Animations
- **shadcn/ui** - Accessible UI primitives (Radix UI based)
- **lucide-react** - Icon library
- **Framer Motion** - Smooth animations and transitions
- **recharts** - Data visualization

### State Management & Data Fetching
- **TanStack Query (React Query)** - Server state management with caching
- **Zustand** - Local UI state (sidebar, language, SMD simulator state)
- **React Context** - Authentication state

### Maps
- **Leaflet** + **React Leaflet** - Free, open-source interactive maps (no API key required!)
- Uses OpenStreetMap tiles
- Supports placing stops, visualizing routes, live bus tracking

### Forms & Validation
- **react-hook-form** - Form state management
- **@hookform/resolvers** + **zod** - Schema validation

### Drag & Drop
- **@dnd-kit** - Accessible drag-and-drop for reordering route stops

### Internationalization
- **react-i18next** - English and Urdu localization with RTL support

### Testing (Configured)
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx          # Route guard for authentication
│   ├── layout/
│   │   ├── MainLayout.tsx              # App shell with sidebar and top nav
│   │   ├── SideNav.tsx                 # Left navigation sidebar
│   │   └── TopNav.tsx                  # Top navigation bar
│   ├── map/
│   │   ├── MapCanvas.tsx               # Reusable Mapbox wrapper component
│   │   └── index.ts                    # Map exports
│   ├── modals/
│   │   └── StopModal.tsx               # Add/edit stop with interactive map
│   └── ui/                             # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
├── contexts/
│   └── AuthContext.tsx                 # Authentication context provider
├── i18n/
│   ├── index.ts                        # i18n configuration
│   └── locales/
│       ├── en.json                     # English translations
│       └── ur.json                     # Urdu translations
├── lib/
│   ├── api-client.ts                   # Axios instance
│   └── utils.ts                        # Utility functions (cn, date formatting, etc.)
├── pages/
│   ├── AdsPage.tsx                     # Advertisement management
│   ├── AnnouncementsPage.tsx           # Announcements management
│   ├── BusDetailPage.tsx               # Single bus detail with live map
│   ├── BusesPage.tsx                   # Bus fleet overview
│   ├── DashboardPage.tsx               # Main dashboard with stats
│   ├── DisplaysPage.tsx                # SMD display units management
│   ├── LoginPage.tsx                   # Authentication page
│   ├── RouteDetailPage.tsx             # Route detail with map and drag-drop stops
│   ├── RoutesPage.tsx                  # Routes overview
│   ├── SettingsPage.tsx                # App settings
│   ├── SMDSimulatorPage.tsx            # Full-screen SMD simulator
│   ├── StopsPage.tsx                   # Stop management with map modal
│   └── UsersPage.tsx                   # User management (Admin only)
├── providers/
│   └── QueryProvider.tsx               # TanStack Query provider
├── services/
│   ├── api.ts                          # API service layer (typed)
│   ├── mockApi.ts                      # Mock data for demo
│   └── realtime.ts                     # Realtime update service (SSE/polling)
├── store/
│   └── index.ts                        # Zustand stores (UI, Toast, SMD)
├── types/
│   └── index.ts                        # TypeScript type definitions
├── App.tsx                             # Root app component with routes
└── main.tsx                            # App entry point
```

## Key Features Implemented

### 1. Authentication & Authorization
- JWT-based login flow
- Role-based access control (Admin vs Staff)
- Protected routes with `ProtectedRoute` component
- Persistent auth state via Context

### 2. Dashboard
- Overview statistics (buses, routes, stops, displays)
- Live map placeholder for bus tracking
- Recent activity feed

### 3. Bus Management
- List view with status indicators (active, inactive, maintenance)
- Bus detail page with:
  - Live location display
  - Assigned route information
  - Next stops and ETAs
  - Speed chart (placeholder for recharts)
- Assign/unassign routes to buses

### 4. Route Management
- Route list with color-coded cards
- Route detail page with:
  - **Interactive map** showing route polyline and stop markers
  - **Drag-and-drop reordering** of stops using @dnd-kit
  - Assigned buses list
  - CRUD operations (placeholders)

### 5. Stop Management
- **Interactive map modal** for adding/editing stops
- Click on map to place stop marker
- Drag marker to adjust position
- Geocoding integration ready
- Search and filter stops

### 6. Display Units (SMD)
- List of SMD units with status
- Assign stops to displays
- Link to SMD simulator

### 7. SMD Simulator
- **Full-screen display simulation** (16:9 aspect ratio)
- Real-time ETA display with animations
- Ad carousel rotation
- Emergency announcement override
- Language toggle (English/Urdu) with RTL support
- Admin controls:
  - Online/offline toggle
  - Force emergency alert
  - Fast-forward time (placeholder)
- Keyboard shortcut (Esc to exit fullscreen)

### 8. Advertisements & Announcements
- Basic CRUD interfaces
- Scheduling (placeholders)
- Priority and targeting options
- Preview capabilities

### 9. User Management
- Admin-only access
- User list with roles
- Create/edit/delete users
- Audit logs (placeholder)

### 10. Settings
- Language toggle (English/Urdu)
- API endpoint configuration
- Mapbox API key input
- Theme settings (placeholder)

### 11. Internationalization (i18n)
- English and Urdu translations
- RTL support for Urdu
- Date/number formatting with Intl API
- Dynamic language switching

### 12. Real-time Updates (Mock)
- Simulated live bus position updates
- ETA recalculation
- Polling every 8-10 seconds for SMD simulator
- WebSocket/SSE stub for future implementation

## Map Integration

### MapCanvas Component
- Wrapper around `react-leaflet`
- Features:
  - Interactive click-to-place markers
  - Draggable markers for position adjustment
  - Route polyline visualization with glow effect
  - Animated bus markers with pulse effect
  - Speed indicators for buses
  - Custom marker styling and labels
  - Navigation and geolocation controls

### Usage Examples

#### Adding a Stop
```tsx
<MapCanvas
  initialViewState={{ longitude: 73.0479, latitude: 33.6844, zoom: 13 }}
  markers={[{ id: 'new-stop', longitude, latitude, color: '#14b8a6', label: 'New Stop' }]}
  onClick={(lng, lat) => handleMapClick(lng, lat)}
  onMarkerDrag={(id, lng, lat) => handleMarkerDrag(id, lng, lat)}
  draggableMarker="new-stop"
  height="400px"
/>
```

#### Route Visualization
```tsx
<MapCanvas
  markers={stopMarkers}
  routePolyline={{
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: [[lng1, lat1], [lng2, lat2]] },
    properties: { color: '#14b8a6' }
  }}
  height="500px"
  interactive={false}
/>
```

#### Live Bus Tracking
```tsx
<MapCanvas
  buses={activeBuses}
  routePolyline={currentRoute}
  initialViewState={{ longitude, latitude, zoom: 14 }}
/>
```

## Mock API & Data

All API calls currently use mock data from `services/mockApi.ts`:
- Pre-populated buses, routes, stops, displays
- Realistic Islamabad coordinates
- Simulated ETAs and live locations
- 500ms delay to simulate network latency

### Mock Data Includes:
- 3 buses (2 active, 1 inactive)
- 2 routes (Blue Line, Green Line)
- 6 stops (Blue Area, Secretariat, Aabpara, Melody, Zero Point, Faizabad)
- 3 display units
- 2 advertisements
- 2 announcements

## Environment Variables

Create `.env` file:
```env
VITE_API_URL=http://localhost:8000/api
VITE_I18N_DEFAULT=en
VITE_WS_URL=ws://localhost:8000
```

**Note:** No API keys required! We use OpenStreetMap with Leaflet, which is completely free.

## Running the Project

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Runs on `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Testing
```bash
npm run test              # Run unit tests
npm run test:ui           # Run tests with UI
npm run test:coverage     # Generate coverage report
npm run test:e2e          # Run Playwright E2E tests
```

### Code Quality
```bash
npm run lint              # Run ESLint
npm run format            # Format code with Prettier
npm run type-check        # TypeScript type checking
```

## Key Design Decisions

### 1. Component Architecture
- **Atomic design pattern**: Small, reusable UI components
- **Feature-based organization**: Pages own their logic
- **Container/Presenter pattern**: Separation of data fetching and presentation

### 2. State Management
- **Server state** (buses, routes, etc.): TanStack Query for automatic caching, invalidation
- **UI state** (sidebar, language): Zustand with persistence
- **Auth state**: React Context for simple, app-wide access

### 3. Styling
- **Utility-first with Tailwind**: Rapid development, consistent design
- **shadcn/ui for primitives**: Accessible, customizable, no external dependencies
- **Framer Motion for animations**: Smooth, performant micro-interactions

### 4. Type Safety
- **Strict TypeScript**: All components typed
- **Zod for runtime validation**: Schema-based form validation
- **Type-safe API layer**: Strong typing from API to UI

### 5. Performance Optimizations
- **Code splitting**: React Router lazy loading ready
- **Query caching**: TanStack Query reduces redundant fetches
- **Memoization**: React.memo, useMemo, useCallback where needed
- **Optimistic updates**: UI updates before API confirmation

## Missing / TODO Items

### Critical (For Production)
1. **Connect to real backend API**
   - Replace mock API calls in `services/api.ts`
   - Implement WebSocket/SSE for realtime updates in `services/realtime.ts`

2. **Authentication**
   - Implement token refresh logic
   - Add "Remember me" functionality
   - Password reset flow

3. **Map Enhancements**
   - Geocoding search (Mapbox Geocoding API)
   - Reverse geocoding for address lookup
   - Custom map styles
   - Offline map tiles

### High Priority
4. **Forms & Modals**
   - Bus add/edit modal
   - Route add/edit modal
   - Announcement creation modal
   - Ad upload and scheduling UI

5. **Charts & Visualizations**
   - Bus speed history chart (recharts)
   - ETA timeline chart
   - Route utilization analytics
   - Dashboard activity chart

6. **Realtime Features**
   - Live bus position updates
   - ETA recalculation
   - Push notifications for announcements
   - SMD content sync

7. **Testing**
   - Unit tests for utility functions
   - Component tests with React Testing Library
   - E2E tests for critical flows (Playwright)
2. **Realtime Updates**: Currently simulated with polling, needs WebSocket implementation
3. **Form Validation**: Some forms have basic validation, needs comprehensive error handling
4. **Mobile Responsiveness**: Optimized for desktop, mobile UX needs improvement

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - Smart Bus Islamabad Project

## Contributors

- Your Team Name

## Getting Help

- Check documentation in `/docs`
- Review component source code
- Refer to library documentation:
  - [React Query](https://tanstack.com/query/latest)
  - [Leaflet](https://leafletjs.com/)
  - [React Leaflet](https://react-leaflet.js.org/)
  - [shadcn/ui](https://ui.shadcn.com/)
  - [Framer Motion](https://www.framer.com/motion/)

---

## Quick Start Guide

1. **Clone the repository**
```bash
git clone <repo-url>
cd smdb-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file**
```bash
# No .env.example needed - just create .env with:
VITE_API_URL=http://localhost:8000/api
VITE_I18N_DEFAULT=en
VITE_WS_URL=ws://localhost:8000
```

4. **Start development server**
```bash
npm run dev
```

5. **Login with demo credentials**
   - Admin: `admin@smartbus.pk` / any password
   - Staff: `staff@smartbus.pk` / any password

6. **Explore features**
   - Add stops with interactive map
   - Create routes and visualize on map
   - View SMD simulator
   - Drag-drop to reorder route stops

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag dist folder to Netlify dashboard
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

---

**Project Status**: Phase 1 Complete ✅
**Next Phase**: Backend Integration, Advanced Features, Production Deployment
