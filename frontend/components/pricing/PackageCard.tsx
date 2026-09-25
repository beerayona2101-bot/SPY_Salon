'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, Sparkles, ArrowRight, Eye, Info } from 'lucide-react';
import PackageDetailsModal from './PackageDetailsModal';

export interface PackageTier {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  badge?: string;
  features: string[];
  isPopular?: boolean;
}

interface PackageCardProps {
  packageData: PackageTier;
  serviceName: string;
  onEnquireClick?: (pkg: PackageTier) => void;
  isSelected?: boolean;
  onSelectPackage?: (pkg: PackageTier) => void;
}

export default function PackageCard({
  packageData,
  serviceName,
  onEnquireClick,
  isSelected = false,
  onSelectPackage
}: PackageCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { name, price, duration, description, badge, features, isPopular } = packageData;

  const handleCardClick = () => {
    if (onSelectPackage) {
      onSelectPackage(packageData);
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`relative rounded-3xl p-5 sm:p-7 transition-all duration-300 glass-card border w-full overflow-hidden cursor-pointer group ${
          isSelected || isPopular
            ? 'border-2 border-rosegold-400 shadow-glow-rosegold bg-dark-800/90 scale-[1.01]'
            : 'border-white/10 hover:border-rosegold-500/40 bg-dark-850/80 hover:bg-dark-800'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          
          {/* 1. LEFT SECTION: BADGE, TIME DURATION, TITLE, PRICE */}
          <div className="lg:w-4/12 space-y-4 flex flex-col justify-between min-w-0 pr-0 lg:pr-2">
            <div className="space-y-3 min-w-0">
              
              {/* TOP HEADER ROW: BADGE + DURATION PILL */}
              <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                {badge ? (
                  <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full rosegold-gradient-bg !text-white font-extrabold text-[10px] uppercase tracking-wider shadow-md shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{badge}</span>
                  </div>
                ) : (
                  <div />
                )}

                {/* DURATION PILL PLACED SAFELY AT TOP RIGHT OF SECTION 1 */}
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-dark-900 border border-rosegold-500/50 text-gray-900 dark:text-gray-300 text-xs font-mono font-bold shadow-sm shrink-0">
                  <Clock className="w-3.5 h-3.5 text-rosegold-600 dark:text-rosegold-400 shrink-0" />
                  <span>{duration}</span>
                </div>
              </div>

              {/* TITLE & DESCRIPTION */}
              <h4 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-wide leading-tight pt-1 group-hover:text-rosegold-300 transition-colors">
                {name}
              </h4>

              <p className="text-gray-400 text-xs leading-relaxed font-sans line-clamp-3">
                {description}
              </p>
            </div>

            {/* INVESTMENT PRICE */}
            <div className="pt-3 border-t border-white/10 min-w-0 flex items-end justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Investment</span>
                <div className="text-2xl sm:text-3xl font-serif font-extrabold text-rosegold-400">
                  ₹{price.toLocaleString('en-IN')}
                </div>
              </div>

              {/* CLICK FOR DETAILS BADGE */}
              <span className="text-[10px] font-mono text-rosegold-400/80 group-hover:text-rosegold-300 flex items-center space-x-1 underline underline-offset-2 pb-1">
                <Info className="w-3 h-3" />
                <span>View Details</span>
              </span>
            </div>
          </div>

          {/* 2. MIDDLE SECTION: INCLUDED SERVICES */}
          <div className="lg:w-5/12 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:px-6 space-y-3 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider block">Included Services</span>
              <span className="text-[10px] text-rosegold-400 font-mono">Tap for full list ({features.length})</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-300">
              {features.map((feat, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300 font-sans text-xs leading-snug break-words">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. RIGHT SECTION: ACTION BUTTONS */}
          <div className="lg:w-3/12 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-6 flex flex-col justify-center space-y-3 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="w-full py-3.5 px-5 rounded-full rosegold-gradient-bg !text-white font-serif font-bold text-xs flex items-center justify-center space-x-2 shadow-lg hover:scale-[1.02] transition-transform cursor-pointer text-center group/btn"
            >
              <span>View Package Details</span>
              <Eye className="w-4 h-4 shrink-0 group-hover/btn:scale-110 transition-transform" />
            </button>

            <Link
              href={`/book?serviceId=${encodeURIComponent(packageData.id)}&service=${encodeURIComponent(serviceName)}&package=${encodeURIComponent(name)}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full py-3 px-5 rounded-full bg-dark-900 border border-rosegold-500/40 hover:border-rosegold-400 text-gray-200 hover:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer text-center"
            >
              <span>Book Package</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>

        </div>
      </div>

      {/* POPUP MODAL FOR COMPLETE PACKAGE DETAILS */}
      <PackageDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        packageData={packageData}
        serviceName={serviceName}
        onEnquireClick={onEnquireClick}
        isSelected={isSelected}
      />
    </>
  );
}

