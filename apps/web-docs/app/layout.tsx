import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.becomesmart.online'),
  title: {
    template: '%s | HireKiwi Documentation',
    default: 'HireKiwi Platform — Architecture & Engineering Documentation',
  },
  description:
    'Authoritative system architecture, data models, deployment guides, and API specifications for the HireKiwi platform.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
