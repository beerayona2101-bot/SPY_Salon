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

export function formatImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/')) {
    const origin = getCleanOrigin();
    return `${origin}${trimmed}`;
  }
  if (trimmed.startsWith('uploads/')) {
    const origin = getCleanOrigin();
    return `${origin}/${trimmed}`;
  }
  return trimmed;
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

let activeRefreshPromise: Promise<string | null> | null = null;

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

/**
 * Single-Flight Token Refresh Mechanism
 * Prevents multiple simultaneous /auth/refresh HTTP requests.
 * Concurrent API calls or auth hooks await the single active refresh promise.
 */
export async function refreshTokenSingleFlight(): Promise<string | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    const baseUrl = getApiBaseUrl();
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('spy_refresh_token') : null;

    if (!refreshToken) {
      console.warn('[Auth] Refresh token not found in storage.');
      return null;
    }

    try {
      const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      // Handle Server Reboots or Gateway Errors (500, 502, 503, 504)
      if (refreshRes.status >= 500) {
        console.warn(`[Auth] Server unavailable during refresh (HTTP ${refreshRes.status}). Retaining session.`);
        return null;
      }

      let refreshData: any = {};
      try {
        refreshData = await refreshRes.json();
      } catch (jsonErr) {}

      if (refreshRes.ok && refreshData.success && refreshData.token) {
        const newToken = refreshData.token;
        const newRefreshToken = refreshData.refreshToken || refreshToken;

        if (typeof window !== 'undefined') {
          localStorage.setItem('spy_token', newToken);
          localStorage.setItem('spy_refresh_token', newRefreshToken);
          if (refreshData.user) {
            localStorage.setItem('spy_user', JSON.stringify(refreshData.user));
          }

          window.dispatchEvent(new CustomEvent('auth:token_refreshed', { 
            detail: { token: newToken, refreshToken: newRefreshToken, user: refreshData.user } 
          }));
        }

        console.log('[Auth] Single-flight token refresh succeeded.');
        return newToken;
      } else if (refreshRes.status === 401 || refreshRes.status === 403) {
        console.warn('[Auth] Refresh token expired or revoked by server. Invalidation triggered.');
        handleLogoutRedirect();
        return null;
      } else {
        console.warn(`[Auth] Refresh response returned HTTP ${refreshRes.status}. Retaining stored session.`);
        return null;
      }
    } catch (err: any) {
      console.warn('[Auth] Refresh network request failed (server restarting/offline). Retaining session:', err?.message || err);
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
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
    console.warn('[Auth] Access token expired (401). Triggering single-flight refresh...');

    const newToken = await refreshTokenSingleFlight();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      return fetch(url, { ...options, headers });
    }
  }

  return response;
}

