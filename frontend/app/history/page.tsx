'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Package, 
  RefreshCw, 
  UserCheck, 
  CreditCard, 
  ArrowRight, 
  Sparkles,
  ShoppingBag,
  Filter,
  Search,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { API_BASE_URL, apiFetch } from '@/lib/api';
import AppointmentStatusBadge from '@/components/appointments/AppointmentStatusBadge';

interface ServiceDetail {
  serviceId?: string;
  name: string;
  price: number;
  durationMinutes?: number;
}

interface HistoryRecord {
  _id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  branch: string;
  service: string;
  services?: ServiceDetail[];
  additionalServices?: ServiceDetail[];
  packageTier?: string;
  packageName?: string;
  price?: number;
  finalAmount?: number;
  specialistName?: string;
  staffPreference?: string;
  appointmentDate: string;
  appointmentTime: string;
  bookingDateTime?: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  rescheduleRequested?: boolean;
  rescheduleData?: {
    requestedDate?: string;
    requestedTime?: string;
    reason?: string;
  };
  createdAt?: string;
}

function CustomerHistoryContent() {
  const { user, isLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'schedules' | 'past-orders'>('schedules');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [historyItems, setHistoryItems] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reschedule Action Modal State
  const [rescheduleItem, setRescheduleItem] = useState<HistoryRecord | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rescheduleTime, setRescheduleTime] = useState<string>('02:00 PM');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Cancel Action Modal State
  const [cancelItem, setCancelItem] = useState<HistoryRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  // STRICT ROLE & AUTH GUARD
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login?redirect=/history');
      return;
    }

    if (user.role === 'admin' || user.email?.includes('admin')) {
      router.push('/admin');
      return;
    }

    if (user.role === 'employee') {
      router.push('/employee');
      return;
    }

    fetchCustomerHistory();
  }, [user, isLoading, router]);

  // REALTIME SOCKET.IO INTEGRATION
  useEffect(() => {
    if (!socket || !user) return;

    const userEmail = user.email ? String(user.email).toLowerCase().trim() : '';
    const userId = (user as any)._id || user.id || '';

    if (userId) socket.emit('join_room', `room:user_${userId}`);
    if (userEmail) socket.emit('join_room', `room:user_${userEmail}`);

    const handleRealtimeUpdate = (data: any) => {
      const app = data?.appointment || data;
      if (!app) return;

      const appEmail = app.customerEmail ? String(app.customerEmail).toLowerCase().trim() : '';
      const appPhone = app.customerPhone ? String(app.customerPhone).trim() : '';
      const appCustId = app.customerId ? String(app.customerId) : '';

      const isMatch = (appCustId && userId && appCustId === String(userId)) ||
                      (appEmail && userEmail && appEmail === userEmail) ||
                      (appPhone && user.phone && appPhone === String(user.phone).trim());

      if (isMatch) {
        setHistoryItems(prev => {
          const exists = prev.some(item => item._id === app._id || item.bookingId === app.bookingId);
          if (exists) {
            return prev.map(item => (item._id === app._id || item.bookingId === app.bookingId) ? { ...item, ...app } : item);
          } else {
            return [app, ...prev];
          }
        });
      }
    };

    socket.on('appointment:new', handleRealtimeUpdate);
    socket.on('appointment:created', handleRealtimeUpdate);
    socket.on('appointment:updated', handleRealtimeUpdate);
    socket.on('appointment:accepted', handleRealtimeUpdate);
    socket.on('appointment:cancelled', handleRealtimeUpdate);
    socket.on('appointment:status_changed', handleRealtimeUpdate);

    return () => {
      socket.off('appointment:new', handleRealtimeUpdate);
      socket.off('appointment:created', handleRealtimeUpdate);
      socket.off('appointment:updated', handleRealtimeUpdate);
      socket.off('appointment:accepted', handleRealtimeUpdate);
      socket.off('appointment:cancelled', handleRealtimeUpdate);
      socket.off('appointment:status_changed', handleRealtimeUpdate);
    };
  }, [socket, user]);

  const fetchCustomerHistory = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`${API_BASE_URL}/user/history`);
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setHistoryItems(json.data);
      } else {
        setErrorMsg(json.message || 'Failed to retrieve booking history.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error fetching history.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Reschedule Handler
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleItem) return;
    setIsSubmittingReschedule(true);
    setActionSuccessMsg(null);

    try {
      const res = await apiFetch(`${API_BASE_URL}/user/appointments/${rescheduleItem._id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: rescheduleDate,
          newTime: rescheduleTime,
          reason: rescheduleReason
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActionSuccessMsg(`Reschedule request submitted for #${rescheduleItem.bookingId}!`);
        setRescheduleItem(null);
        fetchCustomerHistory();
      } else {
        alert(json.message || 'Failed to request reschedule.');
      }
    } catch (e: any) {
      alert(e.message || 'Error submitting reschedule.');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // Submit Cancellation Handler
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelItem) return;
    setIsSubmittingCancel(true);

    try {
      const res = await apiFetch(`${API_BASE_URL}/user/appointments/${cancelItem._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActionSuccessMsg(`Booking #${cancelItem.bookingId} has been cancelled.`);
        setCancelItem(null);
        fetchCustomerHistory();
      } else {
        alert(json.message || 'Failed to cancel appointment.');
      }
    } catch (e: any) {
      alert(e.message || 'Error cancelling appointment.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const isCompletedOrEnded = (status: string) => {
    return ['Completed', 'Cancelled', 'Staff_Rejected', 'Rejected', 'No Show'].includes(status);
  };

  // Filter items for Schedules (Upcoming/Active) vs Past Orders (Completed/Past)
  const schedulesList = historyItems.filter(item => !isCompletedOrEnded(item.status));
  const pastOrdersList = historyItems.filter(item => isCompletedOrEnded(item.status));

  const currentList = activeTab === 'schedules' ? schedulesList : pastOrdersList;

  const filteredList = currentList.filter(item => {
    if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = item.bookingId?.toLowerCase().includes(q);
      const matchSrv = item.service?.toLowerCase().includes(q);
      const matchPkg = item.packageName?.toLowerCase().includes(q);
      const matchStaff = item.specialistName?.toLowerCase().includes(q);
      return matchId || matchSrv || matchPkg || matchStaff;
    }
    return true;
  });

  if (isLoading || (user && (user.role === 'admin' || user.email?.includes('admin') || user.role === 'employee'))) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 text-rosegold-400 font-serif animate-pulse">
        Verifying Customer Authorization & History Module...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fadeIn text-left">
      
      {/* 1. HEADER SECTION */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rosegold-500/10 border border-rosegold-500/30 text-rosegold-400 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Authenticated Customer Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-wide">
            My Appointments & Booking History
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
            View active appointment schedules, track real-time specialist updates, and inspect past salon service receipts.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 z-10 self-stretch sm:self-auto">
          <button
            onClick={fetchCustomerHistory}
            className="p-3 rounded-2xl bg-dark-800 border border-white/10 text-rosegold-400 hover:text-white hover:border-rosegold-500/40 transition-all cursor-pointer shadow-md"
            title="Refresh History Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/book"
            className="px-6 py-3.5 rounded-2xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all text-center"
          >
            + Book New Session
          </Link>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* 2. MODULE NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex bg-dark-800/80 p-1.5 rounded-2xl border border-white/10 text-xs font-semibold text-gray-400">
          <button
            onClick={() => { setActiveTab('schedules'); setStatusFilter('all'); }}
            className={`px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'schedules' ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>MY SCHEDULES ({schedulesList.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('past-orders'); setStatusFilter('all'); }}
            className={`px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'past-orders' ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md' : 'hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>PAST ORDERS / BOOKINGS ({pastOrdersList.length})</span>
          </button>
        </div>

        {/* SEARCH & STATUS FILTER */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by ID, Service, Package..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rosegold-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-gray-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {activeTab === 'schedules' ? (
              <>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="reschedule requested">Reschedule Requested</option>
              </>
            ) : (
              <>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 3. CONTENT AREA — LOADING / ERROR / EMPTY / RECORDS LIST */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-6 bg-white/10 rounded w-2/3" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="p-8 text-center glass-card rounded-3xl border border-red-500/30 space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="text-lg font-serif font-bold text-white">Unable to Load History</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">{errorMsg}</p>
          <button
            onClick={fetchCustomerHistory}
            className="px-6 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md"
          >
            Retry Loading →
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-3xl border border-white/10 space-y-4">
          <Clock className="w-12 h-12 text-rosegold-400 mx-auto opacity-50" />
          <div className="space-y-1">
            <h3 className="text-lg font-serif font-bold text-white">No Booking History Available Yet</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' 
                ? 'No appointments match your current search or status filter criteria.' 
                : activeTab === 'schedules' 
                  ? 'You currently have no upcoming or active salon appointment schedules.' 
                  : 'You have no past completed or cancelled booking records.'}
            </p>
          </div>
          <Link
            href="/book"
            className="inline-block px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all"
          >
            Book a Service Now →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredList.map(item => {
            const hasPackage = !!(item.packageName || item.packageTier);
            const hasServicesList = item.services && item.services.length > 0;
            const hasAdditionalSrvs = item.additionalServices && item.additionalServices.length > 0;

            return (
              <div 
                key={item._id} 
                className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4 shadow-xl hover:border-rosegold-400/60 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* TOP HEADER: BOOKING ID & STATUS BADGE */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-rosegold-400 font-bold uppercase tracking-wider block">
                        #{item.bookingId}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {item.bookingDateTime ? new Date(item.bookingDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent Booking'}
                      </span>
                    </div>

                    <AppointmentStatusBadge status={item.status} />
                  </div>

                  {/* PACKAGE + INDIVIDUAL SERVICES DISPLAY */}
                  <div className="space-y-2 text-xs">
                    
                    {/* PACKAGE SELECTED (Requirement 6) */}
                    {hasPackage && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-rosegold-500/15 to-purple-900/30 border border-rosegold-500/40 space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <Package className="w-3.5 h-3.5 text-rosegold-400" />
                          <span className="text-rosegold-300 font-serif font-bold text-xs uppercase">Package Selected</span>
                        </div>
                        <p className="text-white font-bold text-sm">{item.packageName || item.packageTier}</p>
                      </div>
                    )}

                    {/* INDIVIDUAL SERVICES (Requirement 6) */}
                    {hasServicesList ? (
                      <div className="space-y-1.5">
                        <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Individual Services Selected:</span>
                        <div className="space-y-1">
                          {item.services?.map((srv, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-dark-850 border border-white/5">
                              <span className="text-white font-semibold">{srv.name}</span>
                              <span className="text-rosegold-400 font-mono">₹{srv.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      !hasPackage && (
                        <div className="p-2.5 rounded-xl bg-dark-850 border border-white/10">
                          <span className="text-gray-400 text-[10px] uppercase font-bold block">Booked Service:</span>
                          <span className="text-white font-serif font-bold text-sm">{item.service}</span>
                        </div>
                      )
                    )}

                    {/* ADDITIONAL INDIVIDUAL SERVICES SEPARATELY (Requirement 6) */}
                    {hasAdditionalSrvs && (
                      <div className="space-y-1 pt-1">
                        <span className="text-purple-300 text-[10px] uppercase font-bold tracking-wider block">+ Additional Services:</span>
                        <div className="space-y-1">
                          {item.additionalServices?.map((addSrv, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-purple-900/20 border border-purple-500/20">
                              <span className="text-purple-200 font-medium">{addSrv.name}</span>
                              <span className="text-purple-300 font-mono">+₹{addSrv.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* APPOINTMENT DATE & TIME */}
                    <div className="p-3 rounded-2xl bg-dark-900 border border-white/10 space-y-1.5">
                      <div className="flex items-center space-x-2 text-rosegold-300">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-bold">{item.appointmentDate} at {item.appointmentTime}</span>
                      </div>
                      <p className="text-gray-400 text-[11px] font-mono">Studio: {item.branch || 'SPY Salon Jubilee Hills'}</p>
                    </div>

                    {/* ASSIGNED STAFF SPECIALIST */}
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-dark-850 border border-white/5">
                      <span className="text-gray-400 text-[11px]">Assigned Specialist:</span>
                      <span className="text-white font-serif font-bold text-xs flex items-center space-x-1">
                        <UserCheck className="w-3 h-3 text-rosegold-400" />
                        <span>{item.specialistName || item.staffPreference || 'Any Available Specialist'}</span>
                      </span>
                    </div>

                    {/* FINANCIALS & PAYMENT STATUS */}
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-dark-850 border border-white/5">
                      <div>
                        <span className="text-gray-400 text-[10px] block">Payment Method</span>
                        <span className="text-white font-mono font-bold text-xs">{item.paymentMethod || 'Cash'}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-gray-400 text-[10px] block">Total Amount</span>
                        <span className="text-rosegold-400 font-serif font-bold text-base">
                          ₹{(item.finalAmount || item.price || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* REJECTION OR CANCELLATION REASON IF APPLICABLE */}
                    {item.rejectionReason && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]">
                        <strong>Staff Note:</strong> {item.rejectionReason}
                      </div>
                    )}
                    {item.cancellationReason && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]">
                        <strong>Reason:</strong> {item.cancellationReason}
                      </div>
                    )}

                  </div>
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-2">
                  {!isCompletedOrEnded(item.status) && (
                    <>
                      <button
                        onClick={() => { setRescheduleItem(item); setRescheduleDate(item.appointmentDate); setRescheduleTime(item.appointmentTime); }}
                        className="px-3.5 py-2 rounded-xl bg-dark-800 text-rosegold-300 border border-rosegold-500/30 hover:bg-dark-700 font-bold text-xs cursor-pointer"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setCancelItem(item)}
                        className="px-3.5 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {isCompletedOrEnded(item.status) && (
                    <button
                      onClick={() => router.push(`/book?service=${encodeURIComponent(item.service)}`)}
                      className="w-full py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Book Again</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RESCHEDULE MODAL POPUP */}
      {rescheduleItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-left">
          <div className="w-full max-w-md glass-card p-6 rounded-3xl border border-rosegold-500/40 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-white text-base">Request Slot Reschedule</h3>
              <button onClick={() => setRescheduleItem(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1">New Preferred Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">New Preferred Time Slot *</label>
                <select
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Reason for Reschedule</label>
                <textarea
                  rows={2}
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Schedule clash / emergency"
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setRescheduleItem(null)} className="px-4 py-2 rounded-xl bg-dark-800 text-gray-300">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReschedule}
                  className="px-6 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold cursor-pointer"
                >
                  {isSubmittingReschedule ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL APPOINTMENT MODAL POPUP */}
      {cancelItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-left">
          <div className="w-full max-w-md glass-card p-6 rounded-3xl border border-red-500/40 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-red-400 text-base">Cancel Appointment</h3>
              <button onClick={() => setCancelItem(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-3 text-xs">
              <p className="text-gray-300">
                Are you sure you want to cancel booking <strong className="text-white font-mono">#{cancelItem.bookingId}</strong> ({cancelItem.service})?
              </p>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Cancellation Reason</label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Please let us know why you are cancelling..."
                  className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setCancelItem(null)} className="px-4 py-2 rounded-xl bg-dark-800 text-gray-300">
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="px-6 py-2 rounded-xl bg-red-600 text-white font-extrabold cursor-pointer"
                >
                  {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CustomerHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900 text-rosegold-400 flex items-center justify-center font-serif">Loading Customer History...</div>}>
      <CustomerHistoryContent />
    </Suspense>
  );
}
