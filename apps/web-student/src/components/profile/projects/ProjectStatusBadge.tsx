'use client';

import type { ProjectDto } from '@hirekiwi/contracts';
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { needsOwnershipInterview, processingStateCopy } from '@/lib/project-submission';
const TONE_CLASS: Record<'info' | 'success' | 'warning' | 'danger', string> = {
  info: 'border-transparent bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  success:
    'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  warning: 'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  danger: 'border-transparent bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
};

export function ProjectStatusBadge({ project }: { project: ProjectDto }) {
  const copy = processingStateCopy(project);
  const tone =
    project.status === 'REJECTED'
      ? ('danger' as const)
      : copy.tone === 'warning'
        ? 'warning'
        : copy.tone;

  const awaitingVerify = project.status === 'SUBMITTED' && !needsOwnershipInterview(project);

  const Icon =
    project.status === 'VERIFIED'
      ? CheckCircle2
      : awaitingVerify
        ? Loader2
        : project.status === 'REJECTED'
          ? AlertCircle
          : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${TONE_CLASS[tone]}`}
    >
      <Icon
        className={`h-3 w-3 shrink-0 ${awaitingVerify ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      {copy.title}
    </span>
  );
}
