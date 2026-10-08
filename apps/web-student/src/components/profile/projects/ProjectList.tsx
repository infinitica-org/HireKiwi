'use client';

import type { ProjectDto } from '@hirekiwi/contracts';
import { Plus } from 'lucide-react';
import { ProjectCard } from '@/components/profile/projects/ProjectCard';
import type { StackTagCount } from '@/lib/project-submission';

type ProjectListProps = {
  projects: ProjectDto[];
  topStack: StackTagCount[];
  canSubmit: boolean;
  onView: (project: ProjectDto) => void;
  onDelete?: (projectId: string) => void;
  onAdd: () => void;
};

export function ProjectList({
  projects,
  topStack,
  canSubmit,
  onView,
  onDelete,
  onAdd,
}: ProjectListProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-heading text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
          Your projects
          <span className="ml-1.5 font-normal text-zinc-500 dark:text-zinc-400">
            ({projects.length})
          </span>
        </h2>
      </div>

      {topStack.length > 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Your technology stack ·{' '}
          </span>
          {topStack.map(({ tag, count }, index) => (
            <span key={tag}>
              {index > 0 ? ' · ' : ''}
              {tag}
              {count > 1 ? ` (${count})` : ''}
            </span>
          ))}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.projectId}
            project={project}
            onView={onView}
            onDelete={onDelete}
          />
        ))}
        {canSubmit ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center font-sans transition-colors hover:border-teal-600 hover:bg-teal-50/40 dark:border-zinc-700 dark:hover:border-teal-500 dark:hover:bg-teal-950/20"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-zinc-100 text-teal-600 dark:bg-zinc-800 dark:text-teal-400">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Add another project
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
