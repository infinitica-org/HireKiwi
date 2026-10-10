import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service.js';
import { Tier1IssuerRegistry } from './tier1-issuer-registry.js';
import { Tier2PublicUrlVerifier } from './tier2-public-url-verifier.js';
import { Tier3OcrVerifier } from './tier3-ocr-verifier.js';
import type { TierVerificationResult } from './tier1-issuer-adapter.js';
import type {
  CandidateCertificateStatus,
  CertificateSourceStatus,
} from '../../../generated/prisma/index.js';

export interface VerificationRunOutput {
  certificateId: string;
  sourceStatus: CertificateSourceStatus;
  status: CandidateCertificateStatus;
  tierUsed: string;
  result: TierVerificationResult;
}

export interface VerificationRunOptions {
  /** Re-ask the issuer instead of reusing the engine's cached answer (admin re-verify, re-checks). */
  refresh?: boolean;
  /**
   * Scheduled re-check of an already verified certificate: only a definitive negative (revoked,
   * no longer found) changes it. An inconclusive answer or an expiry is logged, never a demotion.
   */
  recheck?: boolean;
}

/** Re-check events stay out of the student's status line, which reads the latest `[TIER_` event. */
const RECHECK_EVENT_PREFIX = '[RECHECK]';

/** Only these outcomes are decisive; anything else can still be improved on by a later tier. */
function isDecisive(result: TierVerificationResult | null): result is TierVerificationResult {
  return result?.status === 'VERIFIED' || result?.status === 'FAILED';
}

@Injectable()
export class CertificateSourceVerificationService {
  private readonly logger = new Logger(CertificateSourceVerificationService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Tier1IssuerRegistry) private readonly tier1Registry: Tier1IssuerRegistry,
    @Inject(Tier2PublicUrlVerifier) private readonly tier2Verifier: Tier2PublicUrlVerifier,
    @Inject(Tier3OcrVerifier) private readonly tier3Verifier: Tier3OcrVerifier,
  ) {}

  async runVerification(
    certificateId: string,
    options: VerificationRunOptions = {},
  ): Promise<VerificationRunOutput> {
    const cert = await this.prisma.candidateCertificate.findUnique({
      where: { id: certificateId },
      include: { candidate: true },
    });

    if (!cert) {
      throw new NotFoundException(`Candidate certificate with ID ${certificateId} not found.`);
    }

    const candidateName = cert.candidate?.fullName ?? null;
    const { result, discoveredFrom } = await this.evaluate(cert, candidateName, options);

    if (options.recheck) {
      const revokedOrGone =
        result.status === 'FAILED' && result.metadata?.engineStatus !== 'EXPIRED';
      if (revokedOrGone) return this.applyResult(cert.id, result);
      await this.prisma.certificateVerificationEvent.create({
        data: {
          candidateCertificateId: cert.id,
          status: cert.status,
          message: `${RECHECK_EVENT_PREFIX} ${result.status}: ${result.reason}`,
          metadata: { tier: result.tier, resultStatus: result.status, recheck: true },
        },
      });
      return {
        certificateId: cert.id,
        sourceStatus: cert.sourceStatus,
        status: cert.status,
        tierUsed: result.tier,
        result,
      };
    }
    return this.applyResult(cert.id, result, discoveredFrom);
  }

  /** Runs the tiers in order and picks the outcome, without writing anything. */
  private async evaluate(
    cert: {
      title: string;
      issuer: string;
      certificateNumber: string | null;
      verificationUrl: string | null;
      certificateFileUrl: string | null;
      fileMimeType: string | null;
    },
    candidateName: string | null,
    options: VerificationRunOptions,
  ): Promise<{ result: TierVerificationResult; discoveredFrom: TierVerificationResult | null }> {
    // ------------------------------------------------------------------------
    // Tier 1: the verification engine (pasted link, or certificate number)
    // ------------------------------------------------------------------------
    const tier1Result = await this.tier1Registry.verify({
      title: cert.title,
      issuer: cert.issuer,
      certificateNumber: cert.certificateNumber,
      verificationUrl: cert.verificationUrl,
      candidateName,
      refresh: options.refresh,
    });

    if (tier1Result.status !== 'UNAVAILABLE') {
      return { result: tier1Result, discoveredFrom: null };
    }

    // ------------------------------------------------------------------------
    // Tier 2: a link no engine adapter covers (auto-verifies on trusted hosts only)
    // ------------------------------------------------------------------------
    const tier2Result = cert.verificationUrl
      ? await this.tier2Verifier.verify({
          verificationUrl: cert.verificationUrl,
          candidateName,
          title: cert.title,
          issuer: cert.issuer,
          certificateNumber: cert.certificateNumber,
        })
      : null;
    if (isDecisive(tier2Result)) return { result: tier2Result, discoveredFrom: null };

    // ------------------------------------------------------------------------
    // Tier 3: the uploaded file — its QR code / link can still reach a covered issuer
    // ------------------------------------------------------------------------
    const tier3Result = cert.certificateFileUrl
      ? await this.tier3Verifier.verify({
          certificateFileUrl: cert.certificateFileUrl,
          fileMimeType: cert.fileMimeType,
          candidateName,
          title: cert.title,
          issuer: cert.issuer,
          certificateNumber: cert.certificateNumber,
          verificationUrl: cert.verificationUrl,
        })
      : null;

    const usable = [tier3Result, tier2Result].filter(
      (result): result is TierVerificationResult => !!result && result.status !== 'UNAVAILABLE',
    );
    const chosen = usable.find((result) => isDecisive(result)) ?? tier2Result ?? usable[0];
    if (chosen && chosen.status !== 'UNAVAILABLE') {
      return { result: chosen, discoveredFrom: cert.verificationUrl ? null : tier3Result };
    }

    // Default Fallback: If no tier was available to evaluate
    const fallbackResult: TierVerificationResult = {
      status: 'AMBIGUOUS',
      tier: 'TIER_3_OCR_HEURISTIC',
      confidence: 0,
      reason: 'No automated verification tier was capable of evaluating this certificate payload.',
      studentMessage:
        "Add the certificate's verification link or upload the certificate so we can check it.",
    };

    return { result: fallbackResult, discoveredFrom: null };
  }

  /**
   * `discoveredFrom`: a Tier 3 result whose link (found in the uploaded file) should be saved as
   * the certificate's verification URL, so the student and reviewers see where it was checked.
   */
  private async applyResult(
    certificateId: string,
    result: TierVerificationResult,
    discoveredFrom: TierVerificationResult | null = null,
  ): Promise<VerificationRunOutput> {
    let sourceStatus: CertificateSourceStatus = 'pending';
    let status: CandidateCertificateStatus = 'IN_VERIFICATION';

    if (result.status === 'VERIFIED') {
      sourceStatus = 'source_verified';
      // CV-T02: final VERIFIED requires agenda assessment pass — not source alone.
      status = 'IN_VERIFICATION';
    } else if (result.status === 'FAILED') {
      sourceStatus = 'source_failed';
      status = 'REJECTED';
    } else {
      // Ambiguous or Unavailable -> pending & IN_VERIFICATION
      sourceStatus = 'pending';
      status = 'IN_VERIFICATION';
    }

    const discoveredUrl = discoveredFrom?.metadata?.discoveredUrl;

    // Update database row
    const updated = await this.prisma.candidateCertificate.update({
      where: { id: certificateId },
      data: {
        sourceStatus,
        status,
        ...(typeof discoveredUrl === 'string' && discoveredUrl.length <= 500
          ? { verificationUrl: discoveredUrl }
          : {}),
      },
    });

    // Record audit event in CertificateVerificationEvent
    await this.prisma.certificateVerificationEvent.create({
      data: {
        candidateCertificateId: certificateId,
        status: updated.status,
        message: `[${result.tier}] ${result.status}: ${result.reason}`,
        metadata: {
          tier: result.tier,
          resultStatus: result.status,
          confidence: result.confidence,
          reason: result.reason,
          sourceStatus,
          verificationSource: result.tier,
          ...(result.studentMessage ? { studentMessage: result.studentMessage } : {}),
          ...(result.metadata ?? {}),
        },
      },
    });

    return {
      certificateId,
      sourceStatus: updated.sourceStatus,
      status: updated.status,
      tierUsed: result.tier,
      result,
    };
  }
}
