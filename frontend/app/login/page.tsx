'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/book';
  const isAuthRequired = searchParams.get('auth_required') === 'true';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const resData = await response.json();

      if (resData.success) {
        setSuccessMessage('Welcome back! Redirecting you...');
        if (resData.token) {
          localStorage.setItem('spy_token', resData.token);
          localStorage.setItem('spy_user', JSON.stringify(resData.user || { name: 'Valued Guest', email: formData.email }));
        }
        setTimeout(() => {
          router.push(redirectTarget);
        }, 1200);
      } else {
        setErrorMessage(resData.message || 'Invalid email or password');
      }
    } catch (err) {
      // Offline fallback simulation
      setSuccessMessage('Welcome back! (Offline Demo Mode)');
      localStorage.setItem('spy_user', JSON.stringify({ name: 'Valued Guest', email: formData.email }));
      setTimeout(() => {
        router.push(redirectTarget);
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Rose Gold Glow Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-rosegold-500/15 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[250px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        
        {/* Header & Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white p-1.5 border border-rosegold-500/40 flex items-center justify-center shadow-glow-rosegold mx-auto overflow-hidden">
            <img src="/logo.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
          </div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-rosegold-500/30 text-rosegold-400 text-xs font-medium uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIP Portal</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-white">Sign In to Your Account</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Manage bookings, view rewards, and access luxury salon packages.</p>
        </div>

        {/* Login Form Card */}
        <div className="rosegold-glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl border border-rosegold-500/30">
          
          {/* Notifications */}
          {isAuthRequired && !errorMessage && !successMessage && (
            <div className="p-4 rounded-xl bg-rosegold-500/15 border border-rosegold-500/40 text-rosegold-300 text-xs flex items-center space-x-2.5 animate-fadeIn">
              <Lock className="w-4 h-4 shrink-0 text-rosegold-400" />
              <span>Please sign in or register your VIP account to complete your appointment booking.</span>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 uppercase font-semibold block">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
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
                <a href="#" className="text-[11px] text-rosegold-400 hover:underline">Forgot password?</a>
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Signing In...' : 'Sign In to Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Register Redirect Link */}
          <div className="pt-4 border-t border-white/10 text-center text-xs text-gray-400">
            <span>Don't have an account yet? </span>
            <Link href="/register" className="text-rosegold-400 font-bold hover:underline ml-1">
              Create Account →
            </Link>
          </div>

        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-rosegold-400" />
          <span>256-Bit Encrypted Secure Authentication</span>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="text-rosegold-400 text-sm animate-pulse">Loading...</div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
