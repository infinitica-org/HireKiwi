import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { portalIcons } from '@hirekiwi/ui/brand/portal-icons';
import { SessionBootstrap, SMART_HTML_CLASS } from '@hirekiwi/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sign in · HireKiwi',
  description: 'Login and account setup.',
  icons: portalIcons,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={SMART_HTML_CLASS}>
      <body className="min-h-dvh bg-white text-[#172033] antialiased font-[family-name:var(--auth-font-sans)]">
        <SessionBootstrap>{children}</SessionBootstrap>
      </body>
    </html>
  );
}
