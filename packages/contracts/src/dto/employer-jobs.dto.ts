import { z, UuidSchema } from './common.js';
import { JobOpeningStatusSchema } from '../domain/enums.js';
import { JobOpeningDtoSchema, JobOpeningFieldsSchema } from './placement.dto.js';
import { JobWorkModeSchema } from './student-jobs.dto.js';

/**
 * JOB-01 — employer job management (`/employer/jobs`).
 *
 * Reuses the job-opening field set so a job has one shape everywhere. The company name, about-
 * company copy and logo come from the caller's Company profile on the server, never from the body,
 * and the TPO drive fields (`driveSpoc`, `driveDate`) do not apply to employer-posted jobs.
 *
 * A job is posted to one campus (`institutionId`). Students only see it once that university has
 * approved the company's campus access (UNI-05 / JOB-01.12); reaching another campus is a
 * duplicate of the job with a different `institutionId` (JOB-01.09).
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
  /** Campus the job is posted to. The company must hold campus access for it. */
  institutionId: UuidSchema,
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
  /** Applications received so far; closing a job keeps them (JOB-01.10). */
  applicantCount: z.number().int().nonnegative(),
});
export type EmployerJobDto = z.infer<typeof EmployerJobDtoSchema>;

export const ListEmployerJobsQuerySchema = z.object({
  status: JobOpeningStatusSchema.optional(),
});
export type ListEmployerJobsQuery = z.infer<typeof ListEmployerJobsQuerySchema>;

export const ListEmployerJobsResponseSchema = z.object({
  jobs: z.array(EmployerJobDtoSchema),
});
export type ListEmployerJobsResponse = z.infer<typeof ListEmployerJobsResponseSchema>;
