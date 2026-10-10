'use client';

import type { ReactNode } from 'react';
import { CheckCircle2, Clock, Eye, IdCard, Loader2, Upload, XCircle } from 'lucide-react';
import type { CredentialType, ProfessionalCredentialDto } from '@hirekiwi/contracts';

import {
  EntryBadge,
  EntryCard,
  EntryFact,
  EntryFacts,
  EntryFooter,
  EntryHeader,
  EntryIconTile,
  entryTextButtonClass,
  type EntryTone,
} from '../shared/entry-card-ui';

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  CERTIFICATION: 'Certification',
  LICENSE: 'License',
  DEGREE: 'Degree',
  BADGE: 'Badge',
  PROFESSIONAL_MEMBERSHIP: 'Professional membership',
};

const STATUS_TONE: Record<string, EntryTone> = {
  ACTIVE: 'success',
  PENDING_VERIFICATION: 'warning',
  EXPIRED: 'neutral',
  REVOKED: 'danger',
};

const STATUS_ICON: Record<string, typeof Clock | undefined> = {
  ACTIVE: CheckCircle2,
  PENDING_VERIFICATION: Clock,
  REVOKED: XCircle,
};

export const CREDENTIAL_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Verified',
  PENDING_VERIFICATION: 'Pending verification',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
};

type DocumentPreview = {
  objectUrl: string;
  fileName: string;
  isImage: boolean;
};

interface CredentialEntryCardProps {
  credential: ProfessionalCredentialDto;
  accentIndex?: number;
  preview?: DocumentPreview | null;
  fileName?: string | null;
  uploading: boolean;
  onUploadClick: () => void;
  fileInput: ReactNode;
  /** Opens the See popup with every detail of this credential. */
  onView?: () => void;
}

export function CredentialEntryCard({
  credential,
  preview,
  fileName,
  uploading,
  onUploadClick,
  fileInput,
  onView,
}: CredentialEntryCardProps) {
  const tone = STATUS_TONE[credential.status] ?? 'neutral';
  const StatusIcon = STATUS_ICON[credential.status];
  const isPending = credential.status === 'PENDING_VERIFICATION';

  return (
    <EntryCard>
      <EntryHeader
        leading={<EntryIconTile icon={IdCard} />}
        title={credential.credentialName}
        subtitle={credential.issuer}
        badges={
          <EntryBadge tone={tone} icon={StatusIcon}>
            {CREDENTIAL_STATUS_LABELS[credential.status] ?? credential.status}
          </EntryBadge>
        }
      />

      <EntryFacts>
        <EntryFact label="Type">{CREDENTIAL_TYPE_LABELS[credential.credentialType]}</EntryFact>
        <EntryFact label="Document">{fileName ?? 'None attached'}</EntryFact>
      </EntryFacts>

      {preview?.isImage && fileName ? (
        <div className="flex items-center gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <img
            src={preview.objectUrl}
            alt=""
            className="size-12 shrink-0 rounded-md border border-zinc-200 object-cover dark:border-zinc-700"
          />
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{fileName}</p>
        </div>
      ) : null}

      {isPending ? (
        <div className="space-y-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <button
            type="button"
            disabled={uploading}
            onClick={onUploadClick}
            className={entryTextButtonClass}
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-3.5" aria-hidden />
            )}
            {credential.documentObjectKey
              ? 'Replace supporting document'
              : 'Upload supporting document'}
          </button>
          {fileInput}
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            All verification runs on our backend — we&apos;ll update this status as soon as the
            issuer check completes.
          </p>
        </div>
      ) : null}

      {onView ? (
        <EntryFooter>
          <button type="button" onClick={onView} className={entryTextButtonClass}>
            <Eye className="size-3.5" aria-hidden />
            View details
          </button>
        </EntryFooter>
      ) : null}
    </EntryCard>
  );
}
