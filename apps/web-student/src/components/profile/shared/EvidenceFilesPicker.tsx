'use client';

import { useRef, useState } from 'react';
import { FileText, Paperclip, X } from 'lucide-react';
import { EVIDENCE_ACCEPT, EVIDENCE_HINT, validateEvidenceFile } from '@/lib/evidence-upload';

type EvidenceFilesPickerProps = {
  /** Files chosen but not yet uploaded. */
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
  /** Upper bound on queued files for one submit. */
  maxFiles?: number;
};

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Th6-600 — evidence file picker shared by project (and other) forms: PDF/PNG, 10 MB each.
 * Files are validated here and re-verified on the server (magic bytes, size, virus scan).
 */
export function EvidenceFilesPicker({
  files,
  onChange,
  disabled = false,
  label = 'Evidence files (optional)',
  maxFiles = 5,
}: EvidenceFilesPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const add = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files];
    for (const file of Array.from(picked)) {
      const problem = validateEvidenceFile(file);
      if (problem) {
        setError(`${file.name}: ${problem}`);
        continue;
      }
      if (next.length >= maxFiles) {
        setError(`You can attach up to ${String(maxFiles)} files.`);
        break;
      }
      next.push(file);
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div data-testid="evidence-files-picker">
      <span className="mb-1.5 block text-sm font-medium text-[var(--ds-text)]">{label}</span>
      <button
        type="button"
        onClick={() => {
          setError(null);
          inputRef.current?.click();
        }}
        disabled={disabled || files.length >= maxFiles}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50"
      >
        <Paperclip className="size-4" aria-hidden />
        Attach evidence
        <span className="font-normal text-zinc-400">· {EVIDENCE_HINT}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={EVIDENCE_ACCEPT}
        multiple
        hidden
        aria-label="Evidence file"
        onChange={(event) => add(event.target.files)}
      />
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      ) : null}
      {files.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${String(index)}`}
              className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs"
            >
              <FileText className="size-4 shrink-0 text-zinc-400" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-800">{file.name}</span>
              <span className="shrink-0 text-zinc-400">{formatSize(file.size)}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
