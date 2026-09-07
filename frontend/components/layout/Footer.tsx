'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Youtube, Heart, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

export default function Footer() {
  const pathname = usePathname();
  const { socket } = useSocket();
  const [socialLinks, setSocialLinks] = useState({
    instagramUrl: 'https://instagram.com/spysalon',
    facebookUrl: 'https://facebook.com/spysalon',
    youtubeUrl: 'https://youtube.com/@spysalon'
  });

  const [contactInfo, setContactInfo] = useState({
    studioAddress: 'Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad, Telangana 500033',
    hotlinePhone: '+91 94906 44434',
    supportEmail: 'concierge@spysalon.com',
    openingHours: 'Mon - Sun: 09:00 AM - 09:00 PM'
  });

  const DEFAULT_WEBSITE_LINKS = [
    { id: '1', label: 'Popular Services', url: '/services', isActive: true },
    { id: '2', label: 'Pricing & Packages', url: '/pricing', isActive: true },
    { id: '3', label: 'Offers & Coupons', url: '/offers', isActive: true },
    { id: '4', label: 'Lookbook & Gallery', url: '/gallery', isActive: true },
    { id: '5', label: 'About Our Stylists', url: '/about', isActive: true },
    { id: '6', label: 'Frequently Asked Questions', url: '/faqs', isActive: true },
    { id: '7', label: 'VIP Membership', url: '/membership', isActive: true },
    { id: '8', label: 'Career Opportunities', url: '/careers', isActive: true },
    { id: '9', label: 'Privacy Policy', url: '/privacy', isActive: true },
    { id: '10', label: 'Terms & Conditions', url: '/terms', isActive: true }
  ];

  const [websiteLinks, setWebsiteLinks] = useState<any[]>(DEFAULT_WEBSITE_LINKS);

  useEffect(() => {
    const parseFooterData = (p: any) => {
      setSocialLinks({
        instagramUrl: p.instagramUrl || 'https://instagram.com/spysalon',
        facebookUrl: p.facebookUrl || 'https://facebook.com/spysalon',
        youtubeUrl: p.youtubeUrl || 'https://youtube.com/@spysalon'
      });
      setContactInfo({
        studioAddress: p.studioAddress || 'Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad, Telangana 500033',
        hotlinePhone: p.hotlinePhone || '+91 94906 44434',
        supportEmail: p.supportEmail || 'concierge@spysalon.com',
        openingHours: p.openingHours || 'Mon - Sun: 09:00 AM - 09:00 PM'
      });
      if (Array.isArray(p.websiteLinks) && p.websiteLinks.length > 0) {
        setWebsiteLinks(p.websiteLinks);
      } else {
        setWebsiteLinks(DEFAULT_WEBSITE_LINKS);
      }
    };

    const loadSocialSettings = async () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('spy_landing_settings');
        if (stored) {
          try {
            const p = JSON.parse(stored);
            parseFooterData(p);
          } catch (e) {}
        }
      }

      try {
        const res = await fetch(`${API_BASE_URL}/public/landing-settings`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            parseFooterData(json.data);
            if (typeof window !== 'undefined') {
              localStorage.setItem('spy_landing_settings', JSON.stringify(json.data));
            }
          }
        }
      } catch (e) {}
    };

    loadSocialSettings();
    window.addEventListener('storage', loadSocialSettings);

    if (socket) {
      socket.on('landing_settings_updated', (p: any) => {
        if (p) {
          parseFooterData(p);
          if (typeof window !== 'undefined') {
            localStorage.setItem('spy_landing_settings', JSON.stringify(p));
          }
        }
      });
    }

    return () => {
      window.removeEventListener('storage', loadSocialSettings);
      if (socket) {
        socket.off('landing_settings_updated');
      }
    };
  }, [socket]);

  // Show footer ONLY on the home page ('/')
  if (pathname !== '/') {
    return null;
  }

  return (
    <footer className="bg-dark-900 border-t border-rosegold-500/20 pt-16 pb-8 text-gray-300 relative overflow-hidden">
      {/* Subtle Rose Gold Glow Accent in Footer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[150px] bg-rosegold-500/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1: Brand Info & Logo */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white p-0.5 border border-rosegold-500/40 flex items-center justify-center overflow-hidden shadow-glow-rosegold shrink-0">
                <img src="/logo-icon.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-serif text-2xl font-extrabold tracking-widest text-white">SPY <span className="rosegold-gradient-text font-extrabold">SALON</span></span>
                <span className="block text-[10px] tracking-[0.25em] text-rosegold-400 font-semibold uppercase -mt-0.5 font-sans">Since 2026</span>
              </div>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-300 font-medium">
              India's premier luxury salon & spa studio. Delivering bespoke hair transformations, 24K gold skin rituals, and soothing aromatics.
            </p>
            <div className="flex space-x-3 pt-2">
              <a 
                href={socialLinks.instagramUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Follow SPY Salon on Instagram"
                className="w-9 h-9 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-rosegold-400 hover:text-white hover:border-rosegold-500 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href={socialLinks.facebookUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Follow SPY Salon on Facebook"
                className="w-9 h-9 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-rosegold-400 hover:text-white hover:border-rosegold-500 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href={socialLinks.youtubeUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Subscribe to SPY Salon on YouTube"
                className="w-9 h-9 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-rosegold-400 hover:text-white hover:border-rosegold-500 transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-bold text-white mb-4 border-b border-rosegold-500/30 pb-2 inline-block">Quick Links</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-gray-300">
              {websiteLinks
                .filter((l: any) => l.isActive !== false)
                .map((link: any) => (
                  <li key={link.id || link.url}>
                    <Link href={link.url || '#'} className="hover:text-rosegold-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Col 3: Operating Hours */}
          <div>
            <h4 className="font-serif text-lg font-bold text-white mb-4 border-b border-rosegold-500/30 pb-2 inline-block">Salon Timing</h4>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-rosegold-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-bold">Hours & Availability</p>
                  <p className="text-xs text-gray-300 font-medium">{contactInfo.openingHours}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-dark-800/90 text-xs text-gray-200 border border-rosegold-500/30 font-medium">
                <span className="text-amber-400 font-extrabold block mb-1">⭐ VIP Concierge Hours</span>
                <p className="text-gray-300 font-semibold leading-relaxed">
                  Early morning & late evening private appointments available on request.
                </p>
              </div>
            </div>
          </div>

          {/* Col 4: Contact & Locations */}
          <div>
            <h4 className="font-serif text-lg font-bold text-white mb-4 border-b border-rosegold-500/30 pb-2 inline-block">Flagship Studio</h4>
            <ul className="space-y-3 text-xs sm:text-sm font-medium text-gray-300">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-rosegold-400 shrink-0 mt-0.5" />
                <span className="text-gray-300">{contactInfo.studioAddress}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-rosegold-400 shrink-0" />
                <a href={`tel:${contactInfo.hotlinePhone}`} className="text-gray-300 hover:text-rosegold-400 transition-colors">{contactInfo.hotlinePhone}</a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-rosegold-400 shrink-0" />
                <span className="text-gray-300">{contactInfo.supportEmail}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 font-medium gap-4">
          <p>© {new Date().getFullYear()} SPY Salon Management System. All Rights Reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-gray-400 hover:text-rosegold-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-rosegold-400 transition-colors">Terms & Conditions</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

