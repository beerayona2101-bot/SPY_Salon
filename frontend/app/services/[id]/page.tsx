'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import CinematicImage from '@/components/common/CinematicImage';
import { 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Scissors, 
  ArrowRight,
  User,
  Heart,
  Award
} from 'lucide-react';
import { servicesData as defaultStaticServices } from '@/data/servicesData';
import { API_BASE_URL } from '@/lib/api';

// Smart Step-by-Step Procedure Generator based on title and category
function getProcedureStepsForService(srvTitle: string, category: string, customSteps?: any[]) {
  if (customSteps && Array.isArray(customSteps) && customSteps.length > 0) {
    return customSteps;
  }

  const titleLower = (srvTitle || '').toLowerCase();
  const catLower = (category || '').toLowerCase();

  // 1. Hair Cutting & Styling
  if (titleLower.includes('cut') || titleLower.includes('trim') || (catLower === 'hair' && (titleLower.includes('style') || titleLower.includes('keratin')))) {
    return [
      { num: '01', title: 'Face Shape Consultation & Hair Cut Mapping', desc: 'In-depth assessment of natural hair growth, scalp condition, and facial structure to select custom haircut sectioning.' },
      { num: '02', title: 'Purifying Botanical Shampoo & Scalp Massage', desc: 'Sulfate-free scalp wash with organic botanical cleansers and gentle scalp pressure-point relaxation massage.' },
      { num: '03', title: 'Precision Scissors Sculpting & Layering', desc: 'Precision wet/dry sectioning, weight-balance trimming, and texturizing layers by master hair stylists.' },
      { num: '04', title: 'Executive Blow-Dry & Gloss Seal Finish', desc: 'Heat protection application, volume styling, mirror inspection finish, and sheen serum lock.' }
    ];
  }

  // 2. Hair Coloring & Highlights
  if (titleLower.includes('color') || titleLower.includes('balayage') || titleLower.includes('highlight') || titleLower.includes('dye')) {
    return [
      { num: '01', title: 'Shade Tone Consultation & Sensitivity Check', desc: 'Custom shade swatch selection and allergy sensitivity check for 100% ammonia-free pigments.' },
      { num: '02', title: 'Foil Sectioning & Precision Color Infusion', desc: 'Meticulous root-to-tip foil sectioning and organic color pigment application by senior color specialists.' },
      { num: '03', title: 'Post-Color Acidic pH Seal & Gloss Rinse', desc: 'Acidic pH-balancing rinse to lock in color vibrancy, prevent fading, and boost soft texture.' },
      { num: '04', title: 'Keratin Blowout & Sheen Polish Finish', desc: 'Deep conditioning treatment blast, smooth blowout, and light-reflecting shine spray.' }
    ];
  }

  // 3. Facial & Skin Therapy
  if (titleLower.includes('facial') || titleLower.includes('glow') || catLower === 'skin') {
    return [
      { num: '01', title: 'Dermatological Skin Analysis & Hydration Mapping', desc: 'Hydration and sebum evaluation to select active 24K gold or botanical collagen serums.' },
      { num: '02', title: 'Ultrasonic Micro-Exfoliation & Steam Cleansing', desc: 'Gentle removal of dead skin cells and blackheads using ultrasonic skin scrubber.' },
      { num: '03', title: 'Nutrient Radiance Mask & Facial Massage', desc: 'Deep penetration of gold or mineral collagen mask with soothing face, neck, and shoulder massage.' },
      { num: '04', title: 'SPF 50 UV Defense & Moisture Lock Seal', desc: 'Application of hyaluronic acid barrier and broad-spectrum sunscreen for radiant glass skin.' }
    ];
  }

  // 4. Spa & Body Therapy
  if (titleLower.includes('spa') || titleLower.includes('massage') || titleLower.includes('aroma') || catLower === 'spa') {
    return [
      { num: '01', title: 'Aromatherapy Essential Oil Selection', desc: 'Personalized essential oil blending (Lavender, Eucalyptus, or Sandalwood) based on stress points.' },
      { num: '02', title: 'Warm Thermal Compress & Spine Alignment', desc: 'Warm herbal towel compression to relax tight muscle knots and prepare for deep tissue therapy.' },
      { num: '03', title: 'Full Body Rhythmic Pressure Point Therapy', desc: 'Professional Swedish or deep-tissue pressure strokes targeting back, shoulder, and leg tension.' },
      { num: '04', title: 'Herbal Tea Refreshment & Mineral Thermal Wipe', desc: 'Post-spa herbal tea refreshment and soothing thermal towel wipe down.' }
    ];
  }

  // 5. Nails & Pedicure
  if (titleLower.includes('nail') || titleLower.includes('manicure') || titleLower.includes('pedicure') || catLower === 'nails') {
    return [
      { num: '01', title: 'Nail Shaping, Cuticle Filing & Surface Buffing', desc: 'Precision filing, cuticle softening, and surface buffing using single-use hygienic tools.' },
      { num: '02', title: 'Exfoliating Sea Salt Scrub & Hand/Foot Massage', desc: 'Deep exfoliation scrub followed by a hydrating palm and sole moisture massage.' },
      { num: '03', title: 'Gel Couture Pigment Application & LED Curing', desc: 'Dual-coat high shine gel polish curing under UV LED lamp for chip-free finish.' },
      { num: '04', title: 'Cuticle Vitamin E Oil Seal & High-Gloss Finish', desc: 'Nourishing vitamin oil massage around nail beds for long-lasting hydration.' }
    ];
  }

  // 6. Grooming & Beard Sculpting
  if (titleLower.includes('beard') || titleLower.includes('shave') || titleLower.includes('groom') || catLower === 'grooming') {
    return [
      { num: '01', title: 'Beard Grain Consultation & Line Mapping', desc: 'Assessment of growth density, skin sensitivity, and jawline contouring.' },
      { num: '02', title: 'Hot Charcoal Steam & Softening Oil Massage', desc: 'Pore opening charcoal towel steam and pre-shave oil massage for razor glide.' },
      { num: '03', title: 'Straight-Razor Line Sculpting & Precision Trim', desc: 'Straight-edge razor line sculpting and length trimming by master barbers.' },
      { num: '04', title: 'Cooling Antiseptic Splash & Beard Balm Polish', desc: 'Post-shave soothing lotion and organic beard balm polish.' }
    ];
  }

  // Default Treatment Steps
  return [
    { num: '01', title: 'Specialist Consultation & Texture Analysis', desc: 'In-depth assessment by certified SPY Salon specialists to tailor treatment formulations.' },
    { num: '02', title: 'Deep Cleansing & Botanical Exfoliation', desc: 'Removal of micro-impurities using organic, hypoallergenic serums infused with botanical extracts.' },
    { num: '03', title: 'Therapeutic Hydro-Mask & Steam Treatment', desc: 'Deep penetration of active botanical nutrients combined with gentle stress relief massage.' },
    { num: '04', title: 'Post-Care Moisture Seal & Executive Finish', desc: 'Final application of protection shield, nutrient lock, and professional executive finish.' }
  ];
}

function getBenefitsForService(srvTitle: string, category: string, customBenefits?: string[]) {
  if (customBenefits && Array.isArray(customBenefits) && customBenefits.length > 0) {
    return customBenefits;
  }

  const titleLower = (srvTitle || '').toLowerCase();
  const catLower = (category || '').toLowerCase();

  if (titleLower.includes('cut') || titleLower.includes('trim')) {
    return [
      'Tailored to Facial Structure & Head Shape',
      'Removes Split Ends & Encourages Healthy Growth',
      'Adds Natural Volume & Movement to Hair Layers',
      'Includes Professional Executive Blow-Dry & Style'
    ];
  }

  if (titleLower.includes('color') || titleLower.includes('balayage')) {
    return [
      '100% Ammonia-Free & Cuticle-Safe Pigments',
      'Rich, Multi-Dimensional Tone & Radiant Shine',
      'pH-Balanced Gloss Seal Prevents Fading',
      'Nourishing Keratin Infusion Protects Hair Strands'
    ];
  }

  if (titleLower.includes('facial') || titleLower.includes('glow') || catLower === 'skin') {
    return [
      'Deep Pore Cleansing & Blackhead Extraction',
      'Promotes Cellular Collagen Renewal & Firmness',
      'Instant Glass-Skin Radiance & Hydration',
      'SPF 50 Protection Against Environmental Damage'
    ];
  }

  return [
    'Deep Cellular Hydration & Nutrient Renewal',
    '100% Organic, Dermatologically Tested Serums',
    'Stress Relief via Pressure-Point Aromatherapy',
    'Long-Lasting Radiance & Luxury Studio Finish'
  ];
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`${API_BASE_URL}/services`)
      .then(res => res.json())
      .then(data => {
        const targetId = String(id).toLowerCase().trim();
        const normalizeSlug = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        if (data.data && data.data.length > 0) {
          const match = data.data.find((s: any) => 
            s._id === id || 
            String(s.id) === targetId || 
            (s.slug && String(s.slug).toLowerCase() === targetId) ||
            normalizeSlug(s.name) === normalizeSlug(id) ||
            normalizeSlug(s.title) === normalizeSlug(id)
          );
          if (match) {
            setService({
              id: match._id || match.id,
              slug: match.slug || normalizeSlug(match.name),
              title: match.name || match.title,
              category: match.category,
              price: match.price,
              discountPrice: match.discountPrice || match.price,
              duration: `${match.durationMinutes || 60} mins`,
              durationMinutes: match.durationMinutes || 60,
              rating: match.rating || 4.9,
              desc: match.description || match.desc || 'Luxury botanical treatment provided by SPY Salon certified specialists.',
              image: match.image || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80',
              popular: match.isPopular !== undefined ? match.isPopular : true,
              customSteps: match.steps || match.processSteps,
              customBenefits: match.benefits
            });
            return;
          }
        }
        // Fallback to static match
        const staticMatch = defaultStaticServices.find(s => 
          String(s.id) === targetId || 
          s.slug === targetId || 
          normalizeSlug(s.title) === normalizeSlug(id)
        );
        if (staticMatch) setService(staticMatch);
      })
      .catch(() => {
        const targetId = String(id).toLowerCase().trim();
        const normalizeSlug = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const staticMatch = defaultStaticServices.find(s => 
          String(s.id) === targetId || 
          s.slug === targetId || 
          normalizeSlug(s.title) === normalizeSlug(id)
        );
        if (staticMatch) setService(staticMatch);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-rosegold-400 font-serif animate-pulse">
        Loading Treatment Details & Procedure...
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center space-y-4 text-center px-4">
        <h2 className="text-2xl font-serif text-white font-bold">Treatment Not Found</h2>
        <Link href="/services" className="px-5 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs">
          Return to Services Menu
        </Link>
      </div>
    );
  }

  const treatmentSteps = getProcedureStepsForService(service.title, service.category, service.customSteps);
  const keyBenefits = getBenefitsForService(service.title, service.category, service.customBenefits);

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 p-4 sm:p-6 lg:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn text-left">
        
        {/* Back Link & Category */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <button 
            onClick={() => router.push('/services')} 
            className="flex items-center space-x-2 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-rosegold-400" />
            <span>Back to Services & Treatments Menu</span>
          </button>
          
          <span className="text-xs font-bold text-rosegold-400 bg-rosegold-500/15 border border-rosegold-500/30 px-3.5 py-1 rounded-full flex items-center space-x-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{service.category} Therapy</span>
          </span>
        </motion.div>

        {/* Hero Banner Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card rounded-3xl overflow-hidden border border-rosegold-500/30 shadow-glow-rosegold hover-lift"
        >
          <div className="relative h-64 sm:h-80 w-full bg-dark-800">
            <CinematicImage 
              src={service.image} 
              alt={service.title} 
              className="w-full h-full object-cover"
              duration={16}
              priority={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent z-10" />

            {service.popular && (
              <span className="absolute top-4 left-4 bg-rosegold-500 text-dark-900 font-bold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider shadow-lg animate-pulse z-10">
                Popular Signature Treatment
              </span>
            )}

            <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
              <div>
                <span className="text-xs text-rosegold-400 font-bold uppercase tracking-widest">{service.category} COLLECTION</span>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">{service.title}</h1>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="bg-dark-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center shadow-md">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Duration</span>
                  <span className="text-white font-bold text-sm flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                    <span>{service.duration}</span>
                  </span>
                </div>

                <div className="bg-dark-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center shadow-md">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Rating</span>
                  <span className="text-amber-400 font-bold text-sm flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{service.rating}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing & Quick Booking Ribbon */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6 rounded-3xl border-2 border-rosegold-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-dark-800/90 shadow-glow-rosegold"
        >
          <div className="text-center sm:text-left">
            <span className="text-xs text-gray-400 uppercase font-semibold block">Luxury Treatment Price</span>
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-serif font-bold text-rosegold-400">₹{service.price}</span>
              {service.discountPrice && service.discountPrice < service.price && (
                <span className="text-sm text-gray-500 line-through">₹{service.discountPrice}</span>
              )}
              <span className="text-[10px] font-bold text-green-400 bg-green-500/15 border border-green-500/30 px-2.5 py-0.5 rounded-full">
                Instant Slot Available Today
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push(`/book?service=${encodeURIComponent(service.title)}`)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl rosegold-gradient-bg text-dark-900 font-bold text-sm shadow-glow-rosegold flex items-center justify-center space-x-2 cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
            <Calendar className="w-4 h-4" />
            <span>Book This Treatment Now</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </motion.button>
        </motion.div>

        {/* Full Overview & Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2 glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 space-y-4"
          >
            <h2 className="text-xl font-serif font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-rosegold-400" />
              <span>Treatment Overview & Botanical Science</span>
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">{service.desc}</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every SPY Salon therapy begins with a customized consultation to identify specific stress triggers, skin sensitivity, or hair cuticle damage. Our specialists exclusively utilize 100% organic, dermatologically tested formulations tailored specifically to {service.title}.
            </p>
          </motion.div>

          {/* Key Benefits specific to service/category */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="glass-card p-6 rounded-3xl border border-rosegold-500/30 space-y-4"
          >
            <h3 className="text-base font-serif font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-rosegold-400" />
              <span>Key Benefits</span>
            </h3>
            <div className="space-y-2.5 text-xs text-gray-200">
              {keyBenefits.map((b: string, i: number) => (
                <div key={i} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tailored Step-by-Step Procedure Protocol */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 space-y-6"
        >
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs text-rosegold-400 font-bold uppercase tracking-wider">STUDIO PROTOCOL</span>
            <h2 className="text-2xl font-serif font-bold text-white mt-0.5">{service.title} — Step-by-Step Treatment Procedure</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {treatmentSteps.map((step: any, i: number) => (
              <motion.div 
                key={step.num}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-dark-800/80 border border-white/5 space-y-2 text-xs hover:border-rosegold-500/30 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {step.num}
                  </span>
                  <h4 className="text-white font-serif font-bold text-sm">{step.title}</h4>
                </div>
                <p className="text-gray-300 leading-relaxed pl-9">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Booking Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-card p-6 sm:p-8 rounded-3xl border border-rosegold-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
        >
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-serif font-bold text-white">Ready for a Luxury Beauty Session?</h3>
            <p className="text-xs text-gray-400">Select your preferred date, time slot, and specialist on our booking desk.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push(`/book?service=${encodeURIComponent(service.title)}`)}
            className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md shrink-0 cursor-pointer"
          >
            Proceed to Slot Booking →
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}
