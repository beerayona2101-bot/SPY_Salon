/**
 * Single Base URL & Real-Time Socket Configuration for SPY Salon
 * Dynamically derives origin, API_BASE_URL, SOCKET_URL, and APP_BASE_URL
 * from a SINGLE backend base URL environment variable (NEXT_PUBLIC_BACKEND_URL).
 * Also supports localhost, custom domain, and LAN IP address auto-resolution (e.g. 192.168.x.x).
 */

// Helper to sanitize any input URL (removes any trailing /api/v1, /api, or trailing slashes)
export function sanitizeOrigin(url: string): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/\/(api\/v1|api)\/?$/i, '')
    .replace(/\/$/, '');
}

// 1. Raw Single Environment Configured Backend Base URL
const getRawEnvBackendUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                 process.env.NEXT_PUBLIC_BASE_URL || 
                 process.env.NEXT_PUBLIC_API_URL || 
                 '';
  return sanitizeOrigin(envUrl);
};

const ENV_BACKEND_URL = getRawEnvBackendUrl();

/**
 * Returns the clean backend origin URL (e.g. http://localhost:5000 or http://192.168.88.9:5000)
 */
export function getCleanOrigin(): string {
  // If explicitly configured in environment to a remote/production URL (not localhost/127.0.0.1)
  if (ENV_BACKEND_URL && !ENV_BACKEND_URL.includes('localhost') && !ENV_BACKEND_URL.includes('127.0.0.1')) {
    return ENV_BACKEND_URL;
  }

  // Browser Client-Side Dynamic Origin Fallback for LAN IP access
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (port === '3000') {
        return `${protocol}//${hostname}:5000`;
      }
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }
  }

  // Fallback to configured single ENV URL or default local backend server port 5000
  return ENV_BACKEND_URL || 'http://localhost:5000';
}

/**
 * Returns the full REST API V1 endpoint base URL (e.g. http://localhost:5000/api/v1)
 */
export function getApiBaseUrl(): string {
  const origin = getCleanOrigin();
  return `${origin}/api/v1`;
}

/**
 * Returns the WebSocket / Real-time Socket.IO server URL (e.g. http://localhost:5000)
 */
export function getSocketUrl(): string {
  return getCleanOrigin();
}

/**
 * Returns the Frontend Application base URL (e.g. http://localhost:3000)
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
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
