'use client';

import Link from 'next/link';
import type { ProjectDto } from '@hirekiwi/contracts';
import { Check, ExternalLink, GitBranch, Loader2, Lock, Mic } from 'lucide-react';
import { projectDefenseInterviewHref } from '@/components/profile/ProjectDefenseInterviewDialog';
import { parseStackTags } from '@/components/profile/projects/project-presenters';
import {
  isProcessingStatus,
  needsOwnershipInterview,
  processingStateCopy,
} from '@/lib/project-submission';

type StageState = 'done' | 'running' | 'ready' | 'waiting';

function StageIcon({ state }: { state: StageState }) {
  if (state === 'done')
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white">
        <Check className="size-4" aria-hidden />
      </span>
    );
  if (state === 'running')
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-500 ring-1 ring-pink-200">
        <Loader2 className="size-4 animate-spin" aria-hidden />
      </span>
    );
  if (state === 'ready')
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600 ring-1 ring-pink-300">
        <Mic className="size-4" aria-hidden />
      </span>
    );
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
      <Lock className="size-3.5" aria-hidden />
    </span>
  );
}

/**
 * What happens after a project is submitted: the project being verified, then the three stages
 * (submitted, automated checks, ownership interview) with the interview button as soon as it is due.
 */
export function ViviVerifyStep({ project }: { project: ProjectDto }) {
  const processing = isProcessingStatus(project);
  const interviewDue = needsOwnershipInterview(project);
  const interviewDone = project.interviewStatus === 'COMPLETED' || project.status === 'VERIFIED';
  const tags = parseStackTags(project.stack);
  const copy = processingStateCopy(project);

  const checks: StageState = processing ? 'running' : 'done';
  const interview: StageState = interviewDone
    ? 'done'
    : interviewDue
      ? 'ready'
      : processing
        ? 'waiting'
        : project.interviewRequired
          ? 'waiting'
          : 'done';

  const stages: { title: string; detail: string; state: StageState }[] = [
    {
      title: 'Project submitted',
      detail: 'Your project and evidence were received.',
      state: 'done',
    },
    {
      title: 'Automated checks',
      detail: processing
        ? 'Running now. This page updates when they finish.'
        : 'Finished. Your code and evidence were checked.',
      state: checks,
    },
    {
      title: 'Ownership interview',
      detail: interviewDone
        ? 'Completed. Thank you.'
        : interviewDue
          ? 'A short voice interview to confirm you built this project.'
          : project.interviewRequired || processing
            ? 'Unlocks when the automated checks finish.'
            : 'Not required for this project.',
      state: interview,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label="Project to verify"
        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          Project to verify
        </p>
        <h3 className="mt-1 font-heading text-base font-semibold text-zinc-950 dark:text-white">
          {project.title}
        </h3>
        {tags.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.slice(0, 8).map((tag) => (
              <li
                key={tag}
                className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        {project.githubUrl || project.liveUrl ? (
          <p className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-600">
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                <GitBranch className="size-3.5" aria-hidden />
                GitHub
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            ) : null}
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                Live demo
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            ) : null}
          </p>
        ) : null}
      </section>

      <ol aria-label="Verification progress" className="flex flex-col">
        {stages.map((stage, index) => (
          <li key={stage.title} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <StageIcon state={stage.state} />
              {index < stages.length - 1 ? (
                <span className="my-1 w-px flex-1 bg-zinc-200 dark:bg-zinc-700" aria-hidden />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-5">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{stage.title}</p>
              <p className="mt-0.5 text-[13px] text-zinc-500">{stage.detail}</p>
              {stage.title === 'Ownership interview' && interviewDue ? (
                <Link
                  href={projectDefenseInterviewHref(project.projectId)}
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600"
                >
                  <Mic className="size-4" aria-hidden />
                  Start interview
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <p className="rounded-md bg-zinc-50 px-3.5 py-2.5 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300">
        <span className="font-semibold text-zinc-900 dark:text-white">{copy.title}.</span>{' '}
        {copy.body}
      </p>
    </div>
  );
}
