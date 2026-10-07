'use client';

import { usePathname } from 'next/navigation';
import { PORTAL_ROLES, resolvePortalOriginsFromEnv } from '@hirekiwi/api-client';
import { RolesGuard, SessionBootstrap } from '@hirekiwi/ui';
import { signOut } from '../lib/auth';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const authUrl = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3005';
const PORTAL_ORIGINS = resolvePortalOriginsFromEnv();
const PUBLIC_PATHS = ['/auth'] as const;

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SessionBootstrap>
      <RolesGuard
        allowedRoles={PORTAL_ROLES.tpo}
        authAppUrl={authUrl}
        apiBaseUrl={baseUrl}
        pathname={pathname}
        portalOrigins={PORTAL_ORIGINS}
        publicPathPrefixes={PUBLIC_PATHS}
        onSignOut={signOut}
      >
        {children}
      </RolesGuard>
    </SessionBootstrap>
  );
}
