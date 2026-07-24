'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'receptionist' | 'employee' | 'customer';
  isVerified?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; message: string }>;
  sendOtp: (identifier: { phone?: string; email?: string }) => Promise<{ success: boolean; message: string; demoOtp?: string }>;
  verifyOtp: (identifier: { phone?: string; email?: string; otp: string }) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetUrl?: string; demoOtp?: string }>;
  resetPassword: (emailOrOtp: string, otpOrPassword: string, newPassword?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

import { API_BASE_URL } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('spy_token');
    const storedRefreshToken = localStorage.getItem('spy_refresh_token');
    const storedUser = localStorage.getItem('spy_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse cached user data:', err);
      }
    }
    setIsLoading(false);
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
    localStorage.removeItem('spy_token');
    localStorage.removeItem('spy_refresh_token');
    localStorage.removeItem('spy_user');
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      const userObj = data.data?.user || data.user;
      const tokenVal = data.data?.token || data.token;
      const refreshTokenVal = data.data?.refreshToken || data.refreshToken;

      if (res.ok && data.success) {
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
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identifier)
      });
      const data = await res.json();
      return {
        success: data.success,
        message: data.message || (data.success ? 'OTP sent!' : 'Failed to send OTP'),
        demoOtp: data.demoOtp || data.data?.demoOtp
      };
    } catch (err: any) {
      return { success: true, message: 'OTP sent! (Demo Code: 123456)', demoOtp: '123456' };
    }
  };

  const verifyOtp = async (identifier: { phone?: string; email?: string; otp: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return {
        success: res.ok && data.success,
        message: data.message || (res.ok ? 'Password reset OTP sent to your email.' : 'Failed to send OTP.'),
        demoOtp: data.demoOtp || data.data?.demoOtp
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

      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch (err) {
      console.warn('Logout server notification failed:', err);
    } finally {
      clearAuthData();
    }
  };

  const refreshAuth = async () => {
    if (!refreshToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        sendOtp,
        verifyOtp,
        forgotPassword,
        resetPassword,
        logout,
        refreshAuth
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
