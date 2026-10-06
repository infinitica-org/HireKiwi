import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@hirekiwi/ui/theme-provider';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Student portal · SMART',
  description: 'Track enrolment, L1-L5 player, results.',
  // Authenticated portal: keep out of search indexes (Th6-598).
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-[family-name:var(--tpo-font-sans)]">
        <ThemeProvider defaultTheme="light" enableSystem={false} storageKey="smart-student-theme">
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
