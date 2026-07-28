'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Clock, Sparkles, ArrowRight, Eye, CheckCircle2, Crown, Award, ShieldCheck } from 'lucide-react';
import { servicesData as defaultStaticServices } from '@/data/servicesData';
import { API_BASE_URL } from '@/lib/api';
import CinematicImage from '@/components/common/CinematicImage';

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTabFromUrl = searchParams?.get('cat') || searchParams?.get('category');
  const activeTab = activeTabFromUrl || 'All';
  const searchQueryFromUrl = searchParams?.get('q') || '';
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

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const filteredServices = services.filter(service => {
    const matchesCategory = activeTab === 'All' || service.category === activeTab;
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-medium uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Complete Botanical Beauty Menu</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">Our Services & Treatments</h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">Explore curated luxury hair, skin, and spa treatments. Select any service to book instantly.</p>
      </motion.div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === cat
                  ? 'rosegold-gradient-bg text-dark-900 shadow-md'
                  : 'bg-dark-800 text-gray-300 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-dark-800 text-white text-xs border border-white/10 focus:outline-none focus:border-rosegold-500"
          />
        </div>
      </div>

      {/* Services Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredServices.map((service) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={service.id}
              className="glass-card rounded-3xl overflow-hidden border border-white/10 hover:border-rosegold-500/40 transition-all flex flex-col justify-between group"
            >
              <div className="relative h-52 overflow-hidden">
                <CinematicImage
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-dark-900/80 backdrop-blur-md text-rosegold-300 text-[10px] font-bold uppercase border border-white/10">
                  {service.category}
                </span>
                {service.popular && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30 flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Popular</span>
                  </span>
                )}
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                      <span>{service.duration}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{service.rating}</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-rosegold-300 transition-colors">{service.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{service.desc}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <span className="text-xl font-serif font-bold text-rosegold-400">₹{service.price}</span>
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
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* 👑 VIP MEMBERSHIP PLANS SECTION */}
      <section className="pt-12 pb-6 space-y-8 border-t border-white/10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full rosegold-gradient-bg text-dark-900 text-xs font-extrabold uppercase tracking-wider shadow-glow-rosegold">
            <Crown className="w-4 h-4 fill-current" />
            <span>👑 VIP Membership Plans</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-wide">
            Executive VIP Packages & Privileges
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-2xl mx-auto">
            Unlock flat service discounts (5% to 20%), complimentary spa treatments, priority booking, and VIP luxury lounge access across all flagship salon outlets.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="pt-4 flex justify-center">
            <div className="bg-dark-800 p-1 rounded-full border border-white/10 flex items-center space-x-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'rosegold-gradient-bg text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly Plans
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'yearly' ? 'rosegold-gradient-bg text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly Plans <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full ml-1">Save 17%</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 MEMBERSHIP TIER CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          
          {/* 🥉 STANDARD MEMBERSHIP */}
          <div className="glass-card p-6 rounded-3xl border border-amber-600/30 flex flex-col justify-between space-y-6 hover:border-amber-500/60 transition-all bg-dark-800/80">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-900/60 text-amber-300 text-xs font-bold border border-amber-600/40">
                <Award className="w-3.5 h-3.5" />
                <span>🥉 Standard Member</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">Standard Membership</h3>
              <p className="text-xs text-gray-400">Essential VIP privileges, priority booking, and birthday special offers.</p>
              
              <div className="pt-2">
                <span className="text-3xl font-serif font-bold text-amber-400">
                  ₹{billingCycle === 'yearly' ? '9,999' : '999'}
                </span>
                <span className="text-xs text-gray-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                <span className="block text-[11px] text-green-400 font-bold mt-0.5">5% Flat Discount On All Services</span>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs text-gray-300">
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /><span>5% Discount on all services</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /><span>Priority Booking Queue</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /><span>Special Birthday Offer & Gift</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /><span>Monthly Beauty Care Tips</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /><span>Member Desk Support</span></div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10">
              <button
                onClick={() => router.push('/membership/standard')}
                className="w-full py-2.5 rounded-full bg-dark-900 text-gray-300 font-bold text-xs border border-white/10 hover:text-white hover:border-amber-400 transition-all cursor-pointer"
              >
                View Details
              </button>
              <button
                onClick={() => router.push('/membership/standard')}
                className="w-full py-3 rounded-full bg-amber-500 text-dark-900 font-extrabold text-xs shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                Buy Standard (5% Off)
              </button>
            </div>
          </div>

          {/* 🥈 PREMIUM MEMBERSHIP */}
          <div className="glass-card p-6 rounded-3xl border border-slate-400/40 flex flex-col justify-between space-y-6 hover:border-slate-300 transition-all bg-dark-800/80">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-xs font-bold border border-slate-400/50">
                <Sparkles className="w-3.5 h-3.5" />
                <span>🥈 Premium Member</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">Premium Membership</h3>
              <p className="text-xs text-gray-400">Enhanced luxury experience with free monthly Hair Spa treatments.</p>
              
              <div className="pt-2">
                <span className="text-3xl font-serif font-bold text-slate-200">
                  ₹{billingCycle === 'yearly' ? '24,999' : '2,499'}
                </span>
                <span className="text-xs text-gray-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                <span className="block text-[11px] text-green-400 font-bold mt-0.5">10% Flat Discount On All Services</span>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs text-gray-300">
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" /><span>10% Discount on all services</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" /><span>Priority Booking & Faster Queue</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" /><span>Free Skin & Hair Consultation</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" /><span>Free Hair Spa every month</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" /><span>Special Birthday Gift & Offers</span></div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10">
              <button
                onClick={() => router.push('/membership/premium')}
                className="w-full py-2.5 rounded-full bg-dark-900 text-gray-300 font-bold text-xs border border-white/10 hover:text-white hover:border-slate-300 transition-all cursor-pointer"
              >
                View Details
              </button>
              <button
                onClick={() => router.push('/membership/premium')}
                className="w-full py-3 rounded-full bg-slate-200 text-dark-900 font-extrabold text-xs shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                Buy Premium (10% Off)
              </button>
            </div>
          </div>

          {/* 🥇 GOLD VIP MEMBERSHIP */}
          <div className="glass-card p-6 sm:p-7 rounded-3xl border-2 border-rosegold-400 flex flex-col justify-between space-y-6 shadow-glow-rosegold scale-[1.02] bg-dark-800/90 relative">
            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full rosegold-gradient-bg text-dark-900 text-[10px] font-extrabold uppercase shadow-sm">
              Most Popular VIP
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full rosegold-gradient-bg text-dark-900 text-xs font-bold shadow-sm">
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>👑 Gold Member</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">Gold VIP Membership</h3>
              <p className="text-xs text-gray-300">Ultimate luxury privilege with complimentary Hair Spa, Facial & VIP Lounge access.</p>
              
              <div className="pt-2">
                <span className="text-3xl font-serif font-bold text-rosegold-400">
                  ₹{billingCycle === 'yearly' ? '49,999' : '4,999'}
                </span>
                <span className="text-xs text-gray-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                <span className="block text-[11px] text-green-400 font-bold mt-0.5">20% Flat Discount On All Services</span>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs text-gray-200">
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" /><span>20% Discount on all services</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" /><span>Unlimited Priority Booking</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" /><span>Dedicated Executive VIP Support</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" /><span>Complimentary Hair Spa & Facial / mo</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" /><span>VIP Lounge Access & Gala Events</span></div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10">
              <button
                onClick={() => router.push('/membership/gold')}
                className="w-full py-2.5 rounded-full bg-dark-900 text-rosegold-300 font-bold text-xs border border-rosegold-500/40 hover:bg-dark-700 transition-all cursor-pointer"
              >
                View Details
              </button>
              <button
                onClick={() => router.push('/membership/gold')}
                className="w-full py-3 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all cursor-pointer"
              >
                Buy Gold VIP (20% Off)
              </button>
            </div>
          </div>

        </div>
      </section>

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
