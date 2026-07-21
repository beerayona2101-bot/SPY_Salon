'use client';

import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-gray-300">
      <h1 className="text-4xl font-bold font-serif text-white">Terms & Conditions</h1>
      <p className="text-xs text-gold-400">Last updated: July 2026</p>

      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white font-serif">1. Appointment Policy</h2>
        <p>Clients are requested to arrive 10 minutes prior to scheduled slot time. Grace period of 15 minutes is allowed before slot reassignment.</p>

        <h2 className="text-xl font-bold text-white font-serif">2. Cancellation & Rescheduling</h2>
        <p>Cancellations can be made up to 2 hours before appointment start time without penalty.</p>

        <h2 className="text-xl font-bold text-white font-serif">3. Payment & Billing</h2>
        <p>We accept Cash, Credit/Debit Cards, UPI, and SPY Salon Membership Wallets.</p>
      </div>
    </div>
  );
}
