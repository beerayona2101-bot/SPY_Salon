'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, CheckCircle } from 'lucide-react';

export default function PricingPage() {
  const packages = [
    {
      name: 'Essential Pampering',
      price: '₹2,499',
      value: '₹3,200',
      popular: false,
      features: [
        'Classic Haircut & Blowdry styling',
        'Deep Hydration Skin Cleanup',
        'Express Manicure & Pedicure',
        'Head & Shoulder Massage (15 min)'
      ]
    },
    {
      name: 'Royal Glow & Restore',
      price: '₹4,999',
      value: '₹6,800',
      popular: true,
      features: [
        '24K Gold Foil Glow Facial',
        'Signature Keratin Hair Spa',
        'Gel Polish Manicure & Pedicure',
        'Aroma Back & Neck Relaxation (30 min)',
        'Complimentary Beverage Concierge'
      ]
    },
    {
      name: 'Ultra VIP Luxury Day Spa',
      price: '₹9,999',
      value: '₹13,500',
      popular: false,
      features: [
        'Full Body Aromatherapy Massage (90 min)',
        '24K Diamond Dermal Facial',
        'Hair Botox / Keratin Intensive Care',
        'Luxury Spa Pedicure & Nail Art',
        'Private VIP Lounge Suite Access'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Pricing</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">Packages & Membership</h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">Bundled treatments designed to maximize luxury, convenience, and value.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packages.map((pkg, idx) => (
          <div 
            key={idx} 
            className={`glass-card p-8 rounded-3xl flex flex-col justify-between space-y-6 relative border ${
              pkg.popular ? 'border-rosegold-500 shadow-glow-rosegold bg-gradient-to-b from-dark-800 via-dark-800 to-rosegold-700/10' : 'border-white/10'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rosegold-gradient-bg text-dark-900 px-4 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                Most Popular Package
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-white font-serif text-2xl font-bold">{pkg.name}</h3>
              <div>
                <span className="text-rosegold-400 text-3xl font-bold font-serif">{pkg.price}</span>
                <span className="text-gray-500 text-xs line-through ml-2">Valued at {pkg.value}</span>
              </div>
              
              <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs sm:text-sm text-gray-300">
                {pkg.features.map((feat, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-rosegold-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={`/book?service=${encodeURIComponent(pkg.name)}`}
              className={`w-full py-3.5 rounded-full font-bold text-sm text-center transition-all ${
                pkg.popular 
                  ? 'rosegold-gradient-bg text-dark-900 shadow-glow-rosegold' 
                  : 'bg-dark-800 text-white border border-white/15 hover:border-rosegold-500'
              }`}
            >
              Select Package
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
