'use client';

import React from 'react';
import { Briefcase, Sparkles } from 'lucide-react';

export default function CareersPage() {
  const jobs = [
    { title: 'Senior Hair Stylist & Colorist', location: 'Jubilee Hills, Hyderabad', exp: '5+ Years' },
    { title: 'Aesthetics & Dermal Therapist', location: 'Gachibowli, Hyderabad', exp: '3+ Years' },
    { title: 'Salon Receptionist & Front Desk Manager', location: 'Banjara Hills, Hyderabad', exp: '2+ Years' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-gold-500/30 text-gold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Join Our Team</span>
        </div>
        <h1 className="text-4xl font-bold font-serif text-white">Careers at SPY Salon</h1>
        <p className="text-gray-400 text-sm">Grow your creative potential with India's leading luxury salon chain.</p>
      </div>

      <div className="space-y-4">
        {jobs.map((job, idx) => (
          <div key={idx} className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-serif font-bold text-xl">{job.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{job.location} • Required Experience: {job.exp}</p>
            </div>
            <a href="mailto:careers@spysalon.com" className="px-5 py-2.5 rounded-full gold-gradient-bg text-dark-900 font-bold text-xs">
              Apply via Email
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
