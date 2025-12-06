# Smart Bus Islamabad - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

Edit `.env` file (optional - defaults work for local development):
```env
VITE_API_URL=http://localhost:8000/api
VITE_MAPBOX_KEY=pk.your_key_here
VITE_I18N_DEFAULT=en
VITE_WS_URL=ws://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```

App runs at: `http://localhost:5173`

### 4. Login
Use your backend credentials to log in.

## 📋 Quick Tour

### Main Features

1. **Dashboard** (`/dashboard`)
   - Overview statistics
   - Live bus map
   - Recent activity

2. **Buses** (`/buses`)
   - List all buses
   - View real-time locations
   - Assign routes

3. **Routes** (`/routes`)
   - Create/edit routes
   - Drag-drop stop ordering
   - Visualize on map

4. **Stops** (`/stops`)
   - Add stops via map click
   - Search and filter
   - Proximity search

5. **SMD Simulator** (`/smd-simulator/:id`)
   - Test display content
   - Emergency alerts
   - Language switching
   - Fullscreen mode

6. **Advertisements** (`/ads`)
   - Upload media
   - Schedule by time/display
   - Set priority

7. **Announcements** (`/announcements`)
   - System-wide or targeted
   - Emergency override
   - Bilingual messages

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

## 🌍 Language Switching

Click the Globe icon in the top navigation to switch between English and Urdu.

## 🎨 Key Components to Explore

1. **SMD Simulator** - `src/pages/SMDSimulatorPage.tsx`
   - Most feature-rich component
   - Real-time updates
   - Animation showcase

2. **Auth System** - `src/contexts/AuthContext.tsx`
   - JWT token management
   - Role-based access

3. **API Client** - `src/lib/api-client.ts`
   - Centralized HTTP client
   - Token refresh logic

4. **State Management**
   - React Query: `src/providers/QueryProvider.tsx`
   - Zustand: `src/store/index.ts`

## 📱 Responsive Design

The app is fully responsive and works on:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🔐 User Roles

### Admin
- Full access to all features
- Can create/edit/delete users
- Can manage all entities
- Access to audit logs

### Staff
- View-only access
- Can view all data
- Cannot modify critical settings
- Cannot access user management

## 🎯 Testing the SMD Simulator

1. Go to `/display-units`
2. Click on any display
3. Click "Open Simulator"
4. Use admin controls to:
   - Toggle online/offline
   - Switch language
   - Force emergency alert
   - Enter fullscreen (press ESC to exit)

## 🗺️ Map Features

### Adding a Stop
1. Go to `/stops`
2. Click "Add Stop"
3. Click on the map to place marker
4. Drag marker to fine-tune position
5. Enter stop name and details
6. Save

### Creating a Route
1. Go to `/routes`
2. Click "Add Route"
3. Enter route details (name, code, color)
4. Add stops in sequence
5. Drag to reorder stops
6. Save

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Type check only
npm run type-check

# Some errors are expected if backend isn't running
```

### Hot Reload Not Working
- Check if port 5173 is available
- Restart the dev server
- Clear browser cache

### Mapbox Not Loading
- Verify VITE_MAPBOX_KEY in .env
- Check browser console for errors
- Mapbox key is optional for basic functionality

## 📚 Learn More

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org
- **Tailwind CSS**: https://tailwindcss.com
- **TanStack Query**: https://tanstack.com/query
- **Framer Motion**: https://www.framer.com/motion
- **shadcn/ui**: https://ui.shadcn.com

## 🆘 Need Help?

- Check the main README.md
- Review inline code comments
- Open an issue on GitHub
- Contact: support@smartbus.pk

---

Happy coding! 🚀
