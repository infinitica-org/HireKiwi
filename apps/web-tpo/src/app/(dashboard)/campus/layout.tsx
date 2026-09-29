import type { ReactNode } from 'react';
import { CampusTabs } from '../../../components/campus/CampusTabs';

/** UNI-05 (Th6-445/446/447) — employer campus access: the review queue and the approved-employers list. */
export default function CampusLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      {/* Clean Page Title & Header */}
      <div className="px-1 pt-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          Campus Access
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-medium text-zinc-500">
          Review employers requesting campus recruiting access and manage approved employer
          permissions.
        </p>
      </div>
      <CampusTabs />
      {children}
    </div>
  );
}
