/**
 * Dynamic Base URL & Real-Time Socket Configuration for SPY Salon
 * Resolves origin, API_BASE_URL, SOCKET_URL, and APP_BASE_URL dynamically
 * supporting localhost, custom domains, Nginx proxies, and LAN IP addresses (e.g. 192.168.x.x).
 */

// Helper to sanitize any input URL (removes any trailing /api/v1, /api, or trailing slashes)
export function sanitizeOrigin(url: string): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/\/(api\/v1|api)\/?$/i, '')
    .replace(/\/$/, '');
}

// Get raw environment backend URL if configured
const getRawEnvBackendUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                 process.env.NEXT_PUBLIC_BASE_URL || 
                 process.env.NEXT_PUBLIC_API_URL || 
                 '';
  return sanitizeOrigin(envUrl);
};

/**
 * Returns the clean backend origin URL (e.g. http://192.168.88.9:5000 or http://localhost:5000)
 * Evaluated dynamically at runtime.
 */
export function getCleanOrigin(): string {
  const envUrl = getRawEnvBackendUrl();

  // If explicitly configured in environment to a remote/specific URL (not default localhost/127.0.0.1)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // Browser Client-Side Dynamic Origin Fallback for LAN IP access
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // If frontend runs on port 3000 or port 80/8080 on LAN, default backend target port is 5000 (unless port 5000 is already active)
      if (port === '3000' || port === '' || port === '80') {
        return `${protocol}//${hostname}:5000`;
      }
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }
  }

  // Fallback to configured single ENV URL or default local backend server port 5000
  return envUrl || 'http://localhost:5000';
}

/**
 * Returns the full REST API V1 endpoint base URL (e.g. http://192.168.88.9:5000/api/v1)
 * Evaluated dynamically on every call.
 */
export function getApiBaseUrl(): string {
  const origin = getCleanOrigin();
  const cleanOrigin = origin.replace(/\/(api\/v1|api)\/?$/i, '').replace(/\/$/, '');
  return `${cleanOrigin}/api/v1`;
}

/**
 * Returns the WebSocket / Real-time Socket.IO server URL (e.g. http://192.168.88.9:5000)
 * Evaluated dynamically on every call.
 */
export function getSocketUrl(): string {
  const origin = getCleanOrigin();
  return origin.replace(/\/(api\/v1|api)\/?$/i, '').replace(/\/$/, '');
}

/**
 * Returns the Frontend Application base URL (e.g. http://192.168.88.9:3000)
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

// Backward-compatible exports with dynamic getters so static imports never lock to SSR localhost values
export const SINGLE_BASE_URL = {
  toString: () => getCleanOrigin(),
  valueOf: () => getCleanOrigin()
} as unknown as string;

export const CLEAN_ORIGIN = {
  toString: () => getCleanOrigin(),
  valueOf: () => getCleanOrigin()
} as unknown as string;

export const SOCKET_URL = {
  toString: () => getSocketUrl(),
  valueOf: () => getSocketUrl()
} as unknown as string;

export const API_BASE_URL = {
  toString: () => getApiBaseUrl(),
  valueOf: () => getApiBaseUrl()
} as unknown as string;

export const APP_BASE_URL = {
  toString: () => getAppBaseUrl(),
  valueOf: () => getAppBaseUrl()
} as unknown as string;

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
 * and sanitizing any duplicate /api/v1 or /api prefixes in endpoint parameters.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  let cleanEndpoint = endpoint.trim();
  
  // Prevent duplicate /api/v1/api/v1 or /api/api/v1 prefix issues
  cleanEndpoint = cleanEndpoint
    .replace(/^(\/api\/v1|\/api)+/i, '')
    .replace(/^(api\/v1|api)+/i, '');

  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = '/' + cleanEndpoint;
  }

  const baseUrl = getApiBaseUrl();
  const url = cleanEndpoint.startsWith('http')
    ? cleanEndpoint
    : `${baseUrl}${cleanEndpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  return fetch(url, { ...options, headers });
}
