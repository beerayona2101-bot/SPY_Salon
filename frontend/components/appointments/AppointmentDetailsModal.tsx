'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Star, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Sparkles, 
  ShieldCheck,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import AppointmentJourneyTimeline from './AppointmentJourneyTimeline';
import { AppointmentCardData } from './AppointmentCard';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentCardData | null;
  onRescheduleSubmit?: (id: string, newDate: string, newTime: string, reason: string) => Promise<void>;
  onReviewSubmit?: (id: string, rating: number, comment: string) => Promise<void>;
}

export default function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  onRescheduleSubmit,
  onReviewSubmit
}: AppointmentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'reschedule' | 'review'>('details');

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rescheduleTime, setRescheduleTime] = useState<string>('02:00 PM');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review Form State
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  if (!isOpen || !appointment) return null;

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRescheduleSubmit) return;
    setIsSubmitting(true);
    try {
      await onRescheduleSubmit(appointment._id, rescheduleDate, rescheduleTime, rescheduleReason);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onReviewSubmit) return;
    setIsSubmitting(true);
    try {
      await onReviewSubmit(appointment._id, rating, reviewComment);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl glass-card border border-rosegold-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-glow-rosegold relative overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-rosegold-400">#{appointment.bookingId}</span>
              <h3 className="text-xl font-serif font-bold text-white">{appointment.service}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-white/10 pb-2 text-xs">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                activeTab === 'details' ? 'rosegold-gradient-bg text-dark-900' : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              Appointment Breakdown
            </button>
            <button
              onClick={() => setActiveTab('reschedule')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                activeTab === 'reschedule' ? 'rosegold-gradient-bg text-dark-900' : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              Request Reschedule
            </button>
            {appointment.status === 'Completed' && (
              <button
                onClick={() => setActiveTab('review')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  activeTab === 'review' ? 'rosegold-gradient-bg text-dark-900' : 'bg-dark-800 text-gray-400 hover:text-white'
                }`}
              >
                Write Review
              </button>
            )}
          </div>

          {/* TAB 1: DETAILS BREAKDOWN */}
          {activeTab === 'details' && (
            <div className="space-y-4 text-xs">
              <AppointmentStatusBadge status={appointment.status} size="lg" />

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-dark-900 border border-white/5">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Date & Slot</span>
                  <strong className="text-white text-sm block">{appointment.appointmentDate}</strong>
                  <span className="text-rosegold-300 font-mono">{appointment.appointmentTime}</span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Specialist</span>
                  <strong className="text-white text-sm block">{appointment.specialistName || 'Certified Specialist'}</strong>
                  <span className="text-gray-400">{appointment.branch || 'Jubilee Hills Flagship'}</span>
                </div>
              </div>

              {/* Journey Timeline */}
              <AppointmentJourneyTimeline status={appointment.status} bookedDate={appointment.appointmentDate} />

              {/* Receipt Breakdown */}
              <div className="p-4 rounded-2xl bg-dark-900 border border-white/5 space-y-2">
                <span className="text-gray-400 text-[10px] uppercase font-semibold block border-b border-white/10 pb-1">Receipt Summary</span>
                <div className="flex justify-between text-gray-300">
                  <span>Base Treatment Price</span>
                  <span>₹{appointment.price || 0}</span>
                </div>
                {appointment.vipDiscountPercent && (
                  <div className="flex justify-between text-green-400 font-bold">
                    <span>VIP Member Discount ({appointment.vipDiscountPercent}%)</span>
                    <span>-₹{Math.round((appointment.price || 0) * (appointment.vipDiscountPercent / 100))}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Taxes (5% GST)</span>
                  <span>+₹{Math.round((appointment.price || 0) * 0.05)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-serif font-bold text-white">
                  <span>Total Amount Paid</span>
                  <span className="text-rosegold-400">₹{appointment.price || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESCHEDULE FORM */}
          {activeTab === 'reschedule' && (
            <form onSubmit={handleReschedule} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Select New Appointment Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-dark-900 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Select Preferred Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  className="w-full p-3 rounded-xl bg-dark-900 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                >
                  {['09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Reason for Reschedule (Optional)</label>
                <textarea
                  rows={2}
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Schedule conflict, travel plans"
                  className="w-full p-3 rounded-xl bg-dark-900 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-dark-800 text-gray-300 font-bold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold shadow-glow-rosegold hover:scale-105 cursor-pointer"
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Reschedule Request →'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REVIEW FORM */}
          {activeTab === 'review' && (
            <form onSubmit={handleReview} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Rating</label>
                <div className="flex items-center space-x-2 pt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Your Review & Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your experience with the specialist and treatment results..."
                  className="w-full p-3 rounded-xl bg-dark-900 border border-white/15 text-white focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-dark-800 text-gray-300 font-bold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold shadow-glow-rosegold hover:scale-105 cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Post Verified Review ✨'}
                </button>
              </div>
            </form>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
