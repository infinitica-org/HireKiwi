'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, CircleCheck, BadgeCheck } from 'lucide-react';
import type { StudentDashboardSummary } from '@hirekiwi/contracts';
import { cn, useQuery } from '@hirekiwi/ui';
import { api } from '@/lib/api';
import { STUDENT_JOBS_KEY, savedJobsKey } from '@/components/jobs/job-cache';

type FeedTab = 'feed' | 'recent' | 'applied';

const TABS: { id: FeedTab; label: string }[] = [
  { id: 'feed', label: 'My Feed' },
  { id: 'recent', label: 'Most Recent' },
  { id: 'applied', label: 'Applied' },
];

const VIEW_ALL: Record<FeedTab, { href: string; label: string }> = {
  feed: { href: '/matches', label: 'All matches' },
  recent: { href: '/opportunities', label: 'All opportunities' },
  applied: { href: '/applications', label: 'All applications' },
};

const EMPTY: Record<FeedTab, { title: string; body: string }> = {
  feed: {
    title: 'No matches yet',
    body: 'Verify your skills to get roles scored against your profile.',
  },
  recent: {
    title: 'No new opportunities',
    body: 'Open roles at your institution that you have not applied to appear here.',
  },
  applied: {
    title: 'No active applications',
    body: 'Roles you apply to will show up here with their current stage.',
  },
};

/** Strong enough to call out as fitting the student's verified skills. */
const MATCHES_PROFILE_PERCENT = 60;
const BEST_MATCH_PERCENT = 75;

interface FeedItem {
  key: string;
  openingId: string;
  roleTitle: string;
  companyName: string;
  location: string | null;
  employmentType: string | null;
  lastDateToApply: string | null;
  /** When the card's timestamp refers to (posted, or last application update). */
  timestamp: { label: string; at: string } | null;
  matchPercent: number | null;
  stage: string | null;
  href: string;
}

const LOGO_TINTS = [
  'bg-orange-50 text-orange-600',
  'bg-sky-50 text-sky-600',
  'bg-violet-50 text-violet-600',
  'bg-emerald-50 text-emerald-600',
  'bg-rose-50 text-rose-600',
  'bg-amber-50 text-amber-700',
];

function tintFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return LOGO_TINTS[hash % LOGO_TINTS.length] ?? LOGO_TINTS[0] ?? '';
}

function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  const units: [number, string][] = [
    [60 * 60 * 24 * 365, 'year'],
    [60 * 60 * 24 * 30, 'month'],
    [60 * 60 * 24 * 7, 'week'],
    [60 * 60 * 24, 'day'],
    [60 * 60, 'hour'],
    [60, 'minute'],
  ];
  for (const [size, unit] of units) {
    const value = Math.floor(seconds / size);
    if (value >= 1) return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}

function stageText(stage: string): string {
  const text = stage.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildItems(summary: StudentDashboardSummary, tab: FeedTab): FeedItem[] {
  const openings = new Map(summary.opportunities.items.map((o) => [o.openingId, o]));
  const scores = new Map(summary.topMatches.map((m) => [m.openingId, m.matchPercent]));

  if (tab === 'feed') {
    return summary.topMatches.map((match) => {
      const opening = openings.get(match.openingId);
      return {
        key: `match-${match.openingId}`,
        openingId: match.openingId,
        roleTitle: match.roleTitle,
        companyName: match.companyName,
        location: match.location,
        employmentType: opening?.employmentType ?? null,
        lastDateToApply: opening?.lastDateToApply ?? null,
        timestamp: opening ? { label: 'Posted', at: opening.postedAt } : null,
        matchPercent: match.matchPercent,
        stage: match.stage,
        href: match.applicationId ? '/applications' : `/jobs/${match.openingId}`,
      };
    });
  }

  if (tab === 'recent') {
    return [...summary.opportunities.items]
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
      .map((opening) => ({
        key: `opening-${opening.openingId}`,
        openingId: opening.openingId,
        roleTitle: opening.roleTitle,
        companyName: opening.companyName,
        location: opening.location,
        employmentType: opening.employmentType,
        lastDateToApply: opening.lastDateToApply,
        timestamp: { label: 'Posted', at: opening.postedAt },
        matchPercent: scores.get(opening.openingId) ?? null,
        stage: null,
        href: `/jobs/${opening.openingId}`,
      }));
  }

  return summary.activeApplications.items.map((application) => ({
    key: `application-${application.applicationId}`,
    openingId: application.openingId,
    roleTitle: application.roleTitle,
    companyName: application.companyName,
    location: null,
    employmentType: null,
    lastDateToApply: null,
    timestamp: { label: 'Updated', at: application.updatedAt },
    matchPercent: scores.get(application.openingId) ?? null,
    stage: application.stage,
    href: '/applications',
  }));
}

function useSavedOpenings() {
  const queryClient = useQueryClient();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const saved = useQuery({
    queryKey: savedJobsKey,
    queryFn: () => api.studentJobs.listSaved(),
    staleTime: 60_000,
  });
  const savedIds = useMemo(
    () => new Set((saved.data?.jobs ?? []).map((job) => job.id)),
    [saved.data],
  );

  const mutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      next ? api.studentJobs.save(id) : api.studentJobs.unsave(id),
    onMutate: ({ id, next }) => {
      setError(null);
      setOverrides((prev) => ({ ...prev, [id]: next }));
    },
    onError: (_err, { id }) => {
      setOverrides(({ [id]: _drop, ...rest }) => rest);
      setError('Could not update your saved jobs. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STUDENT_JOBS_KEY });
    },
  });

  const isSaved = (id: string) => overrides[id] ?? savedIds.has(id);
  const toggle = (id: string) => mutation.mutate({ id, next: !isSaved(id) });

  return { isSaved, toggle, error };
}

function FeedCard({
  item,
  best,
  saved,
  onToggleSave,
}: {
  item: FeedItem;
  best: boolean;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const matchesProfile = item.matchPercent !== null && item.matchPercent >= MATCHES_PROFILE_PERCENT;
  const meta = [
    item.timestamp ? `${item.timestamp.label} ${timeAgo(item.timestamp.at)}` : null,
    item.matchPercent !== null ? `${item.matchPercent}% skills match` : null,
  ].filter(Boolean);
  const footer = [
    item.employmentType?.replace(/_/g, ' ') ?? null,
    item.lastDateToApply ? `Apply by ${item.lastDateToApply}` : null,
  ].filter(Boolean);

  return (
    <article
      data-testid="feed-card"
      className="group relative rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs transition-colors hover:border-zinc-300 sm:p-6 dark:border-zinc-800 dark:bg-[#161616] dark:hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            aria-hidden
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold',
              tintFor(item.companyName),
            )}
          >
            {item.companyName.trim().charAt(0).toUpperCase() || '?'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-zinc-900 dark:text-white">
              <span className="font-semibold">{item.companyName}</span>
              {item.location ? <span className="ml-1.5 text-zinc-400">{item.location}</span> : null}
            </p>
            {meta.length > 0 ? (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{meta.join(' · ')}</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${item.roleTitle} from saved` : `Save ${item.roleTitle}`}
          className={cn(
            'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
            saved
              ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/40'
              : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:bg-zinc-800 dark:hover:text-white',
          )}
        >
          <Bookmark className={cn('size-4', saved && 'fill-current')} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <h3 className="text-lg font-medium tracking-tight text-zinc-950 dark:text-white">
          {/* Stretched link: the whole card opens the role, the bookmark stays clickable. */}
          <Link href={item.href} className="after:absolute after:inset-0 after:rounded-lg">
            {item.roleTitle}
          </Link>
        </h3>
        {item.stage ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-500 px-2 py-0.5 text-[11px] font-semibold text-white">
            <BadgeCheck className="size-3" />
            {stageText(item.stage)}
          </span>
        ) : best ? (
          <span className="rounded-md bg-orange-500 px-2 py-0.5 text-[11px] font-semibold text-white">
            Best Match
          </span>
        ) : null}
      </div>

      {matchesProfile || footer.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {matchesProfile ? (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CircleCheck className="size-3.5" />
              Matches your profile
            </span>
          ) : null}
          {footer.map((text, i) => (
            <span key={text} className="inline-flex items-center gap-3">
              {matchesProfile || i > 0 ? <span aria-hidden>·</span> : null}
              {text}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

/** "Programs"-style feed of real roles: scored matches, newest openings, and active applications. */
/** The dashboard is a preview — the full list lives behind the "View all" link. */
const MAX_VISIBLE = 3;

export function OpportunityFeed({
  summary,
  loading,
}: {
  summary: StudentDashboardSummary | undefined;
  loading: boolean;
}) {
  const [tab, setTab] = useState<FeedTab>('feed');
  const { isSaved, toggle, error } = useSavedOpenings();
  const items = useMemo(() => (summary ? buildItems(summary, tab) : []), [summary, tab]);
  const bestScore = Math.max(0, ...items.map((item) => item.matchPercent ?? 0));

  return (
    <section aria-label="Opportunities" data-testid="opportunity-feed" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-medium tracking-tight text-zinc-950 dark:text-white">
          Opportunities
        </h2>
        <Link
          href={VIEW_ALL[tab].href}
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:underline dark:text-zinc-400 dark:hover:text-white"
        >
          {VIEW_ALL[tab].label}
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Opportunity feed"
        className="inline-flex gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              tab === t.id
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-lg border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-[#161616]"
            />
          ))}
          <span className="sr-only">Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-[#161616]">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {EMPTY[tab].title}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{EMPTY[tab].body}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.slice(0, MAX_VISIBLE).map((item) => (
            <FeedCard
              key={item.key}
              item={item}
              best={
                tab === 'feed' &&
                item.matchPercent !== null &&
                item.matchPercent >= BEST_MATCH_PERCENT &&
                item.matchPercent === bestScore
              }
              saved={isSaved(item.openingId)}
              onToggleSave={() => toggle(item.openingId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
