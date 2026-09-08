'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

export type AnimationType =
  | 'fadeIn'
  | 'blurIn'
  | 'blurInUp'
  | 'blurInDown'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleUp'
  | 'scaleDown';

export interface TextAnimateProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variants?: Variants;
  as?: React.ElementType;
  startOnView?: boolean;
  once?: boolean;
  by?: 'text' | 'word' | 'character' | 'line';
  animation?: AnimationType;
  segmentClassName?: string;
}

const defaultAnimationVariants: Record<AnimationType, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.3 } },
  },
  blurIn: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    show: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.4 } },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: 'blur(10px)', y: 20 },
    show: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  },
  blurInDown: {
    hidden: { opacity: 0, filter: 'blur(10px)', y: -20 },
    show: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  },
  scaleDown: {
    hidden: { opacity: 0, scale: 1.2 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  },
};

export function TextAnimate({
  children,
  className,
  delay = 0,
  duration,
  variants,
  as: Component = 'span',
  startOnView = true,
  once = false,
  by = 'character',
  animation = 'blurInUp',
  segmentClassName,
}: TextAnimateProps) {
  const textString = typeof children === 'string' ? children : String(children || '');

  let segments: string[] = [];
  if (by === 'character') {
    segments = Array.from(textString);
  } else if (by === 'word') {
    segments = textString.split(' ');
  } else if (by === 'line') {
    segments = textString.split('\n');
  } else {
    segments = [textString];
  }

  const selectedVariants = variants || defaultAnimationVariants[animation] || defaultAnimationVariants.blurInUp;

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: duration ? duration / (segments.length || 1) : by === 'character' ? 0.03 : 0.08,
        delayChildren: delay,
      },
    },
  };

  const MotionComponent = motion(Component as any);

  return (
    <MotionComponent
      variants={containerVariants}
      initial="hidden"
      whileInView={startOnView ? 'show' : undefined}
      animate={startOnView ? undefined : 'show'}
      viewport={{ once }}
      className={cn('inline-flex flex-wrap items-center justify-center', className)}
    >
      {segments.map((segment, index) => {
        if (by === 'character' && segment === ' ') {
          return (
            <span key={index} className="inline-block w-[0.25em]">
              &nbsp;
            </span>
          );
        }

        return (
          <motion.span
            key={index}
            variants={selectedVariants}
            className={cn(
              'inline-block whitespace-pre',
              by === 'word' && index < segments.length - 1 ? 'mr-[0.25em]' : '',
              segmentClassName
            )}
          >
            {segment}
          </motion.span>
        );
      })}
    </MotionComponent>
  );
}

export default TextAnimate;
