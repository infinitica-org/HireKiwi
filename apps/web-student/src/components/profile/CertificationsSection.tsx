'use client';

import { useCallback, useState } from 'react';
import { Award, CheckCircle2, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { isHireKiwiApiError, queryKeys } from '@hirekiwi/api-client';
import { useQuery, useQueryClient } from '@hirekiwi/ui';
import type { CandidateCertificateDto, ProfessionalCredentialDto } from '@hirekiwi/contracts';
import { CertificateDetailModal } from '@/components/profile/CertificateDetailModal';
import { CertificateEntryCard } from '@/components/profile/CertificateEntryCard';
import { AddCertificationPopup } from '@/components/profile/AddCertificationPopup';
import { CredentialDetailModal } from '@/components/profile/CredentialDetailModal';
import { CredentialEntryCard } from '@/components/profile/CredentialEntryCard';
import {
  ProfileBentoEmptyPanel,
  ProfileSectionError,
  ProfileSectionHeader,
} from '@/components/profile/ProfileSectionChrome';
import { api } from '@/lib/api';
import {
  profilePrimaryButtonSmClass,
  profileSecondaryButtonSmClass,
} from '@/lib/profile-ui-classes';
import { profileSectionMeta } from '@/lib/profile-sections';
import { useCredentialDocuments } from '@/lib/use-credential-documents';

/**
 * Certifications and credentials in one place. Courses and certificates (AWS, Coursera, Google…)
 * and licenses, badges and memberships are different records with their own verification, so
 * they are still saved by their own APIs, but a student adds, sees and manages them here.
 */
export function CertificationsSection() {
  const queryClient = useQueryClient();
  const meta = profileSectionMeta('certifications');

  // { certificateId: null } = adding a new certificate in the wizard.
  const [wizard, setWizard] = useState<{ certificateId: string | null } | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<CandidateCertificateDto | null>(
    null,
  );
  const [viewingCredential, setViewingCredential] = useState<ProfessionalCredentialDto | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeclaring, setIsDeclaring] = useState(false);

  const certificatesQuery = useQuery({
    queryKey: queryKeys.myCandidateCertificates(),
    queryFn: () => api.candidateCertificates.listMine(),
    staleTime: 60_000,
  });
  const credentialsQuery = useQuery({
    queryKey: queryKeys.myCredentials(),
    queryFn: () => api.evidence.listCredentials(),
    staleTime: 60_000,
  });
  const certificateDeclaration = useQuery({
    queryKey: queryKeys.myCandidateCertificateDeclaration(),
    queryFn: () => api.candidateCertificates.getDeclaration(),
    staleTime: 60_000,
  });
  const credentialDeclaration = useQuery({
    queryKey: queryKeys.myCredentialDeclaration(),
    queryFn: () => api.evidence.getCredentialDeclaration(),
    staleTime: 60_000,
  });

  const certificates = certificatesQuery.data?.certificates ?? [];
  const credentials = credentialsQuery.data ?? [];
  const total = certificates.length + credentials.length;
  const loading =
    certificatesQuery.isLoading ||
    credentialsQuery.isLoading ||
    certificateDeclaration.isLoading ||
    credentialDeclaration.isLoading;
  const declaredNone =
    certificateDeclaration.data?.hasNoCertifications === true &&
    credentialDeclaration.data?.hasNoCredentials === true;

  const documents = useCredentialDocuments(setActionError);

  const loadError = certificatesQuery.error ?? credentialsQuery.error;
  const error =
    actionError ?? (loadError ? (loadError as Error).message || 'Could not load.' : null);

  const refreshAll = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myCandidateCertificates() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCandidateCertificateDeclaration() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCredentials() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCredentialDeclaration() }),
      ]),
    [queryClient],
  );

  /** "I have none" (true) or "let me change that" (null), recorded on both records. */
  const declare = async (none: true | null) => {
    try {
      setIsDeclaring(true);
      setActionError(null);
      const [certRes, credRes] = await Promise.all([
        api.candidateCertificates.updateDeclaration({ hasNoCertifications: none }),
        api.evidence.updateCredentialDeclaration({ hasNoCredentials: none }),
      ]);
      queryClient.setQueryData(queryKeys.myCandidateCertificateDeclaration(), certRes);
      queryClient.setQueryData(queryKeys.myCredentialDeclaration(), credRes);
      await refreshAll();
    } catch (err: unknown) {
      setActionError(isHireKiwiApiError(err) ? err.message : 'Failed to update your declaration.');
    } finally {
      setIsDeclaring(false);
    }
  };

  const openWizard = (certificateId: string | null) => {
    setViewingCertificate(null);
    setWizard({ certificateId });
  };
  const closeWizard = () => {
    setWizard(null);
    void refreshAll(); // pick up whatever was added or changed in the popup
  };

  const addButton = (label: string, className: string) => (
    <button type="button" onClick={() => openWizard(null)} className={className}>
      <Plus className="size-4" strokeWidth={2} aria-hidden />
      {label}
    </button>
  );

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-4 font-[family-name:var(--tpo-font-sans)]"
      aria-label="Certifications and credentials"
    >
      <ProfileSectionHeader
        title={meta.title}
        evidenceType="CREDENTIAL"
        description={meta.description}
        action={addButton(
          'Add certifications or credentials ',
          `${profilePrimaryButtonSmClass} justify-center px-4 py-2.5 text-[13px] font-semibold tracking-[-0.01em]`,
        )}
      />

      {error ? <ProfileSectionError>{error}</ProfileSectionError> : null}

      {loading ? (
        <p className="text-sm text-[var(--ds-text-muted)]">Loading certifications…</p>
      ) : null}

      {!loading && total === 0 ? (
        declaredNone ? (
          <ProfileBentoEmptyPanel
            emptyIcon={CheckCircle2}
            emptyTitle="No certifications or credentials"
            emptyBody="You've indicated that you don't currently have any."
            actions={
              <>
                <button
                  type="button"
                  onClick={() => void declare(null)}
                  disabled={isDeclaring}
                  className={`${profileSecondaryButtonSmClass} justify-center px-5 py-2.5 text-[13px] disabled:opacity-50`}
                >
                  {isDeclaring ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Change declaration
                </button>
              </>
            }
          />
        ) : (
          <ProfileBentoEmptyPanel
            tipIcon={ShieldCheck}
            tipIconClassName="text-[#0284c7]"
            tipTitle="Showcase verified proof"
            tipBody="Optional but powerful: attach proof or issuer links so recruiters see what you have already validated elsewhere."
            emptyIcon={Award}
            emptyTitle="Nothing added yet"
            emptyBody="Add a certificate, license, badge or membership. It appears here with its verification status."
            actions={
              <>
                <button
                  type="button"
                  onClick={() => void declare(true)}
                  disabled={isDeclaring}
                  className={`${profileSecondaryButtonSmClass} justify-center px-5 py-2.5 text-[13px] disabled:opacity-50`}
                >
                  {isDeclaring ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}I
                  don&apos;t have any
                </button>
              </>
            }
          />
        )
      ) : null}

      {!loading && certificates.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-heading text-sm font-semibold text-zinc-950 dark:text-white">
            Certificates
            <span className="ml-1.5 font-normal text-zinc-500">({certificates.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {certificates.map((cert, index) => (
              <CertificateEntryCard
                key={`cert-${cert.certificateId}`}
                certificate={cert}
                accentIndex={index}
                onView={() => setViewingCertificate(cert)}
                onManage={() => openWizard(cert.certificateId)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {!loading && credentials.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-heading text-sm font-semibold text-zinc-950 dark:text-white">
            Credentials
            <span className="ml-1.5 font-normal text-zinc-500">({credentials.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {credentials.map((credential, index) => (
              <CredentialEntryCard
                key={`cred-${credential.credentialId}`}
                credential={credential}
                accentIndex={index}
                preview={documents.previews[credential.credentialId]}
                fileName={documents.fileNameFor(credential)}
                uploading={documents.uploadingId === credential.credentialId}
                onView={() => setViewingCredential(credential)}
                onUploadClick={() =>
                  documents.fileInputRefs.current[credential.credentialId]?.click()
                }
                fileInput={
                  <input
                    ref={(el) => {
                      documents.fileInputRefs.current[credential.credentialId] = el;
                    }}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void documents.upload(credential.credentialId, file);
                      event.target.value = '';
                    }}
                  />
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      <CertificateDetailModal
        certificate={viewingCertificate}
        onClose={() => setViewingCertificate(null)}
        onManage={
          viewingCertificate ? () => openWizard(viewingCertificate.certificateId) : undefined
        }
      />
      <CredentialDetailModal
        credential={viewingCredential}
        fileName={viewingCredential ? documents.fileNameFor(viewingCredential) : null}
        onClose={() => setViewingCredential(null)}
      />
      {wizard ? (
        <AddCertificationPopup
          certificateId={wizard.certificateId}
          onClose={closeWizard}
          onCredentialAdded={() => void refreshAll()}
        />
      ) : null}
    </section>
  );
}
