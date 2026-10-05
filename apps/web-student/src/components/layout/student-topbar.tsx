'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  Settings,
  UserRound,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/candidate-identity';
import { NotificationsMenu } from './notifications-menu';
import { signOut } from '@/lib/auth';
import { UserMenu } from '@smart/ui';

type Breadcrumb = { label: string; href?: string };

function getStudentBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === '/' || pathname === '/student/dashboard') {
    return [{ label: 'Dashboard' }];
  }

  // Pages live under /student/…; the prefix itself is not a breadcrumb.
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'student') segments.shift();
  const crumbs: Breadcrumb[] = [];
  const first = segments[0] ?? '';

  if (first === 'jobs') crumbs.push({ label: 'Matches & Opportunities' });
  else if (first === 'profile') crumbs.push({ label: 'My Profile' });
  else if (first === 'skills') crumbs.push({ label: 'Skills' });
  else if (first === 'applications') crumbs.push({ label: 'Endorsement Tracking' });
  else if (first === 'assessments' || first === 'assessment') crumbs.push({ label: 'Assessments' });
  else if (first === 'interviews' || first === 'interview') crumbs.push({ label: 'Interviews' });
  else if (first === 'messages') crumbs.push({ label: 'Messages' });
  else {
    crumbs.push({
      label: first.charAt(0).toUpperCase() + first.slice(1).replace(/-/g, ' '),
    });
  }

  return crumbs;
}

export type StudentTopbarProps = {
  onToggleSidebar: () => void;
  collapsed?: boolean;
};

export function StudentTopbar({ onToggleSidebar, collapsed = true }: StudentTopbarProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const pathname = usePathname() || '/student/dashboard';
  const breadcrumbs = getStudentBreadcrumbs(pathname);

  const studentMenuItems = [
    { label: 'My profile', icon: UserRound, onClick: () => router.push('/student/profile') },
    { label: 'Public profile', icon: Globe, onClick: () => router.push('/student/public-profile') },
    { label: 'Settings', icon: Settings, onClick: () => router.push('/student/settings') },
  ];

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/80 px-4 font-sans antialiased backdrop-blur-md select-none sm:px-6 dark:border-zinc-800/80 dark:bg-[#111111]/80">
      <div className="flex h-full items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex size-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ToggleIcon className="size-4" strokeWidth={1.75} />
        </button>

        {/* Dynamic Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center">
          <ol className="flex items-center gap-1.5 text-xs sm:text-[13px]">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <li key={crumb.label + idx} className="flex items-center gap-1.5">
                  {idx > 0 && (
                    <ChevronRight className="size-3.5 text-zinc-400 shrink-0" aria-hidden />
                  )}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="font-medium text-zinc-500 hover:text-zinc-900 transition-colors truncate max-w-[120px] sm:max-w-none dark:text-zinc-400 dark:hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-zinc-900 truncate max-w-[160px] sm:max-w-none dark:text-white">
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <NotificationsMenu />

        {/* User Profile Menu (Avatar + Name + Email + Chevron trigger + Dropdown) */}
        <UserMenu
          user={{
            name: user?.fullName ?? 'Candidate',
            email: user?.email ?? '',
            avatarUrl: user?.profilePhotoUrl ?? null,
            role: 'STUDENT',
          }}
          menuItems={studentMenuItems}
          onSignOut={() => void signOut()}
        />
      </div>
    </header>
  );
}
