'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

interface AnimatedThemeTogglerProps {
  theme?: 'dark' | 'light';
  onThemeChange?: (newTheme: 'dark' | 'light') => void;
  className?: string;
}

export function AnimatedThemeToggler({
  theme = 'dark',
  onThemeChange,
  className = ''
}: AnimatedThemeTogglerProps) {
  const isDark = theme === 'dark';

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = isDark ? 'light' : 'dark';

    // Support browser View Transitions API for stunning radial expand animation if available
    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const x = e.clientX;
      const y = e.clientY;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        onThemeChange?.(nextTheme);
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ];
        document.documentElement.animate(
          {
            clipPath: isDark ? clipPath.reverse() : clipPath
          },
          {
            duration: 450,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: isDark
              ? '::view-transition-old(root)'
              : '::view-transition-new(root)'
          }
        );
      });
    } else {
      onThemeChange?.(nextTheme);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      onClick={handleToggle}
      aria-label="Toggle visual theme"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`p-2 rounded-full border transition-colors cursor-pointer relative overflow-hidden flex items-center justify-center ${
        isDark
          ? 'bg-dark-800 border-white/10 text-amber-400 hover:border-amber-400/40 hover:bg-dark-750'
          : 'bg-white border-amber-900/20 text-purple-600 hover:border-purple-400/40 hover:bg-amber-50'
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -16, opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          exit={{ y: 16, opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          ) : (
            <Moon className="w-4 h-4 text-purple-600 drop-shadow-[0_0_8px_rgba(147,51,234,0.4)]" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

export default AnimatedThemeToggler;
