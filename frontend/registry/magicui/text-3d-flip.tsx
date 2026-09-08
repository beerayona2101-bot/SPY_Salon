'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Text3DFlipProps {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  flipTextClassName?: string;
  rotateDirection?: 'top' | 'bottom' | 'left' | 'right';
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | number;
  initialDelay?: number;
}

export default function Text3DFlip({
  children,
  className,
  textClassName,
  flipTextClassName,
  rotateDirection = 'top',
  staggerDuration = 0.09,
  staggerFrom = 'center',
  initialDelay = 0,
}: Text3DFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const textString = typeof children === 'string' ? children : String(children || '');
  const characters = Array.from(textString);
  const total = characters.length;

  const getDelay = (index: number): number => {
    if (staggerFrom === 'center') {
      const center = (total - 1) / 2;
      return initialDelay + Math.abs(index - center) * staggerDuration;
    }
    if (staggerFrom === 'last') {
      return initialDelay + (total - 1 - index) * staggerDuration;
    }
    if (typeof staggerFrom === 'number') {
      return initialDelay + Math.abs(index - staggerFrom) * staggerDuration;
    }
    // Default 'first'
    return initialDelay + index * staggerDuration;
  };

  // Determine 3D rotations based on direction
  const getVariants = (index: number) => {
    const delay = getDelay(index);

    let initialFront = { rotateX: 0, rotateY: 0, opacity: 1, y: '0%' };
    let animateFront = { rotateX: -90, rotateY: 0, opacity: 0, y: '-100%' };
    let initialBack = { rotateX: 90, rotateY: 0, opacity: 0, y: '100%' };
    let animateBack = { rotateX: 0, rotateY: 0, opacity: 1, y: '0%' };

    if (rotateDirection === 'bottom') {
      animateFront = { rotateX: 90, rotateY: 0, opacity: 0, y: '100%' };
      initialBack = { rotateX: -90, rotateY: 0, opacity: 0, y: '-100%' };
    } else if (rotateDirection === 'left') {
      animateFront = { rotateX: 0, rotateY: -90, opacity: 0, y: '0%' };
      initialBack = { rotateX: 0, rotateY: 90, opacity: 0, y: '0%' };
    } else if (rotateDirection === 'right') {
      animateFront = { rotateX: 0, rotateY: 90, opacity: 0, y: '0%' };
      initialBack = { rotateX: 0, rotateY: -90, opacity: 0, y: '0%' };
    }

    return {
      front: {
        initial: initialFront,
        animate: isFlipped ? animateFront : initialFront,
        transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
      },
      back: {
        initial: initialBack,
        animate: isFlipped ? animateBack : initialBack,
        transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
      },
    };
  };

  return (
    <div
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped((prev) => !prev)}
      className={cn(
        'relative inline-flex flex-wrap items-center justify-center cursor-pointer select-none py-1',
        className
      )}
      style={{ perspective: '1200px' }}
    >
      {characters.map((char, index) => {
        const variants = getVariants(index);
        const isSpace = char === ' ';

        if (isSpace) {
          return (
            <span key={index} className="inline-block w-[0.3em]">
              &nbsp;
            </span>
          );
        }

        return (
          <span
            key={index}
            className="relative inline-block overflow-hidden"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front text face */}
            <motion.span
              initial={variants.front.initial}
              animate={variants.front.animate}
              transition={variants.front.transition}
              className={cn('inline-block leading-none', textClassName)}
            >
              {char}
            </motion.span>

            {/* Back / Flipped text face */}
            <motion.span
              initial={variants.back.initial}
              animate={variants.back.animate}
              transition={variants.back.transition}
              className={cn(
                'absolute inset-0 inline-block leading-none',
                flipTextClassName || textClassName
              )}
            >
              {char}
            </motion.span>
          </span>
        );
      })}
    </div>
  );
}

export { Text3DFlip };
