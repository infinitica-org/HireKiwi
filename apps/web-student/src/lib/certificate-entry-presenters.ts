import type { CandidateCertificateDto, CandidateCertificateStatus } from '@hirekiwi/contracts';

export { CERTIFICATE_CARD_ACCENTS } from '@/lib/student-bento-accents';

const STATUS_LABELS: Record<CandidateCertificateStatus, string> = {
  DECLARED: 'Not started',

  UPLOADED: 'In progress',

  IN_VERIFICATION: 'In verification',

  VERIFIED: 'Verified',

  REJECTED: 'Not verified',

  VOIDED: 'Voided',
};

export function certificateStatusLabel(status: CandidateCertificateStatus): string {
  return STATUS_LABELS[status] ?? status;
}

/**
 * The in-progress badge, by where the source check stands: a confirmed source only waits on the
 * student's assessment, which reads very differently from "we're still checking" or "under review".
 */
export function certificatePendingBadge(cert: CandidateCertificateDto): {
  label: string;
  tone: 'info' | 'warning' | 'neutral';
} {
  if (cert.status === 'DECLARED' || cert.status === 'UPLOADED') {
    return { label: certificateStatusLabel(cert.status), tone: 'neutral' };
  }
  switch (cert.sourceCheck?.outcome) {
    case 'verified':
      return { label: 'Source verified · assessment next', tone: 'info' };
    case 'needs_review':
      return { label: 'Under review', tone: 'warning' };
    case 'checking':
      return { label: 'Checking…', tone: 'neutral' };
    default:
      return { label: certificateStatusLabel(cert.status), tone: 'warning' };
  }
}

export function certificateStatusIsVerified(status: CandidateCertificateStatus): boolean {
  return status === 'VERIFIED';
}

export function certificateStatusIsRejected(status: CandidateCertificateStatus): boolean {
  return status === 'REJECTED' || status === 'VOIDED';
}

export function certificateStatusIsPending(status: CandidateCertificateStatus): boolean {
  return status === 'DECLARED' || status === 'UPLOADED' || status === 'IN_VERIFICATION';
}

export function certificateProofSummary(cert: CandidateCertificateDto): {
  label: string;

  detail: string;
} {
  if (cert.certificateFileName) {
    return { label: 'Document', detail: cert.certificateFileName };
  }

  if (cert.verificationUrl) {
    try {
      const host = new URL(cert.verificationUrl).hostname.replace(/^www\./u, '');

      return { label: 'Source URL', detail: host };
    } catch {
      return { label: 'Source URL', detail: 'Link attached' };
    }
  }

  return { label: 'Proof', detail: 'Not uploaded' };
}

export function certificateManageCtaLabel(status: CandidateCertificateStatus): string {
  if (status === 'DECLARED' || status === 'UPLOADED') return 'Continue';

  if (status === 'IN_VERIFICATION') return 'View status';

  return 'View details';
}

const IN_PROGRESS = new Set<CandidateCertificateStatus>(['DECLARED', 'UPLOADED']);

export function certificateNeedsAssessment(cert: CandidateCertificateDto): boolean {
  return (
    cert.sourceStatus === 'source_verified' &&
    Boolean(cert.agendaLines?.length) &&
    cert.status !== 'VERIFIED' &&
    !IN_PROGRESS.has(cert.status)
  );
}
