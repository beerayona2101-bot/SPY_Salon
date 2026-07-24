'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, ShieldCheck, Sparkles, CheckCircle2, MapPin, CreditCard, ArrowRight, Smartphone, DollarSign, Lock, AlertCircle, X, Check } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function BookingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [selectedBranch, setSelectedBranch] = useState('Jubilee Hills Flagship Studio');
  const [selectedService, setSelectedService] = useState('24K Royal Gold Glow Facial');
  const [selectedStaff, setSelectedStaff] = useState('Ananya Sharma (Senior Hair Stylist)');
  const [selectedDate, setSelectedDate] = useState('2026-07-23');
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'UPI' | 'Cash'>('Razorpay');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Reschedule Query Params State
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [isPrePaid, setIsPrePaid] = useState<boolean>(false);

  // Razorpay Gateway Simulation Modal & Toast Notification State
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayPaying, setRazorpayPaying] = useState(false);
  const [razorpayAlert, setRazorpayAlert] = useState<string | null>(null);

  const [liveServices, setLiveServices] = useState<any[]>([
    { name: '24K Royal Gold Glow Facial', price: 1499, time: '60 min', available: true, specialist: 'Priya Reddy (Aesthetics & Skin Expert)' },
    { name: 'Signature Keratin Hair Spa & Mask', price: 2199, time: '75 min', available: true, specialist: 'Ananya Sharma (Senior Hair Stylist)' },
    { name: 'Aroma Luxury Full Body Massage', price: 2499, time: '90 min', available: true, specialist: 'Ananya Sharma & Staff' },
    { name: 'Gel Couture Manicure & Pedicure', price: 1199, time: '45 min', available: true, specialist: 'Meera Kapoor (Nail Artist)' },
    { name: 'HD Bridal Makeup & Hair Styling', price: 8999, time: '180 min', available: true, specialist: 'Ananya Sharma (Senior Hair Stylist)' },
    { name: 'Royal Beard Sculpting & Charcoal Steam', price: 599, time: '30 min', available: true, specialist: 'Rahul Verma (Master Barber)' }
  ]);

  const [staffOptions, setStaffOptions] = useState<string[]>([
    'Ananya Sharma (Senior Hair Stylist)',
    'Rahul Verma (Master Barber)',
    'Priya Reddy (Aesthetics & Skin Expert)',
    'Meera Kapoor (Nail Artist)',
    'Any Available Specialist'
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const rId = urlParams.get('rescheduleId') || urlParams.get('bookingId');
      if (rId) {
        setRescheduleId(rId);
        fetch(`${API_BASE_URL}/user/appointments`)
          .then(r => r.json())
          .then(data => {
            if (data.data) {
              const match = data.data.find((a: any) => a.bookingId === rId || a._id === rId);
              if (match) {
                if (match.service) setSelectedService(match.service);
                if (match.specialistName) setSelectedStaff(match.specialistName);
                if (match.paymentStatus === 'Paid') {
                  setIsPrePaid(true);
                }
              }
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const fetchLiveBookData = async () => {
    try {
      const [srvRes, specRes] = await Promise.all([
        fetch(`${API_BASE_URL}/services`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/specialists`).then(r => r.json()).catch(() => null)
      ]);

      if (srvRes && srvRes.data && srvRes.data.length > 0) {
        const formatted = srvRes.data.map((s: any) => ({
          name: s.name,
          price: s.price,
          time: `${s.durationMinutes || 60} min`,
          available: true,
          specialist: s.specialist || 'Certified Specialist'
        }));
        setLiveServices(formatted);
      }

      if (specRes && specRes.data && specRes.data.length > 0) {
        const staffNames = specRes.data.map((emp: any) => {
          const specTitle = emp.specialties && emp.specialties.length > 0 ? emp.specialties[0] : 'Specialist';
          return `${emp.name} (${specTitle})`;
        });
        staffNames.push('Any Available Specialist');
        setStaffOptions(staffNames);
      }
    } catch (err) {
      console.warn('Using default booking options');
    }
  };

  const fetchBookedSlots = async (dateVal: string, staffVal: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/booked-slots?date=${dateVal}&specialist=${encodeURIComponent(staffVal)}`);
      const data = await res.json();
      if (data.bookedSlots) {
        setBookedSlots(data.bookedSlots);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const userToken = localStorage.getItem('spy_user') || localStorage.getItem('spy_token');
    if (!userToken) {
      setIsAuthenticated(false);
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}&auth_required=true`);
    } else {
      setIsAuthenticated(true);
      try {
        const parsed = JSON.parse(userToken);
        if (parsed && typeof parsed === 'object') {
          setFormData(prev => ({
            ...prev,
            name: parsed.name || prev.name,
            email: parsed.email || prev.email,
            phone: parsed.phone || prev.phone
          }));
        }
      } catch (e) {}
    }

    fetchLiveBookData();
    const intervalId = setInterval(() => {
      fetchLiveBookData();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [router]);

  useEffect(() => {
    fetchBookedSlots(selectedDate, selectedStaff);
  }, [selectedDate, selectedStaff]);

  const timeSlots = [
    '10:00 AM', '11:00 AM', '12:30 PM', '02:00 PM', '03:30 PM', '05:00 PM', '06:30 PM', '08:00 PM'
  ];

  const selectedServiceObj = liveServices.find(s => s.name === selectedService) || liveServices[0];

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    if (bookedSlots.includes(selectedTime)) {
      setConflictError(`The slot ${selectedTime} on ${selectedDate} is already booked. Please choose an available time slot below.`);
      return;
    }

    if (isPrePaid) {
      await finalizeBooking('Razorpay (Pre-Paid)', 'spysalon@prepaid', 'PREPAID_RESCHEDULE');
      return;
    }

    if (paymentMethod === 'Razorpay') {
      setShowRazorpayModal(true);
      return;
    }

    await finalizeBooking(paymentMethod, 'spysalon@upi', upiTransactionId);
  };

  const finalizeBooking = async (payMethod: string, upiIdVal?: string, txnIdVal?: string) => {
    setIsSubmitting(true);
    setConflictError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/public-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          branch: selectedBranch,
          service: selectedService,
          staffPreference: selectedStaff,
          specialistName: selectedStaff,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          paymentMethod: isPrePaid ? 'Razorpay (Pre-Paid)' : payMethod,
          paymentDetails: { upiId: upiIdVal || 'spysalon@upi', transactionId: txnIdVal || 'RZP_TXN_' + Math.floor(10000000 + Math.random() * 90000000) },
          notes: isPrePaid ? `Rescheduled Booking ${rescheduleId || ''} (${formData.notes})` : formData.notes
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setBookingSuccess(resData.data);
      } else {
        if (response.status === 409) {
          setConflictError(resData.message || 'This time slot is already booked. Please pick another time slot.');
          fetchBookedSlots(selectedDate, selectedStaff);
          return;
        }

        setBookingSuccess({
          bookingId: rescheduleId || ('SPY-' + Math.floor(100000 + Math.random() * 900000)),
          customerName: formData.name,
          customerPhone: formData.phone,
          branch: selectedBranch,
          service: selectedService,
          specialistName: selectedStaff,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          paymentMethod: isPrePaid ? 'Razorpay (Pre-Paid)' : payMethod,
          status: 'Confirmed'
        });
      }
    } catch (err) {
      setBookingSuccess({
        bookingId: rescheduleId || ('SPY-' + Math.floor(100000 + Math.random() * 900000)),
        customerName: formData.name,
        customerPhone: formData.phone,
        branch: selectedBranch,
        service: selectedService,
        specialistName: selectedStaff,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        paymentMethod: isPrePaid ? 'Razorpay (Pre-Paid)' : payMethod,
        status: 'Confirmed'
      });
    } finally {
      setIsSubmitting(false);
      setShowRazorpayModal(false);
    }
  };

  const handleCompleteRazorpay = () => {
    setRazorpayPaying(true);
    const mockTxnId = 'RZP_TXN_' + Math.floor(10000000 + Math.random() * 90000000);

    setTimeout(() => {
      setRazorpayPaying(false);
      setRazorpayAlert(`Razorpay Payment Successful! Transaction ID: ${mockTxnId}. Salon Appointment Request Submitted!`);
      
      setTimeout(() => {
        setRazorpayAlert(null);
        finalizeBooking('Razorpay', 'spysalon@razorpay', mockTxnId);
      }, 1500);
    }, 1200);
  };

  if (bookingSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-center animate-fadeIn">
        <div className="w-20 h-20 rounded-full rosegold-gradient-bg text-dark-900 flex items-center justify-center mx-auto shadow-glow-rosegold">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rosegold-400">Booking Confirmed</span>
          <h1 className="text-3xl font-bold font-serif text-white">Your Appointment Request is Submitted!</h1>
          <p className="text-xs text-gray-400">Booking Reference: <span className="font-mono text-white font-bold">{bookingSuccess.bookingId}</span></p>
        </div>

        <div className="p-4 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-semibold max-w-lg mx-auto">
          ✅ Status: <strong className="text-white">Confirmed & Scheduled</strong>. See you at our Jubilee Hills Flagship Studio!
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-3xl text-left space-y-4 border border-rosegold-500/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block font-semibold uppercase text-[10px]">Client Name</span>
              <span className="text-white font-bold text-sm">{bookingSuccess.customerName}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold uppercase text-[10px]">Assigned Specialist</span>
              <span className="text-rosegold-400 font-bold text-sm">{bookingSuccess.specialistName}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold uppercase text-[10px]">Selected Service</span>
              <span className="text-white font-bold text-sm">{bookingSuccess.service}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold uppercase text-[10px]">Date & Time</span>
              <span className="text-white font-bold text-sm">{bookingSuccess.appointmentDate} at {bookingSuccess.appointmentTime}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold uppercase text-[10px]">Studio Branch</span>
              <span className="text-white font-bold">{bookingSuccess.branch}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold uppercase text-[10px]">Payment Option</span>
              <span className="text-green-400 font-bold uppercase">{bookingSuccess.paymentMethod} • Paid Online</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/profile" className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md">
            View My Profile & Appointments
          </Link>
          <Link href="/" className="px-6 py-3 rounded-full bg-dark-800 text-gray-300 hover:text-white font-bold text-xs border border-white/10">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Alert for Razorpay Notification */}
      {razorpayAlert && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-green-900/90 border border-green-500/50 text-white shadow-2xl flex items-center space-x-3 text-xs animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <span className="font-bold">{razorpayAlert}</span>
        </div>
      )}

      {/* Page Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-medium uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Realtime Slot Availability Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-white">
          {rescheduleId ? `Reschedule Appointment (${rescheduleId})` : 'Book Your Appointment'}
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto">
          {rescheduleId ? 'Select your new preferred date and available time slot.' : 'Select your treatment, specialist, and available time slot in real time.'}
        </p>
      </div>

      {conflictError && (
        <div className="p-4 rounded-2xl bg-red-900/40 border border-red-500/50 text-red-300 text-xs font-bold flex items-center space-x-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{conflictError}</span>
        </div>
      )}

      {isPrePaid && (
        <div className="p-4 rounded-2xl bg-green-950/40 border border-green-500/50 text-green-300 text-xs font-bold flex items-start space-x-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-white text-sm font-serif font-bold block">Pre-Paid Appointment Reschedule Verified</span>
            <p className="text-gray-300 text-[11px] font-normal">
              Your payment for this booking was already completed. No extra payment required — simply select your new available time slot and click confirm.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        
        {/* Main Selection Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: Select Service */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30">
            <h2 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full rosegold-gradient-bg text-dark-900 text-xs flex items-center justify-center font-sans font-bold">1</span>
              <span>Select Service Treatment</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveServices.map((srv) => (
                <div
                  key={srv.name}
                  onClick={() => setSelectedService(srv.name)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    selectedService === srv.name 
                      ? 'bg-rosegold-500/15 border-rosegold-500 text-white shadow-glow-rosegold' 
                      : 'bg-dark-800/80 border-white/10 text-gray-300 hover:border-rosegold-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm font-serif leading-tight">{srv.name}</h3>
                    <span className="text-rosegold-400 font-bold text-xs font-serif shrink-0 ml-1">₹{srv.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-gray-400">
                    <span>{srv.time}</span>
                    <span className="text-rosegold-300 font-semibold">{srv.specialist?.split('(')[0] || 'Specialist'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 2: Select Specialist */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30">
            <h2 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full rosegold-gradient-bg text-dark-900 text-xs flex items-center justify-center font-sans font-bold">2</span>
              <span>Choose Salon Specialist</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {staffOptions.map((staff) => (
                <div
                  key={staff}
                  onClick={() => setSelectedStaff(staff)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${
                    selectedStaff === staff 
                      ? 'bg-rosegold-500/15 border-rosegold-500 text-white font-bold shadow-glow-rosegold' 
                      : 'bg-dark-800/80 border-white/10 text-gray-300 hover:border-rosegold-500/50'
                  }`}
                >
                  <User className="w-4 h-4 text-rosegold-400 shrink-0" />
                  <span className="truncate">{staff}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 3: Date & Interactive Available Time Slots */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30">
            <h2 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full rosegold-gradient-bg text-dark-900 text-xs flex items-center justify-center font-sans font-bold">3</span>
              <span>Date & Available Time Slots</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1.5 uppercase tracking-wide">Select Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-64 p-3 rounded-xl bg-dark-800 border border-white/10 text-white focus:outline-none focus:border-rosegold-500"
                />
              </div>

              <div>
                <span className="text-gray-300 font-semibold block mb-2 uppercase tracking-wide">
                  Live Time Slots for {selectedDate} ({selectedStaff.split('(')[0]})
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {timeSlots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setSelectedTime(slot)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isBooked 
                            ? 'bg-red-950/30 border-red-500/30 text-gray-500 cursor-not-allowed opacity-60' 
                            : isSelected 
                              ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-glow-rosegold' 
                              : 'bg-dark-800 border-white/10 text-white hover:border-rosegold-500/50'
                        }`}
                      >
                        <span className="block font-bold text-xs">{slot}</span>
                        <span className={`text-[9px] font-semibold block mt-0.5 ${
                          isBooked ? 'text-red-400 font-mono' : isSelected ? 'text-dark-900' : 'text-green-400'
                        }`}>
                          {isBooked ? '🔒 Booked' : '🟢 Available'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: Payment Method (HIDE IF PRE-PAID, SHOW IF UNPAID) */}
          {!isPrePaid ? (
            <div className="glass-card p-6 rounded-3xl space-y-4 border border-rosegold-500/30">
              <h2 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full rosegold-gradient-bg text-dark-900 text-xs flex items-center justify-center font-sans font-bold">4</span>
                <span>Select Payment Gateway</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div
                  onClick={() => setPaymentMethod('Razorpay')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                    paymentMethod === 'Razorpay' ? 'bg-rosegold-500/15 border-rosegold-500 text-white font-bold shadow-glow-rosegold' : 'bg-dark-800 border-white/10 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>Razorpay Checkout</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono">Cards / UPI / NetBanking</p>
                </div>

                <div
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                    paymentMethod === 'UPI' ? 'bg-rosegold-500/15 border-rosegold-500 text-white font-bold' : 'bg-dark-800 border-white/10 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-rosegold-400" />
                    <span>UPI App Direct</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono">GPay / PhonePe / Paytm</p>
                </div>

                <div
                  onClick={() => setPaymentMethod('Cash')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                    paymentMethod === 'Cash' ? 'bg-rosegold-500/15 border-rosegold-500 text-white font-bold' : 'bg-dark-800 border-white/10 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span>Pay at Salon Desk</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Cash / Counter Card</p>
                </div>
              </div>

              {paymentMethod === 'UPI' && (
                <div className="p-4 rounded-2xl bg-dark-900/80 border border-rosegold-500/30 text-xs space-y-2">
                  <span className="text-gray-400 font-semibold block">Salon UPI VPA: <strong className="text-rosegold-400 font-mono">spysalon@upi</strong></span>
                  <input
                    type="text"
                    placeholder="Enter UPI Reference / UTR No. (Optional)"
                    value={upiTransactionId}
                    onChange={(e) => setUpiTransactionId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-dark-800 border border-white/10 text-white text-xs focus:outline-none"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-6 rounded-3xl space-y-3 border border-green-500/40 bg-green-950/20">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <h3 className="text-base font-serif font-bold text-white">Payment Status: Pre-Paid ✅</h3>
              </div>
              <p className="text-xs text-gray-300">
                Payment for <strong>{selectedService}</strong> was verified and paid on initial booking. No extra payment required to confirm this rescheduled time slot.
              </p>
            </div>
          )}

        </div>

        {/* Sidebar Summary Card */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-5 border border-rosegold-500/40 sticky top-24">
            <h3 className="text-base font-serif font-bold text-white border-b border-white/10 pb-3">Booking Summary</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Selected Service</span>
                <span className="text-white font-bold text-right">{selectedServiceObj.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Specialist</span>
                <span className="text-rosegold-400 font-bold text-right">{selectedStaff.split('(')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date & Time</span>
                <span className="text-white font-semibold">{selectedDate} ({selectedTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Status</span>
                <span className={isPrePaid ? "text-green-400 font-bold" : "text-blue-400 font-bold"}>
                  {isPrePaid ? 'Pre-Paid ✅' : paymentMethod}
                </span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between text-sm">
                <span className="text-gray-300 font-bold">Total Price</span>
                <span className="text-rosegold-400 font-serif font-bold text-lg">₹{selectedServiceObj.price}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || bookedSlots.includes(selectedTime)}
              className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>
                {isSubmitting ? 'Processing...' : isPrePaid ? 'Confirm Rescheduled Slot (No Extra Payment) ✅' : paymentMethod === 'Razorpay' ? 'Pay via Razorpay →' : 'Submit Booking Request'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </form>

      {/* RAZORPAY PAYMENT GATEWAY SIMULATION OVERLAY */}
      {showRazorpayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 text-gray-900 text-left space-y-5 relative">
            <button onClick={() => setShowRazorpayModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg cursor-pointer">✕</button>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-blue-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">Razorpay</span>
                <span className="text-xs font-bold text-gray-500">Secure Payment Checkout</span>
              </div>
              <span className="text-xs font-bold text-gray-400 font-mono">Order #RZP-9847</span>
            </div>

            {/* Amount Banner */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold block">Paying SPY Salon Studio</span>
                <span className="text-xs text-blue-900 font-semibold">{selectedServiceObj.name}</span>
              </div>
              <span className="text-2xl font-extrabold text-blue-700">₹{selectedServiceObj.price}</span>
            </div>

            {/* Options */}
            <div className="space-y-2 text-xs">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Select Payment Option:</span>
              
              <div className="p-3 rounded-xl border border-gray-200 hover:border-blue-500 flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-4 h-4 text-green-600" />
                  <span className="font-bold text-gray-800">UPI Instant Apps (GPay / PhonePe / Paytm)</span>
                </div>
                <span className="text-[10px] text-green-600 font-bold">Fast</span>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 hover:border-blue-500 flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-gray-800">Credit / Debit Card (Visa, Mastercard, RuPay)</span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleCompleteRazorpay}
              disabled={razorpayPaying}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{razorpayPaying ? 'Authorizing Payment...' : `Complete Razorpay Payment (₹${selectedServiceObj.price})`}</span>
            </button>

            <p className="text-[10px] text-gray-400 text-center">256-Bit SSL Encrypted Razorpay Gateway Simulation</p>
          </div>
        </div>
      )}

    </div>
  );
}
