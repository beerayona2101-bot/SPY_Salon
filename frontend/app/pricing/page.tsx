'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  Clock, 
  CheckCircle, 
  Scissors, 
  Palette, 
  Sparkle, 
  Droplet, 
  Smile, 
  Sun, 
  Zap, 
  Feather, 
  Heart, 
  ChevronRight,
  ChevronDown,
  Star,
  Tag,
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface ServiceMenuItem {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  duration?: string;
  description?: string;
  popular?: boolean;
  isNew?: boolean;
  offerBadge?: string;
}

export default function PricingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [apiServices, setApiServices] = useState<ServiceMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Services from Backend API with Fallback
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/services`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped = data.data.map((s: any) => ({
            id: s._id || s.id,
            name: s.name,
            category: s.category || 'Treatments',
            price: s.price,
            originalPrice: s.discountPrice ? s.price : undefined,
            duration: s.durationMinutes ? `${s.durationMinutes} mins` : '45 mins',
            description: s.description || 'Luxury treatment by SPY Salon certified specialists.',
            popular: s.isPopular || false,
            isNew: false
          }));
          setApiServices(mapped);
        }
      } catch (err) {
        console.warn('API fetch error, utilizing fallback menu data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Comprehensive Luxury Salon Services Master Dataset
  const masterMenuCategories = [
    {
      id: 'hair-men',
      name: '✂️ Hair Cuts – Men',
      tagline: 'Precision Styling & Executive Grooming',
      items: [
        { id: 'hm1', name: 'Stylist Hair Cut', price: 500, duration: '30 mins', description: 'Consultation, precision haircut & neck taper.', popular: true },
        { id: 'hm2', name: 'Top Senior Stylist Hair Cut', price: 800, duration: '45 mins', description: 'Advanced scissor technique by senior stylist.', popular: false },
        { id: 'hm3', name: 'Hair Wash & Conditioning Styling', price: 250, duration: '20 mins', description: 'Scalp cleansing, conditioner & blowout.', popular: false },
        { id: 'hm4', name: 'Royal Shaving & Beard Sculpting', price: 250, duration: '25 mins', description: 'Hot towel steam, precision blade shave & balm.', popular: false },
        { id: 'hm5', name: 'Creative Fade & Hair Tattoo Cut', price: 1000, duration: '60 mins', description: 'Custom hair art, razor fade & pomade finish.', isNew: true },
        { id: 'hm6', name: 'Advance Hair Cut & Scalp Detox Spa', price: 1000, duration: '50 mins', description: 'Haircut combined with anti-dandruff scalp scrub.', popular: false }
      ]
    },
    {
      id: 'hair-women',
      name: '✂️ Hair Cuts – Women',
      tagline: 'Signature Couture Style & Volume Blowouts',
      items: [
        { id: 'hw1', name: 'Stylist Hair Cut', price: 1000, duration: '45 mins', description: 'Layering, fringe trim & classic blowout finish.', popular: true },
        { id: 'hw2', name: 'Top Stylist Hair Cut', price: 2000, duration: '60 mins', description: 'Custom face-framing cut by Master Creative Director.', popular: true },
        { id: 'hw3', name: 'Luxury Hair Wash & Blow Dry', price: 600, duration: '35 mins', description: 'Deep moisture wash and smooth volume blow dry.', popular: false },
        { id: 'hw4', name: 'Quick Refresh Hair Wash', price: 400, duration: '20 mins', description: 'Organic botanical shampoo rinse.', popular: false },
        { id: 'hw5', name: 'Baby / Kids Hair Cut', price: 500, duration: '30 mins', description: 'Gentle haircut for kids up to 10 years.', popular: false },
        { id: 'hw6', name: 'Out Curls & Glam Waves Styling', price: 800, duration: '40 mins', description: 'Bouncy out-curls with thermal heat protection.', popular: false },
        { id: 'hw7', name: 'Thermal Ironing Straightening', price: 1000, duration: '45 mins', description: 'Sleek ceramic iron smoothing finish.', popular: false },
        { id: 'hw8', name: 'Tonging & Hollywood Curls', price: 1000, duration: '45 mins', description: 'Red-carpet glam curls with hairspray hold.', popular: false },
        { id: 'hw9', name: 'Updowns & Party Bun Styling', price: 1000, duration: '50 mins', description: 'Elegant bridal or cocktail party hair updo.', popular: false },
        { id: 'hw10', name: 'Creative Hair Cut & Reshaping', price: 2000, duration: '75 mins', description: 'Bob, Pixie, or Butterfly transformation cut.', isNew: true },
        { id: 'hw11', name: 'Advance Hair Cut & Deep Conditioning', price: 1500, duration: '60 mins', description: 'Haircut paired with intense hair hydration mask.', popular: false }
      ]
    },
    {
      id: 'hair-color',
      name: '🎨 Hair Color',
      tagline: 'Global Color, Balayage & Foil Highlights',
      isBrandComparison: true,
      brand1: "L'Oreal Paris Professional",
      brand2: 'Schwarzkopf Igora Royal',
      comparisonItems: [
        { name: 'Root Touch Up (100% Grey Coverage)', price1: 1500, price2: 1800, duration: '45 mins' },
        { name: 'Global Hair Color (Ammonia-Free)', price1: 3500, price2: 4200, duration: '90 mins' },
        { name: 'Balayage / Ombre Hand-Painted Highlights', price1: 5500, price2: 6500, duration: '150 mins' },
        { name: 'Fashion Shade Streak (Per Foil)', price1: 500, price2: 650, duration: '20 mins' }
      ]
    },
    {
      id: 'treatments',
      name: '💆 Hair Treatments & 🌊 Keratin Botox',
      tagline: 'Intensive Hair Spa, Keratin & Olaplex Restoration',
      items: [
        { id: 'tr1', name: 'Signature Keratin Hair Spa & Mask', price: 2499, originalPrice: 3200, duration: '60 mins', description: 'Deep hydration mask for frizz-free glossy hair.', popular: true, offerBadge: '20% OFF' },
        { id: 'tr2', name: 'Intensive Hair Botox Care', price: 3999, originalPrice: 5000, duration: '120 mins', description: 'Deep protein reconstruction for chemically damaged hair.', isNew: true },
        { id: 'tr3', name: 'Cysteine Smoothing Treatment', price: 4500, duration: '150 mins', description: 'Formaldehyde-free organic smoothing treatment.', popular: true },
        { id: 'tr4', name: 'Olaplex Bond Repairing Spa', price: 2999, duration: '60 mins', description: 'Patented bond multiplier treatment for colored hair.', popular: false }
      ]
    },
    {
      id: 'facials',
      name: '🌸 Facials & ✨ O3+ Skin Care',
      tagline: 'Dermatological Radiance & Glass Skin Therapy',
      items: [
        { id: 'fc1', name: '24K Royal Gold Foil Glow Facial', price: 2999, originalPrice: 4000, duration: '75 mins', description: 'Real 24K gold foil sheets for anti-aging radiance.', popular: true, offerBadge: 'MOST POPULAR' },
        { id: 'fc2', name: 'O3+ Professional Whitening Facial', price: 2499, duration: '60 mins', description: 'Targeted hyperpigmentation & brightening facial.', popular: true },
        { id: 'fc3', name: 'Hydrafacial Micro-Dermabrasion', price: 3499, duration: '75 mins', description: 'Ultrasonic pore vacuum & hyaluronic acid blast.', isNew: true },
        { id: 'fc4', name: 'Diamond Radiance Skin Polish Facial', price: 2200, duration: '60 mins', description: 'Micro-crystal exfoliation for smooth glass skin.', popular: false }
      ]
    },
    {
      id: 'cleanups-detan',
      name: '🌿 Cleanups, ☀️ De-Tan & 💫 Bleach',
      tagline: 'Organic Pore Scrubbing & Tan Removal',
      items: [
        { id: 'cd1', name: 'Deep Pore Exfoliation Cleanup', price: 999, duration: '35 mins', description: 'Steam cleansing, blackhead extraction & fruit mask.', popular: true },
        { id: 'cd2', name: 'Sara Organic Fruit Cleanup', price: 1200, duration: '40 mins', description: 'Natural bio-active berry extract facial scrub.', popular: false },
        { id: 'cd3', name: 'Raaga Herbal De-Tan Pack (Face & Neck)', price: 800, duration: '30 mins', description: 'Milk & Kojic acid tan removal treatment.', popular: true }
      ],
      isBleachTable: true,
      bleachItems: [
        { name: 'Face & Neck Bleach', oxy: 400, gold: 600, duration: '20 mins' },
        { name: 'Full Arms Bleach', oxy: 800, gold: 1200, duration: '30 mins' },
        { name: 'Full Legs Bleach', oxy: 1000, gold: 1500, duration: '40 mins' },
        { name: 'Full Body Bleach', oxy: 2500, gold: 3500, duration: '75 mins' }
      ]
    },
    {
      id: 'threading-waxing',
      name: '🧵 Threading & 🕯️ Waxing Bar',
      tagline: 'Precision Threading & Silk Hair Removal',
      items: [
        { id: 'tw1', name: 'Eyebrow Precision Shaping', price: 80, duration: '10 mins', description: 'Threading by senior brow specialist.', popular: true },
        { id: 'tw2', name: 'Upper Lip & Chin Threading', price: 100, duration: '10 mins', description: 'Gentle facial hair removal.', popular: false },
        { id: 'tw3', name: 'Full Face Threading', price: 350, duration: '25 mins', description: 'Complete forehead, cheeks, lip & chin threading.', popular: false }
      ],
      isWaxingComparison: true,
      waxingItems: [
        { name: 'Half Arms', sara: 300, choco: 450, reka: 700 },
        { name: 'Full Arms & Underarms', sara: 600, choco: 850, reka: 1200 },
        { name: 'Full Legs', sara: 800, choco: 1100, reka: 1600 },
        { name: 'Full Body Waxing Package', sara: 2200, choco: 2900, reka: 3900 }
      ]
    },
    {
      id: 'nails-makeup',
      name: '💅 Nails, 💄 Make Up & 💆 Massage',
      tagline: 'Gel Extensions, Bridal Glam & Aromatherapy Spa',
      items: [
        { id: 'nm1', name: 'Acrylic Nail Extensions (Full Set)', price: 2200, duration: '90 mins', description: 'Custom tip extensions with gel color polish.', popular: true },
        { id: 'nm2', name: 'Gel Extensions with Chrome Finish', price: 2500, duration: '90 mins', description: 'Mirror chrome shine over gel extension tips.', isNew: true },
        { id: 'nm3', name: '3D Cat-Eye Art & Rhinestones (Per Nail)', price: 150, duration: '10 mins', description: 'Intricate nail art detailing.', popular: false },
        { id: 'nm4', name: 'Party Glam Airbrush Makeup', price: 4500, duration: '90 mins', description: 'Waterproof airbrush makeup & fake lashes.', popular: false },
        { id: 'nm5', name: 'HD Bridal Makeup & Styling', price: 12500, originalPrice: 15000, duration: '180 mins', description: 'Complete bridal transformation package.', popular: true, offerBadge: 'BRIDAL VIP' },
        { id: 'nm6', name: 'Aromatherapy Full Body Massage (60 Min)', price: 2499, duration: '60 mins', description: 'Essential botanical oil relaxation massage.', popular: true }
      ]
    }
  ];

  const categoryChips = [
    { id: 'All', label: '✨ All Services' },
    { id: 'hair-men', label: '✂️ Men Cuts' },
    { id: 'hair-women', label: '✂️ Women Cuts' },
    { id: 'hair-color', label: '🎨 Hair Color' },
    { id: 'treatments', label: '💆 Hair Treatments' },
    { id: 'facials', label: '🌸 Facials & O3+' },
    { id: 'cleanups-detan', label: '☀️ Cleanups & Bleach' },
    { id: 'threading-waxing', label: '🕯️ Waxing & Threading' },
    { id: 'nails-makeup', label: '💄 Makeup & Spa' }
  ];

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Filter Categories & Items based on Search Query
  const filteredCategories = masterMenuCategories.map(cat => {
    if (activeCategory !== 'All' && cat.id !== activeCategory) {
      return null;
    }

    if (!searchQuery.trim()) {
      return cat;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchedItems = cat.items ? cat.items.filter(item => item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q))) : [];
    const matchedBrand = cat.comparisonItems ? cat.comparisonItems.filter(item => item.name.toLowerCase().includes(q)) : [];
    const matchedBleach = cat.bleachItems ? cat.bleachItems.filter(item => item.name.toLowerCase().includes(q)) : [];
    const matchedWax = cat.waxingItems ? cat.waxingItems.filter(item => item.name.toLowerCase().includes(q)) : [];

    const hasMatches = matchedItems.length > 0 || matchedBrand.length > 0 || matchedBleach.length > 0 || matchedWax.length > 0 || cat.name.toLowerCase().includes(q);

    if (!hasMatches) return null;

    return {
      ...cat,
      items: matchedItems.length > 0 ? matchedItems : cat.items,
      comparisonItems: matchedBrand.length > 0 ? matchedBrand : cat.comparisonItems,
      bleachItems: matchedBleach.length > 0 ? matchedBleach : cat.bleachItems,
      waxingItems: matchedWax.length > 0 ? matchedWax : cat.waxingItems
    };
  }).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* PAGE HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-medium uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-rosegold-400" />
          <span>Luxury Salon Concierge Rate Card</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold font-serif text-white tracking-wide">
          Luxury Salon Service Menu
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Explore our complete category-wise beauty, hair styling, skin care, and spa treatments. Premium transparent pricing with certified specialists.
        </p>

        {/* SEARCH BOX */}
        <div className="pt-4 max-w-xl mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-rosegold-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search any service (e.g. Keratin, Hair Cut, 24K Gold Facial, Waxing)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-full bg-dark-850 border border-rosegold-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-rosegold-400 transition-colors shadow-2xl"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-white text-xs bg-dark-800 px-2 py-0.5 rounded-full"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* STICKY CATEGORY FILTER CHIPS BAR */}
      <div className="sticky top-16 z-30 bg-dark-900/90 backdrop-blur-xl py-3 border-y border-rosegold-500/20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar no-scrollbar pb-1">
          {categoryChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveCategory(chip.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeCategory === chip.id
                  ? 'rosegold-gradient-bg text-dark-900 shadow-glow-rosegold scale-105'
                  : 'bg-dark-800 text-gray-300 border border-white/10 hover:border-rosegold-500/40 hover:text-white'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN SERVICE MENU CATEGORIES LIST */}
      <div className="space-y-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 space-y-3 glass-card rounded-3xl border border-white/10">
            <Scissors className="w-10 h-10 mx-auto text-rosegold-400 opacity-40 animate-bounce" />
            <h3 className="text-lg font-serif font-bold text-white">No Services Found</h3>
            <p className="text-xs text-gray-400">No salon treatments match your search term "{searchQuery}".</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
              className="px-5 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md mt-2"
            >
              Reset Search Filter
            </button>
          </div>
        ) : (
          filteredCategories.map((cat: any, catIdx: number) => {
            if (!cat) return null;
            const isCollapsed = expandedCategories[cat.id];

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.08, duration: 0.4 }}
                className="glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 shadow-2xl space-y-6 text-left"
              >
                {/* CATEGORY TITLE RIBBON */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-wide flex items-center space-x-2">
                      <span>{cat.name}</span>
                    </h2>
                    <p className="text-xs text-rosegold-300 font-medium mt-1">{cat.tagline}</p>
                  </div>

                  <button
                    onClick={() => toggleCategoryExpand(cat.id)}
                    className="p-2 rounded-xl bg-dark-800 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title={isCollapsed ? 'Expand Category' : 'Collapse Category'}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* STANDARD SERVICE ITEMS GRID */}
                    {cat.items && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cat.items.map((item: any) => (
                          <div 
                            key={item.id} 
                            className="p-4 rounded-2xl bg-dark-800/90 border border-white/10 hover:border-rosegold-500/50 transition-all flex flex-col justify-between space-y-3 group shadow-md"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-serif font-bold text-white text-base group-hover:text-rosegold-300 transition-colors">
                                  {item.name}
                                </h3>

                                <div className="flex items-center space-x-1 shrink-0">
                                  {item.popular && (
                                    <span className="bg-rosegold-500 text-dark-900 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Popular
                                    </span>
                                  )}
                                  {item.isNew && (
                                    <span className="bg-purple-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      New
                                    </span>
                                  )}
                                  {item.offerBadge && (
                                    <span className="bg-amber-500 text-dark-900 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      {item.offerBadge}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                              <div className="flex items-baseline space-x-2">
                                <span className="text-rosegold-400 font-serif font-extrabold text-lg">
                                  ₹{item.price.toLocaleString('en-IN')}
                                </span>
                                {item.originalPrice && (
                                  <span className="text-gray-500 text-xs line-through">
                                    ₹{item.originalPrice}
                                  </span>
                                )}
                                {item.duration && (
                                  <span className="text-[10px] text-gray-400 font-mono flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-gray-500" />
                                    <span>{item.duration}</span>
                                  </span>
                                )}
                              </div>

                              <Link
                                href={`/book?service=${encodeURIComponent(item.name)}`}
                                className="px-3.5 py-1.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md flex items-center space-x-1 cursor-pointer hover:scale-105 transition-all"
                              >
                                <span>Book Now</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* BRAND COMPARISON TABLE (HAIR COLOR) */}
                    {cat.isBrandComparison && cat.comparisonItems && (
                      <div className="overflow-x-auto rounded-2xl border border-white/10">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                            <tr>
                              <th className="p-3.5">Hair Color Service</th>
                              <th className="p-3.5">Duration</th>
                              <th className="p-3.5 text-right">{cat.brand1}</th>
                              <th className="p-3.5 text-right">{cat.brand2}</th>
                              <th className="p-3.5 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {cat.comparisonItems.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="p-3.5 font-bold text-white font-serif text-sm">{item.name}</td>
                                <td className="p-3.5 text-gray-400 font-mono">{item.duration}</td>
                                <td className="p-3.5 text-right font-bold text-rosegold-400 font-mono text-sm">₹{item.price1}</td>
                                <td className="p-3.5 text-right font-bold text-amber-300 font-mono text-sm">₹{item.price2}</td>
                                <td className="p-3.5 text-center">
                                  <Link
                                    href={`/book?service=${encodeURIComponent(item.name)}`}
                                    className="px-3 py-1 rounded-full bg-rosegold-500/20 text-rosegold-300 font-bold text-[11px] hover:bg-rosegold-500/30 transition-all inline-block"
                                  >
                                    Book →
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* BLEACH OXY VS GOLD COMPARISON TABLE */}
                    {cat.isBleachTable && cat.bleachItems && (
                      <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">💫 Bleach Treatments Rate Card</h3>
                        <div className="overflow-x-auto rounded-2xl border border-white/10">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                              <tr>
                                <th className="p-3.5">Body Area</th>
                                <th className="p-3.5">Duration</th>
                                <th className="p-3.5 text-right">Oxy Bleach</th>
                                <th className="p-3.5 text-right">24K Gold Bleach</th>
                                <th className="p-3.5 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {cat.bleachItems.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                  <td className="p-3.5 font-bold text-white">{item.name}</td>
                                  <td className="p-3.5 text-gray-400 font-mono">{item.duration}</td>
                                  <td className="p-3.5 text-right font-bold text-gray-200 font-mono">₹{item.oxy}</td>
                                  <td className="p-3.5 text-right font-bold text-rosegold-400 font-mono">₹{item.gold}</td>
                                  <td className="p-3.5 text-center">
                                    <Link
                                      href={`/book?service=${encodeURIComponent(item.name + ' Bleach')}`}
                                      className="px-3 py-1 rounded-full bg-rosegold-500/20 text-rosegold-300 font-bold text-[11px] hover:bg-rosegold-500/30 transition-all inline-block"
                                    >
                                      Book →
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* WAXING WAX COMPARISON COLUMNS */}
                    {cat.isWaxingComparison && cat.waxingItems && (
                      <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">🕯️ Waxing Brand Rate Comparison</h3>
                        <div className="overflow-x-auto rounded-2xl border border-white/10">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-dark-800 text-rosegold-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/10">
                              <tr>
                                <th className="p-3.5">Body Area</th>
                                <th className="p-3.5 text-right">Sara Organic Wax</th>
                                <th className="p-3.5 text-right">Choco Liposoluble Wax</th>
                                <th className="p-3.5 text-right">Reka Brazilian Wax</th>
                                <th className="p-3.5 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {cat.waxingItems.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                  <td className="p-3.5 font-bold text-white">{item.name}</td>
                                  <td className="p-3.5 text-right font-mono text-gray-300">₹{item.sara}</td>
                                  <td className="p-3.5 text-right font-mono text-rosegold-300 font-bold">₹{item.choco}</td>
                                  <td className="p-3.5 text-right font-mono text-rosegold-400 font-extrabold">₹{item.reka}</td>
                                  <td className="p-3.5 text-center">
                                    <Link
                                      href={`/book?service=${encodeURIComponent(item.name + ' Waxing')}`}
                                      className="px-3 py-1 rounded-full bg-rosegold-500/20 text-rosegold-300 font-bold text-[11px] hover:bg-rosegold-500/30 transition-all inline-block"
                                    >
                                      Book →
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* BOTTOM OFFER BANNER */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="glass-card p-8 sm:p-10 rounded-3xl border border-rosegold-500/40 rosegold-gradient-bg text-dark-900 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-glow-rosegold"
      >
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-dark-900 text-rosegold-300 text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-rosegold-400" />
            <span>SPECIAL NEW CUSTOMER PROMO</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-dark-900 leading-tight">
            ✨ 25% OFF FOR ALL NEW CUSTOMERS
          </h3>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Book your appointment today and experience Jubilee Hills' premier luxury salon & botanical spa.
          </p>
        </div>

        <Link
          href="/book"
          className="px-8 py-4 rounded-full bg-dark-900 text-white font-serif font-bold text-sm shadow-2xl hover:scale-105 transition-all cursor-pointer shrink-0"
        >
          Book Appointment Now →
        </Link>
      </motion.div>

    </div>
  );
}
