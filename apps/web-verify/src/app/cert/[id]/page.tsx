import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfidenceNote,
  LevelStepper,
  TierBadge,
  TierTrail,
} from '@hirekiwi/ui';
import { LEVEL_DEFINITIONS } from '@hirekiwi/contracts';
import { api } from '@/lib/api';
import { isValidUuid, verifyCertificateSignature } from '@/lib/cert-signature';
import { PrintButton } from './print-button';

/**
 * AC1: Edge-caching bounded revalidation.
 * Sub-80ms p95 delivery from edge/CDN with automatic background revalidation
 * ensuring revoked credentials propagate within 60 seconds.
 */
export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ sig?: string; hash?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sig = resolvedSearchParams?.sig;

  // Adversarial Test 2: Request non-existent certificate UUID or malformed UUID
  // Return 404 page without leaking stack traces
  if (!isValidUuid(id) || id === '00000000-0000-0000-0000-000000000000') {
    notFound();
  }

  // Adversarial Test 1: Signature tampering check (client-side hash param)
  let isTampered = false;
  const hashToCheck = resolvedSearchParams?.hash ?? sig;
  if (hashToCheck) {
    const isValidSignature = verifyCertificateSignature(id, hashToCheck);
    if (!isValidSignature) {
      isTampered = true;
      // Log security event for tamper attempt
      console.error(
        `[SECURITY_EVENT] Tampered certificate signature hash detected for ID: ${id}. Given signature hash: ${hashToCheck}`,
      );
    }
  }

  let certData;
  try {
    certData = await api.certificates.verify(id, sig);
  } catch (err: unknown) {
    if (isHireKiwiApiError(err) && err.statusCode === 404) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-2xl py-6 animate-fade-in flex flex-col gap-6">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/" passHref legacyBehavior>
            <Button variant="outline" size="sm">
              ← Return to Search
            </Button>
          </Link>
          <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--surface-border)] px-3 py-1 rounded-md">
            ID: {id}
          </span>
        </div>
        <Alert tone="danger" title="Verification Unavailable">
          Could not load certificate verification details. Please try again later.
        </Alert>
      </div>
    );
  }

  const {
    candidateName,
    trackName,
    issuedDate,
    highestLevelCleared,
    headlineTier,
    headlineTierLabel,
    tierTrail,
    confidenceNote,
    calibrationEmployers,
    methodologyUrl,
    signatureValid,
    status,
  } = certData;

  const isVerified = signatureValid && status === 'ISSUED';
  const isRevoked = status === 'REVOKED';
  const isSuperseded = status === 'SUPERSEDED';

  return (
    <div className="cert-print-container mx-auto max-w-3xl py-6 animate-fade-in flex flex-col gap-6 print:py-0 print:max-w-none">
      {/* Top action bar — hidden on print */}
      <div className="flex items-center justify-between gap-3 print:hidden no-print">
        <Link href="/" passHref legacyBehavior>
          <Button variant="outline" size="sm" className="print:hidden">
            ← Return to Search
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton />
          <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--surface-border)] px-3 py-1 rounded-md">
            ID: {id}
          </span>
        </div>
      </div>

      {/* Client-side tamper warning (hash param mismatch) */}
      {isTampered && (
        <Alert tone="danger" title="Tamper Warning: Invalid Certificate Signature">
          This certificate signature is invalid or has been altered. A security event has been
          logged.
        </Alert>
      )}

      {/* Security and Verification Status Alerts */}
      {!signatureValid ? (
        <Alert
          tone="danger"
          title="Cryptographic Tamper Warning"
          className="print:border-red-600 print:bg-red-50"
        >
          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-red-900 dark:text-red-200">
              ⚠ CRYPTOGRAPHIC VERIFICATION FAILED
            </p>
            <p className="text-sm">
              This credential could not be cryptographically verified. The certificate ID or
              verification signature may have been modified, invalidated, revoked, or otherwise
              failed verification. Do not rely on this credential until it can be verified.
            </p>
          </div>
        </Alert>
      ) : isRevoked ? (
        <Alert tone="danger" title="Certificate Revoked">
          This credential was revoked by the issuing authority and is no longer valid.
        </Alert>
      ) : isSuperseded ? (
        <Alert tone="warning" title="Certificate Superseded">
          This credential has been superseded by a higher level or newer assessment attempt.
        </Alert>
      ) : (
        <Alert tone="success" title="Cryptographically Verified Credential">
          This certificate has been cryptographically validated against the platform authority
          signature (HMAC-SHA256). All integrity checks passed.
        </Alert>
      )}

      {/* Primary Candidate Credential Summary Card */}
      <Card className="print:shadow-none print:border-gray-300 print:bg-white print:break-inside-avoid">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Candidate Credential
              </span>
              <CardTitle className="text-2xl mt-1">{candidateName}</CardTitle>
              <CardDescription className="text-base mt-0.5">
                Specialisation Track:{' '}
                <span className="font-semibold text-[var(--text-primary)]">{trackName}</span>
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <TierBadge tier={headlineTier} showLabel />
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {headlineTierLabel}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--surface-border)] text-sm">
            <div>
              <span className="text-xs text-[var(--text-muted)] block">Issued Date</span>
              <span className="font-medium">{issuedDate}</span>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] block">Highest Level Cleared</span>
              <span className="font-medium">Level {highestLevelCleared} of 5</span>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] block">Verification Status</span>
              <span
                className={`font-semibold ${
                  isVerified
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {isVerified ? 'Verified & Active' : !signatureValid ? 'Tampered / Invalid' : status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5-Level Tier Trail Section */}
      <Card className="print:shadow-none print:border-gray-300 print:bg-white print:break-inside-avoid">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>5-Level Tier Trail Progression</CardTitle>
              <CardDescription>
                Full cognitive and performance progression cleared at Bronze or above.
              </CardDescription>
            </div>
            {tierTrail.length > 0 && (
              <TierTrail
                tiers={tierTrail.map((t) => ({ level: t.levelNumber, tier: t.tier }))}
                className="mt-1"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <LevelStepper unlockedThrough={highestLevelCleared} current={highestLevelCleared} />

          {/* Detailed Level-by-Level Breakdown */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Level-by-Level Competency Breakdown
            </h3>
            <div className="divide-y divide-[var(--surface-border)] rounded-lg border border-[var(--surface-border)] bg-[var(--surface-muted)] overflow-hidden">
              {LEVEL_DEFINITIONS.map((def) => {
                const trailEntry = tierTrail.find((t) => t.levelNumber === def.level);
                const isCleared = def.level <= highestLevelCleared && Boolean(trailEntry);

                return (
                  <div
                    key={def.level}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCleared ? 'bg-[var(--surface)]' : 'opacity-60 bg-[var(--surface-muted)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--surface-border)] bg-[var(--surface-muted)] text-xs font-bold font-mono">
                        {def.code}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {def.name}
                          </span>
                          {trailEntry?.borderline && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Borderline
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{def.measures}</p>
                        {trailEntry?.competenciesAssessed &&
                          trailEntry.competenciesAssessed.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {trailEntry.competenciesAssessed.map((comp) => (
                                <span
                                  key={comp}
                                  className="rounded border border-[var(--surface-border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
                                >
                                  {comp}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      {isCleared && trailEntry ? (
                        <TierBadge tier={trailEntry.tier} />
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">
                          Not unlocked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practitioner Calibration & Employer Panel Credits */}
      <Card className="print:shadow-none print:border-gray-300 print:bg-white print:break-inside-avoid">
        <CardHeader>
          <CardTitle>Practitioner Calibration & Governance</CardTitle>
          <CardDescription>
            Cut scores and BARS standards calibrated by industry engineering leaders.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {confidenceNote && <ConfidenceNote note={confidenceNote} />}

          {calibrationEmployers && calibrationEmployers.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                Employer Calibration Panel Credits
              </span>
              <div className="flex flex-wrap gap-2">
                {calibrationEmployers.map((employer) => (
                  <span
                    key={employer}
                    className="inline-flex items-center rounded-md border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]"
                  >
                    {employer}
                  </span>
                ))}
              </div>
            </div>
          )}

          {methodologyUrl && (
            <div className="pt-3 border-t border-[var(--surface-border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Standard assessment methodology and statistical calibration details:</span>
              <a
                href={methodologyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-600 hover:underline print:hidden"
              >
                View Assessment Methodology →
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
