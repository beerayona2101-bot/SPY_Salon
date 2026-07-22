export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  category: 'Hair' | 'Skin' | 'Spa' | 'Nails' | 'Bridal' | 'Grooming';
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
      'Use an oil-based cleansing balm to gently dissolve HD makeup.',
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
  },
  {
    id: '7',
    slug: 'balayage-hair-gloss',
    title: 'Balayage & Hair Gloss Treatment',
    category: 'Hair',
    price: '₹3,499',
    oldPrice: '₹4,299',
    time: '120 Min',
    rating: '4.9',
    reviewsCount: 94,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    desc: 'Custom hand-painted highlights with ammonia-free gloss for dimensional color.',
    longDescription: 'Achieve sun-kissed, natural-looking hair color with our signature French Balayage technique. Hand-painted highlights seamlessly transition into your base shade for low-maintenance, high-impact dimension.',
    benefits: [
      'Low maintenance color that grows out seamlessly',
      'Ammonia-free bonding technology protects hair structure',
      'High-shine gloss coat enhances color vibrance',
      'Customized placement tailored to your haircut & face shape'
    ],
    processSteps: [
      { title: 'Step 1: Color Consultation', desc: 'Shade mapping and hair health assessment.' },
      { title: 'Step 2: Freehand Balayage Painting', desc: 'Precision hand-application of lightening clay.' },
      { title: 'Step 3: Bond-Building Wash & Gloss', desc: 'Plex treatment wash and gloss tone application.' },
      { title: 'Step 4: Couture Blowout Styling', desc: 'Signature waves or sleek straightening finish.' }
    ],
    aftercare: [
      'Use purple/color-protecting shampoo once a week.',
      'Rinse with lukewarm or cool water to preserve shade intensity.'
    ]
  },
  {
    id: '8',
    slug: 'hydra-infusion-cleanup',
    title: 'Hydra-Infusion Deep Cleanup',
    category: 'Skin',
    price: '₹1,299',
    oldPrice: '₹1,699',
    time: '45 Min',
    rating: '4.8',
    reviewsCount: 120,
    image: 'https://images.unsplash.com/photo-1512290900673-70024fe88556?auto=format&fit=crop&w=1200&q=80',
    desc: 'Pore extraction, ultrasonic scrub, and water-surge hydration mask.',
    longDescription: 'Ideal for busy city dwellers. Combines gentle ultrasonic dead-skin scrubbing, painless pore extraction, and high-frequency oxygen hydration to clear congestion and awaken tired skin.',
    benefits: [
      'Clears clogged pores and prevents blackheads',
      'Refines skin texture and minimizes pore appearance',
      'Boosts oxygenation and cellular turnover',
      'Quick 45-minute glow ritual with zero downtime'
    ],
    processSteps: [
      { title: 'Step 1: Double Oil & Gel Cleanse', desc: 'Removes surface dirt, makeup, and urban pollutants.' },
      { title: 'Step 2: Ultrasonic Pore Exfoliation', desc: 'Soundwave spatula removes deep blackheads.' },
      { title: 'Step 3: Oxygen Water Surge Serum', desc: 'Pressurized oxygen mist infuses antioxidants.' },
      { title: 'Step 4: Cooling Algae Jelly Mask', desc: 'Calms redness and seals skin moisture.' }
    ],
    aftercare: [
      'Avoid heavy makeup for 6 hours post-facial.',
      'Keep skin hydrated with oil-free moisturizer.'
    ]
  },
  {
    id: '9',
    slug: 'swedish-deep-tissue-massage',
    title: 'Swedish Deep Tissue Massage',
    category: 'Spa',
    price: '₹2,799',
    oldPrice: '₹3,499',
    time: '90 Min',
    rating: '4.9',
    reviewsCount: 160,
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=1200&q=80',
    desc: 'Targeted deep muscle pressure therapy for athletic recovery and postural alignment.',
    longDescription: 'Recharge your body with deep tissue therapy. Designed specifically for individuals experiencing chronic muscle soreness, stiffness, or high physical stress.',
    benefits: [
      'Breaks down stubborn muscle knots and adhesions',
      'Improves joint flexibility and postural alignment',
      'Accelerates athletic recovery and lactic acid release',
      'Reduces tension headaches caused by desk posture'
    ],
    processSteps: [
      { title: 'Step 1: Muscle Assessment', desc: 'Therapist identifies high-tension zones.' },
      { title: 'Step 2: Warming Herbal Compression', desc: 'Hot herbal compress applied to spine & shoulders.' },
      { title: 'Step 3: Deep Tissue Myofascial Release', desc: 'Firm pressure strokes targeting inner muscle layers.' },
      { title: 'Step 4: Arnica Oil Stretch & Finish', desc: 'Therapeutic arnica oil application and gentle stretching.' }
    ],
    aftercare: [
      'Drink 2-3 liters of water to flush metabolic waste.',
      'Take a warm Epsom salt bath to prolong muscle relaxation.'
    ]
  },
  {
    id: '10',
    slug: 'pedicure-spa-reflexology',
    title: 'Pedicure Spa & Reflexology',
    category: 'Nails',
    price: '₹1,299',
    oldPrice: '₹1,699',
    time: '60 Min',
    rating: '4.8',
    reviewsCount: 92,
    image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=1200&q=80',
    desc: 'Whirlpool foot bath, callus smoothing scrub, and Thai foot reflexology massage.',
    longDescription: 'Give your feet the royal treatment. Includes warm whirlpool soak, sea salt pumice exfoliation, foot mask, cuticle care, and 20 minutes of restorative reflexology.',
    benefits: [
      'Softens cracked heels and removes tough calluses',
      'Relieves tired, aching feet and swollen ankles',
      'Reflexology points stimulate overall bodily organ wellness',
      'Includes long-lasting glossy nail lacquer'
    ],
    processSteps: [
      { title: 'Step 1: Bubble Whirlpool Soak', desc: 'Infused with tea tree oil and dead sea salts.' },
      { title: 'Step 2: Callus & Cuticle Grooming', desc: 'Precision heel filing and nail shaping.' },
      { title: 'Step 3: Thai Reflexology Foot Massage', desc: 'Targeted pressure point massage for lower legs.' },
      { title: 'Step 4: Nourishing Mask & Polish', desc: 'Hydrating foot wrap and choice of nail shade.' }
    ],
    aftercare: [
      'Wear open-toed footwear for 1 hour while polish dries.',
      'Apply foot cream before sleeping.'
    ]
  },
  {
    id: '11',
    slug: 'airbrush-bridal-makeover',
    title: 'Airbrush Royal Bridal Makeover',
    category: 'Bridal',
    price: '₹12,999',
    oldPrice: '₹15,999',
    time: '210 Min',
    rating: '5.0',
    reviewsCount: 140,
    image: 'https://images.unsplash.com/photo-1522337094846-8a83858c3d6d?auto=format&fit=crop&w=1200&q=80',
    desc: 'Ultra-lightweight airbrush makeup, 3D lashes, royal hair updo, and jewelry fitting.',
    longDescription: 'The ultimate luxury bridal package. Micro-fine airbrush application delivers a weightless, porcelain finish that looks natural up-close and flawless under 4K video lighting.',
    benefits: [
      'Porcelain airbrush finish that won’t smudge or crease',
      'Transfer-proof & sweat-proof all day and night',
      'Includes full body glow shimmer & nail art',
      'Senior Celebrity Makeup Artist dedicated exclusively to bride'
    ],
    processSteps: [
      { title: 'Step 1: Dermal Hydration & Eye Treatment', desc: 'Collagen eye pads & 24K primer.' },
      { title: 'Step 2: Micro-Airbrush Base', desc: 'Custom silicone-based foundation airbrushing.' },
      { title: 'Step 3: 3D Lash & Lip Sculpting', desc: 'Mink lash layers and contoured lip painting.' },
      { title: 'Step 4: Bridal Updo & Jewelry Fitting', desc: 'Hairstyle setting, maang tikka & chunni pin-up.' }
    ],
    aftercare: [
      'Gently remove with cleansing oil or micellar water.',
      'Follow with a soothing aloe sheet mask.'
    ]
  },
  {
    id: '12',
    slug: 'executive-haircut-scalp-scrub',
    title: 'Executive Haircut & Scalp Scrub',
    category: 'Grooming',
    price: '₹799',
    oldPrice: '₹999',
    time: '45 Min',
    rating: '4.9',
    reviewsCount: 135,
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80',
    desc: 'Stylist haircut, peppermint scalp exfoliation, neck massage, and hair blow-style.',
    longDescription: 'Precision grooming for executives. Includes face-shape haircut consultation, exfoliating peppermint scalp scrub wash, hot towel neck wrap, and matte wax styling.',
    benefits: [
      'Tailored haircut matching head structure & lifestyle',
      'Peppermint scrub removes dandruff and scalp buildup',
      'Improves scalp circulation for healthy hair growth',
      'Includes soothing shoulder & neck massage'
    ],
    processSteps: [
      { title: 'Step 1: Haircut Consultation & Cut', desc: 'Precision scissor and clipper technique.' },
      { title: 'Step 2: Peppermint Scalp Scrub Wash', desc: 'Cooling scrub removes dead flakes and sebum.' },
      { title: 'Step 3: Hot Towel & Neck Massage', desc: 'Relaxes neck & upper back muscles.' },
      { title: 'Step 4: Matte Pomade Style', desc: 'Professional blow-dry and pomade setting.' }
    ],
    aftercare: [
      'Use a light scalp tonic daily.',
      'Maintain haircut every 3-4 weeks.'
    ]
  }
];
