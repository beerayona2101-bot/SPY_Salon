'use client';

import React from 'react';
import Link from 'next/link';
import { Award, ShieldCheck, Heart, Sparkles, Star, Users } from 'lucide-react';

export default function AboutPage() {
  const team = [
    { name: 'Ananya Sharma', title: 'Creative Art Director & Hair Stylist', exp: '12+ Years Exp', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
    { name: 'Rahul Verma', title: 'Master Grooming & Beard Specialist', exp: '9+ Years Exp', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80' },
    { name: 'Priya Reddy', title: 'Senior Aesthetician & Skin Specialist', exp: '10+ Years Exp', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' },
    { name: 'Meera Kapoor', title: 'Lead Nail Artist & Couture Designer', exp: '7+ Years Exp', img: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-gold-500/30 text-gold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Our Craft & Heritage</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">About SPY Salon</h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Where art meets luxury. Founded with a mission to deliver world-class salon and spa rituals tailored to every client's unique individuality.
        </p>
      </div>

      {/* Brand Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl space-y-3 text-center">
          <div className="w-12 h-12 rounded-full gold-gradient-bg flex items-center justify-center text-dark-900 mx-auto font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-white font-serif text-xl font-bold">Master Stylists</h3>
          <p className="text-xs text-gray-400 leading-relaxed">Internationally certified experts with decades of hair artistry and dermal aesthetics experience.</p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3 text-center">
          <div className="w-12 h-12 rounded-full gold-gradient-bg flex items-center justify-center text-dark-900 mx-auto font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-white font-serif text-xl font-bold">100% Medical Hygiene</h3>
          <p className="text-xs text-gray-400 leading-relaxed">Hospital-grade UV sterilization of tools, single-use disposable kits, and pristine private rooms.</p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3 text-center">
          <div className="w-12 h-12 rounded-full gold-gradient-bg flex items-center justify-center text-dark-900 mx-auto font-bold">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-white font-serif text-xl font-bold">Bespoke Hospitality</h3>
          <p className="text-xs text-gray-400 leading-relaxed">Complimentary gourmet artisan coffees, relaxing music, and personalized consultation for every guest.</p>
        </div>
      </div>

      {/* Team Showcase */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-widest">Meet the Masters</span>
          <h2 className="text-3xl font-bold font-serif text-white">Our Senior Artists</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member) => (
            <div key={member.name} className="glass-card rounded-2xl overflow-hidden text-center space-y-3 pb-5">
              <img src={member.img} alt={member.name} className="w-full h-56 object-cover" />
              <div className="px-4">
                <h4 className="text-white font-serif font-bold text-lg">{member.name}</h4>
                <p className="text-xs text-gold-400 font-medium">{member.title}</p>
                <span className="inline-block mt-2 text-[11px] bg-dark-800 text-gray-300 px-3 py-1 rounded-full border border-white/10">
                  {member.exp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
