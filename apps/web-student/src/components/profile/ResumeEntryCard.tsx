'use client';

import { FileText, Loader2, Trash2 } from 'lucide-react';
import type { CandidateResumeFile } from '@hirekiwi/contracts';

import { formatResumeSize } from '@/lib/resume-list';

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
    <article className="overflow-hidden rounded-lg border border-zinc-200/90 bg-white p-4 shadow-2xs transition-shadow hover:shadow-xs font-[family-name:var(--tpo-font-sans)] select-none dark:border-zinc-800 dark:bg-[#161616]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* PDF icon badge */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-rose-200/80 bg-rose-50 text-rose-600 shadow-2xs dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400">
            <FileText className="size-5" strokeWidth={1.75} aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className="truncate text-[15px] font-medium font-body tracking-tight text-zinc-950 dark:text-white"
                title={file.fileName}
              >
                {file.fileName}
              </h3>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">PDF</span>
              <span>•</span>
              <span>{formatResumeSize(file.fileSizeBytes)}</span>
              <span>•</span>
              <span>Uploaded {uploadedLabel}</span>
              {file.lastParsedAt ? (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Parsed for profile</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Remove button */}
        <div className="flex items-center font-display  justify-end sm:shrink-0">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label={`Remove Resume ${file.fileName}`}
            title="Remove Resume"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Trash2
                className="size-3.5 text-zinc-500 dark:text-zinc-400"
                strokeWidth={1.75}
                aria-hidden
              />
            )}
            <span>{deleting ? 'Removing…' : 'Remove Resume'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
