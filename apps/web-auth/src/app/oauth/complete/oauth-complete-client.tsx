'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { decodeAccessTokenRole } from '@hirekiwi/api-client';
import { redirectForRole, storeSession } from '../../../lib/api';
import { LoginLoadingState } from '../../login/login-shell';

/**
 * Landing spot for the Google OAuth callback — the API mints the session and
 * hands the token to this page via a redirect (not an API response) because
 * the callback runs on the api-core origin, not a portal origin. Token lives
 * in the URL for one tick before `storeSession` persists it and the portal
 * redirect strips the whole query string.
 */
export function OauthCompleteClient() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('accessToken');
    const returnTo = searchParams.get('returnTo');
    if (!token) {
      window.location.replace('/login?oauthError=google_failed');
      return;
    }
    const role = decodeAccessTokenRole(token);
    if (!role) {
      window.location.replace('/login?oauthError=google_failed');
      return;
    }
    storeSession(token);
    redirectForRole(role, token, returnTo);
  }, [searchParams]);

  return <LoginLoadingState />;
}
