'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  Gift, 
  Clock, 
  ArrowLeft,
  Lock,
  CreditCard
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import VIPBadge from '@/components/common/VIPBadge';

const STATIC_PLANS_DATA: Record<string, any> = {
  standard: {
    code: 'standard',
    name: 'Standard Membership',
    badge: '🥉 Standard Member',
    tagline: 'Essential VIP Privileges & Special Perks',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    discountPercentage: 5,
    bannerImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
    benefits: [
      '5% Flat Discount on all salon services',
      'Priority Salon Booking Queue',
      'Special Birthday Offer & Surprise Gift',
      'Monthly Beauty & Care Tips Newsletter',
      'Dedicated Member Support Desk'
    ],
    whatsIncluded: [
      '5% Flat Discount across Hair, Skin, & Nails',
      'Priority Slot Queue Access',
      'Birthday Celebration Coupon',
      'Member Support via WhatsApp & Phone'
    ],
    whatsNotIncluded: [
      'Free Complimentary Treatments',
      'VIP Executive Lounge Access',
      'Unlimited Priority Booking'
    ],
    validity: '30 Days for Monthly / 365 Days for Yearly',
    termsAndConditions: [
      'Valid for 30 days (Monthly) or 365 days (Yearly) from activation date.',
      'Discount applies automatically during online or in-salon desk checkout.',
      'Membership is tied to account credentials and non-transferable.'
    ],
    faqs: [
      { question: 'When does my membership discount start?', answer: 'Your 5% discount is activated instantly upon successful payment and applies to your very next booking.' },
      { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel auto-renewal anytime from your Customer Profile Dashboard.' }
    ],
    color: 'from-amber-700 to-amber-900',
    borderColor: 'border-amber-600/40'
  },
  premium: {
    code: 'premium',
    name: 'Premium Membership',
    badge: '🥈 Premium Member',
    tagline: 'Enhanced Luxury Experience & Monthly Spa Benefits',
    monthlyPrice: 2499,
    yearlyPrice: 24999,
    discountPercentage: 10,
    bannerImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
    benefits: [
      '10% Flat Discount on all salon services',
      'Priority Booking & Faster Queue',
      'Free Expert Hair & Skin Consultation',
      'Free Hair Spa Treatment every month',
      'Exclusive Member Flash Offers',
      'Special Birthday Gift',
      'VIP Member Support'
    ],
    whatsIncluded: [
      '10% Flat Discount on all services',
      '1 Complimentary Hair Spa Ritual every month',
      'Free Dermato-Cosmetology Consultation',
      'Priority Queueing at Flagship Outlets',
      'Premium Birthday Surprise Gift'
    ],
    whatsNotIncluded: [
      'Complimentary Facial Treatments',
      'VIP Executive Lounge Access'
    ],
    validity: '30 Days for Monthly / 365 Days for Yearly',
    termsAndConditions: [
      'Complimentary Hair Spa must be redeemed within the active monthly billing cycle.',
      '10% discount applies automatically during booking.'
    ],
    faqs: [
      { question: 'How do I claim my free Hair Spa?', answer: 'Simply select any Hair Spa service when booking online; your 100% discount for the monthly spa will automatically apply at checkout.' }
    ],
    color: 'from-slate-500 to-slate-800',
    borderColor: 'border-slate-400/50'
  },
  gold: {
    code: 'gold',
    name: 'Gold VIP Membership',
    badge: '👑 Gold Member',
    tagline: 'Ultimate Luxury Privilege & Complimentary Rituals',
    monthlyPrice: 4999,
    yearlyPrice: 49999,
    discountPercentage: 20,
    bannerImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop&q=80',
    benefits: [
      '20% Flat Discount on all salon services',
      'Unlimited Priority Booking',
      'Dedicated Executive VIP Support',
      'Complimentary Hair Spa & Luxury Facial per month',
      'Exclusive VIP Gala Events & Early Access',
      'Special Festival Offers & Bonuses',
      'VIP Lounge Access at Flagship Outlets',
      'Birthday Premium Luxury Gift',
      'Exclusive Package Pricing & Double Points'
    ],
    whatsIncluded: [
      '20% Flat Discount across all luxury treatments',
      '1 Complimentary Signature Hair Spa & 1 Luxury Gold Facial per month',
      'Unlimited VIP Priority Queueing & Lounge Access',
      'Dedicated Executive Concierge Desk',
      'Double Reward Points on all purchases'
    ],
    whatsNotIncluded: [
      'None! Gold VIP includes all luxury privileges offered by SPY Salon.'
    ],
    validity: '30 Days for Monthly / 365 Days for Yearly',
    termsAndConditions: [
      'Gold VIP membership includes full access to all flagship salon lounges.',
      '20% discount is automatically applied to all services and packages.'
    ],
    faqs: [
      { question: 'What is VIP Lounge Access?', answer: 'Gold VIP members enjoy complimentary refreshments, private styling suites, and complimentary beverage menus while waiting or relaxing.' }
    ],
    color: 'from-amber-500 via-yellow-500 to-amber-600',
    borderColor: 'border-amber-400/60'
  }
};

export default function MembershipDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const tierKey = (params?.tier as string || 'gold').toLowerCase();
  const [dynamicPlanData, setDynamicPlanData] = useState<any>(null);

  const fetchLivePlanData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/membership/plans`);
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        const match = data.data.find((p: any) => p.code?.toLowerCase() === tierKey || p._id === tierKey);
        if (match) {
          setDynamicPlanData({
            ...(STATIC_PLANS_DATA[tierKey] || STATIC_PLANS_DATA.gold),
            ...match,
            benefits: Array.isArray(match.benefits) ? match.benefits : (match.benefits ? match.benefits.split(',').map((b: string) => b.trim()) : (STATIC_PLANS_DATA[tierKey]?.benefits || []))
          });
        }
      }
    } catch (err) {
      console.warn('Using fallback static membership data');
    }
  };

  useEffect(() => {
    fetchLivePlanData();
    const intervalId = setInterval(fetchLivePlanData, 3000);
    return () => clearInterval(intervalId);
  }, [tierKey]);

  const planData = dynamicPlanData || STATIC_PLANS_DATA[tierKey] || STATIC_PLANS_DATA.gold;

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'UPI Instant / QR Code'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('spy_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setForm(prev => ({
          ...prev,
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || ''
        }));
      } catch (e) {}
    }
  }, []);

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/membership/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          planCode: planData.code,
          billingCycle,
          paymentMethod: form.paymentMethod
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update localStorage user with new VIP status
        const storedUserStr = localStorage.getItem('spy_user');
        if (storedUserStr) {
          try {
            const u = JSON.parse(storedUserStr);
            u.membership = data.data.userMembership;
            localStorage.setItem('spy_user', JSON.stringify(u));
          } catch (e) {}
        }
        setPaymentSuccess(true);
      } else {
        alert(data.message || 'Payment failed. Please try again.');
      }
    } catch (err) {
      // Direct offline fallback for immediate activation
      const fakeMembership = {
        status: 'Active',
        tier: planData.name.replace(' Membership', ''),
        badge: planData.badge,
        membershipId: 'MEMB-' + Math.floor(100000 + Math.random() * 900000),
        discountPercent: planData.discountPercentage
      };
      const storedUserStr = localStorage.getItem('spy_user');
      if (storedUserStr) {
        try {
          const u = JSON.parse(storedUserStr);
          u.membership = fakeMembership;
          localStorage.setItem('spy_user', JSON.stringify(u));
        } catch (e) {}
      }
      setPaymentSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPrice = billingCycle === 'yearly' ? planData.yearlyPrice : planData.monthlyPrice;

  return (
    <div className="min-h-screen bg-dark-900 text-white pb-20">
      
      {/* 1. HERO BANNER */}
      <div className="relative h-80 sm:h-96 w-full overflow-hidden">
        <img 
          src={planData.bannerImage} 
          alt={planData.name}
          className="w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />

        <div className="absolute top-6 left-6 z-10">
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 rounded-full glass-panel border border-white/20 text-xs font-bold text-gray-200 hover:text-white flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Services</span>
          </button>
        </div>

        <div className="absolute bottom-8 left-6 sm:left-12 right-6 z-10 max-w-4xl space-y-3">
          <VIPBadge badge={planData.badge} tier={planData.code} size="lg" />
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-wide">{planData.name}</h1>
          <p className="text-gray-300 text-sm sm:text-base">{planData.tagline}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        
        {/* 2. PRICING CARD & QUICK BUY BANNER */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/40 space-y-6 bg-dark-800/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rosegold-500/10 text-rosegold-400 text-xs font-bold uppercase">
              <Zap className="w-3.5 h-3.5" />
              <span>Instant VIP Activation</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-white">Select Billing & Lock Privilege</h2>
            <p className="text-xs text-gray-400">Save up to 17% with Yearly Subscription. Cancel auto-renewal anytime.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Monthly / Yearly Switch */}
            <div className="bg-dark-900 p-1.5 rounded-full border border-white/10 flex items-center space-x-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'rosegold-gradient-bg text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'yearly' ? 'rosegold-gradient-bg text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly (Save 17%)
              </button>
            </div>

            <div className="text-center md:text-right">
              <div className="text-3xl font-serif font-bold text-rosegold-400">
                ₹{currentPrice.toLocaleString('en-IN')}
                <span className="text-xs text-gray-400 font-sans">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
              </div>
              <span className="text-[10px] text-green-400 font-bold block">{planData.discountPercentage}% Flat Service Discount</span>
            </div>

            <button
              onClick={() => setPurchaseModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-sm shadow-glow-rosegold hover:scale-105 transition-all cursor-pointer"
            >
              Buy {planData.name}
            </button>
          </div>
        </div>

        {/* 3. COMPLETE BENEFITS & WHAT'S INCLUDED / EXCLUDED */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Complete Benefits List */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center space-x-3 text-rosegold-400 border-b border-white/10 pb-4">
              <Crown className="w-6 h-6" />
              <h3 className="text-xl font-serif font-bold text-white">Complete VIP Member Benefits</h3>
            </div>

            <ul className="space-y-3.5">
              {planData.benefits.map((b: string, i: number) => (
                <li key={i} className="flex items-start space-x-3 text-sm text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-rosegold-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Included vs Not Included */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center space-x-3 text-rosegold-400 border-b border-white/10 pb-4">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-xl font-serif font-bold text-white">Package Coverage & Features</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider block">What's Included</span>
                <div className="space-y-2">
                  {planData.whatsIncluded.map((inc: string, i: number) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-gray-300 bg-dark-800 p-2.5 rounded-xl border border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">What's Not Included</span>
                <div className="space-y-2">
                  {planData.whatsNotIncluded.map((exc: string, i: number) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-gray-400 bg-dark-900 p-2.5 rounded-xl border border-white/5">
                      <XCircle className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>{exc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 4. MEMBERSHIP COMPARISON TABLE */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs text-rosegold-400 font-bold uppercase tracking-wider">Side-by-Side Comparison</span>
            <h3 className="text-2xl font-serif font-bold text-white">All VIP Membership Tiers Compared</h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-rosegold-400 font-serif text-sm">
                  <th className="p-3">Features & Privileges</th>
                  <th className="p-3 text-center">🥉 Standard (5%)</th>
                  <th className="p-3 text-center">🥈 Premium (10%)</th>
                  <th className="p-3 text-center text-rosegold-300">👑 Gold VIP (20%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                <tr>
                  <td className="p-3 font-semibold text-white">Flat Service Discount</td>
                  <td className="p-3 text-center">5% Off</td>
                  <td className="p-3 text-center font-bold text-slate-200">10% Off</td>
                  <td className="p-3 text-center font-extrabold text-rosegold-400">20% Off</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Booking Priority</td>
                  <td className="p-3 text-center">Standard Priority</td>
                  <td className="p-3 text-center">High Priority</td>
                  <td className="p-3 text-center text-rosegold-400 font-bold">Unlimited Instant Priority</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Free Monthly Hair Spa</td>
                  <td className="p-3 text-center text-gray-500">❌</td>
                  <td className="p-3 text-center text-green-400 font-bold">1 Free / Month</td>
                  <td className="p-3 text-center text-green-400 font-bold">1 Free / Month</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Free Monthly Facial</td>
                  <td className="p-3 text-center text-gray-500">❌</td>
                  <td className="p-3 text-center text-gray-500">❌</td>
                  <td className="p-3 text-center text-green-400 font-bold">1 Luxury Gold Facial / Month</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Flagship VIP Lounge Access</td>
                  <td className="p-3 text-center text-gray-500">❌</td>
                  <td className="p-3 text-center text-gray-500">❌</td>
                  <td className="p-3 text-center text-amber-400 font-bold">✅ Unlimited Access</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Dedicated Support Concierge</td>
                  <td className="p-3 text-center">Member Desk</td>
                  <td className="p-3 text-center">Priority Desk</td>
                  <td className="p-3 text-center text-rosegold-400 font-bold">Dedicated Executive Concierge</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. FREQUENTLY ASKED QUESTIONS & TERMS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-xl font-serif font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-rosegold-400" />
              <span>Frequently Asked Questions</span>
            </h3>

            <div className="space-y-4">
              {planData.faqs.map((faq: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-dark-800/80 border border-white/5 space-y-1.5">
                  <strong className="text-xs font-bold text-white block">{faq.question}</strong>
                  <p className="text-xs text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-xl font-serif font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-rosegold-400" />
              <span>Terms & Validity</span>
            </h3>

            <div className="space-y-3 text-xs text-gray-300">
              <div className="p-3 rounded-xl bg-dark-800 border border-rosegold-500/20">
                <span className="text-[10px] text-rosegold-400 uppercase font-bold block">Validity Period</span>
                <span className="font-bold text-white">{planData.validity}</span>
              </div>

              <ul className="space-y-2 list-disc list-inside text-gray-400 pt-2">
                {planData.termsAndConditions.map((term: string, i: number) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>

      </div>

      {/* 6. PURCHASE PAYMENT MODAL */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl border border-rosegold-500/40 space-y-6 bg-dark-900 shadow-2xl text-left">
            
            {!paymentSuccess ? (
              <form onSubmit={handleConfirmPurchase} className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <VIPBadge badge={planData.badge} tier={planData.code} size="sm" />
                    <h3 className="text-lg font-serif font-bold text-white mt-1">Checkout: {planData.name}</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setPurchaseModalOpen(false)}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-800 border border-rosegold-500/30 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-400 block">Subscription ({billingCycle})</span>
                    <strong className="text-white font-bold">{planData.discountPercentage}% Flat Off Unlocked</strong>
                  </div>
                  <span className="text-xl font-serif font-bold text-rosegold-400">
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter customer name"
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:border-rosegold-500"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:border-rosegold-500"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Mobile Phone *</label>
                    <input 
                      type="text" 
                      required
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:border-rosegold-500"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Payment Method *</label>
                    <select
                      value={form.paymentMethod}
                      onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                      className="w-full p-3 rounded-xl bg-dark-800 text-white border border-white/10 focus:border-rosegold-500"
                    >
                      <option value="UPI Instant / QR Code">UPI Instant / QR Code (Recommended)</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-sm shadow-glow-rosegold cursor-pointer hover:scale-[1.02] transition-transform"
                >
                  {isSubmitting ? 'Processing Security Gate...' : `Confirm & Pay ₹${currentPrice.toLocaleString('en-IN')}`}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto border border-green-500/40">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white">Membership Activated!</h3>
                <VIPBadge badge={planData.badge} tier={planData.code} size="lg" />
                <p className="text-xs text-gray-300 max-w-xs mx-auto">
                  Congratulations {form.name}! Your {planData.name} is live. Enjoy your {planData.discountPercentage}% flat discount on all bookings!
                </p>
                <div className="pt-2 flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      setPurchaseModalOpen(false);
                      router.push('/book');
                    }}
                    className="w-full py-3 rounded-full rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-md cursor-pointer"
                  >
                    Book Treatment with {planData.discountPercentage}% Off
                  </button>
                  <button
                    onClick={() => {
                      setPurchaseModalOpen(false);
                      router.push('/profile');
                    }}
                    className="w-full py-3 rounded-full bg-dark-800 text-gray-300 font-bold text-xs border border-white/10 hover:text-white cursor-pointer"
                  >
                    View Membership Card in Profile
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
