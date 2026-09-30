'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronRight, Menu, UserRound, Zap, Users, Settings } from 'lucide-react';
import { useCurrentUser } from '@/lib/candidate-identity';
import { signOut } from '@/lib/auth';
import { UserMenu } from '@smart/ui';

type Breadcrumb = { label: string; href?: string };

function getStudentBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === '/' || pathname === '/dashboard') {
    return [{ label: 'Dashboard' }];
  }

  const segments = pathname.split('/').filter(Boolean);
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
  onOpenMobileNav?: () => void;
};

export function StudentTopbar({ onOpenMobileNav = () => {} }: StudentTopbarProps = {}) {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const pathname = usePathname() || '/dashboard';
  const breadcrumbs = getStudentBreadcrumbs(pathname);

  const studentMenuItems = [
    { label: 'Profile', icon: UserRound, onClick: () => router.push('/public-profile') },
    { label: 'Upgrade Plan', icon: Zap, onClick: () => router.push('/profile') },
    { label: 'Refer Friends', icon: Users, onClick: () => router.push('/profile') },
    { label: 'Settings', icon: Settings, onClick: () => router.push('/profile') },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white px-6 font-sans antialiased select-none dark:border-zinc-800 dark:bg-[#111111]">
      <div className="flex h-full items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:hidden"
        >
          <Menu strokeWidth={1.5} className="size-5" />
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
        {/* 🔔 Notifications Bell Icon */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Bell className="size-4" strokeWidth={1.75} />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900" />
        </button>

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

export { StudentTopbar as Navbar };
