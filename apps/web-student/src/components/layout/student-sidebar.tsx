'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Brain,
  BriefcaseBusiness,
  CircleUserRound,
  ClipboardCheck,
  Compass,
  House,
  MessagesSquare,
  NotebookPen,
  Settings,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn, useUnreadMessageCount, SidebarLegalLinks } from '@smart/ui';
import smartLogoImg from '@smart/ui/assets/images/Logos/WebP/Smart-logo.png';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3005';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

// Pages live under /student/… (root paths redirect there), so link and match on the real paths.
const navItems: NavItem[] = [
  { name: 'Home', href: '/student/dashboard', icon: House },
  { name: 'Messages', href: '/student/messages', icon: MessagesSquare },
  { name: 'Jobs', href: '/student/matches', icon: BriefcaseBusiness },
  { name: 'Opportunities', href: '/student/opportunities', icon: Compass },
  { name: 'My profile', href: '/student/profile', icon: CircleUserRound },
  { name: 'Skills', href: '/student/skills', icon: Brain },
  { name: 'Endorsement tracking', href: '/student/applications', icon: ClipboardCheck },
  { name: 'Assessments', href: '/student/assessments', icon: NotebookPen },
  { name: 'Interviews', href: '/student/interviews', icon: Video },
];

const settingsItem: NavItem = { name: 'Settings', href: '/student/settings', icon: Settings };

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Same nav item chrome as the TPO console sidebar (tpo-sidebar.tsx). */
function navItemClass(isExpanded: boolean, isActive: boolean) {
  return cn(
    'group relative flex items-center rounded-md transition-all duration-200 ease-out hover:translate-x-0.5 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-x-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900',
    isExpanded ? 'w-full gap-3 px-3 py-2 text-sm font-medium' : 'size-10 justify-center',
    isActive
      ? 'bg-zinc-100 font-semibold text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white'
      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white',
  );
}

function NavIcon({ icon: Icon, isActive }: { icon: LucideIcon; isActive: boolean }) {
  return (
    <Icon
      className={cn(
        'size-4.5 shrink-0 transition-all duration-200 group-hover:scale-110 motion-reduce:transition-none',
        isActive
          ? 'stroke-[2.2] text-zinc-900 dark:text-white'
          : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300',
      )}
    />
  );
}

export type StudentSidebarProps = {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  collapsed?: boolean;
};

export function StudentSidebar({
  mobileOpen,
  onMobileOpenChange,
  collapsed = true,
}: StudentSidebarProps) {
  const pathname = usePathname();
  const unreadMessages = useUnreadMessageCount();
  const [isHovered, setIsHovered] = useState(false);

  // Mobile drawer always shows labels; on desktop the rail expands on hover or when pinned open.
  const isExpanded = mobileOpen || !collapsed || isHovered;
  const closeMobileNav = () => onMobileOpenChange(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onMobileOpenChange(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onMobileOpenChange]);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={closeMobileNav}
        />
      ) : null}

      <aside
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? 'true' : undefined}
        aria-label="Student console sidebar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-zinc-200/80 bg-white font-sans transition-all duration-300 ease-in-out select-none dark:border-zinc-800 dark:bg-[#111111] lg:translate-x-0',
          isExpanded ? 'w-64 items-start' : 'w-16 items-center',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo row — aligns with the h-14 topbar */}
        <div
          className={cn(
            'flex h-14 w-full shrink-0 items-center border-b border-zinc-200/80 transition-all duration-200 dark:border-zinc-800/80',
            isExpanded ? 'justify-between px-3.5' : 'justify-center px-0',
          )}
        >
          <Link
            href="/student/dashboard"
            aria-label="SMART home"
            title="SMART"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            <Image
              src={smartLogoImg}
              alt="SMART logo"
              width={28}
              height={28}
              priority
              className="h-7 w-7 shrink-0 object-contain"
            />
          </Link>

          {mobileOpen ? (
            <button
              type="button"
              aria-label="Close menu"
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 lg:hidden"
              onClick={closeMobileNav}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <nav
          className="w-full flex-1 overflow-y-auto overscroll-contain px-2 py-3"
          aria-label="Student console"
        >
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = isItemActive(pathname, item.href);
              const showUnread = item.href === '/student/messages' && unreadMessages > 0;
              return (
                <li
                  key={item.href}
                  className={cn('flex', isExpanded ? 'w-full' : 'justify-center')}
                >
                  <Link
                    href={item.href}
                    onClick={closeMobileNav}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.name}
                    className={navItemClass(isExpanded, isActive)}
                  >
                    <NavIcon icon={item.icon} isActive={isActive} />
                    {isExpanded ? <span className="truncate">{item.name}</span> : null}
                    {showUnread ? (
                      isExpanded ? (
                        <span
                          aria-label={`${unreadMessages} unread messages`}
                          className="ml-auto rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold text-white"
                        >
                          {unreadMessages > 99 ? '99+' : unreadMessages}
                        </span>
                      ) : (
                        <span
                          aria-label={`${unreadMessages} unread messages`}
                          className="absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111111]"
                        />
                      )
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom stack: verification progress, Settings, legal links */}
        <div
          className={cn(
            'flex w-full shrink-0 flex-col gap-2 border-t border-zinc-200/80 py-3 dark:border-zinc-800/80',
            isExpanded ? 'px-2' : 'items-center px-1.5',
          )}
        >
          {(() => {
            const isActive = isItemActive(pathname, settingsItem.href);
            return (
              <Link
                href={settingsItem.href}
                onClick={closeMobileNav}
                aria-current={isActive ? 'page' : undefined}
                title={settingsItem.name}
                className={navItemClass(isExpanded, isActive)}
              >
                <NavIcon icon={settingsItem.icon} isActive={isActive} />
                {isExpanded ? <span className="truncate">{settingsItem.name}</span> : null}
              </Link>
            );
          })()}

          <SidebarLegalLinks authUrl={AUTH_URL} expanded={isExpanded} />
        </div>
      </aside>
    </>
  );
}
