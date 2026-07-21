export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: string;
  oldPrice: string;
  time: string;
  rating: string;
  reviewsCount: number;
  image: string;
  desc: string;
  longDescription: string;
  benefits: string[];
  processSteps: { title: string; desc: string }[];
  aftercare: string[];
}

export const servicesData: ServiceItem[] = [
  {
    id: '1',
    slug: '24k-royal-gold-glow-facial',
    title: '24K Royal Gold Glow Facial',
    category: 'Skin',
    price: '₹1,499',
    oldPrice: '₹1,999',
    time: '60 Min',
    rating: '4.9',
    reviewsCount: 142,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
    desc: 'Pure 24K gold foil infusion with hyaluronic acid for instant luminosity and smooth texture.',
    longDescription: 'Indulge in our flagship 24K Gold Skin Therapy. Crafted for clients seeking immediate cellular rejuvenation, collagen boost, and a red-carpet luminous complexion. Our certified dermal experts use pure 24K gold leaves combined with cold-pressed rosehip seed oil and multi-molecular hyaluronic serum.',
    benefits: [
      'Stimulates natural collagen production for firmer skin',
      'Restores moisture barrier and locks in 48-hour hydration',
      'Reduces dark spots, sun tan, and hyperpigmentation',
      'Gives an immediate glass-skin radiant glow'
    ],
    processSteps: [
      { title: 'Step 1: Deep Botanical Cleansing', desc: 'Warm botanical steam and rosewater cleansing to open pores.' },
      { title: 'Step 2: Micro-Exfoliation', desc: 'Gentle diamond micro-dermabrasion exfoliation to remove dead skin.' },
      { title: 'Step 3: 24K Gold Leaf Infusion', desc: 'Application of pure 24K gold foil pressed with ultrasonic ion technology.' },
      { title: 'Step 4: Cryo-Globe Lymphatic Massage', desc: 'Cooling cryo-spheres massage to soothe, sculpt, and seal nutrients.' }
    ],
    aftercare: [
      'Avoid direct sunlight for 24 hours and wear SPF 50+ sunscreen.',
      'Stay hydrated and avoid harsh chemical soaps for 12 hours.'
    ]
  },
  {
    id: '2',
    slug: 'signature-keratin-hair-spa',
    title: 'Signature Keratin Hair Spa',
    category: 'Hair',
    price: '₹2,199',
    oldPrice: '₹2,799',
    time: '75 Min',
    rating: '4.9',
    reviewsCount: 198,
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
    desc: 'Restores keratin protein, tames frizz, and creates long-lasting mirror-shine smoothness.',
    longDescription: 'Transform dry, frizzy, or color-damaged hair with our Signature Keratin Therapy. Infused with natural hydrolyzed wheat proteins and Moroccan argan oil, this intensive spa treatment penetrates deep into the hair cortex to repair split ends and seal cuticles.',
    benefits: [
      'Eliminates 90% frizz and unmanageable flyaways',
      'Restores elasticity and high-gloss mirror shine',
      'Deeply conditions split ends caused by heat styling',
      'Results last up to 6 weeks with proper sulphate-free care'
    ],
    processSteps: [
      { title: 'Step 1: Clarifying Scalp Detox', desc: 'Deep scalp wash to remove product buildup and sebum.' },
      { title: 'Step 2: Keratin Protein Mask Application', desc: 'Sectional application of concentrated keratin & argan elixir.' },
      { title: 'Step 3: Ozone Warm Steam Therapy', desc: 'Infrared steam cap treatment to enhance protein absorption.' },
      { title: 'Step 4: Blow-dry & Cold Blast Lock', desc: 'Expert blow-dry styling to lock in smoothness and shine.' }
    ],
    aftercare: [
      'Use sulphate-free and paraben-free shampoo.',
      'Apply heat protectant serum before using hair dryers or irons.'
    ]
  },
  {
    id: '3',
    slug: 'aromatherapy-body-massage',
    title: 'Aromatherapy Body Massage',
    category: 'Spa',
    price: '₹2,499',
    oldPrice: '₹2,999',
    time: '90 Min',
    rating: '5.0',
    reviewsCount: 230,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
    desc: 'Organic lavender essential oil pressure massage designed to release deep muscle tension.',
    longDescription: 'Immerse your senses in absolute tranquility inside our soundproof VIP Spa Suites. Our certified wellness therapists blend cold-pressed French lavender, eucalyptus, and sweet almond oils to perform a rhythmic full-body Swedish & pressure-point massage.',
    benefits: [
      'Relieves chronic back, neck, and shoulder muscle knots',
      'Enhances blood circulation and lymphatic drainage',
      'Promotes deep restorative sleep and stress relief',
      'Leaves skin silky soft and gently scented'
    ],
    processSteps: [
      { title: 'Step 1: Essential Oil Aroma Selection', desc: 'Personalized aroma consultation to select your preferred essential oil blend.' },
      { title: 'Step 2: Warm Herbal Foot Bath', desc: 'Epsom salt & lavender foot soak to ease lower body tension.' },
      { title: 'Step 3: Full Body Swedish Massage', desc: '90 minutes of rhythmic long strokes and targeted trigger-point release.' },
      { title: 'Step 4: Herbal Steam & Shower', desc: 'Option for warm herbal steam session to open pores and relax muscles.' }
    ],
    aftercare: [
      'Drink plenty of warm water post-massage to assist toxin flushing.',
      'Allow the essential oils to absorb for at least 2 hours before showering.'
    ]
  },
  {
    id: '4',
    slug: 'gel-couture-manicure',
    title: 'Gel Couture Manicure & Art',
    category: 'Nails',
    price: '₹1,199',
    oldPrice: '₹1,599',
    time: '45 Min',
    rating: '4.8',
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80',
    desc: 'Chip-resistant gel polish with custom nail art, cuticle care, and hand paraffin dip.',
    longDescription: 'Elevate your hands with our luxury nail lounge care. Features meticulous cuticle grooming, custom nail shaping, UV-cured chip-resistant gel polish, and handcrafted nail art by certified master technicians.',
    benefits: [
      'Zero chipping for up to 3+ weeks',
      'Non-damaging LED curing technology',
      'Deeply moisturizing hand paraffin mask included',
      'Huge range of 200+ couture shades & 3D chrome art'
    ],
    processSteps: [
      { title: 'Step 1: Nail Prep & Shaping', desc: 'Cuticle push, nail filing, and surface buffing.' },
      { title: 'Step 2: Hydrating Hand Soak', desc: 'Warm botanical oil soak to soften skin.' },
      { title: 'Step 3: Gel Application & LED Curing', desc: 'Base coat, two color layers, and custom nail art.' },
      { title: 'Step 4: Cuticle Elixir & Massage', desc: 'Nourishing cuticle oil and relaxing hand massage.' }
    ],
    aftercare: [
      'Apply cuticle oil daily to maintain nail health.',
      'Avoid using nails as tools to prevent lifting.'
    ]
  },
  {
    id: '5',
    slug: 'hd-bridal-makeup',
    title: 'HD Bridal Makeup & Draping',
    category: 'Bridal',
    price: '₹8,999',
    oldPrice: '₹11,999',
    time: '180 Min',
    rating: '5.0',
    reviewsCount: 175,
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
    desc: 'High-definition airbrush makeup, saree/lehenga draping, hair styling, and mink lashes.',
    longDescription: 'Look camera-ready and luminous on your special day. Our senior bridal artists use premium international cosmetics (MAC, Charlotte Tilbury, NARS, Huda Beauty) to craft flawless, sweat-proof HD makeup that lasts 16+ hours.',
    benefits: [
      'Long-lasting 16+ hour water-resistant HD coverage',
      'Includes mink lashes, hair extensions & dupatta draping',
      'Pre-wedding skin prep consultation included',
      'Private VIP dressing suite for bride & family'
    ],
    processSteps: [
      { title: 'Step 1: Skin Prep & Priming', desc: 'Hydrating sheet mask & illuminated base primer.' },
      { title: 'Step 2: HD Base & Airbrush Sculpting', desc: 'Seamless foundation, contouring, and highlighting.' },
      { title: 'Step 3: Eye Art & Lash Application', desc: 'Custom eyeshadow look, waterproof liner, and lashes.' },
      { title: 'Step 4: Hair Styling & Royal Draping', desc: 'Intricate updo or curls with saree/lehenga draping.' }
    ],
    aftercare: [
      'Use a oil-based cleansing balm to gently dissolve HD makeup.',
      'Keep skin hydrated post-event with a rich night cream.'
    ]
  },
  {
    id: '6',
    slug: 'beard-sculpting-steam',
    title: 'Royal Beard Sculpting & Steam',
    category: 'Grooming',
    price: '₹599',
    oldPrice: '₹799',
    time: '30 Min',
    rating: '4.9',
    reviewsCount: 110,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    desc: 'Precision razor trimming, charcoal hot steam, and organic beard oil massage.',
    longDescription: 'Engineered for the modern gentleman. Features razor-sharp beard shaping, charcoal hot towel steam, in-grown hair treatment, and an organic cedarwood oil massage.',
    benefits: [
      'Sharpened cheek lines and neck definition',
      'Hot steam opens pores and prevents razor burn',
      'Deeply conditions coarse beard hair',
      'Includes forehead & neck tension massage'
    ],
    processSteps: [
      { title: 'Step 1: Hot Charcoal Steam Towel', desc: 'Relaxes skin and softens beard whiskers.' },
      { title: 'Step 2: Straight Razor Sculpting', desc: 'Precision edging for razor-sharp beard lines.' },
      { title: 'Step 3: Cooling Aftershave Balm', desc: 'Soothes skin and tightens pores.' },
      { title: 'Step 4: Cedarwood Beard Oil Massage', desc: 'Nourishes facial hair with a subtle luxury fragrance.' }
    ],
    aftercare: [
      'Apply beard oil daily to keep hair soft.',
      'Exfoliate skin twice a week to avoid ingrown hairs.'
    ]
  }
];
