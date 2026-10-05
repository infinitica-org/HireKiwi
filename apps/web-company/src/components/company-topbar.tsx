'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight,
  Building2,
  Settings,
  CreditCard,
  UserRound,
  Users,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import { useCompanyAccount } from '@/lib/use-company-account';
import { signOut } from '@/lib/auth';
import { NotificationsMenu, UserMenu } from '@smart/ui';

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
  onToggleSidebar: () => void;
  collapsed?: boolean;
};

export function CompanyTopbar({ onToggleSidebar, collapsed = true }: CompanyTopbarProps) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { data: account } = useCompanyAccount();

  const breadcrumbs = getCompanyBreadcrumbs(pathname);
  const companyName = account?.companyName || 'Employer Partner';
  const representativeName = account?.fullName || 'Representative';

  const companyMenuItems = [
    { label: 'My account', icon: UserRound, onClick: () => router.push('/account') },
    { label: 'Company profile', icon: Building2, onClick: () => router.push('/company') },
    { label: 'Team', icon: Users, onClick: () => router.push('/team') },
    { label: 'Billing & plan', icon: CreditCard, onClick: () => router.push('/billing') },
    { label: 'Settings', icon: Settings, onClick: () => router.push('/settings') },
  ];

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-md font-sans antialiased select-none sm:px-6">
      {/* Left: Sidebar Toggle & Breadcrumbs */}
      <div className="flex h-full items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex size-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          <ToggleIcon className="size-4 text-zinc-600" strokeWidth={1.75} />
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

      {/* Right: Quick Search, Notifications & Account Dropdown */}
      <div className="flex items-center gap-3">
        {/* Notifications: shared bell + pop-up (GET /me/notifications) */}
        <NotificationsMenu
          onNavigate={(path) => router.push(path)}
          emptyHint="New applicants, campus access updates and messages show up here."
        />

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
