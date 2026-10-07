import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { portalIcons } from '@hirekiwi/ui/brand/portal-icons';
import './globals.css';
import { PortalAuthGate } from '@/components/portal-auth-gate';
import { ThemeProvider } from '@hirekiwi/ui/theme-provider';
import { TooltipProvider } from '@hirekiwi/ui/tooltip';

export const metadata: Metadata = {
  icons: portalIcons,
  title: {
    default: 'Company Portal · SMART',
    template: '%s · SMART Employers',
  },
  description: 'Post jobs, find verified students, and manage your hiring pipeline.',
  // Authenticated portal: keep out of search indexes (Th6-598).
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="company-canvas min-h-dvh font-sans text-foreground antialiased">
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <PortalAuthGate>{children}</PortalAuthGate>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
