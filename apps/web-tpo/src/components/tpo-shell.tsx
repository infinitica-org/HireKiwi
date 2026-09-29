'use client';

import { useState, type ReactNode } from 'react';
import { getAccessToken } from '@smart/api-client';
import { SessionHoldWall, cn } from '@smart/ui';
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
          <main className="mx-auto w-full max-w-[1440px] flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
            {children}
          </main>
        </div>
      </div>
    </SessionHoldWall>
  );
}
