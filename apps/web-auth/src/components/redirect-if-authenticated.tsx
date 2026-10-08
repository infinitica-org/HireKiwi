'use client';

import { useLayoutEffect, useState, type ReactNode } from 'react';
import {
  decodeAccessTokenRole,
  getUnexpiredAccessToken,
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

    const check = async (): Promise<void> => {
      if (!cancelled) setChecked(false);
      const liveToken =
        (await reconcileAccessTokenFromCookie(apiBaseUrl)) ?? getUnexpiredAccessToken();
      if (cancelled) return;
      const role = liveToken ? decodeAccessTokenRole(liveToken) : null;
      if (liveToken && role) {
        const params = new URLSearchParams(window.location.search);
        redirectForRole(role, liveToken, params.get('returnTo'));
        return;
      }
      setChecked(true);
    };

    void check();

    // The browser can restore this page from its back-forward cache on a
    // Back navigation (e.g. after logging in and landing on a portal, then
    // pressing Back) without re-running effects or re-fetching anything —
    // leaving the already-rendered login form on screen even though the
    // session is still live. `pageshow` with `persisted: true` is the signal
    // for that restore; re-run the same check so it redirects forward again
    // instead of looking stuck.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void check();
    };
    window.addEventListener('pageshow', onPageShow);

    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  if (!checked) return <LoginLoadingState />;
  return children;
}
