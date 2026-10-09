'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Ban,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Database,
  FileBarChart,
  FolderGit2,
  Gauge,
  Gavel,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  MonitorSmartphone,
  Repeat,
  Scale,
  ScrollText,
  ShieldAlert,
  TrendingUp,
  UserCog,
  Users,
  Webhook,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn, SidebarLegalLinks } from '@hirekiwi/ui';
import hirekiwiLogoImg from '@hirekiwi/ui/assets/images/Logos/WebP/HireKiwi-logo.png';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3005';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  dot?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Every admin page, grouped. Each href is a real route under src/app/admin. */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'Hiring conversion', href: '/admin/conversion', icon: TrendingUp },
      { name: 'Reports', href: '/admin/reports', icon: FileBarChart },
    ],
  },
  {
    label: 'Organisations',
    items: [
      { name: 'Universities', href: '/admin/institutions', icon: GraduationCap },
      { name: 'Employers', href: '/admin/companies', icon: Building2 },
      { name: 'Students', href: '/admin/users', icon: Users },
      { name: 'Plans & flags', href: '/admin/plans', icon: CreditCard },
    ],
  },
  {
    label: 'Verification',
    items: [
      { name: 'Verification queue', href: '/admin/verification', icon: CheckCircle2, dot: true },
      { name: 'Grading queue', href: '/admin/grading-queue', icon: ListChecks },
      { name: 'Project review', href: '/admin/project-review', icon: FolderGit2 },
      { name: 'Skill disputes', href: '/admin/skills/disputes', icon: Gavel, dot: true },
      { name: 'Assessment levels', href: '/admin/assessments', icon: ClipboardCheck },
      { name: 'Retake policies', href: '/admin/skills', icon: Repeat },
    ],
  },
  {
    label: 'Trust & safety',
    items: [
      { name: 'Integrity', href: '/admin/integrity', icon: ShieldAlert, dot: true },
      { name: 'Trust & enforcement', href: '/admin/trust', icon: Scale },
      { name: 'Blocked words', href: '/admin/blocked-words', icon: Ban },
      { name: 'Data requests', href: '/admin/data-requests', icon: Database },
    ],
  },
  {
    label: 'Platform',
    items: [
      { name: 'Admin users', href: '/admin/platform-admins', icon: UserCog },
      { name: 'Active sessions', href: '/admin/sessions', icon: MonitorSmartphone },
      { name: 'AI governance', href: '/admin/ai-governance', icon: Bot },
      { name: 'Rate limits', href: '/admin/rate-limits', icon: Gauge },
      { name: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
      { name: 'Health & monitoring', href: '/admin/health', icon: HeartPulse },
      { name: 'Audit log', href: '/admin/audit', icon: ScrollText },
      { name: 'Support tool', href: '/admin/support', icon: HelpCircle },
    ],
  },
];

/** Exact match, or a sub-route — but never claim a path a more specific item owns. */
const ALL_HREFS = navGroups.flatMap((g) => g.items.map((i) => i.href));

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin' || pathname === '/admin/';
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  // e.g. /admin/skills must not light up on /admin/skills/disputes, which has its own item.
  return !ALL_HREFS.some(
    (other) => other !== href && other.startsWith(`${href}/`) && pathname.startsWith(other),
  );
}

function RailLink({
  item,
  pathname,
  expanded,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  expanded: boolean;
  onNavigate: () => void;
}) {
  const isActive = isItemActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <li className={cn('flex', expanded ? 'w-full' : 'justify-center')}>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        title={item.name}
        className={cn(
          'group relative flex items-center rounded-md transition-all duration-200 ease-out hover:translate-x-0.5 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-x-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900',
          expanded ? 'w-full gap-3 px-3 py-2 text-sm font-medium' : 'size-10 justify-center',
          isActive
            ? 'bg-zinc-100 font-semibold text-zinc-900 '
            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
        )}
      >
        <Icon
          className={cn(
            'size-4.5 shrink-0 transition-all duration-200 group-hover:scale-110 motion-reduce:transition-none',
            isActive ? 'stroke-[2.2] text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-700',
          )}
        />
        {expanded ? <span className="truncate">{item.name}</span> : null}
        {item.dot ? (
          <span
            aria-hidden
            className={cn(
              'size-1.5 shrink-0 rounded-full bg-[var(--admin-accent,#14b8a6)]',
              expanded ? 'ml-auto' : 'absolute top-2 right-2',
            )}
          />
        ) : null}
      </Link>
    </li>
  );
}

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  collapsed?: boolean;
};

export function AdminSidebar({
  mobileOpen,
  onMobileOpenChange,
  collapsed = true,
}: AdminSidebarProps) {
  const pathname = usePathname();
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
        aria-label="Admin console sidebar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-zinc-200/80 bg-white font-sans transition-all duration-300 ease-in-out select-none lg:translate-x-0',
          isExpanded ? 'w-64 items-start' : 'w-16 items-center',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo header — aligns with the h-14 topbar */}
        <div
          className={cn(
            'flex h-14 w-full shrink-0 items-center border-b border-zinc-200/80 transition-all duration-200',
            isExpanded ? 'justify-between px-3.5' : 'justify-center px-0',
          )}
        >
          <Link
            href="/admin"
            aria-label="HireKiwi Admin home"
            title="HireKiwi Admin"
            className="flex items-center gap-2.5"
          >
            <Image
              src={hirekiwiLogoImg}
              alt="HireKiwi logo"
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

        {/* Navigation */}
        <nav
          className="w-full flex-1 overflow-y-auto overscroll-contain px-2 py-3"
          aria-label="Admin console navigation"
        >
          {navGroups.map((group, index) => (
            <div
              key={group.label}
              className={cn(index > 0 && 'mt-3 border-t border-zinc-200/80 pt-3')}
            >
              {isExpanded ? (
                <p className="mb-1 px-3 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <RailLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    expanded={isExpanded}
                    onNavigate={closeMobileNav}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className={cn(
            'flex w-full shrink-0 flex-col border-t border-zinc-200/80 py-3',
            isExpanded ? 'px-2' : 'items-center px-1.5',
          )}
        >
          <SidebarLegalLinks authUrl={AUTH_URL} expanded={isExpanded} />
        </div>
      </aside>
    </>
  );
}
