import React from 'react';
import { Crown, Award, Sparkles, ShieldCheck } from 'lucide-react';

interface VIPBadgeProps {
  badge?: string;
  tier?: 'standard' | 'premium' | 'gold' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function VIPBadge({ badge, tier, size = 'md', className = '' }: VIPBadgeProps) {
  let text = badge || '👑 VIP Member';
  let tierKey = tier ? tier.toLowerCase() : '';

  if (!tierKey && badge) {
    if (badge.toLowerCase().includes('gold')) tierKey = 'gold';
    else if (badge.toLowerCase().includes('premium')) tierKey = 'premium';
    else if (badge.toLowerCase().includes('standard')) tierKey = 'standard';
  }

  if (!tierKey) return null;

  let styles = 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-dark-900 border-amber-300/80 shadow-glow-gold';
  let icon = <Crown className="w-3.5 h-3.5 fill-current text-dark-900 shrink-0" />;

  if (tierKey === 'standard') {
    styles = 'bg-gradient-to-r from-amber-800 to-amber-900 text-amber-200 border-amber-600/50 shadow-sm';
    icon = <Award className="w-3.5 h-3.5 shrink-0 text-amber-300" />;
    if (!badge) text = '🥉 Standard Member';
  } else if (tierKey === 'premium') {
    styles = 'bg-gradient-to-r from-slate-400 via-slate-300 to-slate-500 text-dark-900 border-slate-200 shadow-md';
    icon = <Sparkles className="w-3.5 h-3.5 shrink-0 text-dark-900" />;
    if (!badge) text = '🥈 Premium Member';
  } else {
    // Gold VIP
    styles = 'rosegold-gradient-bg text-dark-900 border-rosegold-300 font-extrabold shadow-glow-rosegold';
    icon = <Crown className="w-3.5 h-3.5 shrink-0 text-dark-900" />;
    if (!badge) text = '👑 Gold Member';
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[10px] space-x-1 rounded-full' 
    : size === 'lg' 
    ? 'px-4 py-1.5 text-xs sm:text-sm space-x-2 rounded-2xl' 
    : 'px-2.5 py-1 text-xs space-x-1.5 rounded-full';

  return (
    <span className={`inline-flex items-center font-bold tracking-wide border ${sizeClasses} ${styles} ${className}`}>
      {icon}
      <span>{text}</span>
    </span>
  );
}
