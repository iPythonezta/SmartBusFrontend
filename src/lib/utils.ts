import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatTime(date: string | Date, locale = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDateTime(date: string | Date, locale = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDistance(meters: number, locale = 'en'): string {
  if (meters < 1000) {
    return `${Math.round(meters)} ${locale === 'ur' ? 'میٹر' : 'm'}`;
  }
  return `${(meters / 1000).toFixed(1)} ${locale === 'ur' ? 'کلومیٹر' : 'km'}`;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function calculateETA(distanceMeters: number, speedKmh: number): number {
  if (speedKmh === 0) return Infinity;
  return (distanceMeters / 1000 / speedKmh) * 60; // minutes
}

export function formatETA(minutes: number, locale = 'en'): string {
  if (!isFinite(minutes)) return locale === 'ur' ? 'نامعلوم' : 'Unknown';
  if (minutes < 1) return locale === 'ur' ? 'ابھی آ رہی ہے' : 'Arriving now';
  if (minutes < 60) {
    return `${Math.round(minutes)} ${locale === 'ur' ? 'منٹ' : 'min'}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return locale === 'ur'
    ? `${hours} گھنٹے ${mins} منٹ`
    : `${hours}h ${mins}m`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateColor(index: number): string {
  const colors = [
    '#14b8a6', // teal
    '#f97316', // orange
    '#3b82f6', // blue
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
  ];
  return colors[index % colors.length];
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    online: 'text-green-600 bg-green-50',
    offline: 'text-gray-600 bg-gray-50',
    active: 'text-teal-600 bg-teal-50',
    inactive: 'text-gray-600 bg-gray-50',
    delayed: 'text-orange-600 bg-orange-50',
    ontime: 'text-green-600 bg-green-50',
    emergency: 'text-red-600 bg-red-50',
  };
  return statusColors[status.toLowerCase()] || 'text-gray-600 bg-gray-50';
}
