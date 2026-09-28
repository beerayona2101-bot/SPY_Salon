'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, UserX, AlertTriangle, HelpCircle, CheckCircle2, Shield, Mail, Phone } from 'lucide-react';

export default function DeleteAccountInfoPage() {
  const steps = [
    { number: '1', title: 'Log in to your SPY Salon customer account.' },
    { number: '2', title: 'Open Settings from the Customer Dashboard.' },
    { number: '3', title: 'Go to Security & Account Management.' },
    { number: '4', title: 'Select Delete Account.' },
    { number: '5', title: 'Confirm that you want to permanently delete your account.' },
    { number: '6', title: 'Enter your account password when requested.' },
    { number: '7', title: 'Confirm the account deletion.' },
  ];

  const consequences = [
    'Your customer account will be permanently deleted.',
    'Upcoming appointments associated with your account will be cancelled.',
    'Certain historical appointment information may be retained in anonymized form where required for business or legal purposes.',
    'Your authentication/session information will be removed.',
    'Account deletion cannot be undone.',
  ];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-dark-900 text-gray-200">
      
      {/* Background Accents */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-rosegold-500/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[400px] h-[300px] bg-red-600/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        
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
            <Shield className="w-3.5 h-3.5 text-rosegold-400" />
            <span>Account Management & Privacy</span>
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
          <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass-panel border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest">
            <UserX className="w-3.5 h-3.5" />
            <span>Account Deletion Guide</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif text-white tracking-tight">
            Delete Your Account
          </h1>
          <p className="max-w-2xl mx-auto text-gray-300 text-xs sm:text-sm leading-relaxed">
            If you want to delete your SPY Salon customer account, follow these steps:
          </p>
        </motion.div>

        {/* Step-by-Step Instructions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rosegold-glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/20 space-y-6 shadow-xl"
        >
          <div className="flex items-center space-x-3 pb-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-full bg-rosegold-500/20 border border-rosegold-500/40 flex items-center justify-center text-rosegold-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
                How to Delete Your Account
              </h2>
              <p className="text-xs text-gray-400">
                Follow these steps inside your authenticated customer account
              </p>
            </div>
          </div>

          <ol className="space-y-3.5 text-xs sm:text-sm text-gray-200">
            {steps.map((step) => (
              <li
                key={step.number}
                className="flex items-start space-x-3 p-3 sm:p-3.5 rounded-2xl bg-dark-850/60 border border-white/5 hover:border-rosegold-500/30 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-rosegold-500/20 text-rosegold-400 border border-rosegold-500/40 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.number}
                </span>
                <span className="font-medium text-gray-200 leading-relaxed pt-0.5">
                  {step.title}
                </span>
              </li>
            ))}
          </ol>

          <div className="pt-2 flex justify-start sm:justify-end">
            <Link
              href="/profile?tab=security"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-dark-800 hover:bg-dark-750 text-rosegold-300 font-bold text-xs border border-rosegold-500/30 hover:border-rosegold-500 transition-all shadow-md"
            >
              <span>Go to Security & Account Management</span>
              <span>→</span>
            </Link>
          </div>
        </motion.div>

        {/* What Happens When You Delete Your Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rosegold-glass-card p-6 sm:p-8 rounded-3xl border border-red-500/20 space-y-6 shadow-xl"
        >
          <div className="flex items-center space-x-3 pb-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
                What Happens When You Delete Your Account?
              </h2>
              <p className="text-xs text-gray-400">
                Please review these important points before deleting
              </p>
            </div>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm text-gray-300">
            {consequences.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-3">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-2" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Need Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rosegold-glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 space-y-5 text-center shadow-xl"
        >
          <div className="w-12 h-12 rounded-full bg-rosegold-500/20 border border-rosegold-500/40 flex items-center justify-center text-rosegold-400 mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
              Need Help?
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
              If you are unable to delete your account through the Customer Dashboard, please contact SPY Salon support.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="px-6 py-3 rounded-full rosegold-gradient-bg text-white text-xs font-extrabold shadow-glow-rosegold hover:scale-105 transition-all inline-flex items-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Support</span>
            </Link>
            <a
              href="tel:+919490644434"
              className="px-6 py-3 rounded-full bg-dark-800 hover:bg-dark-750 text-gray-200 text-xs font-bold border border-white/10 hover:border-rosegold-500/40 transition-all inline-flex items-center space-x-2"
            >
              <Phone className="w-4 h-4 text-rosegold-400" />
              <span>+91 94906 44434</span>
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
