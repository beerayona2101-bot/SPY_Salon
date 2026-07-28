'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, Sparkles, CheckCircle2, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ enquiryId: string; name: string; email: string; whatsappAdminLink?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const enqId = data.data?.enquiryId || ('ENQ-' + Math.floor(100000 + Math.random() * 900000));
        const adminWaUrl = data.data?.whatsappAdminLink || `https://wa.me/919490644434?text=${encodeURIComponent(`Hello SPY Salon Concierge, I submitted inquiry #${enqId} from website.`)}`;
        
        setSubmittedData({
          enquiryId: enqId,
          name: formData.name,
          email: formData.email,
          whatsappAdminLink: adminWaUrl
        });
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', message: '' });

        // Directly open Admin WhatsApp chat with default pre-filled message in a new window
        try {
          window.open(adminWaUrl, '_blank');
        } catch (openErr) {
          console.warn('Window open failed:', openErr);
        }
      } else {
        setErrorMsg(data.message || 'Failed to submit inquiry. Please try again.');
      }
    } catch (err: any) {
      console.error('Inquiry submit error:', err);
      setErrorMsg('Unable to connect to server. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Concierge & Support</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">Contact Us & Locations</h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">Have questions or special requests? Reach out to our concierge team.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 1, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl border border-rosegold-500/30"
        >
          <h2 className="text-2xl font-bold font-serif text-white">Send Us a Message</h2>

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {submitted && submittedData ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-dark-800/90 border border-green-500/40 text-gray-200 space-y-4 text-left shadow-xl"
            >
              <div className="flex items-center space-x-3 text-green-400">
                <CheckCircle2 className="w-7 h-7 shrink-0 animate-bounce" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Inquiry Received Successfully!</h3>
                  <p className="text-xs text-gray-300">Confirmation email & WhatsApp alert dispatched.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-dark-900 border border-rosegold-500/30 text-xs space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Official Reference ID</span>
                <span className="text-rosegold-400 font-mono font-bold text-base">{submittedData.enquiryId}</span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Thank you, <strong>{submittedData.name}</strong>. Your message has been routed to our Jubilee Hills Concierge Desk.
              </p>

              <div className="space-y-2 pt-2">
                <a
                  href={submittedData.whatsappAdminLink || 'https://wa.me/919490644434'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all text-center cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat directly with Admin on WhatsApp →</span>
                </a>

                <button
                  onClick={() => setSubmitted(false)}
                  className="w-full py-2.5 rounded-full bg-dark-900 border border-white/10 text-gray-300 font-bold text-xs hover:text-white cursor-pointer transition-all"
                >
                  Send Another Message
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Phone</label>
                  <input
                    type="tel"
                    disabled={isSubmitting}
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  disabled={isSubmitting}
                  placeholder="How can we assist you?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 resize-none transition-colors disabled:opacity-50"
                />
              </div>

              <motion.button
                whileHover={{ scale: isSubmitting ? 1 : 1.03 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Branch Outlets */}
        <motion.div 
          initial={{ opacity: 1, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-5 space-y-4"
        >
          <h2 className="text-2xl font-bold font-serif text-white">Our Outlets</h2>

          {[
            { title: 'Jubilee Hills Flagship', addr: 'Road No. 36, Jubilee Hills, Hyderabad 500033', phone: '+91 98765 43210' },
            { title: 'Gachibowli Tech Suite', addr: 'Financial District, Gachibowli, Hyderabad 500032', phone: '+91 98765 43211' },
            { title: 'Banjara Hills Boutique', addr: 'Road No. 12, Banjara Hills, Hyderabad 500034', phone: '+91 98765 43212' }
          ].map((branch, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-card p-5 rounded-2xl space-y-2 border border-rosegold-500/20 hover:border-rosegold-400 transition-all cursor-pointer shadow-lg"
            >
              <h3 className="text-white font-serif font-bold text-lg">{branch.title}</h3>
              <p className="text-xs text-gray-300">{branch.addr}</p>
              <p className="text-xs text-rosegold-400 font-medium">📞 {branch.phone}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
