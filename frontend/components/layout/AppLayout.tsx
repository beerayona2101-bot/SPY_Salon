'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/employee');

  if (isDashboardRoute) {
    return (
      <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col">
        <main className="flex-grow">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-12 sm:pt-14 md:pt-16 pb-16 md:pb-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
