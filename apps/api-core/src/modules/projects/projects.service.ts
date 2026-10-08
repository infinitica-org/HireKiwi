import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  CreateProjectRequestSchema,
  EvidenceFileConfirmSchema,
  ProjectSubmittedDataSchema,
  ReplaceProjectRequestSchema,
  HIREKIWI_TOPICS,
  UuidSchema,
  type ListMyProjectsResponse,
  type ProjectDocumentDto,
  type ProjectDto,
  type ReplaceProjectResponse,
} from '@hirekiwi/contracts';
import { AuditPublisherService } from '../../platform/audit/audit-publisher.service.js';
import { KafkaOutboxService } from '../../platform/kafka/kafka-outbox.service.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import {
  createEvidenceUploadUrl,
  isEvidenceObjectKey,
  verifyUploadedEvidence,
} from '../../platform/storage/evidence-file.js';
import { StorageService } from '../../platform/storage/storage.service.js';

/** Th6-600 — every project evidence object lives under this storage prefix. */
export const PROJECT_EVIDENCE_NAMESPACE = 'project-evidence';
import { ProjectInterviewGateService } from '../evaluation/project-interview-gate.service.js';
import { ProjectVerifyRunnerService } from '../evaluation/project-verify-runner.service.js';
import { toProjectDto, type ProjectRow } from '../evaluation/project-verify.mapper.js';

@Injectable()
export class ProjectsService {
  readonly owner = 'Vishal V';
  readonly purpose = 'CN-T08 project create + SE-T03 queue via hirekiwi.project.submitted.';
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(KafkaOutboxService) private readonly outbox: KafkaOutboxService,
    @Inject(ProjectVerifyRunnerService) private readonly verifyRunner: ProjectVerifyRunnerService,
    @Inject(ProjectInterviewGateService)
    private readonly interviewGate: ProjectInterviewGateService,
    @Inject(AuditPublisherService) private readonly auditPublisher: AuditPublisherService,
    @Optional() @Inject(StorageService) private readonly storage?: StorageService,
  ) {}

  /* ------------------------- Th6-600 — project evidence files ------------------------- */

  private requireStorage(): StorageService {
    if (!this.storage) {
      throw new BadRequestException({
        error: 'storage_unavailable',
        message: 'Evidence upload is unavailable.',
        statusCode: 400,
      });
    }
    return this.storage;
  }

  private evidenceNamespace(studentId: string, projectId: string): string {
    return `${PROJECT_EVIDENCE_NAMESPACE}/${studentId}/${projectId}`;
  }

  private async assertOwnedProject(studentId: string, projectId: string): Promise<string> {
    const id = UuidSchema.parse(projectId);
    const row = await this.prisma.project.findUnique({
      where: { id },
      select: { studentId: true },
    });
    if (!row) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'Project not found.',
        statusCode: 404,
      });
    }
    if (row.studentId !== studentId) {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'You can only change your own projects.',
        statusCode: 403,
      });
    }
    return id;
  }

  /** Presigned PUT (15 min) for one PDF/PNG evidence file, max 10 MB. */
  async createDocumentUploadUrl(studentId: string, projectId: string, body: unknown) {
    const id = await this.assertOwnedProject(studentId, projectId);
    return createEvidenceUploadUrl(
      this.requireStorage(),
      this.evidenceNamespace(studentId, id),
      body,
    );
  }

  /** Verifies the uploaded object (size, magic bytes, extension, type, virus scan) and attaches it. */
  async attachDocument(
    studentId: string,
    projectId: string,
    body: unknown,
  ): Promise<ProjectDocumentDto> {
    const id = await this.assertOwnedProject(studentId, projectId);
    const parsed = EvidenceFileConfirmSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'validation_error',
        message: parsed.error.issues[0]?.message ?? 'Invalid evidence file.',
        statusCode: 400,
        details: parsed.error.flatten(),
      });
    }
    const storage = this.requireStorage();
    await verifyUploadedEvidence(storage, this.evidenceNamespace(studentId, id), parsed.data);
    const doc = await this.prisma.projectDocument.create({
      data: {
        projectId: id,
        fileUrl: parsed.data.objectKey,
        fileName: parsed.data.fileName,
        fileSizeBytes: parsed.data.fileSizeBytes,
        mimeType: parsed.data.mimeType,
      },
    });
    await this.auditPublisher.record({
      actorId: studentId,
      action: 'project.document_attached',
      resourceType: 'project',
      resourceId: id,
      reasonCode: null,
      metadata: { documentId: doc.id },
    });
    return this.toDocumentDto(doc);
  }

  async removeDocument(studentId: string, projectId: string, documentId: string): Promise<void> {
    const id = await this.assertOwnedProject(studentId, projectId);
    const doc = await this.prisma.projectDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.projectId !== id) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'Project document not found.',
        statusCode: 404,
      });
    }
    await this.prisma.projectDocument.delete({ where: { id: documentId } });
    if (this.storage) await this.storage.deleteObject(doc.fileUrl).catch(() => undefined);
    await this.auditPublisher.record({
      actorId: studentId,
      action: 'project.document_removed',
      resourceType: 'project',
      resourceId: id,
      reasonCode: null,
      metadata: { documentId },
    });
  }

  private async toDocumentDto(doc: {
    id: string;
    projectId: string;
    fileUrl: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    createdAt: Date;
  }): Promise<ProjectDocumentDto> {
    const fileUrl =
      this.storage && isEvidenceObjectKey(doc.fileUrl, [PROJECT_EVIDENCE_NAMESPACE])
        ? await this.storage.getSignedDownloadUrl(doc.fileUrl)
        : doc.fileUrl;
    return {
      id: doc.id,
      projectId: doc.projectId,
      fileUrl,
      fileName: doc.fileName,
      fileSizeBytes: doc.fileSizeBytes,
      mimeType: doc.mimeType,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  async create(studentId: string, body: unknown): Promise<ProjectDto> {
    const request = CreateProjectRequestSchema.parse(body);
    const githubUrl = request.githubUrl ?? request.githubRepos[0]?.htmlUrl ?? null;

    const row = await this.prisma.project.create({
      data: {
        studentId,
        title: request.title,
        problem: request.problem,
        approach: request.approach,
        stack: request.stack,
        outcome: request.outcome,
        loomUrl: request.loomUrl ?? null,
        githubUrl,
        liveUrl: request.liveUrl ?? null,
        status: 'SUBMITTED',
      },
    });

    await this.outbox.enqueueEnvelope({
      topic: HIREKIWI_TOPICS.projectSubmitted,
      partitionKey: row.id,
      eventType: HIREKIWI_TOPICS.projectSubmitted,
      source: 'platform',
      data: ProjectSubmittedDataSchema.parse({ projectId: row.id, studentId }),
    });

    // Immediately mark project as interview-eligible upon submission
    await this.interviewGate.markVerifyComplete(row.id);

    // Sync fallback when Kafka consumer is not running (local dev).
    await this.verifyRunner.runForProject(row.id, studentId);

    this.logger.log(`Project ${row.id} queued on ${HIREKIWI_TOPICS.projectSubmitted}`);
    const refreshed = await this.loadRow(row.id);
    return this.toDtoWithInterview(refreshed ?? { ...row, isActive: true, report: null });
  }

  async listMine(studentId: string): Promise<ListMyProjectsResponse> {
    const rows = await this.prisma.project.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: { report: true },
    });
    const projects = await Promise.all(rows.map((row) => this.toDtoWithInterview(row)));
    return { projects };
  }

  async getForStudent(studentId: string, projectId: string): Promise<ProjectDto> {
    const id = UuidSchema.parse(projectId);
    const row = await this.loadRow(id);
    if (!row) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'Project not found.',
        statusCode: 404,
      });
    }
    if (row.studentId !== studentId) {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'You can only view your own projects.',
        statusCode: 403,
      });
    }
    if (!row.report && row.status === 'SUBMITTED') {
      await this.verifyRunner.runForProject(row.id, studentId);
      const refreshed = await this.loadRow(id);
      if (refreshed) return this.toDtoWithInterview(refreshed);
    }
    return this.toDtoWithInterview(row);
  }

  /**
   * Deletes an owned project and all its associated data (skill mappings, interview records).
   * Only active projects can be deleted; once deleted, a project cannot be recovered.
   */
  async delete(studentId: string, projectId: string): Promise<void> {
    const id = UuidSchema.parse(projectId);
    const row = await this.loadRow(id);

    if (!row) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'Project not found.',
        statusCode: 404,
      });
    }

    if (row.studentId !== studentId) {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'You can only delete your own projects.',
        statusCode: 403,
      });
    }

    // Delete project skill mappings (cascade)
    await this.prisma.projectSkillMapping.deleteMany({
      where: { projectId: id },
    });

    // Delete the project itself (interview state is stored in Redis and will expire on its own)
    await this.prisma.project.delete({
      where: { id },
    });

    await this.auditPublisher.record({
      actorId: studentId,
      action: 'project.deleted',
      resourceType: 'Project',
      resourceId: id,
      reasonCode: null,
      metadata: {
        studentId,
        deletedProjectId: id,
      },
    });

    this.logger.log(`Project ${id} deleted by student ${studentId}`);
  }

  /**
   * Marks the owned project inactive and keeps the replacement as the current portfolio project.
   * Verification status and historical rows are preserved.
   */
  async replace(
    studentId: string,
    projectId: string,
    body: unknown,
  ): Promise<ReplaceProjectResponse> {
    const request = ReplaceProjectRequestSchema.parse(body);
    const oldId = UuidSchema.parse(projectId);
    const replacementId = request.replacementProjectId;

    if (oldId === replacementId) {
      throw new BadRequestException({
        error: 'invalid_replacement',
        message: 'A project cannot be replaced with itself.',
        statusCode: 400,
      });
    }

    const [oldRow, replacementRow] = await Promise.all([
      this.loadRow(oldId),
      this.loadRow(replacementId),
    ]);

    if (!oldRow) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'Project not found.',
        statusCode: 404,
      });
    }
    if (oldRow.studentId !== studentId) {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'You can only replace your own projects.',
        statusCode: 403,
      });
    }
    if (!replacementRow) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'Replacement project not found.',
        statusCode: 404,
      });
    }
    if (replacementRow.studentId !== studentId) {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'The replacement project must belong to you.',
        statusCode: 403,
      });
    }

    if (!oldRow.isActive) {
      if (replacementRow.isActive) {
        return {
          replacedProject: await this.toDtoWithInterview(oldRow),
          replacementProject: await this.toDtoWithInterview(replacementRow),
        };
      }
      throw new ConflictException({
        error: 'project_inactive',
        message: 'This project is already inactive and cannot be replaced again.',
        statusCode: 409,
      });
    }

    const [updatedOld, updatedReplacement] = await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: oldId },
        data: { isActive: false },
        include: { report: true },
      }),
      this.prisma.project.update({
        where: { id: replacementId },
        data: { isActive: true },
        include: { report: true },
      }),
    ]);

    await this.auditPublisher.record({
      actorId: studentId,
      action: 'project.replaced',
      resourceType: 'Project',
      resourceId: oldId,
      reasonCode: null,
      metadata: {
        studentId,
        replacedProjectId: oldId,
        replacementProjectId: replacementId,
        previousIsActive: true,
        newIsActive: false,
      },
    });

    this.logger.log(`Project ${oldId} replaced with ${replacementId} for student ${studentId}`);

    return {
      replacedProject: await this.toDtoWithInterview(updatedOld),
      replacementProject: await this.toDtoWithInterview(updatedReplacement),
    };
  }

  private async loadRow(id: string): Promise<ProjectRow | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: { report: true },
    });
  }

  private async toDtoWithInterview(row: ProjectRow): Promise<ProjectDto> {
    const interview = await this.interviewGate.getState(row.id);
    const docs = await this.prisma.projectDocument.findMany({
      where: { projectId: row.id },
      orderBy: { createdAt: 'desc' },
    });
    const documents = await Promise.all(docs.map((doc) => this.toDocumentDto(doc)));
    return { ...toProjectDto(row, interview), documents };
  }
}
