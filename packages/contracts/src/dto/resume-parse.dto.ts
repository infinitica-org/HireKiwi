import { z } from 'zod';
import { SkillProficiencySchema } from '../domain/enums.js';
import { CandidateResumeFileSchema } from './candidate-onboarding.dto.js';

/**
 * CN-T02 — LLM resume parse for onboarding pre-fill.
 *
 * Implementation owner: Ramansh (`ai-gateway` + prompts). Consumers:
 * Satheswaran V (`web-student` wizard) and Vishal Bharath R (profile persist).
 *
 * Parse output is a **draft**. The student can always edit. The model must not
 * invent catalog skill codes, verification status, or row ids — those are
 * assigned after pre-fill.
 */

export const LANGUAGE_FLUENCIES = ['NATIVE', 'FLUENT', 'CONVERSATIONAL', 'BASIC'] as const;
export const LanguageFluencySchema = z.enum(LANGUAGE_FLUENCIES);
export type LanguageFluency = z.infer<typeof LanguageFluencySchema>;

export const RESUME_PARSE_STATUSES = ['PARSED', 'FAILED'] as const;
export const ResumeParseStatusSchema = z.enum(RESUME_PARSE_STATUSES);
export type ResumeParseStatus = z.infer<typeof ResumeParseStatusSchema>;

/** Header fields the resume may contain; all optional so a sparse header is valid. */
export const ResumeParseBasicInfoSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phoneNumber: z.string().min(1).max(32).optional(),
  phoneCountryCode: z.string().min(1).max(8).optional(),
  linkedinUrl: z.union([z.url(), z.literal('')]).optional(),
  currentCollege: z.string().min(1).max(200).optional(),
  summary: z.string().min(1).max(4000).optional(),
});
export type ResumeParseBasicInfo = z.infer<typeof ResumeParseBasicInfoSchema>;

export const ResumeParseEducationSchema = z.object({
  institutionName: z.string().min(1).max(200),
  degree: z.string().min(1).max(120).optional(),
  fieldOfStudy: z.string().min(1).max(120).optional(),
  startDate: z.string().min(1).max(32).optional(),
  endDate: z.string().min(1).max(32).optional(),
  current: z.boolean().optional(),
  grade: z.string().min(1).max(40).optional(),
});
export type ResumeParseEducation = z.infer<typeof ResumeParseEducationSchema>;

export const ResumeParseExperienceSchema = z.object({
  role: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  location: z.string().min(1).max(120).optional(),
  startDate: z.string().min(1).max(32).optional(),
  endDate: z.string().min(1).max(32).optional(),
  description: z.string().min(1).max(4000).optional(),
  tags: z.array(z.string().min(1).max(100)).max(20).default([]),
});
export type ResumeParseExperience = z.infer<typeof ResumeParseExperienceSchema>;

export const ResumeParseTechnicalSkillSchema = z.object({
  type: z.literal('technical'),
  name: z.string().min(1).max(80),
  proficiency: SkillProficiencySchema,
});

export const ResumeParseLanguageSkillSchema = z.object({
  type: z.literal('language'),
  name: z.string().min(1).max(80),
  proficiency: LanguageFluencySchema,
});

export const ResumeParseSkillSchema = z.discriminatedUnion('type', [
  ResumeParseTechnicalSkillSchema,
  ResumeParseLanguageSkillSchema,
]);
export type ResumeParseSkill = z.infer<typeof ResumeParseSkillSchema>;

/** Professional licenses and certifications (Product Owner, 1 Sep 2026 — was missing). */
export const LicenseCredentialSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  credentialId: z.string().min(1).max(120).optional(),
  issuedOn: z.string().min(1).max(32).optional(),
  expiresOn: z.string().min(1).max(32).optional(),
  url: z.union([z.url(), z.literal('')]).optional(),
});
export type LicenseCredential = z.infer<typeof LicenseCredentialSchema>;

/**
 * Schema-validated LLM JSON. Empty arrays are a valid parse (nothing extractable).
 * `FAILED` is reserved for gateway/schema exhaustion — the UI then skips pre-fill.
 */
export const ResumeParseDraftSchema = z.object({
  basicInfo: ResumeParseBasicInfoSchema.optional(),
  education: z.array(ResumeParseEducationSchema).max(20).default([]),
  experiences: z.array(ResumeParseExperienceSchema).max(30).default([]),
  skills: z.array(ResumeParseSkillSchema).max(40).default([]),
  licenses: z.array(LicenseCredentialSchema).max(20).default([]),
  parseConfidence: z.number().min(0).max(1),
  /** Dotted paths the model could not fill (e.g. `education.0.endDate`). */
  missingFields: z.array(z.string().min(1).max(120)).max(80).default([]),
});
export type ResumeParseDraft = z.infer<typeof ResumeParseDraftSchema>;

export const ParseResumeRequestSchema = z
  .object({
    /** Extracted plain text. v1 path while resume object storage is still open. */
    rawText: z.string().min(40).max(80_000).optional(),
    /** R2/MinIO object key once CN-T01 upload persists a blob. */
    objectKey: z.string().min(1).max(512).optional(),
  })
  .refine((value) => Boolean(value.rawText?.trim()) || Boolean(value.objectKey?.trim()), {
    message: 'Provide resume rawText or objectKey.',
  });
export type ParseResumeRequest = z.infer<typeof ParseResumeRequestSchema>;

export const ParseResumeResponseSchema = z.object({
  status: ResumeParseStatusSchema,
  draft: ResumeParseDraftSchema.nullable(),
});
export type ParseResumeResponse = z.infer<typeof ParseResumeResponseSchema>;

/** Maximum resume files a candidate may store on their profile (single resume with replacement). */
export const CANDIDATE_RESUME_FILES_MAX = 1;

export const RESUME_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const RESUME_ALLOWED_MIME_TYPE = 'application/pdf' as const;

export const RESUME_VALIDATION_MESSAGES = {
  ONLY_PDF_ALLOWED: 'Only PDF resumes are allowed.',
  MAX_SIZE_EXCEEDED: 'Resume must be 5 MB or smaller.',
  CORRUPTED_OR_UNREADABLE: 'This PDF appears to be corrupted or unreadable.',
  NOT_A_RESUME: "The uploaded document doesn't appear to be a resume.",
  REMOVE_EXISTING_FIRST: 'Remove your existing resume before uploading a new one.',
} as const;

export const NON_RESUME_PATTERNS = [
  /\b(?:certificate of completion|this is to certify that|certificate of achievement|is hereby awarded to|this certificate is (?:proudly )?awarded to|certificate of appreciation|completion certificate)\b/i,
  /\b(?:statement of marks|consolidated mark sheet|semester grade report|hall ticket|grade card|provisional certificate|admit card|question paper)\b/i,
  /\b(?:offer of employment|we are pleased to offer you|employment agreement|letter of appointment|compensation and benefits|annual fixed ctc|relieving letter)\b/i,
  /\b(?:tax invoice|invoice no|bill to:|gstin:|payment receipt|receipt voucher)\b/i,
  /\b(?:a project report submitted in partial fulfillment|chapter \d+: introduction|table of contents|literature survey)\b/i,
  /\b(?:bank statement|account statement|transaction history|available balance|opening balance|closing balance)\b/i,
  /\b(?:driving licence|driving license|passport of|voter id|election commission|aadhaar|pan card)\b/i,
  /\b(?:non-disclosure agreement|confidentiality agreement|lease agreement|tenancy agreement|memorandum of understanding|this agreement is made on|indemnity bond)\b/i,
  /\b(?:medical certificate|diagnostic report|patient name|clinical history|hospital discharge summary|doctor's prescription)\b/i,
  /\b(?:to whomsoever it may concern|bonafide certificate|letter of recommendation)\b/i,
];

export const POSITIVE_RESUME_PATTERNS = [
  /\b(?:curriculum vitae|resume|\bcv\b)\b/i,
  /\b(?:work experience|professional experience|employment history|career history|employment|experience|internships?)\b/i,
  /\b(?:education|educational qualifications?|academic background|academic qualifications?|academics|qualifications)\b/i,
  /\b(?:skills|technical skills|core skills|key skills|competencies|technologies|proficiencies|technical expertise)\b/i,
  /\b(?:projects|academic projects|personal projects|key projects)\b/i,
  /\b(?:career objective|professional summary|profile|objective|summary|about me)\b/i,
  /\b(?:certifications?|certificates?|achievements?|awards?|licenses?)\b/i,
  /\b(?:languages|contact information|contact details|contact|mobile|phone|email|linkedin\.com|github\.com|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i,
];

export function validateResumeDocumentText(rawText: string): { isValid: boolean; error?: string } {
  const cleaned = rawText.trim();
  if (cleaned.length < 40) {
    return { isValid: false, error: RESUME_VALIDATION_MESSAGES.CORRUPTED_OR_UNREADABLE };
  }

  const nonResumeMatch = NON_RESUME_PATTERNS.some((pattern) => pattern.test(cleaned));
  if (nonResumeMatch) {
    return { isValid: false, error: RESUME_VALIDATION_MESSAGES.NOT_A_RESUME };
  }

  const positiveMatches = POSITIVE_RESUME_PATTERNS.filter((pattern) =>
    pattern.test(cleaned),
  ).length;

  if (positiveMatches < 2) {
    return { isValid: false, error: RESUME_VALIDATION_MESSAGES.NOT_A_RESUME };
  }

  return { isValid: true };
}

export const CandidateResumeFilesSchema = z
  .array(CandidateResumeFileSchema)
  .max(CANDIDATE_RESUME_FILES_MAX);

export const CandidateResumeStateResponseSchema = z.object({
  /** Most recently uploaded file — kept for older clients. */
  resumeFile: CandidateResumeFileSchema.nullable(),
  resumeFiles: CandidateResumeFilesSchema.default([]),
});
export type CandidateResumeStateResponse = z.infer<typeof CandidateResumeStateResponseSchema>;

export const UploadResumeResponseSchema = z.object({
  resumeFile: CandidateResumeFileSchema,
  resumeFiles: CandidateResumeFilesSchema,
});
export type UploadResumeResponse = z.infer<typeof UploadResumeResponseSchema>;

export const DeleteResumeRequestSchema = z.object({
  objectKey: z.string().min(1).max(512),
});
export type DeleteResumeRequest = z.infer<typeof DeleteResumeRequestSchema>;

export const DeleteResumeResponseSchema = z.object({
  resumeFiles: CandidateResumeFilesSchema,
});
export type DeleteResumeResponse = z.infer<typeof DeleteResumeResponseSchema>;
