import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  CandidateResumeFile,
  CandidateResumeStateResponse,
  DeleteResumeResponse,
  UploadProfilePhotoResponse,
  UploadResumeResponse,
} from '@hirekiwi/contracts';
import type {
  AuthenticatedUser,
  CandidateOnboardingProfileResponse,
  ChangePasswordRequest,
  CompleteCandidateOnboardingRequest,
  EnrollTrackRequest,
  LinkedinVerification,
  UpdateCandidateProfileRequest,
} from '@hirekiwi/contracts';
import {
  CandidateOnboardingDraftSchema,
  CandidateOnboardingProfileSchema,
  CANDIDATE_RESUME_FILES_MAX,
  CandidateResumeFileSchema,
  CandidateResumeFilesSchema,
  CompleteCandidateOnboardingRequestSchema,
  CURRENT_CONSENT_VERSION,
  DeleteResumeRequestSchema,
  profileHeadlineForUser,
  RESUME_MAX_FILE_SIZE_BYTES,
  RESUME_VALIDATION_MESSAGES,
  SaveCandidateOnboardingDraftRequestSchema,
  SMART_TOPICS,
  validateResumeDocumentText,
} from '@hirekiwi/contracts';
import type { Prisma } from '../../generated/prisma/index.js';
import { AuditPublisherService } from '../../platform/audit/audit-publisher.service.js';
import { env } from '../../platform/config/env.js';
import { KafkaOutboxService } from '../../platform/kafka/kafka-outbox.service.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { StorageService } from '../../platform/storage/storage.service.js';
import { AuthService, hashPassword, verifyPassword } from '../auth/auth.service.js';
import { ResumeParseService } from '../ai-gateway/resume-parse.service.js';
import { validateAndExtractPdfResume } from './pdf-validator.js';
import {
  isAllowedProfilePhotoMimeType,
  normalizeProfilePhotoMimeType,
} from './profile-photo.mime.js';
import { resolveProfilePhotoUrl, toAuthenticatedUserWithPhoto } from './profile-photo.util.js';
const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_RESUME_BYTES = RESUME_MAX_FILE_SIZE_BYTES;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(KafkaOutboxService) private readonly outbox: KafkaOutboxService,
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(AuditPublisherService) private readonly auditPublisher: AuditPublisherService,
    @Optional() @Inject(ResumeParseService) private readonly resumeParse?: ResumeParseService,
  ) {}

  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { institution: true, company: true, primaryTrack: true, secondaryTrack: true },
    });
    if (!user) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'User not found.',
        statusCode: 404,
      });
    }
    // A student gets a headline from the shared list the first time they load their account
    // (new and existing students alike); it is stored, so it stays the same afterwards.
    if (user.role === 'STUDENT' && !user.profileHeadline) {
      const profileHeadline = profileHeadlineForUser(user.id);
      await this.prisma.user.update({ where: { id: userId }, data: { profileHeadline } });
      return toAuthenticatedUserWithPhoto(this.storage, { ...user, profileHeadline });
    }
    return toAuthenticatedUserWithPhoto(this.storage, user);
  }

  async uploadProfilePhoto(
    userId: string,
    file: { buffer: Buffer; fileName: string; mimeType: string },
  ): Promise<UploadProfilePhotoResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'STUDENT') {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Only students may upload a profile photo.',
        statusCode: 403,
      });
    }

    const contentType = normalizeProfilePhotoMimeType(file.fileName, file.mimeType);
    if (!isAllowedProfilePhotoMimeType(contentType)) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: 'Only JPEG and PNG images are accepted.',
        statusCode: 400,
      });
    }
    if (file.buffer.byteLength > MAX_PROFILE_PHOTO_BYTES) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: 'The profile photo must be 2MB or smaller.',
        statusCode: 400,
      });
    }

    let objectKey: string;
    try {
      objectKey = await this.storage.upload({
        buffer: file.buffer,
        namespace: `profile-photos/${userId}`,
        fileName: file.fileName,
        contentType,
      });
    } catch {
      throw new ServiceUnavailableException({
        error: 'storage_unavailable',
        message:
          'Profile photo storage is unavailable. Check that MinIO is running and S3_ACCESS_KEY / S3_SECRET_KEY match MINIO_ROOT_USER / MINIO_ROOT_PASSWORD, then restart the API.',
        statusCode: 503,
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhotoObjectKey: objectKey },
    });

    const profilePhotoUrl = await resolveProfilePhotoUrl(this.storage, objectKey);
    if (!profilePhotoUrl) {
      throw new BadRequestException({
        error: 'upload_failed',
        message: 'The profile photo could not be stored.',
        statusCode: 400,
      });
    }

    return { profilePhotoUrl };
  }

  async updateProfile(
    userId: string,
    data: UpdateCandidateProfileRequest,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { institution: true, company: true, primaryTrack: true, secondaryTrack: true },
    });
    if (!user) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'User not found.',
        statusCode: 404,
      });
    }
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Only students may update their student profile.',
        statusCode: 403,
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.profileHeadline !== undefined ? { profileHeadline: data.profileHeadline } : {}),
      },
      include: { institution: true, company: true, primaryTrack: true, secondaryTrack: true },
    });

    return toAuthenticatedUserWithPhoto(this.storage, updated);
  }

  async getOnboarding(userId: string): Promise<CandidateOnboardingProfileResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'STUDENT') {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Only students have candidate onboarding profiles.',
        statusCode: 403,
      });
    }

    const profile =
      user.onboardingCompleted && user.onboardingDetails
        ? CandidateOnboardingProfileSchema.safeParse(user.onboardingDetails)
        : null;
    const draft =
      !user.onboardingCompleted && user.onboardingDetails
        ? CandidateOnboardingDraftSchema.safeParse(user.onboardingDetails)
        : null;

    return {
      onboardingCompleted: user.onboardingCompleted,
      profile: profile?.success ? profile.data : null,
      draft: draft?.success ? draft.data : null,
      profilePhotoUrl: await resolveProfilePhotoUrl(this.storage, user.profilePhotoObjectKey),
    };
  }

  /** Persist in-progress onboarding data so it survives a lost session or a closed tab. */
  async saveOnboardingDraft(
    userId: string,
    body: unknown,
  ): Promise<CandidateOnboardingProfileResponse> {
    const parsed = SaveCandidateOnboardingDraftRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'validation_error',
        message: 'Onboarding draft payload is invalid.',
        statusCode: 400,
        details: parsed.error.flatten(),
      });
    }
    await this.assertCatalogSkills(parsed.data.skills ?? []);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'STUDENT') {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Only students have candidate onboarding profiles.',
        statusCode: 403,
      });
    }
    const existing =
      user.onboardingDetails && typeof user.onboardingDetails === 'object'
        ? (user.onboardingDetails as Record<string, unknown>)
        : {};
    const merged = user.onboardingCompleted
      ? this.mergeProgressiveProfileDetails(existing, parsed.data)
      : {
          ...existing,
          ...parsed.data,
          savedAt: new Date().toISOString(),
        };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingDetails: merged as Prisma.InputJsonValue,
        // Denormalized onto the User row (not just onboardingDetails JSON) so matching can
        // filter on them directly — see mergeProgressiveProfileDetails for the JSON side.
        ...(parsed.data.academicScores?.cgpa !== undefined
          ? { cgpa: parsed.data.academicScores.cgpa }
          : {}),
        ...(parsed.data.academicScores?.sscPercentage !== undefined
          ? { sscPercentage: parsed.data.academicScores.sscPercentage }
          : {}),
        ...(parsed.data.academicScores?.hscPercentage !== undefined
          ? { hscPercentage: parsed.data.academicScores.hscPercentage }
          : {}),
        ...(parsed.data.academicScores?.hasActiveBacklog !== undefined
          ? { hasActiveBacklog: parsed.data.academicScores.hasActiveBacklog }
          : {}),
        ...(parsed.data.academicProgram?.graduationYear !== undefined
          ? { graduationYear: parsed.data.academicProgram.graduationYear }
          : {}),
      },
    });

    if (parsed.data.academicProgram) {
      await this.auditPublisher.record({
        actorId: userId,
        action: 'student.academic_program_updated',
        resourceType: 'user',
        resourceId: userId,
        reasonCode: null,
        metadata: {
          source: 'draft',
          previous: existing.academicProgram ?? null,
          next: parsed.data.academicProgram,
        },
      });
    }

    if (user.onboardingCompleted) {
      return this.getOnboarding(userId);
    }

    const refreshed = await this.prisma.user.findUnique({ where: { id: userId } });

    return {
      onboardingCompleted: false,
      profile: null,
      draft: CandidateOnboardingDraftSchema.parse(merged),
      profilePhotoUrl: await resolveProfilePhotoUrl(this.storage, refreshed?.profilePhotoObjectKey),
    };
  }

  private readResumeFiles(details: Record<string, unknown>): CandidateResumeFile[] {
    const parsedArray = CandidateResumeFilesSchema.safeParse(details.resumeFiles);
    if (parsedArray.success && parsedArray.data.length > 0) {
      return parsedArray.data.slice(0, CANDIDATE_RESUME_FILES_MAX);
    }
    const single = CandidateResumeFileSchema.safeParse(details.resumeFile);
    if (single.success) {
      return [single.data];
    }
    if (Array.isArray(details.resumeFiles) && details.resumeFiles.length > 0) {
      const first = CandidateResumeFileSchema.safeParse(details.resumeFiles[0]);
      if (first.success) {
        return [first.data];
      }
    }
    return [];
  }

  async getResumeState(userId: string): Promise<CandidateResumeStateResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'STUDENT') {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Only students have resume files.',
        statusCode: 403,
      });
    }

    const details =
      user.onboardingDetails && typeof user.onboardingDetails === 'object'
        ? (user.onboardingDetails as Record<string, unknown>)
        : {};
    const resumeFiles = this.readResumeFiles(details);
    return { resumeFile: resumeFiles[0] ?? null, resumeFiles };
  }

  async uploadResume(
    userId: string,
    file: { buffer: Buffer; fileName: string; mimeType: string },
  ): Promise<UploadResumeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'STUDENT') {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Only students may upload a resume.',
        statusCode: 403,
      });
    }

    const existing =
      user.onboardingDetails && typeof user.onboardingDetails === 'object'
        ? (user.onboardingDetails as Record<string, unknown>)
        : {};
    const currentFiles = this.readResumeFiles(existing);
    if (currentFiles.length > 0) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: RESUME_VALIDATION_MESSAGES.REMOVE_EXISTING_FIRST,
        statusCode: 400,
      });
    }

    const extOk = /\.pdf$/i.test(file.fileName);
    if (!extOk) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: RESUME_VALIDATION_MESSAGES.ONLY_PDF_ALLOWED,
        statusCode: 400,
      });
    }
    if (file.buffer.byteLength > MAX_RESUME_BYTES) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: RESUME_VALIDATION_MESSAGES.MAX_SIZE_EXCEEDED,
        statusCode: 400,
      });
    }

    const pdfValidation = validateAndExtractPdfResume(file.buffer);
    if (!pdfValidation.valid) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: pdfValidation.error ?? RESUME_VALIDATION_MESSAGES.CORRUPTED_OR_UNREADABLE,
        statusCode: 400,
      });
    }

    // Semantic resume validation.
    //
    // Layer A — Fast heuristic pre-filter (no AI call, no network).
    //   The heuristic only REJECTS when there is strong positive evidence
    //   that the document is a non-resume (certificate, invoice, etc.) AND
    //   virtually no positive resume signals.  It never rejects a document
    //   merely because some expected section is missing.
    //
    // Layer B — AI classification via ResumeParseService (resume-parse@1).
    //   Called only when the fast filter did not already reject.
    //   CRITICAL: provider/infrastructure failure MUST NOT produce
    //   RESUME_VALIDATION_MESSAGES.NOT_A_RESUME — those are different
    //   conditions.  An infrastructure failure returns a 422 so the UI can
    //   say "couldn't validate right now, please try again."
    const extractedText = pdfValidation.extractedText ?? '';

    // Safe development logging for PDF extraction and classification
    if (env.NODE_ENV !== 'production') {
      const detectedSignals = [
        'experience',
        'education',
        'skills',
        'projects',
        'summary',
        'certifications',
        'languages',
        'contact',
      ].filter((section) => new RegExp(`\\b${section}\\b`, 'i').test(extractedText));

      this.logger?.log(
        `[ResumeUpload Diagnostic] file="${file.fileName}" mime="${file.mimeType}" sizeBytes=${file.buffer.byteLength} textLen=${extractedText.length} preview="${extractedText.slice(0, 500).replace(/\s+/g, ' ')}" detectedSignals=[${detectedSignals.join(', ')}]`,
      );
    }

    // Layer A: keyword heuristic only rejects on strong non-resume evidence.
    const heuristicResult = validateResumeDocumentText(extractedText);
    if (!heuristicResult.isValid) {
      if (env.NODE_ENV !== 'production') {
        this.logger?.warn(
          `[ResumeUpload Diagnostic] Rejected at Layer A (heuristic): ${heuristicResult.error}`,
        );
      }
      throw new BadRequestException({
        error: 'validation_failed',
        message: heuristicResult.error ?? RESUME_VALIDATION_MESSAGES.NOT_A_RESUME,
        statusCode: 400,
      });
    }

    // Layer B: AI classification (optional — only if service is wired up).
    if (this.resumeParse && extractedText.trim().length >= 40) {
      let parseResult: Awaited<ReturnType<typeof this.resumeParse.parse>>;
      try {
        parseResult = await this.resumeParse.parse({ rawText: extractedText });
      } catch {
        // Provider/infrastructure error — cannot complete semantic validation.
        // Do NOT convert this into NOT_A_RESUME; surface as a service error
        // so the UI can show "couldn't validate right now, please try again."
        throw new ServiceUnavailableException({
          error: 'validation_service_unavailable',
          message: "We couldn't validate this resume right now. Please try again in a few moments.",
          statusCode: 503,
        });
      }

      if (parseResult.status === 'PARSED' && parseResult.draft) {
        const draft = parseResult.draft;
        // Only reject when AI has a valid parse result AND finds no resume
        // structure at all AND has very low confidence.  A partial result
        // (some sections missing) is NOT a rejection — real resumes can omit
        // any section.
        const hasCoreResumeSections =
          draft.education.length > 0 ||
          draft.experiences.length > 0 ||
          draft.skills.length > 0 ||
          Boolean(draft.basicInfo?.firstName) ||
          Boolean(draft.basicInfo?.summary);
        if (!hasCoreResumeSections && draft.parseConfidence < 0.25) {
          throw new BadRequestException({
            error: 'validation_failed',
            message: RESUME_VALIDATION_MESSAGES.NOT_A_RESUME,
            statusCode: 400,
          });
        }
      }
      // parseResult.status === 'FAILED' means the AI gateway failed closed
      // (schema error, timeout, etc.) — this is NOT evidence that the file
      // is not a resume.  Continue to save the file.
    }

    // Upload object to storage
    let objectKey: string;
    try {
      objectKey = await this.storage.upload({
        buffer: file.buffer,
        namespace: `resumes/${userId}`,
        fileName: file.fileName,
        contentType: 'application/pdf',
      });
    } catch (storageError) {
      if (storageError instanceof HttpException) throw storageError;
      throw new ServiceUnavailableException({
        error: 'storage_unavailable',
        message:
          'Resume storage is unavailable. Check that object storage (MinIO) is running, then try again.',
        statusCode: 503,
      });
    }

    const resumeFile = CandidateResumeFileSchema.parse({
      fileName: file.fileName,
      objectKey,
      mimeType: 'application/pdf',
      fileSizeBytes: file.buffer.byteLength,
      uploadedAt: new Date().toISOString(),
      lastParsedAt: null,
    });

    const resumeFiles = [resumeFile];
    const merged = this.mergeProgressiveProfileDetails(existing, {
      resumeFile,
      resumeFiles,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingDetails: merged as Prisma.InputJsonValue },
    });

    return { resumeFile, resumeFiles };
  }

  async deleteResume(userId: string, body: unknown): Promise<DeleteResumeResponse> {
    const { objectKey } = DeleteResumeRequestSchema.parse(body);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'STUDENT') {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Only students may manage resume files.',
        statusCode: 403,
      });
    }

    const existing =
      user.onboardingDetails && typeof user.onboardingDetails === 'object'
        ? (user.onboardingDetails as Record<string, unknown>)
        : {};
    const currentFiles = this.readResumeFiles(existing);
    const resumeFiles = currentFiles.filter((file) => file.objectKey !== objectKey);
    if (resumeFiles.length === currentFiles.length) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'Resume file not found.',
        statusCode: 404,
      });
    }

    const merged = this.mergeProgressiveProfileDetails(existing, {
      resumeFiles,
      resumeFile: resumeFiles[0] ?? null,
    });
    if (!resumeFiles[0]) {
      delete merged.resumeFile;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingDetails: merged as Prisma.InputJsonValue },
    });

    try {
      await this.storage.deleteObject(objectKey);
    } catch {
      // Non-blocking
    }

    return { resumeFiles };
  }

  private mergeProgressiveProfileDetails(
    existing: Record<string, unknown>,
    patch: Record<string, unknown>,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...existing, ...patch };

    if (patch.jobPreferences && typeof patch.jobPreferences === 'object') {
      const current =
        existing.jobPreferences && typeof existing.jobPreferences === 'object'
          ? (existing.jobPreferences as Record<string, unknown>)
          : {};
      merged.jobPreferences = {
        ...current,
        ...(patch.jobPreferences as Record<string, unknown>),
      };
    }

    if (patch.academicScores && typeof patch.academicScores === 'object') {
      const current =
        existing.academicScores && typeof existing.academicScores === 'object'
          ? (existing.academicScores as Record<string, unknown>)
          : {};
      merged.academicScores = {
        ...current,
        ...(patch.academicScores as Record<string, unknown>),
      };
    }

    if (patch.academicProgram && typeof patch.academicProgram === 'object') {
      const current =
        existing.academicProgram && typeof existing.academicProgram === 'object'
          ? (existing.academicProgram as Record<string, unknown>)
          : {};
      merged.academicProgram = {
        ...current,
        ...(patch.academicProgram as Record<string, unknown>),
      };
    }

    if (patch.socialVerification && typeof patch.socialVerification === 'object') {
      const current =
        existing.socialVerification && typeof existing.socialVerification === 'object'
          ? (existing.socialVerification as Record<string, unknown>)
          : {};
      merged.socialVerification = {
        ...current,
        ...(patch.socialVerification as Record<string, unknown>),
      };
    }

    return merged;
  }

  /**
   * Persists the LinkedIn OIDC verification result from the OAuth callback.
   * A nested merge (unlike `saveOnboardingDraft`'s top-level spread) so it
   * never clobbers the rest of the in-progress draft — the callback runs
   * outside the wizard's normal save cycle, on a bare redirect with no form
   * state of its own to send back.
   */
  async mergeLinkedinVerification(
    userId: string,
    verification: LinkedinVerification,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const existing =
      user.onboardingDetails && typeof user.onboardingDetails === 'object'
        ? (user.onboardingDetails as Record<string, unknown>)
        : {};
    const existingSocial =
      existing.socialVerification && typeof existing.socialVerification === 'object'
        ? (existing.socialVerification as Record<string, unknown>)
        : {};

    const merged = {
      ...existing,
      socialVerification: {
        ...existingSocial,
        linkedin: verification,
      },
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingDetails: merged as Prisma.InputJsonValue },
    });
  }

  /**
   * Th6-600 — technical skills must be real entries of the 10-track skill catalog. The schema
   * already rejects free text and self-ratings; this rejects codes that are well-formed but unknown.
   */
  private async assertCatalogSkills(
    skills: ReadonlyArray<{ type: 'technical' | 'language'; code?: string }>,
  ): Promise<void> {
    const codes = [
      ...new Set(
        skills.flatMap((skill) => (skill.type === 'technical' && skill.code ? [skill.code] : [])),
      ),
    ];
    if (codes.length === 0) return;
    const known = await this.prisma.skill.findMany({
      where: { code: { in: codes } },
      select: { code: true },
    });
    const knownCodes = new Set(known.map((row) => row.code));
    const unknown = codes.filter((code) => !knownCodes.has(code));
    if (unknown.length > 0) {
      throw new BadRequestException({
        error: 'validation_error',
        message: 'Choose skills from the SMART skill catalog.',
        statusCode: 400,
        details: { unknownSkillCodes: unknown },
      });
    }
  }

  async completeOnboarding(userId: string, body: unknown): Promise<AuthenticatedUser> {
    const parsed = CompleteCandidateOnboardingRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'validation_error',
        message: 'Onboarding payload is invalid.',
        statusCode: 400,
        details: parsed.error.flatten(),
      });
    }

    const request: CompleteCandidateOnboardingRequest = parsed.data;
    await this.assertCatalogSkills(request.skills);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'STUDENT') {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Only students may complete candidate onboarding.',
        statusCode: 403,
      });
    }

    const now = new Date();
    const isFirstConsent = !user.dpdpConsentAt;
    // Preserve the original consent timestamp on a retry — completing onboarding twice
    // must not look like a brand-new consent event.
    const consentTimestamp = user.dpdpConsentAt ?? now;
    const details = {
      ...request,
      dpdpConsentAt: consentTimestamp.toISOString(),
      completedAt: now.toISOString(),
      consentVersion: CURRENT_CONSENT_VERSION,
    };

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: `${request.firstName} ${request.lastName}`.trim(),
        onboardingCompleted: true,
        onboardingDetails: details as Prisma.InputJsonValue,
        dpdpConsentAt: consentTimestamp,
        cgpa: request.academicScores?.cgpa ?? undefined,
        sscPercentage: request.academicScores?.sscPercentage ?? undefined,
        hscPercentage: request.academicScores?.hscPercentage ?? undefined,
        hasActiveBacklog: request.academicScores?.hasActiveBacklog ?? undefined,
        graduationYear: request.academicProgram?.graduationYear ?? undefined,
      },
      include: { institution: true, company: true, primaryTrack: true, secondaryTrack: true },
    });

    if (request.academicProgram) {
      await this.auditPublisher.record({
        actorId: userId,
        action: 'student.academic_program_updated',
        resourceType: 'user',
        resourceId: userId,
        reasonCode: null,
        metadata: { source: 'complete', previous: null, next: request.academicProgram },
      });
    }

    if (isFirstConsent) {
      // Guarded on isFirstConsent so retrying/re-submitting onboarding completion
      // (same request replayed after a network failure) never records a second
      // consent-acceptance audit event for the same acceptance.
      await this.auditPublisher.record({
        actorId: userId,
        action: 'student.consent_accepted',
        resourceType: 'user',
        resourceId: userId,
        reasonCode: null,
        metadata: {
          source: 'onboarding_complete',
          consentVersion: CURRENT_CONSENT_VERSION,
          previous: null,
          next: { dpdpConsent: true, acceptedAt: consentTimestamp.toISOString() },
        },
      });
    }

    const selectedSkillNames = request.skillDiscovery?.selectedSkillNames ?? [];
    // Only the languages the candidate actually kept checked count toward
    // skill derivation — a deselected suggestion (e.g. they unchecked "CSS")
    // must not still influence what gets auto-declared downstream.
    const languages = (request.skillDiscovery?.suggestedFromGithub ?? []).filter((entry) =>
      selectedSkillNames.includes(entry.language),
    );
    if (selectedSkillNames.length > 0) {
      // Fire-and-forget via the outbox: skill-catalog matching is a
      // downstream concern (owned by `assessment`) and must never make
      // onboarding completion wait on it or fail because of it.
      await this.outbox
        .enqueueEnvelope({
          topic: SMART_TOPICS.candidateSkillsDiscovered,
          partitionKey: userId,
          eventType: SMART_TOPICS.candidateSkillsDiscovered,
          source: 'users',
          data: { userId, languages, selectedSkillNames },
        })
        .catch(() => {
          /* best-effort — outbox row is durable even if this call throws */
        });
    }

    return toAuthenticatedUserWithPhoto(this.storage, updated);
  }

  async enrollTrack(userId: string, body: EnrollTrackRequest): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'STUDENT') {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Only students may enroll on tracks.',
        statusCode: 403,
      });
    }

    const track = await this.prisma.track.findUnique({ where: { code: body.trackCode } });
    if (!track) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'Track not found.',
        statusCode: 404,
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data:
        body.slot === 'SECONDARY' ? { secondaryTrackId: track.id } : { primaryTrackId: track.id },
      include: { institution: true, company: true, primaryTrack: true, secondaryTrack: true },
    });

    return toAuthenticatedUserWithPhoto(this.storage, updated);
  }

  async changePassword(userId: string, body: ChangePasswordRequest): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'User not found.',
        statusCode: 404,
      });
    }
    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException({
        error: 'unauthorized',
        message: 'Email or password is incorrect.',
        statusCode: 401,
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(body.newPassword) },
    });
    await this.auth.revokeAllForUser(userId);
  }
}
