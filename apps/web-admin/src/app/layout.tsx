import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { portalIcons } from '@hirekiwi/ui/brand/portal-icons';
import './globals.css';
import { PortalAuthGate } from '../components/portal-auth-gate';
import { ThemeProvider } from '@hirekiwi/ui/theme-provider';
import { Toaster } from '@hirekiwi/ui/sonner';
import { TooltipProvider } from '@hirekiwi/ui/tooltip';

export const metadata: Metadata = {
  icons: portalIcons,
  title: 'Platform admin · HireKiwi',
  description: 'Integrity queue, AI health, cut scores.',
  // Authenticated portal: keep out of search indexes (Th6-598).
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="relative min-h-dvh bg-[var(--ds-canvas,#ffffff)] font-sans text-[var(--ds-text,#101828)] antialiased">
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <PortalAuthGate>{children}</PortalAuthGate>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
