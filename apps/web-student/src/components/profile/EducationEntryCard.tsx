'use client';

import { CheckCircle2, Clock, Pencil, School, Trash2, XCircle } from 'lucide-react';
import type { CandidateEducationDto } from '@hirekiwi/contracts';
import { parseEducationDisplay } from '@/lib/education-entry-presenters';
import {
  EntryBadge,
  EntryCard,
  EntryFact,
  EntryFacts,
  EntryFooter,
  EntryHeader,
  EntryIconButton,
  EntryIconTile,
  entryPrimaryButtonClass,
} from './entry-card-ui';

interface EducationEntryCardProps {
  education: CandidateEducationDto;
  accentIndex?: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddProof: () => void;
}

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

  const isVerified = education.status === 'verified';
  const isRejected = education.status === 'rejected';
  const isPending = !isVerified && !isRejected;

  return (
    <EntryCard>
      <EntryHeader
        leading={<EntryIconTile icon={School} />}
        title={display.programTitle}
        subtitle={`${institutionLine}${rollLine}`}
        badges={
          <>
            {isVerified ? (
              <EntryBadge tone="success" icon={CheckCircle2}>
                Verified
              </EntryBadge>
            ) : null}
            {isPending ? (
              <EntryBadge tone="warning" icon={Clock}>
                Pending review
              </EntryBadge>
            ) : null}
            {isRejected ? (
              <EntryBadge tone="danger" icon={XCircle}>
                Rejected
              </EntryBadge>
            ) : null}
            {education.current ? <EntryBadge>Current</EntryBadge> : null}
          </>
        }
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

      <EntryFacts>
        <EntryFact label="Duration">{display.dateRangeLabel}</EntryFact>
        <EntryFact label="Grading scale">{display.scoreSummary}</EntryFact>
        <EntryFact label="Final score">
          <span className="text-lg font-semibold">{display.finalScore}</span>
        </EntryFact>
        <EntryFact label="Verification documents">
          {docCount === 0 ? 'No files attached' : `${docCount} document(s)`}
        </EntryFact>
      </EntryFacts>

      <EntryFooter>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {docCount === 0 ? 'Add proof to get this verified' : 'Proof attached'}
        </span>
        <button type="button" onClick={onAddProof} className={entryPrimaryButtonClass}>
          {docCount > 0 ? 'Manage' : 'Upload'}
        </button>
      </EntryFooter>

      {isRejected && education.rejectionReason ? (
        <p className="border-t border-rose-100 bg-rose-50 px-5 py-2.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {education.rejectionReason}
        </p>
      ) : null}
    </EntryCard>
  );
}
