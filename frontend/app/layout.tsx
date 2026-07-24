import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';
import Providers from '@/components/Providers';

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
    <html lang="en">
      <body className="antialiased bg-dark-900 text-gray-100 min-h-screen">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
