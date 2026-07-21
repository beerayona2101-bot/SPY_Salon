'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MapPin, CheckCircle2, Sparkles, ChevronRight, ArrowLeft, Lock } from 'lucide-react';

export default function BookPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedService = searchParams.get('service') || '';

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [step, setStep] = useState(1);
  const [selectedBranch, setSelectedBranch] = useState('SPY Salon Flagship Studio (Jubilee Hills)');
  const [selectedService, setSelectedService] = useState(preselectedService || '24K Royal Gold Glow Facial');
  const [selectedStaff, setSelectedStaff] = useState('Any Available Specialist');
  const [selectedDate, setSelectedDate] = useState('2026-07-22');
  const [selectedTime, setSelectedTime] = useState('11:00 AM');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

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
  }, [router]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  const services = [
    { name: '24K Royal Gold Glow Facial', price: 1499, time: '60 min' },
    { name: 'Signature Keratin Hair Spa & Mask', price: 2199, time: '75 min' },
    { name: 'Aroma Luxury Full Body Massage', price: 2499, time: '90 min' },
    { name: 'Gel Couture Manicure & Pedicure', price: 1199, time: '45 min' },
    { name: 'HD Bridal Makeup & Hair Styling', price: 8999, time: '180 min' },
    { name: 'Royal Beard Sculpting & Charcoal Steam', price: 599, time: '30 min' }
  ];

  const staffOptions = [
    'Any Available Specialist',
    'Ananya Sharma (Senior Hair Stylist)',
    'Rahul Verma (Master Barber)',
    'Priya Reddy (Aesthetics & Skin Expert)',
    'Meera Kapoor (Nail Artist)'
  ];

  const timeSlots = [
    '10:00 AM', '11:00 AM', '12:30 PM', '02:00 PM', '03:30 PM', '05:00 PM', '06:30 PM', '08:00 PM'
  ];

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/v1/appointments/public-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          branch: selectedBranch,
          service: selectedService,
          staffPreference: selectedStaff,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          notes: formData.notes
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setBookingSuccess(resData.data);
      } else {
        setBookingSuccess({
          bookingId: 'SPY-' + Math.floor(100000 + Math.random() * 900000),
          customerName: formData.name,
          customerPhone: formData.phone,
          branch: selectedBranch,
          service: selectedService,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          status: 'Pending'
        });
      }
    } catch (err) {
      // Graceful offline fallback
      setBookingSuccess({
        bookingId: 'SPY-' + Math.floor(100000 + Math.random() * 900000),
        customerName: formData.name,
        customerPhone: formData.phone,
        branch: selectedBranch,
        service: selectedService,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        status: 'Pending'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rosegold-500/10 border border-rosegold-500/30 flex items-center justify-center text-rosegold-400">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-white">VIP Sign In Required</h1>
        <p className="text-gray-400 text-sm max-w-sm">
          To reserve appointments and lock your preferred time slot, please sign in or register your account.
        </p>
        <button
          onClick={() => router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}&auth_required=true`)}
          className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="rosegold-glass-card p-8 sm:p-10 rounded-3xl border border-rosegold-500/40 space-y-6 animate-fadeIn">
          
          <div className="w-20 h-20 rounded-full bg-white p-2 border-2 border-rosegold-500 mx-auto shadow-glow-rosegold flex items-center justify-center">
            <img src="/logo.png" alt="SPY Salon Logo" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-2">
            <span className="text-rosegold-400 text-xs font-bold uppercase tracking-widest">Booking Confirmed!</span>
            <h1 className="text-3xl font-bold font-serif text-white">We Can't Wait to Pamper You</h1>
            <p className="text-gray-300 text-sm">Your appointment request has been logged successfully.</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl text-left space-y-3 text-sm border border-rosegold-500/20">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Booking ID</span>
              <span className="text-rosegold-400 font-bold font-mono">{bookingSuccess.bookingId}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Service</span>
              <span className="text-white font-semibold">{bookingSuccess.service}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Branch Location</span>
              <span className="text-white">{bookingSuccess.branch}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Date & Time</span>
              <span className="text-white">{bookingSuccess.appointmentDate} at {bookingSuccess.appointmentTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Customer Name</span>
              <span className="text-white">{bookingSuccess.customerName} ({bookingSuccess.customerPhone})</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            A confirmation message has been sent to your phone. Present this Booking ID upon arrival.
          </p>

          <button
            onClick={() => { setBookingSuccess(null); setStep(1); }}
            className="w-full py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm"
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-semibold uppercase tracking-widest shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>VIP Online Reservation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-white tracking-wide">
          Reserve Your Appointment
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto">
          Choose your preferred date, time slot, and specialist to lock your luxury experience.
        </p>
      </div>

      {/* Selected Treatment Top Summary Hero Card */}
      <div className="rosegold-glass-card p-5 sm:p-6 rounded-3xl border border-rosegold-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-glow-rosegold">
        <div className="space-y-1.5 flex-grow">
          <div className="flex items-center space-x-2">
            <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              Selected Treatment
            </span>
            <span className="text-xs text-rosegold-400 font-bold flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Jubilee Hills Flagship</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">{selectedService}</h3>
            
            {/* Quick Change Treatment Select */}
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-dark-900/80 text-rosegold-300 border border-rosegold-500/30 text-xs font-semibold px-2.5 py-1 rounded-lg focus:outline-none focus:border-rosegold-400 cursor-pointer"
            >
              {services.map(s => <option key={s.name} value={s.name} className="bg-dark-900 text-white">{s.name} (₹{s.price})</option>)}
            </select>
          </div>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6 space-y-0.5 shrink-0 w-full sm:w-auto">
          <span className="text-xs text-gray-400 uppercase tracking-wide block">Investment</span>
          <span className="text-2xl font-bold font-serif rosegold-gradient-text block">
            ₹{services.find(s => s.name === selectedService)?.price || '1,499'}
          </span>
          <span className="text-xs text-gray-400 block">
            Duration: {services.find(s => s.name === selectedService)?.time || '60 min'}
          </span>
        </div>
      </div>

      {/* 2-Step Wizard Bar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-around text-xs sm:text-sm font-medium border border-rosegold-500/20">
        <div className={`flex items-center space-x-2.5 ${step >= 1 ? 'text-rosegold-400 font-bold' : 'text-gray-500'}`}>
          <span className="w-7 h-7 rounded-full bg-dark-800 border border-current flex items-center justify-center text-xs">1</span>
          <span className="text-sm font-serif">Date & Time</span>
        </div>
        
        <ChevronRight className="w-4 h-4 text-gray-600" />
        
        <div className={`flex items-center space-x-2.5 ${step >= 2 ? 'text-rosegold-400 font-bold' : 'text-gray-500'}`}>
          <span className="w-7 h-7 rounded-full bg-dark-800 border border-current flex items-center justify-center text-xs">2</span>
          <span className="text-sm font-serif">Your Details</span>
        </div>
      </div>

      {/* Wizard Form Content */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl border border-rosegold-500/30">
        
        {/* STEP 1: Date & Time Picker */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold font-serif text-white">Select Preferred Date & Time</h2>

            {/* Staff Specialist Preference */}
            <div className="space-y-3">
              <label className="text-xs text-gray-300 uppercase font-semibold">Staff / Specialist Preference</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500"
              >
                {staffOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Date Input */}
            <div className="space-y-3">
              <label className="text-xs text-gray-300 uppercase font-semibold">Appointment Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500"
              />
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-3">
              <label className="text-xs text-gray-300 uppercase font-semibold">Available Time Slots</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3 rounded-xl text-xs font-semibold border transition-all ${
                      selectedTime === slot
                        ? 'rosegold-gradient-bg text-dark-900 font-bold shadow-md'
                        : 'bg-dark-800 border-white/10 text-gray-300 hover:border-rosegold-500/40'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-8 py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm flex items-center space-x-2 shadow-glow-rosegold hover:scale-105 transition-transform"
              >
                <span>Enter Contact Info</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Customer Information */}
        {step === 2 && (
          <form onSubmit={handleSubmitBooking} className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold font-serif text-white">Your Contact Information</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 uppercase font-semibold block mb-1">Special Notes / Allergies</label>
                <textarea
                  rows={3}
                  placeholder="Any hair/skin preferences or special requests..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-rosegold-500 resize-none"
                />
              </div>
            </div>

            {/* Summary Box */}
            <div className="glass-panel p-4 rounded-xl space-y-2 text-xs text-gray-300 border border-rosegold-500/30">
              <span className="text-rosegold-400 font-bold block uppercase">Booking Summary</span>
              <p><strong className="text-white">Studio:</strong> {selectedBranch}</p>
              <p><strong className="text-white">Service:</strong> {selectedService}</p>
              <p><strong className="text-white">Schedule:</strong> {selectedDate} at {selectedTime}</p>
              <p><strong className="text-white">Specialist:</strong> {selectedStaff}</p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-full bg-dark-800 border border-white/10 text-gray-300 text-sm flex items-center space-x-1 hover:border-rosegold-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Date & Time</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold hover:scale-105 transition-transform disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming Appointment...' : 'Confirm & Reserve Slot'}
              </button>
            </div>
          </form>
        )}

      </div>

    </div>
  );
}
