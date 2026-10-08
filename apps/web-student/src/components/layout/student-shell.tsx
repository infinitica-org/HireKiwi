'use client';

import type { ReactNode } from 'react';
import { StudentTopbar } from './student-topbar';
import { OnboardingGate } from './OnboardingGate';
// import { StudentProfileCompletionFloat } from '@/components/profile/ProfileCompletionFloat';

/** Same frame as the TPO console (apps/web-tpo/src/components/tpo-shell.tsx): topbar, no sidebar. */
export function StudentShell({ children }: { children: ReactNode }) {
  return (
    <OnboardingGate>
      <div className="student-console flex h-screen flex-col overflow-hidden bg-white font-sans text-zinc-900 antialiased select-none dark:bg-[#0c0c0c] dark:text-zinc-100">
        <StudentTopbar />
        {/* TPO canvas: white with a soft lime→mint glow at the top (plain in dark mode). */}
        <main className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-white bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(225,255,160,0.4)_0%,rgba(180,248,220,0.25)_45%,rgba(255,255,255,0)_80%)] bg-no-repeat dark:bg-[#0c0c0c] dark:bg-none">
          <div className="mx-auto min-h-full w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
        {/* <StudentProfileCompletionFloat /> */}
      </div>
    </OnboardingGate>
  );
}
