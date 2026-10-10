import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/index.js';
import { PrismaService } from '../platform/prisma/prisma.service.js';
import { RedisService } from '../platform/redis/redis.service.js';
import { InputResolverService, type RawVerificationRequest } from './input-resolver.service.js';
import { IssuerDetectorService } from './issuer-detector.service.js';
import { VerifierRegistryService } from './verifier-registry.service.js';
import type { CredentialDetails, CredentialInput } from './types.js';

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
  /** Earner name the source published (e.g. on a Credly badge), or null when the adapter couldn't read one. */
  subjectName: string | null;
  /** What the source says the credential is (name, awarding org, dates), when the adapter read it. */
  details: CredentialDetails | null;
}

export interface SubmitOptions {
  /** Re-run even when a cached or earlier result exists (admin re-verify, scheduled re-check). */
  refresh?: boolean;
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
  async submit(
    request: RawVerificationRequest,
    options: SubmitOptions = {},
  ): Promise<CreateVerificationResult> {
    const input = this.resolver.resolve(request);
    const sourceIdentifier = this.resolver.sourceIdentifier(input);

    if (options.refresh) {
      await this.redis.del(this.cacheKey(sourceIdentifier));
    } else {
      const cached = await this.redis.get(this.cacheKey(sourceIdentifier));
      if (cached) {
        const parsed = JSON.parse(cached) as VerificationResultView;
        return {
          verificationId: parsed.verificationId,
          credentialId: parsed.credentialId,
          status: 'cached',
        };
      }
    }

    // A credential seen before: reuse a run that is still in flight, otherwise start a fresh one.
    // Its cached result has expired (the TTL is the freshness window) or a refresh was asked for,
    // so handing back the old verification would serve a stale revocation/expiry answer.
    const existingCredential = await this.prisma.credential.findUnique({
      where: { sourceIdentifier },
    });
    if (existingCredential) {
      const inFlight = await this.findExistingVerification(sourceIdentifier);
      if (inFlight && existingCredential.status === 'VERIFICATION_PENDING') return inFlight;
      return this.startNewRun(existingCredential.id);
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

    // Two requests for the same credential can both pass the existence check
    // above before either inserts (TOCTOU) — sourceIdentifier is unique, so
    // the loser's create() throws P2002. Treat that as "someone else just
    // won the race" rather than a real error: look the row up again instead
    // of surfacing a 500 for what is, from the caller's perspective, a
    // perfectly normal duplicate submission.
    let credential;
    try {
      credential = await this.prisma.credential.create({
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
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        const winner = await this.findExistingVerification(sourceIdentifier);
        if (winner) return winner;
        // Vanishingly unlikely: the winner's credential row exists but its
        // verification row doesn't yet (mid-flight between the two inserts
        // below). Attach a fresh verification to that credential rather
        // than retrying in a loop.
        const winnerCredential = await this.prisma.credential.findUniqueOrThrow({
          where: { sourceIdentifier },
        });
        const verification = await this.prisma.verification.create({
          data: {
            credentialId: winnerCredential.id,
            method: 'DOCUMENT_PARSE',
            verificationLevel: 'UNVERIFIED',
            adapterVersion: ADAPTER_VERSION,
          },
        });
        return {
          verificationId: verification.id,
          credentialId: winnerCredential.id,
          status: 'VERIFICATION_PENDING',
        };
      }
      throw error;
    }

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

  private async startNewRun(credentialId: string): Promise<CreateVerificationResult> {
    const [, verification] = await this.prisma.$transaction([
      this.prisma.credential.update({
        where: { id: credentialId },
        data: { status: 'VERIFICATION_PENDING' },
      }),
      this.prisma.verification.create({
        data: {
          credentialId,
          method: 'DOCUMENT_PARSE',
          verificationLevel: 'UNVERIFIED',
          adapterVersion: ADAPTER_VERSION,
        },
      }),
    ]);
    return { verificationId: verification.id, credentialId, status: 'VERIFICATION_PENDING' };
  }

  private async findExistingVerification(
    sourceIdentifier: string,
  ): Promise<CreateVerificationResult | null> {
    const existing = await this.prisma.credential.findUnique({ where: { sourceIdentifier } });
    if (!existing) return null;
    const latest = await this.prisma.verification.findFirst({
      where: { credentialId: existing.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) return null;
    return { verificationId: latest.id, credentialId: existing.id, status: 'VERIFICATION_PENDING' };
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002'
    );
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

      // run() must be safe to call more than once for the same
      // verificationId — a BullMQ attempts-retry after a transient failure,
      // or (belt and suspenders alongside the controller's jobId dedup) a
      // race-condition duplicate job, would otherwise append a second copy
      // of every check/evidence row instead of replacing them. Clear first,
      // in the same transaction as the re-insert.
      await this.prisma.$transaction([
        this.prisma.verificationCheck.deleteMany({ where: { verificationId: verification.id } }),
        this.prisma.verificationEvidence.deleteMany({ where: { verificationId: verification.id } }),
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
            rawResponse: {
              ...(result.rawResponse ?? {}),
              ...(result.details ? { details: result.details } : {}),
            } as Prisma.InputJsonValue,
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
        ...(result.subjectName
          ? [
              this.prisma.subject.update({
                where: { id: verification.credential.subjectId },
                data: { name: result.subjectName },
              }),
            ]
          : []),
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
      include: { credential: { include: { subject: true } }, checks: true, evidence: true },
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
      // Subject rows start as the 'Unknown' placeholder until an adapter reads a real name.
      subjectName:
        verification.credential.subject && verification.credential.subject.name !== 'Unknown'
          ? verification.credential.subject.name
          : null,
      details: readDetails(verification.rawResponse),
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

function readDetails(rawResponse: unknown): CredentialDetails | null {
  if (typeof rawResponse !== 'object' || rawResponse === null) return null;
  const details = (rawResponse as { details?: unknown }).details;
  return typeof details === 'object' && details !== null ? (details as CredentialDetails) : null;
}
