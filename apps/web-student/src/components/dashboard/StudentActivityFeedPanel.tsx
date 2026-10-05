'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, FileText, TrendingUp } from 'lucide-react';
import { cn } from '@smart/ui';

export interface ActivityFeedItem {
  id: string;
  icon: 'eye' | 'file' | 'trending';
  text: string;
}

const PAGE_SIZE = 3;
/** How many page numbers to show at once before the row starts sliding. */
const MAX_PAGE_BUTTONS = 5;

function visiblePages(current: number, total: number): number[] {
  const count = Math.min(MAX_PAGE_BUTTONS, total);
  const start = Math.min(Math.max(1, current - Math.floor(count / 2)), total - count + 1);
  return Array.from({ length: count }, (_, i) => start + i);
}

const pageButtonClass =
  'flex size-7 items-center justify-center rounded-md text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40';

export function StudentActivityFeedPanel({ activities = [] }: { activities?: ActivityFeedItem[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  // Clamp when the list shrinks (e.g. after a refetch).
  const current = Math.min(page, totalPages);
  const pageItems = activities.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <section className="relative overflow-hidden rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs font-sans select-none dark:border-zinc-800 dark:bg-[#161616]">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-850">
        <div>
          <h2 className="font-heading text-base font-bold tracking-tight text-zinc-900 dark:text-white">
            Recent Activity
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Live placement application events, recruiter views, and verified skill updates
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <FileText className="mx-auto size-7 text-zinc-400 mb-2" />
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            No activity recorded yet
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Your skill declarations, assessments, and applications will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {pageItems.map((act) => {
            let Icon = Eye;
            if (act.icon === 'file') Icon = FileText;
            if (act.icon === 'trending') Icon = TrendingUp;

            return (
              <div
                key={act.id}
                className="flex items-center gap-3.5 rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 text-xs text-zinc-700 transition-colors hover:border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-700 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Icon className="size-4 stroke-[1.75]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs text-zinc-800 dark:text-zinc-200 truncate">
                    {act.text}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-zinc-400">Live</span>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Recent activity pages"
          className="mt-4 flex items-center justify-center gap-1 border-t border-zinc-100 pt-4 dark:border-zinc-800"
        >
          <button
            type="button"
            onClick={() => setPage(current - 1)}
            disabled={current === 1}
            aria-label="Previous page"
            className={cn(
              pageButtonClass,
              'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          {visiblePages(current, totalPages).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              aria-label={`Page ${n}`}
              aria-current={n === current ? 'page' : undefined}
              className={cn(
                pageButtonClass,
                n === current
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage(current + 1)}
            disabled={current === totalPages}
            aria-label="Next page"
            className={cn(
              pageButtonClass,
              'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            )}
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      ) : null}
    </section>
  );
}
