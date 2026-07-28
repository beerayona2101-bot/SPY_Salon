'use client';

import React from 'react';
import { ChevronRight, Scissors, Clock, Tag } from 'lucide-react';
import { ServiceItem } from '@/lib/servicesData';

import LazyImage from '@/components/ui/LazyImage';

interface ServiceSidebarProps {
  services: ServiceItem[];
  selectedServiceId: string;
  onSelectService: (service: ServiceItem) => void;
  activeCategoryName: string;
}

export default function ServiceSidebar({
  services,
  selectedServiceId,
  onSelectService,
  activeCategoryName
}: ServiceSidebarProps) {
  return (
    <div className="w-full lg:w-[340px] shrink-0 space-y-4 text-left">
      <div className="glass-card p-5 rounded-3xl border border-rosegold-500/30 shadow-2xl space-y-4 max-h-[calc(100vh-110px)] overflow-y-auto custom-scrollbar">
        
        {/* SIDEBAR HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rosegold-400">
              {activeCategoryName}
            </div>
            <h2 className="text-lg font-serif font-bold text-white tracking-wide mt-0.5">
              Available Services
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-dark-800 text-gray-300 border border-white/10">
            {services.length} Services
          </span>
        </div>

        {/* SERVICES CARDS LIST */}
        <div className="space-y-3">
          {services.length === 0 ? (
            <div className="p-6 text-center text-gray-400 space-y-2 border border-dashed border-white/10 rounded-2xl">
              <Scissors className="w-6 h-6 mx-auto text-rosegold-400 opacity-40 animate-bounce" />
              <p className="text-xs font-semibold">No services found for this selection.</p>
            </div>
          ) : (
            services.map((srv) => {
              const isSelected = selectedServiceId === srv.id;

              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => onSelectService(srv)}
                  className={`w-full p-3.5 rounded-2xl transition-all duration-300 text-left cursor-pointer group flex items-start space-x-3.5 ${
                    isSelected
                      ? 'bg-dark-800 border-2 border-rosegold-400 shadow-glow-rosegold scale-[1.02]'
                      : 'bg-dark-850/80 border border-white/10 hover:border-rosegold-500/50 hover:bg-dark-800'
                  }`}
                >
                  {/* SERVICE IMAGE THUMBNAIL WITH LAZY LOADING */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-dark-900 border border-white/10">
                    <LazyImage
                      src={srv.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop'}
                      alt={srv.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {srv.popular && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-rosegold-500 text-dark-900 font-extrabold text-[8px] uppercase z-20">
                        POPULAR
                      </div>
                    )}
                  </div>

                  {/* SERVICE INFO */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-serif font-bold text-sm truncate ${isSelected ? 'text-rosegold-300' : 'text-white group-hover:text-rosegold-300'}`}>
                        {srv.name}
                      </h3>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-rosegold-400 translate-x-1' : 'text-gray-500 group-hover:text-rosegold-400 group-hover:translate-x-1'}`} />
                    </div>

                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed font-sans">
                      {srv.description}
                    </p>

                    {/* DURATION & PRICE PILLS */}
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-gray-400 bg-dark-900 px-2 py-0.5 rounded-full border border-white/10">
                        <Clock className="w-3 h-3 text-rosegold-400" />
                        <span>{srv.duration}</span>
                      </span>

                      <span className="inline-flex items-center space-x-1 text-[11px] font-serif font-extrabold text-rosegold-400">
                        <Tag className="w-3 h-3" />
                        <span>₹{srv.price.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
