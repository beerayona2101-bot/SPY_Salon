/**
 * SPY Salon API & Socket Configuration
 * Dynamically resolves API_BASE_URL, SOCKET_URL, and APP_BASE_URL
 * supporting Localhost, Custom Nginx Domain Proxies, and LAN IP Addresses.
 */

export function sanitizeOrigin(url: string): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/\/(api\/v1|api)\/?$/i, '')
    .replace(/\/$/, '');
}

export function getRawEnvBackendUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                 process.env.NEXT_PUBLIC_BACKEND_URL || 
                 process.env.NEXT_PUBLIC_API_URL || 
                 '';
  return sanitizeOrigin(envUrl);
}

export function getCleanOrigin(): string {
  const envUrl = getRawEnvBackendUrl();

  // If explicitly set in environment to a specific external/custom domain or full URL (e.g. port 5000 or custom domain)
  if (envUrl && envUrl !== 'http://localhost' && envUrl !== 'https://localhost') {
    return envUrl;
  }

  // Browser Client-Side Dynamic Fallback for LAN IP access or Nginx reverse proxy
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // On production / Nginx reverse proxy (standard port 80/443 or empty port), use relative/same origin
      if (port === '' || port === '80' || port === '443') {
        return `${protocol}//${hostname}`;
      }
      // On local LAN IP with Next.js dev server on port 3000/3001, connect to backend on 5000
      if (port === '3000' || port === '3001') {
        return `${protocol}//${hostname}:5000`;
      }
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }
  }

  // Local development fallback to Node/Express backend on port 5000
  return envUrl || 'http://localhost:5000';
}

export function getApiBaseUrl(): string {
  const origin = getCleanOrigin();
  const cleanOrigin = origin.replace(/\/(api\/v1|api)\/?$/i, '').replace(/\/$/, '');
  return `${cleanOrigin}/api/v1`;
}

export function getSocketUrl(): string {
  const origin = getCleanOrigin();
  return origin.replace(/\/(api\/v1|api)\/?$/i, '').replace(/\/$/, '');
}

export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

// Static & Dynamic Exports for full backward compatibility
export const SINGLE_BASE_URL = getCleanOrigin();
export const CLEAN_ORIGIN = getCleanOrigin();
export const SOCKET_URL = getSocketUrl();
export const API_BASE_URL = getApiBaseUrl();
export const APP_BASE_URL = getAppBaseUrl();

// Page Routes
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

// Common Fetch Wrapper
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  let cleanEndpoint = endpoint.trim();

  // Remove duplicate prefixes
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

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  // Do not override Content-Type header when sending FormData
  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, { ...options, headers });
}
