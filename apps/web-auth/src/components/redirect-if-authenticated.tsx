'use client';

import { useLayoutEffect, useState, type ReactNode } from 'react';
import {
  decodeAccessTokenRole,
  getAccessToken,
  reconcileAccessTokenFromCookie,
} from '@hirekiwi/api-client';
import { apiBaseUrl, redirectForRole } from '../lib/api';
import { LoginLoadingState } from '../app/login/login-shell';

/**
 * Guards the public login pages against the mirror image of RolesGuard's bug:
 * pressing Back after a successful login lands here (web-auth's own origin,
 * a separate port from the portal apps), and without this check the page
 * just re-renders the login form — even though the session is still live —
 * because web-auth never gates itself the way the portals gate their pages.
 *
 * Checks localStorage first (set on this origin at the moment of login,
 * before the cross-port redirect) and falls back to the HttpOnly refresh
 * cookie on the API origin, so it also catches "localStorage was cleared but
 * the refresh cookie is still valid" rather than only the common case.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;

    void (async () => {
      const liveToken = (await reconcileAccessTokenFromCookie(apiBaseUrl)) ?? getAccessToken();
      if (cancelled) return;
      const role = liveToken ? decodeAccessTokenRole(liveToken) : null;
      if (liveToken && role) {
        const params = new URLSearchParams(window.location.search);
        redirectForRole(role, liveToken, params.get('returnTo'));
        return;
      }
      setChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked) return <LoginLoadingState />;
  return children;
}
