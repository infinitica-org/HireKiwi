import { InternalServerErrorException } from '@nestjs/common';
import {
  EmploymentTypeSchema,
  JdSkillExtractVectorSchema,
  JobOpeningAttachedDocumentSchema,
  JobOpeningDtoSchema,
  SkillTaxonomyDomainSchema,
  type JobOpeningAttachedDocument,
  type JobOpeningDto,
} from '@smart/contracts';
import { z } from 'zod';

/**
 * Row type and DTO mapping for `JobOpening`, shared by employer jobs (JOB-01) and the
 * placement module. Moved out of placement.service.ts unchanged.
 */

/** Row shape the DTO mapper needs; `stream` has no column and is never persisted. */
export interface OpeningRow {
  id: string;
  institutionId: string;
  placementEmployerId?: string | null;
  companyName: string;
  roleTitle: string;
  domainCode: string | null;
  categoryCode: string | null;
  minYearsExperience: number | null;
  maxYearsExperience: number | null;
  location: string | null;
  employmentType: string | null;
  headcount: number | null;
  companyLogoUrl: string | null;
  attachedDocuments: unknown;
  aboutCompany: string | null;
  companyOffers: string | null;
  additionalCompanyDetails: string | null;
  roleDetails: string | null;
  salaryDetails: string | null;
  roundDetails: string | null;
  hiringDetails: string | null;
  driveSpoc: string | null;
  driveDate: Date | null;
  lastDateToApply: Date | null;
  minSscPercentage: unknown;
  minHscPercentage: unknown;
  minCollegePercentage: unknown;
  backlogsAllowed: boolean;
  status: string;
  createdAt: Date;
  rawText?: string | null;
  jdParseStatus?: string;
  parseConfidence?: unknown;
  parsedAt?: Date | null;
  parsedRequirements?: unknown;
  requiredSkills: { minProficiency: string; skill: { code: string } }[];
}

export function calendarDateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isoDateToCalendarDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function parseAttachedDocuments(raw: unknown): JobOpeningAttachedDocument[] | null {
  if (raw === null || raw === undefined) return null;
  const parsed = z.array(JobOpeningAttachedDocumentSchema).safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

/** Coerce legacy rows so list/get does not 500 the whole institution when one field is null. */
export function normalizeOpeningRow(row: OpeningRow): OpeningRow {
  const domain = SkillTaxonomyDomainSchema.safeParse(row.domainCode);
  const employmentType = EmploymentTypeSchema.safeParse(row.employmentType);
  const minYears = row.minYearsExperience ?? 0;
  const maxYears = row.maxYearsExperience ?? minYears;

  return {
    ...row,
    domainCode: domain.success ? domain.data : 'SOFTWARE_IT',
    location: row.location?.trim() ? row.location.trim() : 'Unspecified',
    employmentType: employmentType.success ? employmentType.data : 'FULL_TIME',
    minYearsExperience: minYears,
    maxYearsExperience: maxYears < minYears ? minYears : maxYears,
    backlogsAllowed: row.backlogsAllowed ?? true,
  };
}

export function decimalField(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

/**
 * Maps a persisted opening onto the frozen `JobOpeningDto`. Parsed through the
 * contract so the response cannot drift; a row that predates the structured
 * form (no experience range, no taxonomy skills) is a data-integrity fault
 * rather than something to fabricate a value for.
 */
export function toJobOpeningDto(
  row: OpeningRow,
  options: { companyLogoUrl?: string } = {},
): JobOpeningDto {
  const extracted = row.parsedRequirements
    ? JdSkillExtractVectorSchema.safeParse(row.parsedRequirements)
    : null;
  const parsed = JobOpeningDtoSchema.safeParse({
    openingId: row.id,
    institutionId: row.institutionId,
    employerId: row.placementEmployerId ?? null,
    companyName: row.companyName,
    roleTitle: row.roleTitle,
    domain: row.domainCode,
    categoryId: row.categoryCode ?? undefined,
    requiredSkills: row.requiredSkills.map((requirement) => ({
      skillCode: requirement.skill.code,
      minProficiency: requirement.minProficiency,
    })),
    minYearsExperience: row.minYearsExperience,
    maxYearsExperience: row.maxYearsExperience,
    location: row.location,
    employmentType: row.employmentType,
    headcount: row.headcount ?? 1,
    companyLogoUrl: options.companyLogoUrl,
    attachedDocuments: parseAttachedDocuments(row.attachedDocuments) ?? undefined,
    aboutCompany: row.aboutCompany ?? undefined,
    companyOffers: row.companyOffers ?? undefined,
    additionalCompanyDetails: row.additionalCompanyDetails ?? undefined,
    roleDetails: row.roleDetails ?? undefined,
    salaryDetails: row.salaryDetails ?? undefined,
    roundDetails: row.roundDetails ?? undefined,
    hiringDetails: row.hiringDetails ?? undefined,
    driveSpoc: row.driveSpoc ?? undefined,
    driveDate: row.driveDate ? calendarDateToIso(row.driveDate) : undefined,
    lastDateToApply: row.lastDateToApply ? calendarDateToIso(row.lastDateToApply) : undefined,
    minSscPercentage: decimalField(row.minSscPercentage) ?? undefined,
    minHscPercentage: decimalField(row.minHscPercentage) ?? undefined,
    minCollegePercentage: decimalField(row.minCollegePercentage) ?? undefined,
    backlogsAllowed: row.backlogsAllowed,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    rawText: row.rawText ?? undefined,
    jdParseStatus: row.jdParseStatus ?? undefined,
    parseConfidence:
      row.parseConfidence === null || row.parseConfidence === undefined
        ? null
        : Number(row.parseConfidence),
    parsedAt: row.parsedAt?.toISOString() ?? null,
    extractedRequirements: extracted?.success ? extracted.data : null,
  });
  if (!parsed.success) {
    throw new InternalServerErrorException({
      error: 'opening_not_structured',
      message: `Job opening ${row.id} does not satisfy the CO-T01 structured JD contract.`,
      statusCode: 500,
    });
  }
  return parsed.data;
}
