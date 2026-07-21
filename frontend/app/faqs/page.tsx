'use client';

import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

export default function FAQsPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    { q: 'How do I book an online appointment at SPY Salon?', a: 'You can book in under 30 seconds using our online booking wizard on this website. Simply pick your outlet, select your treatment, date, and time slot.' },
    { q: 'What safety and hygiene measures are followed?', a: 'All our tools undergo hospital-grade UV sterilization after every client. We use single-use towels and disposable aprons.' },
    { q: 'Can I reschedule or cancel my appointment?', a: 'Yes, you can reschedule or cancel up to 2 hours prior to your slot duration by calling our hotline or via SMS link.' },
    { q: 'Do you offer bridal and group booking packages?', a: 'Absolutely! We offer customized pre-bridal care, HD makeup, and private spa lounge reservations for group celebrations.' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-gold-500/30 text-gold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Help & Assistance</span>
        </div>
        <h1 className="text-4xl font-bold font-serif text-white">Frequently Asked Questions</h1>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="glass-card rounded-2xl overflow-hidden border border-white/10">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full p-5 text-left flex items-center justify-between font-serif font-bold text-white text-lg"
            >
              <span>{faq.q}</span>
              <ChevronDown className={`w-5 h-5 text-gold-400 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
            </button>

            {openIdx === i && (
              <div className="px-5 pb-5 text-sm text-gray-300 border-t border-white/10 pt-3 leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
