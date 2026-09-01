'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'receptionist' | 'employee' | 'customer';
  isVerified?: boolean;
  avatar?: string;
  avatarVariants?: {
    thumbnail?: string;
    navbar?: string;
    card?: string;
    full?: string;
  };
  gender?: string;
  dob?: string;
  anniversary?: string;
  address?: string;
  emergencyContact?: string;
  preferredLanguage?: string;
  preferredCommunication?: string;
  notificationPreferences?: {
    emailAlerts?: boolean;
    smsAlerts?: boolean;
    whatsappAlerts?: boolean;
    promoOffers?: boolean;
  };
  profileCompleteness?: number;
  missingFields?: string[];
  membership?: any;
  packages?: any[];
}

export interface UserSession {
  id: string;
  sessionId: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
  status: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  sessions: UserSession[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; message: string }>;
  sendOtp: (identifier: { phone?: string; email?: string }) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (identifier: { phone?: string; email?: string; otp: string }) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (emailOrOtp: string, otpOrPassword: string, newPassword?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  getSessions: () => Promise<UserSession[]>;
  revokeSession: (sessionId: string) => Promise<{ success: boolean; message: string }>;
  refreshAuth: () => Promise<void>;
  updateProfileUser: (updatedData: Partial<UserProfile>) => void;
}

import { apiFetch, API_BASE_URL } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to safely check if JWT is expired
  const isTokenExpired = (t: string | null): boolean => {
    if (!t) return true;
    try {
      const parts = t.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (payload && typeof payload.exp === 'number') {
        return Date.now() >= payload.exp * 1000;
      }
    } catch (e) {}
    return true;
  };

  // Initialize session from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('spy_token');
      const storedRefreshToken = localStorage.getItem('spy_refresh_token');
      const storedUser = localStorage.getItem('spy_user');

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          if (parsedUser?.email === 'vip.guest@spysalon.com') {
            // Remove old auto-generated guest profile
            localStorage.removeItem('spy_user');
            localStorage.removeItem('spy_token');
            localStorage.removeItem('spy_refresh_token');
          } else {
            if (parsedUser?.avatar && parsedUser.avatar.includes('photo-1534528741775-53994a69daeb')) {
              parsedUser.avatar = '';
              if (parsedUser.avatarVariants) {
                parsedUser.avatarVariants = undefined;
              }
              localStorage.setItem('spy_user', JSON.stringify(parsedUser));
            }

            // Always restore user state from localStorage to prevent automatic logouts
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            setUser(parsedUser);

            if (isTokenExpired(storedToken) && storedRefreshToken) {
              console.log('[AuthContext] Access token expired on startup. Attempting background refresh...');
              try {
                const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refreshToken: storedRefreshToken })
                });

                if (res.ok) {
                  let data: any = {};
                  try { data = await res.json(); } catch (e) {}

                  if (data.success && data.token) {
                    const newToken = data.token;
                    const newRefreshToken = data.refreshToken || storedRefreshToken;
                    const newUser = data.user || parsedUser;

                    setToken(newToken);
                    setRefreshToken(newRefreshToken);
                    setUser(newUser);

                    localStorage.setItem('spy_token', newToken);
                    localStorage.setItem('spy_refresh_token', newRefreshToken);
                    localStorage.setItem('spy_user', JSON.stringify(newUser));
                    console.log('[AuthContext] Access token refreshed successfully during startup.');
                  }
                }
              } catch (e) {
                console.warn('[AuthContext] Startup background refresh failed. Retaining current session:', e);
              }
            }
          }
        } catch (err) {
          console.error('Failed to parse cached user data:', err);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Listen for silent token refreshes
  useEffect(() => {
    const handleTokenRefreshed = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        if (detail.token) setToken(detail.token);
        if (detail.user) setUser(detail.user);
      }
    };

    const handleSessionExpired = () => {
      console.warn('[AuthContext] Session expired notification received. Retaining session for explicit user logout.');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:token_refreshed', handleTokenRefreshed);
      window.addEventListener('auth:session_expired', handleSessionExpired);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:token_refreshed', handleTokenRefreshed);
        window.removeEventListener('auth:session_expired', handleSessionExpired);
      }
    };
  }, []);

  // Multi-Tab & Cross-Window Storage Event Listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spy_logout_signal' || (e.key === 'spy_token' && !e.newValue)) {
        console.warn('[AuthContext] Multi-tab logout signal received.');
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        setSessions([]);
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
      } else if (e.key === 'spy_token' && e.newValue) {
        setToken(e.newValue);
        const updatedUser = localStorage.getItem('spy_user');
        if (updatedUser) {
          try { setUser(JSON.parse(updatedUser)); } catch (err) {}
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  const saveAuthData = (accToken: string, refToken: string, userObj?: UserProfile) => {
    if (accToken) {
      setToken(accToken);
      localStorage.setItem('spy_token', accToken);
    }
    if (refToken) {
      setRefreshToken(refToken);
      localStorage.setItem('spy_refresh_token', refToken);
    }
    if (userObj) {
      setUser(userObj);
      localStorage.setItem('spy_user', JSON.stringify(userObj));
    }
  };

  const clearAuthData = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setSessions([]);
    localStorage.removeItem('spy_token');
    localStorage.removeItem('spy_refresh_token');
    localStorage.removeItem('spy_user');
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      const userObj = data.data?.user || data.user;
      const tokenVal = data.data?.token || data.token;
      const refreshTokenVal = data.data?.refreshToken || data.refreshToken;

      if (res.ok && data.success && userObj) {
        saveAuthData(tokenVal, refreshTokenVal, userObj);
        return { success: true, message: data.message || 'Login successful!', user: userObj };
      } else {
        return { success: false, message: data.message || 'Invalid email/username or password.' };
      }
    } catch (err: any) {
      return { success: false, message: 'Server connection error. Please ensure backend is running.' };
    }
  };

  const register = async (formData: { name: string; email: string; phone: string; password: string }) => {
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      const userObj = data.data?.user || data.user;
      const tokenVal = data.data?.token || data.token;
      const refreshTokenVal = data.data?.refreshToken || data.refreshToken;

      if (res.ok && data.success) {
        if (tokenVal && refreshTokenVal && userObj) {
          saveAuthData(tokenVal, refreshTokenVal, userObj);
        }
        return { success: true, message: data.message || 'Account created successfully! Please log in.' };
      } else {
        return { success: false, message: data.message || 'Registration failed.' };
      }
    } catch (err: any) {
      return { success: false, message: 'Server connection error during registration.' };
    }
  };

  const sendOtp = async (identifier: { phone?: string; email?: string }) => {
    try {
      const res = await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify(identifier)
      });
      const data = await res.json();
      return {
        success: data.success,
        message: data.message || (data.success ? 'OTP sent!' : 'Failed to send OTP')
      };
    } catch (err: any) {
      return { success: false, message: 'Server connection error. Unable to send OTP.' };
    }
  };

  const verifyOtp = async (identifier: { phone?: string; email?: string; otp: string }) => {
    try {
      const res = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify(identifier)
      });
      const data = await res.json();
      const userObj = data.data?.user || data.user;
      const tokenVal = data.data?.token || data.token;
      const refreshTokenVal = data.data?.refreshToken || data.refreshToken;

      if (res.ok && data.success && userObj) {
        saveAuthData(tokenVal, refreshTokenVal, userObj);
        return { success: true, message: data.message || 'OTP verified!', user: userObj };
      } else {
        return { success: false, message: data.message || 'Invalid OTP code.' };
      }
    } catch (err: any) {
      return { success: false, message: 'OTP verification failed. Please try again.' };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return {
        success: res.ok && data.success,
        message: data.message || (res.ok ? 'Password reset OTP sent to your email.' : 'Failed to send OTP.')
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Server connection error. Please ensure backend is running.'
      };
    }
  };

  const resetPassword = async (emailOrOtp: string, otpOrPassword: string, newPassword?: string) => {
    try {
      let email = '';
      let otp = '';
      let password = '';

      if (newPassword) {
        email = emailOrOtp;
        otp = otpOrPassword;
        password = newPassword;
      } else {
        otp = emailOrOtp;
        password = otpOrPassword;
      }

      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message || 'Password reset successful!' };
      } else {
        return { success: false, message: data.message || 'OTP verification or reset failed.' };
      }
    } catch (err: any) {
      return { success: false, message: 'Server error during password reset.' };
    }
  };

  const logout = async () => {
    try {
      if (token && refreshToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch (err) {
      console.warn('Logout server notification failed:', err);
    } finally {
      clearAuthData();
      try {
        localStorage.setItem('spy_logout_signal', Date.now().toString());
      } catch (e) {}
    }
  };

  const logoutAll = async () => {
    try {
      const refToken = localStorage.getItem('spy_refresh_token') || '';
      await apiFetch('/auth/sessions/logout-all', {
        method: 'POST',
        headers: refToken ? { 'x-refresh-token': refToken } : {},
        body: JSON.stringify({ refreshToken: refToken })
      });
    } catch (e) {
      console.warn('Logout all request failed:', e);
    } finally {
      clearAuthData();
      try {
        localStorage.setItem('spy_logout_signal', Date.now().toString());
      } catch (e) {}
    }
  };

  const getSessions = async (): Promise<UserSession[]> => {
    if (!token) return [];
    try {
      const refToken = localStorage.getItem('spy_refresh_token') || '';
      const res = await apiFetch(`/auth/sessions${refToken ? `?refreshToken=${encodeURIComponent(refToken)}` : ''}`, {
        headers: refToken ? { 'x-refresh-token': refToken } : {}
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setSessions(data.data);
        return data.data;
      }
    } catch (e) {
      console.error('[AuthContext] Error fetching active sessions:', e);
    }
    return [];
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const res = await apiFetch(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId && s.sessionId !== sessionId));
        return { success: true, message: data.message || 'Session revoked successfully!' };
      } else {
        return { success: false, message: data.message || 'Failed to revoke session.' };
      }
    } catch (e) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const refreshAuth = async () => {
    if (!refreshToken) return;
    try {
      const res = await apiFetch('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
      const data = await res.json();
      if (data.success && data.token) {
        saveAuthData(data.token, data.refreshToken || refreshToken, data.user || user || undefined);
      }
    } catch (err) {
      console.error('Refresh auth failed:', err);
    }
  };

  const updateProfileUser = (updatedData: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updatedData };
      try {
        localStorage.setItem('spy_user', JSON.stringify(nextUser));
      } catch (e) {}
      return nextUser as UserProfile;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessions,
        isLoading,
        login,
        register,
        sendOtp,
        verifyOtp,
        forgotPassword,
        resetPassword,
        logout,
        logoutAll,
        getSessions,
        revokeSession,
        refreshAuth,
        updateProfileUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
