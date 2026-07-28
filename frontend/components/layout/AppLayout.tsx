'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/employee');

  if (isDashboardRoute) {
    return (
      <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col">
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16 sm:pt-16 md:pt-16 pb-16 md:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="gpu-accelerated"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
