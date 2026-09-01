'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    console.error('App Segment Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center bg-dark-950 text-white">
      <div className="max-w-md p-8 rounded-2xl bg-dark-900 border border-gold-500/20 shadow-2xl space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 text-2xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-gray-100">Something went wrong</h2>
        <p className="text-sm text-gray-400">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <button
          onClick={() => reset()}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-dark-950 font-semibold hover:opacity-90 transition duration-200"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
