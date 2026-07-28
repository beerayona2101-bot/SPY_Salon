'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

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
}

export default function PackageCard({ packageData, serviceName, onEnquireClick }: PackageCardProps) {
  const { name, price, duration, description, badge, features, isPopular } = packageData;

  return (
    <div
      className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between space-y-6 ${
        isPopular
          ? 'glass-card border-2 border-rosegold-400 shadow-glow-rosegold bg-dark-800/90 scale-[1.02]'
          : 'glass-card border border-white/10 hover:border-rosegold-500/40 bg-dark-850/80 hover:bg-dark-800'
      }`}
    >
      {/* POPULAR / OFFER BADGE */}
      {badge && (
        <div className="absolute -top-3 right-6 px-3 py-1 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-[10px] uppercase tracking-wider shadow-lg flex items-center space-x-1">
          <Sparkles className="w-3 h-3" />
          <span>{badge}</span>
        </div>
      )}

      {/* HEADER INFO */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h4 className="font-serif font-bold text-xl text-white tracking-wide">
            {name}
          </h4>
          <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* PRICE & DURATION */}
        <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Investment</span>
            <div className="text-3xl font-serif font-extrabold text-rosegold-400">
              ₹{price.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-dark-900 border border-white/10 text-gray-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-rosegold-400" />
            <span>{duration}</span>
          </div>
        </div>
      </div>

      {/* INCLUDED FEATURES LIST */}
      <div className="space-y-2 text-xs text-gray-300 pt-2 border-t border-white/10 flex-1">
        <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider block mb-1">Included Services</span>
        {features.map((feat, i) => (
          <div key={i} className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0 mt-0.5" />
            <span>{feat}</span>
          </div>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div className="space-y-2 pt-2">
        <Link
          href={`/book?serviceId=${encodeURIComponent(packageData.id)}&service=${encodeURIComponent(serviceName)}&package=${encodeURIComponent(name)}`}
          className="w-full py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg hover:scale-[1.02] transition-transform cursor-pointer text-center"
        >
          <span>Book {name}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {onEnquireClick && (
          <button
            type="button"
            onClick={() => onEnquireClick(packageData)}
            className="w-full py-2.5 rounded-full bg-dark-900 border border-white/10 hover:border-rosegold-500/40 text-gray-300 hover:text-white font-bold text-xs transition-colors cursor-pointer text-center"
          >
            Inquire About {name}
          </button>
        )}
      </div>
    </div>
  );
}
