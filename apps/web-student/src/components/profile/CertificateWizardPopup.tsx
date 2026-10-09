'use client';

import { CertificateWizard } from '@/components/certificates/certificate-wizard';
import { ProfilePopup } from '@/components/profile/ProfilePopup';

/**
 * Add or manage a certificate without leaving the profile. Same steps and save logic as the
 * /certificates/add page; Back, Esc, the X and the backdrop all close it.
 */
export function CertificateWizardPopup({
  certificateId,
  onClose,
}: {
  /** Certificate to manage, or null to add a new one. */
  certificateId: string | null;
  onClose: () => void;
}) {
  return (
    <ProfilePopup
      open
      size="lg"
      title={certificateId ? 'Manage certificate' : 'Add certificate'}
      subtitle="Add the provider, credential details and a verification link. We verify it for you."
      onClose={onClose}
    >
      <CertificateWizard key={certificateId ?? 'new'} embedded={{ certificateId, onClose }} />
    </ProfilePopup>
  );
}
