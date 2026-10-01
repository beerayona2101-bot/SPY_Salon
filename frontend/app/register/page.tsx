'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { validateForm, validateName, validateEmail, validatePhone, validatePassword, validateConfirmPassword } from '@/lib/validation';
import { AnimatedButton } from '@/components/ui/animated-button';

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '';

  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!acceptedTerms) {
      setErrorMessage('Please accept the Terms & Conditions and Privacy Policy to create your account.');
      return;
    }

    const { isValid, errors } = validateForm(formData, {
      name: [validateName('Full Name')],
      email: [validateEmail(true)],
      phone: [validatePhone(true)],
      password: [validatePassword(6)],
      confirmPassword: [validateConfirmPassword('password')]
    });

    setFieldErrors(errors as Record<string, string>);

    if (!isValid) {
      const firstErr = Object.values(errors)[0];
      setErrorMessage(firstErr || 'Please fix validation errors before submitting.');
      return;
    }

    setIsSubmitting(true);

    const res = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      termsAccepted: true,
      privacyPolicyAccepted: true,
      termsVersion: '1.0',
      privacyPolicyVersion: '1.0'
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('Account created successfully! Redirecting to sign in page...');
      setTimeout(() => {
        const redirectQuery = redirectTarget ? `&redirect=${encodeURIComponent(redirectTarget)}` : '';
        router.push(`/login?registered=true&email=${encodeURIComponent(formData.email)}${redirectQuery}`);
      }, 1000);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="flex items-center justify-center py-2 sm:py-4 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Rose Gold Glow Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-rosegold-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-xl w-full space-y-3 sm:space-y-4 relative z-10">
        
        {/* Compact Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-1"
        >
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-dark-800/90 border border-rosegold-500/30 text-rosegold-400 text-[10px] font-semibold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-rosegold-400 animate-pulse" />
            <span>VIP Account Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">Create Account</h1>
          <p className="text-gray-400 text-xs">Enjoy instant online booking, member discounts, and priority concierge access.</p>
        </motion.div>

        {/* Register Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rosegold-glass-card p-5 sm:p-6 rounded-3xl space-y-3.5 shadow-2xl border border-rosegold-500/30 bg-dark-900/90 backdrop-blur-xl"
        >
          
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-xs flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* ROW 1: Full Name & Mobile Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-rosegold-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Sharma"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-rosegold-400 transition-colors shadow-inner"
                  />
                </div>
                {fieldErrors.name && <p className="text-red-400 text-[11px] font-semibold">{fieldErrors.name}</p>}
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Mobile Phone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-rosegold-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-rosegold-400 transition-colors shadow-inner"
                  />
                </div>
                {fieldErrors.phone && <p className="text-red-400 text-[11px] font-semibold">{fieldErrors.phone}</p>}
              </div>
            </div>

            {/* ROW 2: Email Address */}
            <div className="space-y-1 text-left">
              <label className="text-xs text-gray-300 font-semibold block">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-rosegold-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-rosegold-400 transition-colors shadow-inner"
                />
              </div>
              {fieldErrors.email && <p className="text-red-400 text-[11px] font-semibold">{fieldErrors.email}</p>}
            </div>

            {/* ROW 3: Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-rosegold-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="At least 6 chars"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-rosegold-400 transition-colors shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-400 text-[11px] font-semibold">{fieldErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-rosegold-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-rosegold-400 transition-colors shadow-inner"
                  />
                </div>
                {fieldErrors.confirmPassword && <p className="text-red-400 text-[11px] font-semibold">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            {/* Mandatory Terms & Privacy Consent Checkbox */}
            <div className="pt-0.5">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none group text-left">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked && errorMessage?.includes('Terms')) {
                      setErrorMessage(null);
                    }
                  }}
                  className="w-3.5 h-3.5 rounded border-white/20 text-rosegold-500 focus:ring-rosegold-500 bg-dark-800 accent-rosegold-500 shrink-0 cursor-pointer"
                />
                <span className="text-[11px] text-gray-300 leading-tight">
                  I agree to the{' '}
                  <Link
                    href="/terms-and-conditions"
                    target="_blank"
                    className="text-rosegold-400 font-bold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link
                    href="/privacy-policy"
                    target="_blank"
                    className="text-rosegold-400 font-bold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <AnimatedButton
                type="submit"
                disabled={isSubmitting || !acceptedTerms}
                className="w-full py-2.5 sm:py-3 rounded-full rosegold-gradient-bg !text-white font-extrabold text-xs sm:text-sm shadow-glow-rosegold hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Creating Account...' : 'Register Account'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </AnimatedButton>
            </div>
          </form>

          {/* Login Redirect Link */}
          <div className="pt-2.5 border-t border-white/10 text-center text-xs text-gray-400">
            <span>Already registered? </span>
            <Link href="/login" className="text-rosegold-400 font-bold hover:underline ml-1">
              Sign In Here →
            </Link>
          </div>

        </motion.div>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="text-rosegold-400 text-sm animate-pulse">Loading Account Registration Portal...</div>
      </div>
    }>
      <RegisterFormInner />
    </Suspense>
  );
}
