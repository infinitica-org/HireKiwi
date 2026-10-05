'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Radio, Users } from 'lucide-react';
import type { ActiveUserGroup, ListActiveUsersResponse } from '@smart/contracts';
import { api } from '@/lib/api';

const PAGE_SIZE = 5;

type Filter = 'ALL' | ActiveUserGroup;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'STUDENT', label: 'Students' },
  { id: 'TPO', label: 'TPO' },
  { id: 'COMPANY', label: 'Companies' },
];

const GROUP_STYLE: Record<ActiveUserGroup, { label: string; className: string }> = {
  STUDENT: { label: 'Student', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  TPO: { label: 'TPO', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  COMPANY: { label: 'Company', className: 'border-amber-200 bg-amber-50 text-amber-700' },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase() ||
    '?'
  );
}

function since(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${String(minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${String(hours)}h ago`;
  return `${String(Math.round(hours / 24))}d ago`;
}

/** Admin dashboard — users signed in right now, filterable by Student / TPO / Company. */
export function ActiveUsersPanel() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListActiveUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.onboarding
      .listActiveUsers({ group: filter === 'ALL' ? undefined : filter, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load active users.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const countFor = (id: Filter) =>
    data ? (id === 'ALL' ? data.counts.total : data.counts[id]) : null;

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs md:p-6">
      <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-base font-bold tracking-tight text-zinc-900">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Active users
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">People signed in right now</p>
        </div>

        <div
          role="tablist"
          aria-label="Filter active users"
          className="inline-flex gap-1 rounded-md border border-zinc-200/80 bg-white p-1"
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const count = countFor(f.id);
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFilter(f.id);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {f.label}
                {count !== null ? (
                  <span
                    className={`rounded px-1.5 text-[11px] tabular-nums ${
                      active ? 'bg-white/20' : 'bg-zinc-100'
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : loading && !data ? (
        <ul className="mt-4 space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="h-14 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </ul>
      ) : !data || data.users.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-10 text-center">
          <Users className="mx-auto mb-2 size-8 text-zinc-400" />
          <p className="text-xs font-semibold text-zinc-700">Nobody is signed in right now</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            Users appear here while they have an active session.
          </p>
        </div>
      ) : (
        <div
          className={`mt-4 overflow-x-auto rounded-md border border-zinc-200/80 transition-opacity ${loading ? 'opacity-60' : ''}`}
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                <th scope="col" className="px-3 py-2.5">
                  User
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Role
                </th>
                <th scope="col" className="hidden px-3 py-2.5 md:table-cell">
                  Organisation
                </th>
                <th scope="col" className="px-3 py-2.5 text-right">
                  Signed in
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.users.map((user) => {
                const group = GROUP_STYLE[user.group];
                return (
                  <tr key={user.userId} className="transition-colors hover:bg-zinc-50/70">
                    <td className="px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
                          {initials(user.fullName)}
                          <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate font-semibold text-zinc-900">
                            {user.fullName}
                          </p>
                          <p className="max-w-[180px] truncate text-[11px] text-zinc-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${group.className}`}
                      >
                        {group.label}
                      </span>
                    </td>
                    <td className="hidden max-w-[160px] truncate px-3 py-2.5 text-zinc-600 md:table-cell">
                      {user.organizationName ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Radio className="size-3 text-emerald-500" />
                        {since(user.lastSignedInAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && pages > 1 ? (
        <nav
          aria-label="Active users pages"
          className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4"
        >
          <p className="text-xs text-zinc-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} of{' '}
            {data.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
              className="flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2)
              .map((n, i, list) => (
                <span key={n} className="flex items-center">
                  {i > 0 && n - (list[i - 1] ?? n) > 1 ? (
                    <span className="px-1 text-xs text-zinc-400">…</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setPage(n)}
                    aria-current={n === page ? 'page' : undefined}
                    className={`flex size-8 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors ${
                      n === page ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {n}
                  </button>
                </span>
              ))}
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page === pages}
              aria-label="Next page"
              className="flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}
