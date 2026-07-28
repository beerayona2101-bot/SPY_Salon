'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Check } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export interface QuickTemplate {
  id: string;
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

export default function QuickEnquiryTemplates({
  selectedId,
  onSelectTemplate
}: QuickEnquiryTemplatesProps) {
  const [templates, setTemplates] = useState<QuickTemplate[]>(DEFAULT_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/enquiry-templates`)
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setTemplates(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const filteredTemplates = templates.filter(t => 
    !searchQuery || 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2.5 text-left">
      {/* Header with Search Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-rosegold-400 animate-pulse" />
          <h4 className="text-xs uppercase font-bold text-gray-200 tracking-wider">
            ✨ Quick Message Templates
          </h4>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search template..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-32 sm:w-40 pl-7 pr-2 py-1 rounded-full bg-dark-900 border border-white/10 text-[10px] text-white focus:outline-none focus:border-rosegold-500"
          />
          <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Pill Buttons Row (Horizontally Scrollable on Mobile, Wrap on Desktop) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar sm:flex-wrap">
        {filteredTemplates.map(tmpl => {
          const isSelected = selectedId === tmpl.id;

          return (
            <button
              type="button"
              key={tmpl.id}
              onClick={() => onSelectTemplate(tmpl)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 shrink-0 cursor-pointer border ${
                isSelected
                  ? 'rosegold-gradient-bg text-dark-900 font-extrabold border-rosegold-400 shadow-glow-rosegold scale-[1.03]'
                  : 'bg-dark-800 text-gray-300 hover:text-white border-white/10 hover:border-rosegold-500/50'
              }`}
            >
              <span>{tmpl.icon}</span>
              <span>{tmpl.name}</span>
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
