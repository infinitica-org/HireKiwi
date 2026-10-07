'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { isSmartApiError, queryKeys } from '@hirekiwi/api-client';
import { useQuery, useQueryClient } from '@hirekiwi/ui';
import { api } from '@/lib/api';
import { CertificateEntryCard } from '@/components/profile/CertificateEntryCard';
import {
  ProfileBentoEmptyPanel,
  ProfileSectionError,
  ProfileSectionHeader,
} from '@/components/profile/ProfileSectionChrome';
import {
  profilePrimaryButtonSmClass,
  profileSecondaryButtonSmClass,
} from '@/lib/profile-ui-classes';
import { profileSectionMeta } from '@/lib/profile-sections';

export function CertificatesSection() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.myCandidateCertificates(),
    queryFn: () => api.candidateCertificates.listMine(),
    staleTime: 60_000,
  });

  const { data: declarationData, isLoading: declarationLoading } = useQuery({
    queryKey: queryKeys.myCandidateCertificateDeclaration(),
    queryFn: () => api.candidateCertificates.getDeclaration(),
    staleTime: 60_000,
  });

  const certificates = data?.certificates ?? [];
  const hasNoCertifications = declarationData?.hasNoCertifications ?? null;
  const [isDeclaring, setIsDeclaring] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const error = queryError
    ? (queryError as Error).message || 'Failed to load candidate certificates.'
    : actionError;
  const meta = profileSectionMeta('certifications');

  const handleDeclareNoCertifications = async () => {
    try {
      setIsDeclaring(true);
      setActionError(null);
      const res = await api.candidateCertificates.updateDeclaration({ hasNoCertifications: true });
      queryClient.setQueryData(queryKeys.myCandidateCertificateDeclaration(), res);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myCandidateCertificates() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCandidateCertificateDeclaration() }),
      ]);
    } catch (err: unknown) {
      setActionError(
        isSmartApiError(err) ? err.message : 'Failed to update certifications declaration.',
      );
    } finally {
      setIsDeclaring(false);
    }
  };

  const handleChangeDeclaration = async () => {
    try {
      setIsDeclaring(true);
      setActionError(null);
      const res = await api.candidateCertificates.updateDeclaration({ hasNoCertifications: null });
      queryClient.setQueryData(queryKeys.myCandidateCertificateDeclaration(), res);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myCandidateCertificates() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCandidateCertificateDeclaration() }),
      ]);
    } catch (err: unknown) {
      setActionError(
        isSmartApiError(err) ? err.message : 'Failed to update certifications declaration.',
      );
    } finally {
      setIsDeclaring(false);
    }
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
          <Link
            href="/student/certificates/add"
            className={`${profilePrimaryButtonSmClass} justify-center px-4 py-2.5 text-[13px] font-semibold tracking-[-0.01em]`}
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Add certificate
          </Link>
        }
      />

      {error ? <ProfileSectionError>{error}</ProfileSectionError> : null}

      {loading || declarationLoading ? (
        <p className="text-sm text-[var(--ds-text-muted)]">Loading certifications…</p>
      ) : null}

      {!loading && !declarationLoading && certificates.length === 0 ? (
        hasNoCertifications === true ? (
          <ProfileBentoEmptyPanel
            emptyIcon={CheckCircle2}
            emptyTitle="No certifications"
            emptyBody="You've indicated that you don't currently have any certifications."
            actions={
              <>
                <Link
                  href="/student/certificates/add"
                  className={`${profilePrimaryButtonSmClass} justify-center px-5 py-2.5 text-[13px]`}
                >
                  <Plus className="size-4" strokeWidth={2} aria-hidden />
                  Add Certificate
                </Link>
                <button
                  type="button"
                  onClick={handleChangeDeclaration}
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
            tipTitle="Showcase verified credentials"
            tipBody="Optional but powerful — attach proof or issuer links so recruiters see skills you have already validated elsewhere."
            emptyIcon={Award}
            emptyTitle="No certifications yet"
            emptyBody="When you add a certificate, it appears here with verification status and linked skills."
            actions={
              <>
                <Link
                  href="/student/certificates/add"
                  className={`${profilePrimaryButtonSmClass} justify-center px-5 py-2.5 text-[13px]`}
                >
                  <Plus className="size-4" strokeWidth={2} aria-hidden />
                  Add Certificate
                </Link>
                <button
                  type="button"
                  onClick={handleDeclareNoCertifications}
                  disabled={isDeclaring}
                  className={`${profileSecondaryButtonSmClass} justify-center px-5 py-2.5 text-[13px] disabled:opacity-50`}
                >
                  {isDeclaring ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}I
                  don't have any certifications
                </button>
              </>
            }
          />
        )
      ) : null}

      {!loading && !declarationLoading && certificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {certificates.map((cert, index) => (
            <CertificateEntryCard key={cert.certificateId} certificate={cert} accentIndex={index} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
