import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';
import Providers from '@/components/Providers';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

// Generated once per server start/restart
const SERVER_BOOT_ID = `boot_${Date.now()}`;

export const metadata: Metadata = {
  title: 'SPY Salon | Luxury Beauty Studio, Hair & Spa Experience',
  description: 'Experience luxury grooming, 24K gold skin care, keratin hair treatments, and relaxing spa sessions at SPY Salon. Book online appointments instantly.',
  keywords: ['Salon', 'Spa', 'Luxury Beauty Studio', 'Hair Care', 'Skin Care', 'Hyderabad Salon', 'Online Booking'],
  icons: {
    icon: '/logo-icon.png',
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${poppins.className}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var serverBootId = "${SERVER_BOOT_ID}";
                  var lastBootId = localStorage.getItem('spy_server_boot_id');
                  if (lastBootId !== serverBootId) {
                    localStorage.setItem('spy_server_boot_id', serverBootId);
                    localStorage.setItem('spy_theme', 'dark');
                  }
                  var savedTheme = localStorage.getItem('spy_theme');
                  var theme = savedTheme === 'light' ? 'light' : 'dark';
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="antialiased bg-dark-900 text-gray-100 min-h-screen">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}


