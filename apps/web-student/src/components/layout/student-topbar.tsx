'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  FileText,
  Globe,
  Menu,
  MessageSquareText,
  Settings,
  Shield,
  UserRound,
  X,
} from 'lucide-react';
import { UserMenu, cn, useUnreadMessageCount } from '@hirekiwi/ui';
import hirekiwiLogoImg from '@hirekiwi/ui/assets/images/Logos/WebP/HireKiwi-logo.png';
import { useCurrentUser } from '@/lib/candidate-identity';
import { signOut } from '@/lib/auth';
import {
  STUDENT_NAV,
  STUDENT_NAV_FLAT,
  STUDENT_SETTINGS_LINK,
  isStudentNavActive,
  isStudentNavItemLit,
} from '@/lib/student-nav';
import { NotificationsMenu } from './notifications-menu';

const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3005').replace(/\/+$/, '');

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

/** Single-row console header, matching the TPO console: logo and navigation left, account actions right. */
export function StudentTopbar() {
  const router = useRouter();
  const pathname = usePathname() || '/student/dashboard';
  const { data: user } = useCurrentUser();
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

  const settingsActive = isStudentNavActive(pathname, STUDENT_SETTINGS_LINK.href);
  const messagesActive = isStudentNavActive(pathname, '/student/messages');

  const openLegal = (path: '/privacy' | '/terms') =>
    window.open(`${AUTH_URL}${path}`, '_blank', 'noopener,noreferrer');

  const studentMenuItems = [
    { label: 'Public profile', icon: Globe, onClick: () => router.push('/student/public-profile') },
    { label: 'Privacy Policy', icon: Shield, onClick: () => openLegal('/privacy') },
    { label: 'Terms & Conditions', icon: FileText, onClick: () => openLegal('/terms') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 font-sans antialiased select-none">
      <div className="relative border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-[#111111]/90">
        <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:gap-5">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="student-mobile-nav"
              className={cn(
                'flex size-9 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800',
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
              href="/student/dashboard"
              aria-label="HireKiwi home"
              title="HireKiwi"
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
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                HireKiwi
              </span>
            </Link>

            <nav aria-label="Student navigation" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {STUDENT_NAV.map((item) => {
                  const hasMenu = (item.children?.length ?? 0) > 0;
                  const lit = isStudentNavItemLit(pathname, item);
                  const Icon = item.icon;
                  return (
                    <li key={item.href} className={hasMenu ? 'group relative' : undefined}>
                      <Link
                        href={item.href}
                        aria-current={isStudentNavActive(pathname, item.href) ? 'page' : undefined}
                        aria-haspopup={hasMenu ? 'menu' : undefined}
                        className={cn(
                          'flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-sm no-underline transition-colors duration-200 motion-reduce:transition-none',
                          focusRing,
                          lit
                            ? 'font-semibold text-zinc-900 dark:text-white'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
                        )}
                      >
                        <Icon
                          className="size-4 shrink-0 opacity-70"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        {item.name}
                        {item.href === '/student/messages' ? (
                          <UnreadBadge count={unreadMessages} />
                        ) : null}
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
                            aria-label={`${item.name} menu`}
                            className="min-w-52 rounded-md border border-zinc-200/80 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-[#111111]"
                          >
                            {item.children?.map((child) => {
                              const ChildIcon = child.icon;
                              const childActive = isStudentNavActive(pathname, child.href);
                              return (
                                <li key={child.href} role="none">
                                  <Link
                                    href={child.href}
                                    role="menuitem"
                                    aria-current={childActive ? 'page' : undefined}
                                    className={cn(
                                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm no-underline transition-colors',
                                      focusRing,
                                      childActive
                                        ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white'
                                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white',
                                    )}
                                  >
                                    <ChildIcon
                                      className="size-4 shrink-0 text-zinc-400"
                                      strokeWidth={1.75}
                                    />
                                    {child.name}
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
              href="/student/messages"
              aria-label={
                unreadMessages > 0 ? `Messages, ${String(unreadMessages)} unread` : 'Messages'
              }
              title="Messages"
              aria-current={messagesActive ? 'page' : undefined}
              className={cn(
                'relative flex h-9 items-center justify-center gap-2 rounded-xl border px-2.5 text-sm transition-colors sm:px-3',
                focusRing,
                messagesActive
                  ? 'border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white'
                  : 'border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white',
              )}
            >
              <MessageSquareText className="size-[18px]" strokeWidth={1.75} />
              <span className="hidden sm:inline">Messages</span>
              {unreadMessages > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white dark:ring-[#0c0c0c]"
                >
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              ) : null}
            </Link>
            <NotificationsMenu />
            <Link
              href={STUDENT_SETTINGS_LINK.href}
              aria-label="Settings"
              title="Settings"
              aria-current={settingsActive ? 'page' : undefined}
              className={cn(
                'hidden size-9 items-center justify-center rounded-xl border transition-colors lg:flex',
                focusRing,
                settingsActive
                  ? 'border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white'
                  : 'border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white',
              )}
            >
              <Settings className="size-[18px]" strokeWidth={1.75} />
            </Link>
            <UserMenu
              variant="detailed"
              roleLabel="Student"
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
        </div>

        {menuOpen ? (
          <>
            <button
              type="button"
              aria-label="Dismiss navigation menu"
              tabIndex={-1}
              className="fixed inset-0 top-14 -z-10 bg-zinc-900/30 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <nav
              id="student-mobile-nav"
              aria-label="Student navigation (mobile)"
              className="absolute inset-x-0 top-full max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-zinc-200/80 bg-white p-2 shadow-lg lg:hidden dark:border-zinc-800 dark:bg-[#111111]"
            >
              <ul className="grid gap-1 sm:grid-cols-2">
                {STUDENT_NAV_FLAT.map((link) => {
                  const active = isStudentNavActive(pathname, link.href);
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                          focusRing,
                          active
                            ? 'border-zinc-200 bg-white font-medium text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white'
                            : 'border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60',
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
                        {link.name}
                        {link.href === '/student/messages' ? (
                          <UnreadBadge count={unreadMessages} />
                        ) : null}
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
