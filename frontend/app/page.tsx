'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Sparkles, Star, Calendar, ShieldCheck, Award, ArrowRight, MapPin, CheckCircle2, Clock, Feather, ChevronDown } from 'lucide-react';
import CinematicImage from '@/components/common/CinematicImage';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { SharedAxisZ } from '@/components/ui/shared-axis-z';
import { AnimatedButton } from '@/components/ui/animated-button';

import { API_BASE_URL } from '@/lib/api';

// Fast Count-Up Animated Number Counter Component
function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-20px' });
  const [displayVal, setDisplayVal] = useState<string>('0');

  useEffect(() => {
    if (!isInView) {
      setDisplayVal('0');
      return;
    }

    // Match numbers, decimals, commas, and non-numeric prefixes/suffixes
    const match = value.match(/^([^\d.]*)([\d,.]+)(.*)$/);

    if (!match) {
      setDisplayVal(value);
      return;
    }

    const prefix = match[1] || '';
    const numStr = match[2].replace(/,/g, '');
    const suffix = match[3] || '';
    const targetNum = parseFloat(numStr);

    if (isNaN(targetNum)) {
      setDisplayVal(value);
      return;
    }

    const isDecimal = numStr.includes('.');
    const decimals = isDecimal ? (numStr.split('.')[1]?.length || 1) : 0;

    let startTime: number | null = null;
    const duration = 1200; // 1.2s fast dynamic count-up animation
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Fast cubic ease-out curve for rapid initial acceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentNum = targetNum * easeProgress;

      let formattedNum = '';
      if (isDecimal) {
        formattedNum = currentNum.toFixed(decimals);
      } else {
        formattedNum = Math.floor(currentNum).toLocaleString('en-US');
      }

      setDisplayVal(`${prefix}${formattedNum}${suffix}`);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        const finalFormatted = isDecimal 
          ? targetNum.toFixed(decimals) 
          : targetNum.toLocaleString('en-US');
        setDisplayVal(`${prefix}${finalFormatted}${suffix}`);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, value]);

  return <span ref={ref}>{displayVal}</span>;
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [homeSettings, setHomeSettings] = useState<any>({
    heroTitle: 'Hairs make perfectly',
    heroSubtitle: 'Style come from the hair style',
    announcementActive: true,
    announcement: '✨ Festival Special: Enjoy 25% Off on All Luxury Bridal & Skin Care Packages! Use Code: LUXURY25',
    hotlinePhone: '+91 94906 44434',
    supportEmail: 'concierge@spysalon.com',
    openingHours: 'Mon - Sun: 09:00 AM - 09:00 PM',
    studioAddress: 'Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad, Telangana 500033',
    stats: [
      { label: 'Satisfied Clients', value: '25,000+' },
      { label: 'Master Stylists', value: '45+' },
      { label: 'Luxury Studio', value: 'Jubilee Hills' },
      { label: 'Google Rating', value: '4.9 ⭐' }
    ]
  });

  useEffect(() => {
    const parseSettings = (p: any) => {
      let rawTitle = p.heroTitle || 'Hairs make perfectly';
      if (rawTitle === 'Hairs make perfect' || rawTitle === 'Unveil Your Radiant Beauty') {
        rawTitle = 'Hairs make perfectly';
      }
      return {
        heroTitle: rawTitle,
        heroSubtitle: p.heroSubtitle || 'Style come from the hair style',
        announcementActive: p.announcementActive !== undefined ? p.announcementActive : true,
        announcement: p.announcement || '✨ Festival Special: Enjoy 25% Off on All Luxury Bridal & Skin Care Packages!',
        hotlinePhone: p.hotlinePhone || '+91 94906 44434',
        supportEmail: p.supportEmail || 'concierge@spysalon.com',
        openingHours: p.openingHours || 'Mon - Sun: 09:00 AM - 09:00 PM',
        studioAddress: p.studioAddress || 'Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad, Telangana 500033',
        stats: [
          { label: p.stat1Label || 'Satisfied Clients', value: p.stat1Value || '25,000+' },
          { label: p.stat2Label || 'Master Stylists', value: p.stat2Value || '45+' },
          { label: p.stat3Label || 'Luxury Studio', value: p.stat3Value || 'Jubilee Hills' },
          { label: p.stat4Label || 'Google Rating', value: p.stat4Value || '4.9 ⭐' }
        ]
      };
    };

    const loadSettings = async () => {
      // 1. Immediately apply cached local settings to avoid any flicker
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('spy_landing_settings');
        if (stored) {
          try {
            const p = JSON.parse(stored);
            setHomeSettings(parseSettings(p));
          } catch (e) {}
        }
      }

      // 2. Fetch fresh landing settings from server
      try {
        const res = await fetch(`${API_BASE_URL}/landing-settings`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          const p = json.data;
          setHomeSettings(parseSettings(p));
          if (typeof window !== 'undefined') {
            localStorage.setItem('spy_landing_settings', JSON.stringify(p));
          }
        }
      } catch (e) {}
    };

    loadSettings();
    window.addEventListener('storage', loadSettings);

    if (socket) {
      socket.on('landing_settings_updated', (p: any) => {
        if (p) {
          setHomeSettings(parseSettings(p));
        }
      });
    }

    return () => {
      window.removeEventListener('storage', loadSettings);
      if (socket) {
        socket.off('landing_settings_updated');
      }
    };
  }, [socket]);

  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'manager') {
        router.push('/admin');
      } else if (user.role === 'employee' || user.role === 'receptionist') {
        router.push('/employee');
      }
    }
  }, [user, router]);

  const loadFeaturedServices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/services`);
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
        const popular = data.data.filter((s: any) => s.isPopular).slice(0, 6);
        const listToDisplay = popular.length > 0 ? popular : data.data.slice(0, 6);
        setFeaturedServices(listToDisplay.map((s: any) => ({
          id: s._id || s.id,
          slug: s._id || s.id || s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: s.name,
          category: s.category,
          price: `₹${s.price}`,
          oldPrice: s.discountPrice && s.discountPrice < s.price ? `₹${s.discountPrice}` : undefined,
          time: `${s.durationMinutes || 60} Min`,
          rating: String(s.rating || 4.9),
          image: s.image || '',
          desc: s.description || 'Luxury professional salon treatment at SPY Salon.'
        })));
      } else {
        setFeaturedServices([]);
      }
    } catch (err) {
      console.error('Error loading featured services from MongoDB:', err);
    }
  };

  const loadSpecialists = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/specialists`);
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data)) {
        const mapped = data.data.map((emp: any, idx: number) => {
          const mastery = emp.specialties?.length > 1 
            ? emp.specialties.slice(1).join(' & ') 
            : (emp.specialties?.[0] || 'Luxury Treatments');
          
          const badges = ['Hair Master', 'Grooming Master', 'Aesthetics Master', 'Nail & Spa Master'];
          const exps = ['8+ Yrs Exp', '10+ Yrs Exp', '9+ Yrs Exp', '7+ Yrs Exp'];
          const ratings = ['4.9 (140+ reviews)', '4.9 (190+ reviews)', '5.0 (210+ reviews)', '4.8 (115+ reviews)'];

          return {
            id: emp._id || emp.id,
            name: emp.name,
            role: emp.specialties?.[0] || 'Specialist',
            mastery: mastery,
            exp: exps[idx % exps.length],
            rating: ratings[idx % ratings.length],
            image: emp.avatar || '',
            badge: badges[idx % badges.length]
          };
        });
        setSpecialists(mapped);
      }
    } catch (err) {
      console.error('Error loading specialists:', err);
    }
  };

  useEffect(() => {
    loadFeaturedServices();
    loadSpecialists();

    if (!socket) return;

    socket.on('service:created', loadFeaturedServices);
    socket.on('service:updated', loadFeaturedServices);
    socket.on('service:deleted', loadFeaturedServices);
    socket.on('employee:created', loadSpecialists);
    socket.on('employee:updated', loadSpecialists);
    socket.on('employee:deleted', loadSpecialists);

    return () => {
      socket.off('service:created', loadFeaturedServices);
      socket.off('service:updated', loadFeaturedServices);
      socket.off('service:deleted', loadFeaturedServices);
      socket.off('employee:created', loadSpecialists);
      socket.off('employee:updated', loadSpecialists);
      socket.off('employee:deleted', loadSpecialists);
    };
  }, [socket]);

  const categories = [
    { name: 'Hair', icon: '✂️', desc: 'Styling, Keratin & Colors' },
    { name: 'Skin', icon: '✨', desc: '24K Gold Facials & Peels' },
    { name: 'Spa', icon: '🌿', desc: 'Swedish & Aromatherapy' },
    { name: 'Nails', icon: '💅', desc: 'Gel Couture Extensions' },
    { name: 'Bridal', icon: '👑', desc: 'HD Airbrush Makeover' },
    { name: 'Grooming', icon: '💈', desc: 'Beard & Steam Rituals' }
  ];

  const faqs = [
    {
      q: 'Do I need to book an appointment in advance?',
      a: 'Walk-in guests are always welcome, but booking online in advance guarantees an immediate reserved slot lock with zero wait time and access to exclusive VIP discounts.'
    },
    {
      q: 'Are single-use disposable kits provided for every client?',
      a: 'Yes, 100%. Every guest receives vacuum-sealed disposable aprons, fresh single-use towels, and 3-stage UV autoclave sterilized stainless steel salon tools.'
    },
    {
      q: 'Can I customize bridal or pre-wedding spa packages?',
      a: 'Absolutely! Our master artists offer complimentary skin & hair consultations to craft personalized pre-bridal packages tailored precisely to your event schedule.'
    },
    {
      q: 'What is your cancellation and rescheduling policy?',
      a: 'You can easily reschedule or cancel your appointment free of charge up to 2 hours prior to your scheduled slot by calling our concierge desk or through your VIP account dashboard.'
    }
  ];

  return (
    <div className="space-y-8 sm:space-y-14 pb-16">

      {/* ZERO-EMPTY-SPACE COMPACT HERO SECTION */}
      <section className="hero-section-container relative pt-2 sm:pt-2 pb-4 overflow-hidden">

        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] sm:w-[600px] h-[180px] sm:h-[300px] bg-rosegold-500/20 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none animate-ambient-glow" />
        <div className="absolute bottom-0 right-4 w-[200px] sm:w-[400px] h-[160px] sm:h-[260px] bg-purple-600/15 blur-[90px] sm:blur-[120px] rounded-full pointer-events-none animate-ambient-glow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <SharedAxisZ>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

            {/* Left / Center Hero Content */}
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left"
            >

              {/* Mobile, Tablet & iPad Brand Logo Showcase Image */}
              <div className="lg:hidden flex justify-center pt-3 sm:pt-2 pb-2">
                <motion.div
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-3xl bg-dark-850/80 border border-rosegold-500/35 p-3 shadow-glow-rosegold backdrop-blur-md flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="/logo-mobile-transparent.png?v=3"
                    alt="SPY Salon Luxury Brand Identity"
                    className="w-full h-full object-contain rounded-2xl mx-auto animate-float"
                  />
                </motion.div>
              </div>

              {/* Tagline Badge */}
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-[11px] sm:text-xs font-semibold tracking-wider uppercase shadow-sm hero-tagline-badge"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse hero-tagline-star" />
                <span className="hero-tagline-text font-bold">Luxury Beauty Studio & Botanical Spa • Est. 2026</span>
              </motion.div>

              {/* Main Responsive Headline */}
              <motion.h1
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                className="hero-title-text text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight !text-white leading-tight font-serif"
              >
                {homeSettings.heroTitle}
              </motion.h1>

              {/* Sub-description / Quote */}
              <motion.p
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ color: '#FFF2E2', WebkitTextFillColor: '#FFF2E2' }}
                className="hero-subtitle-text text-rosegold-300/90 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-serif italic"
              >
                {homeSettings.heroSubtitle}
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 pt-1 w-full"
              >
                <AnimatedButton
                  as={Link}
                  href={user ? "/book" : "/login?redirect=/book"}
                  className="hero-cta-btn flex-1 sm:flex-none px-3 sm:px-8 py-3 sm:py-4 rounded-full rosegold-gradient-bg !text-white font-bold text-xs sm:text-base shadow-glow-rosegold hover:scale-105 transition-all flex items-center justify-center space-x-1.5 sm:space-x-2.5 cursor-pointer relative overflow-hidden group whitespace-nowrap text-center"
                >
                  <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0 !text-white" />
                  <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }} className="hidden sm:inline !text-white font-bold">Book Appointment Now</span>
                  <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }} className="sm:hidden !text-white font-bold">Book Appointment</span>
                </AnimatedButton>

                <AnimatedButton
                  as={Link}
                  href="/services"
                  className="hero-secondary-btn flex-1 sm:flex-none px-3 sm:px-8 py-3 sm:py-4 rounded-full bg-dark-800 border border-white/15 !text-white font-medium hover:border-rosegold-400 hover:bg-dark-700 transition-all flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-base cursor-pointer whitespace-nowrap text-center"
                >
                  <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }} className="hidden sm:inline !text-white font-semibold">Explore Services Menu</span>
                  <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }} className="sm:hidden !text-white font-semibold">Explore Services</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosegold-400 shrink-0" />
                </AnimatedButton>
              </motion.div>

              {/* Quick Perks Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="hero-perk-text pt-3 sm:pt-4 grid grid-cols-3 gap-2 sm:gap-4 border-t border-white/10 text-center sm:text-left"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-0.5 sm:space-y-0 sm:space-x-2 text-[11px] sm:text-sm text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosegold-400 shrink-0" />
                  <span style={{ color: '#F3ECE2', WebkitTextFillColor: '#F3ECE2' }} className="font-semibold">100% Sanitized</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-0.5 sm:space-y-0 sm:space-x-2 text-[11px] sm:text-sm text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosegold-400 shrink-0" />
                  <span style={{ color: '#F3ECE2', WebkitTextFillColor: '#F3ECE2' }} className="font-semibold">Verified Experts</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-0.5 sm:space-y-0 sm:space-x-2 text-[11px] sm:text-sm text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosegold-400 shrink-0" />
                  <span style={{ color: '#F3ECE2', WebkitTextFillColor: '#F3ECE2' }} className="font-semibold">Instant Slot Lock</span>
                </div>
              </motion.div>

            </motion.div>

            {/* Desktop Web Responsive Feature Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="rosegold-glass-card rounded-3xl p-6 overflow-hidden relative shadow-2xl space-y-5 text-center border border-rosegold-500/30 hover-lift">

                  <div className="relative w-48 h-48 sm:w-52 sm:h-52 mx-auto rounded-full bg-white p-1 border-4 border-rosegold-500/60 shadow-glow-rosegold flex items-center justify-center overflow-hidden transition-transform duration-500 hover:scale-105 animate-float">
                    <img
                      src="/logo-transparent.png?v=3"
                      alt="SPY Salon Luxury Brand Identity"
                      className="w-full h-full object-contain p-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-block text-[11px] font-bold tracking-[0.3em] uppercase text-rosegold-400 brand-identity-tag">Official Brand Identity</span>
                    <h3 className="text-2xl font-serif font-bold text-white brand-identity-title">SPY Salon</h3>
                    <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed brand-identity-desc">
                      Luxury Beauty, Dermal Aesthetics & Wellness Studio
                    </p>
                  </div>

                  {/* Award Floating Badge */}
                  <div className="glass-panel p-3.5 rounded-2xl border border-rosegold-500/30 flex items-center justify-between text-left text-xs hover:border-rosegold-400 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl rosegold-gradient-bg flex items-center justify-center text-white font-bold shrink-0">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-serif font-semibold text-xs award-badge-title">Award-Winning Salon 2026</h4>
                        <p className="text-[11px] text-gray-400 award-badge-desc">Voted #1 Luxury Salon & Spa Studio</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

            </div>
          </SharedAxisZ>
        </div>
      </section>

      {/* STATS BANNER WITH SCROLL REVEAL */}
      <motion.section
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="glass-panel rounded-2xl p-5 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center border border-rosegold-500/20 shadow-xl">
          {homeSettings.stats.map((item: any, idx: number) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="space-y-1 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-default"
            >
              <p className="text-xl sm:text-4xl font-bold font-serif rosegold-gradient-text">
                <AnimatedCounter value={item.value} />
              </p>
              <p className="text-xs sm:text-sm text-gray-400 font-semibold leading-relaxed py-0.5">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* SERVICE CATEGORIES WITH SCROLL REVEAL & HOVER LIFT */}
      <motion.section
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8"
      >
        <div className="text-center space-y-2">
          <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest">Tailored Experience</span>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white">Signature Categories</h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto">Discover premium treatments curated to pamper your hair, skin, and wellness.</p>
        </div>

        {/* Mobile & Tablet Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={`/services?cat=${cat.name}`}
                className="glass-card p-4 sm:p-5 rounded-2xl text-center space-y-2.5 hover:border-rosegold-500 transition-all group cursor-pointer border border-rosegold-500/20 flex flex-col items-center justify-center h-full shadow-lg"
              >
                <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">{cat.icon}</div>
                <div>
                  <h3 className="text-white font-semibold text-sm sm:text-base font-serif group-hover:text-rosegold-400 transition-colors">{cat.name}</h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 leading-tight">{cat.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* FEATURED SERVICES WITH SCROLL REVEAL & STAGGER */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1 sm:space-y-2">
            <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest">Handpicked Favorites</span>
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white">Featured Treatments</h2>
          </div>
          <Link href="/services" className="text-rosegold-400 hover:text-white text-xs sm:text-sm font-semibold flex items-center space-x-1 group">
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {featuredServices.length === 0 ? (
          <div className="p-10 text-center glass-card rounded-3xl border border-white/10 space-y-3 max-w-lg mx-auto">
            <Sparkles className="w-8 h-8 text-rosegold-400 mx-auto opacity-60" />
            <h4 className="text-white font-serif font-bold text-base">No Featured Treatments Added Yet</h4>
            <p className="text-xs text-gray-400">
              Only active treatment services added to MongoDB via the Admin Dashboard will display here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredServices.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ y: -6 }}
              >
                <Link
                  href={`/services/${service.slug}`}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-rosegold-400 transition-all cursor-pointer border border-rosegold-500/20 h-full shadow-lg"
                >
                  <div className="relative h-52 sm:h-48 overflow-hidden block">
                    <CinematicImage
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover"
                      duration={18}
                    />
                    <div className="absolute top-3 right-3 bg-dark-900/85 backdrop-blur-md px-2.5 py-1 rounded-full text-xs text-rosegold-400 font-bold flex items-center space-x-1 border border-rosegold-500/30 shadow-md z-10">
                      <Star className="w-3.5 h-3.5 fill-rosegold-400" />
                      <span>{service.rating}</span>
                    </div>
                    <div className="absolute top-3 left-3 bg-purple-600/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md z-10">
                      {service.category} Ritual
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-grow text-left">
                    <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                      <span>Duration: {service.time}</span>
                    </div>

                    <h3 className="text-white font-serif text-lg font-bold leading-snug group-hover:text-rosegold-400 transition-colors">{service.title}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{service.desc}</p>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-white/10 mt-auto pt-4">
                    <div>
                      <span className="text-rosegold-400 text-lg font-bold font-serif">{service.price}</span>
                      <span className="text-gray-500 text-xs line-through ml-1.5">{service.oldPrice}</span>
                    </div>

                    <span className="px-4 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs group-hover:opacity-90 transition-opacity shadow-sm">
                      View Details →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest">Got Questions?</span>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white">Frequently Asked Questions</h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto">Click any question below to view answers in the dropdown container.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl border border-rosegold-500/30 overflow-hidden transition-all text-left"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none cursor-pointer group"
                >
                  <span className="font-serif font-bold text-white text-sm sm:text-base group-hover:text-rosegold-400 transition-colors pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-rosegold-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="faq-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-gray-300 border-t border-rosegold-500/20 pt-3 leading-relaxed font-light">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* STUDIO LOCATION PREVIEW */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8"
      >
        <div className="text-center space-y-2">
          <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest">Our Studio Location</span>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white">Visit Our Flagship Studio</h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto">Equipped with state-of-the-art styling chairs, private VIP spa suites, and hospital-grade sterilization.</p>
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center hover-lift">
          <div className="space-y-4 text-left">
            <div className="w-12 h-12 rounded-2xl rosegold-gradient-bg flex items-center justify-center text-dark-900 font-bold shadow-md">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-white font-serif text-xl sm:text-2xl font-bold">SPY Salon Flagship Studio</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {homeSettings.studioAddress}
            </p>
            <div className="space-y-1 text-xs text-rosegold-400 font-medium">
              <p>📞 Concierge Desk: {homeSettings.hotlinePhone}</p>
              <p>⏰ Hours: {homeSettings.openingHours}</p>
            </div>
            <Link href="/contact" className="inline-block w-full sm:w-auto text-center px-5 py-3 rounded-xl bg-dark-800 border border-white/15 text-white font-semibold text-xs hover:border-rosegold-400 transition-colors">
              Get Directions & Details →
            </Link>
          </div>

          <div className="h-56 rounded-2xl overflow-hidden border border-white/10 relative">
            <CinematicImage
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"
              alt="SPY Salon Luxury Interior"
              className="w-full h-full object-cover"
              duration={16}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent z-10" />
            <span className="absolute bottom-3 left-3 bg-dark-900/90 text-rosegold-400 text-[10px] font-bold px-3 py-1 rounded-full border border-rosegold-500/30 z-10">
              Jubilee Hills Flagship
            </span>
          </div>
        </div>
      </motion.section>

      {/* MASTER SPECIALISTS & STYLISTS SECTION */}
      {specialists.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-rosegold-500/30 text-rosegold-400 text-xs font-semibold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-rosegold-400" />
              <span>Certified Artisans & Experts</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white">
              Meet Our <span className="rosegold-gradient-text">Master Specialists</span>
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
              Our internationally trained master stylists and aesthetic directors bring decades of combined craftsmanship to deliver personalized luxury beauty rituals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {specialists.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -6, scale: 1.025 }}
                className="rosegold-glass-card rounded-3xl p-5 border border-rosegold-500/30 hover:border-rosegold-400 transition-all duration-300 group shadow-xl flex flex-col justify-between text-center relative overflow-hidden h-full"
              >
                {/* Top Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full rosegold-gradient-bg text-dark-900 shadow-sm">
                    {item.badge}
                  </span>
                </div>

                <div>
                  {/* Specialist Avatar / Image */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-full p-1 bg-gradient-to-tr from-rosegold-500 via-white/40 to-rosegold-300 shadow-glow-rosegold overflow-hidden group-hover:scale-105 transition-transform duration-500 my-2 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-dark-800 flex items-center justify-center text-rosegold-400 text-2xl font-bold font-serif brand-profile-avatar">
                        {item.name ? item.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'SP'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 mt-3">
                    <h3 className="text-lg font-serif font-bold text-white group-hover:text-rosegold-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-rosegold-400 font-semibold font-sans">
                      {item.role}
                    </p>

                    {/* Master in box */}
                    <div className="bg-dark-800/90 rounded-2xl p-2.5 border border-white/10 mt-3 space-y-1 text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Master Specialty:</span>
                      <p className="text-xs text-gray-200 font-medium leading-snug">
                        ✨ {item.mastery}
                      </p>
                    </div>

                    {/* Rating & Experience Tag */}
                    <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-gray-300 font-medium">
                      <span className="flex items-center space-x-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                        <span>{item.rating}</span>
                      </span>
                      <span className="text-rosegold-400 font-semibold bg-rosegold-500/10 px-2 py-0.5 rounded-full border border-rosegold-500/20">
                        {item.exp}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Link */}
                <div className="pt-4 mt-4 border-t border-white/10">
                  <Link
                    href={`/book?specialist=${encodeURIComponent(item.name)}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-dark-800 hover:bg-rosegold-500/20 text-gray-200 hover:text-white border border-rosegold-500/30 text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-rosegold-400" />
                    <span>Book Appointment</span>
                  </Link>
                </div>

              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* CTA BANNER */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="glass-card rounded-3xl p-6 sm:p-12 relative overflow-hidden bg-gradient-to-r from-purple-900/40 via-dark-800 to-dark-900 border border-rosegold-500/40 text-center space-y-5 shadow-2xl animate-pulse-glow">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-5xl font-bold font-serif text-white">Ready for a Premium Experience?</h2>
            <p className="text-gray-300 text-xs sm:text-base font-light">Book your slot online in under 30 seconds and receive instant SMS & WhatsApp confirmation.</p>
            <div className="pt-2">
              <Link
                href="/book"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm sm:text-base shadow-glow-rosegold-lg hover:scale-105 transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                <Calendar className="w-5 h-5" />
                <span>Book Your Appointment</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

    </div>
  );
}

