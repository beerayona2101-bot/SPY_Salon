'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Phone, KeyRound } from 'lucide-react';
import { useAuth, UserProfile } from '@/context/AuthContext';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/profile';
  const isAuthRequired = searchParams.get('auth_required') === 'true';

  const { login, sendOtp, verifyOtp } = useAuth();

  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [formData, setFormData] = useState({ email: '', password: '', phone: '', otp: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Unified Role-Based Redirection Function
  const dispatchRoleBasedRedirect = (userObj?: UserProfile) => {
    let role = userObj?.role;

    if (!role) {
      const storedUser = localStorage.getItem('spy_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          role = parsed.role;
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (role === 'admin' || role === 'manager') {
      router.push('/admin');
    } else if (role === 'employee' || role === 'receptionist') {
      router.push('/employee');
    } else {
      router.push(redirectTarget);
    }
  };

  // Handle Password Login Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await login(formData.email, formData.password);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Authenticated successfully!');
      setTimeout(() => {
        dispatchRoleBasedRedirect(res.user);
      }, 600);
    } else {
      setErrorMessage(res.message || 'Invalid credentials.');
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone && !formData.email) {
      setErrorMessage('Please provide phone number or email to receive OTP.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await sendOtp({ phone: formData.phone, email: formData.email });
    setIsSubmitting(false);

    if (res.success) {
      setOtpSent(true);
      setSuccessMessage(res.message);
    } else {
      setErrorMessage(res.message);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await verifyOtp({
      phone: formData.phone,
      email: formData.email,
      otp: formData.otp
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message || 'OTP Verified!');
      setTimeout(() => {
        dispatchRoleBasedRedirect(res.user);
      }, 600);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-rosegold-500/15 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        
        {/* Header & Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white p-1.5 border border-rosegold-500/40 flex items-center justify-center shadow-glow-rosegold mx-auto overflow-hidden">
            <img src="/logo.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold font-serif text-white">Sign In to SPY Salon</h1>
        </div>

        {/* Login Form Card */}
        <div className="rosegold-glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl border border-rosegold-500/30">
          
          {/* Notifications */}
          {isAuthRequired && !errorMessage && !successMessage && (
            <div className="p-4 rounded-xl bg-rosegold-500/15 border border-rosegold-500/40 text-rosegold-300 text-xs flex items-center space-x-2.5 animate-fadeIn">
              <Lock className="w-4 h-4 shrink-0 text-rosegold-400" />
              <span>Please sign in with your credentials to open your dashboard.</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-xs flex items-center space-x-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Auth Method Tabs */}
          <div className="flex bg-dark-800 p-1 rounded-xl text-xs font-semibold text-gray-400">
            <button
              type="button"
              onClick={() => { setAuthMethod('password'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                authMethod === 'password' ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Password Login</span>
            </button>

            <button
              type="button"
              onClick={() => { setAuthMethod('otp'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                authMethod === 'otp' ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>OTP Login</span>
            </button>
          </div>

          {/* TAB 1: Password Login Form */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              
              {/* Email Address or Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 uppercase font-semibold block">Email Address or Mobile Number *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. customer@spysalon.com or +91 98765 43210"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-300 uppercase font-semibold block">Password *</label>
                  <Link href="/forgot-password" className="text-[11px] text-rosegold-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Authenticating Role...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: OTP Login Form */}
          {authMethod === 'otp' && (
            <div className="space-y-5">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 uppercase font-semibold block">Mobile Number / Email *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="+91 9876543210 or user@spysalon.com"
                        value={formData.phone || formData.email}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes('@')) {
                            setFormData({ ...formData, email: val, phone: '' });
                          } else {
                            setFormData({ ...formData, phone: val, email: '' });
                          }
                        }}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Sending OTP...' : 'Send 6-Digit OTP'}</span>
                    <KeyRound className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-gray-300 uppercase font-semibold block">Enter 6-Digit OTP *</label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[11px] text-rosegold-400 hover:underline cursor-pointer"
                      >
                        Change Input
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        value={formData.otp}
                        onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm tracking-widest text-center font-mono focus:outline-none focus:border-rosegold-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Verifying OTP...' : 'Verify OTP & Sign In'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Register Link */}
          <div className="pt-4 border-t border-white/10 text-center text-xs text-gray-400">
            <span>New client? </span>
            <Link href="/register" className="text-rosegold-400 font-bold hover:underline ml-1">
              Create Account →
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="text-rosegold-400 text-sm animate-pulse">Loading Unified Login Portal...</div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
