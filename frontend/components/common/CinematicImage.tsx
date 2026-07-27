'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CinematicImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  overlay?: boolean;
  overlayGradient?: string;
  duration?: number;
  priority?: boolean;
}

export default function CinematicImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  overlay = false,
  overlayGradient = 'from-dark-900/80 via-transparent to-transparent',
  duration = 16,
  priority = false
}: CinematicImageProps) {
  return (
    <div className={`relative overflow-hidden isolation-auto ${containerClassName}`}>
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        initial={{ opacity: 0, scale: 1.0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        animate={{
          scale: [1.0, 1.08, 1.0]
        }}
        transition={{
          opacity: { duration: 0.6, ease: 'easeOut' },
          scale: {
            duration: duration,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }
        }}
        style={{
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
        className={`w-full h-full object-cover gpu-accelerated ${className}`}
      />

      {overlay && (
        <div className={`absolute inset-0 bg-gradient-to-t ${overlayGradient} pointer-events-none`} />
      )}
    </div>
  );
}
