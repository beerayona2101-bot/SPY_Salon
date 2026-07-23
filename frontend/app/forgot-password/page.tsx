'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, KeyRound, ArrowLeft, ArrowRight, Sparkles, CheckCircle2, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1: Send OTP to Registered Email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await forgotPassword(email);
    setIsSubmitting(false);

    if (res.success) {
      const otpNotice = res.demoOtp ? ` (Verification Code: ${res.demoOtp})` : '';
      setSuccessMessage(`${res.message || '6-Digit OTP code sent to your email inbox!'}${otpNotice}`);
      if (res.demoOtp) {
        setOtp(res.demoOtp);
      }
      setStep(2);
    } else {
      setErrorMessage(res.message || 'Failed to process password reset.');
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code sent to your email.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and try again.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await resetPassword(email, otp, password);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Password reset successful! Redirecting to sign in...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } else {
      setErrorMessage(res.message || 'OTP verification or password reset failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Rose Gold Glow Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-rosegold-500/15 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[250px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white p-1.5 border border-rosegold-500/40 flex items-center justify-center shadow-glow-rosegold mx-auto overflow-hidden">
            <img src="/logo.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
          </div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-rosegold-500/30 text-rosegold-400 text-xs font-medium uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Account Recovery</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-white">
            {step === 1 ? 'Forgot Password?' : 'Reset Your Password'}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            {step === 1 
              ? 'Enter your registered email address to receive a 6-digit OTP code.' 
              : `Enter the 6-digit OTP code sent to ${email} along with your new password.`}
          </p>
        </div>

        {/* Form Card */}
        <div className="rosegold-glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl border border-rosegold-500/30">
          
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

          {step === 1 ? (
            /* STEP 1: Email Address Submission */
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 uppercase font-semibold block">Registered Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Verifying Email & Dispatching OTP...' : 'Send 6-Digit Reset OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: OTP Verification & New Password Setup */
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-300 uppercase font-semibold block">6-Digit OTP Code *</label>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setErrorMessage(null); setSuccessMessage(null); }}
                    className="text-[11px] text-rosegold-400 hover:underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm tracking-widest text-center font-mono focus:outline-none focus:border-rosegold-500 transition-colors"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 uppercase font-semibold block">New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 uppercase font-semibold block">Confirm New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-800/90 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Updating Password...' : 'Verify OTP & Reset Password'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-white/10 text-center text-xs text-gray-400 flex items-center justify-center space-x-1.5">
            <ArrowLeft className="w-3.5 h-3.5 text-rosegold-400" />
            <span>Remembered your password? </span>
            <Link href="/login" className="text-rosegold-400 font-bold hover:underline ml-1">
              Back to Sign In
            </Link>
          </div>

        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-rosegold-400" />
          <span>Secure Encrypted Password Recovery</span>
        </div>

      </div>
    </div>
  );
}
