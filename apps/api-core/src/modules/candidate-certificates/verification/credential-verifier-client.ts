import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../../platform/config/env.js';
import type {
  Tier1Input,
  Tier1IssuerAdapter,
  TierVerificationResult,
} from './tier1-issuer-adapter.js';
import { personNamesMatch } from './person-name-match.js';

/** What the engine says a credential is, when its adapter could read it. */
export interface EngineCredentialDetails {
  achievementName: string | null;
  issuerName: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
}

/** Shape of apps/credential-verifier's GET /api/v1/verifications/:id response. */
export interface EngineVerificationResult {
  verificationId: string;
  credentialId: string;
  status: string;
  verificationLevel: string;
  method: string;
  provider: string | null;
  verifiedAt: string | null;
  checks: Array<{ checkName: string; result: string; detail: string | null }>;
  evidence: Array<{ evidenceType: string; url: string | null }>;
  evidenceUrl: string | null;
  /** Earner name the engine read off the credential; absent from older engine builds. */
  subjectName?: string | null;
  details?: EngineCredentialDetails | null;
}

type EngineRequest = {
  inputType: 'URL' | 'ISSUER_AND_ID' | 'JSON_CREDENTIAL';
  value: string;
  metadata?: Record<string, unknown>;
  refresh?: boolean;
};

export type EngineLookup =
  { kind: 'result'; result: EngineVerificationResult } | { kind: 'unavailable'; reason: string };

const LEVEL_CONFIDENCE: Record<string, number> = {
  CRYPTOGRAPHICALLY_VERIFIED: 0.99,
  CREDENTIAL_PLATFORM_VERIFIED: 0.9,
  ISSUER_RECORD_MATCH: 0.85,
  DOCUMENT_PARSED: 0.5,
  UNVERIFIED: 0,
};

const DEFINITIVE_NEGATIVE_STATUSES = new Set([
  'EXPIRED',
  'REVOKED',
  'SUSPENDED',
  'INVALID',
  'NOT_FOUND',
]);
const POSITIVE_STATUSES = new Set(['VERIFIED', 'VERIFIED_WITH_WARNINGS']);

/** How a student reads the engine's provider id. */
const PROVIDER_LABELS: Record<string, string> = {
  credly: 'Credly',
  coursera: 'Coursera',
  hackerrank: 'HackerRank',
  nptel: 'NPTEL',
};

export function providerLabel(provider: string | null | undefined): string {
  if (!provider) return 'the issuer';
  if (PROVIDER_LABELS[provider]) return PROVIDER_LABELS[provider];
  if (provider.startsWith('open-badges')) return 'Open Badges';
  if (provider.startsWith('w3c-vc')) return 'its digital signature';
  return provider;
}

const POLL_INTERVAL_MS = 400;
const POLL_MAX_ATTEMPTS = 15; // ~6s — covers the slowest page fetched so far (NPTEL's ~1.4 MB certificate image); genuinely slow issuer calls fall through to Tier 2/3 rather than blocking.

/**
 * Bridges the Tier1IssuerAdapter interface onto the standalone Credential Verification Platform
 * (apps/credential-verifier), the only Tier 1 adapter.
 *
 * The engine caches and deduplicates per credential, not per account, so it only reports facts
 * about the credential — including the name it was issued to. Binding that to the account happens
 * here: an authentic credential is only VERIFIED for a student whose name it carries; one naming
 * someone else, or nobody, goes to review.
 *
 * Synchronous bridge: POSTs, then polls briefly. If the engine hasn't resolved within the poll
 * budget this returns UNAVAILABLE so Tier 2/3 still run — it never blocks indefinitely and never
 * fabricates a result.
 */
@Injectable()
export class CredentialVerifierClientAdapter implements Tier1IssuerAdapter {
  readonly name = 'CredentialVerifier';
  private readonly logger = new Logger(CredentialVerifierClientAdapter.name);

  supports(_issuer: string): boolean {
    // The engine does its own issuer detection; this adapter is always tried first and falls
    // back to UNAVAILABLE on anything it can't route or that errors out.
    return true;
  }

  async verify(input: Tier1Input): Promise<TierVerificationResult> {
    const request = this.toEngineRequest(input);
    if (!request) {
      return this.unavailable(
        'No verification URL, credential file or certificate number to route to the verification engine.',
      );
    }
    const lookup = await this.run(request);
    if (lookup.kind === 'unavailable') return this.unavailable(lookup.reason);
    return this.toTierResult(lookup.result, input.candidateName ?? null);
  }

  /** Runs one link through the engine as-is, for the add-certificate form's preview. */
  async inspectUrl(url: string): Promise<EngineLookup> {
    return this.run({ inputType: 'URL', value: url });
  }

  private async run(request: EngineRequest): Promise<EngineLookup> {
    let verificationId: string;
    try {
      const submitResponse = await fetch(`${env.CREDENTIAL_VERIFIER_URL}/api/v1/verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!submitResponse.ok) {
        return {
          kind: 'unavailable',
          reason: `Verification engine returned HTTP ${submitResponse.status} on submit.`,
        };
      }
      const submitJson = (await submitResponse.json()) as { verificationId: string };
      verificationId = submitJson.verificationId;
    } catch (error: unknown) {
      return {
        kind: 'unavailable',
        reason: `Could not reach the verification engine: ${error instanceof Error ? error.message : 'unknown error'}.`,
      };
    }

    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      let result: EngineVerificationResult;
      try {
        const getResponse = await fetch(
          `${env.CREDENTIAL_VERIFIER_URL}/api/v1/verifications/${verificationId}`,
        );
        if (!getResponse.ok) continue;
        result = (await getResponse.json()) as EngineVerificationResult;
      } catch {
        continue;
      }
      if (result.status === 'VERIFICATION_PENDING') continue;
      return { kind: 'result', result };
    }

    this.logger.debug(
      `Verification ${verificationId} did not resolve within the poll budget; falling through.`,
    );
    return {
      kind: 'unavailable',
      reason: 'Verification engine did not resolve within the allotted time.',
    };
  }

  private toEngineRequest(input: Tier1Input): EngineRequest | null {
    const metadata = { issuer: input.issuer, title: input.title };
    const refresh = input.refresh ? { refresh: true } : {};
    if (input.verificationUrl) {
      return { inputType: 'URL', value: input.verificationUrl, metadata, ...refresh };
    }
    if (input.credentialJson) {
      return { inputType: 'JSON_CREDENTIAL', value: input.credentialJson, metadata, ...refresh };
    }
    if (input.certificateNumber) {
      return { inputType: 'ISSUER_AND_ID', value: input.certificateNumber, metadata, ...refresh };
    }
    return null;
  }

  private toTierResult(
    result: EngineVerificationResult,
    candidateName: string | null,
  ): TierVerificationResult {
    const confidence = LEVEL_CONFIDENCE[result.verificationLevel] ?? 0;
    const reasonDetail = result.checks
      .map((c) => c.detail)
      .filter(Boolean)
      .join(' ');
    const provider = providerLabel(result.provider);
    const subjectName = result.subjectName ?? null;
    const metadata = {
      engineVerificationId: result.verificationId,
      method: result.method,
      level: result.verificationLevel,
      provider: result.provider,
      subjectName,
      details: result.details ?? null,
      evidenceUrl: result.evidenceUrl,
    };

    if (POSITIVE_STATUSES.has(result.status)) {
      // A mismatch goes to review rather than straight to rejection: a legal name and a display
      // name ("Vishal V" vs. "V. Vishal Kumar") can differ. No name at all also goes to review —
      // an authentic credential proves nothing about who submitted it.
      if (!subjectName) {
        return {
          status: 'AMBIGUOUS',
          tier: 'TIER_1_ISSUER_API',
          confidence: 0.5,
          reason: `Credential is authentic (${result.method}, ${result.verificationLevel}) but does not state its holder's name. Flagged for review.`,
          studentMessage: `${provider} confirmed this certificate is genuine, but it doesn't show the holder's name, so we'll confirm it's yours by hand.`,
          metadata: { ...metadata, candidateMatch: null },
        };
      }
      if (!(candidateName && personNamesMatch(subjectName, candidateName))) {
        return {
          status: 'AMBIGUOUS',
          tier: 'TIER_1_ISSUER_API',
          confidence: 0.5,
          reason: candidateName
            ? `Credential is authentic but was issued to "${subjectName}", which does not match the account name "${candidateName}". Flagged for review.`
            : `Credential is authentic and was issued to "${subjectName}", but the account has no name to match it against. Flagged for review.`,
          studentMessage: `This certificate was issued to "${subjectName}", which doesn't match the name on your profile. We'll review it by hand.`,
          metadata: { ...metadata, candidateMatch: false },
        };
      }
      return {
        status: 'VERIFIED',
        tier: 'TIER_1_ISSUER_API',
        confidence,
        reason: reasonDetail || `Verified via ${result.method} (${result.verificationLevel}).`,
        studentMessage: `Verified with ${provider}. Issued to ${subjectName}.`,
        metadata: { ...metadata, candidateMatch: true },
      };
    }
    if (DEFINITIVE_NEGATIVE_STATUSES.has(result.status)) {
      return {
        status: 'FAILED',
        tier: 'TIER_1_ISSUER_API',
        confidence,
        reason:
          reasonDetail || `Credential is ${result.status.toLowerCase()} per ${result.method}.`,
        studentMessage: negativeMessage(result.status, provider),
        metadata: { ...metadata, engineStatus: result.status },
      };
    }
    // UNVERIFIABLE, DOCUMENT_ONLY, VERIFICATION_ERROR — let Tier 2/3 try.
    return this.unavailable(
      reasonDetail ||
        `Engine returned ${result.status}; no automated issuer confirmation available.`,
    );
  }

  private unavailable(reason: string): TierVerificationResult {
    return { status: 'UNAVAILABLE', tier: 'TIER_1_ISSUER_API', confidence: 0, reason };
  }
}

export function negativeMessage(status: string, provider: string): string {
  switch (status) {
    case 'REVOKED':
      return `${provider} says this certificate has been revoked.`;
    case 'EXPIRED':
      return `${provider} says this certificate has expired.`;
    case 'NOT_FOUND':
      return `${provider} has no certificate at this link. Check that you copied the full link.`;
    default:
      return `${provider} did not confirm this certificate.`;
  }
}
