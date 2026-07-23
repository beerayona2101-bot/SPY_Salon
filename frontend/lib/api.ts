/**
 * Single Base URL Configuration for SPY Salon Frontend
 * Dynamically derives API_BASE_URL, SOCKET_URL, and Page Routes from ONE single BASE_URL variable.
 */

// Single Base URL Variable (Configured in .env)
export const SINGLE_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

// Clean Origin Base Host (Removes any trailing /api/v1)
const CLEAN_ORIGIN = SINGLE_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

// Derived Single Source of Truth Base URLs
export const SOCKET_URL = CLEAN_ORIGIN;
export const API_BASE_URL = `${CLEAN_ORIGIN}/api/v1`;
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  return fetch(url, { ...options, headers });
}
