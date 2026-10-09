'use client';

import { useEffect, useState } from 'react';
import type { ProjectDto } from '@hirekiwi/contracts';
import { ArrowLeft, CheckCircle2, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { parseStackTags } from '@/components/profile/projects/project-presenters';
import { isProcessingStatus, needsOwnershipInterview } from '@/lib/project-submission';
import { ViviVerificationShell, type ViviSelectedItem } from './ViviVerificationShell';
import { ViviVerifyStep } from './ViviVerifyStep';
import { useViviReady } from './useViviReady';

const STEPS = ['Projects', 'Verify'] as const;

type Tone = 'ok' | 'warn' | 'muted';

/** Verified or unverified, in plain words, with the reason an unverified project is waiting. */
function verificationOf(project: ProjectDto): { text: string; tone: Tone; due: boolean } {
  if (project.status === 'VERIFIED') return { text: 'Verified', tone: 'ok', due: false };
  if (needsOwnershipInterview(project))
    return { text: 'Interview required', tone: 'warn', due: true };
  if (isProcessingStatus(project)) return { text: 'Verifying', tone: 'muted', due: false };
  if (project.status === 'UNDER_REVIEW') return { text: 'Under review', tone: 'warn', due: false };
  return { text: 'Unverified', tone: 'muted', due: false };
}

const BADGE_CLASS: Record<Tone, string> = {
  ok: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  warn: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  muted: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
};

const primaryButton =
  'inline-flex items-center gap-1.5 rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600';
const secondaryButton =
  'inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-800';

/**
 * "Verify project": every project with its verified or unverified state, and one project's
 * verification (checks, then the ownership interview) when it is opened.
 */
export function ViviVerifyModal({
  open,
  onClose,
  projects,
  focusProjectId,
}: {
  open: boolean;
  onClose: () => void;
  projects: readonly ProjectDto[];
  /** Open straight on this project (from its Start interview button). */
  focusProjectId: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(focusProjectId);
  const ready = useViviReady(open);

  useEffect(() => {
    if (open) setSelectedId(focusProjectId);
  }, [open, focusProjectId]);

  const selectedProject = projects.find((project) => project.projectId === selectedId) ?? null;
  const verified = projects.filter((project) => project.status === 'VERIFIED').length;

  const listItems: ViviSelectedItem[] = projects.map((project) => {
    const state = verificationOf(project);
    return {
      code: project.projectId,
      label: project.title,
      badge: { text: state.text, tone: state.tone },
    };
  });

  return (
    <ViviVerificationShell
      loading={open && !ready}
      open={open}
      onClose={onClose}
      titleId="verify-projects-title"
      title="Project Verification"
      steps={STEPS}
      stepIndex={selectedProject ? 1 : 0}
      selectedHeading="Your projects"
      selectedHint={`${String(verified)} verified · ${String(projects.length - verified)} unverified`}
      selectedEmpty={<p>No projects yet. Add a project to verify it.</p>}
      selected={listItems}
      heading={selectedProject ? 'Verify your project' : 'Verify your projects'}
      description={
        selectedProject
          ? 'Vivi checks your project, then confirms you built it with a short voice interview.'
          : 'Verified projects count for employers. An unverified project needs its checks to finish and a short ownership interview.'
      }
      actions={
        selectedProject ? (
          <>
            <button type="button" onClick={() => setSelectedId(null)} className={secondaryButton}>
              <ArrowLeft className="size-4" aria-hidden />
              All projects
            </button>
            <button type="button" onClick={onClose} className={primaryButton}>
              Done
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose} className={secondaryButton}>
            Close
          </button>
        )
      }
    >
      {selectedProject ? (
        <ViviVerifyStep project={selectedProject} />
      ) : projects.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
          You have not added a project yet.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {projects.map((project) => {
            const state = verificationOf(project);
            const tags = parseStackTags(project.stack).slice(0, 4);
            const StateIcon =
              state.text === 'Verified'
                ? CheckCircle2
                : state.text === 'Verifying'
                  ? Loader2
                  : Clock;
            return (
              <li key={project.projectId}>
                <div className="flex items-center gap-4 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                      {project.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${BADGE_CLASS[state.tone]}`}
                      >
                        <StateIcon
                          className={`size-3 ${state.text === 'Verifying' ? 'animate-spin' : ''}`}
                          aria-hidden
                        />
                        {state.text}
                      </span>
                      {tags.map((tag) => (
                        <span key={tag} className="text-xs text-zinc-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {state.due ? (
                    <button
                      type="button"
                      onClick={() => setSelectedId(project.projectId)}
                      className={primaryButton}
                    >
                      Start interview
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedId(project.projectId)}
                      className={secondaryButton}
                    >
                      View status
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ViviVerificationShell>
  );
}
