'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-gold-500/30 text-gold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Concierge & Support</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">Contact Us & Locations</h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">Have questions or special requests? Reach out to our concierge team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact Form */}
        <div className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl space-y-6">
          <h2 className="text-2xl font-bold font-serif text-white">Send Us a Message</h2>

          {submitted ? (
            <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-sm flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Thank you! Your message has been sent. Our team will contact you shortly.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can we assist you?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-gold-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full gold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-gold hover:scale-105 transition-transform flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>

        {/* Branch Outlets */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-2xl font-bold font-serif text-white">Our Outlets</h2>

          <div className="glass-card p-5 rounded-2xl space-y-2">
            <h3 className="text-white font-serif font-bold text-lg">Jubilee Hills Flagship</h3>
            <p className="text-xs text-gray-300">Road No. 36, Jubilee Hills, Hyderabad 500033</p>
            <p className="text-xs text-gold-400 font-medium">📞 +91 98765 43210</p>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-2">
            <h3 className="text-white font-serif font-bold text-lg">Gachibowli Tech Suite</h3>
            <p className="text-xs text-gray-300">Financial District, Gachibowli, Hyderabad 500032</p>
            <p className="text-xs text-gold-400 font-medium">📞 +91 98765 43211</p>
          </div>

          <div className="glass-card p-5 rounded-2xl space-y-2">
            <h3 className="text-white font-serif font-bold text-lg">Banjara Hills Boutique</h3>
            <p className="text-xs text-gray-300">Road No. 12, Banjara Hills, Hyderabad 500034</p>
            <p className="text-xs text-gold-400 font-medium">📞 +91 98765 43212</p>
          </div>
        </div>

      </div>
    </div>
  );
}
