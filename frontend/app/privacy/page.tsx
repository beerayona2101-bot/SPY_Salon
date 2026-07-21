'use client';

import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-gray-300">
      <h1 className="text-4xl font-bold font-serif text-white">Privacy Policy</h1>
      <p className="text-xs text-gold-400">Last updated: July 2026</p>
      
      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white font-serif">1. Information Collection</h2>
        <p>SPY Salon collects customer details such as name, phone number, email address, and appointment preferences strictly to provide salon services and booking confirmations.</p>

        <h2 className="text-xl font-bold text-white font-serif">2. Use of Information</h2>
        <p>Your details are used solely to send appointment reminders, booking invoices, exclusive promotions, and improve customer service.</p>

        <h2 className="text-xl font-bold text-white font-serif">3. Data Protection</h2>
        <p>We implement enterprise-grade security encryption standards. We never sell or transfer personal data to third parties.</p>
      </div>
    </div>
  );
}
