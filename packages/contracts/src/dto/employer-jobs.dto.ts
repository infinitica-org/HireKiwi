import { z, UuidSchema } from './common.js';
import { JobOpeningStatusSchema } from '../domain/enums.js';
import { JobOpeningDtoSchema, JobOpeningFieldsSchema } from './placement.dto.js';
import { JobWorkModeSchema } from './student-jobs.dto.js';
import { JobDetailsSchema, JobInternalSchema } from './job-details.dto.js';

/**
 * JOB-01 — employer job management (`/employer/jobs`).
 *
 * Reuses the job-opening field set so a job has one shape everywhere. The company name, about-
 * company copy and logo come from the caller's Company profile on the server, never from the body,
 * and the TPO drive fields (`driveSpoc`, `driveDate`) do not apply to employer-posted jobs.
 *
 * A company job is open to every student. The row still belongs to one home institution in the
 * database, but the company never has to name it: when `institutionId` is omitted the API assigns
 * one. Duplicating a job may still pass a different `institutionId` (JOB-01.09).
 */
const EmployerJobFieldsSchema = JobOpeningFieldsSchema.omit({
  companyName: true,
  aboutCompany: true,
  companyOffers: true,
  additionalCompanyDetails: true,
  driveSpoc: true,
  driveDate: true,
}).extend({
  workMode: JobWorkModeSchema.optional(),
  details: JobDetailsSchema.optional(),
  internal: JobInternalSchema.optional(),
});

function experienceRangeIsOrdered(
  value: { minYearsExperience?: number; maxYearsExperience?: number },
  ctx: z.RefinementCtx,
): void {
  if (
    value.minYearsExperience !== undefined &&
    value.maxYearsExperience !== undefined &&
    value.minYearsExperience > value.maxYearsExperience
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['maxYearsExperience'],
      message: 'maxYearsExperience must be greater than or equal to minYearsExperience',
    });
  }
}

/** New jobs always start as DRAFT; publishing is a separate, quota-checked step (JOB-01.07). */
export const CreateEmployerJobRequestSchema = EmployerJobFieldsSchema.extend({
  /** Optional home institution. Leave out for a normal company job; students of every university see it. */
  institutionId: UuidSchema.optional(),
}).superRefine(experienceRangeIsOrdered);
export type CreateEmployerJobRequest = z.infer<typeof CreateEmployerJobRequestSchema>;

/** Edits a DRAFT or OPEN job (JOB-01.08). The target campus cannot change; duplicate instead. */
export const UpdateEmployerJobRequestSchema =
  EmployerJobFieldsSchema.partial().superRefine(experienceRangeIsOrdered);
export type UpdateEmployerJobRequest = z.infer<typeof UpdateEmployerJobRequestSchema>;

/** Copies a job into a new DRAFT, optionally for another campus (JOB-01.09). */
export const DuplicateEmployerJobRequestSchema = z.object({
  institutionId: UuidSchema.optional(),
});
export type DuplicateEmployerJobRequest = z.infer<typeof DuplicateEmployerJobRequestSchema>;

export const EmployerJobDtoSchema = JobOpeningDtoSchema.extend({
  companyId: UuidSchema,
  workMode: JobWorkModeSchema.nullable(),
  details: JobDetailsSchema.nullable(),
  /** Company-only notes; never part of any candidate-facing DTO. */
  internal: JobInternalSchema.nullable(),
  /** Applications received so far; closing a job keeps them (JOB-01.10). */
  applicantCount: z.number().int().nonnegative(),
});
export type EmployerJobDto = z.infer<typeof EmployerJobDtoSchema>;

/** One reason a job is, or is not, shown to students. */
export const EmployerJobVisibilityCheckSchema = z.object({
  id: z.enum(['published', 'company_verified', 'deadline_open', 'all_students']),
  label: z.string(),
  ok: z.boolean(),
  /** What to do or what is wrong; null when the check passes. */
  message: z.string().nullable(),
});

/** Answer to "is my job live?": the same rules the student job list applies. */
export const EmployerJobVisibilitySchema = z.object({
  jobId: UuidSchema,
  /** True when students of any university can see and apply to this job right now. */
  visible: z.boolean(),
  checks: z.array(EmployerJobVisibilityCheckSchema),
});
export type EmployerJobVisibilityCheck = z.infer<typeof EmployerJobVisibilityCheckSchema>;
export type EmployerJobVisibility = z.infer<typeof EmployerJobVisibilitySchema>;

export const ListEmployerJobsQuerySchema = z.object({
  status: JobOpeningStatusSchema.optional(),
});
export type ListEmployerJobsQuery = z.infer<typeof ListEmployerJobsQuerySchema>;

export const ListEmployerJobsResponseSchema = z.object({
  jobs: z.array(EmployerJobDtoSchema),
});
export type ListEmployerJobsResponse = z.infer<typeof ListEmployerJobsResponseSchema>;
