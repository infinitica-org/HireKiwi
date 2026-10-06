'use client';

import { useState, type ReactNode } from 'react';
import { getAccessToken } from '@hirekiwi/api-client';
import { SessionHoldWall, cn } from '@hirekiwi/ui';
import { TpoSidebar } from './tpo-sidebar';
import { TpoTopbar } from './tpo-topbar';
import { api } from '../lib/api';
import { signOut } from '../lib/auth';

export function TpoShell({ children }: { children: ReactNode }) {
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
      <div className="tpo-console flex h-screen overflow-hidden bg-[var(--ds-canvas)] text-[var(--ds-text)] antialiased">
        <TpoSidebar
          mobileOpen={mobileNavOpen}
          onMobileOpenChange={setMobileNavOpen}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
        <div
          className={cn(
            'relative flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-200',
            collapsed ? 'lg:pl-16' : 'lg:pl-64',
          )}
        >
          <TpoTopbar onToggleSidebar={handleToggleSidebar} collapsed={collapsed} />
          <main className="tpo-bento-theme w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-white bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(225,255,160,0.4)_0%,rgba(180,248,220,0.25)_45%,rgba(255,255,255,0)_80%)] bg-no-repeat text-[var(--ds-text)]">
            <div className="mx-auto min-h-full w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
    </SessionHoldWall>
  );
}
