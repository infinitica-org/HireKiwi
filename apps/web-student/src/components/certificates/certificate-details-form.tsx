'use client';

import { useState } from 'react';
import { Button, Input } from '@hirekiwi/ui';
import { Award } from 'lucide-react';
import {
  experienceInputClass,
  experienceLabelClass,
} from '@/components/profile/work-experience/work-experience-ui';
import {
  profilePrimaryButtonSmClass,
  profileSecondaryButtonSmClass,
} from '@/lib/profile-ui-classes';

export interface CertificateDetailsPayload {
  title: string;
  issuer: string;
  certificateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  verificationUrl?: string;
}

interface CertificateDetailsFormProps {
  initialValues?: Partial<CertificateDetailsPayload>;
  onSubmit: (details: CertificateDetailsPayload) => void;
  isPending?: boolean;
  error?: string | null;
  submitLabel?: string;
  /** Popup layout, matching the Education and Work experience popups. */
  embedded?: boolean;
  /** Popup only: the Cancel button. */
  onCancel?: () => void;
}

/** An empty value is fine (the link is optional); anything else must be an http(s) URL. */
function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function CertificateDetailsForm({
  initialValues,
  onSubmit,
  isPending,
  error,
  submitLabel = 'Continue to Next Step',
  embedded = false,
  onCancel,
}: CertificateDetailsFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [issuer, setIssuer] = useState(initialValues?.issuer ?? '');
  const [certificateNumber, setCertificateNumber] = useState(
    initialValues?.certificateNumber ?? '',
  );
  const [issueDate, setIssueDate] = useState(initialValues?.issueDate ?? '');
  const [expiryDate, setExpiryDate] = useState(initialValues?.expiryDate ?? '');
  const [verificationUrl, setVerificationUrl] = useState(initialValues?.verificationUrl ?? '');
  const [touched, setTouched] = useState(false);

  const titleError =
    touched && title.trim().length < 3
      ? 'Enter the certificate title (at least 3 characters).'
      : undefined;
  const issuerError =
    touched && issuer.trim().length < 2
      ? 'Enter the issuing provider (e.g. AWS, Coursera).'
      : undefined;

  // Judged on the current value, not on `touched`: the first click on Save must already refuse
  // a bad link, and `touched` only becomes true after that click.
  const urlInvalid = !isValidUrl(verificationUrl);
  const urlError =
    touched && urlInvalid ? 'Enter a valid URL starting with http:// or https://' : undefined;

  const handleSubmit = () => {
    setTouched(true);
    if (title.trim().length < 3 || issuer.trim().length < 2 || urlInvalid) {
      return;
    }
    onSubmit({
      title: title.trim(),
      issuer: issuer.trim(),
      certificateNumber: certificateNumber.trim() || undefined,
      issueDate: issueDate.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      verificationUrl: verificationUrl.trim() || undefined,
    });
  };

  if (embedded) {
    const fieldClass = `${experienceInputClass} disabled:opacity-60`;
    const errorText = (message?: string) =>
      message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
    return (
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-5"
      >
        <section className="space-y-4">
          <div>
            <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--ds-text)]">
              Certificate details
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--ds-text-muted)]">
              Enter the provider, credential details and a valid verification link.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cert-issuer" className={experienceLabelClass}>
                Certification provider (issuer)<span className="text-red-600"> *</span>
              </label>
              <input
                id="cert-issuer"
                name="issuer"
                value={issuer}
                disabled={isPending}
                onChange={(event) => setIssuer(event.target.value)}
                placeholder="e.g. Amazon Web Services"
                className={fieldClass}
              />
              {errorText(issuerError)}
            </div>
            <div>
              <label htmlFor="cert-title" className={experienceLabelClass}>
                Certification name (title)<span className="text-red-600"> *</span>
              </label>
              <input
                id="cert-title"
                name="title"
                value={title}
                disabled={isPending}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. AWS Certified Solutions Architect"
                className={fieldClass}
              />
              {errorText(titleError)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="cert-number" className={experienceLabelClass}>
                Certificate number
              </label>
              <input
                id="cert-number"
                name="certificateNumber"
                value={certificateNumber}
                disabled={isPending}
                onChange={(event) => setCertificateNumber(event.target.value)}
                placeholder="AWS-12345678"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="cert-issued" className={experienceLabelClass}>
                Issue date
              </label>
              <input
                id="cert-issued"
                name="issueDate"
                type="date"
                value={issueDate}
                disabled={isPending}
                onChange={(event) => setIssueDate(event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="cert-expiry" className={experienceLabelClass}>
                Valid through
              </label>
              <input
                id="cert-expiry"
                name="expiryDate"
                type="date"
                value={expiryDate}
                disabled={isPending}
                onChange={(event) => setExpiryDate(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="cert-url" className={experienceLabelClass}>
              Direct verification / source URL
            </label>
            <input
              id="cert-url"
              name="verificationUrl"
              type="url"
              value={verificationUrl}
              disabled={isPending}
              onChange={(event) => setVerificationUrl(event.target.value)}
              placeholder="https://www.credly.com/org/aws/badge/..."
              className={fieldClass}
            />
            {errorText(urlError)}
            <p className="mt-1 text-xs text-[var(--ds-text-muted)]">
              A direct public link (Credly, CertMetrics, issuer badge) lets us verify it
              automatically.
            </p>
          </div>
        </section>

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-6 -mb-5 flex items-center justify-between gap-3 border-t border-[var(--ds-border)] bg-[var(--ds-surface)] px-6 py-4">
          <button type="button" onClick={onCancel} className={profileSecondaryButtonSmClass}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={`${profilePrimaryButtonSmClass} disabled:opacity-50`}
          >
            {isPending ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Award className="h-5 w-5 text-foreground" /> Certificate Details
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter provider name, credential details, and valid verification link.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Certification Provider (Issuer) *"
            name="issuer"
            placeholder="e.g. Amazon Web Services, Coursera, Google"
            value={issuer}
            error={issuerError}
            disabled={isPending}
            onChange={(event) => setIssuer(event.target.value)}
          />
          <Input
            label="Certification Name (Title) *"
            name="title"
            placeholder="e.g. AWS Certified Solutions Architect"
            value={title}
            error={titleError}
            disabled={isPending}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Input
              label="Certificate Number"
              name="certificateNumber"
              placeholder="AWS-12345678"
              value={certificateNumber}
              disabled={isPending}
              onChange={(event) => setCertificateNumber(event.target.value)}
            />
          </div>
          <div>
            <Input
              label="Issue Date"
              name="issueDate"
              type="date"
              placeholder="YYYY-MM-DD"
              value={issueDate}
              disabled={isPending}
              onChange={(event) => setIssueDate(event.target.value)}
            />
          </div>
          <div>
            <Input
              label="Valid Through / Expiry Date"
              name="expiryDate"
              type="date"
              placeholder="YYYY-MM-DD"
              value={expiryDate}
              disabled={isPending}
              onChange={(event) => setExpiryDate(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            label="Direct Verification / Source URL"
            name="verificationUrl"
            placeholder="https://www.credly.com/org/aws/badge/..."
            value={verificationUrl}
            error={urlError}
            disabled={isPending}
            onChange={(event) => setVerificationUrl(event.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Provide a direct public link (Credly, CertMetrics, issuer badge) for instant automated
            source verification.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <div className="pt-2">
        <Button
          type="button"
          disabled={isPending}
          className="w-full sm:w-auto"
          onClick={handleSubmit}
        >
          {isPending ? 'Saving Details…' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
