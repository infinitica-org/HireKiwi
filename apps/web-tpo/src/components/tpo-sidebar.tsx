'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { cn, SidebarLegalLinks } from '@smart/ui';

import smartLogoImg from '@smart/ui/assets/images/Logos/WebP/Smart-logo.png';
import { isNavLinkActive, isPlacementTopNavActive } from '../lib/tpo-nav';
import {
  LayoutDashboard,
  GraduationCap,
  ShieldCheck,
  Building2,
  BarChart3,
  Handshake,
  Settings,
  type LucideIcon,
} from 'lucide-react';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3005';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const mainNav: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: GraduationCap },
  { name: 'Whitelist', href: '/whitelist', icon: ShieldCheck },
  { name: 'Employers', href: '/companies', icon: Building2 },
  { name: 'Campus access', href: '/campus', icon: Handshake },

  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

function isSidebarItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') return pathname === '/' || pathname === '/dashboard';
  if (item.name === 'Employers') return isPlacementTopNavActive(pathname);
  if (item.name === 'Students') {
    return (
      isNavLinkActive(pathname, '/students') ||
      isNavLinkActive(pathname, '/batches') ||
      pathname.startsWith('/work-experience-verification') ||
      pathname.startsWith('/skill-verification')
    );
  }
  if (item.name === 'Whitelist') {
    return (
      isNavLinkActive(pathname, '/whitelist') ||
      isNavLinkActive(pathname, '/onboarding') ||
      isNavLinkActive(pathname, '/provisioning')
    );
  }
  return isNavLinkActive(pathname, item.href);
}

type TpoSidebarProps = {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function TpoSidebar({ mobileOpen, onMobileOpenChange, collapsed = true }: TpoSidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = !collapsed || isHovered;

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
          onClick={() => onMobileOpenChange(false)}
        />
      ) : null}

      <aside
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? 'true' : undefined}
        aria-label="University console sidebar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-zinc-200/80 bg-white font-sans transition-all duration-300 ease-in-out select-none dark:border-zinc-800 dark:bg-[#111111] lg:translate-x-0',
          isExpanded ? 'w-64 items-start' : 'w-16 items-center',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Top Logo Badge Header - Aligns with Topbar h-14 */}
        <div
          className={cn(
            'flex h-14 w-full shrink-0 items-center border-b border-zinc-200/80 transition-all duration-200 dark:border-zinc-800/80',
            !isExpanded ? 'justify-center px-0' : 'justify-between px-3.5',
          )}
        >
          <Link
            href="/"
            aria-label="SMART home"
            title="SMART Portal"
            className="flex items-center gap-2.5"
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

          {/* Mobile Close Button */}
          {mobileOpen && (
            <button
              type="button"
              aria-label="Close menu"
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 lg:hidden"
              onClick={() => onMobileOpenChange(false)}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          className="flex-1 overflow-y-auto overscroll-contain py-3 w-full px-2"
          aria-label="University console"
        >
          <ul className="space-y-1">
            {mainNav.map((item) => {
              const isActive = isSidebarItemActive(pathname, item);
              const Icon = item.icon;
              return (
                <li
                  key={item.name}
                  className={cn('flex', !isExpanded ? 'justify-center' : 'w-full')}
                >
                  <Link
                    href={item.href}
                    onClick={() => onMobileOpenChange(false)}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.name}
                    className={cn(
                      'flex items-center rounded-md transition-all duration-200 ease-out hover:translate-x-0.5 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-x-0 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900',
                      !isExpanded
                        ? 'size-10 justify-center'
                        : 'w-full gap-3 px-3 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-white shadow-2xs'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-4.5 shrink-0 transition-all duration-200 group-hover:scale-110 motion-reduce:transition-none',
                        isActive
                          ? 'stroke-[2.2] text-zinc-900 dark:text-white'
                          : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300',
                      )}
                    />
                    {isExpanded && <span className="truncate">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Settings & Actions Stack */}
        <div
          className={cn(
            'shrink-0 border-t border-zinc-200/80 dark:border-zinc-800/80 py-3 w-full flex flex-col gap-1',
            !isExpanded ? 'items-center px-1.5' : 'px-2',
          )}
        >
          <Link
            href="/settings"
            onClick={() => onMobileOpenChange(false)}
            aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
            title="Settings"
            className={cn(
              'flex items-center rounded-md transition-all duration-200 ease-out hover:translate-x-0.5 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-x-0 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900',
              !isExpanded ? 'size-10 justify-center' : 'w-full gap-3 px-3 py-2 text-sm font-medium',
              pathname.startsWith('/settings')
                ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-white shadow-2xs'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white',
            )}
          >
            <Settings
              className={cn(
                'size-4.5 shrink-0 transition-all duration-200 group-hover:scale-110 motion-reduce:transition-none',
                pathname.startsWith('/settings')
                  ? 'stroke-[2.2] text-zinc-900 dark:text-white'
                  : 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300',
              )}
            />
            {isExpanded && <span className="truncate">Settings</span>}
          </Link>

          <SidebarLegalLinks authUrl={AUTH_URL} expanded={isExpanded} />
        </div>
      </aside>
    </>
  );
}
