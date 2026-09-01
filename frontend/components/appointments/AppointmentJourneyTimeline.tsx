'use client';

import React from 'react';
import { Check, Clock, Sparkles, XCircle } from 'lucide-react';

interface AppointmentJourneyTimelineProps {
  status: string;
  bookedDate?: string;
  cancellationReason?: string;
}

export default function AppointmentJourneyTimeline({ 
  status,
  bookedDate,
  cancellationReason
}: AppointmentJourneyTimelineProps) {
  const normStatus = (status || 'Confirmed').trim();

  if (normStatus === 'Cancelled') {
    return (
      <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-red-400 font-bold">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>Appointment Cancelled</span>
        </div>
        {cancellationReason && (
          <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
            Reason: <span className="text-red-300 font-medium">{cancellationReason}</span>
          </p>
        )}
      </div>
    );
  }

  const steps = [
    { id: 'booked', label: 'Booked' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'checkedin', label: 'Checked In' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' }
  ];

  let currentStepIndex = 1; // Default Confirmed
  if (normStatus === 'Pending') currentStepIndex = 0;
  if (normStatus === 'Confirmed' || normStatus === 'Rescheduled') currentStepIndex = 1;
  if (normStatus === 'Checked In') currentStepIndex = 2;
  if (normStatus === 'In Progress') currentStepIndex = 3;
  if (normStatus === 'Completed') currentStepIndex = 4;

  return (
    <div className="p-3.5 rounded-2xl bg-dark-900/90 border border-white/5 space-y-2 text-xs">
      <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-semibold">
        <span>Appointment Journey</span>
        <span className="text-rosegold-400 font-mono font-bold">
          {normStatus === 'Completed' ? 'Service Completed ✨' : normStatus === 'In Progress' ? 'Currently in Chair 💆' : 'On Schedule'}
        </span>
      </div>

      <div className="flex items-center justify-between relative pt-1">
        {/* Horizontal Connecting Line */}
        <div className="absolute left-4 right-4 top-[18px] h-0.5 bg-white/10 -z-0">
          <div 
            className="h-full rosegold-gradient-bg transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, idx) => {
          const isDone = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center space-y-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                isCurrent
                  ? 'rosegold-gradient-bg text-dark-900 shadow-glow-rosegold scale-110'
                  : isDone
                    ? 'bg-green-500 text-dark-900 border border-green-400'
                    : 'bg-dark-800 text-gray-500 border border-white/10'
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
              </div>
              <span className={`text-[9.5px] font-medium whitespace-nowrap ${
                isCurrent ? 'text-rosegold-300 font-bold' : isDone ? 'text-gray-200' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
