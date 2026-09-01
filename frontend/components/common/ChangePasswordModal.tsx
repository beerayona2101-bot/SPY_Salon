'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { validateForm, validatePassword, validateConfirmPassword } from '@/lib/validation';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: string;
}

export default function ChangePasswordModal({ isOpen, onClose, userName, userRole }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setMsg(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const { isValid, errors } = validateForm(
      { newPassword, confirmPassword },
      {
        newPassword: [validatePassword(6)],
        confirmPassword: [validateConfirmPassword('newPassword')]
      }
    );

    if (!isValid) {
      const firstErr = Object.values(errors)[0];
      setMsg({ type: 'error', text: firstErr || 'Please check your passwords.' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Try /profile/change-password first, fallback to /auth/change-password
      let res = await apiFetch('/profile/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      let data = await res.json();

      if (!res.ok || !data.success) {
        res = await apiFetch('/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword })
        });
        data = await res.json();
      }

      if (res.ok && data.success) {
        setMsg({ type: 'success', text: data.message || 'Password updated successfully!' });
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          handleClose();
        }, 1800);
      } else {
        setMsg({ type: 'error', text: data.message || 'Password update failed. Please try again.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Network connection error. Please ensure backend is active.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md glass-card rounded-3xl border border-rosegold-500/40 bg-dark-900/95 p-6 sm:p-7 space-y-5 text-left shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rosegold-500/15 border border-rosegold-500/30 flex items-center justify-center text-rosegold-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white leading-tight">Account Password Settings</h3>
              <p className="text-[11px] text-gray-400">
                {userName ? `${userName} • ` : ''}{userRole ? `${userRole}` : 'Security Credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-dark-800 text-gray-400 hover:text-white border border-white/10 hover:border-rosegold-500/30 transition-all cursor-pointer"
            title="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Banner */}
        {msg && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-start space-x-2.5 border ${
            msg.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-gray-300 font-bold block mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full p-3 pr-10 rounded-xl bg-dark-850 border border-white/15 text-white placeholder-gray-500 focus:border-rosegold-400 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-gray-300 font-bold block mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPw ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full p-3 pr-10 rounded-xl bg-dark-850 border border-white/15 text-white placeholder-gray-500 focus:border-rosegold-400 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 font-bold text-xs cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Updating...' : 'Update Password →'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
