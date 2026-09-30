import type { Metadata } from 'next';
import Script from 'next/script';
import { Caveat, Inter, Kalam, Manrope, Montserrat } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});
const heroHand = Caveat({ subsets: ['latin'], variable: '--font-hero-hand', display: 'swap' });
const heroMarker = Kalam({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-hero-marker',
  display: 'swap',
});

import { DemoModalProvider } from '@/context/DemoModalContext';
import DemoModal from '@/components/DemoModal';

export const metadata: Metadata = {
  title: 'SMART — AI-Powered Talent Intelligence Platform',
  description: 'Immersive talent intelligence platform powered by AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${montserrat.variable} ${heroHand.variable} ${heroMarker.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* CookieYes Banner */}
        <Script
          id="cookieyes"
          src={
            process.env.NODE_ENV === 'development'
              ? '/api/cookieyes'
              : 'https://cdn-cookieyes.com/client_data/be2546efcbf450059885daed3260170c/script.js'
          }
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-white text-slate-900 antialiased" suppressHydrationWarning>
        <DemoModalProvider>
          <SmoothScroll>
            <Navbar />
            {children}
            <Footer />
          </SmoothScroll>
          <DemoModal />
        </DemoModalProvider>
      </body>
    </html>
  );
}
