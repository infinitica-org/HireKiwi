'use client';

import Link from 'next/link';
import { ExternalLink, Sparkles } from 'lucide-react';
import type { CandidateCertificateDto } from '@hirekiwi/contracts';
import { PopupField, ProfilePopup } from '@/components/profile/shared/ProfilePopup';
import {
  certificateManageCtaLabel,
  certificateNeedsAssessment,
  certificateProofSummary,
  certificateStatusLabel,
} from '@/lib/certificate-entry-presenters';
import {
  profilePrimaryButtonSmClass,
  profileSecondaryButtonSmClass,
} from '@/lib/profile-ui-classes';

function formatDate(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw.trim();
  return new Date(parsed).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Read-only "See" popup for one certificate on the profile. */
export function CertificateDetailModal({
  certificate,
  onClose,
  onManage,
}: {
  certificate: CandidateCertificateDto | null;
  onClose: () => void;
  /** Opens the add/manage popup for this certificate. */
  onManage?: () => void;
}) {
  if (!certificate) return null;
  const proof = certificateProofSummary(certificate);
  const verificationUrl = certificate.verificationUrl?.trim() ?? '';

  return (
    <ProfilePopup
      open
      onClose={onClose}
      title={certificate.title?.trim() || 'Untitled certificate'}
      subtitle={`${certificate.issuer?.trim() || 'Issuer not specified'} · ${certificateStatusLabel(certificate.status)}`}
      footer={
        <>
          {certificateNeedsAssessment(certificate) ? (
            <Link
              href={`/student/certificates/${certificate.certificateId}/verify`}
              className={profilePrimaryButtonSmClass}
            >
              <Sparkles className="size-3.5" aria-hidden />
              Take assessment
            </Link>
          ) : null}
          {onManage ? (
            <button type="button" onClick={onManage} className={profileSecondaryButtonSmClass}>
              {certificateManageCtaLabel(certificate.status)}
            </button>
          ) : (
            <Link
              href={`/student/certificates/add?id=${certificate.certificateId}`}
              className={profileSecondaryButtonSmClass}
            >
              {certificateManageCtaLabel(certificate.status)}
            </Link>
          )}
          <button type="button" onClick={onClose} className={profileSecondaryButtonSmClass}>
            Close
          </button>
        </>
      }
    >
      {certificate.previewImageUrl ? (
        <div className="mb-4 flex justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          {/* Credly serves the badge from its own host, so a plain img is used. */}
          <img
            src={certificate.previewImageUrl}
            alt={`${certificate.title} badge`}
            referrerPolicy="no-referrer"
            className="max-h-48 w-auto object-contain"
          />
        </div>
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-2">
        <PopupField label="Issue date">{formatDate(certificate.issueDate)}</PopupField>
        <PopupField label="Expiry date">{formatDate(certificate.expiryDate)}</PopupField>
        <PopupField label="Certificate number">{certificate.certificateNumber}</PopupField>
        <PopupField label="Proof">{proof.label}</PopupField>
        <PopupField label="Proof file">{certificate.certificateFileName}</PopupField>
        {verificationUrl ? (
          <PopupField label="Verification link">
            {isHttpUrl(verificationUrl) ? (
              <a
                href={verificationUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-medium text-[var(--ds-green)] hover:underline"
              >
                Open issuer page
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : (
              verificationUrl
            )}
          </PopupField>
        ) : null}
      </dl>

      <dl className="mt-4 grid gap-4">
        <PopupField label="What you learned">{certificate.learningDescription}</PopupField>
        <PopupField label="Tools">
          {certificate.tools.length > 0 ? certificate.tools.join(', ') : null}
        </PopupField>
        <PopupField label="Applied in practice">
          {certificate.practicalApplied === null
            ? null
            : certificate.practicalApplied
              ? (certificate.practicalDescription ?? 'Yes')
              : 'No'}
        </PopupField>
      </dl>

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-muted)]">
          Mapped skills ({certificate.skills.length})
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {certificate.skills.length > 0 ? (
            certificate.skills.map((skill) => (
              <span
                key={skill.skillCode}
                className="rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface-muted)] px-2 py-0.5 text-xs font-medium text-[var(--ds-text-secondary)]"
              >
                {skill.skillName}
              </span>
            ))
          ) : (
            <span className="text-sm text-[var(--ds-text-muted)]">No skills mapped yet</span>
          )}
        </div>
      </div>
    </ProfilePopup>
  );
}
