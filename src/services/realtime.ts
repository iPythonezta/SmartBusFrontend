// Realtime Service - Placeholder
// Real-time bus tracking is now handled by:
// 1. GPS Simulator (src/pages/GPSSimulatorPage.tsx) - sends location updates to backend API
// 2. Backend API (POST /api/buses/:id/location/) - stores and processes locations
// 3. Frontend polling (GET /api/buses/) - fetches latest bus locations every few seconds

// This file is kept as a stub for backwards compatibility
// but all real-time functionality is now API-based

export const realtimeService = {
  // No-op methods for any legacy code that might still reference this
  subscribe: () => () => {},
  unsubscribeAll: () => {},
  isTracking: () => false,
  getCurrentPosition: () => null,
};
