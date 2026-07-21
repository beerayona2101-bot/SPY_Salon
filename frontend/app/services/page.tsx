'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Star, Clock, Sparkles } from 'lucide-react';

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Hair', 'Skin', 'Spa', 'Nails', 'Bridal', 'Grooming'];

  const services = [
    { id: 1, name: '24K Royal Gold Glow Facial', category: 'Skin', price: 1499, duration: '60 min', rating: 4.9, desc: 'Infusion of 24K gold leaves, hyaluronic acid, and jade roller massage for glowing skin.' },
    { id: 2, name: 'Signature Keratin Hair Spa & Mask', category: 'Hair', price: 2199, duration: '75 min', rating: 4.9, desc: 'Deep protein reconstruction to tame frizzy strands and impart silkiness.' },
    { id: 3, name: 'Aroma Luxury Full Body Massage', category: 'Spa', price: 2499, duration: '90 min', rating: 5.0, desc: 'Aromatherapy massage with warm essential oils to melt away tension and stress.' },
    { id: 4, name: 'Gel Couture Manicure & Pedicure', category: 'Nails', price: 1199, duration: '45 min', rating: 4.8, desc: 'Precision nail shaping, cuticle nourishment, exfoliation scrub, and long-lasting gel polish.' },
    { id: 5, name: 'HD Bridal Makeup & Hair Styling', category: 'Bridal', price: 8999, duration: '180 min', rating: 5.0, desc: 'Complete high-definition airbrush bridal look with premium lashes, hairstyle, draping.' },
    { id: 6, name: 'Royal Beard Sculpting & Charcoal Steam', category: 'Grooming', price: 599, duration: '30 min', rating: 4.7, desc: 'Precision razor shaping, warm steam pore cleansing, charcoal detox mask, and beard oil.' },
    { id: 7, name: 'Balayage & Hair Gloss Treatment', category: 'Hair', price: 3499, duration: '120 min', rating: 4.9, desc: 'Custom hand-painted highlights with ammonia-free gloss for dimensional color.' },
    { id: 8, name: 'Hydra-Infusion Deep Cleanup', category: 'Skin', price: 1299, duration: '45 min', rating: 4.8, desc: 'Pore extraction, ultrasonic scrub, and water-surge hydration mask.' }
  ];

  const filteredServices = services.filter(service => {
    const matchesCategory = activeTab === 'All' || service.category === activeTab;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Complete Botanical Beauty Menu</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">Services & Treatments</h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">Browse our luxury salon offerings. Select a treatment to view pricing and reserve your appointment slot.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-rosegold-500/20">
        
        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === cat 
                  ? 'rosegold-gradient-bg text-dark-900 shadow-md font-bold' 
                  : 'bg-dark-800 text-gray-300 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors"
          />
        </div>

      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => {
            const slug = service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return (
              <Link 
                key={service.id} 
                href={`/services/${slug}`}
                className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-rosegold-500 transition-all group cursor-pointer"
              >
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {service.category}
                    </span>
                    <span className="flex items-center space-x-1 text-xs text-rosegold-400 font-medium">
                      <Star className="w-3.5 h-3.5 fill-rosegold-400" />
                      <span>{service.rating}</span>
                    </span>
                  </div>

                  <h3 className="text-white font-serif text-xl font-bold group-hover:text-rosegold-400 transition-colors">{service.name}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{service.desc}</p>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-400 pt-1">
                    <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                    <span>Duration: {service.duration}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block">Price</span>
                    <span className="text-rosegold-400 text-xl font-bold font-serif">₹{service.price}</span>
                  </div>

                  <span className="px-5 py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs group-hover:opacity-90 transition-opacity">
                    View & Book
                  </span>
                </div>

              </Link>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 glass-panel rounded-2xl space-y-3">
            <p className="text-gray-400 text-base">No services found matching "{searchQuery}".</p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveTab('All'); }}
              className="text-xs text-rosegold-400 underline font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
