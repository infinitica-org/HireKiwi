'use client';

import Link from 'next/link';
import type { ProjectDto } from '@hirekiwi/contracts';
import { Alert } from '@hirekiwi/ui';
import { Mic } from 'lucide-react';

export function projectDefenseInterviewHref(projectId: string): string {
  return `/student/profile/projects/${projectId}/defense`;
}

export function ProjectDefenseInterviewDialog({ project }: { project: ProjectDto }) {
  if (project.interviewStatus === 'COMPLETED') {
    return (
      <Alert tone="success" title="Ownership interview complete">
        You have already completed the voice interview for this project.
      </Alert>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50/60 p-4 font-sans dark:border-teal-900/50 dark:bg-teal-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-teal-600 ring-1 ring-teal-100 dark:bg-zinc-900 dark:text-teal-400 dark:ring-teal-900/50">
            <Mic className="size-[18px]" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
              Ownership interview required
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              Automated checks finished. Complete a short voice interview to verify you built this
              project.
            </p>
          </div>
        </div>
        <Link
          href={projectDefenseInterviewHref(project.projectId)}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700"
        >
          Start interview
        </Link>
      </div>
    </div>
  );
}
