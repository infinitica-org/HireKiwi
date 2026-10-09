'use client';

import { Pencil, School, Trash2 } from 'lucide-react';
import type { CandidateEducationDto } from '@hirekiwi/contracts';
import { parseEducationDisplay } from '@/lib/education-entry-presenters';
import {
  EntryBadge,
  EntryCard,
  EntryFact,
  EntryHeader,
  EntryIconButton,
  EntryIconTile,
  entryTextButtonClass,
} from './entry-card-ui';

interface EducationEntryCardProps {
  education: CandidateEducationDto;
  accentIndex?: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddProof: () => void;
}

/** One education entry: what you studied, where, when and your score. No review status shown. */
export function EducationEntryCard({
  education,
  onEdit,
  onDelete,
  onAddProof,
}: EducationEntryCardProps) {
  const display = parseEducationDisplay(education);
  const docCount = education.documents?.length ?? 0;
  const institutionLine = display.boardName
    ? `${display.schoolName} · ${display.boardName}`
    : display.schoolName;
  const details = education.degreeDetails;
  const rollLine = details?.rollNumber
    ? ` · Roll ${details.rollNumber}${details.currentSemester ? ` · Sem ${details.currentSemester}` : ''}`
    : '';

  return (
    <EntryCard>
      <EntryHeader
        leading={<EntryIconTile icon={School} />}
        title={display.programTitle}
        subtitle={`${institutionLine}${rollLine}`}
        badges={education.current ? <EntryBadge>Current</EntryBadge> : null}
        actions={
          <>
            <EntryIconButton label="Edit education" onClick={onEdit}>
              <Pencil className="size-4" strokeWidth={1.75} />
            </EntryIconButton>
            <EntryIconButton label="Delete education" onClick={onDelete} danger>
              <Trash2 className="size-4" strokeWidth={1.75} />
            </EntryIconButton>
          </>
        }
      />

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-zinc-100 px-5 py-4 text-sm sm:grid-cols-3 dark:border-zinc-800">
        <EntryFact label="Duration">{display.dateRangeLabel}</EntryFact>
        <EntryFact label="Score">{display.scoreSummary}</EntryFact>
        <EntryFact label="Proof">
          <span className="flex items-center gap-2.5">
            <span>
              {docCount === 0 ? 'None yet' : `${docCount} document${docCount === 1 ? '' : 's'}`}
            </span>
            <button type="button" onClick={onAddProof} className={entryTextButtonClass}>
              {docCount > 0 ? 'Manage' : 'Upload'}
            </button>
          </span>
        </EntryFact>
      </dl>

      {education.status === 'rejected' && education.rejectionReason ? (
        <p className="border-t border-rose-100 bg-rose-50 px-5 py-2.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {education.rejectionReason}
        </p>
      ) : null}
    </EntryCard>
  );
}
