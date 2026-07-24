'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Calendar, 
  Sparkles, 
  ChevronDown, 
  Tag, 
  User, 
  Home, 
  LogOut, 
  Clock, 
  ShoppingBag, 
  Crown,
  PhoneCall,
  X,
  LayoutDashboard,
  Bell
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userNotifs, setUserNotifs] = useState<any[]>([]);
  const [profileTab, setProfileTab] = useState<'schedules' | 'history'>('schedules');

  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const fetchUserNotifs = async () => {
    try {
      const email = user?.email || '';
      const phone = user?.phone || '';
      const res = await apiFetch(`/user/notifications?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.data) {
        setUserNotifs(data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchUserNotifs();
    const intervalId = setInterval(fetchUserNotifs, 15000);
    return () => clearInterval(intervalId);
  }, [user]);

  const notifRef = useRef<HTMLDivElement>(null);

  // Auto-close notification dropdown, profile modal & mobile menu when route changes
  useEffect(() => {
    setNotifDropdownOpen(false);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Click-outside listener to smoothly close notification dropdown & profile modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    router.replace('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'VIP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isPricingOrOffersActive = pathname === '/pricing' || pathname === '/offers';
  const isAdminUser = user?.role === 'admin' || user?.email?.includes('admin');
  const isEmployeeUser = user?.role === 'employee';

  const handleProfileButtonClick = () => {
    if (isAdminUser) {
      router.push('/admin');
      return;
    }
    if (isEmployeeUser) {
      router.push('/employee');
      return;
    }
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleClearUserNotifs = async () => {
    try {
      await apiFetch('/user/notifications/clear', {
        method: 'PUT',
        body: JSON.stringify({ email: user?.email, phone: user?.phone })
      });
      setUserNotifs([]);
    } catch (e) {}
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
      }`}>
        <nav className={`transition-all duration-300 py-2.5 sm:py-3 ${
          isScrolled 
            ? 'bg-dark-900/95 backdrop-blur-2xl border-b border-rosegold-500/20 shadow-glass' 
            : 'bg-dark-900/40 backdrop-blur-md border-b border-white/5'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center justify-center md:justify-between min-h-[44px]">
              
              {/* Left Fixed Logo Icon on Mobile / Combined Logo & Brand Name on Desktop */}
              <Link 
                href="/" 
                className="absolute left-4 sm:left-6 md:static flex items-center group shrink-0" 
                title="SPY Salon"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white p-1 border border-rosegold-500/40 flex items-center justify-center shadow-glow-rosegold group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                  <img src="/logo-icon.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
                </div>
                <div className="hidden md:flex flex-col text-left ml-3">
                  <span className="font-serif text-xl font-bold tracking-widest text-white leading-none">
                    SPY <span className="rosegold-gradient-text font-bold">SALON</span>
                  </span>
                  <span className="text-[9px] tracking-[0.2em] text-rosegold-400 uppercase font-sans mt-0.5">
                    Flagship Studio • Jubilee Hills
                  </span>
                </div>
              </Link>

              {/* Mobile Centered Brand Name Text ONLY */}
              <Link 
                href="/" 
                className="md:hidden flex flex-col items-center justify-center text-center mx-auto group" 
                title="SPY Salon"
              >
                <span className="font-serif text-sm font-bold tracking-widest text-white leading-none">
                  SPY <span className="rosegold-gradient-text font-bold">SALON</span>
                </span>
                <span className="text-[7.5px] sm:text-[8.5px] tracking-[0.18em] text-rosegold-400 uppercase font-sans mt-0.5">
                  Flagship Studio • Jubilee Hills
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center space-x-1 bg-dark-800/80 p-1.5 rounded-full border border-rosegold-500/20 backdrop-blur-xl shadow-inner">
                <Link href="/" className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${pathname === '/' ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>Home</Link>
                <Link href="/services" className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${pathname === '/services' ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>Services</Link>
                <Link href="/pricing" className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${isPricingOrOffersActive ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>Pricing</Link>
                <Link href="/contact" className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${pathname === '/contact' ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>Contact</Link>
              </div>

              {/* Notification Bell Icon & Profile Avatar / Executive Desk Button - Right Fixed in Mobile View */}
              <div className="flex items-center space-x-2.5 absolute right-4 sm:right-6 md:static md:right-auto">
                
                {/* NOTIFICATION BELL ICON RIGHT NEXT TO SIGN IN / PROFILE (ONLY WHEN LOGGED IN) */}
                {user && !isAdminUser && !isEmployeeUser && (
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                      className="p-2 sm:p-2.5 rounded-full bg-dark-800 border border-rosegold-500/30 text-rosegold-400 hover:text-white hover:border-rosegold-400 transition-all cursor-pointer relative"
                      title="Customer Notifications & Updates"
                    >
                      <Bell className="w-4 h-4" />
                      {userNotifs.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rosegold-500 text-dark-900 font-extrabold text-[9px] flex items-center justify-center animate-pulse shadow-glow-rosegold">
                          {userNotifs.length}
                        </span>
                      )}
                    </button>

                    {/* NOTIFICATION DROPDOWN PANEL */}
                    {notifDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-dark-900/95 border border-rosegold-500/40 backdrop-blur-2xl shadow-2xl p-4 space-y-3 z-[100] text-left animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div className="flex items-center space-x-2">
                            <Bell className="w-4 h-4 text-rosegold-400" />
                            <h4 className="text-white font-serif font-bold text-sm">Notifications & Updates</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            {userNotifs.length > 0 && (
                              <button
                                onClick={handleClearUserNotifs}
                                className="text-[10px] text-gray-400 hover:text-rosegold-400 font-bold underline cursor-pointer"
                              >
                                Clear All
                              </button>
                            )}
                            <button onClick={() => setNotifDropdownOpen(false)} className="text-gray-400 hover:text-white text-xs cursor-pointer">✕</button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {userNotifs.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No notifications yet.</p>
                          ) : (
                            userNotifs.map((n) => {
                              const matchBookingId = n.message?.match(/SPY-\d+/)?.[0] || 'SPY-884920';
                              return (
                                <div 
                                  key={n._id} 
                                  className={`p-3 rounded-2xl border text-xs space-y-1 ${
                                    n.type === 'warning' ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' :
                                    n.type === 'success' ? 'bg-green-950/40 border-green-500/40 text-green-200' :
                                    'bg-dark-800 border-white/10 text-gray-200'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold">{n.title}</span>
                                    <span className="text-[9px] text-gray-400 font-mono">
                                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] opacity-90 leading-relaxed">{n.message}</p>
                                  {n.title.includes('Reschedule') && (
                                    <Link 
                                      href={`/book?rescheduleId=${matchBookingId}`} 
                                      onClick={() => setNotifDropdownOpen(false)}
                                      className="inline-block text-[10px] text-rosegold-300 font-bold hover:underline pt-0.5"
                                    >
                                      Reschedule Slot Now (Pre-Paid) →
                                    </Link>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {user ? (
                  <button
                    onClick={handleProfileButtonClick}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-dark-800 border border-rosegold-500/40 text-white font-medium text-xs hover:border-rosegold-400 transition-all shadow-glow-rosegold cursor-pointer"
                    title={isAdminUser ? 'Admin Control Center' : 'User Account'}
                  >
                    <div className="w-7 h-7 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold flex items-center justify-center text-[11px] shadow-sm shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <span className="font-serif font-bold text-xs truncate max-w-[90px] sm:max-w-[120px]">
                      {isAdminUser ? 'Admin Portal' : isEmployeeUser ? 'Staff Portal' : user.name ? user.name.split(' ')[0] : 'Profile'}
                    </span>
                    {!isAdminUser && !isEmployeeUser && (
                      <ChevronDown className={`w-3.5 h-3.5 text-rosegold-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                ) : (
                  <Link 
                    href="/login" 
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2.5 rounded-full bg-dark-800 border border-rosegold-500/30 text-gray-200 hover:text-white hover:border-rosegold-400 font-semibold text-xs transition-all shadow-sm"
                  >
                    <User className="w-3.5 h-3.5 text-rosegold-400" />
                    <span>Sign In</span>
                  </Link>
                )}

                {/* Mobile Hamburger Toggle Button - Removed for Mobile Responsive View */}

              </div>

            </div>
          </div>

          {/* Mobile Responsive Navbar Dropdown Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 bg-dark-900/98 backdrop-blur-2xl px-4 py-4 space-y-2 animate-fadeIn shadow-2xl">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-xs font-semibold ${pathname === '/' ? 'rosegold-gradient-bg text-dark-900 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
              >
                Home
              </Link>
              <Link
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-xs font-semibold ${pathname === '/services' ? 'rosegold-gradient-bg text-dark-900 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
              >
                Services & Treatments
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-xs font-semibold ${isPricingOrOffersActive ? 'rosegold-gradient-bg text-dark-900 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
              >
                Pricing & Offers
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-xs font-semibold ${pathname === '/contact' ? 'rosegold-gradient-bg text-dark-900 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
              >
                Contact Us
              </Link>
              <Link
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3 text-center rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold mt-2"
              >
                Book Online Appointment
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Profile Modal / Drawer Overlay (For Customer Account Only) */}
      {profileDropdownOpen && user && !isAdminUser && !isEmployeeUser && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 pt-16 sm:pt-20 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            ref={profileRef} 
            className="w-full max-w-sm rounded-3xl bg-dark-900/95 border border-rosegold-500/40 backdrop-blur-2xl shadow-2xl p-5 space-y-4 animate-scaleUp text-left"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-12 h-12 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-base flex items-center justify-center shadow-md shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-white font-serif font-bold text-base truncate">{user.name || 'Valued Guest'}</h4>
                    <Crown className="w-4 h-4 text-rosegold-400 shrink-0" />
                  </div>
                  <p className="text-xs text-gray-400 truncate">{user.email || 'vip.member@spysalon.com'}</p>
                  <span className="inline-block text-[9px] font-bold text-rosegold-400 bg-rosegold-500/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Gold VIP Member
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setProfileDropdownOpen(false)}
                className="w-8 h-8 rounded-full bg-dark-800 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex bg-dark-800 p-1 rounded-xl text-xs font-semibold text-gray-400">
              <button
                onClick={() => setProfileTab('schedules')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  profileTab === 'schedules' ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>My Schedules</span>
              </button>

              <button
                onClick={() => setProfileTab('history')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  profileTab === 'history' ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Past Orders</span>
              </button>
            </div>

            {/* Tab 1: Schedules */}
            {profileTab === 'schedules' && (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                <div className="p-3.5 rounded-2xl bg-dark-800/80 border border-rosegold-500/30 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-serif text-sm">24K Royal Gold Glow Facial</span>
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/15 border border-green-500/30 px-2 py-0.5 rounded-full">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                    <span>Tomorrow, 11:00 AM • Jubilee Hills Studio</span>
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Past Orders */}
            {profileTab === 'history' && (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                <div className="p-3.5 rounded-2xl bg-dark-800/80 border border-white/10 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-serif text-sm">Aromatherapy Body Massage</span>
                    <span className="text-rosegold-400 font-bold font-serif text-sm">₹2,499</span>
                  </div>
                  <p className="text-xs text-gray-400">Completed on July 10 • 90 Min</p>
                </div>
              </div>
            )}

            {/* Quick Action Navigation Link */}
            <div className="pt-2 border-t border-white/10">
              <Link
                href="/profile"
                onClick={() => setProfileDropdownOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-rosegold-500/15 text-rosegold-300 hover:text-white border border-rosegold-500/30 text-xs font-bold text-center block w-full"
              >
                Full Customer Profile Page →
              </Link>
            </div>

            {/* Logout Footer Button */}
            <div className="pt-1">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center space-x-2 transition-colors border border-red-500/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out to Landing Page</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-2xl border-t border-rosegold-500/20 px-2 py-1.5 shadow-2xl transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="grid grid-cols-5 items-center text-center">
          
          {/* 1. Services */}
          <Link
            href="/services"
            className={`flex flex-col items-center justify-center space-y-0.5 py-0.5 transition-colors ${
              pathname === '/services' ? 'text-rosegold-400 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[9px] tracking-tight">Services</span>
          </Link>

          {/* 2. Book */}
          <button
            onClick={() => {
              if (!user) {
                router.push('/login?redirect=/book&auth_required=true');
              } else {
                router.push('/book');
              }
            }}
            className={`flex flex-col items-center justify-center space-y-0.5 py-0.5 transition-colors ${
              pathname === '/book' ? 'text-rosegold-400 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[9px] tracking-tight">Book</span>
          </button>

          {/* 3. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center space-y-0.5 py-0.5 transition-colors ${
              pathname === '/' ? 'text-rosegold-400 font-bold' : 'text-gray-300 hover:text-white'
            }`}
          >
            <div className="w-7 h-7 rounded-lg rosegold-gradient-bg flex items-center justify-center text-dark-900 shadow-sm">
              <Home className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-[9px] font-bold text-rosegold-400 tracking-tight">Home</span>
          </Link>

          {/* 4. Pricing */}
          <Link
            href="/pricing"
            className={`flex flex-col items-center justify-center space-y-0.5 py-0.5 transition-colors ${
              isPricingOrOffersActive ? 'text-rosegold-400 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span className="text-[9px] tracking-tight">Pricing</span>
          </Link>

          {/* 5. Contact */}
          <Link
            href="/contact"
            className={`flex flex-col items-center justify-center space-y-0.5 py-0.5 transition-colors ${
              pathname === '/contact' ? 'text-rosegold-400 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span className="text-[9px] tracking-tight">Contact</span>
          </Link>

        </div>
      </div>
    </>
  );
}
