import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  EmployerJobDtoSchema,
  type CreateEmployerJobRequest,
  type DuplicateEmployerJobRequest,
  type EmployerJobDto,
  type EmployerJobVisibility,
  type ListEmployerJobsQuery,
  type ListEmployerJobsResponse,
  type SkillProficiency,
  type SkillRequirement,
  type UpdateEmployerJobRequest,
} from '@hirekiwi/contracts';
import type { Queue } from 'bullmq';
import type { Prisma } from '../../generated/prisma/index.js';
import { AuditPublisherService } from '../../platform/audit/audit-publisher.service.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { JD_PARSE_QUEUE } from '../../platform/queue/queue.names.js';
import { StorageService } from '../../platform/storage/storage.service.js';
import { BillingService } from '../billing/billing.service.js';
import { requireCompanyActor } from '../company-profile/company-access.js';
import {
  acceptingOpeningWhere,
  isCompanyVerified,
  utcToday,
} from '../student-jobs/job-eligibility.js';
import {
  isoDateToCalendarDate,
  normalizeOpeningRow,
  toJobOpeningDto,
  type OpeningRow,
} from './job-opening.mapper.js';

const JOB_INCLUDE = {
  requiredSkills: { include: { skill: { select: { code: true } } } },
  _count: { select: { applications: true } },
} as const;

type JobRow = OpeningRow & {
  companyId: string | null;
  workMode: string | null;
  details: Prisma.JsonValue | null;
  internal: Prisma.JsonValue | null;
  _count: { applications: number };
};

type EmployerJobFields = Omit<CreateEmployerJobRequest, 'institutionId'>;

function notFound(): NotFoundException {
  // Another company's job is indistinguishable from a missing one.
  return new NotFoundException({ error: 'not_found', message: 'Job not found.', statusCode: 404 });
}

function conflict(message: string): ConflictException {
  return new ConflictException({ error: 'invalid_job_state', message, statusCode: 409 });
}

/** Body fields → JobOpening columns. Only keys present in the body are written (PATCH-safe). */
function jobColumns(body: Partial<EmployerJobFields>): Prisma.JobOpeningUncheckedUpdateInput {
  const data: Prisma.JobOpeningUncheckedUpdateInput = {};
  if (body.roleTitle !== undefined) data.roleTitle = body.roleTitle;
  if (body.domain !== undefined) data.domainCode = body.domain;
  if (body.categoryId !== undefined) data.categoryCode = body.categoryId;
  if (body.minYearsExperience !== undefined) data.minYearsExperience = body.minYearsExperience;
  if (body.maxYearsExperience !== undefined) data.maxYearsExperience = body.maxYearsExperience;
  if (body.location !== undefined) data.location = body.location;
  if (body.employmentType !== undefined) data.employmentType = body.employmentType;
  if (body.workMode !== undefined) data.workMode = body.workMode;
  if (body.headcount !== undefined) data.headcount = body.headcount;
  if (body.attachedDocuments !== undefined) {
    data.attachedDocuments = body.attachedDocuments as Prisma.InputJsonValue;
  }
  if (body.roleDetails !== undefined) data.roleDetails = body.roleDetails;
  if (body.salaryDetails !== undefined) data.salaryDetails = body.salaryDetails;
  if (body.roundDetails !== undefined) data.roundDetails = body.roundDetails;
  if (body.hiringDetails !== undefined) data.hiringDetails = body.hiringDetails;
  if (body.lastDateToApply !== undefined) {
    data.lastDateToApply = isoDateToCalendarDate(body.lastDateToApply);
  }
  if (body.minSscPercentage !== undefined) data.minSscPercentage = body.minSscPercentage;
  if (body.minHscPercentage !== undefined) data.minHscPercentage = body.minHscPercentage;
  if (body.minCollegePercentage !== undefined) {
    data.minCollegePercentage = body.minCollegePercentage;
  }
  if (body.backlogsAllowed !== undefined) data.backlogsAllowed = body.backlogsAllowed;
  if (body.rawText !== undefined) data.rawText = body.rawText.trim() || null;
  if (body.details !== undefined) data.details = body.details as Prisma.InputJsonValue;
  if (body.internal !== undefined) data.internal = body.internal as Prisma.InputJsonValue;
  return data;
}

/**
 * JOB-01 employer job management. Every route resolves the caller's company from the database
 * (`requireCompanyActor`), so a job is only ever read or changed by its own company. Jobs start as
 * DRAFT; publishing checks company verification (EMP-01.08), campus access (UNI-05) and the
 * ACTIVE_JOBS entitlement (BIL-01.08).
 */
@Injectable()
export class EmployerJobsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditPublisherService) private readonly audit: AuditPublisherService,
    @Inject(BillingService) private readonly billing: BillingService,
    @InjectQueue(JD_PARSE_QUEUE) private readonly jdParseQueue: Queue<{ openingId: string }>,
    @Optional() @Inject(StorageService) private readonly storage?: StorageService,
  ) {}

  async list(userId: string, query: ListEmployerJobsQuery): Promise<ListEmployerJobsResponse> {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.jobs.view');
    const rows = await this.prisma.jobOpening.findMany({
      where: { companyId: actor.companyId, ...(query.status ? { status: query.status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: JOB_INCLUDE,
    });
    return { jobs: await Promise.all(rows.map((row) => this.toDto(row))) };
  }

  async get(userId: string, jobId: string): Promise<EmployerJobDto> {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.jobs.view');
    return this.toDto(await this.requireJob(actor.companyId, jobId));
  }

  async create(userId: string, body: CreateEmployerJobRequest): Promise<EmployerJobDto> {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.jobs.manage');
    const { institutionId: requestedInstitutionId, requiredSkills, ...fields } = body;
    const institutionId = requestedInstitutionId ?? (await this.defaultInstitutionId());
    const job = await this.insertJob(
      actor.companyId,
      userId,
      institutionId,
      fields,
      requiredSkills,
    );
    await this.record(userId, 'employer_job.created', job.id, { institutionId });
    return this.toDto(job);
  }

  /**
   * Is this job live for students? The verdict comes from the same query the student job list uses
   * (acceptingOpeningWhere), so it can never disagree with what students actually see; the checks
   * explain why.
   */
  async visibility(userId: string, jobId: string): Promise<EmployerJobVisibility> {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.jobs.view');
    const job = await this.requireJob(actor.companyId, jobId);
    const company = await this.prisma.company.findUnique({
      where: { id: actor.companyId },
      select: { verificationStatus: true, deactivatedAt: true, heldAt: true },
    });
    const today = utcToday();
    const live = await this.prisma.jobOpening.count({
      where: { id: job.id, ...acceptingOpeningWhere(job.institutionId, today) },
    });

    const deadline = job.lastDateToApply;
    const deadlinePassed = deadline !== null && deadline < today;
    const published = job.status === 'OPEN';
    const verified = isCompanyVerified(company);

    return {
      jobId: job.id,
      visible: live > 0,
      checks: [
        {
          id: 'published',
          label: 'The job is published',
          ok: published,
          message: published
            ? null
            : job.status === 'CLOSED'
              ? 'This job is closed, so students no longer see it.'
              : 'This job is still a draft or on hold. Publish it to show it to students.',
        },
        {
          id: 'company_verified',
          label: 'Your company is verified',
          ok: verified,
          message: verified
            ? null
            : 'Your company is not verified yet. Students only see jobs from verified companies.',
        },
        {
          id: 'deadline_open',
          label: 'The application deadline has not passed',
          ok: !deadlinePassed,
          message: deadlinePassed
            ? `The deadline (${deadline.toISOString().slice(0, 10)}) has passed. Extend it to show the job again.`
            : null,
        },
        {
          id: 'all_students',
          label: 'Open to students of every university',
          ok: true,
          message: null,
        },
      ],
    };
  }

  /**
   * Company jobs are visible to every student, but a row must still belong to one institution.
   * Use the oldest active, approved one so the company never has to choose a university.
   */
  private async defaultInstitutionId(): Promise<string> {
    const home = await this.prisma.institution.findFirst({
      where: { verificationStatus: 'APPROVED', deactivatedAt: null, heldAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!home) {
      throw new UnprocessableEntityException({
        error: 'no_institution_available',
        message: 'There is no active university on the platform yet, so jobs cannot be posted.',
        statusCode: 422,
      });
    }
    return home.id;
  }

  async update(
    userId: string,
    jobId: string,
    body: UpdateEmployerJobRequest,
  ): Promise<EmployerJobDto> {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.jobs.manage');
    const job = await this.requireJob(actor.companyId, jobId);
    if (job.status === 'CLOSED') throw conflict('A closed job cannot be edited.');
    const { requiredSkills, ...fields } = body;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (requiredSkills) {
        const requirements = await this.resolveSkills(tx, requiredSkills);
        await tx.jobOpeningSkill.deleteMany({ where: { openingId: jobId } });
        await tx.jobOpeningSkill.createMany({
          data: requirements.map((requirement) => ({ openingId: jobId, ...requirement })),
        });
      }
      return tx.jobOpening.update({
        where: { id: jobId },
        data: {
          ...jobColumns(fields),
          ...(fields.rawText ? { jdParseStatus: 'PENDING' } : {}),
          // On hold means students stop seeing it: an open job goes back to draft until republished.
          ...(fields.details?.onHold === true && job.status === 'OPEN'
            ? { status: 'DRAFT' as const }
            : {}),
        },
        include: JOB_INCLUDE,
      });
    });
    if (fields.rawText?.trim())
      await this.jdParseQueue.add('parse-opening-jd', { openingId: jobId });
    await this.record(userId, 'employer_job.updated', jobId, { fields: Object.keys(body) });
    return this.toDto(updated);
  }

  async remove(userId: string, jobId: string): Promise<void> {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.jobs.manage');
    const job = await this.requireJob(actor.companyId, jobId);
    if (job.status !== 'DRAFT' || job._count.applications > 0) {
      throw conflict('Only a draft job with no applications can be deleted. Close it instead.');
    }
    await this.prisma.jobOpening.delete({ where: { id: jobId } });
    await this.record(userId, 'employer_job.deleted', jobId);
  }

  async publish(userId: string, jobId: string): Promise<EmployerJobDto> {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.jobs.manage');
    const job = await this.requireJob(actor.companyId, jobId);
    if (job.status !== 'DRAFT') throw conflict('Only a draft job can be published.');

    const company = await this.prisma.company.findUnique({
      where: { id: actor.companyId },
      select: { verificationStatus: true, deactivatedAt: true, heldAt: true },
    });
    if (company?.verificationStatus !== 'APPROVED' || company.deactivatedAt || company.heldAt) {
      throw new ForbiddenException({
        error: 'company_not_verified',
        message: 'Your company must be verified before its jobs can reach students.',
        statusCode: 403,
      });
    }
    await this.billing.assertQuotaAvailable(actor.companyId, 'ACTIVE_JOBS');

    const updated = await this.prisma.jobOpening.update({
      where: { id: jobId },
      data: { status: 'OPEN' },
      include: JOB_INCLUDE,
    });
    await this.record(userId, 'employer_job.published', jobId, { from: 'DRAFT', to: 'OPEN' });
    return this.toDto(updated);
  }

  async close(userId: string, jobId: string): Promise<EmployerJobDto> {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.jobs.manage');
    const job = await this.requireJob(actor.companyId, jobId);
    if (job.status !== 'OPEN') throw conflict('Only an open job can be closed.');
    const updated = await this.prisma.jobOpening.update({
      where: { id: jobId },
      data: { status: 'CLOSED' },
      include: JOB_INCLUDE,
    });
    await this.record(userId, 'employer_job.closed', jobId, { from: 'OPEN', to: 'CLOSED' });
    return this.toDto(updated);
  }

  async duplicate(
    userId: string,
    jobId: string,
    body: DuplicateEmployerJobRequest,
  ): Promise<EmployerJobDto> {
    const actor = await requireCompanyActor(this.prisma, userId, 'company.jobs.manage');
    const source = await this.requireJob(actor.companyId, jobId);
    const institutionId = body.institutionId ?? source.institutionId;

    const copy = await this.prisma.jobOpening.create({
      data: {
        institutionId,
        companyId: actor.companyId,
        createdById: userId,
        companyName: source.companyName,
        aboutCompany: source.aboutCompany,
        companyLogoUrl: source.companyLogoUrl,
        roleTitle: source.roleTitle,
        domainCode: source.domainCode,
        categoryCode: source.categoryCode,
        minYearsExperience: source.minYearsExperience,
        maxYearsExperience: source.maxYearsExperience,
        location: source.location,
        employmentType: source.employmentType,
        workMode: source.workMode as Prisma.JobOpeningUncheckedCreateInput['workMode'],
        headcount: source.headcount,
        roleDetails: source.roleDetails,
        salaryDetails: source.salaryDetails,
        roundDetails: source.roundDetails,
        hiringDetails: source.hiringDetails,
        minSscPercentage: source.minSscPercentage as Prisma.Decimal | null,
        minHscPercentage: source.minHscPercentage as Prisma.Decimal | null,
        minCollegePercentage: source.minCollegePercentage as Prisma.Decimal | null,
        backlogsAllowed: source.backlogsAllowed,
        rawText: source.rawText ?? null,
        details: source.details === null ? undefined : (source.details as Prisma.InputJsonValue),
        internal: source.internal === null ? undefined : (source.internal as Prisma.InputJsonValue),
        requiredSkills: {
          create: source.requiredSkills.map((requirement) => ({
            minProficiency: requirement.minProficiency as SkillProficiency,
            skill: { connect: { code: requirement.skill.code } },
          })),
        },
      },
      include: JOB_INCLUDE,
    });
    await this.record(userId, 'employer_job.duplicated', copy.id, { sourceJobId: jobId });
    return this.toDto(copy);
  }

  private async insertJob(
    companyId: string,
    userId: string,
    institutionId: string,
    fields: Omit<EmployerJobFields, 'requiredSkills'>,
    requiredSkills: SkillRequirement[],
  ): Promise<JobRow> {
    const identity = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        profile: { select: { displayName: true, about: true, logoFileId: true } },
      },
    });
    const job = await this.prisma.$transaction(async (tx) =>
      tx.jobOpening.create({
        data: {
          ...(jobColumns(fields) as Prisma.JobOpeningUncheckedCreateInput),
          institutionId,
          companyId,
          createdById: userId,
          companyName: identity?.profile?.displayName ?? identity?.name ?? 'Company',
          aboutCompany: identity?.profile?.about ?? null,
          companyLogoUrl: identity?.profile?.logoFileId ?? null,
          requiredSkills: { create: await this.resolveSkills(tx, requiredSkills) },
        },
        include: JOB_INCLUDE,
      }),
    );
    if (fields.rawText?.trim())
      await this.jdParseQueue.add('parse-opening-jd', { openingId: job.id });
    return job;
  }

  private async resolveSkills(
    tx: Prisma.TransactionClient,
    requiredSkills: SkillRequirement[],
  ): Promise<{ skillId: string; minProficiency: SkillProficiency }[]> {
    const skills = await tx.skill.findMany({
      where: { code: { in: requiredSkills.map((requirement) => requirement.skillCode) } },
      select: { id: true, code: true },
    });
    const idByCode = new Map(skills.map((skill) => [skill.code, skill.id]));
    const missing = requiredSkills.filter((requirement) => !idByCode.has(requirement.skillCode));
    if (missing.length > 0) {
      // Same rule as the placement module: never invent taxonomy rows here.
      throw new ServiceUnavailableException({
        error: 'taxonomy_not_seeded',
        message: `INF-05 skills are not seeded in this environment: ${missing
          .map((requirement) => requirement.skillCode)
          .join(', ')}.`,
        statusCode: 503,
      });
    }
    return requiredSkills.map((requirement) => ({
      skillId: idByCode.get(requirement.skillCode) as string,
      minProficiency: requirement.minProficiency,
    }));
  }

  private async requireJob(companyId: string, jobId: string): Promise<JobRow> {
    const job = await this.prisma.jobOpening.findFirst({
      where: { id: jobId, companyId },
      include: JOB_INCLUDE,
    });
    if (!job) throw notFound();
    return job;
  }

  private async toDto(row: JobRow): Promise<EmployerJobDto> {
    const normalized = normalizeOpeningRow(row);
    let companyLogoUrl: string | undefined;
    if (normalized.companyLogoUrl && this.storage) {
      companyLogoUrl = await this.storage
        .getSignedDownloadUrl(normalized.companyLogoUrl)
        .catch(() => undefined);
    }
    return EmployerJobDtoSchema.parse({
      ...toJobOpeningDto(normalized, { companyLogoUrl }),
      companyId: row.companyId,
      workMode: row.workMode,
      details: row.details ?? null,
      internal: row.internal ?? null,
      applicantCount: row._count.applications,
    });
  }

  private async record(
    actorId: string,
    action: string,
    jobId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.audit.record({
      actorId,
      action,
      resourceType: 'job_opening',
      resourceId: jobId,
      reasonCode: null,
      metadata,
    });
  }
}
