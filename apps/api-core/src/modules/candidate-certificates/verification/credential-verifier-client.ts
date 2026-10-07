import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../../platform/config/env.js';
import type {
  Tier1Input,
  Tier1IssuerAdapter,
  TierVerificationResult,
} from './tier1-issuer-adapter.js';

/** Shape of apps/credential-verifier's GET /api/v1/verifications/:id response. */
interface EngineVerificationResult {
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
}

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

const POLL_INTERVAL_MS = 400;
const POLL_MAX_ATTEMPTS = 10; // ~4s — covers every path exercised so far (fallback/W3C VC/Credly fetch); genuinely slow issuer calls fall through to Tier 2/3 rather than blocking the request.

/**
 * Bridges the legacy Tier1IssuerAdapter interface onto the standalone
 * Credential Verification Platform (apps/credential-verifier). This is the
 * ONLY Tier 1 adapter now — it replaces CredlyAdapter/AccredibleAdapter/
 * AwsAdapter/GoogleAdapter/MicrosoftAdapter, which hardcoded VERIFIED
 * whenever an env API key var happened to be set, with no real issuer call.
 *
 * `TierVerificationResult`'s status enum (VERIFIED/FAILED/AMBIGUOUS/
 * UNAVAILABLE) is coarser than the engine's own
 * (VERIFIED/EXPIRED/REVOKED/.../UNVERIFIABLE/DOCUMENT_ONLY/...) — bridging
 * into the legacy shape loses the "expired but authentic" distinction the
 * engine actually makes. That's a known limitation of this bridge, not of
 * the engine; replacing candidate-certificates' own status model is a
 * separate, larger migration.
 *
 * Synchronous bridge: POSTs, then polls briefly. The engine is async by
 * design (queue + worker); this adapter trades a bounded wait for not
 * having to rearchitect candidate-certificates' request-time verification
 * flow into a webhook/poll pattern today. If the engine hasn't resolved
 * within the poll budget, this returns UNAVAILABLE so Tier 2/3 still run —
 * it never blocks indefinitely and never fabricates a result.
 */
@Injectable()
export class CredentialVerifierClientAdapter implements Tier1IssuerAdapter {
  readonly name = 'CredentialVerifier';
  private readonly logger = new Logger(CredentialVerifierClientAdapter.name);

  supports(_issuer: string): boolean {
    // The engine does its own issuer detection; this adapter is always
    // tried first and falls back to UNAVAILABLE on anything it can't route
    // (no verification URL or certificate number) or that errors out.
    return true;
  }

  async verify(input: Tier1Input): Promise<TierVerificationResult> {
    const body = this.toEngineRequest(input);
    if (!body) {
      return {
        status: 'UNAVAILABLE',
        tier: 'TIER_1_ISSUER_API',
        confidence: 0,
        reason: 'No verification URL or certificate number to route to the verification engine.',
      };
    }

    let verificationId: string;
    try {
      const submitResponse = await fetch(`${env.CREDENTIAL_VERIFIER_URL}/api/v1/verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!submitResponse.ok) {
        return this.unavailable(
          `Verification engine returned HTTP ${submitResponse.status} on submit.`,
        );
      }
      const submitJson = (await submitResponse.json()) as { verificationId: string };
      verificationId = submitJson.verificationId;
    } catch (error: unknown) {
      return this.unavailable(
        `Could not reach the verification engine: ${error instanceof Error ? error.message : 'unknown error'}.`,
      );
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
      return this.toTierResult(result);
    }

    this.logger.debug(
      `Verification ${verificationId} did not resolve within the poll budget; falling through.`,
    );
    return this.unavailable('Verification engine did not resolve within the allotted time.');
  }

  private toEngineRequest(
    input: Tier1Input,
  ): { inputType: string; value: string; metadata?: Record<string, unknown> } | null {
    if (input.verificationUrl) {
      return {
        inputType: 'URL',
        value: input.verificationUrl,
        metadata: { issuer: input.issuer, title: input.title },
      };
    }
    if (input.certificateNumber) {
      return {
        inputType: 'ISSUER_AND_ID',
        value: input.certificateNumber,
        metadata: { issuer: input.issuer, title: input.title },
      };
    }
    return null;
  }

  private toTierResult(result: EngineVerificationResult): TierVerificationResult {
    const confidence = LEVEL_CONFIDENCE[result.verificationLevel] ?? 0;
    const reasonDetail = result.checks
      .map((c) => c.detail)
      .filter(Boolean)
      .join(' ');

    if (POSITIVE_STATUSES.has(result.status)) {
      return {
        status: 'VERIFIED',
        tier: 'TIER_1_ISSUER_API',
        confidence,
        reason: reasonDetail || `Verified via ${result.method} (${result.verificationLevel}).`,
        metadata: {
          engineVerificationId: result.verificationId,
          method: result.method,
          level: result.verificationLevel,
        },
      };
    }
    if (DEFINITIVE_NEGATIVE_STATUSES.has(result.status)) {
      return {
        status: 'FAILED',
        tier: 'TIER_1_ISSUER_API',
        confidence,
        reason:
          reasonDetail || `Credential is ${result.status.toLowerCase()} per ${result.method}.`,
        metadata: {
          engineVerificationId: result.verificationId,
          method: result.method,
          level: result.verificationLevel,
        },
      };
    }
    // UNVERIFIABLE, DOCUMENT_ONLY, VERIFICATION_ERROR — let Tier 2/3 try, same as before.
    return this.unavailable(
      reasonDetail ||
        `Engine returned ${result.status}; no automated issuer confirmation available.`,
    );
  }

  private unavailable(reason: string): TierVerificationResult {
    return { status: 'UNAVAILABLE', tier: 'TIER_1_ISSUER_API', confidence: 0, reason };
  }
}
