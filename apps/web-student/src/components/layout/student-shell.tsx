'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@hirekiwi/ui';
import { StudentSidebar } from './student-sidebar';
import { StudentTopbar } from './student-topbar';
import { OnboardingGate } from './OnboardingGate';
// import { StudentProfileCompletionFloat } from '@/components/profile/ProfileCompletionFloat';

/** Same frame as the TPO console (apps/web-tpo/src/components/tpo-shell.tsx). */
export function StudentShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileNavOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <OnboardingGate>
      <div className="student-console flex h-screen overflow-hidden bg-white font-sans text-zinc-900 antialiased select-none dark:bg-[#0c0c0c] dark:text-zinc-100">
        <StudentSidebar
          mobileOpen={mobileNavOpen}
          onMobileOpenChange={setMobileNavOpen}
          collapsed={collapsed}
        />
        <div
          className={cn(
            'relative flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-200',
            collapsed ? 'lg:pl-16' : 'lg:pl-64',
          )}
        >
          <StudentTopbar onToggleSidebar={handleToggleSidebar} collapsed={collapsed} />
          {/* TPO canvas: white with a soft lime→mint glow at the top (plain in dark mode). */}
          <main className="w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-white bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(225,255,160,0.4)_0%,rgba(180,248,220,0.25)_45%,rgba(255,255,255,0)_80%)] bg-no-repeat dark:bg-[#0c0c0c] dark:bg-none">
            <div className="mx-auto min-h-full w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </div>
        {/* <StudentProfileCompletionFloat /> */}
      </div>
    </OnboardingGate>
  );
}
