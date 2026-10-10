'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileUp,
  Info,
  Link2,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import type { LookupCertificateLinkResponse } from '@hirekiwi/contracts';
import {
  VIVI_FIELD,
  VIVI_GHOST_BUTTON,
  VIVI_LABEL,
  VIVI_PRIMARY_BUTTON,
} from '@/components/vivi-verification/vivi-field-classes';
import { api } from '@/lib/api';
import type { CertificateDetailsPayload } from './certificate-details-form';

const ACCEPTED_FILES =
  '.pdf,.png,.jpg,.jpeg,.json,application/pdf,image/png,image/jpeg,application/json';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_JSON_BYTES = 64 * 1024;
const LOOKUP_DEBOUNCE_MS = 500;

/** The platforms checked instantly; anything else still works, it is just reviewed by hand. */
const INSTANT_PLATFORMS = 'Credly, Coursera, HackerRank or NPTEL';

function parseUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export interface CertificateLinkFormProps {
  initialValues?: Partial<CertificateDetailsPayload>;
  /** `file` is set when the student chose to upload the certificate instead of (or as well as) a link. */
  onSubmit: (details: CertificateDetailsPayload, file: File | null) => void;
  isPending?: boolean;
  error?: string | null;
  submitLabel?: string;
  onCancel?: () => void;
  /** A field shown first, above the link (the Type choice in the profile popup). */
  topField?: ReactNode;
  /** Editing a certificate that already has a file: no new link or file is required. */
  hasExistingProof?: boolean;
}

type LookupState =
  { kind: 'idle' } | { kind: 'checking' } | { kind: 'done'; result: LookupCertificateLinkResponse };

/**
 * Adding a certificate starts from its link: paste it and the issuer is asked right away, so the
 * student sees what it is and whose it is before saving, and the title and issuer fill themselves
 * in. No link? Upload the certificate instead — its QR code or verify link is read for them.
 */
export function CertificateLinkForm({
  initialValues,
  onSubmit,
  isPending,
  error,
  submitLabel = 'Add certificate',
  onCancel,
  topField,
  hasExistingProof = false,
}: CertificateLinkFormProps) {
  const [url, setUrl] = useState(initialValues?.verificationUrl ?? '');
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [issuer, setIssuer] = useState(initialValues?.issuer ?? '');
  const [certificateNumber, setCertificateNumber] = useState(
    initialValues?.certificateNumber ?? '',
  );
  const [issueDate, setIssueDate] = useState(initialValues?.issueDate ?? '');
  const [expiryDate, setExpiryDate] = useState(initialValues?.expiryDate ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showMore, setShowMore] = useState(
    Boolean(
      initialValues?.certificateNumber || initialValues?.issueDate || initialValues?.expiryDate,
    ),
  );
  const [touched, setTouched] = useState(false);
  const [lookup, setLookup] = useState<LookupState>({ kind: 'idle' });
  const fileInput = useRef<HTMLInputElement>(null);
  // Fields the preview filled in may be refilled by the next preview; fields the student typed
  // in themselves are never overwritten.
  const autoFilled = useRef({ title: false, issuer: false, issueDate: false, expiryDate: false });

  const parsedUrl = url.trim() ? parseUrl(url) : null;
  const urlInvalid = url.trim().length > 0 && !parsedUrl;

  useEffect(() => {
    if (!parsedUrl) {
      setLookup({ kind: 'idle' });
      return;
    }
    const href = parsedUrl.toString();
    let cancelled = false;
    const timer = setTimeout(() => {
      setLookup({ kind: 'checking' });
      api.candidateCertificates
        .lookupLink({ url: href })
        .then((result) => {
          if (cancelled) return;
          setLookup({ kind: 'done', result });
          const fill = (
            key: keyof typeof autoFilled.current,
            value: string | null,
            current: string,
            set: (next: string) => void,
          ) => {
            if (!value || (current.trim() && !autoFilled.current[key])) return;
            set(value);
            autoFilled.current[key] = true;
          };
          fill('title', result.title, title, setTitle);
          fill('issuer', result.issuer, issuer, setIssuer);
          fill('issueDate', result.issueDate, issueDate, setIssueDate);
          fill('expiryDate', result.expiryDate, expiryDate, setExpiryDate);
        })
        .catch(() => {
          if (!cancelled) setLookup({ kind: 'idle' });
        });
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Only a new link triggers a lookup; the field values are read when it resolves.
  }, [parsedUrl?.toString()]);

  const titleError =
    touched && title.trim().length < 3 ? 'Add the certificate name (at least 3 characters).' : null;
  const issuerError =
    touched && issuer.trim().length < 2 ? 'Add who issued it (e.g. Cisco, Coursera).' : null;
  const proofMissing = !parsedUrl && !file && !hasExistingProof;
  const proofError = touched && proofMissing ? "Paste the certificate's link or upload it." : null;

  const chooseFile = (chosen: File | null) => {
    setFileError(null);
    if (!chosen) return setFile(null);
    const isJson = chosen.type === 'application/json' || chosen.name.endsWith('.json');
    if (chosen.size > (isJson ? MAX_JSON_BYTES : MAX_FILE_BYTES)) {
      setFileError(
        isJson ? 'A credential file must be 64KB or smaller.' : 'Files must be 10MB or smaller.',
      );
      return;
    }
    setFile(chosen);
  };

  const submit = () => {
    setTouched(true);
    if (title.trim().length < 3 || issuer.trim().length < 2 || urlInvalid || proofMissing) return;
    onSubmit(
      {
        title: title.trim(),
        issuer: issuer.trim(),
        certificateNumber: certificateNumber.trim() || undefined,
        issueDate: issueDate.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        verificationUrl: parsedUrl?.toString(),
      },
      file,
    );
  };

  const errorText = (message: string | null) =>
    message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-5"
    >
      {topField}

      <div>
        <label htmlFor="cert-link" className={VIVI_LABEL}>
          Certificate link
        </label>
        <div className="relative">
          <Link2
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            id="cert-link"
            name="verificationUrl"
            type="url"
            inputMode="url"
            autoComplete="off"
            value={url}
            disabled={isPending}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Paste the link to your certificate or badge"
            className={`${VIVI_FIELD} pl-10`}
          />
        </div>
        {urlInvalid ? (
          errorText('That doesn’t look like a web link. It should start with https://')
        ) : (
          <p className="mt-1.5 text-xs text-zinc-500">
            {INSTANT_PLATFORMS} links are verified instantly. Other sites are reviewed by our team.
          </p>
        )}
        <LinkPreview state={lookup} />
      </div>

      {showUpload || file ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <span className={VIVI_LABEL}>Certificate file</span>
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <span className="flex min-w-0 items-center gap-2 text-zinc-700 dark:text-zinc-200">
                <FileUp className="size-4 shrink-0 text-zinc-400" aria-hidden />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                type="button"
                onClick={() => chooseFile(null)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
                aria-label="Remove file"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-zinc-300 px-4 py-5 text-sm text-zinc-600 transition-colors hover:border-pink-400 hover:bg-pink-50/40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-pink-500/5"
            >
              <FileUp className="size-5 text-zinc-400" aria-hidden />
              <span className="font-medium">Choose a PDF, image or credential file</span>
              <span className="text-xs text-zinc-500">
                We read the QR code or verify link on it for you.
              </span>
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_FILES}
            className="hidden"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
          />
          {errorText(fileError)}
        </motion.div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="-mt-2 self-start text-xs font-medium text-pink-600 hover:text-pink-700 hover:underline"
        >
          No link? Upload the certificate instead
        </button>
      )}
      {errorText(proofError)}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cert-title" className={VIVI_LABEL}>
            Certificate name<span className="text-red-600"> *</span>
          </label>
          <input
            id="cert-title"
            name="title"
            value={title}
            disabled={isPending}
            onChange={(event) => {
              autoFilled.current.title = false;
              setTitle(event.target.value);
            }}
            placeholder="e.g. AWS Certified Cloud Practitioner"
            className={VIVI_FIELD}
          />
          {errorText(titleError)}
        </div>
        <div>
          <label htmlFor="cert-issuer" className={VIVI_LABEL}>
            Issued by<span className="text-red-600"> *</span>
          </label>
          <input
            id="cert-issuer"
            name="issuer"
            value={issuer}
            disabled={isPending}
            onChange={(event) => {
              autoFilled.current.issuer = false;
              setIssuer(event.target.value);
            }}
            placeholder="e.g. Amazon Web Services"
            className={VIVI_FIELD}
          />
          {errorText(issuerError)}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowMore((open) => !open)}
          aria-expanded={showMore}
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          <ChevronDown
            className={`size-3.5 transition-transform ${showMore ? 'rotate-180' : ''}`}
            aria-hidden
          />
          More details (optional)
        </button>
        {showMore ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <div>
              <label htmlFor="cert-number" className={VIVI_LABEL}>
                Certificate number
              </label>
              <input
                id="cert-number"
                name="certificateNumber"
                value={certificateNumber}
                disabled={isPending}
                onChange={(event) => setCertificateNumber(event.target.value)}
                placeholder="e.g. NPTEL roll number"
                className={VIVI_FIELD}
              />
            </div>
            <div>
              <label htmlFor="cert-issued" className={VIVI_LABEL}>
                Issue date
              </label>
              <input
                id="cert-issued"
                name="issueDate"
                type="date"
                value={issueDate}
                disabled={isPending}
                onChange={(event) => {
                  autoFilled.current.issueDate = false;
                  setIssueDate(event.target.value);
                }}
                className={VIVI_FIELD}
              />
            </div>
            <div>
              <label htmlFor="cert-expiry" className={VIVI_LABEL}>
                Valid until
              </label>
              <input
                id="cert-expiry"
                name="expiryDate"
                type="date"
                value={expiryDate}
                disabled={isPending}
                onChange={(event) => {
                  autoFilled.current.expiryDate = false;
                  setExpiryDate(event.target.value);
                }}
                className={VIVI_FIELD}
              />
            </div>
          </motion.div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {error}
        </div>
      ) : null}

      <div className="sticky bottom-0 z-10 mt-1 flex items-center justify-between gap-3 border-t border-[var(--ds-border)] bg-[var(--ds-surface)] py-4">
        {onCancel ? (
          <button type="button" onClick={onCancel} className={VIVI_GHOST_BUTTON}>
            Cancel
          </button>
        ) : (
          <span />
        )}
        <button type="submit" disabled={isPending} className={VIVI_PRIMARY_BUTTON}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}

const PREVIEW_TONES = {
  good: {
    box: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
  },
  warn: {
    box: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30',
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
  },
  bad: {
    box: 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30',
    icon: XCircle,
    iconClass: 'text-red-600',
  },
  neutral: {
    box: 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900',
    icon: Info,
    iconClass: 'text-zinc-500',
  },
} as const;

function previewTone(result: LookupCertificateLinkResponse): keyof typeof PREVIEW_TONES {
  if (result.outcome === 'verified') return result.nameMatches === false ? 'warn' : 'good';
  if (
    result.outcome === 'not_found' ||
    result.outcome === 'revoked' ||
    result.outcome === 'expired'
  )
    return 'bad';
  return 'neutral';
}

function LinkPreview({ state }: { state: LookupState }) {
  if (state.kind === 'idle') return null;
  if (state.kind === 'checking') {
    return (
      <motion.div
        key="checking"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-3 flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        role="status"
      >
        <Loader2 className="size-4 animate-spin text-pink-500" aria-hidden />
        Checking with the issuer…
      </motion.div>
    );
  }
  const { result } = state;
  const tone = PREVIEW_TONES[previewTone(result)];
  const Icon = tone.icon;
  return (
    <motion.div
      key={`${result.outcome}-${result.title ?? ''}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`mt-3 flex items-start gap-3 rounded-lg border px-3.5 py-3 ${tone.box}`}
      role="status"
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${tone.iconClass}`} aria-hidden />
      <div className="min-w-0 text-sm">
        {result.title ? (
          <p className="font-semibold text-zinc-900 dark:text-white">
            {result.title}
            {result.issuer ? (
              <span className="font-normal text-zinc-500"> · {result.issuer}</span>
            ) : null}
          </p>
        ) : null}
        <p className="text-zinc-700 dark:text-zinc-300">{result.message}</p>
      </div>
    </motion.div>
  );
}
