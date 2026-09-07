'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Maximize2 } from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';
import { GallerySkeleton } from '@/components/common/Skeleton';

import { API_BASE_URL, formatImageUrl } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

const DEFAULT_IMAGES = [
  { id: '1', title: 'Balayage Blonde Transformation', category: 'Hair', url: '' },
  { id: '2', title: '24K Gold Ritual Treatment', category: 'Facials', url: '' },
  { id: '3', title: 'Royal HD Bridal Glam', category: 'Bridal', url: '' },
  { id: '4', title: 'Jubilee Hills VIP Suite', category: 'Interiors', url: '' },
  { id: '5', title: 'Keratin Gloss Finish', category: 'Hair', url: '' },
  { id: '6', title: 'Aroma Hydro Therapy', category: 'Facials', url: '' }
];

function GalleryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket } = useSocket();

  const activeFilterFromUrl = searchParams?.get('cat') || searchParams?.get('category');
  const activeFilter = activeFilterFromUrl || 'All';
  const imgFromUrl = searchParams?.get('img');

  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [images, setImages] = useState<any[]>(DEFAULT_IMAGES);

  const sanitizeItems = (items: any[]) => {
    if (!Array.isArray(items)) return [];
    return items.map((item: any) => ({
      ...item,
      url: (item.url && item.url.includes('unsplash.com')) ? '' : formatImageUrl(item.url || '')
    }));
  };

  useEffect(() => {
    const loadGallery = async () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('spy_landing_settings');
        if (stored) {
          try {
            const p = JSON.parse(stored);
            if (Array.isArray(p.galleryItems)) {
              setImages(sanitizeItems(p.galleryItems));
            }
          } catch (e) {}
        }
      }

      try {
        const res = await fetch(`${API_BASE_URL}/public/landing-settings`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && Array.isArray(json.data.galleryItems)) {
            const cleanItems = sanitizeItems(json.data.galleryItems);
            setImages(cleanItems);
            if (typeof window !== 'undefined') {
              json.data.galleryItems = cleanItems;
              localStorage.setItem('spy_landing_settings', JSON.stringify(json.data));
            }
          }
        }
      } catch (e) {}
    };

    loadGallery();
    window.addEventListener('storage', loadGallery);

    if (socket) {
      socket.on('landing_settings_updated', (p: any) => {
        if (p && Array.isArray(p.galleryItems)) {
          const cleanItems = sanitizeItems(p.galleryItems);
          setImages(cleanItems);
          if (typeof window !== 'undefined') {
            p.galleryItems = cleanItems;
            localStorage.setItem('spy_landing_settings', JSON.stringify(p));
          }
        }
      });
    }

    return () => {
      window.removeEventListener('storage', loadGallery);
      if (socket) {
        socket.off('landing_settings_updated');
      }
    };
  }, [socket]);

  useEffect(() => {
    if (imgFromUrl && images.length > 0) {
      const match = images.find(i => String(i.id) === String(imgFromUrl));
      if (match) setSelectedImage(match);
    }
  }, [imgFromUrl, images]);

  // Extract unique categories
  const categoriesSet = new Set(['All', 'Hair', 'Facials', 'Bridal', 'Interiors']);
  images.forEach(img => {
    if (img.category) categoriesSet.add(img.category);
  });
  const categories = Array.from(categoriesSet);

  const handleCategoryChange = (cat: string) => {
    if (cat === 'All') {
      router.push('/gallery');
    } else {
      router.push(`/gallery?cat=${encodeURIComponent(cat)}`);
    }
  };

  const filtered = activeFilter === 'All' ? images : images.filter(img => img.category === activeFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel border border-rosegold-500/30 text-rosegold-400 text-xs font-medium uppercase">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Lookbook & Transformations</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">SPY Salon Gallery</h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">Explore client transformations, luxury interiors, and artistry from our senior stylists.</p>
      </motion.div>

      <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeFilter === cat 
                ? 'rosegold-gradient-bg text-dark-900 shadow-md font-bold' 
                : 'bg-dark-800 text-gray-300 border border-white/10 hover:text-white'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-rosegold-500/20 text-center space-y-3 max-w-lg mx-auto">
          <Sparkles className="w-8 h-8 text-rosegold-400 mx-auto opacity-60" />
          <h3 className="text-white font-serif font-bold text-lg">No Showcase Photos Published</h3>
          <p className="text-xs text-gray-400">Photos added in the Admin Dashboard (Footer Page Settings › Lookbook & Gallery) will appear here live.</p>
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id || item.title || idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedImage(item)}
                className="glass-card rounded-2xl overflow-hidden group cursor-pointer border border-rosegold-500/20 hover:border-rosegold-500/60 shadow-lg relative transform-gpu"
              >
                <div className="relative h-64 overflow-hidden bg-dark-850">
                  {item.url ? (
                    <img 
                      src={formatImageUrl(item.url)} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-2 border border-rosegold-500/20">
                      <img src="/logo-transparent.png?v=3" alt="SPY Salon Logo" className="w-16 h-16 object-contain opacity-80 animate-pulse" />
                      <span className="text-[11px] text-rosegold-300 font-serif font-bold">{item.title || 'SPY Salon Showcase'}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute top-3 right-3 p-2 rounded-full bg-dark-900/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity text-rosegold-400">
                    <Maximize2 className="w-4 h-4" />
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-rosegold-400 font-bold text-[11px] uppercase tracking-wider block">{item.category}</span>
                    <h3 className="text-white font-serif font-bold text-lg">{item.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-dark-800 rounded-3xl overflow-hidden border border-rosegold-500/40 shadow-2xl"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-dark-900/80 text-gray-300 hover:text-white border border-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative max-h-[75vh] w-full overflow-hidden">
                <img
                  src={formatImageUrl(selectedImage.url)}
                  alt={selectedImage.title}
                  className="w-full h-full object-contain max-h-[75vh] mx-auto"
                />
              </div>

              <div className="p-6 bg-dark-900 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-rosegold-400 font-bold text-xs uppercase tracking-wider block">{selectedImage.category} Ritual</span>
                  <h3 className="text-white font-serif font-bold text-xl">{selectedImage.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="px-5 py-2.5 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md cursor-pointer"
                >
                  Close Showcase
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<GallerySkeleton />}>
      <GalleryContent />
    </Suspense>
  );
}


