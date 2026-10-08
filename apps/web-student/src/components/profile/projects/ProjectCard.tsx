'use client';

import { useState } from 'react';
import type { ProjectDto } from '@hirekiwi/contracts';
import { ExternalLink, GitBranch, MoreVertical, Trash2, X } from 'lucide-react';
import { ProjectStatusBadge } from '@/components/profile/projects/ProjectStatusBadge';
import {
  parseStackTags,
  projectSummaryText,
} from '@/components/profile/projects/project-presenters';
import { ProjectDefenseInterviewDialog } from '@/components/profile/ProjectDefenseInterviewDialog';
import { needsOwnershipInterview, processingStateCopy } from '@/lib/project-submission';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';

type ProjectCardProps = {
  project: ProjectDto;
  onView: (project: ProjectDto) => void;
  onDelete?: (projectId: string) => void;
};

export function ProjectCard({ project, onView, onDelete }: ProjectCardProps) {
  const tags = parseStackTags(project.stack);
  const visibleTags = tags.slice(0, 4);
  const hiddenCount = Math.max(0, tags.length - visibleTags.length);
  const summary = projectSummaryText(project);
  const statusCopy = processingStateCopy(project);

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

  return (
    <article className="flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-5 font-sans text-zinc-900 select-none dark:border-zinc-800 dark:bg-[#161616] dark:text-white">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-[15px] font-semibold leading-snug tracking-tight break-words text-zinc-950 dark:text-white">
            {project.title}
          </h3>
          <div className="mt-2">
            <ProjectStatusBadge project={project} />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete this project"
            className="flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            aria-label={`Delete ${project.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label={`More actions for ${project.title}`}
            onClick={() => onView(project)}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </header>

      {summary ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {summary}
        </p>
      ) : null}

      {visibleTags.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Stack</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tag}
              </span>
            ))}
            {hiddenCount > 0 ? (
              <span className="rounded-md px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                +{hiddenCount}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
        {project.githubUrl ? (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            GitHub
            <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
          </a>
        ) : null}
        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            Live Demo
            <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {project.status === 'VERIFIED' && project.report ? (
        <div className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          <p className="font-semibold text-zinc-900 dark:text-white">HireKiwi verification</p>
          <p className="mt-1">
            Score {Math.round(project.report.score)}/100 · {statusCopy.body}
          </p>
        </div>
      ) : project.status === 'UNDER_REVIEW' ? (
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">{statusCopy.body}</p>
      ) : needsOwnershipInterview(project) ? (
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">{statusCopy.body}</p>
      ) : null}

      {needsOwnershipInterview(project) ? (
        <div className="mt-3">
          <ProjectDefenseInterviewDialog project={project} />
        </div>
      ) : null}

      <footer className="mt-auto flex justify-end pt-4">
        <button
          type="button"
          onClick={() => onView(project)}
          className="text-[13px] font-medium text-zinc-900 hover:underline dark:text-white"
        >
          View project →
        </button>
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
    </article>
  );
}
