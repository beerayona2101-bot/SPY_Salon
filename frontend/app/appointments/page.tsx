'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Award, 
  AlertCircle, 
  XCircle, 
  UserX, 
  Sparkles, 
  RotateCcw, 
  LayoutGrid, 
  List, 
  Plus, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { API_BASE_URL } from '@/lib/api';
import AppointmentCard, { AppointmentCardData } from '@/components/appointments/AppointmentCard';
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal';

function AppointmentsContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFromUrl = searchParams?.get('status') || 'All';
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>(statusFromUrl);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  const [appointments, setAppointments] = useState<AppointmentCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [selectedAppModal, setSelectedAppModal] = useState<AppointmentCardData | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Initial Fetch & Socket listener
  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('appointment:updated', (data: any) => {
      if (data?.appointment) {
        setAppointments(prev => prev.map(a => a._id === data.appointment._id ? { ...a, ...data.appointment } : a));
      } else {
        fetchAppointments();
      }
    });

    socket.on('appointment:rescheduled', () => fetchAppointments());
    socket.on('appointment:created', () => fetchAppointments());

    return () => {
      socket.off('appointment:updated');
      socket.off('appointment:rescheduled');
      socket.off('appointment:created');
    };
  }, [socket]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const email = user?.email || 'vip.guest@spysalon.com';
      const phone = user?.phone || '';

      const res = await fetch(`${API_BASE_URL}/user/appointments?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setAppointments(data.data);
      } else {
        // Fallback default sample records for rich demonstration
        setAppointments([
          {
            _id: 'app1',
            bookingId: 'SPY-98214',
            service: '24K Royal Gold Glow Facial',
            serviceImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80',
            specialistName: 'Priya Reddy',
            specialistPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
            appointmentDate: '2026-07-29',
            appointmentTime: '11:30 AM',
            durationMinutes: 60,
            duration: '60 min',
            branch: 'Jubilee Hills Flagship Studio',
            status: 'Confirmed',
            paymentMethod: 'UPI',
            paymentStatus: 'Paid',
            price: 2499,
            vipDiscountPercent: 20
          },
          {
            _id: 'app2',
            bookingId: 'SPY-97102',
            service: 'Signature Keratin Hair Spa & Mask',
            serviceImage: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&auto=format&fit=crop&q=80',
            specialistName: 'Ananya Sharma',
            specialistPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
            appointmentDate: '2026-07-28',
            appointmentTime: '02:30 PM',
            durationMinutes: 75,
            duration: '75 min',
            branch: 'Gachibowli Executive Suite',
            status: 'In Progress',
            paymentMethod: 'Razorpay',
            paymentStatus: 'Paid',
            price: 1999,
            vipDiscountPercent: 20
          },
          {
            _id: 'app3',
            bookingId: 'SPY-95410',
            service: 'Royal Beard Sculpting & Charcoal Steam',
            serviceImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=80',
            specialistName: 'Rahul Verma',
            specialistPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
            appointmentDate: '2026-07-20',
            appointmentTime: '04:00 PM',
            durationMinutes: 45,
            duration: '45 min',
            branch: 'Jubilee Hills Flagship Studio',
            status: 'Completed',
            paymentMethod: 'UPI',
            paymentStatus: 'Paid',
            price: 1499,
            vipDiscountPercent: 10
          },
          {
            _id: 'app4',
            bookingId: 'SPY-92019',
            service: 'Aroma Luxury Full Body Massage',
            serviceImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&auto=format&fit=crop&q=80',
            specialistName: 'Meera Kapoor',
            specialistPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            appointmentDate: '2026-07-15',
            appointmentTime: '01:00 PM',
            durationMinutes: 90,
            duration: '90 min',
            branch: 'Banjara Hills Lounge',
            status: 'Cancelled',
            cancellationReason: 'Customer requested cancellation due to travel schedule change.',
            paymentMethod: 'Cash',
            paymentStatus: 'Refunded',
            price: 2999
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Status Counters Calculation
  const statusCounters = useMemo(() => {
    const counts = {
      Confirmed: 0,
      'In Progress': 0,
      Completed: 0,
      Pending: 0,
      Rescheduled: 0,
      Cancelled: 0,
      'No Show': 0
    };

    appointments.forEach(a => {
      const s = (a.status || 'Confirmed').trim();
      if (s === 'Reschedule Requested') {
        counts.Rescheduled += 1;
      } else if (counts.hasOwnProperty(s)) {
        (counts as any)[s] += 1;
      }
    });

    return counts;
  }, [appointments]);

  // Filtered & Searched Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchesStatus = 
        activeStatusFilter === 'All' ||
        (activeStatusFilter === 'Rescheduled' && (a.status === 'Rescheduled' || a.status === 'Reschedule Requested')) ||
        a.status?.toLowerCase() === activeStatusFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        a.bookingId?.toLowerCase().includes(q) ||
        a.service?.toLowerCase().includes(q) ||
        a.specialistName?.toLowerCase().includes(q) ||
        a.branch?.toLowerCase().includes(q) ||
        a.appointmentDate?.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [appointments, activeStatusFilter, searchQuery]);

  // Grouped Appointments Structure
  const groupedSections = useMemo(() => {
    const groups: { [key: string]: AppointmentCardData[] } = {
      'In Progress 🔵': [],
      'Confirmed 🟢': [],
      'Pending 🟡': [],
      'Rescheduled 🟠': [],
      'Completed ✅': [],
      'Cancelled 🔴': [],
      'No Show ⚫': []
    };

    filteredAppointments.forEach(a => {
      const s = a.status || 'Confirmed';
      if (s === 'In Progress') groups['In Progress 🔵'].push(a);
      else if (s === 'Confirmed') groups['Confirmed 🟢'].push(a);
      else if (s === 'Pending') groups['Pending 🟡'].push(a);
      else if (s === 'Rescheduled' || s === 'Reschedule Requested') groups['Rescheduled 🟠'].push(a);
      else if (s === 'Completed') groups['Completed ✅'].push(a);
      else if (s === 'Cancelled') groups['Cancelled 🔴'].push(a);
      else groups['No Show ⚫'].push(a);
    });

    return Object.entries(groups).filter(([_, list]) => list.length > 0);
  }, [filteredAppointments]);

  // Handlers for Appointment Actions
  const handleRescheduleTrigger = (app: AppointmentCardData) => {
    setSelectedAppModal(app);
    setIsDetailsModalOpen(true);
  };

  const handleCancelTrigger = async (app: AppointmentCardData) => {
    if (!confirm(`Are you sure you want to cancel booking #${app.bookingId}?`)) return;
    try {
      await fetch(`${API_BASE_URL}/user/appointments/${app._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by customer' })
      });
      fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRateReviewTrigger = (app: AppointmentCardData) => {
    setSelectedAppModal(app);
    setIsDetailsModalOpen(true);
  };

  const handleBookAgainTrigger = (app: AppointmentCardData) => {
    router.push(`/book?service=${encodeURIComponent(app.service)}`);
  };

  const handleRescheduleSubmit = async (id: string, newDate: string, newTime: string, reason: string) => {
    await fetch(`${API_BASE_URL}/user/appointments/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDate, newTime, reason })
    });
    fetchAppointments();
  };

  const handleReviewSubmit = async (id: string, rating: number, comment: string) => {
    await fetch(`${API_BASE_URL}/user/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: id, rating, comment })
    });
    fetchAppointments();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* 1. HERO PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rosegold-500/10 border border-rosegold-500/30 text-rosegold-400 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-rosegold-400" />
            <span>Salon Appointments Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
            My Appointments Desk
          </h1>
          <p className="text-xs text-gray-400">
            Real-time appointment tracker with live status updates, queue progress, and reschedule controls.
          </p>
        </div>

        <Link
          href="/book"
          className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all self-start sm:self-auto flex items-center space-x-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Book New Session →</span>
        </Link>
      </div>

      {/* 2. TOP SUMMARY STATUS KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle2, count: statusCounters.Confirmed, color: 'text-green-400 border-green-500/40 bg-green-500/10' },
          { key: 'In Progress', label: 'In Progress', icon: Clock, count: statusCounters['In Progress'], color: 'text-sky-300 border-sky-500/40 bg-sky-500/10' },
          { key: 'Completed', label: 'Completed', icon: Award, count: statusCounters.Completed, color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
          { key: 'Pending', label: 'Pending', icon: AlertCircle, count: statusCounters.Pending, color: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
          { key: 'Rescheduled', label: 'Rescheduled', icon: Calendar, count: statusCounters.Rescheduled, color: 'text-orange-300 border-orange-500/40 bg-orange-500/10' },
          { key: 'Cancelled', label: 'Cancelled', icon: XCircle, count: statusCounters.Cancelled, color: 'text-red-400 border-red-500/40 bg-red-500/10' },
          { key: 'No Show', label: 'No Show', icon: UserX, count: statusCounters['No Show'], color: 'text-gray-300 border-gray-500/40 bg-gray-500/10' }
        ].map(item => {
          const IconComp = item.icon;
          const isSelected = activeStatusFilter === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setActiveStatusFilter(item.key)}
              className={`p-3 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between space-y-2 cursor-pointer ${
                isSelected
                  ? 'rosegold-glass-card border-rosegold-400 shadow-glow-rosegold scale-[1.03]'
                  : 'bg-dark-850/80 border-white/10 hover:border-rosegold-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <IconComp className={`w-4 h-4 ${item.color.split(' ')[0]}`} />
                <span className={`text-base font-serif font-bold ${item.color.split(' ')[0]}`}>
                  {item.count}
                </span>
              </div>
              <span className="text-[11px] font-bold text-white truncate block">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. SEARCH & MULTI-FILTER CONTROL BAR */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-rosegold-500/20">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ID, service, specialist, branch..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800 text-white text-xs border border-white/10 focus:outline-none focus:border-rosegold-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto custom-scrollbar">
          {['All', 'Confirmed', 'In Progress', 'Completed', 'Pending', 'Rescheduled', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setActiveStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeStatusFilter === st
                  ? 'rosegold-gradient-bg text-dark-900 shadow-sm'
                  : 'bg-dark-800 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* View Mode Switch (Grouped vs Flat List) */}
        <div className="flex items-center space-x-1 bg-dark-800 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setViewMode('grouped')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grouped' ? 'bg-rosegold-500 text-dark-900' : 'text-gray-400 hover:text-white'
            }`}
            title="Group by Status Sections"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-rosegold-500 text-dark-900' : 'text-gray-400 hover:text-white'
            }`}
            title="Continuous Flat List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 4. APPOINTMENTS LIST / GROUPED DISPLAY */}
      {filteredAppointments.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rosegold-500/15 text-rosegold-400 flex items-center justify-center mx-auto border border-rosegold-500/30">
            <Calendar className="w-8 h-8 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-serif font-bold text-white">No Appointments Found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              No appointment records match the selected status filter or search criteria.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/book"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Book a New Salon Session</span>
            </Link>
          </div>
        </div>
      ) : viewMode === 'grouped' ? (
        /* GROUPED BY STATUS SECTIONS */
        <div className="space-y-8">
          {groupedSections.map(([groupTitle, list]) => (
            <div key={groupTitle} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-serif font-bold text-lg text-white flex items-center space-x-2">
                  <span>{groupTitle}</span>
                  <span className="text-xs font-mono font-bold text-rosegold-400 bg-rosegold-500/10 px-2.5 py-0.5 rounded-full border border-rosegold-500/20">
                    {list.length}
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {list.map(app => (
                  <AppointmentCard
                    key={app._id}
                    appointment={app}
                    onReschedule={handleRescheduleTrigger}
                    onCancel={handleCancelTrigger}
                    onRateReview={handleRateReviewTrigger}
                    onBookAgain={handleBookAgainTrigger}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* FLAT LIST VIEW */
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map(app => (
            <AppointmentCard
              key={app._id}
              appointment={app}
              onReschedule={handleRescheduleTrigger}
              onCancel={handleCancelTrigger}
              onRateReview={handleRateReviewTrigger}
              onBookAgain={handleBookAgainTrigger}
            />
          ))}
        </div>
      )}

      {/* 5. DETAILS & ACTIONS MODAL */}
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={selectedAppModal}
        onRescheduleSubmit={handleRescheduleSubmit}
        onReviewSubmit={handleReviewSubmit}
      />

    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900 text-rosegold-400 flex items-center justify-center font-serif">Loading Appointments Desk...</div>}>
      <AppointmentsContent />
    </Suspense>
  );
}
