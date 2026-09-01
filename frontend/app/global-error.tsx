'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl bg-gray-900 border border-amber-500/20 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 text-2xl font-bold">
            !
          </div>
          <h2 className="text-2xl font-bold text-gray-100">Application Error</h2>
          <p className="text-sm text-gray-400">
            {error?.message || 'A critical error occurred. Please try refreshing.'}
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 px-6 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition duration-200"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
