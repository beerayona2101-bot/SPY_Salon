'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import LoadingScreen from '../common/LoadingScreen';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/employee');
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const storedCount = parseInt(localStorage.getItem('spy_refresh_count') || '0', 10);
      const currentCount = storedCount + 1;
      localStorage.setItem('spy_refresh_count', currentCount.toString());

      // Trigger loading screen on initial launch (count 1) and every 5th refresh (count 5, 10, 15...)
      if (currentCount === 1 || currentCount % 5 === 0) {
        setShowLoading(true);
      } else {
        setShowLoading(false);
      }
    }
  }, []);

  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  if (isDashboardRoute) {
    return (
      <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col">
        {showLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
        <main className="flex-grow" id="main-layout-content">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col">
      {showLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      <Navbar />
      <main className="flex-grow pt-16 sm:pt-16 md:pt-16 pb-16 md:pb-0" id="main-layout-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
