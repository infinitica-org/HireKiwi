import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RedirectIfAuthenticated } from '../../components/redirect-if-authenticated';
import { LoginForm } from './login-form';
import { LoginLoadingState, LoginShell } from './login-shell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign in · SMART',
  description:
    'Sign in to SMART — Intellectual Talent Network and role-specific readiness certification for your institution.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingState />}>
      <RedirectIfAuthenticated>
        <LoginShell>
          <LoginForm />
        </LoginShell>
      </RedirectIfAuthenticated>
    </Suspense>
  );
}
