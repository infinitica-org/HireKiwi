'use client';

import Link from 'next/link';
import { Award, CheckCircle2, Clock, Eye, Sparkles, XCircle } from 'lucide-react';
import type { CandidateCertificateDto } from '@hirekiwi/contracts';

import {
  certificateManageCtaLabel,
  certificateNeedsAssessment,
  certificateProofSummary,
  certificateStatusIsPending,
  certificateStatusIsRejected,
  certificateStatusIsVerified,
  certificateStatusLabel,
} from '@/lib/certificate-entry-presenters';
import {
  EntryBadge,
  EntryCard,
  EntryFact,
  EntryFacts,
  EntryFooter,
  EntryHeader,
  EntryIconTile,
  entryPrimaryButtonClass,
  entryTextButtonClass,
} from '../shared/entry-card-ui';

function formatDisplayDate(raw: string | null | undefined): string {
  if (!raw?.trim()) return '—';
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw.trim();
  return new Date(parsed).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface CertificateEntryCardProps {
  certificate: CandidateCertificateDto;
  accentIndex?: number;
  /** Opens the See popup with every detail of this certificate. */
  onView?: () => void;
  /** Opens the add/manage popup; without it the button links to the page. */
  onManage?: () => void;
}

export function CertificateEntryCard({ certificate, onView, onManage }: CertificateEntryCardProps) {
  const proof = certificateProofSummary(certificate);
  const skillCount = certificate.skills.length;
  const manageHref = `/student/certificates/add?id=${certificate.certificateId}`;
  const assessmentHref = `/student/certificates/${certificate.certificateId}/verify`;
  const manageLabel = certificateManageCtaLabel(certificate.status);

  const isVerified = certificateStatusIsVerified(certificate.status);
  const isRejected = certificateStatusIsRejected(certificate.status);
  const isPending = certificateStatusIsPending(certificate.status);

  return (
    <EntryCard>
      <EntryHeader
        leading={
          certificate.previewImageUrl ? (
            // Credly serves the badge from its own host, so a plain img is used.
            <img
              src={certificate.previewImageUrl}
              alt={`${certificate.title} badge`}
              referrerPolicy="no-referrer"
              className="size-10 shrink-0 rounded-md border border-zinc-200 bg-white object-contain p-0.5 dark:border-zinc-700"
            />
          ) : (
            <EntryIconTile icon={Award} />
          )
        }
        title={certificate.title?.trim() || 'Untitled certificate'}
        subtitle={certificate.issuer?.trim() || 'Issuer not specified'}
        badges={
          <>
            {isVerified ? (
              <EntryBadge tone="success" icon={CheckCircle2}>
                Verified
              </EntryBadge>
            ) : null}
            {isPending ? (
              <EntryBadge tone="warning" icon={Clock}>
                {certificateStatusLabel(certificate.status)}
              </EntryBadge>
            ) : null}
            {isRejected ? (
              <EntryBadge tone="danger" icon={XCircle}>
                Rejected
              </EntryBadge>
            ) : null}
          </>
        }
      />

      <EntryFacts>
        <EntryFact label="Issue date">{formatDisplayDate(certificate.issueDate)}</EntryFact>
        <EntryFact label="Credential proof">{proof.label}</EntryFact>
        <EntryFact label={`Mapped skills (${skillCount})`} wide>
          {skillCount > 0 ? (
            <span className="flex flex-wrap gap-1.5">
              {certificate.skills.map((skill) => (
                <span
                  key={skill.skillCode}
                  className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {skill.skillName}
                </span>
              ))}
            </span>
          ) : (
            <span className="font-normal text-zinc-400">No skills mapped yet</span>
          )}
        </EntryFact>
      </EntryFacts>

      <EntryFooter>
        <div className="flex items-center gap-3">
          {onView ? (
            <button type="button" onClick={onView} className={entryTextButtonClass}>
              <Eye className="size-3.5" aria-hidden />
              View
            </button>
          ) : null}
          {certificateNeedsAssessment(certificate) ? (
            <Link href={assessmentHref} className={entryTextButtonClass}>
              <Sparkles className="size-3.5" aria-hidden />
              Take assessment
            </Link>
          ) : null}
        </div>
        {onManage ? (
          <button type="button" onClick={onManage} className={entryPrimaryButtonClass}>
            {manageLabel}
          </button>
        ) : (
          <Link href={manageHref} className={entryPrimaryButtonClass}>
            {manageLabel}
          </Link>
        )}
      </EntryFooter>
    </EntryCard>
  );
}
