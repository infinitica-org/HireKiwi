'use client';

import { FileText, Loader2, Trash2 } from 'lucide-react';
import type { CandidateResumeFile } from '@hirekiwi/contracts';

import { formatResumeSize } from '@/lib/resume-list';
import { EntryCard, EntryIconTile } from '../shared/entry-card-ui';

interface ResumeEntryCardProps {
  file: CandidateResumeFile;
  accentIndex?: number;
  isPrimary?: boolean;
  deleting: boolean;
  onDelete: () => void;
}

export function ResumeEntryCard({ file, deleting, onDelete }: ResumeEntryCardProps) {
  const uploadedLabel = new Date(file.uploadedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <EntryCard className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <EntryIconTile icon={FileText} />
          <div className="min-w-0">
            <h3
              className="font-heading truncate text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-white"
              title={file.fileName}
            >
              {file.fileName}
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-zinc-500 dark:text-zinc-400">
              <span>PDF</span>
              <span aria-hidden>·</span>
              <span>{formatResumeSize(file.fileSizeBytes)}</span>
              <span aria-hidden>·</span>
              <span>Uploaded {uploadedLabel}</span>
              {file.lastParsedAt ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Parsed for profile</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Remove Resume ${file.fileName}`}
          title="Remove Resume"
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-md px-2.5 py-1.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 sm:self-center dark:text-zinc-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
        >
          {deleting ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
          )}
          <span>{deleting ? 'Removing…' : 'Remove Resume'}</span>
        </button>
      </div>
    </EntryCard>
  );
}
