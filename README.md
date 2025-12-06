# Smart Bus Islamabad - Frontend

A modern, production-ready frontend for Smart Bus Islamabad public transport system. Built with React 19, TypeScript, Tailwind CSS, and comprehensive features for real-time bus tracking, route management, and SMD simulation.

## ✨ Key Features

- 🚌 **Real-time Bus Tracking** with live GPS updates
- 🗺️ **Interactive Route Management** with drag-drop stop ordering
- 📍 **Map-based Stop Placement** using **Leaflet** (no API key required!)
- 📺 **SMD Simulator** - Full-featured display preview with animations
- 📢 **Announcements & Ads** management with scheduling
- 🌍 **Bilingual** - English + Urdu with RTL support
- 🔐 **Role-Based Access Control** (Admin/Staff)
- 📱 **Fully Responsive** design
- ♿ **WCAG AA Accessible**
- 🎨 **Smooth Animations** with Framer Motion

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (no environment setup needed!)
npm run dev
```

Visit `http://localhost:5173`

## 📦 Tech Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS** + shadcn/ui
- **TanStack Query** + Zustand
- **Leaflet** + React Leaflet (OpenStreetMap)
- **Framer Motion**
- React Router v6
- react-i18next
- @dnd-kit (drag-drop)
- React Hook Form + Zod

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── auth/      # Authentication guards
│   ├── layout/    # Layout components (SideNav, TopNav)
│   ├── map/       # Map components (Leaflet-based)
│   ├── modals/    # Modal dialogs
│   └── ui/        # shadcn/ui primitives
├── pages/          # Page components
├── services/       # API & real-time services
├── contexts/       # React contexts (Auth)
├── store/          # Zustand stores
├── lib/            # Utilities & helpers
├── i18n/           # Translations (en, ur)
└── types/          # TypeScript types
```

## 🔑 Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
VITE_I18N_DEFAULT=en
VITE_WS_URL=ws://localhost:8000
# Optional: For Mapbox static map in bus live location
VITE_MAPBOX_API_KEY=your_mapbox_access_token
```

**Notes**: 
- No map API keys required for Leaflet maps (stops, routes, dashboard)!
- Mapbox access token is optional - used only for bus live location static map in Bus Detail page
- Get your free Mapbox token from [Mapbox Account](https://account.mapbox.com/access-tokens/)
- **Free tier**: 200,000 static image requests/month (more than enough!)

## 📱 Pages & Routes

- `/login` - Authentication
- `/dashboard` - Overview & stats
- `/buses` - Bus list & tracking

- `/buses/:id` - Bus details with live map
- `/routes` - Route management
- `/routes/:id` - Route detail with map visualization & drag-drop stop ordering
- `/stops` - Stop management with **interactive map** (click to place, drag to adjust)
- `/display-units` - SMD display list
- `/smd-simulator/:id` - Full SMD simulation
- `/ads` - Advertisement management
- `/announcements` - System announcements
- `/users` - User management (admin only)
- `/settings` - App settings & preferences

## 🗺️ Map Features (Leaflet)

Our map implementation uses **Leaflet** with OpenStreetMap tiles - completely free and no API keys required!

### Stop Management
- **Click-to-Place**: Click anywhere on the map to set stop coordinates
- **Drag-to-Adjust**: Drag markers to fine-tune positions
- **Validation**: Automatic lat/lng bounds checking
- **Form Integration**: Coordinates sync with form fields

### Route Visualization
- **Polyline Display**: Routes shown as colored paths on map
- **Stop Markers**: Animated pins with labels
- **Drag-Drop Ordering**: Reorder stops with @dnd-kit
- **Live Updates**: Map updates as you reorder stops

### Bus Tracking (Coming Soon)
- Real-time bus position updates
- Speed indicators on bus icons
- Route progress visualization
- Multi-bus tracking on dashboard

## 🎨 SMD Simulator

The **Smart Multimedia Display Simulator** (`/smd-simulator/:displayId`) replicates physical bus stop displays:

- **Real-time ETA Updates** - Live countdowns
- **Route Information** - Complete route details
- **Advertisement Rotation** - Timed ad display
- **Emergency Alerts** - Priority announcement banners
- **Bilingual Support** - EN/UR with automatic RTL
- **Fullscreen Kiosk Mode** - F11 or button toggle
- **Admin Controls** - Testing panel for simulations

## 🌐 API Integration

All API calls use the centralized client in `src/lib/api-client.ts`:

```typescript
import { busesApi, routesApi, stopsApi } from '@/services/api';

// Get resources
const buses = await busesApi.getBuses();
const routes = await routesApi.getRoutes();

// Create with mutation
const newStop = await stopsApi.createStop({
  name: "Blue Area",
  latitude: 33.7194,
  longitude: 73.0931
});

// Update
await busesApi.assignRoute(busId, routeId);
```

## 🧪 Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Coverage report
npm run test:coverage
```

Test files:
- `src/tests/components.test.tsx` - Component unit tests
- `e2e/app.spec.ts` - E2E test suite

## 🚀 Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Deploy to:
- **Vercel** (recommended for Vite projects)
- **Netlify** 
- **GitHub Pages**
- Any static hosting service

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint with ESLint
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests

## 🔧 Development Notes

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update `SideNav.tsx` navigation

### Adding UI Components
```bash
# shadcn/ui components are pre-configured
# Add new components to src/components/ui/
```

### Map Customization
Edit `src/components/map/MapCanvas.tsx` to customize:
- Marker icons (see `createCustomIcon()`)
- Default center/zoom
- Tile provider
- Interaction handlers

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License

---

**Smart Bus Islamabad** - Intelligent Public Transport System 🚌
