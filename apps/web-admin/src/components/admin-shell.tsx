'use client';

import { useState, type ReactNode } from 'react';
import { getAccessToken } from '@smart/api-client';
import { SessionHoldWall, cn } from '@smart/ui';
import { AdminSidebar } from './admin-sidebar';
import { AdminTopbar } from './admin-topbar';
import { api } from '../lib/api';
import { signOut } from '../lib/auth';

export function AdminShell({ children }: { children: ReactNode }) {
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
    <SessionHoldWall
      getAccessToken={getAccessToken}
      pollMe={() => api.auth.me()}
      onSignOut={signOut}
    >
      <div className="admin-console flex h-screen overflow-hidden bg-[var(--ds-canvas)] text-[var(--ds-text)] antialiased selection:bg-[var(--admin-accent,#14b8a6)] selection:text-[var(--ds-text)]">
        <AdminSidebar
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
          <AdminTopbar onToggleSidebar={handleToggleSidebar} collapsed={collapsed} />
          {/* Same canvas as the TPO console: white with a soft lime→mint glow at the top. */}
          <main className="w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-white bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(225,255,160,0.4)_0%,rgba(180,248,220,0.25)_45%,rgba(255,255,255,0)_80%)] bg-no-repeat">
            <div className="mx-auto min-h-full w-full max-w-[1440px] px-4 py-6 md:px-6 md:py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SessionHoldWall>
  );
}
