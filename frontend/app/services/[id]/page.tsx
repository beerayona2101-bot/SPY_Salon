'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Star, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Heart,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { servicesData, ServiceItem } from '@/data/servicesData';

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const slugOrId = params.id;

  const service = servicesData.find(
    (s) => s.slug === slugOrId || s.id === slugOrId
  );

  if (!service) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rosegold-500/10 border border-rosegold-500/30 flex items-center justify-center text-rosegold-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-white">Service Not Found</h1>
        <p className="text-gray-400 text-sm max-w-md">
          The treatment you are looking for might have been moved or updated. Explore our full menu of luxury spa & skin rituals.
        </p>
        <Link
          href="/services"
          className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          View All Services
        </Link>
      </div>
    );
  }

  const relatedServices = servicesData.filter(
    (s) => s.category === service.category && s.id !== service.id
  );

  const handleBookNow = () => {
    // Check if user is logged in
    const userToken = typeof window !== 'undefined' ? (localStorage.getItem('spy_user') || localStorage.getItem('spy_token')) : null;

    if (!userToken) {
      // Redirect to login with message
      router.push(`/login?redirect=/book?service=${encodeURIComponent(service.title)}&auth_required=true`);
    } else {
      // Proceed to booking page with preselected service
      router.push(`/book?service=${encodeURIComponent(service.title)}`);
    }
  };

  return (
    <div className="space-y-12 pb-20 pt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* BREADCRUMB */}
      <div className="flex items-center space-x-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-rosegold-400 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        <Link href="/services" className="hover:text-rosegold-400 transition-colors">Services</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-rosegold-400 font-medium truncate">{service.title}</span>
      </div>

      {/* HERO BANNER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Image Showcase */}
        <div className="lg:col-span-6 relative">
          <div className="relative rounded-3xl overflow-hidden border border-rosegold-500/30 shadow-2xl h-80 sm:h-96 group">
            <img 
              src={service.image} 
              alt={service.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />
            
            {/* Category Tag */}
            <div className="absolute top-4 left-4 bg-purple-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              {service.category} Ritual
            </div>

            {/* Rating Pill */}
            <div className="absolute top-4 right-4 bg-dark-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs text-rosegold-400 font-bold flex items-center space-x-1 border border-rosegold-500/30">
              <Star className="w-4 h-4 fill-rosegold-400 text-rosegold-400" />
              <span>{service.rating} ({service.reviewsCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Right Service Header Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="text-rosegold-400 text-xs font-semibold uppercase tracking-widest flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-rosegold-400" />
              <span>Signature Luxury Treatment</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight">
              {service.title}
            </h1>
          </div>

          <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
            {service.longDescription}
          </p>

          {/* Pricing & Duration Info Box */}
          <div className="glass-panel p-4 rounded-2xl border border-rosegold-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Investment</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-bold font-serif rosegold-gradient-text">{service.price}</span>
                <span className="text-gray-500 text-sm line-through">{service.oldPrice}</span>
              </div>
            </div>

            <div className="text-right space-y-0.5 border-l border-white/10 pl-6">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Duration</span>
              <div className="flex items-center space-x-1.5 text-white font-medium text-sm sm:text-base">
                <Clock className="w-4 h-4 text-rosegold-400" />
                <span>{service.time}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleBookNow}
              className="flex-1 px-8 py-4 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm sm:text-base shadow-glow-rosegold hover:scale-105 transition-transform flex items-center justify-center space-x-2"
            >
              <Calendar className="w-5 h-5" />
              <span>Book This Treatment</span>
            </button>

            <Link
              href="/services"
              className="px-6 py-4 rounded-full bg-dark-800 border border-white/15 text-white font-medium text-sm hover:border-rosegold-400 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4 text-rosegold-400" />
              <span>Back to Menu</span>
            </Link>
          </div>

          <p className="text-[11px] text-gray-400 flex items-center space-x-1.5 pt-1">
            <ShieldCheck className="w-4 h-4 text-rosegold-400 shrink-0" />
            <span>100% Autoclave Sterilized • Instant SMS & WhatsApp Slot Locking</span>
          </p>

        </div>
      </div>

      {/* BENEFITS SECTION */}
      <section className="space-y-6 pt-6 border-t border-white/10">
        <h2 className="text-2xl font-serif font-bold text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-rosegold-400" />
          <span>Key Benefits & Results</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {service.benefits.map((benefit, idx) => (
            <div key={idx} className="glass-card p-4 rounded-2xl flex items-start space-x-3 border border-rosegold-500/20">
              <CheckCircle2 className="w-5 h-5 text-rosegold-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-medium">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TREATMENT STEP PROCESS */}
      <section className="space-y-6 pt-6 border-t border-white/10">
        <h2 className="text-2xl font-serif font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-rosegold-400" />
          <span>4-Step Ritual Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {service.processSteps.map((stepItem, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-rosegold-500/20 space-y-2 relative overflow-hidden">
              <div className="w-8 h-8 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs flex items-center justify-center">
                0{idx + 1}
              </div>
              <h3 className="text-white font-serif text-sm font-bold pt-1">{stepItem.title}</h3>
              <p className="text-xs text-gray-300 leading-relaxed font-light">{stepItem.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AFTERCARE GUIDANCE */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 space-y-4">
        <h3 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-rosegold-400" />
          <span>Post-Treatment Aftercare Tips</span>
        </h3>
        <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
          {service.aftercare.map((tip, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="text-rosegold-400 font-bold">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* RELATED SERVICES */}
      {relatedServices.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-white">Similar Luxury Treatments</h2>
            <Link href="/services" className="text-rosegold-400 text-xs font-semibold hover:text-white transition-colors">
              Explore All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedServices.map((rel) => (
              <Link
                key={rel.id}
                href={`/services/${rel.slug}`}
                className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between hover:border-rosegold-400 transition-all group"
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 bg-dark-900/80 backdrop-blur-md px-2 py-0.5 rounded-full text-xs text-rosegold-400 font-bold">
                    ★ {rel.rating}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-white font-serif text-base font-bold group-hover:text-rosegold-400 transition-colors">{rel.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{rel.desc}</p>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between border-t border-white/10 mt-auto pt-3">
                  <span className="text-rosegold-400 font-serif font-bold text-base">{rel.price}</span>
                  <span className="text-xs font-bold text-white group-hover:text-rosegold-400 transition-colors">View Details →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
