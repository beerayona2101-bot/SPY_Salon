'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Calendar, ShieldCheck, Award, ArrowRight, MapPin, CheckCircle2, Clock, Feather, ChevronDown } from 'lucide-react';
import CinematicImage from '@/components/common/CinematicImage';


export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const categories = [
    { name: 'Hair', icon: '✂️', desc: 'Styling, Keratin & Colors' },
    { name: 'Skin', icon: '✨', desc: '24K Gold Facials & Peels' },
    { name: 'Spa', icon: '🌿', desc: 'Swedish & Aromatherapy' },
    { name: 'Nails', icon: '💅', desc: 'Gel Couture Extensions' },
    { name: 'Bridal', icon: '👑', desc: 'HD Airbrush Makeover' },
    { name: 'Grooming', icon: '💈', desc: 'Beard & Steam Rituals' }
  ];

  const featuredServices = [
    {
      slug: '24k-royal-gold-glow-facial',
      title: '24K Royal Gold Glow Facial',
      category: 'Skin',
      price: '₹1,499',
      oldPrice: '₹1,999',
      time: '60 Min',
      rating: '4.9',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
      desc: 'Pure 24K gold foil infusion with hyaluronic acid for instant luminosity and smooth texture.'
    },
    {
      slug: 'signature-keratin-hair-spa',
      title: 'Signature Keratin Hair Spa',
      category: 'Hair',
      price: '₹2,199',
      oldPrice: '₹2,799',
      time: '75 Min',
      rating: '4.9',
      image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
      desc: 'Restores keratin protein, tames frizz, and creates long-lasting mirror-shine smoothness.'
    },
    {
      slug: 'aromatherapy-body-massage',
      title: 'Aromatherapy Body Massage',
      category: 'Spa',
      price: '₹2,499',
      oldPrice: '₹2,999',
      time: '90 Min',
      rating: '5.0',
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
      desc: 'Organic lavender essential oil pressure massage designed to release deep muscle tension.'
    }
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

  const stats = [
    { label: 'Satisfied Clients', value: '25,000+' },
    { label: 'Master Stylists', value: '45+' },
    { label: 'Luxury Studio', value: 'Jubilee Hills' },
    { label: 'Google Rating', value: '4.9 ⭐' }
  ];

  return (
    <div className="space-y-8 sm:space-y-14 pb-16">

      {/* ZERO-EMPTY-SPACE COMPACT HERO SECTION */}
      <section className="relative pt-2 sm:pt-2 pb-4 overflow-hidden">

        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] sm:w-[600px] h-[180px] sm:h-[300px] bg-rosegold-500/20 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none animate-ambient-glow" />
        <div className="absolute bottom-0 right-4 w-[200px] sm:w-[400px] h-[160px] sm:h-[260px] bg-purple-600/15 blur-[90px] sm:blur-[120px] rounded-full pointer-events-none animate-ambient-glow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
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
                  className="relative max-w-[220px] sm:max-w-[280px] w-full mx-auto"
                >
                  <img
                    src="/logo-mobile-transparent.png"
                    alt="SPY Salon Luxury Brand Identity"
                    className="w-full h-auto object-contain mx-auto drop-shadow-[0_0_20px_rgba(232,180,184,0.3)] animate-float"
                  />
                </motion.div>
              </div>

              {/* Tagline Badge */}
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-[11px] sm:text-xs font-semibold tracking-wider uppercase shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosegold-400 shrink-0 animate-pulse" />
                <span>Luxury Beauty Studio & Botanical Spa • Est. 2026</span>
              </motion.div>

              {/* Main Responsive Headline */}
              <motion.h1
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight font-serif"
              >
                Unveil Your <span className="rosegold-gradient-text">Radiant Beauty</span>
              </motion.h1>

              {/* Sub-description / Quote */}
              <motion.p
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-rosegold-300/90 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-serif italic"
              >
                “Beauty is not created—it is unveiled from within.”
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 pt-1 w-full"
              >
                <Link
                  href="/book"
                  className="flex-1 sm:flex-none px-3 sm:px-8 py-3 sm:py-4 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs sm:text-base shadow-glow-rosegold hover:scale-105 transition-all flex items-center justify-center space-x-1.5 sm:space-x-2.5 cursor-pointer relative overflow-hidden group whitespace-nowrap text-center"
                >
                  <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0" />
                  <span className="hidden sm:inline">Book Appointment Now</span>
                  <span className="sm:hidden">Book Appointment</span>
                </Link>

                <Link
                  href="/services"
                  className="flex-1 sm:flex-none px-3 sm:px-8 py-3 sm:py-4 rounded-full bg-dark-800 border border-white/15 text-white font-medium hover:border-rosegold-400 hover:bg-dark-700 transition-all flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-base cursor-pointer whitespace-nowrap text-center"
                >
                  <span className="hidden sm:inline">Explore Services Menu</span>
                  <span className="sm:hidden">Explore Services</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosegold-400 shrink-0" />
                </Link>
              </motion.div>

              {/* Quick Perks Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="pt-3 sm:pt-4 grid grid-cols-3 gap-2 sm:gap-4 border-t border-white/10 text-center sm:text-left"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-0.5 sm:space-y-0 sm:space-x-2 text-[11px] sm:text-sm text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosegold-400 shrink-0" />
                  <span>100% Sanitized</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-0.5 sm:space-y-0 sm:space-x-2 text-[11px] sm:text-sm text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosegold-400 shrink-0" />
                  <span>Verified Experts</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-0.5 sm:space-y-0 sm:space-x-2 text-[11px] sm:text-sm text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosegold-400 shrink-0" />
                  <span>Instant Slot Lock</span>
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

                  {/* Glowing Logo Frame on Desktop */}
                  <div className="relative w-48 h-48 sm:w-52 sm:h-52 mx-auto rounded-full bg-white p-3 border-4 border-rosegold-500/60 shadow-glow-rosegold flex items-center justify-center overflow-hidden transition-transform duration-500 hover:scale-105 animate-float">
                    <img
                      src="/logo-transparent.png"
                      alt="SPY Salon Luxury Brand Identity"
                      className="w-full h-full object-contain p-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-block text-[11px] font-bold tracking-[0.3em] uppercase text-rosegold-400">Official Brand Identity</span>
                    <h3 className="text-2xl font-serif font-bold text-white">SPY SALON</h3>
                    <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed">
                      Luxury Beauty, Dermal Aesthetics & Wellness Studio
                    </p>
                  </div>

                  {/* Award Floating Badge */}
                  <div className="glass-panel p-3.5 rounded-2xl border border-rosegold-500/30 flex items-center justify-between text-left text-xs hover:border-rosegold-400 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl rosegold-gradient-bg flex items-center justify-center text-dark-900 font-bold shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-serif font-semibold text-xs">Award-Winning Salon 2026</h4>
                        <p className="text-[11px] text-gray-400">Voted #1 Luxury Salon & Spa Studio</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

          </div>
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
          {stats.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="space-y-1 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-default"
            >
              <p className="text-xl sm:text-4xl font-bold font-serif rosegold-gradient-text">{item.value}</p>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">{item.label}</p>
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
              Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad, Telangana 500033
            </p>
            <div className="space-y-1 text-xs text-rosegold-400 font-medium">
              <p>📞 Concierge Desk: +91 98765 43210</p>
              <p>⏰ Hours: 09:00 AM – 09:00 PM (Every Day)</p>
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
          {[
            {
              id: 'emp1',
              name: 'Ananya Sharma',
              role: 'Senior Hair Stylist',
              mastery: 'Keratin Therapy & Balayage',
              exp: '8+ Yrs Exp',
              rating: '4.9 (140+ reviews)',
              image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
              badge: 'Hair Master'
            },
            {
              id: 'emp2',
              name: 'Rahul Verma',
              role: 'Barbering & Grooming Director',
              mastery: 'Royal Beard Sculpting & Haircuts',
              exp: '10+ Yrs Exp',
              rating: '4.9 (190+ reviews)',
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
              badge: 'Grooming Master'
            },
            {
              id: 'emp3',
              name: 'Priya Reddy',
              role: 'Senior Dermal Aesthetician',
              mastery: '24K Royal Gold Facial & Skin Therapy',
              exp: '9+ Yrs Exp',
              rating: '5.0 (210+ reviews)',
              image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80',
              badge: 'Aesthetics Master'
            },
            {
              id: 'emp4',
              name: 'Meera Kapoor',
              role: 'Lead Nail & Spa Therapist',
              mastery: 'Gel Couture & Aromatherapy Massage',
              exp: '7+ Yrs Exp',
              rating: '4.8 (115+ reviews)',
              image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
              badge: 'Nail & Spa Master'
            }
          ].map((item, idx) => (
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
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-full p-1 bg-gradient-to-tr from-rosegold-500 via-white/40 to-rosegold-300 shadow-glow-rosegold overflow-hidden group-hover:scale-105 transition-transform duration-500 my-2">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-full"
                  />
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
                  href="/book"
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
