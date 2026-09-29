'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ChevronRight,
  Building2,
  Settings,
  Search,
  Zap,
  Users,
  PanelLeft,
} from 'lucide-react';
import { useCompanyAccount } from '@/lib/use-company-account';
import { signOut } from '@/lib/auth';
import { UserMenu } from '@smart/ui';

type Breadcrumb = { label: string; href?: string };

function getCompanyBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === '/' || pathname === '/overview') {
    return [{ label: 'Overview' }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Breadcrumb[] = [{ label: 'Home', href: '/' }];
  const first = segments[0] ?? '';

  if (first === 'jobs') {
    crumbs.push({ label: 'Job Openings', href: '/jobs' });
    if (segments[1] === 'new') crumbs.push({ label: 'Post a Job' });
    else if (segments[2] === 'edit') crumbs.push({ label: 'Edit Job' });
  } else if (first === 'applicants') {
    crumbs.push({ label: 'Applicants & Pipeline', href: '/applicants' });
  } else if (first === 'students' || first === 'candidates') {
    crumbs.push({ label: 'Search Candidates', href: '/students' });
  } else if (first === 'messages') {
    crumbs.push({ label: 'Messages', href: '/messages' });
  } else if (first === 'analytics') {
    crumbs.push({ label: 'Hiring Analytics', href: '/analytics' });
  } else if (first === 'team') {
    crumbs.push({ label: 'Teammates', href: '/team' });
  } else if (first === 'company' || first === 'profile') {
    crumbs.push({ label: 'Company Profile', href: '/company' });
  } else if (first === 'reviews') {
    crumbs.push({ label: 'Reviews', href: '/reviews' });
  } else if (first === 'billing') {
    crumbs.push({ label: 'Billing & Plan', href: '/billing' });
  } else if (first === 'settings') {
    crumbs.push({ label: 'Settings', href: '/settings' });
  } else {
    crumbs.push({
      label: first.charAt(0).toUpperCase() + first.slice(1).replace(/-/g, ' '),
    });
  }

  return crumbs;
}

export type CompanyTopbarProps = {
  onOpenMobileNav?: () => void;
};

export function CompanyTopbar({ onOpenMobileNav }: CompanyTopbarProps) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { data: account } = useCompanyAccount();

  const breadcrumbs = getCompanyBreadcrumbs(pathname);
  const companyName = account?.companyName || 'Employer Partner';
  const representativeName = account?.fullName || 'Representative';

  const companyMenuItems = [
    { label: 'Profile', icon: Building2, onClick: () => router.push('/company') },
    { label: 'Upgrade Plan', icon: Zap, onClick: () => router.push('/billing') },
    { label: 'Refer Friends', icon: Users, onClick: () => router.push('/team') },
    { label: 'Settings', icon: Settings, onClick: () => router.push('/settings') },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 backdrop-blur font-sans antialiased select-none md:px-6">
      {/* Left: Mobile Trigger & Breadcrumbs */}
      <div className="flex h-full items-center gap-3">
        {onOpenMobileNav ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Toggle navigation sidebar"
            title="Toggle sidebar"
            className="flex size-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            <PanelLeft className="size-4.5" />
          </button>
        ) : null}

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

      {/* Right: Quick Search, Notifications & Account Dropdown */}
      <div className="flex items-center gap-3">
        {/* Quick Talent Search Button */}
        <Link
          href="/students"
          className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Search className="size-3.5 text-zinc-400" />
          <span>Search candidates...</span>
        </Link>

        {/* 🔔 Notifications Bell Icon */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          <Bell className="size-4" strokeWidth={1.75} />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        {/* Employer User Avatar Dropdown */}
        <UserMenu
          user={{
            name: representativeName || companyName,
            email: account?.email ?? '',
            avatarUrl: null,
            role: 'COMPANY_ADMIN',
            organizationName: companyName,
          }}
          menuItems={companyMenuItems}
          onSignOut={() => void signOut()}
        />
      </div>
    </header>
  );
}
