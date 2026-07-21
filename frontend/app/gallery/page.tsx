'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', 'Hair', 'Facials', 'Bridal', 'Interiors'];

  const images = [
    { title: 'Balayage Blonde Transformation', category: 'Hair', url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80' },
    { title: '24K Gold Ritual Treatment', category: 'Facials', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80' },
    { title: 'Royal HD Bridal Glam', category: 'Bridal', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80' },
    { title: 'Jubilee Hills VIP Suite', category: 'Interiors', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80' },
    { title: 'Keratin Gloss Finish', category: 'Hair', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
    { title: 'Aroma Hydro Therapy', category: 'Facials', url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80' }
  ];

  const filtered = activeFilter === 'All' ? images : images.filter(img => img.category === activeFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-gold-500/30 text-gold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Lookbook & Transformations</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">SPY Salon Gallery</h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">Explore client transformations, luxury interiors, and artistry from our senior stylists.</p>
      </div>

      <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              activeFilter === cat 
                ? 'gold-gradient-bg text-dark-900 shadow-md' 
                : 'bg-dark-800 text-gray-300 border border-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, idx) => (
          <div key={idx} className="glass-card rounded-2xl overflow-hidden group">
            <div className="relative h-64 overflow-hidden">
              <img 
                src={item.url} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-purple-400 font-bold text-[11px] uppercase tracking-wider block">{item.category}</span>
                <h3 className="text-white font-serif font-bold text-lg">{item.title}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
