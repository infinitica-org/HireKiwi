'use client';

import { useState } from 'react';
import { Award, Plus, ShieldCheck } from 'lucide-react';
import { useQuery } from '@hirekiwi/ui';
import { api } from '@/lib/api';
import type { CandidateCertificateDto } from '@hirekiwi/contracts';
import { CertificateDetailModal } from '@/components/profile/CertificateDetailModal';
import { CertificateEntryCard } from '@/components/profile/CertificateEntryCard';
import { CertificateWizardPopup } from '@/components/profile/CertificateWizardPopup';
import {
  ProfileBentoEmptyPanel,
  ProfileSectionError,
  ProfileSectionHeader,
} from '@/components/profile/ProfileSectionChrome';
import { profilePrimaryButtonSmClass } from '@/lib/profile-ui-classes';
import { profileSectionMeta } from '@/lib/profile-sections';

export function CertificatesSection() {
  const [viewing, setViewing] = useState<CandidateCertificateDto | null>(null);
  // null = popup closed; { certificateId: null } = adding a new certificate.
  const [wizard, setWizard] = useState<{ certificateId: string | null } | null>(null);
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['me', 'candidate-certificates'] as const,
    queryFn: () => api.candidateCertificates.listMine(),
    staleTime: 60_000,
  });

  const certificates = data?.certificates ?? [];
  const error = queryError
    ? (queryError as Error).message || 'Failed to load candidate certificates.'
    : null;
  const meta = profileSectionMeta('certifications');

  const openWizard = (certificateId: string | null) => {
    setViewing(null);
    setWizard({ certificateId });
  };
  const closeWizard = () => {
    setWizard(null);
    void refetch(); // pick up whatever was added or changed in the popup
  };

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-4 font-[family-name:var(--tpo-font-sans)]"
      aria-label="Certifications"
    >
      <ProfileSectionHeader
        title={meta.title}
        evidenceType="CREDENTIAL"
        description="External credentials from AWS, Coursera, Google, and other providers — verified and shown on your public profile."
        action={
          certificates.length > 0 ? (
            <button
              type="button"
              onClick={() => openWizard(null)}
              className={`${profilePrimaryButtonSmClass} justify-center px-4 py-2.5 text-[13px] font-semibold tracking-[-0.01em]`}
            >
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              Add certificate
            </button>
          ) : null
        }
      />

      {error ? <ProfileSectionError>{error}</ProfileSectionError> : null}

      {loading ? (
        <p className="text-sm text-[var(--ds-text-muted)]">Loading certifications…</p>
      ) : null}

      {!loading && certificates.length === 0 ? (
        <ProfileBentoEmptyPanel
          tipIcon={ShieldCheck}
          tipIconClassName="text-[#0284c7]"
          tipTitle="Showcase verified credentials"
          tipBody="Optional but powerful — attach proof or issuer links so recruiters see skills you have already validated elsewhere."
          emptyIcon={Award}
          emptyTitle="No certifications yet"
          emptyBody="When you add a certificate, it appears here with verification status and linked skills."
          actions={
            <button
              type="button"
              onClick={() => openWizard(null)}
              className={`${profilePrimaryButtonSmClass} justify-center px-5 py-2.5 text-[13px]`}
            >
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              Add Certificate
            </button>
          }
        />
      ) : null}

      {!loading && certificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {certificates.map((cert, index) => (
            <CertificateEntryCard
              key={cert.certificateId}
              certificate={cert}
              accentIndex={index}
              onView={() => setViewing(cert)}
              onManage={() => openWizard(cert.certificateId)}
            />
          ))}
        </div>
      ) : null}
      <CertificateDetailModal
        certificate={viewing}
        onClose={() => setViewing(null)}
        onManage={viewing ? () => openWizard(viewing.certificateId) : undefined}
      />
      {wizard ? (
        <CertificateWizardPopup certificateId={wizard.certificateId} onClose={closeWizard} />
      ) : null}
    </section>
  );
}
