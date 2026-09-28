'use client';

import { useState, useRef, useEffect, ComponentType } from 'react';
import {
  LogOut,
  ChevronDown,
  Shield,
  Building,
  UserRound,
  Zap,
  Users,
  Settings,
} from 'lucide-react';
import type { UserRole } from '../navigation/role-nav-config';

export interface UserMenuItem {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
}

export interface UserMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    role?: UserRole | string;
    organizationName?: string | null;
  } | null;
  onSignOut?: () => void;
  menuItems?: UserMenuItem[];
  className?: string;
}

function roleBadgeLabel(role?: string): string {
  if (!role) return 'User';
  switch (role) {
    case 'SUPER_ADMIN':
    case 'SYSTEM_ADMIN':
      return 'Super Admin';
    case 'INSTITUTION_ADMIN':
    case 'TPO_ADMIN':
      return 'Institution Admin';
    case 'COMPANY_ADMIN':
    case 'RECRUITER':
      return 'Employer Recruiter';
    case 'STUDENT':
    case 'CANDIDATE':
      return 'Student';
    default:
      return role;
  }
}

export function UserMenu({ user, onSignOut, menuItems, className = '' }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = user?.name || user?.email?.split('@')[0] || 'Authenticated User';
  const roleLabel = roleBadgeLabel(user?.role);
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const defaultItems: UserMenuItem[] = [
    { label: 'Profile', icon: UserRound },
    { label: 'Upgrade Plan', icon: Zap },
    { label: 'Refer Friends', icon: Users },
    { label: 'Settings', icon: Settings },
  ];

  const itemsToRender = menuItems && menuItems.length > 0 ? menuItems : defaultItems;

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button: Profile Avatar Icon + Dropdown Chevron Icon (no text) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5   p-1 pr-2 text-left transition-all  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-primary)]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`User menu for ${name}`}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={name}
            className="size-8 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700 shadow-2xs shrink-0"
          />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs">
            <UserRound className="size-4" aria-hidden />
          </span>
        )}
        <ChevronDown
          className={`size-4 text-zinc-500 dark:text-zinc-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {/* Opened Dropdown Menu (Image 2) */}
      {open && (
        <div
          role="menu"
          aria-label="User Account Options"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-lg border border-zinc-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-[#161616] focus:outline-none z-50 animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* Centered Avatar & User Header Banner */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50/80 p-3.5 text-center dark:border-zinc-800/80 dark:bg-zinc-900/60 mb-1.5">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={name}
                className="size-12 rounded-full object-cover border-2 border-white shadow-sm dark:border-zinc-700"
              />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm">
                <UserRound className="size-6" aria-hidden />
              </span>
            )}
            <p className="mt-2 text-xs font-bold tracking-wide uppercase text-zinc-900 dark:text-white truncate max-w-[200px]">
              {name}
            </p>
            {user?.email ? (
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                {user.email}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              {user?.organizationName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-[120px]">
                  <Building className="size-3" aria-hidden />
                  {user.organizationName}
                </span>
              ) : null}
            </div>
          </div>

          <div className="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* List of Menu Options */}
          <div className="py-0.5 space-y-0.5" role="none">
            {itemsToRender.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.label + idx}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onClick?.();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                >
                  {IconComp && <IconComp className="size-4 text-zinc-500 shrink-0" aria-hidden />}
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800" />

            {/* Sign Out Option */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut?.();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
