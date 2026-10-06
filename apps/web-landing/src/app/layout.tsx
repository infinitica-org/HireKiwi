import { Manrope } from 'next/font/google';
import CookieYesScript from '@/components/CookieYesScript';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import { DemoModalProvider } from '@/context/DemoModalContext';
import DemoModalLazy from '@/components/DemoModalLazy';
import { jsonLd, rootMetadata } from '@/lib/seo';
import './globals.css';

// Manrope is the only face the landing pages render; next/font self-hosts it,
// preloads the latin subset and sizes the fallback to avoid layout shift.
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const metadata = rootMetadata();
export { viewport } from '@/lib/seo';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <head>
        <CookieYesScript />
      </head>
      <body className="bg-white text-slate-900 antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, '\\u003c') }}
        />
        <DemoModalProvider>
          <SmoothScroll>
            <Navbar />
            {children}
            <Footer />
          </SmoothScroll>
          <DemoModalLazy />
        </DemoModalProvider>
      </body>
    </html>
  );
}
