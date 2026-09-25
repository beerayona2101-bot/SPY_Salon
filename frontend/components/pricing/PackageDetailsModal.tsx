'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Sparkles, CheckCircle2, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { PackageTier } from './PackageCard';

interface PackageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: PackageTier | null;
  serviceName?: string;
  onEnquireClick?: (pkg: PackageTier) => void;
  isSelected?: boolean;
}

export default function PackageDetailsModal({
  isOpen,
  onClose,
  packageData,
  serviceName = '',
  onEnquireClick,
  isSelected = false
}: PackageDetailsModalProps) {
  // Prevent background page from scrolling while popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!packageData) return null;

  const { name, price, duration, description, badge, features, isPopular } = packageData;

  const bookUrl = `/book?serviceId=${encodeURIComponent(packageData.id)}&service=${encodeURIComponent(serviceName)}&package=${encodeURIComponent(name)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop Blur & Fade Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Centered Modal Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-[calc(100%-32px)] sm:w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl bg-[#141012] border-2 ${
              isPopular ? 'border-rosegold-400 shadow-glow-rosegold' : 'border-rosegold-500/40 shadow-2xl'
            } overflow-hidden z-10 text-left`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="package-modal-title"
          >
            {/* 1. MODAL HEADER (Sticky Top) */}
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-white/10 bg-dark-900/90 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {badge && (
                  <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full rosegold-gradient-bg !text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{badge}</span>
                  </div>
                )}

                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-dark-800 border border-rosegold-500/40 text-gray-300 text-xs font-mono font-bold shrink-0">
                  <Clock className="w-3.5 h-3.5 text-rosegold-400 shrink-0" />
                  <span>{duration}</span>
                </div>

                {isSelected && (
                  <div className="px-2.5 py-0.5 rounded-full bg-rosegold-500/20 text-rosegold-300 text-[10px] font-bold border border-rosegold-500/40 uppercase tracking-wider shrink-0">
                    Currently Selected
                  </div>
                )}
              </div>

              {/* Close Button (X) */}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close package details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. MODAL BODY (Scrollable Content) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              
              {/* Service Context & Package Name */}
              <div className="space-y-1">
                {serviceName && (
                  <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-rosegold-400 block">
                    {serviceName} Treatment Package
                  </span>
                )}
                <h2
                  id="package-modal-title"
                  className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide leading-tight"
                >
                  {name}
                </h2>
              </div>

              {/* Price & Investment Display Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-850 border border-white/10 flex items-center justify-between gap-4 shadow-inner">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider block">
                    Package Investment
                  </span>
                  <div className="text-3xl sm:text-4xl font-serif font-extrabold text-rosegold-400 leading-tight">
                    ₹{price.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">
                    Estimated Time
                  </span>
                  <span className="text-sm font-bold text-gray-200 font-mono">
                    {duration}
                  </span>
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider block">
                  Package Overview
                </span>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed font-sans">
                  {description}
                </p>
              </div>

              {/* Features & Inclusions List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rosegold-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" />
                    <span>Included Services & Features ({features.length})</span>
                  </h4>
                  <span className="text-[10px] text-gray-400">All-Inclusive</span>
                </div>

                <div className="space-y-2.5 bg-dark-900/80 p-4 rounded-2xl border border-white/5">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs sm:text-sm">
                      <div className="w-5 h-5 rounded-full bg-rosegold-500/20 border border-rosegold-500/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-rosegold-400" />
                      </div>
                      <span className="text-gray-200 font-sans leading-relaxed flex-1 break-words">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantee Ribbon */}
              <div className="p-3.5 rounded-xl bg-rosegold-500/10 border border-rosegold-500/20 flex items-center space-x-3 text-xs text-gray-300">
                <ShieldCheck className="w-5 h-5 text-rosegold-400 shrink-0" />
                <p className="text-[11px] text-gray-300 leading-snug">
                  Includes 100% single-use sanitized items & certified senior master stylists guarantee.
                </p>
              </div>

            </div>

            {/* 3. MODAL FOOTER (Sticky Bottom CTA) */}
            <div className="p-5 sm:p-6 border-t border-white/10 bg-dark-900/95 flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                href={bookUrl}
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-full rosegold-gradient-bg !text-white font-serif font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-rosegold-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center group"
              >
                <span>Choose Package & Book Now</span>
                <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>

              {onEnquireClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEnquireClick(packageData);
                  }}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-full bg-dark-800 border border-white/15 hover:border-rosegold-400 text-gray-300 hover:text-white font-bold text-xs transition-all cursor-pointer whitespace-nowrap text-center"
                >
                  Inquire Package
                </button>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
