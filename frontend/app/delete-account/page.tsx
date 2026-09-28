'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trash2, ArrowLeft, ShieldAlert, CheckCircle2, AlertCircle, Lock, Mail, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // State for logged-in user password confirmation
  const [password, setPassword] = useState('');
  
  // State for unauthenticated user flow (Email + OTP / Password)
  const [unauthEmail, setUnauthEmail] = useState('');
  const [unauthOtp, setUnauthOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Deletion for Authenticated Customer
  const handleAuthenticatedDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!password) {
      setErrorMessage('Please enter your account password to verify deletion.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiFetch('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage('Your account has been deleted successfully.');
        setTimeout(async () => {
          await logout();
          router.push('/');
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Security verification failed. Incorrect password.');
      }
    } catch (err: any) {
      setErrorMessage('We couldn\'t delete your account right now. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send OTP for unauthenticated deletion request
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!unauthEmail || !unauthEmail.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: unauthEmail, purpose: 'account-deletion' })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsOtpSent(true);
        setSuccessMessage('A 6-digit verification OTP code has been sent to your email inbox.');
      } else {
        setErrorMessage(data.message || 'Failed to dispatch verification code. Please check your email.');
      }
    } catch (err) {
      setErrorMessage('Server connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Unauthenticated Deletion via OTP
  const handleUnauthenticatedDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!unauthOtp) {
      setErrorMessage('Please enter the 6-digit verification OTP code sent to your email.');
      return;
    }

    setIsSubmitting(true);

    try {
      // First verify OTP / authenticate session via verify-otp
      const verifyRes = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: unauthEmail, otp: unauthOtp })
      });
      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success && verifyData.token) {
        // Now invoke account deletion with authorization token
        const delRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/account`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${verifyData.token}`
          },
          body: JSON.stringify({ otp: unauthOtp })
        });
        const delData = await delRes.json();

        if (delRes.ok && delData.success) {
          setSuccessMessage('Your account has been deleted successfully.');
          setTimeout(async () => {
            await logout();
            router.push('/');
          }, 1500);
        } else {
          setErrorMessage(delData.message || 'Account deletion failed.');
        }
      } else {
        setErrorMessage(verifyData.message || 'Invalid or expired 6-digit OTP code.');
      }
    } catch (err) {
      setErrorMessage('Verification error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-dark-900 text-gray-200 flex items-center justify-center">
      
      {/* Background Ambient Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors bg-dark-800 px-4 py-2 rounded-full border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to SPY Salon</span>
          </Link>
        </div>

        {/* Header & Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="w-20 h-20 rounded-full bg-white p-1 border-2 border-red-500/40 flex items-center justify-center shadow-glow-rosegold mx-auto overflow-hidden animate-float">
            <img src="/logo-icon.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
          </div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Public Account Deletion</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-white">Delete Account</h1>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            If you want to delete your SPY Salon account, you can initiate the account deletion process here.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl border border-red-500/30 bg-dark-850/90"
        >
          
          {/* Notifications */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2.5 animate-fadeIn font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/40 text-green-200 text-xs flex items-center space-x-2.5 animate-fadeIn font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SCENARIO 1: User is logged in as Customer */}
          {user && user.role === 'customer' && (
            <form onSubmit={handleAuthenticatedDeletion} className="space-y-4">
              <div className="p-4 rounded-2xl bg-dark-900 border border-white/10 text-xs space-y-2 text-left">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Logged in as:</span>
                  <span className="font-bold text-white">{user.name}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Email:</span>
                  <span className="font-mono text-rosegold-300">{user.email}</span>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs uppercase font-bold block text-gray-300">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-900 border border-white/20 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !password}
                className="w-full py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Deleting Account...' : 'Permanently Delete Account'}
              </button>
            </form>
          )}

          {/* SCENARIO 2: User is logged in as Staff or Admin */}
          {user && user.role !== 'customer' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3 text-left">
              <div className="flex items-center space-x-2 font-bold text-amber-300">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Customer Self-Service Only</span>
              </div>
              <p className="leading-relaxed">
                Self-service account deletion is restricted to Customer accounts. Staff, Stylist, Receptionist, and Admin accounts must be managed directly by System Administrators.
              </p>
            </div>
          )}

          {/* SCENARIO 3: User is NOT logged in */}
          {!user && (
            <div className="space-y-5 text-left">
              <div className="p-4 rounded-2xl bg-dark-900 border border-white/10 text-xs space-y-3">
                <span className="font-bold text-white block">Option 1: Sign In to Delete</span>
                <p className="text-gray-400">
                  If you have active credentials, sign in to confirm account deletion securely from your Customer Dashboard.
                </p>
                <Link
                  href="/login?redirect=/delete-account"
                  className="block text-center py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-md"
                >
                  Sign In to Continue →
                </Link>
              </div>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-dark-850 px-3 text-[10px] uppercase font-bold text-gray-400 shrink-0">OR VERIFY BY EMAIL</span>
                <div className="border-t border-white/10 w-full" />
              </div>

              {!isOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold block text-gray-300">Registered Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={unauthEmail}
                        onChange={(e) => setUnauthEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/20 text-white text-xs focus:outline-none focus:border-rosegold-400"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-full bg-dark-800 hover:bg-dark-750 text-rosegold-300 font-bold text-xs border border-rosegold-500/30 cursor-pointer"
                  >
                    {isSubmitting ? 'Sending Verification Code...' : 'Send Deletion Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleUnauthenticatedDeletion} className="space-y-3">
                  <div className="p-3 rounded-xl bg-rosegold-500/10 border border-rosegold-500/30 text-xs text-rosegold-300">
                    Verification code sent to <strong className="text-white">{unauthEmail}</strong>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase font-bold block text-gray-300">Enter 6-Digit OTP Code *</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-rosegold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={unauthOtp}
                        onChange={(e) => setUnauthOtp(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/20 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || unauthOtp.length < 6}
                    className="w-full py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Verifying & Deleting...' : 'Confirm Account Deletion'}
                  </button>
                </form>
              )}
            </div>
          )}

        </motion.div>

      </div>
    </div>
  );
}
