import type { Metadata } from 'next';
import { Cinzel, Poppins, Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';
import Providers from '@/components/Providers';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cinzel',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SPY Salon | Luxury Beauty Studio, Hair & Spa Experience',
  description: 'Experience luxury grooming, 24K gold skin care, keratin hair treatments, and relaxing spa sessions at SPY Salon. Book online appointments instantly.',
  keywords: ['Salon', 'Spa', 'Luxury Beauty Studio', 'Hair Care', 'Skin Care', 'Hyderabad Salon', 'Online Booking'],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${poppins.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="antialiased bg-dark-900 text-gray-100 min-h-screen">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}

