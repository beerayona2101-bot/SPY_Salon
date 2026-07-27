/**
 * SPY Salon Master Services & Catalogue Data Store
 * Structured for Men's, Women's, and Kids' Salon Portals
 */

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  gender: 'men' | 'women' | 'kids';
  price: number;
  originalPrice?: number;
  duration: string;
  description: string;
  popular?: boolean;
  isNew?: boolean;
  offerBadge?: string;
  brand?: string;
  image?: string;
}

export interface BrandComparisonItem {
  name: string;
  duration: string;
  brand1Price: number;
  brand2Price: number;
  brand1Name?: string;
  brand2Name?: string;
}

export interface MultiBrandItem {
  name: string;
  brand1Price: number;
  brand2Price: number;
  brand3Price: number;
}

export interface CategoryCard {
  id: string;
  slug: string;
  name: string;
  gender: 'men' | 'women' | 'kids';
  icon: string;
  shortDesc: string;
  startingPrice: number;
  serviceCount: number;
  image: string;
  tagline: string;
  badge?: string;
  items: ServiceItem[];
  brandComparison?: {
    brand1Name: string;
    brand2Name: string;
    items: BrandComparisonItem[];
  };
  multiBrandComparison?: {
    brand1Name: string;
    brand2Name: string;
    brand3Name: string;
    items: MultiBrandItem[];
  };
}

export interface GenderSection {
  id: 'men' | 'women' | 'kids';
  title: string;
  icon: string;
  subtitle: string;
  bannerImage: string;
  categories: CategoryCard[];
}

export const SALON_CATALOGUE: GenderSection[] = [
  // ----------------------------------------------------
  // 👨 MEN'S SALON SECTION
  // ----------------------------------------------------
  {
    id: 'men',
    title: "Men's Salon",
    icon: '👨',
    subtitle: 'Precision Hair Styling, Beard Sculpting & Executive Grooming',
    bannerImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop',
    categories: [
      {
        id: 'men-haircuts',
        slug: 'haircuts',
        name: 'Hair Cuts',
        gender: 'men',
        icon: '✂️',
        shortDesc: 'Consultation, precision cuts, neck taper & styling.',
        startingPrice: 500,
        serviceCount: 6,
        image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop',
        tagline: 'Precision Cuts by Master Barber Stylists',
        badge: 'MOST POPULAR',
        items: [
          { id: 'm-hc-1', name: 'Stylist Hair Cut', gender: 'men', category: 'Hair Cuts', price: 500, duration: '30 mins', description: 'Consultation, precision haircut, neck taper & quick styling.', popular: true },
          { id: 'm-hc-2', name: 'Top Senior Stylist Hair Cut', gender: 'men', category: 'Hair Cuts', price: 800, duration: '45 mins', description: 'Advanced scissor technique by senior master stylist with blowout styling.', popular: false },
          { id: 'm-hc-3', name: 'Hair Wash & Conditioning Blowout', gender: 'men', category: 'Hair Cuts', price: 250, duration: '20 mins', description: 'Scalp cleansing rinse, conditioner & volume blow dry.', popular: false },
          { id: 'm-hc-4', name: 'Royal Shaving & Beard Sculpting', gender: 'men', category: 'Hair Cuts', price: 250, duration: '25 mins', description: 'Hot towel steam, precision blade shave & soothing aftershave balm.', popular: true },
          { id: 'm-hc-5', name: 'Creative Fade & Hair Tattoo Cut', gender: 'men', category: 'Hair Cuts', price: 1000, duration: '60 mins', description: 'Custom razor line art, skin fade & matte pomade finish.', isNew: true },
          { id: 'm-hc-6', name: 'Advance Hair Cut & Scalp Detox Spa', gender: 'men', category: 'Hair Cuts', price: 1000, duration: '50 mins', description: 'Precision cut paired with anti-dandruff deep scalp scrubbing.', popular: false }
        ]
      },
      {
        id: 'men-haircolor',
        slug: 'haircolor',
        name: 'Hair Color',
        gender: 'men',
        icon: '🎨',
        shortDesc: '100% Grey coverage, fashion highlights & beard color.',
        startingPrice: 1000,
        serviceCount: 4,
        image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=800&auto=format&fit=crop',
        tagline: 'Premium Ammonia-Free Colors & Highlights',
        items: [
          { id: 'm-col-1', name: 'Global Grey Coverage (Ammonia-Free)', gender: 'men', category: 'Hair Color', price: 1500, duration: '45 mins', description: 'Natural glossy grey coverage using L’Oreal Inoa ammonia-free color.', popular: true },
          { id: 'm-col-2', name: 'Beard & Mustache Color Tint', gender: 'men', category: 'Hair Color', price: 600, duration: '25 mins', description: 'Gentle skin-safe beard color tint for full grey coverage.', popular: false },
          { id: 'm-col-3', name: 'Fashion Highlights / Crown Streaks', gender: 'men', category: 'Hair Color', price: 1800, duration: '60 mins', description: 'Ash blonde, caramel or copper foil streaks for men.', isNew: true },
          { id: 'm-col-4', name: 'Root Touch Up', gender: 'men', category: 'Hair Color', price: 1000, duration: '35 mins', description: 'Quick grey touch-up for regrowth roots.', popular: false }
        ],
        brandComparison: {
          brand1Name: "L'Oreal Homme",
          brand2Name: 'Schwarzkopf Men',
          items: [
            { name: 'Root Grey Coverage', duration: '30 mins', brand1Price: 1000, brand2Price: 1200 },
            { name: 'Global Hair Color', duration: '45 mins', brand1Price: 1500, brand2Price: 1800 },
            { name: 'Fashion Crown Highlights', duration: '60 mins', brand1Price: 1800, brand2Price: 2200 }
          ]
        }
      },
      {
        id: 'men-hairspa',
        slug: 'hairspa',
        name: 'Hair Spa',
        gender: 'men',
        icon: '💆',
        shortDesc: 'Deep scalp therapy, anti-dandruff & nourishment.',
        startingPrice: 1200,
        serviceCount: 4,
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
        tagline: 'Revitalizing Scalp Massages & Intense Moisture',
        items: [
          { id: 'm-spa-1', name: 'L’Oreal Professionnel Nourishing Spa', gender: 'men', category: 'Hair Spa', price: 1200, duration: '45 mins', description: 'Deep conditioning cream bath massage with hot steam.', popular: true },
          { id: 'm-spa-2', name: 'Anti-Dandruff Scalp Scrub & Mask', gender: 'men', category: 'Hair Spa', price: 1500, duration: '50 mins', description: 'Zinc pyrithione exfoliation scrub to cure flakiness.', popular: false },
          { id: 'm-spa-3', name: 'Hair Fall Control & Root Fortifying Spa', gender: 'men', category: 'Hair Spa', price: 1800, duration: '60 mins', description: 'Aminexil serum scalp massage to strengthen roots.', offerBadge: 'BESTSELLER' },
          { id: 'm-spa-4', name: 'Argan Oil Deep Therapy Spa', gender: 'men', category: 'Hair Spa', price: 2000, duration: '60 mins', description: 'Pure Moroccan argan oil hydration treatment for soft hair.', isNew: true }
        ]
      },
      {
        id: 'men-treatments',
        slug: 'treatments',
        name: 'Hair Treatments',
        gender: 'men',
        icon: '🌊',
        shortDesc: 'Keratin smoothing, Olaplex repair & scalp detox.',
        startingPrice: 2500,
        serviceCount: 4,
        image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=800&auto=format&fit=crop',
        tagline: 'Advanced Keratin, Olaplex & Protein Reconstruction',
        items: [
          { id: 'm-tr-1', name: 'Executive Keratin Smoothing Treatment', gender: 'men', category: 'Hair Treatments', price: 2999, originalPrice: 3800, duration: '90 mins', description: 'Eliminates frizzy hair texture for up to 3 months.', popular: true, offerBadge: '20% OFF' },
          { id: 'm-tr-2', name: 'Olaplex Bond Multiplier Scalp Spa', gender: 'men', category: 'Hair Treatments', price: 2500, duration: '60 mins', description: 'Rebuilds broken hair bonds damaged by heat or color.', popular: false },
          { id: 'm-tr-3', name: 'Hair Botox Protein Reconstruction', gender: 'men', category: 'Hair Treatments', price: 3499, duration: '100 mins', description: 'Intensive caviar protein filler for damaged brittle hair.', isNew: true },
          { id: 'm-tr-4', name: 'Scalp Detox & Micro-Needling Serum', gender: 'men', category: 'Hair Treatments', price: 3999, duration: '75 mins', description: 'Stimulates hair follicles for thicker hair density.', popular: false }
        ]
      },
      {
        id: 'men-grooming',
        slug: 'grooming',
        name: 'Grooming',
        gender: 'men',
        icon: '✨',
        shortDesc: 'Facials, de-tan scrub, manicure & royal packages.',
        startingPrice: 800,
        serviceCount: 5,
        image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop',
        tagline: 'Complete Executive Face, Hand & Beard Packages',
        items: [
          { id: 'm-gr-1', name: 'Men’s Charcoal Instant Radiance Cleanup', gender: 'men', category: 'Grooming', price: 999, duration: '35 mins', description: 'Activated charcoal pore vacuuming & steam blackhead extraction.', popular: true },
          { id: 'm-gr-2', name: 'O3+ Men Brightening & De-Tan Facial', gender: 'men', category: 'Grooming', price: 1999, duration: '50 mins', description: 'Advanced sun tan removal & skin brightening treatment.', popular: true },
          { id: 'm-gr-3', name: 'Executive Pedicure & Hand Grooming', gender: 'men', category: 'Grooming', price: 1200, duration: '45 mins', description: 'Nail shaping, cuticle care, scrub & foot reflexology.', popular: false },
          { id: 'm-gr-4', name: 'Face & Neck De-Tan Pack', gender: 'men', category: 'Grooming', price: 800, duration: '25 mins', description: 'Kojic acid botanical tan removal mask.', popular: false },
          { id: 'm-gr-5', name: 'Royal Groom Package (Cut + Beard + Facial)', gender: 'men', category: 'Grooming', price: 2999, originalPrice: 3800, duration: '120 mins', description: 'Complete head-to-toe makeover package.', offerBadge: 'VIP PACKAGE' }
        ]
      }
    ]
  },

  // ----------------------------------------------------
  // 👩 WOMEN'S SALON SECTION
  // ----------------------------------------------------
  {
    id: 'women',
    title: "Women's Salon",
    icon: '👩',
    subtitle: 'Couture Styling, Glass Skin Facials, Keratin & Glamour',
    bannerImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop',
    categories: [
      {
        id: 'women-haircuts',
        slug: 'haircuts',
        name: 'Hair Cuts',
        gender: 'women',
        icon: '✂️',
        shortDesc: 'Layering, bob cuts, butterfly cuts & blow dry.',
        startingPrice: 600,
        serviceCount: 7,
        image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop',
        tagline: 'Signature Couture Styling & Volume Blowouts',
        badge: 'TRENDING',
        items: [
          { id: 'w-hc-1', name: 'Stylist Hair Cut & Blow Dry', gender: 'women', category: 'Hair Cuts', price: 1000, duration: '45 mins', description: 'Layering, fringe trim & classic volume blowout finish.', popular: true },
          { id: 'w-hc-2', name: 'Top Senior Stylist Transformation Cut', gender: 'women', category: 'Hair Cuts', price: 2000, duration: '60 mins', description: 'Custom face-framing cut by Master Creative Director.', popular: true },
          { id: 'w-hc-3', name: 'Luxury Hair Wash & Volume Blow Dry', gender: 'women', category: 'Hair Cuts', price: 600, duration: '35 mins', description: 'Deep moisture shampoo rinse and smooth blowout styling.', popular: false },
          { id: 'w-hc-4', name: 'Thermal Ironing / Sleek Straightening', gender: 'women', category: 'Hair Cuts', price: 1000, duration: '45 mins', description: 'Sleek ceramic heat iron smoothing finish.', popular: false },
          { id: 'w-hc-5', name: 'Hollywood Glam Curls & Tonging', gender: 'women', category: 'Hair Cuts', price: 1000, duration: '45 mins', description: 'Red-carpet glam curls with thermal heat protection.', popular: false },
          { id: 'w-hc-6', name: 'Party Updo & Elegant Bun Styling', gender: 'women', category: 'Hair Cuts', price: 1200, duration: '50 mins', description: 'Sophisticated cocktail party or bridal hair updo.', popular: false },
          { id: 'w-hc-7', name: 'Butterfly Cut / Korean Shag Transformation', gender: 'women', category: 'Hair Cuts', price: 2200, duration: '75 mins', description: 'Trendsetter layered transformation with voluminous blowout.', isNew: true }
        ]
      },
      {
        id: 'women-haircolor',
        slug: 'haircolor',
        name: 'Hair Color',
        gender: 'women',
        icon: '🎨',
        shortDesc: 'Global color, Balayage, Ombre & Highlights.',
        startingPrice: 1500,
        serviceCount: 5,
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop',
        tagline: 'Global Color, Balayage & Foil Highlights',
        badge: 'BRAND CHOICE',
        items: [
          { id: 'w-col-1', name: 'Root Touch Up (100% Grey Coverage)', gender: 'women', category: 'Hair Color', price: 1500, duration: '45 mins', description: 'Perfect grey coverage for regrowth root area.', popular: true },
          { id: 'w-col-2', name: 'Global Hair Color (Ammonia-Free)', gender: 'women', category: 'Hair Color', price: 3500, duration: '90 mins', description: 'Rich glossy global tint using premium nourishing oils.', popular: true },
          { id: 'w-col-3', name: 'Balayage / Ombre Hand-Painted Highlights', gender: 'women', category: 'Hair Color', price: 5500, originalPrice: 6800, duration: '150 mins', description: 'Seamless dimensional gradient highlights with gloss toner.', offerBadge: 'HOT DEAL' },
          { id: 'w-col-4', name: 'Full Head Foil Highlights (Crown + Sides)', gender: 'women', category: 'Hair Color', price: 4500, duration: '120 mins', description: 'Precision foil weave highlights for intense brightness.', popular: false },
          { id: 'w-col-5', name: 'Fashion Streak (Per Foil)', gender: 'women', category: 'Hair Color', price: 500, duration: '20 mins', description: 'Single accent foil streak in metallic or vibrant hues.', isNew: true }
        ],
        brandComparison: {
          brand1Name: "L'Oreal Paris Professional",
          brand2Name: 'Schwarzkopf Igora Royal',
          items: [
            { name: 'Root Touch Up', duration: '45 mins', brand1Price: 1500, brand2Price: 1800 },
            { name: 'Global Hair Color', duration: '90 mins', brand1Price: 3500, brand2Price: 4200 },
            { name: 'Balayage / Ombre Highlights', duration: '150 mins', brand1Price: 5500, brand2Price: 6500 },
            { name: 'Full Head Foil Highlights', duration: '120 mins', brand1Price: 4500, brand2Price: 5200 }
          ]
        }
      },
      {
        id: 'women-treatments',
        slug: 'treatments',
        name: 'Hair Treatments',
        gender: 'women',
        icon: '💆',
        shortDesc: 'Keratin smoothing, Hair Botox, Cysteine & Olaplex.',
        startingPrice: 2499,
        serviceCount: 5,
        image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=800&auto=format&fit=crop',
        tagline: 'Intensive Hair Spa, Keratin & Olaplex Restoration',
        items: [
          { id: 'w-tr-1', name: 'Signature Keratin Hair Spa & Mask', gender: 'women', category: 'Hair Treatments', price: 2499, originalPrice: 3200, duration: '60 mins', description: 'Deep hydration mask for frizz-free glossy hair.', popular: true, offerBadge: '20% OFF' },
          { id: 'w-tr-2', name: 'Intensive Hair Botox Reconstruction', gender: 'women', category: 'Hair Treatments', price: 3999, originalPrice: 5000, duration: '120 mins', description: 'Deep protein reconstruction for chemically damaged hair.', isNew: true },
          { id: 'w-tr-3', name: 'Cysteine Organic Smoothing Treatment', gender: 'women', category: 'Hair Treatments', price: 4500, duration: '150 mins', description: 'Formaldehyde-free smoothing treatment for natural shine.', popular: true },
          { id: 'w-tr-4', name: 'Olaplex Bond Repairing Spa', gender: 'women', category: 'Hair Treatments', price: 2999, duration: '60 mins', description: 'Patented bond multiplier treatment for colored hair.', popular: false },
          { id: 'w-tr-5', name: 'Nanoplastia Gloss Therapy', gender: 'women', category: 'Hair Treatments', price: 5999, duration: '180 mins', description: 'Amino-acid straightening for silky liquid glass shine.', popular: false }
        ]
      },
      {
        id: 'women-facials',
        slug: 'facials',
        name: 'Skin Care & Facials',
        gender: 'women',
        icon: '🌸',
        shortDesc: '24K Gold facial, O3+ Whitening & Hydrafacial.',
        startingPrice: 999,
        serviceCount: 6,
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
        tagline: 'Dermatological Radiance & Glass Skin Therapy',
        badge: 'LUXURY SKIN',
        items: [
          { id: 'w-fc-1', name: '24K Royal Gold Foil Glow Facial', gender: 'women', category: 'Skin Care & Facials', price: 2999, originalPrice: 4000, duration: '75 mins', description: 'Real 24K gold foil sheets for anti-aging radiance & firming.', popular: true, offerBadge: 'MOST POPULAR' },
          { id: 'w-fc-2', name: 'O3+ Professional Whitening & Brightening Facial', gender: 'women', category: 'Skin Care & Facials', price: 2499, duration: '60 mins', description: 'Targeted hyperpigmentation treatment for instant glow.', popular: true },
          { id: 'w-fc-3', name: 'Hydrafacial Micro-Dermabrasion Glow', gender: 'women', category: 'Skin Care & Facials', price: 3499, duration: '75 mins', description: 'Ultrasonic pore vacuuming & hyaluronic acid blast.', isNew: true },
          { id: 'w-fc-4', name: 'Diamond Radiance Skin Polish Facial', gender: 'women', category: 'Skin Care & Facials', price: 2200, duration: '60 mins', description: 'Micro-crystal exfoliation for smooth glass skin.', popular: false },
          { id: 'w-fc-5', name: 'Sara Fruit Hydrating Cleanup', gender: 'women', category: 'Skin Care & Facials', price: 999, duration: '35 mins', description: 'Gentle botanical cleanse with fruit enzyme mask.', popular: false },
          { id: 'w-fc-6', name: 'Raaga De-Tan Pack (Face & Neck)', gender: 'women', category: 'Skin Care & Facials', price: 800, duration: '30 mins', description: 'Milk & Kojic acid tan removal treatment.', popular: false }
        ]
      },
      {
        id: 'women-nails',
        slug: 'nails',
        name: 'Nails & Extensions',
        gender: 'women',
        icon: '💅',
        shortDesc: 'Gel extensions, Acrylics, Chrome & Nail Art.',
        startingPrice: 400,
        serviceCount: 5,
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop',
        tagline: 'Couture Nail Art, Extensions & Gel Polish',
        items: [
          { id: 'w-nl-1', name: 'Acrylic Nail Extensions (Full Set)', gender: 'women', category: 'Nails & Extensions', price: 2200, duration: '90 mins', description: 'Custom tip extensions with long-lasting gel color polish.', popular: true },
          { id: 'w-nl-2', name: 'Gel Extensions with Chrome Finish', gender: 'women', category: 'Nails & Extensions', price: 2500, duration: '90 mins', description: 'Mirror chrome shine over gel extension tips.', isNew: true },
          { id: 'w-nl-3', name: '3D Cat-Eye Art & Rhinestones (Per Nail)', gender: 'women', category: 'Nails & Extensions', price: 150, duration: '10 mins', description: 'Intricate jewel & cat-eye nail art detailing.', popular: false },
          { id: 'w-nl-4', name: 'Express Gel Polish Application', gender: 'women', category: 'Nails & Extensions', price: 800, duration: '30 mins', description: 'UV-cured chip-free gel color application.', popular: false },
          { id: 'w-nl-5', name: 'Spa Pedicure & Foot Scrub', gender: 'women', category: 'Nails & Extensions', price: 1200, duration: '45 mins', description: 'Aromatic sea salt foot soak, exfoliation & reflexology.', popular: true }
        ]
      },
      {
        id: 'women-waxing',
        slug: 'waxing',
        name: 'Waxing & Threading',
        gender: 'women',
        icon: '🕯️',
        shortDesc: 'Threading, Sara Organic, Liposoluble & Brazilian Waxing.',
        startingPrice: 80,
        serviceCount: 6,
        image: 'https://images.unsplash.com/photo-1512290900673-700256427389?q=80&w=800&auto=format&fit=crop',
        tagline: 'Precision Eyebrows & Silk Hair Removal',
        items: [
          { id: 'w-wx-1', name: 'Eyebrow Threading & Shaping', gender: 'women', category: 'Waxing & Threading', price: 80, duration: '10 mins', description: 'Precision brow shaping by certified brow specialist.', popular: true },
          { id: 'w-wx-2', name: 'Upper Lip & Chin Threading', gender: 'women', category: 'Waxing & Threading', price: 100, duration: '10 mins', description: 'Gentle facial hair removal.', popular: false },
          { id: 'w-wx-3', name: 'Full Face Threading', gender: 'women', category: 'Waxing & Threading', price: 350, duration: '25 mins', description: 'Complete forehead, cheeks, lip & chin threading.', popular: false },
          { id: 'w-wx-4', name: 'Full Arms & Underarms Waxing (Choco Wax)', gender: 'women', category: 'Waxing & Threading', price: 850, duration: '30 mins', description: 'Smooth liposoluble chocolate wax hair removal.', popular: true },
          { id: 'w-wx-5', name: 'Full Legs Waxing (Choco Wax)', gender: 'women', category: 'Waxing & Threading', price: 1100, duration: '40 mins', description: 'Soothing warm wax for smooth legs.', popular: false },
          { id: 'w-wx-6', name: 'Full Body Waxing Package (Reka Brazilian)', gender: 'women', category: 'Waxing & Threading', price: 3900, duration: '90 mins', description: 'Painless premium stripless Brazilian wax package.', offerBadge: 'VIP SAVINGS' }
        ],
        multiBrandComparison: {
          brand1Name: 'Sara Organic Wax',
          brand2Name: 'Choco Liposoluble Wax',
          brand3Name: 'Reka Brazilian Wax',
          items: [
            { name: 'Half Arms', brand1Price: 300, brand2Price: 450, brand3Price: 700 },
            { name: 'Full Arms & Underarms', brand1Price: 600, brand2Price: 850, brand3Price: 1200 },
            { name: 'Full Legs', brand1Price: 800, brand2Price: 1100, brand3Price: 1600 },
            { name: 'Full Body Package', brand1Price: 2200, brand2Price: 2900, brand3Price: 3900 }
          ]
        }
      },
      {
        id: 'women-makeup',
        slug: 'makeup',
        name: 'Makeup & Updos',
        gender: 'women',
        icon: '💄',
        shortDesc: 'Party glam, Airbrush makeup & HD Bridal packages.',
        startingPrice: 3500,
        serviceCount: 3,
        image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800&auto=format&fit=crop',
        tagline: 'Red Carpet Glamour & HD Bridal Makeovers',
        items: [
          { id: 'w-mk-1', name: 'Party Glam Airbrush Makeup', gender: 'women', category: 'Makeup & Updos', price: 4500, duration: '90 mins', description: 'Waterproof long-wear airbrush makeup & luxury lashes.', popular: true },
          { id: 'w-mk-2', name: 'HD Bridal Makeup & Hair Styling', gender: 'women', category: 'Makeup & Updos', price: 12500, originalPrice: 15000, duration: '180 mins', description: 'Complete high-definition bridal transformation package.', offerBadge: 'BRIDAL VIP' },
          { id: 'w-mk-3', name: 'Saree Draping & Dupatta Setting', gender: 'women', category: 'Makeup & Updos', price: 800, duration: '30 mins', description: 'Professional pleated saree draping.', popular: false }
        ]
      },
      {
        id: 'women-massage',
        slug: 'massage',
        name: 'Spa & Massage',
        gender: 'women',
        icon: '💆',
        shortDesc: 'Aromatherapy, Deep Tissue & Foot Reflexology.',
        startingPrice: 1800,
        serviceCount: 3,
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
        tagline: 'Botanical Essential Oils & Stress Relief Therapy',
        items: [
          { id: 'w-ms-1', name: 'Aromatherapy Full Body Massage (60 Min)', gender: 'women', category: 'Spa & Massage', price: 2499, duration: '60 mins', description: 'Essential lavender botanical oil relaxation massage.', popular: true },
          { id: 'w-ms-2', name: 'Deep Tissue Muscle Relief (90 Min)', gender: 'women', category: 'Spa & Massage', price: 3200, duration: '90 mins', description: 'Targeted pressure therapy for chronic back & shoulder tension.', isNew: true },
          { id: 'w-ms-3', name: 'Head, Neck & Shoulder Reflexology', gender: 'women', category: 'Spa & Massage', price: 1200, duration: '35 mins', description: 'Quick stress relief massage.', popular: false }
        ]
      }
    ]
  },

  // ----------------------------------------------------
  // 🧒 KIDS SALON SECTION
  // ----------------------------------------------------
  {
    id: 'kids',
    title: "Kids' Salon",
    icon: '🧒',
    subtitle: 'Fun, Gentle & Kid-Friendly Hair Cuts & Grooming',
    bannerImage: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?q=80&w=1200&auto=format&fit=crop',
    categories: [
      {
        id: 'kids-haircuts',
        slug: 'haircuts',
        name: 'Hair Cuts',
        gender: 'kids',
        icon: '✂️',
        shortDesc: 'Gentle haircut for boys & girls up to 12 years.',
        startingPrice: 400,
        serviceCount: 4,
        image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=800&auto=format&fit=crop',
        tagline: 'Gentle Styling & Patient Kid Specialist Barbers',
        badge: 'KIDS FAVORITE',
        items: [
          { id: 'k-hc-1', name: 'Little Champ Hair Cut (Boys)', gender: 'kids', category: 'Hair Cuts', price: 500, duration: '30 mins', description: 'Gentle fade or crew cut with cartoon cape & surprise lollipop.', popular: true },
          { id: 'k-hc-2', name: 'Little Princess Layer Cut (Girls)', gender: 'kids', category: 'Hair Cuts', price: 600, duration: '35 mins', description: 'Soft fringe & layer cut with pretty hair bow styling.', popular: true },
          { id: 'k-hc-3', name: 'Baby First Haircut (Mundan Trim)', gender: 'kids', category: 'Hair Cuts', price: 400, duration: '25 mins', description: 'Super gentle & hygienic first haircut experience.', isNew: true },
          { id: 'k-hc-4', name: 'School Trim & Neat Taper', gender: 'kids', category: 'Hair Cuts', price: 450, duration: '25 mins', description: 'Neat & formal school dress code haircut.', popular: false }
        ]
      },
      {
        id: 'kids-hairstyling',
        slug: 'hairstyling',
        name: 'Hair Styling',
        gender: 'kids',
        icon: '🎨',
        shortDesc: 'Braid extensions, party curls & temporary color.',
        startingPrice: 300,
        serviceCount: 3,
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop',
        tagline: 'Fun Braids, Glitter Sprays & Birthday Party Styling',
        items: [
          { id: 'k-st-1', name: 'Birthday Party Braid & Glitter Hair', gender: 'kids', category: 'Hair Styling', price: 600, duration: '30 mins', description: 'Cute French braids with washable glitter spray.', popular: true },
          { id: 'k-st-2', name: 'Temporary Washable Hair Color Chalk', gender: 'kids', category: 'Hair Styling', price: 500, duration: '20 mins', description: 'Safe non-toxic pink, blue or purple hair streaks.', isNew: true },
          { id: 'k-st-3', name: 'Kids Hair Wash & Blowout', gender: 'kids', category: 'Hair Styling', price: 300, duration: '20 mins', description: 'Tear-free shampoo rinse & gentle warm blow dry.', popular: false }
        ]
      },
      {
        id: 'kids-haircare',
        slug: 'haircare',
        name: 'Hair Care',
        gender: 'kids',
        icon: '💆',
        shortDesc: 'Tear-free conditioning spa & scalp massage.',
        startingPrice: 600,
        serviceCount: 2,
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
        tagline: 'Tear-Free Botanical Nourishment',
        items: [
          { id: 'k-ca-1', name: 'Organic Coconut Oil Champis Massage', gender: 'kids', category: 'Hair Care', price: 600, duration: '30 mins', description: 'Warm organic coconut oil scalp massage for strong hair.', popular: true },
          { id: 'k-ca-2', name: 'Kids Soft Moisture Cream Spa', gender: 'kids', category: 'Hair Care', price: 800, duration: '35 mins', description: 'Detangling hydration cream bath for silky locks.', popular: false }
        ]
      },
      {
        id: 'kids-grooming',
        slug: 'grooming',
        name: 'Grooming',
        gender: 'kids',
        icon: '✨',
        shortDesc: 'Mini manicure, non-toxic nail art & fruit cleanup.',
        startingPrice: 400,
        serviceCount: 2,
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop',
        tagline: 'Cute Mini Pampering & Nail Polish',
        items: [
          { id: 'k-gr-1', name: 'Princess Mini Manicure & Nail Polish', gender: 'kids', category: 'Grooming', price: 500, duration: '25 mins', description: 'Nail shaping, hand scrub & water-based non-toxic nail polish.', popular: true },
          { id: 'k-gr-2', name: 'Little Star Strawberry Face Cleanup', gender: 'kids', category: 'Grooming', price: 700, duration: '30 mins', description: 'Mild organic strawberry face wash & hydrating mask.', isNew: true }
        ]
      },
      {
        id: 'kids-packages',
        slug: 'packages',
        name: 'Special Packages',
        gender: 'kids',
        icon: '🎉',
        shortDesc: 'Combo packages for birthday & celebration days.',
        startingPrice: 999,
        serviceCount: 2,
        image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?q=80&w=1200&auto=format&fit=crop',
        tagline: 'Unforgettable Birthday & Holiday Transformation',
        items: [
          { id: 'k-pk-1', name: 'Birthday Champ Package (Cut + Styling + Wash)', gender: 'kids', category: 'Special Packages', price: 999, originalPrice: 1400, duration: '60 mins', description: 'Complete party look makeover with surprise gift box.', offerBadge: 'SPECIAL' },
          { id: 'k-pk-2', name: 'Princess Glam Package (Cut + Braid + Mini Mani)', gender: 'kids', category: 'Special Packages', price: 1299, originalPrice: 1800, duration: '75 mins', description: 'Complete royal pampering day for little princesses.', offerBadge: 'MOST LOVED' }
        ]
      }
    ]
  }
];

/**
 * Utility: Find Category by Gender and Slug
 */
export const getCategoryByGenderAndSlug = (gender: string, slug: string): CategoryCard | null => {
  const section = SALON_CATALOGUE.find(s => s.id === gender.toLowerCase());
  if (!section) return null;
  return section.categories.find(c => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase().includes(slug.toLowerCase())) || null;
};

/**
 * Utility: Get All Categories for a Specific Gender
 */
export const getCategoriesForGender = (gender: string): CategoryCard[] => {
  const section = SALON_CATALOGUE.find(s => s.id === gender.toLowerCase());
  return section ? section.categories : [];
};
