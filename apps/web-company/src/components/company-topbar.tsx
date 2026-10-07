'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ChevronDown,
  CreditCard,
  FileText,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { NotificationsMenu, UserMenu, cn, useUnreadMessageCount } from '@hirekiwi/ui';
import hirekiwiLogoImg from '@hirekiwi/ui/assets/images/Logos/WebP/HireKiwi-logo.png';
import { signOut } from '@/lib/auth';
import { useCompanyAccount } from '@/lib/use-company-account';
import { companyNavItems, isCompanyNavActive } from '@/navigation/sidebar-items';

const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3005').replace(/\/+$/, '');

const MOBILE_NAV = [
  ...companyNavItems,
  { title: 'Settings', url: '/settings', icon: Settings } as (typeof companyNavItems)[number],
];

/** Links tucked under Applicants: they open from its hover menu instead of sitting in the bar. */
const APPLICANTS_MENU_URLS = ['/students'];
const APPLICANTS_MENU = companyNavItems.filter((item) => APPLICANTS_MENU_URLS.includes(item.url));
const BAR_NAV = companyNavItems.filter((item) => !APPLICANTS_MENU_URLS.includes(item.url));

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-white';

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread messages`}
      className="ml-0.5 rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold leading-5 text-white"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** Single-row console header, matching the TPO console: logo, centred navigation, account actions. */
export function CompanyTopbar() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { data: account } = useCompanyAccount();
  const unreadMessages = useUnreadMessageCount();
  const [menuOpen, setMenuOpen] = useState(false);

  // A route change (or Escape) closes the mobile menu.
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const companyName = account?.companyName || 'Employer Partner';
  const representativeName = account?.fullName || 'Representative';
  const settingsActive = isCompanyNavActive(pathname, '/settings');
  const messagesActive = isCompanyNavActive(pathname, '/messages');

  const openLegal = (path: '/privacy' | '/terms') =>
    window.open(`${AUTH_URL}${path}`, '_blank', 'noopener,noreferrer');

  const companyMenuItems = [
    { label: 'My account', icon: UserRound, onClick: () => router.push('/account') },
    { label: 'Company profile', icon: Building2, onClick: () => router.push('/company') },
    { label: 'Team', icon: Users, onClick: () => router.push('/team') },
    { label: 'Billing & plan', icon: CreditCard, onClick: () => router.push('/billing') },
    { label: 'Settings', icon: Settings, onClick: () => router.push('/settings') },
    { label: 'Privacy Policy', icon: Shield, onClick: () => openLegal('/privacy') },
    { label: 'Terms & Conditions', icon: FileText, onClick: () => openLegal('/terms') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 font-sans antialiased select-none">
      <div className="relative border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 xl:gap-5">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="company-mobile-nav"
              className={cn(
                'flex size-9 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 xl:hidden',
                focusRing,
              )}
            >
              {menuOpen ? (
                <X className="size-[18px]" strokeWidth={1.75} />
              ) : (
                <Menu className="size-[18px]" strokeWidth={1.75} />
              )}
            </button>

            <Link
              href="/"
              aria-label="HireKiwi home"
              title="HireKiwi Portal"
              className={cn('group flex shrink-0 items-center gap-3 rounded-xl', focusRing)}
            >
              <Image
                src={hirekiwiLogoImg}
                alt="HireKiwi logo"
                width={34}
                height={34}
                priority
                className="h-10 w-9 object-contain"
              />
              <span className="text-lg font-bold tracking-tight text-zinc-900">HireKiwi</span>
            </Link>

            <nav aria-label="Company portal navigation" className="hidden xl:block">
              <ul className="flex items-center gap-1">
                {BAR_NAV.map((item) => {
                  const hasMenu = item.url === '/applicants';
                  const childActive = hasMenu
                    ? APPLICANTS_MENU.some((child) => isCompanyNavActive(pathname, child.url))
                    : false;
                  const active = isCompanyNavActive(pathname, item.url) || childActive;
                  const Icon = item.icon;
                  return (
                    <li key={item.url} className={hasMenu ? 'group relative' : undefined}>
                      <Link
                        href={item.url}
                        aria-current={isCompanyNavActive(pathname, item.url) ? 'page' : undefined}
                        aria-haspopup={hasMenu ? 'menu' : undefined}
                        className={cn(
                          'flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-sm no-underline transition-colors duration-200 motion-reduce:transition-none',
                          // Thin (1px) underline on hover, set a little below the text.
                          'underline-offset-[4px] decoration-1 decoration-zinc-900 hover:underline',
                          focusRing,
                          active
                            ? 'font-semibold text-zinc-900 underline'
                            : 'text-zinc-600 hover:text-zinc-900',
                        )}
                      >
                        <Icon
                          className="size-4 shrink-0 opacity-70"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        {item.title}
                        {item.url === '/messages' ? <UnreadBadge count={unreadMessages} /> : null}
                        {hasMenu ? (
                          <ChevronDown
                            className="size-3.5 transition-transform group-focus-within:rotate-180 group-hover:rotate-180"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                        ) : null}
                      </Link>
                      {hasMenu ? (
                        <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                          <ul
                            role="menu"
                            aria-label="Applicants menu"
                            className="min-w-48 rounded-md border border-zinc-200/80 bg-white p-1.5 shadow-lg"
                          >
                            {APPLICANTS_MENU.map((child) => {
                              const ChildIcon = child.icon;
                              const childIsActive = isCompanyNavActive(pathname, child.url);
                              return (
                                <li key={child.url} role="none">
                                  <Link
                                    href={child.url}
                                    role="menuitem"
                                    aria-current={childIsActive ? 'page' : undefined}
                                    className={cn(
                                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm no-underline transition-colors',
                                      focusRing,
                                      childIsActive
                                        ? 'bg-zinc-100 font-medium text-zinc-900'
                                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                                    )}
                                  >
                                    <ChildIcon
                                      className="size-4 shrink-0 text-zinc-400"
                                      strokeWidth={1.75}
                                    />
                                    {child.title}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
            <Link
              href="/messages"
              aria-label={
                unreadMessages > 0 ? `Messages, ${String(unreadMessages)} unread` : 'Messages'
              }
              title="Messages"
              aria-current={messagesActive ? 'page' : undefined}
              className={cn(
                'relative flex size-9 items-center justify-center rounded-xl border transition-colors',
                focusRing,
                messagesActive
                  ? 'border-zinc-200 bg-white text-zinc-900 shadow-sm'
                  : 'border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
              )}
            >
              <MessageSquare className="size-[18px]" strokeWidth={1.75} />
              {unreadMessages > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white dark:ring-[#0c0c0c]"
                >
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              ) : null}
            </Link>
            <NotificationsMenu
              onNavigate={(path) => router.push(path)}
              emptyHint="New applicants, campus access updates and messages show up here."
            />
            <Link
              href="/settings"
              aria-label="Settings"
              title="Settings"
              aria-current={settingsActive ? 'page' : undefined}
              className={cn(
                'hidden size-9 items-center justify-center rounded-xl border transition-colors xl:flex',
                focusRing,
                settingsActive
                  ? 'border-zinc-200 bg-white text-zinc-900 shadow-sm'
                  : 'border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
              )}
            >
              <Settings className="size-[18px]" strokeWidth={1.75} />
            </Link>
            <UserMenu
              variant="detailed"
              roleLabel={companyName}
              user={{
                name: representativeName,
                email: account?.email ?? '',
                avatarUrl: null,
                role: 'COMPANY_ADMIN',
                organizationName: companyName,
              }}
              menuItems={companyMenuItems}
              onSignOut={() => void signOut()}
            />
          </div>
        </div>

        {menuOpen ? (
          <>
            <button
              type="button"
              aria-label="Dismiss navigation menu"
              tabIndex={-1}
              className="fixed inset-0 top-16 -z-10 bg-zinc-900/30 xl:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <nav
              id="company-mobile-nav"
              aria-label="Company portal navigation (mobile)"
              className="absolute inset-x-0 top-full border-b border-zinc-200/80 bg-white p-2 shadow-lg xl:hidden"
            >
              <ul className="grid gap-1 sm:grid-cols-2">
                {MOBILE_NAV.map((item) => {
                  const active = isCompanyNavActive(pathname, item.url);
                  const Icon = item.icon;
                  return (
                    <li key={item.url}>
                      <Link
                        href={item.url}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                          focusRing,
                          active
                            ? 'border-zinc-200 bg-white font-medium text-zinc-900 shadow-sm'
                            : 'border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
                        {item.title}
                        {item.url === '/messages' ? <UnreadBadge count={unreadMessages} /> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </>
        ) : null}
      </div>
    </header>
  );
}
