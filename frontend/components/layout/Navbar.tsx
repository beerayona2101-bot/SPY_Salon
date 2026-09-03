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
  Menu,
  LayoutDashboard,
  Bell,
  CheckCheck,
  Check,
  Trash2,
  Sun,
  Moon
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';
import { AnimatedButton } from '@/components/ui/animated-button';
import { motion, AnimatePresence } from 'framer-motion';
import VIPBadge from '@/components/common/VIPBadge';
import ProfileAvatar from '@/components/common/ProfileAvatar';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const { user, logout } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { socket } = useSocket();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profileTab, setProfileTab] = useState<'schedules' | 'history'>('schedules');
  const [userAppointments, setUserAppointments] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [tickerData, setTickerData] = useState({ active: false, text: '' });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const loadTicker = async () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('spy_landing_settings');
        if (stored) {
          try {
            const p = JSON.parse(stored);
            if (p.announcementActive !== undefined) {
              setTickerData({ active: !!p.announcementActive, text: p.announcement || '' });
            }
          } catch (e) {}
        }
      }

      try {
        const res = await fetch(`${API_BASE_URL}/public/landing-settings`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const p = json.data;
            setTickerData({ active: !!p.announcementActive, text: p.announcement || '' });
            if (typeof window !== 'undefined') {
              localStorage.setItem('spy_landing_settings', JSON.stringify(p));
            }
          }
        }
      } catch (e) {}
    };

    loadTicker();
    window.addEventListener('storage', loadTicker);

    if (socket) {
      socket.on('landing_settings_updated', (p: any) => {
        if (p && p.announcementActive !== undefined) {
          setTickerData({ active: !!p.announcementActive, text: p.announcement || '' });
          if (typeof window !== 'undefined') {
            localStorage.setItem('spy_landing_settings', JSON.stringify(p));
          }
        }
      });
    }

    return () => {
      window.removeEventListener('storage', loadTicker);
      if (socket) {
        socket.off('landing_settings_updated');
      }
    };
  }, [socket]);

  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const currentRole = user?.role || (user?.email?.includes('admin') ? 'admin' : 'user');

  const fetchAppNotifications = async () => {
    try {
      if (!user) {
        const res = await fetch(`${API_BASE_URL}/notifications?role=guest`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
        } else {
          setNotifications([]);
        }
        return;
      }

      const userId = (user as any)?._id || user?.id || '';
      const email = user?.email || '';
      const res = await fetch(`${API_BASE_URL}/notifications?role=${currentRole}${userId ? `&userId=${userId}` : ''}${email ? `&email=${encodeURIComponent(email)}` : ''}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        let list = data.data;
        const welcomeDismissed = typeof window !== 'undefined' ? localStorage.getItem('spy_welcome_dismissed') : null;
        if (welcomeDismissed) {
          list = list.filter((n: any) => !n.title?.toLowerCase().includes('welcome'));
        }
        setNotifications(list);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAppNotifications();
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchAppNotifications();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [user, pathname]);

  const fetchUserAppointments = async () => {
    if (!user) {
      setUserAppointments([]);
      return;
    }
    try {
      const email = user.email || '';
      const phone = user.phone || '';
      const res = await fetch(`${API_BASE_URL}/user/appointments?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setUserAppointments(data.data);
      } else {
        setUserAppointments([]);
      }
    } catch (e) {
      setUserAppointments([]);
    }
  };

  useEffect(() => {
    if (profileDropdownOpen && user) {
      fetchUserAppointments();
    }
  }, [profileDropdownOpen, user]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('notification:new', (newNotif: any) => {
      if (!newNotif) return;
      if (!user) return; // Guests ignore live personal notifications

      const userEmail = user?.email ? user.email.toLowerCase().trim() : '';
      const userId = (user as any)?._id || user?.id || '';

      const notifEmail = newNotif.email ? String(newNotif.email).toLowerCase().trim() : '';
      const notifUserId = newNotif.userId ? String(newNotif.userId) : '';

      // If notification is explicitly targeted to an email or userId, strictly verify it matches current user
      if (notifEmail || notifUserId) {
        const matchesEmail = !!(notifEmail && userEmail && notifEmail === userEmail);
        const matchesUser = !!(notifUserId && userId && notifUserId === String(userId));
        if (!matchesEmail && !matchesUser) {
          return; // Do NOT render notifications belonging to other accounts!
        }
      } else {
        // If not explicitly targeted to a specific user/email, verify role matching
        const isRoleMatch = newNotif.role === 'all' || newNotif.role === 'public' || newNotif.role === currentRole;
        if (!isRoleMatch) return;
      }

      setNotifications(prev => [newNotif, ...prev.filter(n => n.notificationId !== newNotif.notificationId)]);
    });

    socket.on('notifications:updated', () => {
      fetchAppNotifications();
    });

    socket.on('notifications:read_all', () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    });

    socket.on('notifications:cleared', () => {
      setNotifications([]);
    });

    return () => {
      socket.off('notification:new');
      socket.off('notifications:updated');
      socket.off('notifications:read_all');
      socket.off('notifications:cleared');
    };
  }, [socket]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read/${id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => (n._id === id || n.notificationId === id) ? { ...n, isRead: true } : n));
    } catch (e) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentRole, userId: (user as any)?._id || user?.id })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const handleDeleteNotif = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n._id !== id && n.notificationId !== id));
    } catch (e) {}
  };

  const handleClearAllNotifs = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('spy_welcome_dismissed', 'true');
      }
      await fetch(`${API_BASE_URL}/notifications/clear-all`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentRole, userId: (user as any)?._id || user?.id })
      });
      setNotifications([]);
    } catch (e) {}
  };

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
    router.push('/');
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
  const isCustomerUser = !!user && !isAdminUser && !isEmployeeUser;
  const isDashboardRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/employee');

  const handleProfileButtonClick = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleClearUserNotifs = async () => {
    handleClearAllNotifs();
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
      }`}>
        {isMounted && tickerData.active && tickerData.text && (
          <div className="bg-gradient-to-r from-amber-700 via-rosegold-500 to-amber-700 text-dark-900 text-[11px] font-extrabold py-1 px-4 text-center overflow-hidden border-b border-rosegold-400/40 shadow-sm">
            <span className="truncate block max-w-7xl mx-auto">{tickerData.text}</span>
          </div>
        )}
        <nav className={`transition-all duration-300 py-2.5 sm:py-3 ${
          isScrolled 
            ? 'bg-dark-900/95 backdrop-blur-2xl border-b border-rosegold-500/20 shadow-glass' 
            : 'bg-dark-900/40 backdrop-blur-md border-b border-white/5'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between min-h-[44px] gap-2">
              
              {/* Brand Logo & Title Group (Left aligned on all viewports - No collision) */}
              <Link 
                href="/" 
                className="flex items-center space-x-2 sm:space-x-3 group shrink-0" 
                title="SPY Salon"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white p-0.5 border border-rosegold-500/40 flex items-center justify-center shadow-glow-rosegold group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                  <img src="/logo-icon.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col text-left">
                  <span className={`font-serif text-sm sm:text-lg md:text-xl font-bold tracking-widest leading-none ${theme === 'light' ? 'text-gray-900 font-extrabold' : 'text-white'}`}>
                    SPY <span className="rosegold-gradient-text font-bold">SALON</span>
                  </span>
                  <span className="text-[7.5px] sm:text-[9px] tracking-[0.15em] sm:tracking-[0.2em] text-rosegold-500 uppercase font-sans mt-0.5 font-bold truncate max-w-[130px] sm:max-w-none">
                    Jubilee Hills Studio
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <div className={`hidden md:flex items-center space-x-1 p-1.5 rounded-full border backdrop-blur-xl shadow-inner ${theme === 'light' ? 'bg-white/90 border-amber-900/20' : 'bg-dark-800/80 border-rosegold-500/20'}`}>
                <Link href="/" className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${pathname === '/' ? 'rosegold-gradient-bg text-white font-extrabold shadow-md' : (theme === 'light' ? 'text-gray-900 font-bold hover:text-amber-800' : 'text-gray-300 hover:text-white hover:bg-white/10')}`}>Home</Link>
                <Link href="/services" className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${pathname === '/services' ? 'rosegold-gradient-bg text-white font-extrabold shadow-md' : (theme === 'light' ? 'text-gray-900 font-bold hover:text-amber-800' : 'text-gray-300 hover:text-white hover:bg-white/10')}`}>Services</Link>
                <Link href="/pricing" className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${isPricingOrOffersActive ? 'rosegold-gradient-bg text-white font-extrabold shadow-md' : (theme === 'light' ? 'text-gray-900 font-bold hover:text-amber-800' : 'text-gray-300 hover:text-white hover:bg-white/10')}`}>Pricing</Link>
                <Link href="/contact" className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${pathname === '/contact' ? 'rosegold-gradient-bg text-white font-extrabold shadow-md' : (theme === 'light' ? 'text-gray-900 font-bold hover:text-amber-800' : 'text-gray-300 hover:text-white hover:bg-white/10')}`}>Contact</Link>
                {isCustomerUser && (
                  <Link href="/history" className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${pathname === '/history' ? 'rosegold-gradient-bg text-white font-extrabold shadow-md' : (theme === 'light' ? 'text-gray-900 font-bold hover:text-amber-800' : 'text-gray-300 hover:text-white hover:bg-white/10')}`}>History</Link>
                )}
              </div>

              {/* Notification Bell Icon & Profile Avatar / Executive Desk Button - Right Action Group */}
              <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
                
                {/* THEME TOGGLE BUTTON */}
                <AnimatedThemeToggler
                  theme={theme}
                  onThemeChange={setTheme}
                />

                {/* UNIVERSAL REAL-TIME NOTIFICATION BELL */}
                <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                      className={`p-1.5 sm:p-2 rounded-full bg-dark-800 border text-rosegold-400 hover:text-white transition-all cursor-pointer relative ${
                        user && unreadCount > 0 
                          ? 'border-rosegold-400 animate-pulse shadow-glow-rosegold text-white ring-2 ring-rosegold-500/50' 
                          : 'border-white/10 hover:border-rosegold-500/40'
                      }`}
                      title="Real-Time Notifications & System Alerts"
                    >
                      <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {user && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-dark-900 font-extrabold text-[9px] flex items-center justify-center shadow-md animate-bounce">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* NOTIFICATION DROPDOWN PANEL - SOLID OPAQUE LUXURY BACKGROUND */}
                    <AnimatePresence>
                      {notifDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.93, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.93, y: -10 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                          className="absolute right-0 mt-2 w-80 sm:w-[410px] max-h-[calc(100vh-120px)] flex flex-col rounded-3xl bg-[#141012] border-2 border-rosegold-500/50 shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-4 space-y-3.5 z-[9999] text-left ring-1 ring-black/80 notif-dropdown-card"
                        >
                          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 shrink-0">
                            <div className="flex items-center space-x-2">
                              <Bell className="w-4 h-4 text-rosegold-400" />
                              <h4 className="text-white font-serif font-bold text-sm">Notifications & Alerts</h4>
                              {user && unreadCount > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                  {unreadCount} unread
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {user && unreadCount > 0 && (
                                <button
                                  onClick={handleMarkAllAsRead}
                                  className="text-[10px] text-rosegold-300 hover:text-white font-bold flex items-center space-x-1 cursor-pointer"
                                  title="Mark all notifications as read"
                                >
                                  <CheckCheck className="w-3 h-3" />
                                  <span>Read All</span>
                                </button>
                              )}
                              {user && notifications.length > 0 && (
                                <button
                                  onClick={handleClearAllNotifs}
                                  className="text-[10px] text-gray-400 hover:text-red-400 font-bold underline cursor-pointer"
                                >
                                  Clear All
                                </button>
                              )}
                              <button onClick={() => setNotifDropdownOpen(false)} className="text-gray-400 hover:text-white text-xs cursor-pointer p-1">✕</button>
                            </div>
                          </div>

                          {/* GUEST (UNAUTHENTICATED) NOTIFICATION PROMPT */}
                          {!user ? (
                            <div className="p-5 rounded-2xl bg-[#1c1619] border border-rosegold-500/30 text-center space-y-3 my-1 shrink-0">
                              <div className="w-10 h-10 rounded-full bg-rosegold-500/20 text-rosegold-400 flex items-center justify-center mx-auto border border-rosegold-500/40 shadow-inner">
                                <User className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <h5 className="font-serif font-bold text-white text-sm">Sign In for Personal Alerts</h5>
                                <p className="text-gray-300 text-xs leading-relaxed">
                                  Log in to your SPY Salon VIP account to receive real-time updates on your service inquiries, appointment schedules, and exclusive offers.
                                </p>
                              </div>
                              <Link
                                href="/login"
                                onClick={() => setNotifDropdownOpen(false)}
                                className="inline-block w-full py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold transition-transform active:scale-95 text-center mt-1"
                              >
                                Sign In to Account →
                              </Link>
                            </div>
                          ) : (
                            /* LOGGED IN USER NOTIFICATIONS LIST */
                            <div className="space-y-2.5 max-h-[calc(100vh-220px)] sm:max-h-[420px] overflow-y-auto pr-1.5 custom-scrollbar shrink flex-1">
                              {notifications.length === 0 ? (
                                <div className="text-center py-8 space-y-2 bg-[#181316] rounded-2xl border border-white/5">
                                  <Bell className="w-7 h-7 mx-auto text-gray-500 opacity-40" />
                                  <p className="text-xs text-gray-400 font-medium">No active notifications for your account.</p>
                                </div>
                              ) : (
                                notifications.map((n) => {
                                  const isActionRequired = n.title?.includes('Reschedule') || n.title?.includes('Reject') || n.type === 'reschedule_needed';
                                  const isEnquiry = n.type === 'enquiry' || n.title?.includes('Inquiry');
                                  const isAppointment = n.type === 'appointment' || n.title?.includes('Appointment');

                                  return (
                                    <div 
                                      key={n._id || n.notificationId} 
                                      className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all relative ${
                                        !n.isRead
                                          ? 'bg-[#221a1e] border-l-4 border-l-rosegold-400 border-rosegold-500/30 text-white shadow-md' 
                                          : 'bg-[#181316] border-l-4 border-l-gray-600 border-white/10 text-gray-300 opacity-90'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-1.5 overflow-hidden pr-2">
                                          {!n.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-rosegold-400 animate-pulse shrink-0" title="Unread" />
                                          )}
                                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                            isEnquiry 
                                              ? 'bg-rosegold-500/20 text-rosegold-300 border border-rosegold-500/30'
                                              : isAppointment 
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          }`}>
                                            {isEnquiry ? 'Enquiry Status' : isAppointment ? 'Appointment' : 'System Alert'}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center space-x-1.5 shrink-0">
                                          <span className="text-[9.5px] text-gray-400 font-mono">
                                            {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                          </span>
                                          {!n.isRead && (
                                            <button
                                              onClick={() => handleMarkAsRead(n._id || n.notificationId)}
                                              className="text-gray-400 hover:text-green-400 p-0.5 cursor-pointer"
                                              title="Mark as read"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleDeleteNotif(n._id || n.notificationId)}
                                            className="text-gray-500 hover:text-red-400 p-0.5 cursor-pointer"
                                            title="Delete notification"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      <h5 className="font-bold text-white text-xs pt-0.5">{n.title}</h5>
                                      <p className="text-gray-200 text-[11px] leading-relaxed font-sans">{n.message}</p>
                                      
                                      {isActionRequired && n.bookingId && (
                                        <Link
                                          href={`/book?rescheduleId=${n.bookingId}`}
                                          onClick={() => setNotifDropdownOpen(false)}
                                          className="inline-block mt-1 text-[11px] font-bold text-rosegold-400 hover:text-white underline cursor-pointer"
                                        >
                                          Reschedule Slot Now (Pre-Paid) →
                                        </Link>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                {user ? (
                  <button
                    onClick={handleProfileButtonClick}
                    className="flex items-center space-x-1.5 sm:space-x-2 p-1 sm:px-3 sm:py-1.5 rounded-full bg-dark-800 border border-rosegold-500/40 text-white font-medium text-xs hover:border-rosegold-400 transition-all shadow-glow-rosegold cursor-pointer"
                    title="User Profile & Account"
                  >
                    <ProfileAvatar user={user} name={user.name} size="xs" className="w-6 h-6 sm:w-7 sm:h-7" showBorder={false} />
                    <span className="hidden sm:inline font-serif font-bold text-xs truncate max-w-[90px] sm:max-w-[120px]">
                      {user.name ? user.name.split(' ')[0] : 'Profile'}
                    </span>
                    {(user.membership?.badge || user.membership?.tier) && (
                      <VIPBadge badge={user.membership?.badge} tier={user.membership?.tier || user.membership?.code} size="sm" className="hidden lg:inline-flex" />
                    )}
                    <ChevronDown className={`hidden sm:inline-block w-3.5 h-3.5 text-rosegold-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <AnimatedButton 
                    as={Link}
                    href="/login" 
                    className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full bg-dark-800 border border-rosegold-500/30 text-gray-200 hover:text-white hover:border-rosegold-400 font-semibold text-xs transition-all shadow-sm"
                  >
                    <User className="w-3.5 h-3.5 text-rosegold-400 mr-1" />
                    <span>Sign In</span>
                  </AnimatedButton>
                )}

                {/* Mobile Hamburger Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1.5 sm:p-2 rounded-full bg-dark-800 border border-white/10 text-rosegold-400 hover:text-white hover:border-rosegold-500/40 transition-all cursor-pointer flex items-center justify-center"
                  title="Toggle Mobile Menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>

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
              {isCustomerUser && (
                <Link
                  href="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-xs font-semibold ${pathname === '/history' ? 'rosegold-gradient-bg text-dark-900 font-bold' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  History
                </Link>
              )}
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

      {/* Profile Modal / Drawer Overlay */}
      <AnimatePresence>
        {profileDropdownOpen && user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-start justify-end p-4 pt-16 sm:pt-20 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              ref={profileRef} 
              initial={{ opacity: 0, scale: 0.92, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-sm rounded-3xl bg-dark-900/95 border border-rosegold-500/40 backdrop-blur-2xl shadow-2xl p-5 space-y-4 text-left profile-dropdown-card"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <ProfileAvatar user={user} name={user.name} size="lg" />
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-white font-serif font-bold text-base truncate">{user.name || 'Valued User'}</h4>
                      <Crown className="w-4 h-4 text-rosegold-400 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-400 truncate">{user.email || 'user@spysalon.com'}</p>
                    <span className="inline-block text-[9px] font-bold text-rosegold-400 bg-rosegold-500/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {isAdminUser ? 'Administrator' : isEmployeeUser ? 'Staff Member' : 'Gold VIP Member'}
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

              {isAdminUser ? (
                <div className="space-y-2">
                  <Link
                    href="/admin"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2.5 p-3 rounded-xl bg-rosegold-500/15 hover:bg-rosegold-500/25 text-rosegold-300 hover:text-white border border-rosegold-500/30 text-xs font-bold transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4 text-rosegold-400" />
                    <span>Admin Control Center Dashboard</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2.5 p-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition-all"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span>My Profile Details</span>
                  </Link>
                </div>
              ) : isEmployeeUser ? (
                <div className="space-y-2">
                  <Link
                    href="/employee"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2.5 p-3 rounded-xl bg-rosegold-500/15 hover:bg-rosegold-500/25 text-rosegold-300 hover:text-white border border-rosegold-500/30 text-xs font-bold transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4 text-rosegold-400" />
                    <span>Staff Portal Dashboard</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2.5 p-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition-all"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span>My Profile Details</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/history"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2.5 p-3 rounded-xl bg-rosegold-500/15 hover:bg-rosegold-500/25 text-rosegold-300 hover:text-white border border-rosegold-500/30 text-xs font-bold transition-all"
                  >
                    <Clock className="w-4 h-4 text-rosegold-400" />
                    <span>My History & Schedules</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2.5 p-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition-all"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span>My Profile Details</span>
                  </Link>
                </div>
              )}

              {/* Logout Footer Button */}
              <div className="pt-1 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center space-x-2 transition-colors border border-red-500/20 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
