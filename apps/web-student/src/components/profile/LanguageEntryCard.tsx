'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { CandidateLanguageDto } from '@hirekiwi/contracts';

import { proficiencyTier } from '@/lib/language-entry-presenters';
import { EntryCard, EntryHeader, EntryIconButton } from './entry-card-ui';

interface LanguageEntryCardProps {
  entry: CandidateLanguageDto;
  accentIndex?: number;
  onEdit: () => void;
  onDelete: () => void;
}

const LEVELS = [1, 2, 3, 4, 5] as const;

export function LanguageEntryCard({ entry, onEdit, onDelete }: LanguageEntryCardProps) {
  const tier = proficiencyTier(entry.proficiency);

  return (
    <EntryCard>
      <EntryHeader
        title={entry.language}
        subtitle={entry.proficiency}
        actions={
          <>
            <EntryIconButton label={`Edit ${entry.language}`} onClick={onEdit}>
              <Pencil className="size-4" strokeWidth={1.75} />
            </EntryIconButton>
            <EntryIconButton label={`Delete ${entry.language}`} onClick={onDelete} danger>
              <Trash2 className="size-4" strokeWidth={1.75} />
            </EntryIconButton>
          </>
        }
      />

      <div
        className="flex items-center gap-1 px-5 pb-4"
        role="img"
        aria-label={`Proficiency level ${tier} of 5`}
      >
        {LEVELS.map((level) => (
          <span
            key={level}
            className={`h-1 flex-1 rounded-full ${
              level <= tier ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>
    </EntryCard>
  );
}
