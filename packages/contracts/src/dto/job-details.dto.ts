import { z } from './common.js';

/* ---------------- Job posting sections (stored as JSON on the job opening) ---------------- */

const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(4_000);
const tagList = z.array(shortText.min(1)).max(30);
const yesNo = z.boolean();

export const JOB_HIRING_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const JobHiringPrioritySchema = z.enum(JOB_HIRING_PRIORITIES);
export type JobHiringPriority = z.infer<typeof JobHiringPrioritySchema>;

/**
 * Everything about the job a candidate may see beyond the core columns (title, type, work mode,
 * location, experience range, openings, deadline, pay text and required skills). Every key is
 * optional so a partial draft saves.
 */
export const JobDetailsSchema = z.object({
  /** 1. Basic information */
  functionCategory: shortText.optional(),
  department: shortText.optional(),
  workAuthorization: shortText.optional(),
  /** Short highlights candidates see on the job, e.g. "Fresher friendly". */
  tags: tagList.optional(),
  compensation: z
    .object({
      currency: z.string().trim().length(3).optional(),
      min: z.number().nonnegative().optional(),
      max: z.number().nonnegative().optional(),
      /** Pay period, e.g. LPA or month. */
      period: shortText.optional(),
      type: z.enum(['FIXED', 'NEGOTIABLE']).optional(),
      bonus: yesNo.optional(),
      equity: yesNo.optional(),
    })
    .optional(),
  /** 2. Job description */
  summary: longText.optional(),
  responsibilities: longText.optional(),
  dayToDay: longText.optional(),
  outcomes: longText.optional(),
  /** 3. Skills beyond the required list (which lives in `requiredSkills`) */
  goodToHaveSkills: z
    .array(z.object({ name: shortText.min(1), weight: z.number().int().min(1).max(5) }))
    .max(20)
    .optional(),
  technicalSkills: tagList.optional(),
  softSkills: tagList.optional(),
  tools: tagList.optional(),
  certifications: tagList.optional(),
  languages: tagList.optional(),
  /** 4. Education */
  minimumQualification: shortText.optional(),
  preferredDegree: shortText.optional(),
  specialization: shortText.optional(),
  /** 5. Experience */
  relevantExperience: longText.optional(),
  industryExperience: shortText.optional(),
  /** 6. Assessment requirements */
  assessment: z
    .object({
      coding: yesNo.optional(),
      technical: yesNo.optional(),
      aptitude: yesNo.optional(),
      communication: yesNo.optional(),
      domainSpecific: yesNo.optional(),
      domainSpecificNote: shortText.optional(),
      interviewRounds: z.number().int().min(0).max(10).optional(),
    })
    .optional(),
  /** 7. Hiring details beyond openings and deadline */
  joiningTimeline: shortText.optional(),
  onHold: yesNo.optional(),
});
export type JobDetails = z.infer<typeof JobDetailsSchema>;

/** Never sent to candidates: only the owning company reads it. */
export const JobInternalSchema = z.object({
  atsReferenceId: shortText.optional(),
  hiringPriority: JobHiringPrioritySchema.optional(),
  hiringManager: shortText.optional(),
});
export type JobInternal = z.infer<typeof JobInternalSchema>;
