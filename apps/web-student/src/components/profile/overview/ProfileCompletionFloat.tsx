'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, X } from 'lucide-react';
import { cn } from '@hirekiwi/ui';
import {
  PROFILE_AREA_HREFS,
  PROFILE_AREA_IDS,
  PROFILE_AREA_LABELS,
  type ProfileAreaId,
} from '@/lib/profile-progress';
import { useProfileProgress } from '@/lib/use-profile-progress';

interface ProfileCompletionFloatProps {
  percent: number | null;
  areaStatus?: Partial<Record<ProfileAreaId, boolean>>;
}

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Shell-level badge: reads the signed-in student's progress itself, so every page can show it. */
export function StudentProfileCompletionFloat() {
  const { progress } = useProfileProgress();
  return (
    <ProfileCompletionFloat percent={progress?.percent ?? null} areaStatus={progress?.areaStatus} />
  );
}

/** Fixed completion badge; opens a done / still-to-do checklist. */
export function ProfileCompletionFloat({ percent, areaStatus }: ProfileCompletionFloatProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onScroll = (event: Event) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    // Capture: page scrolling happens inside the shell's <main>, and scroll events don't bubble.
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  if (percent === null) return null;

  const value = Math.min(100, Math.max(0, percent));
  const complete = value >= 100;
  const done = PROFILE_AREA_IDS.filter((id) => areaStatus?.[id]);
  const todo = PROFILE_AREA_IDS.filter((id) => areaStatus?.[id] === false);

  return (
    <div ref={rootRef} className="fixed right-4 top-15 z-40 font-sans sm:right-6">
      {open ? (
        <div
          role="dialog"
          aria-label="Profile completion"
          className="absolute top-full right-0 mt-2 w-80 origin-top-right animate-in overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xl duration-150 fade-in zoom-in-95 slide-in-from-top-1 dark:border-zinc-800 dark:bg-[#161616]"
        >
          <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Profile strength
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-zinc-950 dark:text-white">
                {value}%
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {complete
                  ? 'Everything is filled in.'
                  : `${String(todo.length)} ${todo.length === 1 ? 'step' : 'steps'} left`}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mx-4 mb-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${String(value)}%` }}
            />
          </div>

          <ul className="max-h-80 overflow-y-auto border-t border-zinc-100 py-1 dark:border-zinc-800">
            {todo.length > 0 ? (
              <li className="px-4 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                To do
              </li>
            ) : null}
            {todo.map((id) => (
              <li key={id}>
                <Link
                  href={PROFILE_AREA_HREFS[id]}
                  onClick={() => setOpen(false)}
                  className="group mx-1.5 flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                >
                  <span className="size-4 shrink-0 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                  <span className="flex-1">{PROFILE_AREA_LABELS[id]}</span>
                  <ChevronRight className="size-4 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
            {done.length > 0 ? (
              <li className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                Done
              </li>
            ) : null}
            {done.map((id) => (
              <li
                key={id}
                className="mx-1.5 flex items-center gap-3 px-2.5 py-1.5 text-sm text-zinc-400 dark:text-zinc-500"
              >
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="flex-1 line-through">{PROFILE_AREA_LABELS[id]}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Profile ${String(value)}% complete. Show checklist`}
        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pr-4 pl-1.5 shadow-lg transition-transform hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-[#161616]"
      >
        <span className="relative flex size-11 items-center justify-center">
          <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle
              cx="22"
              cy="22"
              r={RADIUS}
              fill="none"
              strokeWidth="4"
              className="stroke-zinc-100 dark:stroke-zinc-800"
            />
            <circle
              cx="22"
              cy="22"
              r={RADIUS}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
              className={cn(
                'transition-all duration-500',
                complete ? 'stroke-emerald-500' : 'stroke-amber-500',
              )}
            />
          </svg>
          <span className="text-[11px] font-bold tabular-nums text-zinc-900 dark:text-white">
            {value}%
          </span>
        </span>
        <span className="text-left">
          <span className="block text-xs font-semibold text-zinc-900 dark:text-white">
            {complete ? 'Profile complete' : 'Complete profile'}
          </span>
          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
            {complete ? 'Nice work' : `${String(todo.length)} left`}
          </span>
        </span>
      </button>
    </div>
  );
}
