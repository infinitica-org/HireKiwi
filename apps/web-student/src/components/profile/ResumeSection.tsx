'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, FileText, Loader2, Plus, Upload } from 'lucide-react';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import {
  RESUME_MAX_FILE_SIZE_BYTES,
  RESUME_VALIDATION_MESSAGES,
  type CandidateResumeFile,
} from '@hirekiwi/contracts';
import { api } from '@/lib/api';
import { ResumeEntryCard } from '@/components/profile/ResumeEntryCard';
import {
  ProfileBentoEmptyPanel,
  ProfileSectionError,
  ProfileSectionHeader,
} from '@/components/profile/ProfileSectionChrome';
import { profilePrimaryButtonSmClass } from '@/lib/profile-ui-classes';
import { profileSectionMeta } from '@/lib/profile-sections';
import { normalizeResumeFiles } from '@/lib/resume-list';
import { extractResumeRawText } from '@/lib/extract-resume-text';

type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'success' | 'failed';

export function ResumeSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [resumeFiles, setResumeFiles] = useState<CandidateResumeFile[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [retryCooldown, setRetryCooldown] = useState(0);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const meta = profileSectionMeta('resume');

  useEffect(() => {
    if (retryCooldown <= 0) return;
    const timer = setInterval(() => {
      setRetryCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCooldown]);

  const loadResume = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.users.getResume();
      setResumeFiles(normalizeResumeFiles(response));
    } catch (err: unknown) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not load resume status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResume();
  }, []);

  const hasResume = resumeFiles.length > 0;
  const busy = uploadStatus === 'uploading' || uploadStatus === 'parsing';
  const isActionDisabled = busy || retryCooldown > 0;

  const startUpload = async (file: File) => {
    if (isActionDisabled || isUploadingRef.current) return;
    isUploadingRef.current = true;

    // --- Cheap, synchronous client-side validation ---
    // These checks never enter the uploading state — they show the error
    // immediately and stop execution.  Do NOT call the API for these.

    if (hasResume) {
      setError(RESUME_VALIDATION_MESSAGES.REMOVE_EXISTING_FIRST);
      isUploadingRef.current = false;
      return;
    }

    // MIME type AND extension must both indicate PDF.  Accepting one without
    // the other allows random non-PDF files through.  We check OR (either)
    // here because the browser may not always set the MIME type for a
    // legitimate PDF saved without a declared MIME.  The backend is
    // authoritative; this is just an early rejection for obvious cases.
    const isPdfMime = file.type === 'application/pdf' || file.type === '';
    const isPdfExt = /\.pdf$/i.test(file.name);
    if (!isPdfExt || (!isPdfMime && file.type !== '')) {
      setError(RESUME_VALIDATION_MESSAGES.ONLY_PDF_ALLOWED);
      isUploadingRef.current = false;
      return;
    }

    if (file.size > RESUME_MAX_FILE_SIZE_BYTES) {
      setError(RESUME_VALIDATION_MESSAGES.MAX_SIZE_EXCEEDED);
      isUploadingRef.current = false;
      return;
    }

    // --- Upload (async; spinner must always terminate) ---
    setError(null);
    setParseMessage(null);
    setUploadStatus('uploading');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const uploaded = await api.users.uploadResume(file, file.name);
      const nextFiles = normalizeResumeFiles(uploaded);
      setResumeFiles(nextFiles);
      setUploadStatus('parsing');

      // Best-effort parse for pre-fill — never blocks or rejects the upload.
      try {
        const rawText = await extractResumeRawText(file);
        if (rawText && rawText.trim().length >= 40) {
          const parsed = await api.users.parseResume({ rawText });
          if (parsed.status === 'PARSED') {
            setParseMessage(
              'Resume uploaded and parsed — check other profile sections for pre-fill suggestions.',
            );
          } else {
            setParseMessage(
              'Resume uploaded. Parsing could not extract structured data this time.',
            );
          }
        } else {
          setParseMessage('Resume uploaded successfully.');
        }
      } catch {
        // Parse failure is non-fatal.
        setParseMessage('Resume uploaded. Profile pre-fill will be available shortly.');
      }

      setUploadStatus('success');
    } catch (err: unknown) {
      let message = "We couldn't upload your resume. Please check your connection and try again.";

      if (err instanceof DOMException && err.name === 'AbortError') {
        message =
          'The upload timed out. Please try again with a smaller file or better connection.';
      } else if (isHireKiwiApiError(err)) {
        if (
          err.statusCode === 503 ||
          err.code === 'storage_unavailable' ||
          err.code === 'validation_service_unavailable'
        ) {
          message =
            err.message ||
            'Object storage is temporarily unavailable. Please retry in a few moments.';
        } else if (err.statusCode === 429 || err.code === 'rate_limit_exceeded') {
          const waitSec = err.retryAfterSeconds ?? 10;
          setRetryCooldown(waitSec);
          message = `Too many upload attempts. Please wait ${waitSec} seconds before retrying.`;
        } else {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      setUploadStatus('failed');
    } finally {
      clearTimeout(timeout);
      isUploadingRef.current = false;
    }
  };

  const handleDelete = async (objectKey: string) => {
    if (
      !confirm('Remove this resume from your profile? You can upload a new resume after removal.')
    ) {
      return;
    }
    setDeletingKey(objectKey);
    setError(null);
    setParseMessage(null);
    try {
      const response = await api.users.deleteResume(objectKey);
      setResumeFiles(response.resumeFiles);
    } catch (err: unknown) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not remove resume.');
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-4 font-[family-name:var(--tpo-font-sans)]"
      aria-label="Resume"
    >
      <ProfileSectionHeader title={meta.title} description={meta.description} />

      {!loading && !hasResume ? (
        <div className="flex flex-wrap items-center gap-2 select-none">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-zinc-100/90 px-3 py-1 text-xs font-bold tracking-tight text-zinc-900 shadow-2xs dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-100">
            <FileText className="size-3.5 text-zinc-700 dark:text-zinc-300" aria-hidden />
            PDF only
          </span>
          <span className="inline-flex items-center rounded-lg border border-zinc-200/90 bg-zinc-100/90 px-3 py-1 text-xs font-bold tracking-tight text-zinc-900 shadow-2xs dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-100">
            Maximum size: 5 MB
          </span>
        </div>
      ) : null}

      {loading ? <p className="text-sm text-[var(--ds-text-muted)]">Loading resume…</p> : null}

      {!loading && !hasResume ? (
        <ProfileBentoEmptyPanel
          tipIcon={FileText}
          tipIconClassName="text-[var(--student-info)]"
          tipTitle="Keep your verified resume current"
          tipBody="Upload your resume in PDF format (up to 5 MB)."
          emptyIcon={Upload}
          emptyTitle="No resume yet"
          emptyBody="Upload a PDF resume to attach it to your profile and optionally parse it for faster data entry."
          actions={
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={() => fileInputRef.current?.click()}
                className={`${profilePrimaryButtonSmClass} justify-center px-5 py-2.5 text-[13px] disabled:opacity-50`}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-4" strokeWidth={2} aria-hidden />
                )}
                {retryCooldown > 0 ? `Wait ${retryCooldown}s to retry` : 'Upload your resume'}
              </button>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                PDF only • Maximum size: 5 MB
              </span>
            </div>
          }
        />
      ) : null}

      {!loading && hasResume ? (
        <div className="flex max-w-2xl flex-col gap-3">
          {resumeFiles.map((file, index) => (
            <ResumeEntryCard
              key={file.objectKey}
              file={file}
              accentIndex={index}
              isPrimary={true}
              deleting={deletingKey === file.objectKey}
              onDelete={() => void handleDelete(file.objectKey)}
            />
          ))}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            A profile can only have one active resume. To upload a different resume, remove the
            current one first.
          </p>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        disabled={isActionDisabled}
        className="hidden"
        accept=".pdf,application/pdf"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void startUpload(file);
          event.target.value = '';
        }}
      />

      {busy ? (
        <p className="text-sm text-[var(--ds-text-secondary)]">
          {uploadStatus === 'uploading' ? 'Uploading resume…' : 'Parsing resume…'}
        </p>
      ) : null}

      {parseMessage ? (
        <div className="rounded-[18px] border border-[var(--ds-green)]/20 bg-[var(--ds-green-soft)]/50 px-4 py-3.5 text-sm text-[var(--ds-text)]">
          {parseMessage}
        </div>
      ) : null}

      {error ? (
        <ProfileSectionError>
          <span className="inline-flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </span>
        </ProfileSectionError>
      ) : null}
    </section>
  );
}
