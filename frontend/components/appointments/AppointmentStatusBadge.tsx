'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Award, 
  AlertCircle, 
  Calendar, 
  XCircle, 
  UserX 
} from 'lucide-react';

export type AppointmentStatusType = 
  | 'Confirmed' 
  | 'In Progress' 
  | 'Completed' 
  | 'Pending' 
  | 'Rescheduled' 
  | 'Reschedule Requested'
  | 'Cancelled' 
  | 'No Show';

interface AppointmentStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AppointmentStatusBadge({ 
  status, 
  size = 'md',
  className = '' 
}: AppointmentStatusBadgeProps) {
  const normStatus = (status || 'Confirmed').trim();

  let config = {
    label: normStatus,
    icon: CheckCircle2,
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/40 shadow-[0_0_12px_rgba(34,197,94,0.2)]',
    emoji: '🟢'
  };

  switch (normStatus) {
    case 'Confirmed':
      config = {
        label: 'Confirmed',
        icon: CheckCircle2,
        bg: 'bg-green-500/15',
        text: 'text-green-400',
        border: 'border-green-500/40 shadow-[0_0_12px_rgba(34,197,94,0.2)]',
        emoji: '🟢'
      };
      break;

    case 'In Progress':
      config = {
        label: 'In Progress',
        icon: Clock,
        bg: 'bg-sky-500/15',
        text: 'text-sky-300',
        border: 'border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]',
        emoji: '🔵'
      };
      break;

    case 'Completed':
      config = {
        label: 'Completed',
        icon: Award,
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        emoji: '✅'
      };
      break;

    case 'Pending':
      config = {
        label: 'Pending',
        icon: AlertCircle,
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        border: 'border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
        emoji: '🟡'
      };
      break;

    case 'Rescheduled':
    case 'Reschedule Requested':
      config = {
        label: normStatus === 'Reschedule Requested' ? 'Reschedule Pending' : 'Rescheduled',
        icon: Calendar,
        bg: 'bg-orange-500/15',
        text: 'text-orange-300',
        border: 'border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
        emoji: '🟠'
      };
      break;

    case 'Cancelled':
      config = {
        label: 'Cancelled',
        icon: XCircle,
        bg: 'bg-red-500/15',
        text: 'text-red-400',
        border: 'border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
        emoji: '🔴'
      };
      break;

    case 'No Show':
      config = {
        label: 'No Show',
        icon: UserX,
        bg: 'bg-gray-500/20',
        text: 'text-gray-300',
        border: 'border-gray-500/40',
        emoji: '⚫'
      };
      break;
  }

  const IconComp = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] space-x-1',
    md: 'px-2.5 py-1 text-xs space-x-1.5',
    lg: 'px-3.5 py-1.5 text-xs font-bold space-x-2'
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider backdrop-blur-md transition-all ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}>
      <span>{config.emoji}</span>
      <IconComp className={`${iconSizes} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
}
