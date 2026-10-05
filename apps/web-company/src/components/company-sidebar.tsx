'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Settings, X, type LucideIcon } from 'lucide-react';
import { cn, useUnreadMessageCount, SidebarLegalLinks } from '@smart/ui';

import smartLogoImg from '@smart/ui/assets/images/Logos/WebP/Smart-logo.png';
import { companyNavItems } from '@/navigation/sidebar-items';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3005';

export interface CompanySidebarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  collapsed?: boolean;
  className?: string;
}

function isItemActive(pathname: string, url: string): boolean {
  if (url === '/') return pathname === '/';
  return pathname === url || pathname.startsWith(`${url}/`);
}

/** Same nav item chrome as the TPO console sidebar (tpo-sidebar.tsx). */
function navItemClass(isExpanded: boolean, isActive: boolean) {
  return cn(
    'flex items-center rounded-md transition-all duration-200 ease-out hover:translate-x-0.5 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-x-0 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900',
    !isExpanded ? 'size-10 justify-center' : 'w-full gap-3 px-3 py-2 text-sm font-medium',
    isActive
      ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-2xs'
      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
  );
}

function NavIcon({ icon: Icon, isActive }: { icon: LucideIcon; isActive: boolean }) {
  return (
    <Icon
      className={cn(
        'size-4.5 shrink-0 transition-all duration-200 group-hover:scale-110 motion-reduce:transition-none',
        isActive ? 'stroke-[2.2] text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-700',
      )}
    />
  );
}

export function CompanySidebar({
  mobileOpen = false,
  onMobileOpenChange = () => {},
  collapsed = true,
  className,
}: CompanySidebarProps = {}) {
  const pathname = usePathname() || '/';
  const unreadMessages = useUnreadMessageCount();
  const [isHovered, setIsHovered] = useState(false);

  // On mobile the drawer is always shown at full width.
  const isExpanded = !collapsed || isHovered || mobileOpen;

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onMobileOpenChange(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onMobileOpenChange]);

  const settingsActive = isItemActive(pathname, '/settings');

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => onMobileOpenChange(false)}
        />
      ) : null}

      <aside
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? 'true' : undefined}
        aria-label="Company portal sidebar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-zinc-200/80 bg-white font-sans transition-all duration-300 ease-in-out select-none lg:translate-x-0',
          isExpanded ? 'w-64 items-start' : 'w-16 items-center',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className,
        )}
      >
        {/* Logo row — aligns with the h-14 topbar */}
        <div
          className={cn(
            'flex h-14 w-full shrink-0 items-center border-b border-zinc-200/80 transition-all duration-200',
            !isExpanded ? 'justify-center px-0' : 'justify-between px-3.5',
          )}
        >
          <Link
            href="/"
            aria-label="SMART home"
            title="SMART Company Portal"
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
              onClick={() => onMobileOpenChange(false)}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <nav
          className="w-full flex-1 overflow-y-auto overscroll-contain px-2 py-3"
          aria-label="Company portal navigation"
        >
          <ul className="space-y-1">
            {companyNavItems.map((item) => {
              const isActive = isItemActive(pathname, item.url);
              const showUnread = item.url === '/messages' && unreadMessages > 0;
              return (
                <li
                  key={item.url}
                  className={cn('flex', !isExpanded ? 'justify-center' : 'w-full')}
                >
                  <Link
                    href={item.url}
                    onClick={() => onMobileOpenChange(false)}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.title}
                    className={cn(navItemClass(isExpanded, isActive), 'relative')}
                  >
                    <NavIcon icon={item.icon} isActive={isActive} />
                    {isExpanded ? <span className="truncate">{item.title}</span> : null}
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
                          className="absolute right-1.5 top-1.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white"
                        />
                      )
                    ) : null}
                    {item.badge && isExpanded ? (
                      <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          className={cn(
            'flex w-full shrink-0 flex-col gap-1 border-t border-zinc-200/80 py-3',
            !isExpanded ? 'items-center px-1.5' : 'px-2',
          )}
        >
          <Link
            href="/settings"
            onClick={() => onMobileOpenChange(false)}
            aria-current={settingsActive ? 'page' : undefined}
            title="Settings"
            className={navItemClass(isExpanded, settingsActive)}
          >
            <NavIcon icon={Settings} isActive={settingsActive} />
            {isExpanded ? <span className="truncate">Settings</span> : null}
          </Link>
          <SidebarLegalLinks authUrl={AUTH_URL} expanded={isExpanded} />
        </div>
      </aside>
    </>
  );
}
