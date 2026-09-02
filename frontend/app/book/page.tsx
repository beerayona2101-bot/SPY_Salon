'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookingSkeleton } from '@/components/common/Skeleton';
import {
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  X,
  Check,
  Tag,
  Scissors,
  Award
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { SALON_CATALOGUE } from '@/lib/servicesData';
import VIPBadge from '@/components/common/VIPBadge';
import { Crown } from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';
import { validateForm, validateName, validateEmail, validatePhone, validateDate } from '@/lib/validation';
import { AnimatedButton } from '@/components/ui/animated-button';

// Catalogue Services Helper
const getAllCatalogueServices = (): any[] => {
  return [];
};

// Calculate Estimated End Time
const calculateEndTime = (startTimeStr: string, durationMinutes: number) => {
  if (!startTimeStr) return '';
  try {
    const [time, modifier] = startTimeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    let endHours = endDate.getHours();
    let endMinutes = endDate.getMinutes();
    const endModifier = endHours >= 12 ? 'PM' : 'AM';

    endHours = endHours % 12;
    endHours = endHours ? endHours : 12;
    const formattedMinutes = endMinutes < 10 ? `0${endMinutes}` : endMinutes;

    return `${endHours}:${formattedMinutes} ${endModifier}`;
  } catch (e) {
    return '';
  }
};

const getTodayISTStr = (): string => {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

const isSlotInPast = (dateStr: string, timeSlotStr: string): boolean => {
  if (!dateStr || !timeSlotStr) return false;
  try {
    const [time, modifier] = timeSlotStr.trim().split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const isoStr = `${dateStr.trim()}T${hh}:${mm}:00+05:30`;
    const dt = new Date(isoStr);
    return !isNaN(dt.getTime()) && dt.getTime() <= Date.now();
  } catch (e) {
    return false;
  }
};

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query Parameters
  const serviceIdParam = searchParams?.get('serviceId') || searchParams?.get('id');
  const serviceParam = searchParams?.get('service');
  const categoryParam = searchParams?.get('category') || 'all';
  const subcategoryParam = searchParams?.get('subcategory') || '';
  const rawPackageParam = searchParams?.get('package');
  const packageParam = rawPackageParam && rawPackageParam.trim() ? rawPackageParam.trim().toLowerCase() : null;
  const staffParam = searchParams?.get('staff') || searchParams?.get('specialist');

  // Dynamic Service & Specialist States
  const [loadingService, setLoadingService] = useState(true);
  const [selectedServiceObj, setSelectedServiceObj] = useState<any | null>(null);
  const [selectedPackageTier, setSelectedPackageTier] = useState<string | null>(packageParam);
  const [specialistsList, setSpecialistsList] = useState<any[]>([]);
  const [offersList, setOffersList] = useState<any[]>([]);

  // Booking Form States
  const [selectedBranch, setSelectedBranch] = useState('Jubilee Hills Flagship Studio');
  const [selectedStaff, setSelectedStaff] = useState('Any Available Specialist');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISTStr());
  const [selectedTime, setSelectedTime] = useState('10:30 AM');
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'UPI' | 'Cash'>('Razorpay');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercentage: number } | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoMsg, setPromoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Reschedule & Payment Modal States
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [isPrePaid, setIsPrePaid] = useState<boolean>(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayPaying, setRazorpayPaying] = useState(false);

  const [allServicesList, setAllServicesList] = useState<any[]>([]);

  // 1. Fetch Target Service dynamically based on URL query
  useEffect(() => {
    setLoadingService(true);
    const rawParam = serviceIdParam || serviceParam || '';
    const decodedParam = decodeURIComponent(rawParam).toLowerCase().trim();
    const slugParam = decodedParam.replace(/[^a-z0-9]+/g, '-');

    fetch(`${API_BASE_URL}/services`)
      .then(res => res.json())
      .then(data => {
        let match: any = null;
        const list = (data.data && Array.isArray(data.data)) ? data.data : [];
        setAllServicesList(list);

        if (list.length > 0) {
          if (decodedParam) {
            match = list.find((s: any) => {
              const sId = String(s._id || s.id || '').toLowerCase();
              const sName = String(s.name || s.title || '').toLowerCase();
              const sSlug = String(s.slug || '').toLowerCase();
              const sNameSlug = sName.replace(/[^a-z0-9]+/g, '-');

              return sId === decodedParam ||
                     sSlug === decodedParam ||
                     sSlug === slugParam ||
                     sName === decodedParam ||
                     sNameSlug === slugParam ||
                     sName.includes(decodedParam) ||
                     decodedParam.includes(sName);
            });
          }
          if (!match) {
            match = list[0];
          }
        }

        if (match) {
          setSelectedServiceObj({
            id: match._id || match.id,
            name: match.name || match.title,
            category: match.category || 'Beauty',
            subCategory: match.subCategory || subcategoryParam || 'Hair Care',
            gender: match.gender || categoryParam || 'all',
            price: match.price || 0,
            discountPrice: match.discountPrice || match.price,
            durationMinutes: match.durationMinutes || parseInt(match.duration) || 60,
            duration: match.duration || `${match.durationMinutes || 60} min`,
            rating: match.rating || 4.9,
            description: match.description || match.desc || 'Luxury salon treatment provided by certified specialists.',
            image: match.image || '',
            isPopular: match.isPopular || match.popular || false
          });
        } else {
          setSelectedServiceObj(null);
        }
      })
      .catch(() => {
        setSelectedServiceObj(null);
      })
      .finally(() => setLoadingService(false));
  }, [serviceIdParam, serviceParam, categoryParam, subcategoryParam]);

  // 2. Fetch Specialists & Offers
  useEffect(() => {
    fetch(`${API_BASE_URL}/specialists`)
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          setSpecialistsList(data.data);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/offers`)
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          setOffersList(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Filter specialists strictly by target service category
  const filteredStaffOptions = useMemo(() => {
    const defaultOption = 'Any Available Specialist';
    if (!selectedServiceObj || specialistsList.length === 0) {
      return [defaultOption];
    }

    const cat = selectedServiceObj.category.toLowerCase();
    const matches = specialistsList.filter(emp => {
      const specs = (emp.specialties || []).map((s: string) => s.toLowerCase());
      const empServices = (emp.services || []).map((s: string) => s.toLowerCase());

      if (cat.includes('hair') || cat.includes('grooming')) {
        return specs.some((s: string) => s.includes('hair') || s.includes('barber') || s.includes('grooming') || s.includes('stylist')) ||
               empServices.some((s: string) => s.includes('hair') || s.includes('keratin') || s.includes('beard'));
      }
      if (cat.includes('skin') || cat.includes('facial')) {
        return specs.some((s: string) => s.includes('skin') || s.includes('facial') || s.includes('aesthetic')) ||
               empServices.some((s: string) => s.includes('facial') || s.includes('gold') || s.includes('glow'));
      }
      if (cat.includes('nail')) {
        return specs.some((s: string) => s.includes('nail') || s.includes('manicure') || s.includes('pedicure')) ||
               empServices.some((s: string) => s.includes('nail') || s.includes('manicure') || s.includes('pedicure'));
      }
      if (cat.includes('spa') || cat.includes('massage')) {
        return specs.some((s: string) => s.includes('spa') || s.includes('massage') || s.includes('therapy')) ||
               empServices.some((s: string) => s.includes('spa') || s.includes('massage'));
      }
      if (cat.includes('bridal')) {
        return specs.some((s: string) => s.includes('bridal') || s.includes('makeup') || s.includes('stylist')) ||
               empServices.some((s: string) => s.includes('bridal') || s.includes('makeup'));
      }
      return true;
    });

    const formattedNames = matches.map(emp => `${emp.name} (${emp.specialties?.[0] || 'Specialist'})`);
    if (!formattedNames.includes(defaultOption)) {
      formattedNames.push(defaultOption);
    }
    return formattedNames;
  }, [selectedServiceObj, specialistsList]);

  // Set default specialist when list updates
  useEffect(() => {
    if (staffParam && filteredStaffOptions.includes(staffParam)) {
      setSelectedStaff(staffParam);
    } else if (filteredStaffOptions.length > 0) {
      setSelectedStaff(filteredStaffOptions[0]);
    }
  }, [filteredStaffOptions, staffParam]);

  // 3. Generate Package Tiers if multiple packages exist
  const packageTiers = useMemo(() => {
    if (!selectedServiceObj) return [];
    const baseP = selectedServiceObj.price || 0;
    const dur = selectedServiceObj.durationMinutes || 60;

    return [
      {
        id: 'classic',
        name: 'Classic Standard',
        price: baseP,
        durationMinutes: dur,
        duration: `${dur} min`,
        badge: 'STANDARD',
        description: `Standard treatment protocol by certified specialist.`
      },
      {
        id: 'premium',
        name: 'Executive Premium',
        price: Math.round(baseP * 1.35),
        durationMinutes: dur + 15,
        duration: `${dur + 15} min`,
        badge: 'POPULAR CHOICE',
        description: `Upgraded organic formulations, hot steam & scalp/face massage.`
      },
      {
        id: 'luxury',
        name: 'Royal VIP Luxury',
        price: Math.round(baseP * 1.8),
        durationMinutes: dur + 30,
        duration: `${dur + 30} min`,
        badge: 'ROYAL VIP',
        description: `Master Art Director, 24K nano serums & private suite refreshments.`
      }
    ];
  }, [selectedServiceObj]);

  const activeTierObj = useMemo(() => {
    if (!selectedPackageTier) return null;
    return packageTiers.find(p => p.id === selectedPackageTier) || null;
  }, [packageTiers, selectedPackageTier]);

  // 4. Fetch Booked Slots
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
    fetchBookedSlots(selectedDate, selectedStaff);
  }, [selectedDate, selectedStaff]);

  const [currentUserObj, setCurrentUserObj] = useState<any>(null);

  // User Auth state check
  useEffect(() => {
    const userToken = localStorage.getItem('spy_user') || localStorage.getItem('spy_token');
    if (userToken) {
      try {
        const parsed = JSON.parse(userToken);
        if (parsed && typeof parsed === 'object') {
          setCurrentUserObj(parsed);
          setFormData(prev => ({
            ...prev,
            name: parsed.name || prev.name,
            email: parsed.email || prev.email,
            phone: parsed.phone || prev.phone
          }));
        }
      } catch (e) {}
    }
  }, []);

  // Time Slots
  const timeSlots = [
    '09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'
  ];

  // Dynamic Pricing & VIP Membership Discount Calculation
  const subtotalPrice = activeTierObj ? activeTierObj.price : 0;
  
  const membershipInfo = currentUserObj?.membership;
  const membershipDiscountPercent = membershipInfo?.status === 'Active' || membershipInfo?.discountPercent
    ? (membershipInfo.discountPercent || (membershipInfo.tier === 'Gold' ? 20 : membershipInfo.tier === 'Premium' ? 10 : 5))
    : 0;

  const vipDiscountAmount = membershipDiscountPercent > 0 ? Math.round(subtotalPrice * (membershipDiscountPercent / 100)) : 0;
  const promoDiscountAmount = appliedPromo ? Math.round(subtotalPrice * (appliedPromo.discountPercentage / 100)) : 0;
  const totalDiscountAmount = vipDiscountAmount + promoDiscountAmount;

  const taxAmount = Math.round(Math.max(subtotalPrice - totalDiscountAmount, 0) * 0.05); // 5% GST
  const grandTotal = Math.max(subtotalPrice - totalDiscountAmount + taxAmount, 0);

  const estimatedEndTime = useMemo(() => {
    const minutes = activeTierObj ? activeTierObj.durationMinutes : (selectedServiceObj?.durationMinutes || 60);
    return calculateEndTime(selectedTime, minutes);
  }, [selectedTime, activeTierObj, selectedServiceObj]);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoMsg(null);
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'SPYFIRST20' || code === 'WELCOME20') {
      setAppliedPromo({ code, discountPercentage: 20 });
      setPromoMsg({ type: 'success', text: 'Flat 20% Welcome discount applied!' });
    } else if (code === 'GOLDFACIAL' || code === 'LUXURY25') {
      setAppliedPromo({ code, discountPercentage: 25 });
      setPromoMsg({ type: 'success', text: 'Flat 25% Gold Luxury discount applied!' });
    } else {
      setPromoMsg({ type: 'error', text: 'Invalid promo code. Try SPYFIRST20 or LUXURY25' });
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    // EXPLICIT PACKAGE SELECTION VALIDATION RULE
    if (!selectedPackageTier || !activeTierObj) {
      setConflictError('Please select a package tier before continuing.');
      const pkgElement = document.getElementById('package-tier-selection');
      if (pkgElement) {
        pkgElement.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const { isValid, errors } = validateForm(formData, {
      name: [validateName('Full Name')],
      email: [validateEmail(true)],
      phone: [validatePhone(true)]
    });

    setFieldErrors(errors as Record<string, string>);

    if (!isValid) {
      const firstErr = Object.values(errors)[0];
      setConflictError(firstErr || 'Please fix errors before booking.');
      return;
    }

    const timeToUse = selectedTime || '10:30 AM';

    if (isSlotInPast(selectedDate, timeToUse)) {
      setConflictError('Please select a future appointment time. The selected time slot has already passed.');
      return;
    }

    if (bookedSlots.includes(timeToUse)) {
      setConflictError(`The slot ${timeToUse} on ${selectedDate} is already booked. Please choose an available time slot below.`);
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

    const activePayMethod = paymentMethod || 'Cash';
    await finalizeBooking(activePayMethod);
  };

  const finalizeBooking = async (payMethod: string, upiIdVal?: string, txnIdVal?: string) => {
    if (!selectedPackageTier || !activeTierObj) {
      setConflictError('Please select a package tier before continuing.');
      return;
    }
    setIsSubmitting(true);
    setConflictError(null);
    try {
      const srvName = `${selectedServiceObj?.name || 'Salon Treatment'} (${activeTierObj.name})`;
      const response = await fetch(`${API_BASE_URL}/appointments/public-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          branch: selectedBranch,
          service: srvName,
          serviceId: selectedServiceObj?.id || (selectedServiceObj as any)?._id,
          packageTier: activeTierObj.name,
          price: subtotalPrice,
          staffPreference: selectedStaff,
          specialistName: selectedStaff,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          paymentMethod: isPrePaid ? 'Razorpay (Pre-Paid)' : payMethod,
          paymentDetails: upiIdVal || txnIdVal ? { upiId: upiIdVal, transactionRef: txnIdVal } : {},
          notes: `[Package: ${activeTierObj.name}] [Grand Total: ₹${grandTotal}] ${formData.notes || ''}`
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setBookingSuccess(resData.data);
      } else {
        setConflictError(resData.message || 'Failed to complete booking appointment.');
        fetchBookedSlots(selectedDate, selectedStaff);
      }
    } catch (err: any) {
      setConflictError('Network or server error while processing booking appointment: ' + (err?.message || 'Please try again.'));
    } finally {
      setIsSubmitting(false);
      setShowRazorpayModal(false);
    }
  };

  // ----------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------
  if (loadingService) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 bg-dark-900 text-rosegold-400 font-serif">
        <Sparkles className="w-10 h-10 animate-spin text-rosegold-400" />
        <p className="text-lg font-bold animate-pulse">Loading Treatment Details from Database...</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // ERROR STATE: SERVICE NOT FOUND
  // ----------------------------------------------------
  if (!selectedServiceObj) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-dark-900">
        <motion.div 
          initial={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 sm:p-10 rounded-3xl border border-red-500/40 max-w-lg w-full text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Selected Service Not Found</h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              We couldn't locate the requested service in our catalog database. Please return to the pricing menu to select an active treatment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/pricing?category=${categoryParam}&subcategory=${subcategoryParam}`)}
            className="px-6 py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-glow-rosegold hover:scale-105 transition-all inline-flex items-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Pricing Menu</span>
          </button>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SUCCESSFUL BOOKING CONFIRMATION
  // ----------------------------------------------------
  if (bookingSuccess) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-dark-900">
        <motion.div 
          initial={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-lg w-full p-8 rounded-3xl border border-rosegold-500/40 text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-full rosegold-gradient-bg text-dark-900 flex items-center justify-center mx-auto shadow-lg animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs text-rosegold-400 font-bold uppercase tracking-widest">APPOINTMENT CONFIRMED</span>
            <h2 className="text-3xl font-serif font-bold text-white">Booking #{bookingSuccess.bookingId}</h2>
            <p className="text-xs text-gray-400">A confirmation receipt has been dispatched to your registered contact details.</p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-800/90 border border-white/10 text-left text-xs space-y-2.5">
            <div className="flex justify-between pb-2 border-b border-white/10">
              <span className="text-gray-400">Treatment</span>
              <span className="font-bold text-white text-right">{bookingSuccess.service}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-white/10">
              <span className="text-gray-400">Specialist</span>
              <span className="font-bold text-rosegold-300">{bookingSuccess.specialistName}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-white/10">
              <span className="text-gray-400">Date & Time</span>
              <span className="font-bold text-white">{bookingSuccess.appointmentDate} at {bookingSuccess.appointmentTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Grand Total</span>
              <span className="font-bold text-rosegold-400 font-serif text-sm">₹{grandTotal}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/profile?tab=schedules" className="flex-1 py-3 rounded-full bg-dark-800 text-white font-bold text-xs border border-white/10 hover:border-rosegold-500/40 transition-colors text-center">
              View My Bookings
            </Link>
            <Link href="/" className="flex-1 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs text-center shadow-md">
              Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN DYNAMIC BOOKING INTERFACE
  // ----------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">

      {/* BACK TO PRICING NAVIGATION & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <button
          type="button"
          onClick={() => router.push(`/pricing?category=${categoryParam}&subcategory=${subcategoryParam}`)}
          className="inline-flex items-center space-x-2 text-xs font-bold text-rosegold-400 hover:text-rosegold-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Service (Return to {selectedServiceObj?.category || 'Salon'} Catalogue)</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {allServicesList.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 font-bold">Select Service:</span>
              <select
                value={selectedServiceObj?.id || ''}
                onChange={(e) => {
                  const match = allServicesList.find((s: any) => String(s._id || s.id) === e.target.value);
                  if (match) {
                    setSelectedServiceObj({
                      id: match._id || match.id,
                      name: match.name || match.title,
                      category: match.category || 'Beauty',
                      subCategory: match.subCategory || 'Hair Care',
                      gender: match.gender || 'all',
                      price: match.price || 0,
                      discountPrice: match.discountPrice || match.price,
                      durationMinutes: match.durationMinutes || parseInt(match.duration) || 60,
                      duration: match.duration || `${match.durationMinutes || 60} min`,
                      rating: match.rating || 4.9,
                      description: match.description || match.desc || 'Luxury salon treatment provided by certified specialists.',
                      image: match.image || '',
                      isPopular: match.isPopular || match.popular || false
                    });
                  }
                }}
                className="bg-dark-800 text-rosegold-400 font-bold text-xs px-3 py-1.5 rounded-xl border border-rosegold-500/30 focus:outline-none"
              >
                {allServicesList.map((srv: any) => (
                  <option key={srv._id || srv.id} value={srv._id || srv.id}>
                    {srv.name} (₹{srv.price})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Branch:</span>
            <span className="text-xs font-bold text-white bg-dark-800 px-3 py-1 rounded-full border border-white/10">
              {selectedBranch}
            </span>
          </div>
        </div>
      </div>

      {/* CONFLICT ERROR ALERT */}
      {conflictError && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{conflictError}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN FORM LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: SERVICE DETAILS, PACKAGES & TIME SELECTION (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. SELECTED SERVICE HERO CARD */}
          <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-full sm:w-28 h-28 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
                <LazyImage
                  src={selectedServiceObj.image}
                  alt={selectedServiceObj.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rosegold-500/15 border border-rosegold-500/30 text-rosegold-300 text-[10px] font-extrabold uppercase tracking-wider">
                    {selectedServiceObj.category}
                  </span>
                  {selectedServiceObj.subCategory && (
                    <span className="px-2.5 py-0.5 rounded-full bg-dark-800 text-gray-300 text-[10px] font-semibold">
                      {selectedServiceObj.subCategory}
                    </span>
                  )}
                  {selectedServiceObj.isPopular && (
                    <span className="px-2.5 py-0.5 rounded-full rosegold-gradient-bg text-dark-900 text-[10px] font-extrabold uppercase">
                      POPULAR
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
                  {selectedServiceObj.name}
                </h1>

                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {selectedServiceObj.description}
                </p>

                <div className="flex items-center space-x-4 pt-1 text-xs">
                  <span className="font-serif font-bold text-rosegold-400 text-lg">
                    ₹{selectedServiceObj.price}
                  </span>
                  <span className="text-gray-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                    <span>{selectedServiceObj.duration}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. DYNAMIC PACKAGE TIERS (IF MULTIPLE PACKAGES) */}
          <div id="package-tier-selection" className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-rosegold-400" />
                <span>Select Package Tier</span>
              </h3>
              {!selectedPackageTier ? (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider animate-pulse">
                  Selection Required
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
                  Tier Selected: {activeTierObj?.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {packageTiers.map(tier => (
                <button
                  type="button"
                  key={tier.id}
                  onClick={() => setSelectedPackageTier(tier.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between space-y-3 cursor-pointer ${
                    selectedPackageTier === tier.id
                      ? 'rosegold-glass-card border-rosegold-400 shadow-glow-rosegold scale-[1.02]'
                      : 'bg-dark-850 border-white/10 hover:border-rosegold-500/30'
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-mono font-bold text-rosegold-400 uppercase tracking-wider block">
                      {tier.badge}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-white mt-0.5">{tier.name}</h4>
                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-normal">{tier.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
                    <span className="font-serif font-bold text-rosegold-300 text-lg">₹{tier.price}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{tier.duration}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. SPECIALIST SELECTOR (FILTERED BY CATEGORY) */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center space-x-2">
                <User className="w-4 h-4 text-rosegold-400" />
                <span>Select {selectedServiceObj.category} Specialist</span>
              </h3>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">
                {filteredStaffOptions.length - 1} Experts Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStaffOptions.map(staffName => (
                <button
                  type="button"
                  key={staffName}
                  onClick={() => setSelectedStaff(staffName)}
                  className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    selectedStaff === staffName
                      ? 'rosegold-gradient-bg text-dark-900 border-transparent shadow-md'
                      : 'bg-dark-850 text-gray-300 border-white/10 hover:border-rosegold-500/40'
                  }`}
                >
                  <span className="truncate pr-2">{staffName}</span>
                  {selectedStaff === staffName && <Check className="w-4 h-4 text-dark-900 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 4. DATE & REALTIME TIME SLOTS */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif font-bold text-base text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-rosegold-400" />
                <span>Date & Available Time Slots</span>
              </h3>
              {estimatedEndTime && (
                <span className="text-[11px] text-rosegold-300 font-mono font-bold bg-dark-800 px-3 py-1 rounded-full border border-rosegold-500/30">
                  Est. End Time: {estimatedEndTime}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-semibold">Choose Preferred Appointment Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={getTodayISTStr()}
                  onChange={(e) => {
                    const val = e.target.value;
                    const today = getTodayISTStr();
                    if (val < today) {
                      alert("Appointments cannot be scheduled on past dates. Setting date to today.");
                      setSelectedDate(today);
                    } else {
                      setSelectedDate(val);
                    }
                  }}
                  className="w-full p-3 rounded-2xl bg-dark-850 border border-white/15 text-white font-bold text-sm focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-2 font-semibold">Available Realtime Slots for {selectedDate}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {timeSlots.map(slot => {
                    const isBooked = bookedSlots.includes(slot);
                    const isPast = isSlotInPast(selectedDate, slot);
                    const isUnavailable = isBooked || isPast;
                    const isSelected = selectedTime === slot;

                    return (
                      <button
                        type="button"
                        key={slot}
                        disabled={isUnavailable}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all text-center ${
                          isUnavailable
                            ? 'bg-dark-800/40 text-gray-600 border border-dark-700 line-through cursor-not-allowed'
                            : isSelected
                            ? 'rosegold-gradient-bg text-dark-900 shadow-md font-extrabold'
                            : 'bg-dark-850 text-gray-300 border border-white/10 hover:border-rosegold-500/40 cursor-pointer'
                        }`}
                      >
                        {slot} {isBooked ? '(Booked)' : isPast ? '(Passed)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: BOOKING SUMMARY & CONTACT/PAYMENT FORM (5 COLS) */}
        <div className="lg:col-span-5 space-y-6 sticky top-20">

          {/* DYNAMIC BOOKING SUMMARY CARD */}
          <div className="glass-card p-6 rounded-3xl border border-rosegold-500/30 shadow-2xl space-y-5">
            <h3 className="font-serif font-bold text-lg text-white border-b border-white/10 pb-3 flex items-center justify-between">
              <span>Booking Summary</span>
              <span className="text-xs text-rosegold-400 font-mono font-normal">Realtime Calculation</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Selected Treatment</span>
                <span className="font-bold text-white text-right max-w-[200px] truncate">{selectedServiceObj.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Package Tier</span>
                {activeTierObj ? (
                  <span className="font-bold text-rosegold-300">{activeTierObj.name}</span>
                ) : (
                  <span className="font-bold text-amber-400 font-sans text-xs animate-pulse">None Selected (Required)</span>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Assigned Specialist</span>
                <span className="font-bold text-white text-right max-w-[200px] truncate">{selectedStaff}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Date & Slot</span>
                <span className="font-bold text-white">{selectedDate} ({selectedTime})</span>
              </div>

              {estimatedEndTime && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Completion</span>
                  <span className="font-bold text-rosegold-400 font-mono">{estimatedEndTime}</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 space-y-2">
                {!selectedPackageTier ? (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold text-center space-y-1">
                    <span>⚠️ Package Selection Required</span>
                    <p className="text-[11px] font-normal text-amber-200/80">Please select a package tier above to view pricing & total investment.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-300">
                      <span>Base Package Price ({activeTierObj?.name})</span>
                      <span>₹{subtotalPrice}</span>
                    </div>

                    {membershipDiscountPercent > 0 && (
                      <div className="flex justify-between items-center text-green-400 font-bold bg-green-500/10 p-2 rounded-xl border border-green-500/30">
                        <span className="flex items-center space-x-1">
                          <Crown className="w-3.5 h-3.5 fill-current" />
                          <span>VIP ({membershipInfo?.tier || 'Gold'} {membershipDiscountPercent}%)</span>
                        </span>
                        <span>-₹{vipDiscountAmount}</span>
                      </div>
                    )}

                    {appliedPromo && (
                      <div className="flex justify-between text-green-400 font-bold">
                        <span>Discount ({appliedPromo.code})</span>
                        <span>-₹{promoDiscountAmount}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-400">
                      <span>Taxes (5% GST)</span>
                      <span>+₹{taxAmount}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-2 border-t border-white/10 text-base font-serif font-bold text-white">
                  <span>Grand Total</span>
                  <span className="text-rosegold-400 text-xl font-serif">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* PROMO CODE INPUT */}
            <form onSubmit={handleApplyPromo} className="pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (e.g. SPYFIRST20)"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-dark-850 border border-white/15 text-xs text-white uppercase tracking-wider focus:outline-none focus:border-rosegold-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-dark-800 text-rosegold-400 font-bold text-xs border border-rosegold-500/30 hover:bg-dark-750 transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {promoMsg && (
                <p className={`text-[11px] mt-1.5 font-medium ${promoMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {promoMsg.text}
                </p>
              )}
            </form>
          </div>

          {/* GUEST CONTACT & PAYMENT SUBMISSION FORM */}
          <form onSubmit={handleBookingSubmit} className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h4 className="font-serif font-bold text-sm text-white border-b border-white/10 pb-2">Guest Information</h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                  }}
                  placeholder="Enter your full name"
                  className="w-full p-2.5 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
                {fieldErrors.name && <p className="text-red-400 text-xs font-semibold pt-0.5">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                  }}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
                {fieldErrors.phone && <p className="text-red-400 text-xs font-semibold pt-0.5">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                  }}
                  placeholder="your.name@example.com"
                  className="w-full p-2.5 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
                {fieldErrors.email && <p className="text-red-400 text-xs font-semibold pt-0.5">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Special Preferences / Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Mention any skin allergies or preferred style..."
                  className="w-full p-2.5 rounded-xl bg-dark-850 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>
            </div>

            {/* PAYMENT METHOD SELECTION */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs text-gray-400 block font-semibold">Payment Option</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Razorpay', 'UPI', 'Cash'] as const).map(method => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'rosegold-gradient-bg text-dark-900 shadow-md font-extrabold'
                        : 'bg-dark-850 text-gray-300 border border-white/10 hover:border-rosegold-500/40'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <AnimatedButton
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl rosegold-gradient-bg text-dark-900 font-serif font-bold text-sm shadow-glow-rosegold hover:scale-[1.02] transition-transform cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>
                {isSubmitting
                  ? 'Confirming Reservation...'
                  : !selectedPackageTier
                  ? 'Please Select Package Tier Above ↑'
                  : `Confirm & Pay ₹${grandTotal} →`}
              </span>
            </AnimatedButton>
          </form>

        </div>

      </div>

      {/* RAZORPAY PAYMENT SIMULATION MODAL */}
      <AnimatePresence>
        {showRazorpayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-md w-full p-6 rounded-3xl border border-rosegold-500/40 space-y-5 text-center shadow-2xl relative"
            >
              <button
                onClick={() => setShowRazorpayModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-full rosegold-gradient-bg text-dark-900 flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-rosegold-400 font-bold uppercase tracking-widest">RAZORPAY SECURE GATEWAY</span>
                <h3 className="text-xl font-serif font-bold text-white">Confirm Payment</h3>
                <p className="text-xs text-gray-300">Amount: ₹{grandTotal}</p>
              </div>

              <button
                onClick={async () => {
                  setRazorpayPaying(true);
                  setTimeout(() => {
                    finalizeBooking('Razorpay');
                  }, 1200);
                }}
                disabled={razorpayPaying}
                className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-lg cursor-pointer"
              >
                {razorpayPaying ? 'Authorizing Payment...' : `Pay ₹${grandTotal} Now`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingSkeleton />}>
      <BookingContent />
    </Suspense>
  );
}

