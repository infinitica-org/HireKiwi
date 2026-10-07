import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { portalIcons } from '@hirekiwi/ui/brand/portal-icons';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  icons: portalIcons,
  title: {
    default: 'TPO Console · SMART',
    template: '%s · SMART TPO',
  },
  description: 'Cohort readiness, JD ingest, shortlists.',
  // Authenticated portal: keep out of search indexes (Th6-598).
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
