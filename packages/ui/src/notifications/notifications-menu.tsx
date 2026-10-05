'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCheck,
  FileCheck2,
  GraduationCap,
  Loader2,
  Mail,
  MessagesSquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { queryKeys } from '@hirekiwi/api-client';
import type { NotificationDto, NotificationKind } from '@hirekiwi/contracts';
import { useQuery, useQueryClient, useSmartApi } from '../api-provider';
import { cn } from '../lib/cn';

const REFRESH_MS = 60_000;

/** One icon + colour per notification kind, so the type is readable at a glance. */
const KIND_STYLE: Record<NotificationKind, { icon: LucideIcon; tile: string }> = {
  OPPORTUNITY: { icon: Sparkles, tile: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' },
  STAGE_CHANGE: { icon: BriefcaseBusiness, tile: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40' },
  VERIFICATION_RESULT: {
    icon: ShieldCheck,
    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40',
  },
  INVITATION: { icon: Mail, tile: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40' },
  TRUST_ENFORCEMENT: { icon: ShieldAlert, tile: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40' },
  APPLICATION: { icon: FileCheck2, tile: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40' },
  MESSAGE: { icon: MessagesSquare, tile: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40' },
  ACCOUNT: { icon: UserRound, tile: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800' },
  CAMPUS_ACCESS: {
    icon: GraduationCap,
    tile: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40',
  },
  EVENT: { icon: CalendarDays, tile: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40' },
};

function KindIcon({ kind, unread }: { kind: NotificationKind; unread: boolean }) {
  const style = KIND_STYLE[kind] ?? {
    icon: Bell,
    tile: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800',
  };
  const Icon = style.icon;
  return (
    <span aria-hidden="true" className="relative mt-0.5 shrink-0">
      <span className={cn('flex size-9 items-center justify-center rounded-full', style.tile)}>
        <Icon className="size-4" strokeWidth={1.9} />
      </span>
      {unread ? (
        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#161616]" />
      ) : null}
    </span>
  );
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${String(minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${String(hours)}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${String(days)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export interface NotificationsMenuProps {
  /** In-app navigation (e.g. Next's `router.push`). Defaults to a full page load. */
  onNavigate?: (path: string) => void;
  /** Empty-state hint, so each portal can describe its own kinds of updates. */
  emptyHint?: string;
}

/** Top-bar bell with the signed-in user's in-app notifications (GET /me/notifications). */
export function NotificationsMenu({
  onNavigate,
  emptyHint = 'Updates on applications, verifications and messages show up here.',
}: NotificationsMenuProps) {
  const api = useSmartApi();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.myNotifications(),
    queryFn: () => api.notifications.list(),
    refetchInterval: REFRESH_MS,
  });
  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.myNotifications() });

  const markRead = async (item: NotificationDto) => {
    if (item.readAt) return;
    try {
      await api.notifications.markRead(item.notificationId);
    } finally {
      await refresh();
    }
  };

  const openItem = async (item: NotificationDto) => {
    setOpen(false);
    void markRead(item);
    if (!item.linkUrl) return;
    // Relative paths ("/events/1") resolve against the current portal.
    const url = new URL(item.linkUrl, window.location.origin);
    if (url.origin === window.location.origin && onNavigate) {
      onNavigate(`${url.pathname}${url.search}`);
    } else {
      window.location.assign(url.toString());
    }
  };

  const markAllRead = async () => {
    const pending = notifications.filter((n) => !n.readAt);
    await Promise.allSettled(pending.map((n) => api.notifications.markRead(n.notificationId)));
    await refresh();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${String(unread)} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <Bell className="size-5" strokeWidth={1.75} />
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-white dark:ring-zinc-900">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-[#161616]"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-950 dark:text-white">
              Notifications
              {unread > 0 ? (
                <span className="ml-2 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {unread} new
                </span>
              ) : null}
            </p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <CheckCheck className="size-3.5" />
                Mark all as read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-zinc-400">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </p>
            ) : isError ? (
              <p className="px-4 py-10 text-center text-xs text-rose-600">
                Couldn&apos;t load notifications. Try again shortly.
              </p>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto size-5 text-zinc-300 dark:text-zinc-600" />
                <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">
                  You&apos;re all caught up
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{emptyHint}</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {notifications.map((item) => (
                  <li key={item.notificationId}>
                    <button
                      type="button"
                      onClick={() => void openItem(item)}
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
                        !item.readAt && 'bg-emerald-50/40 dark:bg-emerald-950/20',
                      )}
                    >
                      <KindIcon kind={item.kind} unread={!item.readAt} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-zinc-900 dark:text-white">
                          {item.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-zinc-500 dark:text-zinc-400">
                          {item.body}
                        </span>
                        <span className="mt-1 block text-[11px] text-zinc-400">
                          {timeAgo(item.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
