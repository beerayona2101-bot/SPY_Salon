import React from 'react';

export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6 bg-dark-900 min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-dark-700">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-dark-800 rounded-lg" />
          <div className="h-4 w-96 bg-dark-800/60 rounded-md" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-dark-800 rounded-lg" />
          <div className="h-10 w-36 bg-dark-800 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-xl bg-dark-800/50 border border-dark-700/50 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-dark-700 rounded" />
              <div className="h-8 w-8 bg-dark-700 rounded-lg" />
            </div>
            <div className="h-7 w-32 bg-dark-700 rounded" />
            <div className="h-3 w-40 bg-dark-700/50 rounded" />
          </div>
        ))}
      </div>

      {/* Table / Content area skeleton */}
      <div className="p-6 rounded-xl bg-dark-800/40 border border-dark-700/50 space-y-4">
        <div className="h-6 w-48 bg-dark-700 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-12 w-full bg-dark-800/60 rounded-lg flex items-center justify-between px-4">
              <div className="h-4 w-1/4 bg-dark-700 rounded" />
              <div className="h-4 w-1/6 bg-dark-700 rounded" />
              <div className="h-4 w-1/5 bg-dark-700 rounded" />
              <div className="h-6 w-20 bg-dark-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
