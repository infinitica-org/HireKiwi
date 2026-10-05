'use client';

import { Info } from 'lucide-react';
import { EVIDENCE_USAGE, type EvidenceType } from '@smart/contracts';

/** S6-VV-114 (#550): "How this is used" disclosure shown on every evidence add/connect surface. */
export function EvidenceUsageNote({ type }: { type: EvidenceType }) {
  return (
    <details className="group mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
        <Info className="size-3.5" aria-hidden />
        How this is used
      </summary>
      <EvidenceUsageFacts type={type} />
    </details>
  );
}

export function EvidenceUsageFacts({ type }: { type: EvidenceType }) {
  const usage = EVIDENCE_USAGE[type];
  const rows: Array<[string, string]> = [
    ['Used for', usage.usedFor],
    ['Who sees it', usage.visibleTo],
    ['How long we keep it', usage.retainedFor],
    ['Taking it back', usage.canWithdraw],
  ];
  return (
    <dl className="mt-2 grid gap-1.5 sm:grid-cols-[9rem_1fr]">
      {rows.map(([term, text]) => (
        <div key={term} className="contents">
          <dt className="font-medium text-zinc-700 dark:text-zinc-300">{term}</dt>
          <dd>{text}</dd>
        </div>
      ))}
    </dl>
  );
}
