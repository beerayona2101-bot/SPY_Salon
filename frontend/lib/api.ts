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

  // Browser Client-Side Dynamic Fallback for LAN IP access (e.g. 192.168.x.x) or Nginx reverse proxy
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
      return `${protocol}//${hostname}:5000`;
    }
  }

  // Local development fallback to Node/Express backend on port 5000
  return (envUrl && !envUrl.includes('5050')) ? envUrl : 'http://localhost:5000';
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

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function handleLogoutRedirect() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('spy_token');
    localStorage.removeItem('spy_refresh_token');
    localStorage.removeItem('spy_user');
    
    // Dispatch session_expired custom event & cross-tab storage signal
    window.dispatchEvent(new CustomEvent('auth:session_expired'));
    try {
      localStorage.setItem('spy_logout_signal', Date.now().toString());
    } catch (e) {}

    console.warn('[Auth] Session expired or invalid. Redirecting to login.');
    
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    }
  }
}

// Common Fetch Wrapper
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  let cleanEndpoint = endpoint.trim();
  let url = '';

  if (cleanEndpoint.startsWith('http://') || cleanEndpoint.startsWith('https://')) {
    url = cleanEndpoint;
  } else {
    // Remove duplicate prefixes
    cleanEndpoint = cleanEndpoint
      .replace(/^(\/api\/v1|\/api)+/i, '')
      .replace(/^(api\/v1|api)+/i, '');

    if (!cleanEndpoint.startsWith('/')) {
      cleanEndpoint = '/' + cleanEndpoint;
    }

    url = `${baseUrl}${cleanEndpoint}`;
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  // Auto-inject cached Authorization header if token exists in localStorage
  if (typeof window !== 'undefined' && !headers['Authorization']) {
    const cachedToken = localStorage.getItem('spy_token');
    if (cachedToken) {
      headers['Authorization'] = `Bearer ${cachedToken}`;
    }
  }

  // Do not override Content-Type header when sending FormData
  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });
  const isRefreshRequest = url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register');

  if (response.status === 401 && !isRefreshRequest) {
    console.warn('[Auth] Access token expired. Attempting refresh...');

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(async (newToken) => {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, { ...options, headers });
      }).catch((err) => {
        throw err;
      });
    }

    isRefreshing = true;
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('spy_refresh_token') : null;

    if (!refreshToken) {
      isRefreshing = false;
      console.warn('[Auth] Refresh token not found in storage. Retaining current session.');
      return response;
    }

    try {
      const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      // Handle HTTP Server Reboots or Temporary Gateway Unavailable (502, 503, 504)
      if (refreshRes.status >= 500) {
        console.warn('[Auth] Server is restarting or unavailable (HTTP ' + refreshRes.status + '). Retaining session credentials.');
        isRefreshing = false;
        refreshQueue.forEach(req => req.reject(new Error('Server unavailable during restart')));
        refreshQueue = [];
        return response;
      }

      let refreshData: any = {};
      try {
        refreshData = await refreshRes.json();
      } catch (jsonErr) {}

      if (refreshRes.ok && refreshData.success && refreshData.token) {
        const newToken = refreshData.token;
        const newRefreshToken = refreshData.refreshToken || refreshToken;

        localStorage.setItem('spy_token', newToken);
        localStorage.setItem('spy_refresh_token', newRefreshToken);
        if (refreshData.user) {
          localStorage.setItem('spy_user', JSON.stringify(refreshData.user));
        }

        console.log('[Auth] Token refresh successful. Retrying original request.');

        // Dispatch a custom event to notify Contexts of the new credentials
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:token_refreshed', { 
            detail: { token: newToken, user: refreshData.user } 
          }));
        }

        refreshQueue.forEach(req => req.resolve(newToken));
        refreshQueue = [];
        isRefreshing = false;

        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, { ...options, headers });
      } else if (refreshRes.status === 401 || refreshRes.status === 403) {
        // Refresh token is expired or revoked -> Clear stale session and redirect to login
        console.warn('[Auth] Refresh token expired or revoked. Clearing stale session and redirecting to login.');
        isRefreshing = false;
        refreshQueue.forEach(req => req.reject(new Error('Session expired')));
        refreshQueue = [];
        handleLogoutRedirect();
        return response;
      } else {
        console.warn('[Auth] Refresh response rejected or failed (HTTP ' + refreshRes.status + '). Retaining stored session.');
        isRefreshing = false;
        refreshQueue.forEach(req => req.reject(new Error('Refresh returned status ' + refreshRes.status)));
        refreshQueue = [];
        return response;
      }
    } catch (err: any) {
      // Network Error (e.g. Failed to fetch, ECONNREFUSED, Server restarting/offline)
      console.warn('[Auth] Refresh network request failed (server restarting or offline). Retaining session credentials:', err?.message || err);
      isRefreshing = false;
      refreshQueue.forEach(req => req.reject(err));
      refreshQueue = [];
      // DO NOT call handleLogoutRedirect() on network error during server restart!
      return response;
    }
  }

  return response;
}

