import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'SPY Salon | Luxury Beauty Studio, Hair & Spa Experience',
  description: 'Experience luxury grooming, 24K gold skin care, keratin hair treatments, and relaxing spa sessions at SPY Salon. Book online appointments instantly.',
  keywords: ['Salon', 'Spa', 'Luxury Beauty Studio', 'Hair Care', 'Skin Care', 'Hyderabad Salon', 'Online Booking'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-dark-900 text-gray-100 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-20 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
