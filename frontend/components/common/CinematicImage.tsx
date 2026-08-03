'use client';

import React, { memo } from 'react';

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

const CinematicImage = memo(function CinematicImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  overlay = false,
  overlayGradient = 'from-dark-900/80 via-transparent to-transparent',
  priority = false
}: CinematicImageProps) {
  return (
    <div className={`relative overflow-hidden isolation-auto ${containerClassName}`}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
        className={`w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105 ${className}`}
      />

      {overlay && (
        <div className={`absolute inset-0 bg-gradient-to-t ${overlayGradient} pointer-events-none`} />
      )}
    </div>
  );
});

export default CinematicImage;

