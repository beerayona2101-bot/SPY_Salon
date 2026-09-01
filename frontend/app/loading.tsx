'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Loading() {
  const shapes = [
    { id: 1, size: 'w-8 h-8', color: 'border-rosegold-400/60 bg-rosegold-500/10' },
    { id: 2, size: 'w-6 h-6', color: 'border-amber-400/60 bg-amber-500/10' },
    { id: 3, size: 'w-5 h-5', color: 'border-purple-400/60 bg-purple-500/10' },
    { id: 4, size: 'w-10 h-10', color: 'border-rosegold-300/50 bg-rosegold-400/10' },
    { id: 5, size: 'w-7 h-7', color: 'border-green-400/50 bg-green-500/10' },
    { id: 6, size: 'w-6 h-6', color: 'border-rosegold-500/70 bg-rosegold-500/20' },
    { id: 7, size: 'w-5 h-5', color: 'border-yellow-400/60 bg-yellow-500/10' },
    { id: 8, size: 'w-9 h-9', color: 'border-purple-300/60 bg-purple-400/10' },
  ];

  return (
    <div className="w-full min-h-[75vh] bg-dark-900/98 backdrop-blur-xl flex flex-col justify-center items-center px-4 py-12 select-none relative">
      
      {/* Background Floating Blending .shape Elements */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {shapes.map((shape, i) => {
          const randomX = (i % 2 === 0 ? 1 : -1) * (60 + (i * 12) % 80); // random(-100, 100)
          const randomY = (i % 3 === 0 ? -1 : 1) * (50 + (i * 15) % 90); // random(-100, 100)
          const randomRotate = (i % 2 === 0 ? 180 : -180) + (i * 45); // random(-180, 180)
          const randomDuration = 0.5 + (i % 5) * 0.1; // random(500, 1000)ms

          return (
            <motion.div
              key={shape.id}
              className={`shape absolute ${shape.size} ${shape.color} border rounded-xl shadow-lg mix-blend-screen`}
              animate={{
                x: [0, randomX, -randomX, 0],
                y: [0, randomY, -randomY, 0],
                rotate: [0, randomRotate, -randomRotate, 0],
                scale: [1, 1.25, 0.85, 1],
                opacity: [0.3, 0.85, 0.4, 0.3],
              }}
              transition={{
                duration: randomDuration * 2.5,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: [0.87, 0, 0.13, 1], // inOutExpo blend animation
              }}
            />
          );
        })}
      </div>

      {/* Main Loading Logo & Text Container */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        {/* Glowing Salon Spinner Logo Frame with Rotating Square */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <motion.div
            className="square absolute -inset-3 rounded-[2.2rem] border-2 border-rosegold-500/70 shadow-glow-rosegold pointer-events-none"
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: [0.87, 0, 0.13, 1], // inOutExpo easing curve
              repeatDelay: 0.1
            }}
          />
          <div className="w-24 h-24 rounded-full bg-white p-1 border-2 border-rosegold-500/60 flex items-center justify-center shadow-glow-rosegold overflow-hidden z-10">
            <img src="/logo-icon.png" alt="SPY Salon Logo" className="w-full h-full object-contain rounded-full" />
          </div>
        </div>

        {/* Shimmer pulse text */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <h2 className="font-serif text-lg text-gray-200 tracking-wider animate-pulse">
            Loading SPY Salon Experience...
          </h2>
          <div className="w-48 h-1 bg-dark-800 rounded-full overflow-hidden">
            <div className="w-full h-full rosegold-gradient-bg animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
