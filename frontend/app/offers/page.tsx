'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Clock, Sparkles } from 'lucide-react';

export default function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const offers = [
    {
      code: 'SPYFIRST20',
      title: 'Flat 20% Off - First Salon Visit',
      discount: '20% OFF',
      desc: 'Valid on all individual hair, skin, and spa treatments for new customers.',
      validity: 'Valid till Dec 31, 2026'
    },
    {
      code: 'GOLDFACIAL',
      title: '24K Gold Facial Special',
      discount: '25% OFF',
      desc: 'Save 25% on 24K Gold & Diamond skin rejuvenation rituals.',
      validity: 'Valid till Dec 31, 2026'
    },
    {
      code: 'SPAWEEKEND',
      title: 'Weekend Spa Relaxation Deal',
      discount: '15% OFF',
      desc: 'Special weekend discount on Aromatherapy & Deep Tissue Spa packages.',
      validity: 'Valid till Dec 31, 2026'
    }
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Exclusive Promotions</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">Offers & Promo Coupons</h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">Copy any promo code below and apply during online booking or present at salon reception.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map((offer, idx) => (
          <motion.div 
            key={offer.code} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4 border border-rosegold-500/30 hover-lift shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rosegold-gradient-bg text-dark-900 font-bold px-3 py-1 rounded-full text-xs shadow-sm">
                  {offer.discount}
                </span>
                <span className="flex items-center space-x-1 text-[11px] text-gray-400">
                  <Clock className="w-3 h-3 text-rosegold-400" />
                  <span>{offer.validity}</span>
                </span>
              </div>

              <h3 className="text-white font-serif text-xl font-bold">{offer.title}</h3>
              <p className="text-xs text-gray-300 leading-relaxed">{offer.desc}</p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-dark-800 border border-dashed border-rosegold-500/50 font-mono text-rosegold-400 text-xs font-bold tracking-wider">
                {offer.code}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCopy(offer.code)}
                className="px-3.5 py-1.5 rounded-xl bg-dark-800 hover:bg-rosegold-500/20 text-white border border-rosegold-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedCode === offer.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-rosegold-400" />
                    <span>Copy Code</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
