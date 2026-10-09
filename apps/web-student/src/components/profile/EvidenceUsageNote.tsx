'use client';

import { useId } from 'react';
import { Info } from 'lucide-react';
import { EVIDENCE_USAGE, type EvidenceType } from '@hirekiwi/contracts';

/**
 * S6-VV-114 (#550): how this kind of evidence is used. An info icon sits beside the section title;
 * hovering or focusing it opens a small card with the facts, so nothing is added to the page body.
 */
export function EvidenceUsageNote({ type }: { type: EvidenceType }) {
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="How this is used"
        aria-describedby={id}
        className="flex size-6 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:bg-zinc-100 focus-visible:text-zinc-700 focus-visible:outline-none dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <Info className="size-4" aria-hidden />
      </button>
      <div
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute top-full left-0 z-30 mt-2 w-[min(21rem,calc(100vw-3rem))] rounded-lg border border-zinc-200 bg-white p-4 text-left opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 dark:border-zinc-700 dark:bg-[#1c1c1c]"
      >
        <p className="font-heading text-sm font-semibold text-zinc-950 dark:text-white">
          How this is used
        </p>
        <EvidenceUsageFacts type={type} compact />
      </div>
    </span>
  );
}

export function EvidenceUsageFacts({
  type,
  compact = false,
}: {
  type: EvidenceType;
  /** Stack each fact under its label (for narrow cards). */
  compact?: boolean;
}) {
  const usage = EVIDENCE_USAGE[type];
  const rows: Array<[string, string]> = [
    ['Used for', usage.usedFor],
    ['Who sees it', usage.visibleTo],
    ['How long we keep it', usage.retainedFor],
    ['Taking it back', usage.canWithdraw],
  ];
  if (compact) {
    return (
      <dl className="mt-3 space-y-2.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
        {rows.map(([term, text]) => (
          <div key={term}>
            <dt className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
              {term}
            </dt>
            <dd className="mt-0.5">{text}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className="mt-2 grid gap-1.5 text-xs text-zinc-500 sm:grid-cols-[9rem_1fr] dark:text-zinc-400">
      {rows.map(([term, text]) => (
        <div key={term} className="contents">
          <dt className="font-medium text-zinc-700 dark:text-zinc-300">{term}</dt>
          <dd>{text}</dd>
        </div>
      ))}
    </dl>
  );
}
