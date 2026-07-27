'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Clock, Sparkles, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import { servicesData as defaultStaticServices } from '@/data/servicesData';
import { API_BASE_URL } from '@/lib/api';
import CinematicImage from '@/components/common/CinematicImage';

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTabFromUrl = searchParams.get('cat') || searchParams.get('category');
  const activeTab = activeTabFromUrl || 'All';
  const searchQueryFromUrl = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(searchQueryFromUrl);

  useEffect(() => {
    setSearchQuery(searchQueryFromUrl);
  }, [searchQueryFromUrl]);

  const handleCategoryChange = (cat: string) => {
    const params = new URLSearchParams();
    if (cat !== 'All') params.set('cat', cat);
    if (searchQuery) params.set('q', searchQuery);
    const queryString = params.toString();
    router.push(`/services${queryString ? `?${queryString}` : ''}`);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    const params = new URLSearchParams();
    if (activeTab !== 'All') params.set('cat', activeTab);
    if (q) params.set('q', q);
    const queryString = params.toString();
    router.push(`/services${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const [services, setServices] = useState<any[]>(defaultStaticServices);

  const categories = ['All', 'Hair', 'Skin', 'Spa', 'Nails', 'Bridal', 'Grooming'];

  const fetchLiveServices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/services`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const formatted = data.data.map((s: any) => ({
          id: s._id || s.id,
          title: s.name,
          category: s.category,
          price: s.price,
          discountPrice: s.discountPrice || s.price,
          duration: `${s.durationMinutes || 60} mins`,
          durationMinutes: s.durationMinutes || 60,
          rating: s.rating || 4.9,
          reviews: 120,
          desc: s.description || 'Luxury botanical treatment provided by SPY Salon certified specialists.',
          image: s.image || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80',
          popular: s.isPopular !== undefined ? s.isPopular : true
        }));
        setServices(formatted);
      }
    } catch (err) {
      console.warn('Using static service data fallback');
    }
  };

  useEffect(() => {
    fetchLiveServices();
    // Auto-fetch live changes from Admin every 4 seconds
    const intervalId = setInterval(() => {
      fetchLiveServices();
    }, 4000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredServices = services.filter(service => {
    const matchesCategory = activeTab === 'All' || service.category === activeTab;
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-medium uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Complete Botanical Beauty Menu</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">Services & Treatments</h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">Browse our luxury salon offerings. Click any card to open its dedicated treatment profile page, step-by-step procedure, and instant booking.</p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-rosegold-500/20 shadow-xl"
      >
        
        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === cat 
                  ? 'rosegold-gradient-bg text-dark-900 shadow-md font-bold' 
                  : 'bg-dark-800 text-gray-300 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-rosegold-500 transition-colors"
          />
        </div>
      </motion.div>

      {/* Services Grid with Framer Motion AnimatePresence */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredServices.map((service, idx) => (
            <motion.div 
              key={service.id}
              layout
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -15 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -6 }}
              onClick={() => router.push(`/services/${service.id}`)}
              className="glass-card rounded-3xl overflow-hidden border border-rosegold-500/20 hover:border-rosegold-500/60 transition-all group flex flex-col justify-between cursor-pointer hover:shadow-glow-rosegold h-full"
            >
              <div>
                {/* Image & Badge */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-dark-800">
                  <CinematicImage 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover"
                    duration={18}
                  />
                  {service.popular && (
                    <span className="absolute top-3 left-3 bg-rosegold-500 text-dark-900 font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md z-10">
                      Popular
                    </span>
                  )}
                  <div className="absolute bottom-3 right-3 bg-dark-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center space-x-1 shadow-sm z-10">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-white">{service.rating}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rosegold-400 uppercase tracking-wider">{service.category}</span>
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                      <span>{service.duration}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold font-serif text-white group-hover:text-rosegold-300 transition-colors">{service.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{service.desc}</p>
                </div>
              </div>

              {/* Footer with Relocate & Booking Buttons */}
              <div className="px-6 pb-6 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <div>
                  <span className="text-2xl font-bold font-serif text-rosegold-400">₹{service.price}</span>
                  {service.discountPrice && service.discountPrice < service.price && (
                    <span className="text-xs text-gray-500 line-through ml-2">₹{service.discountPrice}</span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/services/${service.id}`);
                    }}
                    className="p-2.5 rounded-full bg-dark-800 text-rosegold-300 border border-rosegold-500/30 hover:bg-rosegold-500 hover:text-dark-900 transition-all cursor-pointer"
                    title="View Full Treatment Details & Procedure"
                  >
                    <Eye className="w-4 h-4" />
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/book?service=${encodeURIComponent(service.title)}`);
                    }} 
                    className="px-3.5 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md cursor-pointer"
                  >
                    Book Slot
                  </motion.button>
                </div>
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-rosegold-400 font-serif animate-pulse">
        Loading Treatment Menu & Services...
      </div>
    }>
      <ServicesContent />
    </Suspense>
  );
}
