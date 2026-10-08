'use client';

import type { ReactNode } from 'react';
import { CompanyTopbar } from './company-topbar';

/** Same frame as the TPO console (apps/web-tpo/src/components/tpo-shell.tsx): topbar, no sidebar. */
export function CompanyShell({ children }: { children: ReactNode }) {
  return (
    <div className="company-console flex h-screen flex-col overflow-hidden bg-[var(--ds-canvas)] text-[var(--ds-text)] antialiased">
      <CompanyTopbar />
      <main className="mx-auto min-h-0 w-full max-w-[1440px] flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="company-bento min-h-full w-full px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}
