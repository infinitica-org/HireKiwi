'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, GraduationCap, Settings, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import type { AuthenticatedUser } from '@hirekiwi/contracts';
import { UserMenu } from '@hirekiwi/ui';
import { api } from '../lib/api';
import { signOut } from '../lib/auth';

type Breadcrumb = { label: string; href?: string };

function getBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === '/' || pathname === '/dashboard') {
    return [{ label: 'Dashboard' }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Breadcrumb[] = [];

  const first = segments[0] ?? '';
  if (['students', 'batches', 'whitelist', 'provisioning', 'onboarding'].includes(first)) {
    crumbs.push({ label: 'Candidates', href: '/students' });
    if (first === 'students') crumbs.push({ label: 'Students' });
    else if (first === 'batches') {
      if (segments.length > 1) {
        crumbs.push({ label: 'Batches', href: '/batches' });
        crumbs.push({ label: 'Batch Details' });
      } else {
        crumbs.push({ label: 'Batches' });
      }
    } else if (first === 'whitelist') crumbs.push({ label: 'Whitelist' });
    return crumbs;
  }

  if (
    ['openings', 'companies', 'opportunities', 'suggestions', 'review', 'company', 'ats'].includes(
      first,
    )
  ) {
    crumbs.push({ label: 'Placement', href: '/openings' });
    if (first === 'openings') {
      if (segments[1] === 'create') {
        crumbs.push({ label: 'Openings', href: '/openings' });
        crumbs.push({ label: 'Create Opening' });
      } else {
        crumbs.push({ label: 'Openings' });
      }
    } else if (first === 'companies') {
      if (segments.length > 1) {
        crumbs.push({ label: 'Companies', href: '/companies' });
        crumbs.push({ label: 'Company Profile' });
      } else {
        crumbs.push({ label: 'Companies' });
      }
    } else if (first === 'opportunities') crumbs.push({ label: 'Opportunities' });
    else if (first === 'suggestions') crumbs.push({ label: 'Suggestions' });
    else if (first === 'review') crumbs.push({ label: 'Review' });
    return crumbs;
  }

  if (first === 'reports') return [{ label: 'Reports & Analytics' }];
  if (first === 'calendar') return [{ label: 'Placement Calendar' }];
  if (first === 'settings') return [{ label: 'Settings' }];
  if (first === 'school-profile') return [{ label: 'School Profile' }];
  if (first === 'skill-verification') return [{ label: 'Skill Verification' }];
  if (first === 'work-experience-verification') return [{ label: 'Work Experience Verification' }];

  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: i < segments.length - 1 ? `/${segments.slice(0, i + 1).join('/')}` : undefined,
  }));
}

type TpoTopbarProps = {
  onToggleSidebar: () => void;
  collapsed?: boolean;
};

export function TpoTopbar({ onToggleSidebar, collapsed = true }: TpoTopbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.auth
      .me()
      .then((res) => {
        if (!cancelled) setUser(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const pathname = usePathname() || '/';
  const breadcrumbs = getBreadcrumbs(pathname);

  const tpoMenuItems = [
    { label: 'Profile', icon: GraduationCap, onClick: () => router.push('/school-profile') },
    { label: 'Settings', icon: Settings, onClick: () => router.push('/settings') },
  ];

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-6 font-sans antialiased select-none dark:border-zinc-800/80 dark:bg-[#111111]/80">
      <div className="flex h-full items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex size-8 items-center justify-center rounded-md  text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ToggleIcon className="size-4 text-zinc-600 dark:text-zinc-300" strokeWidth={1.75} />
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
                      className="font-medium text-zinc-500 hover:text-zinc-900 transition-colors truncate max-w-[120px] sm:max-w-none"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-zinc-900 truncate max-w-[160px] sm:max-w-none">
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* User Profile Menu */}
        <UserMenu
          user={{
            name: user?.fullName ?? 'Pilot TPO',
            email: user?.email ?? 'tpo@institution.edu',
            avatarUrl: null,
            role: 'INSTITUTION_ADMIN',
          }}
          menuItems={tpoMenuItems}
          onSignOut={() => void signOut()}
        />
      </div>
    </header>
  );
}
