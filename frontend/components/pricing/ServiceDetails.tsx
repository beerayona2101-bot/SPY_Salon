'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Tag, Calendar, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { ServiceItem } from '@/lib/servicesData';
import PackageCard, { PackageTier } from './PackageCard';
import PriceTable from './PriceTable';

import LazyImage from '@/components/ui/LazyImage';

interface ServiceDetailsProps {
  service: ServiceItem;
  allCategoryServices: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  onEnquireClick?: () => void;
}

export default function ServiceDetails({
  service,
  allCategoryServices,
  onSelectService,
  onEnquireClick
}: ServiceDetailsProps) {
  // Generate realistic package tiers (Classic, Premium, Luxury) based on the selected service
  const basePrice = service.price || 500;
  const packages: PackageTier[] = [
    {
      id: `${service.id}-classic`,
      name: `Classic ${service.name}`,
      price: Math.round(basePrice * 0.6),
      duration: service.duration || '30 mins',
      description: `Essential consultation, standard scalp/skin cleansing, and precision styling by our certified stylists.`,
      features: [
        'Certified Stylist Consultation',
        'Standard Cleansing & Prep',
        'Precision Execution & Styling',
        'Post-Care Maintenance Advice'
      ]
    },
    {
      id: `${service.id}-premium`,
      name: `Premium ${service.name}`,
      price: basePrice,
      duration: service.duration || '45 mins',
      badge: 'MOST POPULAR',
      isPopular: true,
      description: `Advanced treatment using premium organic products, extended relaxing scalp massage, and expert finish.`,
      features: [
        'Senior Master Stylist Consultation',
        'Deep Hydration & Steam Therapy',
        'Premium Import Organic Products',
        'Hot Towel Relaxing Massage',
        'Volume Blowout / Matte Finish'
      ]
    },
    {
      id: `${service.id}-luxury`,
      name: `Royal Luxury ${service.name}`,
      price: Math.round(basePrice * 1.8),
      duration: '60 mins',
      badge: 'ROYAL EXPERIENCE',
      description: `The ultimate VIP salon experience with top creative directors, customized booster serums, and champagne refreshers.`,
      features: [
        'Creative Director One-on-One',
        'Customized Active Booster Serums',
        '24K Nano Steam & Scalp Scrub',
        'Aroma Therapy Shoulder Massage',
        'VIP Private Concierge Refreshments'
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-8 text-left"
    >
      {/* 1. LARGE SERVICE BANNER & HEADER WITH LAZY LOADING */}
      <div className="relative rounded-3xl overflow-hidden border border-rosegold-500/40 shadow-2xl min-h-[260px] sm:min-h-[300px] flex flex-col justify-end p-6 sm:p-8 group">
        <div className="absolute inset-0">
          <LazyImage
            src={service.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop'}
            alt={service.name}
            className="w-full h-full object-cover filter brightness-[0.4] group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-900/80 to-transparent" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-dark-900/90 border border-rosegold-500/60 shadow-md text-xs font-extrabold uppercase tracking-wider inline-flex items-center space-x-1.5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-rosegold-600 dark:text-rosegold-400 shrink-0" />
              <span className="text-gray-900 dark:text-rosegold-300 font-extrabold">{service.category}</span>
            </span>

            <span className="px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-dark-900/90 border border-rosegold-500/60 shadow-md text-xs font-mono font-bold inline-flex items-center space-x-1.5 backdrop-blur-md">
              <Clock className="w-3.5 h-3.5 text-rosegold-600 dark:text-rosegold-400 shrink-0" />
              <span className="text-gray-900 dark:text-gray-200 font-bold">{service.duration}</span>
            </span>

            {service.popular && (
              <span className="px-3.5 py-1.5 rounded-full rosegold-gradient-bg !text-white font-extrabold text-xs uppercase tracking-wider shadow-md backdrop-blur-md">
                POPULAR CHOICE
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-white tracking-wide leading-tight">
            {service.name}
          </h1>

          <p className="text-gray-300 text-xs sm:text-sm max-w-2xl font-sans leading-relaxed">
            {service.description}
          </p>

          {/* MAIN PRICE & CTA RIBBON */}
          <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Starting Price</span>
              <div className="text-3xl font-serif font-extrabold text-rosegold-400">
                {String(service.price).startsWith('₹')
                  ? service.price
                  : `₹${Number(service.price || 0).toLocaleString('en-IN')}`}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href={`/book?serviceId=${encodeURIComponent(service.id)}&category=${encodeURIComponent(service.gender || '')}&subcategory=${encodeURIComponent(service.subCategory || '')}&service=${encodeURIComponent(service.name)}`}
                className="px-6 py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-serif font-bold text-xs shadow-glow-rosegold hover:scale-105 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/contact"
                className="px-5 py-3.5 rounded-full bg-white/90 dark:bg-dark-800 border border-rosegold-500/40 text-gray-900 dark:text-gray-200 font-bold text-xs flex items-center space-x-2 transition-colors cursor-pointer shadow-md"
              >
                <MessageSquare className="w-4 h-4 text-rosegold-600 dark:text-rosegold-400" />
                <span>Inquire</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AVAILABLE SERVICE PACKAGES TIERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rosegold-400">
              Curated Treatment Packages
            </span>
            <h2 className="text-2xl font-serif font-bold text-white mt-0.5">
              Available Package Options
            </h2>
          </div>
          <span className="text-xs font-mono text-gray-400">3 Tiers Available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              packageData={pkg}
              serviceName={service.name}
              onEnquireClick={onEnquireClick}
            />
          ))}
        </div>
      </div>

      {/* 3. SERVICE PRICING TABLE */}
      <PriceTable
        services={allCategoryServices}
        selectedServiceId={service.id}
        onSelectService={onSelectService}
      />

      {/* 4. LUXURY QUALITY GUARANTEE BADGE */}
      <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 bg-dark-850/90 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
        <div className="w-14 h-14 rounded-2xl bg-rosegold-500/20 border border-rosegold-500/40 flex items-center justify-center text-rosegold-400 shrink-0">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-serif font-bold text-white">
            SPY Salon Certified Hygiene & Brand Guarantee
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
            100% single-use sanitized capes, imported dermatologically-tested organic products, and certified senior master stylists for every treatment.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

