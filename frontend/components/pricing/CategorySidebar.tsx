'use client';

import React from 'react';
import { ChevronRight, ChevronDown, Sparkles } from 'lucide-react';

export interface CategoryItemData {
  id: string;
  name: string;
  gender: 'all' | 'men' | 'women' | 'kids';
  subCategory?: string;
  icon?: string;
  count: number;
}

export interface GenderCategoryGroup {
  id: 'men' | 'women' | 'kids';
  title: string;
  icon: string;
  subcategories: {
    name: string;
    slug: string;
    count: number;
  }[];
}

interface CategorySidebarProps {
  activeGender: 'all' | 'men' | 'women' | 'kids';
  activeSubcategory: string;
  onSelectCategory: (gender: 'all' | 'men' | 'women' | 'kids', subcategory?: string) => void;
  genderGroups: GenderCategoryGroup[];
  totalServiceCount: number;
}

export default function CategorySidebar({
  activeGender,
  activeSubcategory,
  onSelectCategory,
  genderGroups,
  totalServiceCount
}: CategorySidebarProps) {
  return (
    <div className="w-full lg:w-[280px] shrink-0 space-y-4 text-left">
      <div className="glass-card p-5 rounded-3xl border border-rosegold-500/30 shadow-2xl space-y-4 max-h-[calc(100vh-110px)] overflow-y-auto custom-scrollbar">
        
        {/* SIDEBAR TITLE */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-rosegold-400 animate-pulse" />
            <h2 className="text-lg font-serif font-bold text-white tracking-wide">Categories</h2>
          </div>
          <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-dark-800 text-rosegold-400 border border-rosegold-500/30 shadow-sm">
            {totalServiceCount} Total
          </span>
        </div>

        {/* ALL CATEGORIES OPTION */}
        <button
          type="button"
          onClick={() => onSelectCategory('all', '')}
          className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all duration-300 cursor-pointer ${
            activeGender === 'all' && !activeSubcategory
              ? 'rosegold-gradient-bg !text-white shadow-glow-rosegold scale-[1.02] font-extrabold'
              : 'bg-dark-800 text-gray-300 border border-white/10 hover:border-rosegold-500/50 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <span className="text-base">✨</span>
            <span className={activeGender === 'all' && !activeSubcategory ? '!text-white font-extrabold' : ''}>
              All Categories
            </span>
          </div>

          {/* ACTIVE vs INACTIVE COUNT BADGE (HIGH CONTRAST BOLD WHITE ON DARK BADGE) */}
          <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-extrabold transition-all shadow-sm ${
            activeGender === 'all' && !activeSubcategory
              ? 'category-active-count-badge'
              : 'bg-dark-900/90 text-gray-300 dark:text-gray-200 border border-white/10'
          }`}>
            {totalServiceCount}
          </span>
        </button>

        {/* GENDER CATEGORY GROUPS WITH EXPANDABLE SUBCATEGORIES */}
        <div className="space-y-3 pt-1">
          {genderGroups.map((group) => {
            const isGenderActive = activeGender === group.id;

            return (
              <div key={group.id} className="space-y-1.5">
                {/* GENDER MAIN CATEGORY HEADER BUTTON */}
                <button
                  type="button"
                  onClick={() => onSelectCategory(group.id, '')}
                  className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all duration-300 cursor-pointer ${
                    isGenderActive && !activeSubcategory
                      ? 'rosegold-gradient-bg !text-white shadow-glow-rosegold scale-[1.02] font-extrabold'
                      : isGenderActive
                      ? 'bg-dark-800 text-rosegold-300 border border-rosegold-500/60 shadow-lg'
                      : 'bg-dark-800/80 text-gray-300 border border-white/10 hover:border-rosegold-500/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">{group.icon}</span>
                    <span className={isGenderActive && !activeSubcategory ? '!text-white font-extrabold' : ''}>
                      {group.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* GENDER GROUP COUNT BADGE (HIGH CONTRAST ON ACTIVE BUTTON) */}
                    <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-extrabold transition-all shadow-sm ${
                      isGenderActive && !activeSubcategory
                        ? 'category-active-count-badge'
                        : 'bg-dark-900/90 text-gray-300 dark:text-gray-200 border border-white/10'
                    }`}>
                      {group.subcategories.reduce((acc, s) => acc + s.count, 0)}
                    </span>

                    {isGenderActive ? (
                      <ChevronDown className={`w-4 h-4 ${isGenderActive && !activeSubcategory ? '!text-white' : 'text-rosegold-400'}`} />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* SUBCATEGORY ACCORDION LIST */}
                {isGenderActive && (
                  <div className="pl-3 space-y-1 border-l-2 border-rosegold-500/30 my-1 animate-fadeIn">
                    {group.subcategories.map((sub) => {
                      const isSubActive = activeSubcategory.toLowerCase() === sub.slug.toLowerCase();

                      return (
                        <button
                          key={sub.slug}
                          type="button"
                          onClick={() => onSelectCategory(group.id, sub.slug)}
                          className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            isSubActive
                              ? 'bg-rosegold-500/20 text-rosegold-300 border border-rosegold-500/50 shadow-md font-bold'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-rosegold-400 animate-ping' : 'bg-gray-600'}`} />
                            <span>{sub.name}</span>
                          </div>
                          
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold transition-all ${
                            isSubActive
                              ? 'bg-rosegold-500 text-dark-900 font-extrabold shadow-sm'
                              : 'bg-dark-900/60 text-gray-400 border border-white/5'
                          }`}>
                            {sub.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
