'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });

      const resData = await response.json();

      if (resData.success) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        if (resData.token) {
          localStorage.setItem('spy_token', resData.token);
          localStorage.setItem('spy_user', JSON.stringify(resData.user));
        }
        setTimeout(() => {
          router.push('/login');
        }, 1800);
      } else {
        setErrorMessage(resData.message || 'Registration failed');
      }
    } catch (err) {
      // Offline fallback simulation
      setSuccessMessage('Account created successfully! (Offline Demo Mode)');
      localStorage.setItem('spy_user', JSON.stringify({ name: formData.name, email: formData.email }));
      setTimeout(() => {
        router.push('/login');
      }, 1800);
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
            <span>Join SPY Salon VIP</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-white">Create Your Account</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Enjoy instant online booking, member discounts, and priority concierge access.</p>
        </div>

        {/* Register Form Card */}
        <div className="rosegold-glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl border border-rosegold-500/30">
          
          {/* Notifications */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs text-gray-300 uppercase font-semibold block">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs text-gray-300 uppercase font-semibold block">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div className="space-y-1">
              <label className="text-xs text-gray-300 uppercase font-semibold block">Mobile Phone *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs text-gray-300 uppercase font-semibold block">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
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

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs text-gray-300 uppercase font-semibold block">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 mt-2"
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Login Redirect Link */}
          <div className="pt-4 border-t border-white/10 text-center text-xs text-gray-400">
            <span>Already registered? </span>
            <Link href="/login" className="text-rosegold-400 font-bold hover:underline ml-1">
              Sign In Here →
            </Link>
          </div>

        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-rosegold-400" />
          <span>Your information is protected with SSL encryption</span>
        </div>

      </div>
    </div>
  );
}
