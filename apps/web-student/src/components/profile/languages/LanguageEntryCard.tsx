'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { CandidateLanguageDto } from '@hirekiwi/contracts';

interface LanguageEntryCardProps {
  entry: CandidateLanguageDto;
  accentIndex?: number;
  onEdit: () => void;
  onDelete: () => void;
}

const ACTION_BUTTON =
  'flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white';

/** One language: its initials in a tile, the name and the proficiency in words, with quiet edit and delete actions. */
export function LanguageEntryCard({ entry, onEdit, onDelete }: LanguageEntryCardProps) {
  const initials = entry.language.trim().slice(0, 2).toUpperCase() || '—';

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-[#161616]">
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold tracking-wide text-white dark:bg-white dark:text-zinc-900"
      >
        {initials}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-semibold text-zinc-950 dark:text-white">
          {entry.language}
        </h3>
        <p className="mt-0.5 truncate text-[13px] text-zinc-500">{entry.proficiency}</p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${entry.language}`}
          className={ACTION_BUTTON}
        >
          <Pencil className="size-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${entry.language}`}
          className={`${ACTION_BUTTON} hover:!bg-red-50 hover:!text-red-600`}
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </article>
  );
}
