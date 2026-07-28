'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Tag, ArrowRight, Eye } from 'lucide-react';
import { ServiceItem } from '@/lib/servicesData';

interface PriceTableProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  selectedServiceId: string;
}

export default function PriceTable({ services, onSelectService, selectedServiceId }: PriceTableProps) {
  return (
    <div className="glass-card rounded-3xl border border-rosegold-500/30 overflow-hidden shadow-2xl space-y-4 p-5 text-left">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rosegold-400">
            Official Menu & Rates
          </span>
          <h3 className="text-xl font-serif font-bold text-white mt-0.5">
            Service Pricing Table
          </h3>
        </div>
        <span className="text-xs font-mono text-gray-400">
          Showing {services.length} items
        </span>
      </div>

      <div className="overflow-x-auto">
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
            {services.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No pricing table entries found.
                </td>
              </tr>
            ) : (
              services.map((srv) => {
                const isSelected = selectedServiceId === srv.id;

                return (
                  <tr
                    key={srv.id}
                    className={`transition-colors hover:bg-white/5 ${isSelected ? 'bg-rosegold-500/10' : ''}`}
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
                      ₹{srv.price.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectService(srv)}
                        className="px-3 py-1.5 rounded-full bg-dark-800 border border-white/10 hover:border-rosegold-500/40 text-gray-300 hover:text-white font-bold text-[11px] inline-flex items-center space-x-1 cursor-pointer transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-rosegold-400" />
                        <span>View</span>
                      </button>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/book?service=${encodeURIComponent(srv.name)}`}
                        className="px-4 py-1.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-[11px] inline-flex items-center space-x-1 shadow-md hover:scale-105 transition-transform cursor-pointer"
                      >
                        <span>Book</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
