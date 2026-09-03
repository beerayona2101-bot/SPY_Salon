'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { Sparkles, Search, Check } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';

export interface QuickTemplate {
  id: string;
  _id?: string;
  templateId?: string;
  name: string;
  icon: string;
  category: string;
  message: string;
}

const DEFAULT_TEMPLATES: QuickTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Hair Cut',
    icon: '💇',
    category: 'Services',
    message: `Hello,\n\nI would like to know more about your Hair Cut services.\n\nCould you please share the available packages, pricing, and appointment timings?\n\nThank you.`
  },
  {
    id: 'tmpl-2',
    name: 'Hair Spa',
    icon: '💆',
    category: 'Treatments',
    message: `Hello,\n\nI'm interested in your Hair Spa treatments.\n\nPlease share the available options, duration, prices, and current offers.\n\nThank you.`
  },
  {
    id: 'tmpl-3',
    name: 'Bridal Package',
    icon: '👰',
    category: 'Bridal',
    message: `Hello,\n\nI would like information about your Bridal Makeup and Bridal Packages.\n\nPlease share pricing, inclusions, and availability.\n\nThank you.`
  },
  {
    id: 'tmpl-4',
    name: 'Pricing Enquiry',
    icon: '💰',
    category: 'Pricing',
    message: `Hello,\n\nCould you please send me the latest price list for your salon services?\n\nThank you.`
  },
  {
    id: 'tmpl-5',
    name: 'Appointment Booking',
    icon: '📅',
    category: 'Booking',
    message: `Hello,\n\nI would like to book an appointment.\n\nPlease let me know the available time slots.\n\nThank you.`
  },
  {
    id: 'tmpl-6',
    name: 'Membership Plans',
    icon: '👑',
    category: 'Membership',
    message: `Hello,\n\nI'm interested in your Standard, Premium, and Gold Membership plans.\n\nPlease share the benefits, pricing, discounts, and validity.\n\nThank you.`
  },
  {
    id: 'tmpl-7',
    name: 'Salon Packages',
    icon: '🎁',
    category: 'Offers',
    message: `Hello,\n\nPlease share your salon combo packages and current offers.\n\nThank you.`
  },

  {
    id: 'tmpl-8',
    name: 'VIP Services',
    icon: '⭐',
    category: 'VIP',
    message: `Hello,\n\nI would like to know more about your VIP services and exclusive treatments.\n\nPlease share complete details.\n\nThank you.`
  },
  {
    id: 'tmpl-9',
    name: 'Payment',
    icon: '💳',
    category: 'Payment',
    message: `Hello,\n\nI have a question regarding payment methods and online booking.\n\nPlease assist me.\n\nThank you.`
  },
  {
    id: 'tmpl-10',
    name: 'Callback Request',
    icon: '📞',
    category: 'Support',
    message: `Hello,\n\nPlease arrange a callback at your earliest convenience.\n\nThank you.`
  },
  {
    id: 'tmpl-11',
    name: 'Feedback',
    icon: '💬',
    category: 'Feedback',
    message: `Hello,\n\nI would like to share my feedback regarding my recent salon visit.\n\nThank you.`
  },
  {
    id: 'tmpl-12',
    name: 'Complaint',
    icon: '❗',
    category: 'Support',
    message: `Hello,\n\nI would like to report an issue regarding my recent appointment.\n\nPlease contact me.\n\nThank you.`
  },
  {
    id: 'tmpl-13',
    name: 'General Enquiry',
    icon: '✨',
    category: 'General',
    message: `Hello,\n\nI would like to know more about your salon services.\n\nPlease contact me.\n\nThank you.`
  }
];

interface QuickEnquiryTemplatesProps {
  selectedId: string | null;
  onSelectTemplate: (template: QuickTemplate) => void;
}

const QuickEnquiryTemplates = memo(function QuickEnquiryTemplates({
  selectedId,
  onSelectTemplate
}: QuickEnquiryTemplatesProps) {
  const [templates, setTemplates] = useState<QuickTemplate[]>(DEFAULT_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');

  // Get active theme from ThemeContext safely
  let theme: 'dark' | 'light' = 'dark';
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (e) {
    theme = 'dark';
  }

  useEffect(() => {
    fetch(`${API_BASE_URL}/enquiry-templates`)
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const mapped = data.data.map((t: any) => ({
            ...t,
            id: t._id || t.id || t.templateId
          }));
          setTemplates(mapped);
        }
      })
      .catch(() => { });
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return templates;
    return templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const isLight = theme === 'light' || (typeof document !== 'undefined' && document.documentElement.classList.contains('light'));

  return (
    <div className="space-y-2.5 text-left">
      {/* Header with Theme-Based Font Colors & Search Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <Sparkles className={`w-4 h-4 animate-pulse ${isLight ? 'text-amber-800' : 'text-rosegold-400'}`} />
          <h4 className={`text-xs uppercase font-extrabold tracking-wider transition-colors ${isLight ? '!text-gray-950 font-black' : 'text-rosegold-300'
            }`}>
            ✨ Quick Message Templates
          </h4>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search template..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-32 sm:w-40 pl-7 pr-2 py-1 rounded-full text-[10px] font-bold transition-all focus:outline-none ${isLight
              ? 'bg-white !text-gray-950 border border-amber-900/30 placeholder-gray-600 focus:border-amber-800 shadow-sm'
              : 'bg-dark-900 text-white border border-white/15 placeholder-gray-400 focus:border-rosegold-400'
              }`}
          />
          <Search className={`w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-600' : 'text-gray-400'
            }`} />
        </div>
      </div>

      {/* Pill Buttons Row (Theme-Aware Font and Background Colors) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar sm:flex-wrap">
        {filteredTemplates.map(tmpl => {
          const tmplId = tmpl.id || tmpl._id || tmpl.templateId || '';
          const isSelected = !!selectedId && selectedId === tmplId;

          return (
            <button
              type="button"
              key={tmplId}
              onClick={() => onSelectTemplate({ ...tmpl, id: tmplId })}
              className={`quick-template-btn px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center space-x-1.5 shrink-0 cursor-pointer border ${isSelected
                ? 'selected rosegold-gradient-bg !text-white font-extrabold border-rosegold-500 shadow-md scale-[1.03]'
                : isLight
                  ? 'bg-[#F5EBE1] border border-amber-900/25 hover:bg-amber-100 hover:border-amber-900/40 shadow-sm'
                  : 'bg-dark-800 text-rosegold-200 border border-rosegold-500/40 hover:bg-dark-750 hover:border-rosegold-400 hover:text-white'
                }`}
            >
              <span>{tmpl.icon}</span>
              <span className="font-extrabold">
                {tmpl.name}
              </span>
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default QuickEnquiryTemplates;
