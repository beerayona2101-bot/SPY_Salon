'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Star, Calendar, ShieldCheck, Award, ArrowRight, MapPin, CheckCircle2, Clock, Feather } from 'lucide-react';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('Hair');

  const categories = [
    { name: 'Hair', icon: '✂️', desc: 'Styling, Hair Spa, Keratin & Colors' },
    { name: 'Skin', icon: '✨', desc: '24K Gold Facials, Peels & Cleanups' },
    { name: 'Spa', icon: '🌿', desc: 'Swedish, Deep Tissue & Aromatherapy' },
    { name: 'Nails', icon: '💅', desc: 'Gel Extensions, Art & Couture Care' },
    { name: 'Bridal', icon: '👑', desc: 'HD Makeup, Draping & Pre-Bridal' },
    { name: 'Grooming', icon: '💈', desc: 'Beard Sculpting & Men Rituals' }
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
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
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
      image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
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
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80',
      desc: 'Organic lavender essential oil pressure massage designed to release deep muscle tension.'
    }
  ];

  const stats = [
    { label: 'Satisfied Clients', value: '25,000+' },
    { label: 'Master Stylists', value: '45+' },
    { label: 'Luxury Studio', value: 'Jubilee Hills' },
    { label: 'Google Rating', value: '4.9 ⭐' }
  ];

  return (
    <div className="space-y-20 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative min-h-[88vh] flex items-center justify-center pt-8 overflow-hidden">
        {/* Rose Gold Background Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-rosegold-500/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[320px] bg-purple-600/15 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Text */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              {/* Mobile Only Brand Emblem & Logo (Centered Above Heading - Transparent) */}
              <div className="sm:hidden flex items-center justify-center mb-2">
                <img 
                  src="/logo-transparent.png" 
                  alt="SPY Salon Luxury Brand" 
                  className="w-48 sm:w-56 h-auto object-contain drop-shadow-md"
                />
              </div>

              {/* Tagline Badge (Desktop Only) */}
              <div className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-medium tracking-wide uppercase">
                <Sparkles className="w-4 h-4 text-rosegold-400" />
                <span>Bespoke Beauty & Botanical Spa Rituals • Est. 2026</span>
              </div>

              {/* Responsive Headline */}
              <h1 className="text-2xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-serif">
                <span className="sm:hidden">Unveil Your <span className="rosegold-gradient-text">Radiant Beauty</span></span>
                <span className="hidden sm:inline">Unveil Your <span className="rosegold-gradient-text">Radiant Beauty</span> & Timeless Elegance</span>
              </h1>

              {/* Responsive Sub-description */}
              <p className="text-gray-300 text-xs sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                <span className="sm:hidden">Experience luxury hair transformations, 24K gold skin rituals, and soothing spa therapies.</span>
                <span className="hidden sm:inline">Experience luxury hair transformations, 24K gold dermal skin therapies, and soothing aromatherapy crafted by master artists in a botanical rose-gold atmosphere.</span>
              </p>

              {/* Action Buttons (Side by Side in One Line) */}
              <div className="flex flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-4 pt-2">
                <Link
                  href="/book"
                  className="flex-1 sm:flex-none px-3.5 sm:px-8 py-3 sm:py-4 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs sm:text-base shadow-glow-rosegold hover:scale-105 transition-all flex items-center justify-center space-x-1.5 sm:space-x-3 whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0" />
                  <span className="sm:hidden">Book Appointment</span>
                  <span className="hidden sm:inline">Book Appointment Now</span>
                </Link>

                <Link
                  href="/services"
                  className="flex-1 sm:flex-none px-3.5 sm:px-8 py-3 sm:py-4 rounded-full bg-dark-800 border border-white/15 text-white font-medium hover:border-rosegold-400 transition-colors flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-base whitespace-nowrap"
                >
                  <span className="sm:hidden">Explore Services</span>
                  <span className="hidden sm:inline">Explore Services Menu</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosegold-400 shrink-0" />
                </Link>
              </div>

              {/* Quick Perks */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 text-left">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" />
                  <span>100% Sanitized</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" />
                  <span>Verified Experts</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" />
                  <span>Instant Slot Lock</span>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Card Showcase (Desktop Only) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="rosegold-glass-card rounded-3xl p-6 overflow-hidden relative shadow-2xl space-y-6 text-center">
                  
                  {/* Glowing Logo Frame */}
                  <div className="relative w-44 h-44 mx-auto rounded-full bg-white p-3 border-2 border-rosegold-500/60 shadow-glow-rosegold flex items-center justify-center">
                    <img 
                      src="/logo.png" 
                      alt="SPY Salon Luxury Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-block text-[11px] font-bold tracking-[0.3em] uppercase text-rosegold-400">Official Brand Identity</span>
                    <h3 className="text-2xl font-serif font-bold text-white">SPY SALON</h3>
                    <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed">
                      Luxury Beauty, Dermal Aesthetics & Wellness Studio
                    </p>
                  </div>

                  {/* Floating Badge */}
                  <div className="glass-panel p-3.5 rounded-2xl border border-rosegold-500/30 flex items-center justify-between text-left text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl rosegold-gradient-bg flex items-center justify-center text-dark-900 font-bold shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-serif font-semibold text-xs">Award-Winning Salon 2026</h4>
                        <p className="text-[11px] text-gray-400">Voted #1 Luxury Salon Studio</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center border border-rosegold-500/20">
          {stats.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-2xl sm:text-4xl font-bold font-serif rosegold-gradient-text">{item.value}</p>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICE CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest">Tailored Experience</span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">Our Signature Categories</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">Discover premium treatments curated to pamper your hair, skin, and wellness.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/services?cat=${cat.name}`}
              className="glass-card p-5 rounded-2xl text-center space-y-3 hover:border-rosegold-500 transition-all group cursor-pointer"
            >
              <div className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</div>
              <div>
                <h3 className="text-white font-semibold text-base font-serif group-hover:text-rosegold-400 transition-colors">{cat.name}</h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-tight">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest">Handpicked Favorites</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">Featured Luxury Treatments</h2>
          </div>
          <Link href="/services" className="text-rosegold-400 hover:text-white text-sm font-semibold flex items-center space-x-1">
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredServices.map((service, i) => (
            <Link 
              key={i} 
              href={`/services/${service.slug}`}
              className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-rosegold-400 transition-all cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden block">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute top-3 right-3 bg-dark-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs text-rosegold-400 font-bold flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-rosegold-400" />
                  <span>{service.rating}</span>
                </div>
                <div className="absolute top-3 left-3 bg-purple-600/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                  {service.category}
                </div>
              </div>

              <div className="p-5 space-y-3 flex-grow">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                    <span>{service.time}</span>
                  </span>
                </div>

                <h3 className="text-white font-serif text-lg font-semibold leading-snug group-hover:text-rosegold-400 transition-colors">{service.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{service.desc}</p>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-white/10 mt-auto pt-4">
                <div>
                  <span className="text-rosegold-400 text-lg font-bold font-serif">{service.price}</span>
                  <span className="text-gray-500 text-xs line-through ml-1.5">{service.oldPrice}</span>
                </div>
                
                <span className="px-4 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs group-hover:opacity-90 transition-opacity">
                  Book Treatment
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SINGLE LUXURY STUDIO LOCATION PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest">Our Studio Location</span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">Visit Our Flagship Studio</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">Equipped with state-of-the-art styling chairs, private VIP spa suites, and hospital-grade sterilization.</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-rosegold-500/30 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4 text-left">
            <div className="w-12 h-12 rounded-2xl rosegold-gradient-bg flex items-center justify-center text-dark-900 font-bold shadow-md">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-white font-serif text-2xl font-bold">SPY Salon Flagship Studio</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad, Telangana 500033
            </p>
            <div className="space-y-1 text-xs text-rosegold-400 font-medium">
              <p>📞 Concierge Desk: +91 98765 43210</p>
              <p>⏰ Hours: 09:00 AM – 09:00 PM (Every Day)</p>
            </div>
            <Link href="/contact" className="inline-block px-5 py-2.5 rounded-xl bg-dark-800 border border-white/15 text-white font-semibold text-xs hover:border-rosegold-400 transition-colors">
              Get Directions & Details →
            </Link>
          </div>

          <div className="h-56 rounded-2xl overflow-hidden border border-white/10 relative">
            <img 
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80" 
              alt="SPY Salon Luxury Interior" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 bg-dark-900/90 text-rosegold-400 text-[10px] font-bold px-3 py-1 rounded-full border border-rosegold-500/30">
              Jubilee Hills Flagship
            </span>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US / THE SPY GOLD STANDARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest">Unmatched Luxury</span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">The SPY Gold Standard</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">We redefine beauty care through uncompromising hygiene, botanical organic ingredients, and master artistry.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-3 border border-rosegold-500/20 hover:border-rosegold-400 transition-all">
            <div className="w-12 h-12 rounded-xl rosegold-gradient-bg flex items-center justify-center text-dark-900 font-bold shadow-md">
              <Feather className="w-6 h-6" />
            </div>
            <h3 className="text-white font-serif text-lg font-bold">100% Organic Extracts</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Infused with dermatologically tested botanical oils, 24K gold foil, and zero harsh parabens or sulfates.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 border border-rosegold-500/20 hover:border-rosegold-400 transition-all">
            <div className="w-12 h-12 rounded-xl rosegold-gradient-bg flex items-center justify-center text-dark-900 font-bold shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-white font-serif text-lg font-bold">Master Artists</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Certified by top international beauty academies with over 10+ years of high-end styling experience.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 border border-rosegold-500/20 hover:border-rosegold-400 transition-all">
            <div className="w-12 h-12 rounded-xl rosegold-gradient-bg flex items-center justify-center text-dark-900 font-bold shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-white font-serif text-lg font-bold">Autoclave Sterilized</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Every tool undergoes 3-stage UV & steam sterilization with sealed disposable single-use gowns for each client.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 border border-rosegold-500/20 hover:border-rosegold-400 transition-all">
            <div className="w-12 h-12 rounded-xl rosegold-gradient-bg flex items-center justify-center text-dark-900 font-bold shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-white font-serif text-lg font-bold">Private VIP Suites</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Soundproof private spa chambers featuring ambient aroma therapy, heated therapy loungers, and music choice.
            </p>
          </div>
        </div>
      </section>

      {/* CLIENT TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest">Real Customer Stories</span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">Loved By Thousands</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">Read authentic reviews from our cherished clientele across Hyderabad.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between border border-white/10">
            <div className="space-y-3">
              <div className="flex items-center space-x-1 text-rosegold-400">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-rosegold-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed">
                "The 24K Gold facial left my skin glowing for weeks before my wedding! The private spa suite feels like a 7-star luxury resort."
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-3 border-t border-white/10">
              <div className="w-9 h-9 rounded-full rosegold-gradient-bg text-dark-900 font-bold flex items-center justify-center text-xs">
                AS
              </div>
              <div>
                <h4 className="text-white text-xs font-bold font-serif">Ananya Sharma</h4>
                <p className="text-[10px] text-rosegold-400">Verified Client • Jubilee Hills</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between border border-white/10">
            <div className="space-y-3">
              <div className="flex items-center space-x-1 text-rosegold-400">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-rosegold-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed">
                "Best Keratin treatment in town! My hair feels silky smooth with zero damage. Master Stylist listened to exactly what I wanted."
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-3 border-t border-white/10">
              <div className="w-9 h-9 rounded-full rosegold-gradient-bg text-dark-900 font-bold flex items-center justify-center text-xs">
                RV
              </div>
              <div>
                <h4 className="text-white text-xs font-bold font-serif">Rohan Verma</h4>
                <p className="text-[10px] text-rosegold-400">Verified Client • Gachibowli</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between border border-white/10">
            <div className="space-y-3">
              <div className="flex items-center space-x-1 text-rosegold-400">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-rosegold-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed">
                "Extremely hygienic, attentive master artists, and a stunning rose gold atmosphere. SPY Salon is hands-down my go-to beauty studio."
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-3 border-t border-white/10">
              <div className="w-9 h-9 rounded-full rosegold-gradient-bg text-dark-900 font-bold flex items-center justify-center text-xs">
                PR
              </div>
              <div>
                <h4 className="text-white text-xs font-bold font-serif">Priya Reddy</h4>
                <p className="text-[10px] text-rosegold-400">Verified Client • Banjara Hills</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest">Got Questions?</span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-rosegold-500/20 space-y-2">
            <h3 className="text-white font-serif font-bold text-sm sm:text-base flex items-center justify-between">
              <span>Do I need to book an appointment in advance?</span>
              <CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" />
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light">
              Walk-in guests are always welcome, but booking online in advance guarantees immediate slot lock with zero wait time and access to online exclusive discounts.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-rosegold-500/20 space-y-2">
            <h3 className="text-white font-serif font-bold text-sm sm:text-base flex items-center justify-between">
              <span>Are single-use disposable kits provided for every client?</span>
              <CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" />
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light">
              Yes, 100%. Every guest receives vacuum-sealed disposable aprons, fresh towels, and UV autoclave sterilized stainless steel tools.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-rosegold-500/20 space-y-2">
            <h3 className="text-white font-serif font-bold text-sm sm:text-base flex items-center justify-between">
              <span>Can I customize bridal or pre-wedding spa packages?</span>
              <CheckCircle2 className="w-4 h-4 text-rosegold-400 shrink-0" />
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light">
              Absolutely! Our master artists offer complimentary skin & hair consultations to craft personalized pre-bridal packages tailored to your schedule.
            </p>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl p-8 sm:p-12 relative overflow-hidden bg-gradient-to-r from-purple-900/40 via-dark-800 to-dark-900 border border-rosegold-500/40 text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-bold font-serif text-white">Ready for a Premium Salon Experience?</h2>
            <p className="text-gray-300 text-sm sm:text-base font-light">Book your slot online in under 30 seconds and receive instant SMS & WhatsApp confirmation.</p>
            <div className="pt-2">
              <Link
                href="/book"
                className="inline-flex items-center space-x-3 px-8 py-4 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-base shadow-glow-rosegold hover:scale-105 transition-transform"
              >
                <Calendar className="w-5 h-5" />
                <span>Reserve Your Appointment</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
