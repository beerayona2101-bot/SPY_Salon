'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Clock, Sparkles, ArrowRight, Eye, CheckCircle2, Crown, Award, ShieldCheck } from 'lucide-react';
import { servicesData as defaultStaticServices } from '@/data/servicesData';
import { API_BASE_URL } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import CinematicImage from '@/components/common/CinematicImage';
import { AnimatedButton } from '@/components/ui/animated-button';

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

  const [services, setServices] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);

  const categories = React.useMemo(() => {
    const catSet = new Set<string>(['All']);
    services.forEach(s => {
      if (s.category) catSet.add(s.category);
    });
    return Array.from(catSet);
  }, [services]);

  const fetchLiveServices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/services`);
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
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
          image: s.image || '',
          popular: s.isPopular !== undefined ? s.isPopular : true
        }));
        setServices(formatted);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.warn('Error loading live services from MongoDB');
    }
  };

  const fetchLiveMemberships = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/membership/plans`);
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setMemberships(data.data);
      }
    } catch (err) {}
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchLiveServices();
    fetchLiveMemberships();

    if (!socket) return;

    const handleServiceChange = () => {
      fetchLiveServices();
    };

    const handleMembershipChange = () => {
      fetchLiveMemberships();
    };

    socket.on('service:created', handleServiceChange);
    socket.on('service:updated', handleServiceChange);
    socket.on('service:deleted', handleServiceChange);
    socket.on('membership:created', handleMembershipChange);
    socket.on('membership:updated', handleMembershipChange);
    socket.on('membership:deleted', handleMembershipChange);

    return () => {
      socket.off('service:created', handleServiceChange);
      socket.off('service:updated', handleServiceChange);
      socket.off('service:deleted', handleServiceChange);
      socket.off('membership:created', handleMembershipChange);
      socket.off('membership:updated', handleMembershipChange);
      socket.off('membership:deleted', handleMembershipChange);
    };
  }, [socket]);

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
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredServices.map((service) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={service.id}
              className="glass-card rounded-3xl overflow-hidden border border-white/10 hover:border-rosegold-500/40 transition-all duration-300 transform-gpu flex flex-col justify-between group"
            >
              <div className="relative h-52 overflow-hidden">
                <CinematicImage
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
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
                    <span className="text-xl font-serif font-bold text-rosegold-400">
                      {String(service.price).startsWith('₹') ? service.price : `₹${service.price}`}
                    </span>
                    {service.discountPrice && service.discountPrice !== service.price && (
                      <span className="text-xs text-gray-500 line-through ml-2">
                        {String(service.discountPrice).startsWith('₹') ? service.discountPrice : `₹${service.discountPrice}`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/services/${service.id}`);
                      }}
                      className="p-2.5 rounded-full bg-dark-800 text-rosegold-300 border border-rosegold-500/30 hover:bg-rosegold-500 hover:text-dark-900 hover:scale-105 transition-all duration-200 cursor-pointer"
                      title="View Full Treatment Details & Procedure"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <AnimatedButton
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        router.push(`/book?service=${encodeURIComponent(service.title)}`);
                      }} 
                      className="px-3.5 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md cursor-pointer"
                    >
                      Book Slot
                    </AnimatedButton>
                  </div>
                </div>
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredServices.length === 0 && (
        <div className="p-12 text-center glass-card rounded-3xl border border-white/10 space-y-4 max-w-xl mx-auto my-8">
          <Sparkles className="w-10 h-10 mx-auto text-rosegold-400 opacity-50 animate-bounce" />
          <h3 className="text-xl font-serif font-bold text-white">No Treatment Services Found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {services.length === 0
              ? 'There are currently no active treatment services in the database. Add services in the Admin Dashboard to feature them here.'
              : 'No services match the selected category or search filter.'}
          </p>
          {services.length === 0 && (
            <Link
              href="/admin?tab=services"
              className="inline-block px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md cursor-pointer"
            >
              Add Services in Admin Dashboard ✨
            </Link>
          )}
        </div>
      )}

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

        {/* DYNAMIC MEMBERSHIP TIER CARDS FROM API */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {memberships.map((m: any) => {
            const isGold = m.code?.includes('gold') || m.name?.toLowerCase().includes('gold');
            const price = billingCycle === 'yearly' ? (m.yearlyPrice || m.monthlyPrice * 10) : m.monthlyPrice;
            const benefitsList = Array.isArray(m.benefits) 
              ? m.benefits 
              : (typeof m.benefits === 'string' ? m.benefits.split(',').map((b: string) => b.trim()) : []);

            return (
              <div 
                key={m._id || m.code} 
                className={`glass-card p-6 rounded-3xl flex flex-col justify-between space-y-6 transition-all bg-dark-800/80 ${
                  isGold 
                    ? 'border-2 border-rosegold-400 shadow-glow-rosegold scale-[1.02] relative' 
                    : 'border border-rosegold-500/30 hover:border-rosegold-500/60'
                }`}
              >
                {isGold && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full rosegold-gradient-bg text-dark-900 text-[10px] font-extrabold uppercase shadow-sm">
                    Most Popular VIP
                  </div>
                )}

                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rosegold-500/10 text-rosegold-300 text-xs font-bold border border-rosegold-500/30">
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span>{m.badge || m.name}</span>
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-white">{m.name}</h3>
                  <p className="text-xs text-gray-400">{m.tagline || 'Essential VIP privileges & special perks.'}</p>

                  <div className="pt-2">
                    <span className="text-3xl font-serif font-bold text-rosegold-400">
                      ₹{Number(price).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                    <span className="block text-[11px] text-green-400 font-bold mt-0.5">{m.discountPercentage}% Flat Discount On All Services</span>
                  </div>

                  <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs text-gray-300">
                    {benefitsList.map((b: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => router.push(`/membership/${m.code || m._id}`)}
                    className="w-full py-2.5 rounded-full bg-dark-900 text-gray-300 font-bold text-xs border border-white/10 hover:text-white hover:border-rosegold-400 transition-all cursor-pointer"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => router.push(`/membership/${m.code || m._id}`)}
                    className="w-full py-3 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    Buy {m.name} ({m.discountPercentage}% Off)
                  </button>
                </div>
              </div>
            );
          })}
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

