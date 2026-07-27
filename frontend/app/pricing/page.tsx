'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Scissors, 
  ChevronRight 
} from 'lucide-react';
import { SALON_CATALOGUE, GenderSection, CategoryCard } from '@/lib/servicesData';

export default function PricingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGender, setActiveGender] = useState<'all' | 'men' | 'women' | 'kids'>('all');

  // Filter sections and categories based on search query and active tab
  const filteredSections = SALON_CATALOGUE.map((section: GenderSection) => {
    if (activeGender !== 'all' && section.id !== activeGender) {
      return null;
    }

    if (!searchQuery.trim()) {
      return section;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchedCategories = section.categories.filter(cat => {
      const matchCatName = cat.name.toLowerCase().includes(q);
      const matchDesc = cat.shortDesc.toLowerCase().includes(q);
      const matchItems = cat.items.some(item => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
      return matchCatName || matchDesc || matchItems;
    });

    if (matchedCategories.length === 0) return null;

    return {
      ...section,
      categories: matchedCategories
    };
  }).filter(Boolean) as GenderSection[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 text-left">
      
      {/* HERO & SEARCH BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 animate-pulse text-rosegold-400" />
          <span>Luxury Salon Service Catalogue</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold font-serif text-white tracking-wide leading-tight">
          Select Your Salon Experience
        </h1>

        <p className="text-gray-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Browse our curated category catalogue for Men, Women, and Kids. Click any category to explore dedicated treatments, brand pricing, and direct bookings.
        </p>

        {/* SEARCH BAR */}
        <div className="pt-4 max-w-xl mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-rosegold-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search services (e.g. Hair Cut, Keratin, 24K Gold Facial, Nails)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-20 py-3 rounded-full bg-dark-850 border border-rosegold-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-rosegold-400 transition-colors shadow-2xl"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-2.5 text-gray-400 hover:text-white text-xs bg-dark-800 px-3 py-1 rounded-full cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* STICKY GENDER TAB FILTER BAR */}
      <div className="sticky top-16 z-30 bg-dark-900/90 backdrop-blur-xl py-3 border-y border-rosegold-500/20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-center space-x-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: '✨ All Categories' },
            { id: 'men', label: "👨 Men's Salon" },
            { id: 'women', label: "👩 Women's Salon" },
            { id: 'kids', label: "🧒 Kids' Salon" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveGender(tab.id as any)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeGender === tab.id
                  ? 'rosegold-gradient-bg text-dark-900 shadow-glow-rosegold scale-105 font-extrabold'
                  : 'bg-dark-800 text-gray-300 border border-white/10 hover:border-rosegold-500/40 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CATALOGUE SECTIONS (MEN, WOMEN, KIDS) */}
      <div className="space-y-16">
        {filteredSections.length === 0 ? (
          <div className="text-center py-16 space-y-3 glass-card rounded-3xl border border-white/10">
            <Scissors className="w-10 h-10 mx-auto text-rosegold-400 opacity-40 animate-bounce" />
            <h3 className="text-lg font-serif font-bold text-white">No Categories Found</h3>
            <p className="text-xs text-gray-400">No salon categories match your search term "{searchQuery}".</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveGender('all'); }}
              className="px-5 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md mt-2 cursor-pointer"
            >
              Reset Search Filter
            </button>
          </div>
        ) : (
          filteredSections.map((section: GenderSection) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* SECTION PREMIUM BANNER */}
              <div className="relative rounded-3xl overflow-hidden border border-rosegold-500/30 shadow-2xl p-6 sm:p-10 flex flex-col justify-end min-h-[180px] sm:min-h-[220px]">
                {/* Background Image with Lazy Loading */}
                <img 
                  src={section.bannerImage} 
                  alt={section.title}
                  loading="lazy"
                  decoding="async" 
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.35] scale-105 transform transition-transform duration-700 hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-900/80 to-transparent" />

                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rosegold-500/20 border border-rosegold-500/40 text-rosegold-300 text-xs font-bold uppercase tracking-wider">
                    <span>{section.icon}</span>
                    <span>{section.title} Catalogue</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white tracking-wide">
                    {section.title}
                  </h2>
                  <p className="text-gray-300 text-xs sm:text-sm max-w-xl font-sans">
                    {section.subtitle}
                  </p>
                </div>
              </div>

              {/* CATEGORY CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {section.categories.map((cat: CategoryCard, idx: number) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                  >
                    <Link 
                      href={`/pricing/${cat.gender}/${cat.slug}`}
                      className="group block h-full rounded-3xl glass-card border border-white/10 hover:border-rosegold-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-rosegold-500/10 overflow-hidden flex flex-col justify-between"
                    >
                      {/* CARD TOP IMAGE CONTAINER WITH LAZY LOADING */}
                      <div className="relative h-44 w-full overflow-hidden bg-dark-800">
                        <img 
                          src={cat.image} 
                          alt={cat.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />

                        {/* CATEGORY ICON BADGE */}
                        <div className="absolute top-3 left-3 w-10 h-10 rounded-2xl bg-dark-900/90 border border-rosegold-500/40 flex items-center justify-center text-xl shadow-lg backdrop-blur-md">
                          {cat.icon}
                        </div>

                        {/* BADGE (IF AVAILABLE) */}
                        {cat.badge && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full rosegold-gradient-bg text-dark-900 text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                            {cat.badge}
                          </div>
                        )}

                        {/* SERVICE COUNT PILL */}
                        <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-dark-950/80 border border-white/10 text-gray-300 text-[10px] font-mono backdrop-blur-md">
                          {cat.serviceCount} Services
                        </div>
                      </div>

                      {/* CARD CONTENT */}
                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="font-serif font-bold text-xl text-white group-hover:text-rosegold-300 transition-colors flex items-center justify-between">
                            <span>{cat.name}</span>
                            <ChevronRight className="w-4 h-4 text-rosegold-400 group-hover:translate-x-1 transition-transform" />
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                            {cat.shortDesc}
                          </p>
                        </div>

                        {/* CARD FOOTER WITH STARTING PRICE & EXPLORE BUTTON */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Starting from</span>
                            <span className="text-rosegold-400 font-serif font-extrabold text-lg">
                              ₹{cat.startingPrice.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <span className="px-3.5 py-1.5 rounded-full bg-rosegold-500/20 group-hover:rosegold-gradient-bg text-rosegold-300 group-hover:text-dark-900 font-bold text-xs transition-all duration-300 flex items-center space-x-1">
                            <span>Explore</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))
        )}
      </div>

      {/* BOTTOM PROMO BANNER */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-card p-8 sm:p-10 rounded-3xl border border-rosegold-500/40 rosegold-gradient-bg text-dark-900 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-glow-rosegold"
      >
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-dark-900 text-rosegold-300 text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-rosegold-400" />
            <span>SPECIAL PROMO</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-dark-900 leading-tight">
            ✨ 25% OFF FOR ALL NEW CUSTOMERS
          </h3>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Book any treatment from our menu today and experience Jubilee Hills' premier luxury salon.
          </p>
        </div>

        <Link
          href="/book"
          className="px-8 py-4 rounded-full bg-dark-900 text-white font-serif font-bold text-sm shadow-2xl hover:scale-105 transition-all cursor-pointer shrink-0"
        >
          Book Appointment Now →
        </Link>
      </motion.div>

    </div>
  );
}
