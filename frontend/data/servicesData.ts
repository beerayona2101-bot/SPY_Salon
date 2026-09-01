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

export const servicesData: ServiceItem[] = [];
