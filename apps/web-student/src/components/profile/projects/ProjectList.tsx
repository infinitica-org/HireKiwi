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
  onVerify?: (project: ProjectDto) => void;
  onAdd: () => void;
};

export function ProjectList({
  projects,
  topStack,
  canSubmit,
  onView,
  onDelete,
  onVerify,
  onAdd,
}: ProjectListProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-heading text-md font-medium tracking-tight text-zinc-950 dark:text-white">
          Your projects
          <span className="ml-1.5 font-normal text-zinc-500 dark:text-zinc-400">
            ({projects.length})
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.projectId}
            project={project}
            onView={onView}
            onDelete={onDelete}
            onVerify={onVerify}
          />
        ))}
      </div>
    </div>
  );
}
