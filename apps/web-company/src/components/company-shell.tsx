'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@hirekiwi/ui';
import { CompanySidebar } from './company-sidebar';
import { CompanyTopbar } from './company-topbar';

/** Same frame as the TPO console (apps/web-tpo/src/components/tpo-shell.tsx). */
export function CompanyShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileNavOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="company-console flex h-screen overflow-hidden bg-[var(--ds-canvas)] text-[var(--ds-text)] antialiased">
      <CompanySidebar
        mobileOpen={mobileNavOpen}
        onMobileOpenChange={setMobileNavOpen}
        collapsed={collapsed}
      />
      <div
        className={cn(
          'relative flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-200',
          collapsed ? 'lg:pl-16' : 'lg:pl-64',
        )}
      >
        <CompanyTopbar onToggleSidebar={handleToggleSidebar} collapsed={collapsed} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="company-bento min-h-full w-full px-4 py-8 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
