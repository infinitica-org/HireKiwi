'use client';

import type { ProfessionalCredentialDto } from '@hirekiwi/contracts';
import { PopupField, ProfilePopup } from '@/components/profile/ProfilePopup';
import {
  CREDENTIAL_STATUS_LABELS,
  CREDENTIAL_TYPE_LABELS,
} from '@/components/profile/CredentialEntryCard';
import { profileSecondaryButtonSmClass } from '@/lib/profile-ui-classes';
import { skillNameForCode } from '@/lib/skill-declarations';

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

/** Read-only "See" popup for one professional credential on the profile. */
export function CredentialDetailModal({
  credential,
  fileName,
  onClose,
}: {
  credential: ProfessionalCredentialDto | null;
  fileName: string | null;
  onClose: () => void;
}) {
  if (!credential) return null;

  return (
    <ProfilePopup
      open
      onClose={onClose}
      title={credential.credentialName}
      subtitle={`${credential.issuer} · ${CREDENTIAL_STATUS_LABELS[credential.status] ?? credential.status}`}
      footer={
        <button type="button" onClick={onClose} className={profileSecondaryButtonSmClass}>
          Close
        </button>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <PopupField label="Type">{CREDENTIAL_TYPE_LABELS[credential.credentialType]}</PopupField>
        <PopupField label="Credential ID">{credential.externalCredentialId}</PopupField>
        <PopupField label="Issue date">{formatDate(credential.issueDate)}</PopupField>
        <PopupField label="Expiry date">{formatDate(credential.expiryDate)}</PopupField>
        <PopupField label="Jurisdiction">{credential.jurisdiction}</PopupField>
        <PopupField label="Verification source">{credential.verificationSource}</PopupField>
        <PopupField label="Supporting document">{fileName}</PopupField>
        <PopupField label="Assessment">{credential.assessmentType}</PopupField>
      </dl>

      <dl className="mt-4 grid gap-4">
        <PopupField label="Scope">{credential.scope}</PopupField>
        <PopupField label="Topics covered">
          {credential.coveredTopics.length > 0 ? credential.coveredTopics.join(', ') : null}
        </PopupField>
        <PopupField label="Skills covered">
          {credential.coveredSkills.length > 0
            ? credential.coveredSkills.map(skillNameForCode).join(', ')
            : null}
        </PopupField>
      </dl>
    </ProfilePopup>
  );
}
