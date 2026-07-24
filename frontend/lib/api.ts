/**
 * Single Base URL & Real-Time Socket Configuration for SPY Salon
 * Dynamically resolves origin, API_BASE_URL, SOCKET_URL, and APP_BASE_URL
 * supporting localhost, custom domains, and LAN IP addresses (e.g. 192.168.x.x).
 */

// Helper to sanitize any input URL (removes any trailing /api/v1, /api, or trailing slashes)
export function sanitizeOrigin(url: string): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/\/(api\/v1|api)\/?$/i, '')
    .replace(/\/$/, '');
}

// 1. Raw Environment Configured Base URL
const ENV_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ? sanitizeOrigin(process.env.NEXT_PUBLIC_BASE_URL) : '';
const ENV_APP_URL = process.env.NEXT_PUBLIC_APP_URL ? sanitizeOrigin(process.env.NEXT_PUBLIC_APP_URL) : '';

/**
 * Returns the clean origin URL (e.g. http://192.168.88.9:5000 or http://localhost:5000)
 */
export function getCleanOrigin(): string {
  // If explicitly configured in environment to a remote/specific URL (not empty, not default localhost)
  if (ENV_BASE_URL && !ENV_BASE_URL.includes('localhost') && !ENV_BASE_URL.includes('127.0.0.1')) {
    return ENV_BASE_URL;
  }

  // Browser Client-Side Dynamic Origin Fallback
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    // If accessing via LAN IP or non-localhost domain, infer host dynamically
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // If frontend runs on port 3000, default backend target port is 5000
      if (port === '3000') {
        return `${protocol}//${hostname}:5000`;
      }
      // If running behind Nginx / port 80 / 443 proxy or custom deployment
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }
  }

  // Fallback to configured ENV or default local dev server
  return ENV_BASE_URL || 'http://localhost:5000';
}

/**
 * Returns the full API V1 endpoint base URL (e.g. http://192.168.88.9:5000/api/v1)
 */
export function getApiBaseUrl(): string {
  const origin = getCleanOrigin();
  return `${origin}/api/v1`;
}

/**
 * Returns the WebSocket / Real-time Socket.IO server URL
 */
export function getSocketUrl(): string {
  return getCleanOrigin();
}

/**
 * Returns the Frontend Application base URL (e.g. http://192.168.88.9:3000)
 */
export function getAppBaseUrl(): string {
  if (ENV_APP_URL && !ENV_APP_URL.includes('localhost')) {
    return ENV_APP_URL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return ENV_APP_URL || 'http://localhost:3000';
}

// Backward-compatible exports for existing static imports
export const SINGLE_BASE_URL = getCleanOrigin();
export const CLEAN_ORIGIN = getCleanOrigin();
export const SOCKET_URL = getSocketUrl();
export const API_BASE_URL = getApiBaseUrl();
export const APP_BASE_URL = getAppBaseUrl();

// Centralized Page Route Links
export const PAGE_ROUTES = {
  HOME: '/',
  ADMIN: '/admin',
  EMPLOYEE: '/employee',
  PROFILE: '/profile',
  SERVICES: '/services',
  PRICING: '/pricing',
  BOOK: '/book',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  REGISTER: '/register'
};

/**
 * Utility wrapper for fetch calls appending API_BASE_URL automatically
 * and sanitizing any duplicate /api/v1 prefixes in endpoint parameters.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  let cleanEndpoint = endpoint;
  
  // Prevent duplicate /api/v1/api/v1 prefix issues
  if (cleanEndpoint.startsWith('/api/v1/')) {
    cleanEndpoint = cleanEndpoint.replace(/^\/api\/v1/, '');
  } else if (cleanEndpoint.startsWith('api/v1/')) {
    cleanEndpoint = cleanEndpoint.replace(/^api\/v1/, '');
  }

  const baseUrl = getApiBaseUrl();
  const url = cleanEndpoint.startsWith('http')
    ? cleanEndpoint
    : `${baseUrl}${cleanEndpoint.startsWith('/') ? '' : '/'}${cleanEndpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  return fetch(url, { ...options, headers });
}
