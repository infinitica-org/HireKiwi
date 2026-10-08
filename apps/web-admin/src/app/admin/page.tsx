'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import type { AdminDashboardDto } from '@hirekiwi/contracts';
import { ActiveUsersPanel } from '@/components/active-users-panel';
import { InlineAlert } from '@/components/admin-ui';
import { NumberTicker } from '@hirekiwi/ui';
import { formatAuditAction, formatResourceType } from '@/lib/audit-actions';
import { api } from '@/lib/api';

const ACTIVITY_PAGE_SIZE = 5;

function LoadingOverview() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12 font-sans">
      <div className="h-16 w-72 animate-pulse rounded-lg bg-zinc-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-lg border border-zinc-200/80 bg-white"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg border border-zinc-200/80 bg-white" />
    </div>
  );
}

function getInitials(text: string | null | undefined): string {
  if (!text) return 'SY';
  const parts = text.split('@')[0]?.split(/[._ -]/) || [];
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return text.slice(0, 2).toUpperCase();
}

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-zinc-200/80  p-5 shadow-2xs transition-all duration-200 hover:border-zinc-300 hover:shadow-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      </div>
      <div className="mt-2">
        <p className="font-heading text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
          <NumberTicker value={value} className="text-zinc-950" />
        </p>
        <p className="mt-1 text-xs font-medium text-zinc-500">{hint}</p>
      </div>
    </Link>
  );
}

export default function AdminHomePage() {
  const [data, setData] = useState<AdminDashboardDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);

  useEffect(() => {
    api.onboarding
      .dashboard()
      .then(setData)
      .catch(() => setError('Failed to load operational dashboard metrics.'));

    api.auth
      .me()
      .then((user) => setFirstName(user.fullName?.trim().split(/\s+/)[0] || null))
      .catch(() => undefined);
  }, []);

  if (error) return <InlineAlert tone="danger" title={error} />;
  if (!data) return <LoadingOverview />;

  const activityPages = Math.max(1, Math.ceil(data.recentAudit.length / ACTIVITY_PAGE_SIZE));
  const currentActivityPage = Math.min(activityPage, activityPages);
  const pagedAudit = data.recentAudit.slice(
    (currentActivityPage - 1) * ACTIVITY_PAGE_SIZE,
    currentActivityPage * ACTIVITY_PAGE_SIZE,
  );

  const greeting = greetingFor(new Date().getHours());

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12 pt-2 font-sans">
      {/* Greeting */}
      <header className="px-1">
        <h1 className="text-2xl font-medium tracking-tight text-zinc-950 sm:text-3xl">
          {greeting}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">
          Here’s what needs your attention across HireKiwi today.
        </p>
      </header>
      {/* Key numbers — platform size and the queues that need an admin */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Universities live"
          value={data.institutions.active}
          hint={`${data.institutions.held.toLocaleString()} awaiting provisioning`}

          href="/admin/institutions"
        />
        <StatCard
          label="Employers"
          value={data.companies.total}
          hint={`${data.companies.pendingVerification.toLocaleString()} awaiting verification`}

          href="/admin/companies"
        />
        <StatCard
          label="Verification queue"
          value={data.pendingVerifications}
          hint="Awaiting credential issuance"

          href="/admin/verification"
        />
        <StatCard
          label="Flagged profiles"
          value={data.flaggedAttempts}
          hint="Trust & safety anomalies"

          href="/admin/integrity"
        />
      </section>
      {/* Active users + recent activity, side by side on large screens */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ActiveUsersPanel />
        {/* Recent activity from the live audit log */}
        <section className="relative flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs md:p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="font-heading text-base font-bold tracking-tight text-zinc-900">
                Recent Activity
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Sensitive administrative changes and tenant operations
              </p>
            </div>
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:underline"
            >
              Full audit log
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {data.recentAudit.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-10 text-center">
              <ScrollText className="mx-auto mb-2 size-8 text-zinc-400" />
              <p className="text-xs font-semibold text-zinc-700">No recent activity logged yet</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Administrative actions and tenant lifecycle changes will appear here in real time.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {pagedAudit.map((row) => (
                <li
                  key={row.auditLogId}
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100 font-mono text-xs font-bold text-zinc-800 shadow-2xs">
                      {getInitials(row.actorEmail)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-zinc-900">
                          {formatAuditAction(row.action)}
                        </p>
                        <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                          {formatResourceType(row.resourceType)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        Resource:{' '}
                        <strong className="font-mono text-zinc-700">
                          {row.resourceId ? row.resourceId.slice(0, 8) : '—'}
                        </strong>
                        {' · '}
                        Actor:{' '}
                        <strong className="font-mono text-zinc-700">
                          {row.actorEmail ?? 'System'}
                        </strong>
                      </p>
                      {row.reasonCode ? (
                        <p className="mt-0.5 text-[10px] italic text-zinc-400">
                          Reason: {row.reasonCode}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-zinc-400">
                    {new Date(row.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {activityPages > 1 ? (
            <nav
              aria-label="Recent activity pages"
              className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4"
            >
              <p className="text-xs text-zinc-500">
                Showing {(currentActivityPage - 1) * ACTIVITY_PAGE_SIZE + 1}–
                {Math.min(currentActivityPage * ACTIVITY_PAGE_SIZE, data.recentAudit.length)} of{' '}
                {data.recentAudit.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActivityPage(currentActivityPage - 1)}
                  disabled={currentActivityPage === 1}
                  aria-label="Previous page"
                  className="flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: activityPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setActivityPage(n)}
                    aria-current={n === currentActivityPage ? 'page' : undefined}
                    className={`flex size-8 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors ${
                      n === currentActivityPage
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setActivityPage(currentActivityPage + 1)}
                  disabled={currentActivityPage === activityPages}
                  aria-label="Next page"
                  className="flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}
