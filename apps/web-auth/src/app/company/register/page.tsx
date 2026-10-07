import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CompanyRegisterWizard } from './company-register-wizard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Register company · HireKiwi',
  description: 'Self-serve company registration for the HireKiwi B2B portal.',
};

export default function CompanyRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh w-full items-center justify-center bg-white p-6">
          <div className="flex flex-col items-center gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#06382b]/20 border-t-[#06382b]" />
            <p className="text-sm text-[#6b7280]">Loading registration…</p>
          </div>
        </div>
      }
    >
      <CompanyRegisterWizard />
    </Suspense>
  );
}
