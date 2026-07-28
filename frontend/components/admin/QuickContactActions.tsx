'use client';

import React, { useState } from 'react';
import { Phone, MessageSquare, Mail, MessageCircle, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import contactService, { QuickContactEnquiry, AdminUser } from '@/services/contactService';

interface QuickContactActionsProps {
  enquiry: QuickContactEnquiry;
  adminUser?: AdminUser;
  onStatusUpdate?: (newStatus: string) => void;
  onActivityLog?: (log: any) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function QuickContactActions({
  enquiry,
  adminUser,
  onStatusUpdate,
  onActivityLog,
  size = 'md',
  showLabel = true
}: QuickContactActionsProps) {
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const showToast = (type: 'error' | 'success', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const options = {
    onStatusUpdate,
    onActivityLog,
    onError: (err: string) => showToast('error', err || 'Unable to open application.')
  };

  const buttonSizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base'
  }[size];

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];

  const hasPhone = Boolean(enquiry.phone && enquiry.phone.replace(/[^0-9]/g, '').length >= 10);
  const hasEmail = Boolean(enquiry.email && enquiry.email.trim());
  const hasMessenger = Boolean(enquiry.messengerUrl && enquiry.messengerUrl.trim());

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider block">
            Quick Contact Actions
          </span>
          {enquiry.status === 'New' && (
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Auto-updates status to Contacted
            </span>
          )}
        </div>
      )}

      {/* Toast Alert Notification Banner */}
      {toast && (
        <div
          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Action Buttons Grid */}
      <div className="flex items-center space-x-2.5">
        
        {/* 1. Phone Call */}
        <div className="relative group">
          <button
            type="button"
            aria-label={`Call customer ${enquiry.name}`}
            disabled={!hasPhone}
            onClick={async () => {
              const res = await contactService.openPhone(enquiry, adminUser, options);
              if (res.success && res.statusUpdated) {
                showToast('success', 'Status updated to Contacted!');
              }
            }}
            className={`${buttonSizeClasses} rounded-full bg-dark-800 border border-white/15 text-gray-300 transition-all duration-300 flex items-center justify-center cursor-pointer ${
              hasPhone
                ? 'hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-110 active:scale-95'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <Phone className={iconSizeClasses} />
          </button>

          {/* Hover Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-dark-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl z-20">
            {hasPhone ? 'Call Customer' : 'Phone unavailable'}
          </div>
        </div>

        {/* 2. WhatsApp */}
        <div className="relative group">
          <button
            type="button"
            aria-label={`Chat on WhatsApp with ${enquiry.name}`}
            disabled={!hasPhone}
            onClick={async () => {
              const res = await contactService.openWhatsApp(enquiry, adminUser, options);
              if (res.success && res.statusUpdated) {
                showToast('success', 'Status updated to Contacted!');
              }
            }}
            className={`${buttonSizeClasses} rounded-full bg-dark-800 border border-white/15 text-gray-300 transition-all duration-300 flex items-center justify-center cursor-pointer ${
              hasPhone
                ? 'hover:bg-green-500/20 hover:border-green-500 hover:text-green-400 hover:shadow-lg hover:shadow-green-500/20 hover:scale-110 active:scale-95'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <MessageSquare className={iconSizeClasses} />
          </button>

          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-dark-900 border border-green-500/40 text-green-300 text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl z-20">
            {hasPhone ? 'Chat on WhatsApp' : 'WhatsApp unavailable'}
          </div>
        </div>

        {/* 3. Email */}
        <div className="relative group">
          <button
            type="button"
            aria-label={`Send Email to ${enquiry.name}`}
            disabled={!hasEmail}
            onClick={async () => {
              const res = await contactService.openEmail(enquiry, adminUser, options);
              if (res.success && res.statusUpdated) {
                showToast('success', 'Status updated to Contacted!');
              }
            }}
            className={`${buttonSizeClasses} rounded-full bg-dark-800 border border-white/15 text-gray-300 transition-all duration-300 flex items-center justify-center cursor-pointer ${
              hasEmail
                ? 'hover:bg-sky-500/20 hover:border-sky-500 hover:text-sky-400 hover:shadow-lg hover:shadow-sky-500/20 hover:scale-110 active:scale-95'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <Mail className={iconSizeClasses} />
          </button>

          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-dark-900 border border-sky-500/40 text-sky-300 text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl z-20">
            {hasEmail ? 'Send Email' : 'Email unavailable'}
          </div>
        </div>

        {/* 4. SMS */}
        <div className="relative group">
          <button
            type="button"
            aria-label={`Send SMS to ${enquiry.name}`}
            disabled={!hasPhone}
            onClick={async () => {
              const res = await contactService.openSMS(enquiry, adminUser, options);
              if (res.success && res.statusUpdated) {
                showToast('success', 'Status updated to Contacted!');
              }
            }}
            className={`${buttonSizeClasses} rounded-full bg-dark-800 border border-white/15 text-gray-300 transition-all duration-300 flex items-center justify-center cursor-pointer ${
              hasPhone
                ? 'hover:bg-amber-500/20 hover:border-amber-500 hover:text-amber-400 hover:shadow-lg hover:shadow-amber-500/20 hover:scale-110 active:scale-95'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <Send className={iconSizeClasses} />
          </button>

          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-dark-900 border border-amber-500/40 text-amber-300 text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl z-20">
            {hasPhone ? 'Send SMS' : 'SMS unavailable'}
          </div>
        </div>

        {/* 5. Messenger */}
        <div className="relative group">
          <button
            type="button"
            aria-label={`Open Messenger for ${enquiry.name}`}
            disabled={!hasMessenger}
            onClick={async () => {
              const res = await contactService.openMessenger(enquiry, adminUser, options);
              if (res.success && res.statusUpdated) {
                showToast('success', 'Status updated to Contacted!');
              }
            }}
            className={`${buttonSizeClasses} rounded-full bg-dark-800 border border-white/15 text-gray-300 transition-all duration-300 flex items-center justify-center cursor-pointer ${
              hasMessenger
                ? 'hover:bg-blue-600/20 hover:border-blue-500 hover:text-blue-400 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-110 active:scale-95'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <MessageCircle className={iconSizeClasses} />
          </button>

          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-dark-900 border border-blue-500/40 text-blue-300 text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl z-20">
            {hasMessenger ? 'Open Messenger' : 'Messenger not available'}
          </div>
        </div>

      </div>
    </div>
  );
}
