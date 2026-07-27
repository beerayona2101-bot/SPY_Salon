import React from 'react';

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-3xl glass-card border border-white/10 animate-pulse space-y-4">
      <div className="h-40 rounded-2xl bg-dark-800/80 w-full" />
      <div className="space-y-2">
        <div className="h-5 bg-dark-800/80 rounded-md w-3/4" />
        <div className="h-3 bg-dark-800/60 rounded-md w-full" />
        <div className="h-3 bg-dark-800/60 rounded-md w-2/3" />
      </div>
      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <div className="h-6 bg-dark-800/80 rounded-md w-1/3" />
        <div className="h-8 bg-dark-800/80 rounded-full w-24" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="p-3.5"><div className="h-4 bg-dark-800 rounded w-32" /></td>
      <td className="p-3.5"><div className="h-4 bg-dark-800 rounded w-20" /></td>
      <td className="p-3.5"><div className="h-4 bg-dark-800 rounded w-16 ml-auto" /></td>
      <td className="p-3.5"><div className="h-4 bg-dark-800 rounded w-16 ml-auto" /></td>
      <td className="p-3.5"><div className="h-6 bg-dark-800 rounded-full w-16 mx-auto" /></td>
    </tr>
  );
}
