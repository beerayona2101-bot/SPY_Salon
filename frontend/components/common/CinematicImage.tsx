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
  fallbackSrc?: string;
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
  const [imgSrc, setImgSrc] = React.useState(src);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setImgSrc(src);
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  if (!imgSrc || hasError) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-dark-800 via-dark-900 to-black flex items-center justify-center p-4 border border-rosegold-500/20 ${containerClassName} ${className}`}>
        <div className="text-center space-y-1.5 opacity-80">
          <div className="w-10 h-10 rounded-full bg-rosegold-500/10 border border-rosegold-500/30 flex items-center justify-center mx-auto text-rosegold-400 font-serif font-bold text-sm">
            {alt ? alt.slice(0, 2).toUpperCase() : 'SPY'}
          </div>
          <span className="text-[11px] font-serif font-bold text-rosegold-300 block line-clamp-1">{alt || 'SPY Salon'}</span>
        </div>
        {overlay && (
          <div className={`absolute inset-0 bg-gradient-to-t ${overlayGradient} pointer-events-none`} />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden isolation-auto ${containerClassName}`}>
      <img
        src={imgSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
        }}
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
        className={`w-full h-full object-cover transition-all duration-500 ease-out hover:scale-105 ${
          isLoaded ? 'opacity-100' : 'opacity-70 blur-xs'
        } ${className}`}
      />

      {overlay && (
        <div className={`absolute inset-0 bg-gradient-to-t ${overlayGradient} pointer-events-none`} />
      )}
    </div>
  );
});

export default CinematicImage;

