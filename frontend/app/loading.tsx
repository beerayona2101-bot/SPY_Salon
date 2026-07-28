import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center px-4">
      <div className="relative flex flex-col items-center justify-center space-y-6">
        {/* Glowing Salon Spinner Logo Frame */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-rosegold-500/20 border-t-rosegold-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-amber-500/20 border-b-amber-500 animate-spin [animation-duration:1.5s]" />
          <span className="font-serif text-xl font-bold rosegold-gradient-text tracking-widest">
            SPY
          </span>
        </div>

        {/* Shimmer pulse text */}
        <div className="flex flex-col items-center space-y-2">
          <h2 className="font-serif text-lg text-gray-200 tracking-wide animate-pulse">
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
