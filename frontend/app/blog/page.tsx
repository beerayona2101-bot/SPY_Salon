'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, User } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    { title: 'The Science Behind 24K Gold Facials for Youthful Glow', date: 'July 15, 2026', author: 'Dr. Priya Reddy', img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80' },
    { title: '5 Essential Post-Keratin Hair Care Tips You Must Follow', date: 'July 10, 2026', author: 'Ananya Sharma', img: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80' },
    { title: 'How Aromatherapy Massages Melt Away Stress and Fatigue', date: 'July 04, 2026', author: 'Wellness Team', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-gold-500/30 text-gold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Beauty Journal</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">Hair, Skin & Wellness Blog</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post, i) => (
          <div key={i} className="glass-card rounded-2xl overflow-hidden space-y-3 pb-5">
            <img src={post.img} alt={post.title} className="w-full h-48 object-cover" />
            <div className="px-5 space-y-2">
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <span className="flex items-center space-x-1"><Calendar className="w-3 h-3 text-gold-400" /><span>{post.date}</span></span>
                <span className="flex items-center space-x-1"><User className="w-3 h-3 text-gold-400" /><span>{post.author}</span></span>
              </div>
              <h3 className="text-white font-serif font-bold text-lg hover:text-gold-400 transition-colors cursor-pointer">{post.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
