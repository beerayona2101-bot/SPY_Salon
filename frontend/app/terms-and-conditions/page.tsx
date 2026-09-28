'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, FileText, Sparkles, AlertTriangle, Clock } from 'lucide-react';
import { TERMS_SECTIONS, TERMS_VERSION, LAST_UPDATED, LEGAL_PLACEHOLDERS } from '@/lib/legalContent';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-dark-900 text-gray-200">
      
      {/* Rose Gold Background Accents */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-rosegold-500/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[400px] h-[300px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 space-y-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rosegold-400 hover:text-white transition-colors bg-dark-800/80 px-4 py-2 rounded-full border border-rosegold-500/30 shadow-glow-rosegold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2 text-xs text-rosegold-300 glass-panel px-3.5 py-1.5 rounded-full border border-white/10">
            <Clock className="w-3.5 h-3.5 text-rosegold-400" />
            <span>Version {TERMS_VERSION}</span>
          </div>
        </div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-rosegold-500/40 flex items-center justify-center shadow-glow-rosegold mx-auto overflow-hidden animate-float">
            <img src="/logo-icon.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
          </div>
          <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-panel border border-rosegold-500/30 text-rosegold-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif text-white tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-xs sm:text-sm text-rosegold-300 font-medium">
            Last Updated: <span className="text-white font-semibold">{LAST_UPDATED}</span>
          </p>
          <p className="max-w-2xl mx-auto text-gray-300 text-xs sm:text-sm leading-relaxed">
            Please read these Terms & Conditions carefully before using SPY Salon services, web portal, or mobile applications.
          </p>
        </motion.div>

        {/* Notice Card for Legal Placeholders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-amber-300">Production Legal Notice</span>
            <p className="leading-relaxed text-amber-200/90 text-xs">
              Specific business entity details are represented by standardized brackets (such as {LEGAL_PLACEHOLDERS.businessName}). These placeholders will be updated upon final confirmation by SPY Salon legal counsel.
            </p>
          </div>
        </div>

        {/* Layout Grid: Table of Contents & Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Table of Contents */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-8 rosegold-glass-card p-5 rounded-2xl border border-rosegold-500/20 space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-bold text-rosegold-400 uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/10">
                <FileText className="w-4 h-4" />
                <span>Table of Contents</span>
              </h3>
              <nav className="space-y-1 text-xs">
                {TERMS_SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block py-1.5 px-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium truncate"
                  >
                    {sec.number}. {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Policy Sections */}
          <div className="lg:col-span-3 space-y-6">
            {TERMS_SECTIONS.map((sec) => (
              <motion.div
                key={sec.id}
                id={sec.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4 }}
                className="rosegold-glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/20 space-y-4 hover:border-rosegold-500/40 transition-colors shadow-lg"
              >
                <div className="flex items-center space-x-3 pb-3 border-b border-white/10">
                  <span className="w-8 h-8 rounded-full bg-rosegold-500/20 border border-rosegold-500/40 flex items-center justify-center text-rosegold-400 text-xs font-extrabold shrink-0">
                    {sec.number}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
                    {sec.title}
                  </h2>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {sec.content.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Bottom Contact & Verification Card */}
            <div className="rosegold-glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/40 space-y-4 text-center">
              <ShieldCheck className="w-12 h-12 text-rosegold-400 mx-auto" />
              <h3 className="text-xl font-bold font-serif text-white">Questions Regarding Terms?</h3>
              <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto">
                If you have questions or require clarification on any of our Terms & Conditions, please reach out to our legal and customer concierge team.
              </p>
              <div className="pt-2 flex justify-center">
                <Link
                  href="/contact"
                  className="px-6 py-3 rounded-full rosegold-gradient-bg text-white text-xs font-extrabold shadow-glow-rosegold hover:scale-105 transition-all"
                >
                  Contact Concierge Team
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
