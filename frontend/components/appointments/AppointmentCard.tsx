'use client';

import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  FileText, 
  RotateCcw, 
  Star, 
  X, 
  CheckCircle2, 
  Crown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import AppointmentJourneyTimeline from './AppointmentJourneyTimeline';
import { apiFetch } from '@/lib/api';

export interface AppointmentCardData {
  _id: string;
  bookingId: string;
  service: string;
  serviceImage?: string;
  specialistName?: string;
  specialistPhoto?: string;
  branch?: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes?: number;
  duration?: string;
  packageTitle?: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  price?: number;
  vipDiscountPercent?: number;
  cancellationReason?: string;
}

interface AppointmentCardProps {
  appointment: AppointmentCardData;
  onReschedule?: (app: AppointmentCardData) => void;
  onCancel?: (app: AppointmentCardData) => void;
  onRateReview?: (app: AppointmentCardData) => void;
  onBookAgain?: (app: AppointmentCardData) => void;
  onViewInvoice?: (app: AppointmentCardData) => void;
}

export default function AppointmentCard({
  appointment,
  onReschedule,
  onCancel,
  onRateReview,
  onBookAgain,
  onViewInvoice
}: AppointmentCardProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      const res = await apiFetch(`/invoices/${appointment._id}`);
      if (!res.ok) {
        alert('Failed to download invoice. Ensure booking is completed and payment is registered.');
        setIsDownloading(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SPY-INVOICE-${appointment.bookingId || 'slip'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Error occurred while fetching your invoice PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const normStatus = (appointment.status || 'Confirmed').trim();

  // Background tint based on status
  const cardBorderTint = 
    normStatus === 'Confirmed' ? 'border-green-500/30 hover:border-green-500/50 shadow-glow-rosegold' :
    normStatus === 'In Progress' ? 'border-sky-500/40 bg-sky-950/20' :
    normStatus === 'Completed' ? 'border-emerald-500/30 bg-emerald-950/10' :
    normStatus === 'Pending' ? 'border-amber-500/30 bg-amber-950/10' :
    normStatus === 'Rescheduled' || normStatus === 'Reschedule Requested' ? 'border-orange-500/30 bg-orange-950/10' :
    normStatus === 'Cancelled' ? 'border-red-500/25 bg-red-950/10' :
    'border-gray-500/20 bg-dark-850';

  const defaultServiceImg = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80';
  const defaultStaffPhoto = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80';

  return (
    <div className={`glass-card p-5 sm:p-6 rounded-3xl border transition-all duration-300 space-y-4 text-left ${cardBorderTint}`}>
      {/* 1. Header: Booking ID, Status Badge & Payment Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-rosegold-400 text-xs bg-rosegold-500/10 border border-rosegold-500/20 px-2.5 py-0.5 rounded-md">
            #{appointment.bookingId || appointment._id?.slice(-6)}
          </span>
          {(() => {
            const pkgTitle = (appointment as any).packageTier || (appointment as any).packageName || appointment.packageTitle;
            return (pkgTitle && pkgTitle !== 'No Package' && pkgTitle !== 'null') ? (
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                🎟️ {pkgTitle}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                No Package
              </span>
            );
          })()}
        </div>

        <div className="flex items-center space-x-2">
          <AppointmentStatusBadge status={normStatus} size="sm" />
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            appointment.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {appointment.paymentStatus === 'Paid' ? 'Paid ✅' : 'Pay at Studio ⏳'}
          </span>
        </div>
      </div>

      {/* 2. Service & Specialist Details */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Service Thumbnail */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
          <img 
            src={appointment.serviceImage || defaultServiceImg} 
            alt={appointment.service}
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Info Container */}
        <div className="space-y-1 flex-1 min-w-0">
          <h3 className="font-serif font-bold text-lg text-white truncate">
            {appointment.service}
          </h3>

          {Array.isArray((appointment as any).services) && (appointment as any).services.length > 1 && (
            <div className="flex flex-wrap gap-1.5 py-0.5">
              {(appointment as any).services.map((s: any, i: number) => (
                <span key={i} className="text-[10px] font-medium bg-dark-800 text-rosegold-300 px-2 py-0.5 rounded border border-white/10">
                  ✂️ {s.name} (₹{s.price})
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-rosegold-400" />
              <strong className="text-white">{appointment.appointmentDate}</strong>
            </span>
            <span className="flex items-center space-x-1 font-mono text-rosegold-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{appointment.appointmentTime} ({(appointment as any).totalDuration ? `${(appointment as any).totalDuration} min` : (appointment.duration || `${appointment.durationMinutes || 30} min`)})</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 pt-1 text-xs">
            <div className="w-5 h-5 rounded-full overflow-hidden border border-rosegold-400 shrink-0">
              <img src={appointment.specialistPhoto || defaultStaffPhoto} alt="Specialist" className="w-full h-full object-cover" />
            </div>
            <span className="text-gray-300">
              Specialist: <strong className="text-white">{appointment.specialistName || 'Any Specialist'}</strong>
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 flex items-center space-x-0.5">
              <MapPin className="w-3 h-3 text-rosegold-400" />
              <span>{appointment.branch || 'Jubilee Hills Studio'}</span>
            </span>
          </div>
        </div>

        {/* Price & Savings */}
        <div className="text-left sm:text-right shrink-0">
          <span className="text-xl font-serif font-bold text-rosegold-400 block">
            ₹{appointment.price || 0}
          </span>
          {appointment.vipDiscountPercent && (
            <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
              VIP {appointment.vipDiscountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      {/* 3. Interactive Journey Timeline */}
      <AppointmentJourneyTimeline 
        status={normStatus} 
        bookedDate={appointment.appointmentDate}
        cancellationReason={appointment.cancellationReason}
      />

      {/* 4. Context-Specific Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 text-xs">
        
        {/* PENDING ACTIONS */}
        {normStatus === 'Pending' && (
          <>
            {onCancel && (
              <button
                onClick={() => onCancel(appointment)}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white font-bold transition-colors cursor-pointer"
              >
                Cancel Booking
              </button>
            )}
            {onReschedule && (
              <button
                onClick={() => onReschedule(appointment)}
                className="px-4 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold shadow-sm hover:scale-105 transition-all cursor-pointer"
              >
                Reschedule Slot →
              </button>
            )}
          </>
        )}

        {/* CONFIRMED ACTIONS */}
        {(normStatus === 'Confirmed' || normStatus === 'Rescheduled') && (
          <>
            <a
              href="tel:+919876543210"
              className="px-3 py-2 rounded-xl bg-dark-800 text-gray-300 hover:text-white font-bold border border-white/10 flex items-center space-x-1 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-rosegold-400" />
              <span>Call Studio</span>
            </a>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-dark-900 font-bold border border-green-500/30 flex items-center space-x-1 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            {onReschedule && (
              <button
                onClick={() => onReschedule(appointment)}
                className="px-4 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold shadow-sm hover:scale-105 transition-all cursor-pointer"
              >
                Reschedule Slot
              </button>
            )}
          </>
        )}

        {/* IN PROGRESS ACTIONS */}
        {normStatus === 'In Progress' && (
          <div className="flex items-center space-x-2 text-sky-300 font-bold bg-sky-500/20 border border-sky-500/40 px-3.5 py-1.5 rounded-xl animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Currently in Treatment Chair • Live Queue #1</span>
          </div>
        )}

        {/* COMPLETED ACTIONS */}
        {normStatus === 'Completed' && (
          <>
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
              className="px-3 py-2 rounded-xl bg-dark-800 text-gray-300 hover:text-white font-bold border border-white/10 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-rosegold-400" />
              <span>{isDownloading ? 'Downloading...' : 'Invoice 📄'}</span>
            </button>
            {onRateReview && (
              <button
                onClick={() => onRateReview(appointment)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-dark-900 font-bold border border-amber-500/30 flex items-center space-x-1 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Rate & Review</span>
              </button>
            )}
            {onBookAgain && (
              <button
                onClick={() => onBookAgain(appointment)}
                className="px-4 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold shadow-sm hover:scale-105 transition-all cursor-pointer flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Book Again</span>
              </button>
            )}
          </>
        )}

        {/* CANCELLED ACTIONS */}
        {normStatus === 'Cancelled' && (
          <>
            {onBookAgain && (
              <button
                onClick={() => onBookAgain(appointment)}
                className="px-4 py-2 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold shadow-sm hover:scale-105 transition-all cursor-pointer flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Book Session</span>
              </button>
            )}
          </>
        )}

      </div>
    </div>
  );
}
