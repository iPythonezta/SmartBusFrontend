import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  language: 'en' | 'ur';
  theme: 'light' | 'dark';
  mapCenter: [number, number];
  mapZoom: number;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setLanguage: (lang: 'en' | 'ur') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      language: 'en',
      theme: 'light',
      mapCenter: [33.6844, 73.0479], // Islamabad coordinates
      mapZoom: 12,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
      setMapCenter: (center) => set({ mapCenter: center }),
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
    }),
    {
      name: 'smdb-ui-storage',
    }
  )
);

interface ToastState {
  toasts: Array<{
    id: string;
    title?: string;
    description?: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>;
  addToast: (toast: Omit<ToastState['toasts'][0], 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

interface SMDState {
  isFullscreen: boolean;
  isOnline: boolean;
  currentLanguage: 'en' | 'ur';
  simulatedTime: Date;
  emergencyOverride: boolean;
  setFullscreen: (fullscreen: boolean) => void;
  setOnline: (online: boolean) => void;
  setSMDLanguage: (lang: 'en' | 'ur') => void;
  setSimulatedTime: (time: Date) => void;
  setEmergencyOverride: (override: boolean) => void;
}

export const useSMDStore = create<SMDState>((set) => ({
  isFullscreen: false,
  isOnline: true,
  currentLanguage: 'en',
  simulatedTime: new Date(),
  emergencyOverride: false,
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  setOnline: (online) => set({ isOnline: online }),
  setSMDLanguage: (lang) => set({ currentLanguage: lang }),
  setSimulatedTime: (time) => set({ simulatedTime: time }),
  setEmergencyOverride: (override) => set({ emergencyOverride: override }),
}));
