'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Youtube, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Show footer ONLY on the home page ('/')
  if (pathname !== '/') {
    return null;
  }

  return (
    <footer className="bg-dark-900 border-t border-rosegold-500/20 pt-16 pb-8 text-gray-400 relative overflow-hidden">
      {/* Subtle Rose Gold Glow Accent in Footer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[150px] bg-rosegold-500/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1: Brand Info & Logo */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-rosegold-500/40 flex items-center justify-center overflow-hidden shadow-glow-rosegold">
                <img src="/logo.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-serif text-2xl font-extrabold tracking-widest text-white">SPY <span className="text-rosegold-400 font-extrabold">SALON</span></span>
                <span className="block text-[10px] tracking-[0.25em] text-gray-300 font-semibold uppercase -mt-0.5 font-sans">Since 2026</span>
              </div>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-400">
              India's premier luxury salon & spa studio. Delivering bespoke hair transformations, 24K gold skin rituals, and soothing aromatics.
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-gray-300 hover:text-rosegold-400 hover:border-rosegold-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-gray-300 hover:text-rosegold-400 hover:border-rosegold-500 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-gray-300 hover:text-rosegold-400 hover:border-rosegold-500 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-white mb-4 border-b border-rosegold-500/30 pb-2 inline-block">Quick Links</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li><Link href="/services" className="hover:text-rosegold-400 transition-colors">Popular Services</Link></li>
              <li><Link href="/pricing" className="hover:text-rosegold-400 transition-colors">Pricing & Packages</Link></li>
              <li><Link href="/offers" className="hover:text-rosegold-400 transition-colors">Offers & Coupons</Link></li>
              <li><Link href="/gallery" className="hover:text-rosegold-400 transition-colors">Lookbook & Gallery</Link></li>
              <li><Link href="/about" className="hover:text-rosegold-400 transition-colors">About Our Stylists</Link></li>
              <li><Link href="/careers" className="hover:text-rosegold-400 transition-colors">Careers & Hiring</Link></li>
              <li><Link href="/faqs" className="hover:text-rosegold-400 transition-colors">Frequently Asked Questions</Link></li>
            </ul>
          </div>

          {/* Col 3: Operating Hours */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-white mb-4 border-b border-rosegold-500/30 pb-2 inline-block">Salon Timing</h4>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-rosegold-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Monday – Sunday</p>
                  <p className="text-xs text-gray-400">09:00 AM – 09:00 PM</p>
                </div>
              </div>
              <div className="p-3 rounded-xl rosegold-glass-card text-xs text-gray-300 border border-rosegold-500/30">
                <span className="text-rosegold-400 font-semibold block mb-1">⭐ VIP Concierge Hours</span>
                Early morning & late evening private appointments available on request.
              </div>
            </div>
          </div>

          {/* Col 4: Contact & Locations */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-white mb-4 border-b border-rosegold-500/30 pb-2 inline-block">Flagship Studio</h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-rosegold-400 shrink-0 mt-0.5" />
                <span>Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-rosegold-400 shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210 / +91 98765 43211</a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-rosegold-400 shrink-0" />
                <span>support@spysalon.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} SPY Salon Management System. All Rights Reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300">Terms & Conditions</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
