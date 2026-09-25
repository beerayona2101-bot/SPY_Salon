'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Tag, ArrowRight, Eye, Calendar, Sparkles } from 'lucide-react';
import { ServiceItem } from '@/lib/servicesData';

interface PriceTableProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  selectedServiceId: string;
}

export default function PriceTable({ services, onSelectService, selectedServiceId }: PriceTableProps) {
  return (
    <div className="glass-card rounded-3xl border border-rosegold-500/30 overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6 text-left">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rosegold-400">
            Official Menu & Rates
          </span>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-white mt-0.5">
            Service Pricing Table
          </h3>
        </div>
        <span className="text-xs font-mono text-gray-400 bg-dark-800 px-3 py-1 rounded-full border border-white/10">
          Showing {services.length} {services.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {services.length === 0 ? (
        <div className="p-8 text-center text-gray-400 space-y-2">
          <p className="text-xs font-medium">No pricing table entries found for this selection.</p>
        </div>
      ) : (
        <>
          {/* MOBILE RESPONSIVE CARDS VIEW (Clean, spacious luxury cards for mobile screens) */}
          <div className="md:hidden space-y-3">
            {services.map((srv) => {
              const isSelected = selectedServiceId === srv.id;
              const discPrice = (srv as any).discountPrice || srv.originalPrice;

              return (
                <div
                  key={srv.id}
                  onClick={() => onSelectService(srv)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-rosegold-500/15 border-rosegold-400/60 shadow-glow-rosegold'
                      : 'bg-dark-850/90 border-white/10 hover:border-rosegold-500/40 hover:bg-dark-800'
                  }`}
                >
                  {/* Top Row: Service Name & Price */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-white text-base leading-snug">
                        {srv.name}
                      </h4>
                      {srv.description && (
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                          {srv.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-serif font-extrabold text-rosegold-400 block leading-tight">
                        {String(srv.price).startsWith('₹')
                          ? srv.price
                          : `₹${Number(srv.price || 0).toLocaleString('en-IN')}`}
                      </span>
                      {discPrice && discPrice !== srv.price && (
                        <span className="text-[11px] text-gray-500 line-through block">
                          {String(discPrice).startsWith('₹')
                            ? discPrice
                            : `₹${Number(discPrice || 0).toLocaleString('en-IN')}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Row: Duration & Buttons */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/10 gap-2">
                    <div className="flex items-center space-x-1.5 text-xs text-gray-300 bg-dark-900/80 px-2.5 py-1 rounded-full border border-white/10 font-mono">
                      <Clock className="w-3.5 h-3.5 text-rosegold-400 shrink-0" />
                      <span>{srv.duration}</span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectService(srv);
                        }}
                        className="px-3 py-1.5 rounded-full bg-dark-800 border border-white/15 text-gray-200 hover:text-white hover:border-rosegold-400 font-bold text-xs inline-flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5 text-rosegold-400" />
                        <span>Details</span>
                      </button>

                      <Link
                        href={`/book?service=${encodeURIComponent(srv.name)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-1.5 rounded-full rosegold-gradient-bg !text-white font-extrabold text-xs inline-flex items-center space-x-1 shadow-md hover:scale-105 transition-transform cursor-pointer"
                      >
                        <span className="!text-white font-extrabold">Book</span>
                        <ArrowRight className="w-3.5 h-3.5 !text-white" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (Full desktop view with whitespace-nowrap) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-3.5">Service Name</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5 text-center">View</th>
                  <th className="p-3.5 text-right">Book</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {services.map((srv) => {
                  const isSelected = selectedServiceId === srv.id;

                  return (
                    <tr
                      key={srv.id}
                      onClick={() => onSelectService(srv)}
                      className={`transition-colors hover:bg-white/5 cursor-pointer ${
                        isSelected ? 'bg-rosegold-500/10' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{srv.name}</div>
                        <div className="text-gray-400 text-[11px] line-clamp-1">{srv.description}</div>
                      </td>

                      <td className="p-3.5 font-mono text-gray-300 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                          <span>{srv.duration}</span>
                        </span>
                      </td>

                      <td className="p-3.5 font-serif font-extrabold text-rosegold-400 text-sm whitespace-nowrap">
                        {String(srv.price).startsWith('₹')
                          ? srv.price
                          : `₹${Number(srv.price || 0).toLocaleString('en-IN')}`}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectService(srv);
                          }}
                          className="px-3 py-1.5 rounded-full bg-dark-800 border border-white/10 hover:border-rosegold-500/40 text-gray-300 hover:text-white hover:bg-dark-700 font-bold text-[11px] inline-flex items-center space-x-1 cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-rosegold-400" />
                          <span>View</span>
                        </button>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/book?service=${encodeURIComponent(srv.name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-1.5 rounded-full rosegold-gradient-bg !text-white font-extrabold text-[11px] inline-flex items-center space-x-1 shadow-md hover:scale-105 transition-transform cursor-pointer"
                        >
                          <span className="!text-white font-extrabold">Book</span>
                          <ArrowRight className="w-3 h-3 !text-white" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
