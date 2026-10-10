'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useQuery } from '@hirekiwi/ui';
import type { CandidateCertificateDto, TrackCode } from '@hirekiwi/contracts';
import { ArrowLeft, Pencil, RefreshCw, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { VIVI_GHOST_BUTTON } from '@/components/vivi-verification/vivi-field-classes';
import type { CertificateDetailsPayload } from './certificate-details-form';
import { CertificateLinkForm } from './certificate-link-form';
import { CertificateSourceCheckCard } from './certificate-source-check-card';
import { SkillsLearningForm } from './skills-learning-form';
import { CertificateAgendaForm } from './certificate-agenda-form';
import { EndorsementRequestForm } from './endorsement-request-form';
import type { CertificateSkillSelection } from './skill-picker';

/** While the issuer is being asked, the certificate is re-read this often, for at most this long. */
const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 20;

/** 0 add (link or file), 1 what you learned, 2 status and next step. */
export type CertificateWizardStage = 0 | 1 | 2;

/** Popup mode: the profile page hosts the wizard, so it must not touch the URL. */
export interface EmbeddedCertificateWizard {
  /** Certificate to manage, or null to add a new one. */
  certificateId: string | null;
  /** Back button: closes the popup. */
  onClose: () => void;
  /** A field shown first in the add form (the Type choice in the profile popup). */
  topField?: ReactNode;
  onStageChange?: (stage: CertificateWizardStage) => void;
}

const ACTION_BUTTON =
  'inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800';

function learningDone(certificate: CandidateCertificateDto): boolean {
  return (
    certificate.skills.length > 0 &&
    Boolean(certificate.learningDescription) &&
    certificate.practicalApplied !== null &&
    (!certificate.practicalApplied || Boolean(certificate.practicalDescription))
  );
}

export function CertificateWizard({ embedded }: { embedded?: EmbeddedCertificateWizard } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = embedded ? embedded.certificateId : searchParams.get('id');

  const [certificateId, setCertificateId] = useState<string | null>(existingId);
  const [certificate, setCertificate] = useState<CandidateCertificateDto | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(existingId));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingSkills, setSavingSkills] = useState(false);
  const [savingLearning, setSavingLearning] = useState(false);
  const [requestingEndorsement, setRequestingEndorsement] = useState(false);
  const [endorsementError, setEndorsementError] = useState<string | null>(null);
  const [showEndorsement, setShowEndorsement] = useState(false);
  const [savingAgenda, setSavingAgenda] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [learningLater, setLearningLater] = useState(false);

  useEffect(() => {
    if (!existingId) return;
    let cancelled = false;
    api.candidateCertificates
      .get(existingId)
      .then((res) => {
        if (cancelled) return;
        setCertificate(res);
        setCertificateId(existingId);
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [existingId]);

  // The issuer check runs in the background: keep re-reading until it lands.
  const checking = certificate?.sourceCheck?.outcome === 'checking';
  useEffect(() => {
    if (!checking || !certificateId) return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      attempts += 1;
      try {
        const fresh = await api.candidateCertificates.get(certificateId);
        if (cancelled) return;
        setCertificate(fresh);
        if (fresh.sourceCheck?.outcome !== 'checking' || attempts >= POLL_MAX_ATTEMPTS) return;
      } catch {
        if (cancelled || attempts >= POLL_MAX_ATTEMPTS) return;
      }
      timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
    };
    timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [checking, certificateId]);

  const { data: eventsRes } = useQuery({
    queryKey: [
      'candidate-certificate-events',
      certificateId,
      certificate?.sourceCheck?.checkedAt ?? null,
    ] as const,
    queryFn: () => api.candidateCertificates.listEvents(certificateId as string),
    enabled: Boolean(certificateId) && certificate !== null,
  });

  const voided = certificate?.status === 'VOIDED' || certificate?.sourceStatus === 'voided';
  const failed =
    certificate?.status === 'REJECTED' || certificate?.sourceStatus === 'source_failed';
  const hasProof = Boolean(certificate?.verificationUrl || certificate?.certificateFileUrl);

  const stage: CertificateWizardStage =
    !certificate || isEditingDetails || (!hasProof && !voided)
      ? 0
      : !learningDone(certificate) && !learningLater && !voided && !failed
        ? 1
        : 2;
  const onStageChange = embedded?.onStageChange;
  useEffect(() => {
    onStageChange?.(stage);
  }, [stage, onStageChange]);

  const handleSave = async (details: CertificateDetailsPayload, file: File | null) => {
    setSaving(true);
    setSaveError(null);
    try {
      let saved: CandidateCertificateDto;
      if (certificateId && certificate) {
        saved = await api.candidateCertificates.updateLearning(certificateId, {
          certificateNumber: details.certificateNumber,
          verificationUrl: details.verificationUrl,
          issueDate: details.issueDate,
          expiryDate: details.expiryDate,
        });
      } else {
        saved = await api.candidateCertificates.create(details);
        setCertificateId(saved.certificateId);
        if (!embedded) router.replace(`/student/certificates/add?id=${saved.certificateId}`);
      }
      setCertificate(saved);
      if (file) {
        saved = await api.candidateCertificates.upload(saved.certificateId, file, file.name);
        setCertificate(saved);
      }
      setIsEditingDetails(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save this certificate.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSkills = async (skills: CertificateSkillSelection[]) => {
    if (!certificateId) return;
    setSavingSkills(true);
    try {
      setCertificate(await api.candidateCertificates.replaceSkills(certificateId, { skills }));
    } finally {
      setSavingSkills(false);
    }
  };

  const handleSaveLearning = async (fields: {
    learningDescription: string;
    tools: string[];
    practicalApplied: boolean;
    practicalDescription?: string;
  }) => {
    if (!certificateId) return;
    setSavingLearning(true);
    try {
      setCertificate(await api.candidateCertificates.updateLearning(certificateId, fields));
    } finally {
      setSavingLearning(false);
    }
  };

  const handleRequestEndorsement = async (details: {
    endorserName: string;
    endorserEmail: string;
    endorserTitle?: string;
  }) => {
    if (!certificateId) return;
    setRequestingEndorsement(true);
    setEndorsementError(null);
    try {
      setCertificate(await api.candidateCertificates.requestEndorsement(certificateId, details));
      setShowEndorsement(false);
    } catch (err) {
      setEndorsementError(err instanceof Error ? err.message : 'Failed to request endorsement.');
    } finally {
      setRequestingEndorsement(false);
    }
  };

  const handleSubmitAgenda = async (body: {
    trackCode: TrackCode;
    agendaLines: string[];
    expiryDate?: string;
  }) => {
    if (!certificateId) return;
    setSavingAgenda(true);
    setAgendaError(null);
    try {
      setCertificate(await api.candidateCertificates.submitAgenda(certificateId, body));
    } catch (err) {
      setAgendaError(err instanceof Error ? err.message : 'Could not save agenda.');
    } finally {
      setSavingAgenda(false);
    }
  };

  if (loadingExisting) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="animate-pulse text-sm text-muted-foreground">Loading certificate…</p>
      </div>
    );
  }

  const backLink = embedded ? null : (
    <div className="mb-2 flex items-center justify-between">
      <Link
        href="/student/certificates"
        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Certificates
      </Link>
      <Link
        href="/student/dashboard"
        className="text-xs font-medium text-foreground hover:underline"
      >
        Skip to Dashboard &rarr;
      </Link>
    </div>
  );

  if (stage === 0) {
    return (
      <div className={`mx-auto flex w-full max-w-3xl flex-col ${embedded ? 'gap-5' : 'gap-6'}`}>
        {backLink}
        <CertificateLinkForm
          key={certificate?.certificateId ?? 'new'}
          topField={certificate ? undefined : embedded?.topField}
          onCancel={
            certificate && isEditingDetails ? () => setIsEditingDetails(false) : embedded?.onClose
          }
          initialValues={
            certificate
              ? {
                  title: certificate.title,
                  issuer: certificate.issuer,
                  certificateNumber: certificate.certificateNumber ?? undefined,
                  issueDate: certificate.issueDate ?? undefined,
                  expiryDate: certificate.expiryDate ?? undefined,
                  verificationUrl: certificate.verificationUrl ?? undefined,
                }
              : undefined
          }
          hasExistingProof={Boolean(certificate?.certificateFileUrl)}
          onSubmit={(details, file) => void handleSave(details, file)}
          isPending={saving}
          error={saveError}
          submitLabel={certificate ? 'Save and check again' : 'Add certificate'}
        />
      </div>
    );
  }

  // `stage` is only 0 without a certificate, so it is loaded from here on.
  const cert = certificate as CandidateCertificateDto;
  const outcome = cert.sourceCheck?.outcome;
  const ready = learningDone(cert);

  const cardActions = voided ? null : failed ? (
    <button type="button" onClick={() => setIsEditingDetails(true)} className={ACTION_BUTTON}>
      <RefreshCw className="size-3.5" aria-hidden /> Fix and check again
    </button>
  ) : outcome === 'needs_review' ? (
    <>
      <button type="button" onClick={() => setIsEditingDetails(true)} className={ACTION_BUTTON}>
        <Pencil className="size-3.5" aria-hidden />
        {cert.verificationUrl ? 'Change link or add a file' : 'Add the certificate link'}
      </button>
      {ready ? (
        <button
          type="button"
          onClick={() => setShowEndorsement((open) => !open)}
          className={ACTION_BUTTON}
        >
          <UserCheck className="size-3.5" aria-hidden /> Ask someone to vouch
        </button>
      ) : null}
    </>
  ) : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {backLink}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-foreground">{cert.title}</h2>
          <p className="text-sm text-muted-foreground">{cert.issuer}</p>
        </div>
        {voided ? null : (
          <button
            type="button"
            onClick={() => setIsEditingDetails(true)}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" aria-hidden /> Edit
          </button>
        )}
      </div>

      <CertificateSourceCheckCard certificate={cert}>{cardActions}</CertificateSourceCheckCard>

      {stage === 1 ? (
        <motion.div
          key="learning"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex flex-col gap-3"
        >
          <SkillsLearningForm
            certificate={cert}
            onSaveSkills={handleSaveSkills}
            savingSkills={savingSkills}
            onSaveLearning={handleSaveLearning}
            savingLearning={savingLearning}
          />
          <button
            type="button"
            onClick={() => setLearningLater(true)}
            className="self-end text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Do this later
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="next"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex flex-col gap-4"
        >
          {!voided && !failed && !ready ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <span className="text-muted-foreground">
                Add the skills you learned to unlock the assessment that shows this as Verified.
              </span>
              <button
                type="button"
                onClick={() => setLearningLater(false)}
                className={VIVI_GHOST_BUTTON}
              >
                Add skills
              </button>
            </div>
          ) : null}

          {ready && cert.sourceStatus === 'source_verified' && cert.status !== 'VERIFIED' ? (
            <CertificateAgendaForm
              certificateId={cert.certificateId}
              initialLines={cert.agendaLines}
              initialTrack={cert.trackCode ?? null}
              initialExpiry={cert.expiryDate ?? null}
              onSubmit={handleSubmitAgenda}
              isPending={savingAgenda}
              error={agendaError}
            />
          ) : null}

          {showEndorsement && outcome === 'needs_review' ? (
            <EndorsementRequestForm
              onSubmit={handleRequestEndorsement}
              isPending={requestingEndorsement}
              error={endorsementError}
            />
          ) : null}
        </motion.div>
      )}

      {(eventsRes?.events.length ?? 0) > 0 ? (
        <details className="group rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs">
          <summary className="cursor-pointer select-none font-medium text-muted-foreground group-open:mb-3">
            Verification history
          </summary>
          <ul className="flex flex-col gap-2.5">
            {eventsRes?.events.map((event) => (
              <li key={event.eventId} className="flex items-start gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-zinc-400" />
                <div className="min-w-0">
                  <p className="break-words text-foreground/80">
                    {event.message.replace(/^\[[A-Z0-9_]+\]\s*/u, '')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
