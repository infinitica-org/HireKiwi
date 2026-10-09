'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ProjectDto } from '@hirekiwi/contracts';
import { ArrowRight, GitBranch, Globe, FolderCode, Swords, Trash2, X } from 'lucide-react';
import { EntryCard, EntryIconButton, EntryIconTile } from '@/components/profile/entry-card-ui';
import { ProjectStatusBadge } from '@/components/profile/projects/ProjectStatusBadge';
import {
  parseStackTags,
  projectSummaryText,
} from '@/components/profile/projects/project-presenters';
import { projectDefenseInterviewHref } from '@/components/profile/ProjectDefenseInterviewDialog';
import { needsOwnershipInterview } from '@/lib/project-submission';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';

type ProjectCardProps = {
  project: ProjectDto;
  onView: (project: ProjectDto) => void;
  onDelete?: (projectId: string) => void;
  /** Opens the verification popup for this project (the Start interview button). */
  onVerify?: (project: ProjectDto) => void;
};

export function ProjectCard({ project, onView, onDelete, onVerify }: ProjectCardProps) {
  const tags = parseStackTags(project.stack);
  const visibleTags = tags.slice(0, 4);
  const hiddenCount = Math.max(0, tags.length - visibleTags.length);
  const summary = projectSummaryText(project);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.projects.delete(project.projectId);
      setShowDeleteConfirm(false);
      onDelete?.(project.projectId);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const interviewDue = needsOwnershipInterview(project);
  const score =
    project.status === 'VERIFIED' && project.report ? Math.round(project.report.score) : null;

  return (
    <EntryCard className="relative flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <EntryIconTile icon={FolderCode} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h3 className="font-heading text-lg leading-snug font-medium tracking-tight break-words text-zinc-950 dark:text-white">
                {project.title}
              </h3>
              {interviewDue ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                  Interview pending
                </span>
              ) : (
                <ProjectStatusBadge project={project} />
              )}
            </div>
            {score !== null ? (
              <p className="mt-1 text-xs font-medium text-zinc-500">Score {score}/100</p>
            ) : null}
          </div>
        </div>
        <EntryIconButton
          label={`Delete ${project.title}`}
          onClick={() => setShowDeleteConfirm(true)}
          danger
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
        </EntryIconButton>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-4">
        {summary ? (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            {summary}
          </p>
        ) : null}

        {visibleTags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
            {visibleTags.map((tag) => (
              <li
                key={tag}
                className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tag}
              </li>
            ))}
            {hiddenCount > 0 ? (
              <li className="rounded-md px-1.5 py-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                +{hiddenCount}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-1">
          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} on GitHub`}
              title="GitHub"
              className="flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <GitBranch className="size-4" aria-hidden="true" />
            </a>
          ) : null}
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} live demo`}
              title="Live demo"
              className="flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <Globe className="size-4" aria-hidden="true" />
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onView(project)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            View project
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        {interviewDue ? (
          onVerify ? (
            <button
              type="button"
              onClick={() => onVerify(project)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <Swords className="size-3.5" aria-hidden="true" />
              Start interview
            </button>
          ) : (
            <Link
              href={projectDefenseInterviewHref(project.projectId)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <Swords className="size-3.5" aria-hidden="true" />
              Start interview
            </Link>
          )
        ) : null}
      </footer>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md rounded-md border border-red-200 bg-white p-6 shadow-xl dark:border-red-900 dark:bg-[#161616]"
            >
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
              >
                <X className="size-4" />
              </button>

              <h2 className="font-heading text-lg font-bold text-zinc-950 dark:text-white">
                Delete project?
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                This will permanently delete <span className="font-semibold">{project.title}</span>{' '}
                and all associated data, including skill mappings and interview records. This action
                cannot be undone.
              </p>

              {deleteError && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="rounded-md border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
                >
                  {isDeleting ? 'Deleting…' : 'Delete project'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </EntryCard>
  );
}
