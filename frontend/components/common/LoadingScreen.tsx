'use client';

import React, { useEffect, useState } from 'react';
import { Scissors, Sparkles, User, Flower2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(30);
  const { isLoading: isAuthLoading } = useAuth();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let currentProgress = 30;
    
    // Step 1: Initial Mount (30% -> 45%)
    const timer1 = setTimeout(() => {
      currentProgress = 45;
      setProgress(45);
    }, 150);

    // Step 2: System Fonts Ready (45% -> 60%)
    if (typeof document !== 'undefined') {
      document.fonts.ready.then(() => {
        if (currentProgress < 60) {
          currentProgress = 60;
          setProgress(60);
        }
      }).catch(() => {
        if (currentProgress < 60) {
          currentProgress = 60;
          setProgress(60);
        }
      });
    }

    // Step 3: Auth context initialized (50% -> 85%)
    const authTimer = setInterval(() => {
      if (!isAuthLoading) {
        clearInterval(authTimer);
        if (currentProgress < 85) {
          currentProgress = 85;
          setProgress(85);
        }
      }
    }, 100);

    // Step 4: Final rendering & cleanup (85% -> 100%)
    const completionTimer = setInterval(() => {
      if (currentProgress >= 85) {
        clearInterval(completionTimer);
        currentProgress = 100;
        setProgress(100);
        
        // Wait at 100% to let user read, then trigger exit transition
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onComplete();
          }, 600); // matches exit motion transition duration
        }, 350);
      }
    }, 200);

    // Safety timeout: 4.5 seconds fallback to prevent infinite loading lock
    const safetyTimer = setTimeout(() => {
      clearInterval(authTimer);
      clearInterval(completionTimer);
      setProgress(100);
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onComplete();
        }, 600);
      }, 350);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearInterval(authTimer);
      clearInterval(completionTimer);
      clearTimeout(safetyTimer);
    };
  }, [isAuthLoading, onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            y: -40, 
            transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] } 
          }}
          className="fixed inset-0 z-[99999] flex flex-col justify-between items-center text-[#4d1526] p-8 sm:p-12 overflow-hidden select-none initial-loader"
        >
          {/* Subtle gold elegant wave curves decorations */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-[#b89047]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#b89047]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Top spacer */}
          <div className="flex-none" />

          {/* Central content container */}
          <div className="flex-grow flex flex-col items-center justify-center max-w-lg w-full text-center initial-loader-content">
            {/* Monogram Brand Logo in Square Rotating Accent Frame */}
            <div className="relative mb-8 flex items-center justify-center">
              {/* Primary Rotating Square (.square class with inOutExpo rotate: 90 loop) */}
              <motion.div
                className="square absolute -inset-3 rounded-[2.2rem] border-2 border-[#b89047]/60 shadow-[0_0_30px_rgba(184,144,71,0.35)] pointer-events-none"
                animate={{ rotate: [0, 90, 180, 270, 360] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: [0.87, 0, 0.13, 1], // inOutExpo easing curve
                  repeatDelay: 0.1
                }}
              />

              {/* Counter Rotating Inner Square */}
              <motion.div
                className="absolute -inset-1 rounded-2xl border border-[#b89047]/30 pointer-events-none"
                animate={{ rotate: [90, 0, -90, -180, -270] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: [0.87, 0, 0.13, 1], // inOutExpo easing curve
                  repeatDelay: 0.1
                }}
              />

              {/* Central Logo Circle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white p-2 border-4 border-[#b89047]/80 shadow-[0_0_35px_rgba(184,144,71,0.45)] flex items-center justify-center overflow-hidden"
              >
                <img 
                  src="/logo.png" 
                  alt="SPY Luxury Unisex Salon Logo" 
                  className="w-full h-full object-contain rounded-full" 
                />
              </motion.div>
            </div>

            {/* Service Pillars Row */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="grid grid-cols-4 gap-2 sm:gap-6 w-full border-t border-[#b89047]/20 pt-8 px-4 initial-loader-pillars"
            >
              <div className="flex flex-col items-center space-y-2 initial-loader-pillar-item">
                <div style={{ width: '40px', height: '40px', borderRadius: '9999px', background: 'rgba(77, 21, 38, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(184, 144, 71, 0.1)', marginBottom: '0.5rem', lineHeight: '40px', textAlign: 'center' }}>
                  <Scissors className="w-4 h-4 text-[#b89047] stroke-[1.5]" />
                </div>
                <span className="initial-loader-pillar-label">Haircut</span>
              </div>
              <div className="flex flex-col items-center space-y-2 initial-loader-pillar-item">
                <div style={{ width: '40px', height: '40px', borderRadius: '9999px', background: 'rgba(77, 21, 38, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(184, 144, 71, 0.1)', marginBottom: '0.5rem', lineHeight: '40px', textAlign: 'center' }}>
                  <Sparkles className="w-4 h-4 text-[#b89047] stroke-[1.5]" />
                </div>
                <span className="initial-loader-pillar-label">Hair Style</span>
              </div>
              <div className="flex flex-col items-center space-y-2 initial-loader-pillar-item">
                <div style={{ width: '40px', height: '40px', borderRadius: '9999px', background: 'rgba(77, 21, 38, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(184, 144, 71, 0.1)', marginBottom: '0.5rem', lineHeight: '40px', textAlign: 'center' }}>
                  <User className="w-4 h-4 text-[#b89047] stroke-[1.5]" />
                </div>
                <span className="initial-loader-pillar-label">Grooming</span>
              </div>
              <div className="flex flex-col items-center space-y-2 initial-loader-pillar-item">
                <div style={{ width: '40px', height: '40px', borderRadius: '9999px', background: 'rgba(77, 21, 38, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(184, 144, 71, 0.1)', marginBottom: '0.5rem', lineHeight: '40px', textAlign: 'center' }}>
                  <Flower2 className="w-4 h-4 text-[#b89047] stroke-[1.5]" />
                </div>
                <span className="initial-loader-pillar-label">Skin & Spa</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom loading progress indicators */}
          <div className="flex-none w-full max-w-sm flex flex-col items-center mt-6 initial-progress-container" style={{ zIndex: 10 }}>
            <span className="text-[10px] font-sans tracking-[0.25em] text-[#4d1526]/80 font-bold uppercase mb-3">
              Preparing Your Experience...
            </span>

            {/* Custom Luxury Gold Progress Bar */}
            <div className="relative w-full h-[3px] bg-[#4d1526]/10 rounded-full overflow-hidden">
              <motion.div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#b89047] via-[#d4af37] to-[#b89047]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            </div>

            {/* Percentage Label */}
            <span className="text-xs font-sans tracking-wider text-[#4d1526] font-semibold mt-2.5">
              {progress}%
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
