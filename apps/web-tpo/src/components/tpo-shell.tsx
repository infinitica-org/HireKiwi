'use client';

import type { ReactNode } from 'react';
import { getAccessToken } from '@hirekiwi/api-client';
import { SessionHoldWall } from '@hirekiwi/ui';
import { TpoTopbar } from './tpo-topbar';
import { api } from '../lib/api';
import { signOut } from '../lib/auth';

export function TpoShell({ children }: { children: ReactNode }) {
  return (
    <SessionHoldWall
      getAccessToken={getAccessToken}
      pollMe={() => api.auth.me()}
      onSignOut={signOut}
    >
      <div className="tpo-console flex h-screen flex-col overflow-hidden bg-[var(--ds-canvas)] text-[var(--ds-text)] antialiased">
        <TpoTopbar />
        <main className="tpo-bento-theme w-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-white bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(225,255,160,0.4)_0%,rgba(180,248,220,0.25)_45%,rgba(255,255,255,0)_80%)] bg-no-repeat text-[var(--ds-text)]">
          <div className="mx-auto min-h-full w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </SessionHoldWall>
  );
}
