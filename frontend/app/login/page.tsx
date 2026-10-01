'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { validateForm, validateRequired, validatePassword } from '@/lib/validation';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/';
  const isAuthRequired = searchParams?.get('auth_required') === 'true';

  const { user, login } = useAuth();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const isRegistered = searchParams?.get('registered') === 'true';
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
    if (isRegistered) {
      setSuccessMessage('Account created successfully! Please sign in below with your credentials.');
    }
  }, [searchParams]);

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

  useEffect(() => {
    if (user) {
      dispatchRoleBasedRedirect(user);
    }
  }, [user]);

  // Handle Password Login Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const isEmpCode = formData.email.trim().toLowerCase().startsWith('emp');
    const { isValid, errors } = validateForm(formData, {
      email: isEmpCode ? [validateRequired('Email Address or Employee Code')] : [validateRequired('Email Address')],
      password: [validatePassword(6)]
    });

    setFieldErrors(errors as Record<string, string>);

    if (!isValid) {
      const firstErr = Object.values(errors)[0];
      setErrorMessage(firstErr || 'Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);

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

  return (
    <div className="relative py-6 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 selection:bg-rosegold-500/30 selection:text-white overflow-hidden font-sans">
      
      {/* AMBIENT BACKGROUND GLOW TO MATCH SPY SALON DESIGN SYSTEM */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rosegold-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TWO-COLUMN LUXURY SALON CONTAINER */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch z-10 relative">
        
        {/* LEFT SECTION: BESPOKE SALON VISUAL EXPERIENCE (50%) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-6 relative rounded-3xl overflow-hidden border border-rosegold-500/25 bg-dark-900 min-h-[380px] sm:min-h-[480px] lg:min-h-[580px] flex flex-col justify-between p-7 sm:p-10 shadow-2xl group"
        >
          {/* Background Studio Photography with Dark Luxury Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
            style={{ backgroundImage: `url('/luxury-salon-bg.jpg')` }}
            role="img"
            aria-label="SPY Salon Luxury Beauty Studio"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/75 to-dark-950/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950/60 to-transparent" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-dark-900/80 backdrop-blur-md border border-rosegold-500/40 text-rosegold-300 text-[11px] font-extrabold tracking-wider uppercase shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-rosegold-400 animate-pulse" />
              <span>SPY SALON • JUBILEE HILLS</span>
            </div>
          </div>

          {/* Bottom Statement & Brand Essence */}
          <div className="relative z-10 space-y-4 text-left">
            <div className="w-12 h-1 bg-gradient-to-r from-rosegold-400 to-amber-500 rounded-full" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white leading-tight">
              Where Beauty <br />
              <span className="italic font-normal rosegold-gradient-text block">
                Meets Confidence.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed max-w-md">
              Step into an intimate sanctuary of couture hair artistry, 24K botanical facials, and rejuvenating spa rituals tailored precisely to you.
            </p>

            {/* Subtle Signature Highlights */}
            <div className="pt-1 flex flex-wrap gap-2 text-[10px] text-rosegold-300 font-semibold tracking-wider uppercase">
              <span className="px-3 py-1 rounded-full bg-dark-900/80 backdrop-blur-sm border border-rosegold-500/30">
                Bespoke Styling
              </span>
              <span className="px-3 py-1 rounded-full bg-dark-900/80 backdrop-blur-sm border border-rosegold-500/30">
                Organic Botanicals
              </span>
              <span className="px-3 py-1 rounded-full bg-dark-900/80 backdrop-blur-sm border border-rosegold-500/30">
                Private VIP Suites
              </span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT SECTION: CLEAN LUXURY LOGIN CARD (50%) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-6 bg-dark-900/90 backdrop-blur-2xl rounded-3xl border border-rosegold-500/30 p-7 sm:p-10 shadow-2xl flex flex-col justify-between relative"
        >
          <div>
            {/* Header */}
            <div className="text-center sm:text-left space-y-1 pb-5 border-b border-white/10">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 font-sans">
                Sign in to your client account or access your studio profile.
              </p>
            </div>

            {/* Notification Banners */}
            <div className="pt-5 space-y-3">
              {isAuthRequired && !errorMessage && !successMessage && (
                <div className="p-3.5 rounded-2xl bg-rosegold-500/10 border border-rosegold-500/30 text-rosegold-300 text-xs flex items-center space-x-2.5 animate-fadeIn">
                  <Lock className="w-4 h-4 shrink-0 text-rosegold-400" />
                  <span>Please sign in with your credentials to open your dashboard.</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2.5 animate-fadeIn font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs flex items-center space-x-2.5 animate-fadeIn font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Password Login Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1 text-left">
                
                {/* Email Address or Staff ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-200 block tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. client@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-dark-800 text-white placeholder-gray-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-rosegold-400 focus:ring-2 focus:ring-rosegold-400/20 transition-all shadow-inner"
                    />
                  </div>
                  {fieldErrors.email && (
                    <span className="text-[11px] text-red-400 block mt-1">{fieldErrors.email}</span>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-200 block tracking-wide">
                      Password *
                    </label>
                    <Link 
                      href="/forgot-password" 
                      className="text-xs font-semibold text-rosegold-400 hover:text-rosegold-300 hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your secret password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-white/10 bg-dark-800 text-white placeholder-gray-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-rosegold-400 focus:ring-2 focus:ring-rosegold-400/20 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span className="text-[11px] text-red-400 block mt-1">{fieldErrors.password}</span>
                  )}
                </div>

                {/* Premium Rose-Gold Rounded Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-full rosegold-gradient-bg !text-white font-extrabold text-xs sm:text-sm tracking-wider shadow-glow-rosegold hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }} className="!text-white font-extrabold">
                      {isSubmitting ? 'Authenticating Role...' : 'Sign In'}
                    </span>
                    <ArrowRight className="w-4 h-4 !text-white" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* New Client & Legal Links */}
          <div className="pt-6 mt-6 border-t border-white/10 text-center space-y-2.5 text-xs text-gray-400">
            <p>
              New client?{' '}
              <Link 
                href="/register" 
                className="font-bold text-rosegold-400 hover:text-rosegold-300 hover:underline ml-1 transition-colors"
              >
                Create Account →
              </Link>
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed max-w-xs mx-auto">
              By continuing, you acknowledge our{' '}
              <Link href="/terms-and-conditions" className="text-rosegold-400 hover:underline font-medium">
                Terms & Conditions
              </Link>
              {' '}and{' '}
              <Link href="/privacy-policy" className="text-rosegold-400 hover:underline font-medium">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-rosegold-400 text-sm animate-pulse font-serif">
          Loading SPY Salon Login Experience...
        </div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
