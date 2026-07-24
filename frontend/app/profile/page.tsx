'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Crown, 
  Calendar, 
  Clock, 
  CreditCard, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  ArrowRight,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { API_BASE_URL } from '@/lib/api';

interface AppointmentRecord {
  _id: string;
  bookingId: string;
  service: string;
  specialistName?: string;
  staffPreference?: string;
  branch: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  bookingDateTime?: string;
  bookingDate?: string;
  bookingTimeFormatted?: string;
}

interface OfferRecord {
  _id?: string;
  title: string;
  code: string;
  discountPercentage: number;
  description: string;
  validUntil: string;
}

export default function UserProfilePage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [hasMembership, setHasMembership] = useState<boolean>(false);
  const [membershipDetails, setMembershipDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Reschedule Request Modal State
  const [rescheduleModalApp, setRescheduleModalApp] = useState<AppointmentRecord | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: new Date().toISOString().split('T')[0],
    newTime: '02:00 PM',
    reason: ''
  });
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const handleRequestReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalApp) return;
    setIsSubmittingReschedule(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/appointments/${rescheduleModalApp._id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rescheduleForm)
      });
      const data = await res.json();
      if (data.data) {
        setAppointments(appointments.map(a => a._id === rescheduleModalApp._id ? { ...a, ...data.data } : a));
      }
      setRescheduleModalApp(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // STRICT ROLE REDIRECT: Admin must ONLY use Admin Dashboard (/admin).
  useEffect(() => {
    if (isLoading) return;

    if (user?.role === 'admin' || user?.email?.includes('admin')) {
      router.replace('/admin');
      return;
    }
    if (user?.role === 'employee') {
      router.replace('/employee');
      return;
    }

    fetchProfileData();
    // Auto-fetch appointment status updates from Admin / Employee every 4 seconds
    const intervalId = setInterval(() => {
      fetchProfileData();
    }, 4000);
    return () => clearInterval(intervalId);
  }, [user, isLoading, router]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('appointment:updated', (data: any) => {
      if (data?.appointment) {
        setAppointments(prev => prev.map(a => a._id === data.appointment._id ? { ...a, ...data.appointment } : a));
      }
    });

    return () => {
      socket.off('appointment:updated');
    };
  }, [socket]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const email = user?.email || 'guest@spysalon.com';
      const phone = user?.phone || '';

      const [appRes, memRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/appointments?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`)
          .then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/user/membership`).then(r => r.json()).catch(() => ({ hasActiveMembership: false, offers: [] }))
      ]);

      if (appRes.data) setAppointments(appRes.data);
      if (memRes.hasActiveMembership) {
        setHasMembership(true);
        setMembershipDetails(memRes.membership);
      } else {
        setHasMembership(false);
        if (memRes.offers) setOffers(memRes.offers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (user?.role === 'admin' || user?.email?.includes('admin') || user?.role === 'employee') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-rosegold-400 font-serif animate-pulse">
        Redirecting to Executive Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 responsive-card-container">
      
      {/* User Header Profile Card */}
      <div className="rosegold-glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-glow-rosegold">
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-3 sm:space-y-0 sm:space-x-5">
          <div className="w-20 h-20 rounded-3xl rosegold-gradient-bg text-dark-900 font-extrabold text-2xl flex items-center justify-center shadow-lg shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VIP'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                {user?.name || 'Valued VIP Guest'}
              </h1>
              <Crown className="w-5 h-5 text-rosegold-400 shrink-0" />
            </div>

            <p className="text-xs text-gray-300">{user?.email || 'vip.guest@spysalon.com'} • {user?.phone || '+91 98765 43210'}</p>
            
            <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="text-[10px] font-bold text-rosegold-400 bg-rosegold-500/15 border border-rosegold-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider">
                {hasMembership ? 'Active VIP Member' : 'Standard Guest Account'}
              </span>
              <span className="text-[10px] font-bold text-green-400 bg-green-500/15 border border-green-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider">
                Verified Client
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-center">
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/30 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MEMBERSHIP OR ACTIVE OFFERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif text-white">Membership Status & Rewards</h2>
        </div>

        {hasMembership ? (
          <div className="glass-card p-6 rounded-3xl border border-rosegold-500/40 bg-gradient-to-r from-rosegold-500/20 to-purple-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-rosegold-400 font-bold text-sm uppercase tracking-wider">Active VIP Diamond Membership</span>
              <span className="text-green-400 text-xs font-bold bg-green-500/20 px-3 py-0.5 rounded-full">Valid until Dec 2026</span>
            </div>
            <p className="text-gray-200 text-xs sm:text-sm">
              Enjoy 20% flat discount on all salon therapies, priority instant booking, and complimentary monthly head massages.
            </p>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-rosegold-400 text-xs font-bold uppercase tracking-wider">No Active Membership Detected</span>
                <h3 className="text-lg font-serif font-bold text-white">Unlock Exclusive VIP Membership Offers</h3>
              </div>
              <Link href="/offers" className="text-rosegold-400 hover:text-white text-xs font-bold flex items-center space-x-1">
                <span>Browse All Offers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-dark-800 border border-rosegold-500/20 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-white font-serif font-bold text-sm">SPY VIP Gold Pass</span>
                  <span className="text-xs text-rosegold-400 font-bold">20% OFF</span>
                </div>
                <p className="text-xs text-gray-400">Get flat 20% off all hair and skin appointments + zero wait time.</p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs font-mono text-rosegold-300 bg-rosegold-500/10 px-2 py-0.5 rounded border border-rosegold-500/20">CODE: SPYFIRST20</span>
                  <button onClick={() => router.push('/book')} className="text-xs font-bold rosegold-gradient-text hover:underline">Apply Offer →</button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-dark-800 border border-rosegold-500/20 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-white font-serif font-bold text-sm">24K Gold Facial Special</span>
                  <span className="text-xs text-rosegold-400 font-bold">25% OFF</span>
                </div>
                <p className="text-xs text-gray-400">Special 25% discount on all 24K Gold & Diamond skin care sessions.</p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs font-mono text-rosegold-300 bg-rosegold-500/10 px-2 py-0.5 rounded border border-rosegold-500/20">CODE: GOLDFACIAL</span>
                  <button onClick={() => router.push('/book')} className="text-xs font-bold rosegold-gradient-text hover:underline">Apply Offer →</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: PREVIOUS APPOINTMENTS DETAILS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif text-white">Previous & Upcoming Appointments</h2>
          <Link href="/book" className="px-4 py-2 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md">
            + Book New Appointment
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center space-y-3">
            <Calendar className="w-10 h-10 text-rosegold-400 mx-auto" />
            <h3 className="text-white font-serif font-bold text-base">No Previous Appointments Found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">You haven't logged any salon appointments yet. Book your first luxury session now!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((app) => (
              <div key={app._id || app.bookingId} className="glass-card p-5 sm:p-6 rounded-3xl border border-rosegold-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs text-rosegold-400 font-bold font-mono">Booking ID: {app.bookingId}</span>
                    <h3 className="text-lg font-serif font-bold text-white">{app.service}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      app.status === 'Confirmed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      app.status === 'Completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      app.status === 'Reschedule Requested' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {app.status}
                    </span>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      app.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-300 border border-white/10'
                    }`}>
                      {app.paymentMethod || 'Cash'} • {app.paymentStatus || 'Unpaid'}
                    </span>
                  </div>
                </div>

                {app.status === 'Reschedule Requested' && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 text-left">
                    <span className="font-bold flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Note from Salon Administrator:</span>
                    </span>
                    <p className="text-amber-100 text-xs italic">
                      "{(app as any).adminNote || 'The requested time slot is unavailable. Please choose another slot.'}"
                    </p>
                    <Link href="/book" className="inline-block pt-1 text-xs text-rosegold-300 font-bold hover:underline">
                      Pick Another Available Time Slot →
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* BOOKING TIME (NEVER CHANGES) */}
                  <div className="bg-dark-800 p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-gray-400 text-[10px] uppercase font-semibold block">Appointment Booked On</span>
                    <span className="text-rosegold-300 font-bold flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                      <span>
                        {app.bookingDateTime 
                          ? new Date(app.bookingDateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : (app.bookingDate || '23 July 2026')
                        } • {app.bookingTimeFormatted || (app.bookingDateTime ? new Date(app.bookingDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:15 AM')}
                      </span>
                    </span>
                  </div>

                  {/* SCHEDULED SALON VISIT TIME */}
                  <div className="bg-dark-800 p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-gray-400 text-[10px] uppercase font-semibold block">Scheduled Visit</span>
                    <span className="text-white font-bold flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rosegold-400" />
                      <span>{app.appointmentDate} • {app.appointmentTime}</span>
                    </span>
                  </div>

                  <div className="bg-dark-800 p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-gray-400 text-[10px] uppercase font-semibold block">Assigned Specialist</span>
                    <span className="text-white font-bold flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-rosegold-400" />
                      <span>{app.specialistName || app.staffPreference || 'Any Available Specialist'}</span>
                    </span>
                  </div>

                  <div className="bg-dark-800 p-3 rounded-2xl border border-white/5 space-y-1 flex flex-col justify-between">
                    <span className="text-gray-400 text-[10px] uppercase font-semibold block">Studio Branch</span>
                    <span className="text-white font-bold flex items-center space-x-1.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-rosegold-400 shrink-0" />
                      <span className="truncate">{app.branch}</span>
                    </span>
                  </div>
                </div>

                {/* Reschedule Request Action Button */}
                {(app.status === 'Confirmed' || app.status === 'Pending') && (
                  <div className="pt-2 border-t border-white/10 flex justify-end">
                    <button
                      onClick={() => {
                        setRescheduleModalApp(app);
                        setRescheduleForm({
                          newDate: app.appointmentDate || new Date().toISOString().split('T')[0],
                          newTime: app.appointmentTime || '02:00 PM',
                          reason: ''
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Request Reschedule 📅</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESCHEDULE REQUEST MODAL */}
      {rescheduleModalApp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-rosegold-500/50 space-y-5 bg-dark-900 shadow-2xl text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Request Appointment Reschedule</h3>
                <p className="text-xs text-rosegold-400 font-mono">Booking #{rescheduleModalApp.bookingId}</p>
              </div>
              <button
                onClick={() => setRescheduleModalApp(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-300 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestReschedule} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-gray-300 font-bold block">Current Service</label>
                <input
                  type="text"
                  disabled
                  value={rescheduleModalApp.service}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-gray-400 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-bold block">New Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={rescheduleForm.newDate}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-rosegold-500/30 text-white font-bold focus:outline-none focus:border-rosegold-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-bold block">New Preferred Time *</label>
                  <select
                    value={rescheduleForm.newTime}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, newTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-rosegold-500/30 text-white font-bold focus:outline-none focus:border-rosegold-500"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-bold block">Reason for Reschedule (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Schedule conflict, work commitment..."
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-rosegold-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalApp(null)}
                  className="px-4 py-2 rounded-full bg-dark-800 text-gray-300 font-bold hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReschedule}
                  className="px-5 py-2 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold shadow-lg hover:scale-105 transition-all"
                >
                  {isSubmittingReschedule ? 'Submitting Request...' : 'Submit Reschedule Request 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
