/**
 * SPY Salon Dynamic Services & Catalogue Data Store
 * Dynamically populated from MongoDB Database
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
  {
    id: 'men',
    title: "Men's Salon",
    icon: '👨',
    subtitle: 'Precision Hair Styling, Beard Sculpting & Executive Grooming',
    bannerImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop',
    categories: []
  },
  {
    id: 'women',
    title: "Women's Salon",
    icon: '👩',
    subtitle: 'Couture Styling, Glass Skin Facials, Keratin & Glamour',
    bannerImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop',
    categories: []
  },
  {
    id: 'kids',
    title: "Kids' Salon",
    icon: '🧒',
    subtitle: 'Fun, Gentle & Kid-Friendly Hair Cuts & Grooming',
    bannerImage: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?q=80&w=1200&auto=format&fit=crop',
    categories: []
  }
];

export const getCategoryByGenderAndSlug = (gender: string, slug: string): CategoryCard | null => {
  const section = SALON_CATALOGUE.find(s => s.id === gender.toLowerCase());
  if (!section) return null;
  return section.categories.find(c => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase().includes(slug.toLowerCase())) || null;
};

export const getCategoriesForGender = (gender: string): CategoryCard[] => {
  const section = SALON_CATALOGUE.find(s => s.id === gender.toLowerCase());
  return section ? section.categories : [];
};
