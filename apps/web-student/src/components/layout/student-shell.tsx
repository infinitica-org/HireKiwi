'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { StudentTopbar } from './student-topbar';
import { OnboardingGate } from './OnboardingGate';
// import { StudentProfileCompletionFloat } from '@/components/profile/overview/ProfileCompletionFloat';

/** Same frame as the TPO console (apps/web-tpo/src/components/tpo-shell.tsx): topbar, no sidebar. */
export function StudentShell({ children }: { children: ReactNode }) {
  // The profile page keeps its section sidebar against the left edge instead of a centred column.
  const pathname = usePathname() ?? '';
  const wide = pathname.startsWith('/student/profile');
  // Messages fill the whole area under the top bar, like a chat app.
  const fullScreen = pathname.startsWith('/student/messages');
  return (
    <OnboardingGate>
      <div className="student-console flex h-screen flex-col overflow-hidden bg-white font-sans text-zinc-900 antialiased select-none dark:bg-[#0c0c0c] dark:text-zinc-100">
        <StudentTopbar />
        {/* TPO canvas: white with a soft lime→mint glow at the top (plain in dark mode). */}
        <main
          className={`min-h-0 w-full flex-1 overflow-x-hidden overscroll-contain ${fullScreen ? 'overflow-y-hidden' : 'overflow-y-auto'} bg-white bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(225,255,160,0.4)_0%,rgba(180,248,220,0.25)_45%,rgba(255,255,255,0)_80%)] bg-no-repeat dark:bg-[#0c0c0c] dark:bg-none`}
        >
          <div
            className={
              fullScreen
                ? 'h-full w-full'
                : `min-h-full w-full px-4 py-6 md:py-8 ${
                    wide ? 'md:px-5' : 'mx-auto max-w-[1440px] md:px-8'
                  }`
            }
          >
            {children}
          </div>
        </main>
        {/* <StudentProfileCompletionFloat /> */}
      </div>
    </OnboardingGate>
  );
}
