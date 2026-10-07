import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OauthCompleteClient } from './oauth-complete-client';
import { LoginLoadingState } from '../../login/login-shell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Signing in… · SMART',
};

export default function OauthCompletePage() {
  return (
    <Suspense fallback={<LoginLoadingState />}>
      <OauthCompleteClient />
    </Suspense>
  );
}
