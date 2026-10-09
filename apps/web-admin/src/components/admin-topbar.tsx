'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Activity,
  ChevronRight,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  UserCog,
} from 'lucide-react';
import type { AuthenticatedUser } from '@hirekiwi/contracts';
import { SearchDialog } from './search-dialog';
import { UserMenu } from '@hirekiwi/ui';

import { api } from '../lib/api';
import { signOut } from '../lib/auth';
import { sidebarItems } from '../navigation/sidebar-items';

type Breadcrumb = { label: string; href?: string };

function getAdminBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === '/admin' || pathname === '/admin/') {
    return [{ label: 'Admin Console' }];
  }

  const crumbs: Breadcrumb[] = [{ label: 'Admin', href: '/admin' }];

  for (const group of sidebarItems) {
    for (const item of group.items) {
      if (item.url !== '/admin' && (pathname === item.url || pathname.startsWith(`${item.url}/`))) {
        crumbs.push({ label: group.label });
        crumbs.push({ label: item.title, href: item.url });
        return crumbs;
      }
    }
  }

  const segments = pathname.replace('/admin', '').split('/').filter(Boolean);
  for (const seg of segments) {
    crumbs.push({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    });
  }

  return crumbs;
}

type AdminTopbarProps = {
  onToggleSidebar: () => void;
  collapsed?: boolean;
};

export function AdminTopbar({ onToggleSidebar, collapsed = true }: AdminTopbarProps) {
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

  const pathname = usePathname() || '/admin';
  const breadcrumbs = getAdminBreadcrumbs(pathname);

  const adminMenuItems = [
    {
      label: 'Platform admins',
      icon: UserCog,
      onClick: () => router.push('/admin/platform-admins'),
    },
    { label: 'Audit log', icon: ScrollText, onClick: () => router.push('/admin/audit') },
    { label: 'Plans', icon: CreditCard, onClick: () => router.push('/admin/plans') },
    { label: 'System health', icon: Activity, onClick: () => router.push('/admin/health') },
  ];

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/80 px-4 font-sans antialiased backdrop-blur-md select-none sm:px-6">
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

      <div className="flex items-center gap-3">
        <SearchDialog />

        {/* Audit Log Link */}
        <Link
          href="/admin/audit"
          className="text-[13px] font-medium text-zinc-800 hover:text-black transition-colors hidden sm:inline-block"
        >
          Audit Log
        </Link>

        {/* User Profile Menu */}
        <UserMenu
          user={{
            name: user?.fullName ?? 'Platform Admin',
            email: user?.email ?? 'admin@hirekiwi.local',
            avatarUrl: null,
            role: 'SUPER_ADMIN',
          }}
          menuItems={adminMenuItems}
          onSignOut={() => void signOut()}
        />
      </div>
    </header>
  );
}
