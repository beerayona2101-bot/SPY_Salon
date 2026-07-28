'use client';

import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  totalResultsCount?: number;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Search categories, services, keratin, facials, beard, pricing...',
  totalResultsCount
}: SearchBarProps) {
  return (
    <div className="relative max-w-2xl mx-auto w-full">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-rosegold-400 absolute left-4 pointer-events-none" />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-24 py-3.5 rounded-full bg-dark-850 border border-rosegold-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-rosegold-400 transition-all shadow-2xl placeholder:text-gray-500 font-sans"
        />

        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 px-3 py-1 rounded-full bg-dark-800 text-gray-300 hover:text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <span>Clear</span>
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          totalResultsCount !== undefined && (
            <span className="absolute right-4 text-[11px] font-mono text-rosegold-400 bg-rosegold-500/10 px-2.5 py-0.5 rounded-full border border-rosegold-500/20">
              {totalResultsCount} Results
            </span>
          )
        )}
      </div>
    </div>
  );
}
