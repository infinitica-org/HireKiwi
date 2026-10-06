import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/index.js';
import { PrismaService } from '../platform/prisma/prisma.service.js';
import { RedisService } from '../platform/redis/redis.service.js';
import { InputResolverService, type RawVerificationRequest } from './input-resolver.service.js';
import { IssuerDetectorService } from './issuer-detector.service.js';
import { VerifierRegistryService } from './verifier-registry.service.js';
import type { CredentialInput } from './types.js';

const ADAPTER_VERSION = '0.1.0-stage4';

export interface CreateVerificationResult {
  verificationId: string;
  credentialId: string;
  status: 'VERIFICATION_PENDING' | 'cached';
}

export interface VerificationResultView {
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

/**
 * Owns the pipeline: resolve -> detect -> pick adapter -> normalize ->
 * verify -> persist -> cache -> audit. A controller enqueues; a worker
 * calls `run()`. Neither talks to an adapter directly.
 */
@Injectable()
export class VerificationOrchestratorService {
  private readonly logger = new Logger(VerificationOrchestratorService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(InputResolverService) private readonly resolver: InputResolverService,
    @Inject(IssuerDetectorService) private readonly issuerDetector: IssuerDetectorService,
    @Inject(VerifierRegistryService) private readonly registry: VerifierRegistryService,
  ) {}

  /** Called from the controller: creates the pending rows and returns immediately. Actual verification happens in the worker via `run()`. */
  async submit(request: RawVerificationRequest): Promise<CreateVerificationResult> {
    const input = this.resolver.resolve(request);
    const sourceIdentifier = this.resolver.sourceIdentifier(input);

    const cached = await this.redis.get(this.cacheKey(sourceIdentifier));
    if (cached) {
      const parsed = JSON.parse(cached) as VerificationResultView;
      return {
        verificationId: parsed.verificationId,
        credentialId: parsed.credentialId,
        status: 'cached',
      };
    }

    const existing = await this.prisma.credential.findUnique({ where: { sourceIdentifier } });
    if (existing) {
      const latest = await this.prisma.verification.findFirst({
        where: { credentialId: existing.id },
        orderBy: { createdAt: 'desc' },
      });
      if (latest) {
        return {
          verificationId: latest.id,
          credentialId: existing.id,
          status: 'VERIFICATION_PENDING',
        };
      }
    }

    const detection = this.issuerDetector.detect(input);
    const issuer = await this.prisma.issuer.upsert({
      where: { domain: detection.candidateDomain ?? '__unknown__' },
      update: {},
      create: {
        name: detection.candidateIssuer ?? 'Unknown',
        domain: detection.candidateDomain,
        issuerType: 'unclassified',
        trustStatus: 'UNVERIFIED',
      },
    });
    const subject = await this.prisma.subject.create({
      data: { name: 'Unknown', email: null, externalIdentifier: null },
    });
    const achievement = await this.prisma.achievement.create({
      data: {
        name: 'Unknown',
        description: null,
        credentialType: 'UNKNOWN',
        level: null,
        skills: [],
        framework: null,
      },
    });
    const credential = await this.prisma.credential.create({
      data: {
        issuerId: issuer.id,
        subjectId: subject.id,
        achievementId: achievement.id,
        credentialType: 'UNKNOWN',
        status: 'VERIFICATION_PENDING',
        source: input.type,
        sourceIdentifier,
        rawMetadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    const verification = await this.prisma.verification.create({
      data: {
        credentialId: credential.id,
        method: 'DOCUMENT_PARSE',
        verificationLevel: 'UNVERIFIED',
        adapterVersion: ADAPTER_VERSION,
      },
    });

    return {
      verificationId: verification.id,
      credentialId: credential.id,
      status: 'VERIFICATION_PENDING',
    };
  }

  /** Called by the worker. Runs the actual adapter pipeline and persists the outcome + audit trail. */
  async run(verificationId: string): Promise<void> {
    const started = Date.now();
    const verification = await this.prisma.verification.findUnique({
      where: { id: verificationId },
      include: { credential: true },
    });
    if (!verification) {
      throw new NotFoundException(`Verification ${verificationId} not found.`);
    }

    const input: CredentialInput = {
      type: verification.credential.source,
      value: verification.credential.sourceIdentifier?.split(':').slice(1).join(':') ?? '',
      metadata: (verification.credential.rawMetadata as Record<string, unknown>) ?? {},
    };

    const adapter = this.registry.resolve(input);
    let outcome: 'success' | 'error' = 'success';
    let errorMessage: string | null = null;

    try {
      const normalized = await adapter.normalize(input);
      const result = await adapter.verify(normalized);

      await this.prisma.$transaction([
        this.prisma.credential.update({
          where: { id: verification.credentialId },
          data: { status: result.status },
        }),
        this.prisma.verification.update({
          where: { id: verification.id },
          data: {
            method: result.method,
            provider: result.provider,
            verificationLevel: result.verificationLevel,
            verifiedAt: result.verifiedAt ? new Date(result.verifiedAt) : null,
            evidenceUrl: result.evidenceUrl,
            rawResponse: (result.rawResponse ?? {}) as Prisma.InputJsonValue,
          },
        }),
        this.prisma.verificationCheck.createMany({
          data: result.checks.map((check) => ({
            verificationId: verification.id,
            checkName: check.checkName,
            result: check.result,
            detail: check.detail,
          })),
        }),
        this.prisma.verificationEvidence.createMany({
          data: result.evidence.map((e) => ({
            verificationId: verification.id,
            evidenceType: e.evidenceType,
            url: e.url,
            fileRef: e.fileRef,
            metadata: e.metadata as Prisma.InputJsonValue,
          })),
        }),
      ]);

      const view = await this.toView(verification.id);
      const ttl = this.cacheTtlFor(result.verificationLevel);
      await this.redis.set(
        this.cacheKey(verification.credential.sourceIdentifier ?? verification.credentialId),
        JSON.stringify(view),
        'EX',
        ttl,
      );
    } catch (error: unknown) {
      outcome = 'error';
      errorMessage = error instanceof Error ? error.message : 'Unknown verification error.';
      await this.prisma.credential.update({
        where: { id: verification.credentialId },
        data: { status: 'VERIFICATION_ERROR' },
      });
      this.logger.error(`Verification ${verificationId} failed: ${errorMessage}`);
    } finally {
      await this.prisma.verificationAttempt.create({
        data: {
          verificationId: verification.id,
          outcome,
          error: errorMessage,
          durationMs: Date.now() - started,
        },
      });
    }
  }

  async getById(verificationId: string): Promise<VerificationResultView> {
    return this.toView(verificationId);
  }

  private async toView(verificationId: string): Promise<VerificationResultView> {
    const verification = await this.prisma.verification.findUnique({
      where: { id: verificationId },
      include: { credential: true, checks: true, evidence: true },
    });
    if (!verification) {
      throw new NotFoundException(`Verification ${verificationId} not found.`);
    }
    return {
      verificationId: verification.id,
      credentialId: verification.credentialId,
      status: verification.credential.status,
      verificationLevel: verification.verificationLevel,
      method: verification.method,
      provider: verification.provider,
      verifiedAt: verification.verifiedAt?.toISOString() ?? null,
      checks: verification.checks.map((c) => ({
        checkName: c.checkName,
        result: c.result,
        detail: c.detail,
      })),
      evidence: verification.evidence.map((e) => ({ evidenceType: e.evidenceType, url: e.url })),
      evidenceUrl: verification.evidenceUrl,
    };
  }

  private cacheKey(sourceIdentifier: string): string {
    return `verification:result:${sourceIdentifier}`;
  }

  /** Revocable credentials (platform/issuer-checked) get a short TTL; cryptographic/self-contained proofs can cache longer. */
  private cacheTtlFor(level: string): number {
    if (level === 'CRYPTOGRAPHICALLY_VERIFIED') return 60 * 60 * 24;
    if (level === 'CREDENTIAL_PLATFORM_VERIFIED' || level === 'ISSUER_RECORD_MATCH')
      return 60 * 60 * 6;
    return 60 * 30;
  }
}
