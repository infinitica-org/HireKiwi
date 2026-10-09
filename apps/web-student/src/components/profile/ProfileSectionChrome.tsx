'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { EvidenceType } from '@hirekiwi/contracts';
import { EvidenceUsageNote } from './EvidenceUsageNote';

export function ProfileSectionHeader({
  title,
  description,
  action,
  evidenceType,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  /** S6-VV-114: adds an info icon beside the title; hovering it explains how this evidence is used. */
  evidenceType?: EvidenceType;
}) {
  return (
    <div className="flex w-full flex-col gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between font-sans">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h2 className="font-heading text-[22px] leading-7 font-semibold tracking-tight text-zinc-950 dark:text-white">
            {title}
          </h2>
          {evidenceType ? <EvidenceUsageNote type={evidenceType} /> : null}
        </div>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ProfileSectionError({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
      {children}
    </div>
  );
}

export function ProfileBentoEmptyPanel({
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyBody,
  actions,
}: {
  /** Tip bar is no longer rendered; still accepted so existing callers compile. */
  tipIcon?: LucideIcon;
  tipIconClassName?: string;
  tipTitle?: string;
  tipBody?: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyBody: string;
  actions: ReactNode;
}) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-[#161616] font-sans">
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-3 dark:bg-zinc-800 dark:text-zinc-500">
          <EmptyIcon className="size-5 stroke-[1.5]" />
        </div>
        <p className="text-sm font-bold text-zinc-900 dark:text-white">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">{emptyBody}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">{actions}</div>
      </div>
    </div>
  );
}
