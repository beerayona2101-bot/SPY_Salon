/**
 * SPY Salon API Configuration
 * Production version for Nginx Reverse Proxy
 */

// Base URL from environment
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost";

// REST API Base URL
export const API_BASE_URL = `${BASE_URL}/api/v1`;

// Socket.IO URL
export const SOCKET_URL = BASE_URL;

// Frontend URL
export const APP_BASE_URL = BASE_URL;

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

// Getter Functions
export function getCleanOrigin(): string {
  return BASE_URL;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getSocketUrl(): string {
  return SOCKET_URL;
}

export function getAppBaseUrl(): string {
  return APP_BASE_URL;
}

// Common Fetch Wrapper
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  let cleanEndpoint = endpoint.trim();

  // Remove duplicate prefixes
  cleanEndpoint = cleanEndpoint
    .replace(/^\/?(api\/v1|api)/i, '');

  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = '/' + cleanEndpoint;
  }

  const url = `${API_BASE_URL}${cleanEndpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}
