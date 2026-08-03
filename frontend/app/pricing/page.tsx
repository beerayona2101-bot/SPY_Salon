'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Menu, Layers, Scissors, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { SALON_CATALOGUE, GenderSection, CategoryCard, ServiceItem } from '@/lib/servicesData';
import CategorySidebar, { GenderCategoryGroup } from '@/components/pricing/CategorySidebar';
import ServiceSidebar from '@/components/pricing/ServiceSidebar';
import SearchBar from '@/components/pricing/SearchBar';
import useDebounce from '@/hooks/useDebounce';
import { API_BASE_URL } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

const ServiceDetails = dynamic(() => import('@/components/pricing/ServiceDetails'), {
  loading: () => (
    <div className="p-12 text-center glass-card rounded-3xl border border-white/10 space-y-4 animate-pulse">
      <Sparkles className="w-8 h-8 mx-auto text-rosegold-400 animate-spin" />
      <p className="text-xs text-gray-400">Loading service details...</p>
    </div>
  )
});


// Wrapper with Suspense for Next.js query parameter hooks
export default function PricingPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-rosegold-400 font-serif text-lg">
        <Sparkles className="w-6 h-6 animate-spin mr-2" />
        Loading SPY Salon Catalogue...
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}

function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract query params from URL (e.g. /pricing?category=men&subcategory=haircuts&service=m-hc-1)
  const initialCategory = (searchParams?.get('category') as 'all' | 'men' | 'women' | 'kids') || 'all';
  const initialSubcategory = searchParams?.get('subcategory') || '';
  const initialServiceId = searchParams?.get('service') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  const [activeGender, setActiveGender] = useState<'all' | 'men' | 'women' | 'kids'>(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState<string>(initialSubcategory);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId);

  // Mobile drawer states
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  // Synchronize state with URL query parameters
  const updateQueryParams = (gender: string, subcategory: string, serviceId: string) => {
    const params = new URLSearchParams();
    if (gender && gender !== 'all') params.set('category', gender);
    if (subcategory) params.set('subcategory', subcategory);
    if (serviceId) params.set('service', serviceId);

    const queryString = params.toString();
    const newPath = queryString ? `/pricing?${queryString}` : '/pricing';
    router.push(newPath, { scroll: false });
  };

  // 1. Build Subcategory Structure for CategorySidebar
  const genderCategoryGroups: GenderCategoryGroup[] = useMemo(() => {
    return SALON_CATALOGUE.map((section: GenderSection) => {
      const subcategoryMap = new Map<string, { name: string; slug: string; count: number }>();

      section.categories.forEach((cat: CategoryCard) => {
        const slug = cat.slug || cat.id;
        subcategoryMap.set(slug, {
          name: cat.name,
          slug,
          count: cat.items.length
        });
      });

      return {
        id: section.id,
        title: section.title,
        icon: section.icon,
        subcategories: Array.from(subcategoryMap.values())
      };
    });
  }, []);

  const [liveDbServices, setLiveDbServices] = useState<any[]>([]);
  const { socket } = useSocket();

  const fetchLiveServices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/services`);
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setLiveDbServices(data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveServices();

    if (!socket) return;

    const handleServiceChange = () => {
      fetchLiveServices();
    };

    socket.on('service:created', handleServiceChange);
    socket.on('service:updated', handleServiceChange);
    socket.on('service:deleted', handleServiceChange);

    const intervalId = setInterval(fetchLiveServices, 4000);
    return () => {
      clearInterval(intervalId);
      socket.off('service:created', handleServiceChange);
      socket.off('service:updated', handleServiceChange);
      socket.off('service:deleted', handleServiceChange);
    };
  }, [socket]);

  // 2. Flatten all services & merge dynamic Admin services
  const allServices: ServiceItem[] = useMemo(() => {
    const list: ServiceItem[] = [];
    SALON_CATALOGUE.forEach((section) => {
      section.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          list.push({
            ...item,
            gender: section.id,
            subCategory: cat.slug || cat.id,
            category: cat.name,
            image: item.image || cat.image
          });
        });
      });
    });

    if (liveDbServices && liveDbServices.length > 0) {
      liveDbServices.forEach((dbSrv: any) => {
        const existingIdx = list.findIndex(s => s.id === dbSrv._id || s.name.toLowerCase() === dbSrv.name.toLowerCase());
        const mappedItem: ServiceItem = {
          id: dbSrv._id || dbSrv.id,
          name: dbSrv.name,
          category: dbSrv.category || 'Hair Care',
          subCategory: dbSrv.subCategory || dbSrv.category?.toLowerCase() || 'haircare',
          gender: dbSrv.gender || 'all',
          price: dbSrv.price,
          originalPrice: dbSrv.discountPrice && dbSrv.discountPrice < dbSrv.price ? dbSrv.price : undefined,
          duration: `${dbSrv.durationMinutes || 60} Min`,
          description: dbSrv.description || 'Luxury SPY Salon service treatment.',
          popular: dbSrv.isPopular,
          image: dbSrv.image
        };

        if (existingIdx !== -1) {
          list[existingIdx] = { ...list[existingIdx], ...mappedItem };
        } else {
          list.unshift(mappedItem);
        }
      });
    }

    return list;
  }, [liveDbServices]);

  // 3. Filter services based on active Gender, Subcategory, and Debounced Search query
  const filteredServices: ServiceItem[] = useMemo(() => {
    return allServices.filter((srv) => {
      // Gender filter
      if (activeGender !== 'all' && srv.gender !== activeGender) {
        return false;
      }

      // Subcategory filter
      if (activeSubcategory && srv.subCategory?.toLowerCase() !== activeSubcategory.toLowerCase()) {
        return false;
      }

      // Search filter using debounced input
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase().trim();
        const matchName = srv.name.toLowerCase().includes(q);
        const matchCategory = srv.category.toLowerCase().includes(q);
        const matchDesc = srv.description.toLowerCase().includes(q);
        const matchPrice = String(srv.price).includes(q);
        return matchName || matchCategory || matchDesc || matchPrice;
      }

      return true;
    });
  }, [allServices, activeGender, activeSubcategory, debouncedSearchQuery]);

  // 4. Determine currently selected Service (defaults to first filtered service if available)
  const selectedService: ServiceItem | undefined = useMemo(() => {
    if (selectedServiceId) {
      const match = allServices.find((s) => s.id === selectedServiceId || s.name.toLowerCase() === selectedServiceId.toLowerCase());
      if (match) return match;
    }
    return filteredServices[0] || allServices[0];
  }, [selectedServiceId, filteredServices, allServices]);

  // Set default selected service ID if none is set
  useEffect(() => {
    if (!selectedServiceId && filteredServices.length > 0) {
      setSelectedServiceId(filteredServices[0].id);
    }
  }, [filteredServices, selectedServiceId]);

  // Handle Category / Subcategory Selection
  const handleSelectCategory = (gender: 'all' | 'men' | 'women' | 'kids', subcategory?: string) => {
    setActiveGender(gender);
    setActiveSubcategory(subcategory || '');
    setMobileCategoryOpen(false);

    // Find first matching service for new category
    const matching = allServices.filter((s) => {
      if (gender !== 'all' && s.gender !== gender) return false;
      if (subcategory && s.subCategory?.toLowerCase() !== subcategory.toLowerCase()) return false;
      return true;
    });

    const newServiceId = matching[0]?.id || '';
    setSelectedServiceId(newServiceId);
    updateQueryParams(gender, subcategory || '', newServiceId);
  };

  // Handle Service Selection
  const handleSelectService = (srv: ServiceItem) => {
    setSelectedServiceId(srv.id);
    setMobileServicesOpen(false);
    updateQueryParams(activeGender, activeSubcategory, srv.id);
  };

  // Title for Middle Sidebar Header
  const activeCategoryTitle = useMemo(() => {
    if (activeSubcategory) {
      return `${activeGender.toUpperCase()} • ${activeSubcategory.toUpperCase()}`;
    }
    if (activeGender !== 'all') {
      return `${activeGender.toUpperCase()} SALON CATALOGUE`;
    }
    return 'ALL SALON CATALOGUE';
  }, [activeGender, activeSubcategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 text-left">
      
      {/* 1. HERO HEADER BANNER */}
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-panel border border-rosegold-500/40 text-rosegold-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 animate-pulse text-rosegold-400" />
          <span>Luxury Salon Service Catalogue</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold font-serif text-white tracking-wide leading-tight">
          Select Your Salon Experience
        </h1>

        <p className="text-gray-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Browse our 3-column interactive catalogue for Men, Women, and Kids. Filter treatments, packages, and transparent pricing with instant booking.
        </p>

        {/* SEARCH BAR */}
        <div className="pt-2">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (q.trim()) {
                setActiveGender('all');
                setActiveSubcategory('');
              }
            }}
            totalResultsCount={filteredServices.length}
          />
        </div>
      </motion.div>

      {/* 2. MOBILE / TABLET TOGGLE BAR FOR DRAWERS */}
      <div className="flex lg:hidden items-center justify-between gap-3 p-3 rounded-2xl bg-dark-850 border border-white/10 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-dark-800 border border-rosegold-500/40 text-rosegold-300 flex items-center justify-center space-x-2"
        >
          <Menu className="w-4 h-4" />
          <span>Categories ({activeGender})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-dark-800 border border-white/10 text-white flex items-center justify-center space-x-2"
        >
          <Layers className="w-4 h-4 text-rosegold-400" />
          <span>Services ({filteredServices.length})</span>
        </button>
      </div>

      {/* MOBILE CATEGORY DRAWER */}
      {mobileCategoryOpen && (
        <div className="lg:hidden p-4 rounded-3xl bg-dark-900 border border-rosegold-500/40 animate-fadeIn">
          <CategorySidebar
            activeGender={activeGender}
            activeSubcategory={activeSubcategory}
            onSelectCategory={handleSelectCategory}
            genderGroups={genderCategoryGroups}
            totalServiceCount={allServices.length}
          />
        </div>
      )}

      {/* MOBILE SERVICES DRAWER */}
      {mobileServicesOpen && (
        <div className="lg:hidden p-4 rounded-3xl bg-dark-900 border border-rosegold-500/40 animate-fadeIn">
          <ServiceSidebar
            services={filteredServices}
            selectedServiceId={selectedService?.id || ''}
            onSelectService={handleSelectService}
            activeCategoryName={activeCategoryTitle}
          />
        </div>
      )}

      {/* 3. MAIN 3-COLUMN LAYOUT CONTAINER */}
      <div className="flex flex-col lg:flex-row items-start gap-6 relative">

        {/* LEFT SIDEBAR: CATEGORIES (280px Sticky) */}
        <div className="hidden lg:block sticky top-20">
          <CategorySidebar
            activeGender={activeGender}
            activeSubcategory={activeSubcategory}
            onSelectCategory={handleSelectCategory}
            genderGroups={genderCategoryGroups}
            totalServiceCount={allServices.length}
          />
        </div>

        {/* MIDDLE SIDEBAR: SERVICES LIST (340px Sticky) */}
        <div className="hidden lg:block sticky top-20">
          <ServiceSidebar
            services={filteredServices}
            selectedServiceId={selectedService?.id || ''}
            onSelectService={handleSelectService}
            activeCategoryName={activeCategoryTitle}
          />
        </div>

        {/* RIGHT CONTENT PANEL: SERVICE DETAILS & PACKAGES (Flex-1 Main Content) */}
        <div className="flex-1 min-w-0 w-full space-y-8">
          {selectedService ? (
            <ServiceDetails
              service={selectedService}
              allCategoryServices={filteredServices}
              onSelectService={handleSelectService}
              onEnquireClick={() => router.push('/contact')}
            />
          ) : (
            <div className="p-12 text-center glass-card rounded-3xl border border-white/10 space-y-4">
              <Scissors className="w-12 h-12 mx-auto text-rosegold-400 opacity-40 animate-bounce" />
              <h3 className="text-xl font-serif font-bold text-white">No Service Selected</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Please select a category or treatment from the menu sidebars to view packages and pricing details.
              </p>
              <button
                type="button"
                onClick={() => handleSelectCategory('all', '')}
                className="px-6 py-3 rounded-full rosegold-gradient-bg text-dark-900 font-bold text-xs shadow-md cursor-pointer"
              >
                Reset Catalogue Filters
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 4. BOTTOM PROMO BANNER */}
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-8 sm:p-10 rounded-3xl border border-rosegold-500/40 rosegold-gradient-bg text-dark-900 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-glow-rosegold mt-12"
      >
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-dark-900 text-rosegold-300 text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-rosegold-400" />
            <span>SPECIAL PROMO</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-dark-900 leading-tight">
            ✨ 25% OFF FOR ALL NEW CUSTOMERS
          </h3>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Book any treatment from our menu today and experience Jubilee Hills' premier luxury salon.
          </p>
        </div>

        <Link
          href="/book"
          className="px-8 py-4 rounded-full bg-dark-900 text-white font-serif font-bold text-sm shadow-2xl hover:scale-105 transition-all cursor-pointer shrink-0 inline-flex items-center space-x-2"
        >
          <span>Book Appointment Now</span>
          <ArrowRight className="w-4 h-4 text-rosegold-400" />
        </Link>
      </motion.div>

    </div>
  );
}


