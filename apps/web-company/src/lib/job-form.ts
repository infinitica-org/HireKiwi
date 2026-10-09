import type { EmployerJobDto, JobDetails, JobInternal } from '@hirekiwi/contracts';
import {
  SKILL_CATALOG_GROUPS,
  fromRequiredSkills,
  toRequiredSkills,
  type SkillReq,
} from './skill-catalog';

/**
 * The Post a job form model. Core facts map to the existing job columns; everything else is saved
 * in `details` (candidate-facing) or `internal` (company-only, never shown to candidates).
 */

export const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'] as const;
export type JobTypeLabel = (typeof JOB_TYPES)[number];
const TYPE_TO_API: Record<JobTypeLabel, string> = {
  'Full-time': 'FULL_TIME',
  'Part-time': 'PART_TIME',
  Contract: 'CONTRACT',
  Internship: 'INTERNSHIP',
};

export const WORK_MODES = ['On-site', 'Hybrid', 'Remote'] as const;
export type WorkModeLabel = (typeof WORK_MODES)[number];
const MODE_TO_API: Record<WorkModeLabel, 'ONSITE' | 'HYBRID' | 'REMOTE'> = {
  'On-site': 'ONSITE',
  Hybrid: 'HYBRID',
  Remote: 'REMOTE',
};

/** Standardised job functions; drives first-stage filtering. */
export const FUNCTION_CATEGORIES = [
  'Software engineering',
  'Data & analytics',
  'Machine learning & AI',
  'DevOps & cloud',
  'Quality assurance',
  'Cybersecurity',
  'Product management',
  'Design & UX',
  'IT support',
  'Sales & marketing',
  'Operations',
  'Human resources',
  'Finance & accounting',
  'Other',
] as const;

export const WORK_AUTHORIZATION = [
  'No restriction',
  'Must already hold work authorization',
  'Visa sponsorship available',
  'Citizens / permanent residents only',
] as const;

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;
const CURRENCY_SYMBOL: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
export const PAY_PERIODS = ['LPA', 'per month', 'per year', 'per hour'] as const;

export const QUALIFICATIONS = [
  'Any',
  'Class 12',
  'Diploma',
  "Bachelor's degree",
  "Master's degree",
  'Doctorate',
] as const;

export const JOINING_TIMELINES = [
  'Immediate',
  'Within 15 days',
  'Within 30 days',
  'Within 60 days',
  'Within 90 days',
  'Flexible',
] as const;

/** Highlights that matter most to candidates; companies can also add their own. */
export const SUGGESTED_JOB_TAGS = [
  'Fresher friendly',
  'Immediate joiner',
  'Urgent hiring',
  'Remote friendly',
  'Flexible hours',
  'Internship-to-hire',
  'Relocation support',
  'Health insurance',
  '5-day week',
  'Campus drive',
] as const;

export const JOB_STATUS_CHOICES = ['Open', 'On hold'] as const;
export type JobStatusChoice = (typeof JOB_STATUS_CHOICES)[number];

export const HIRING_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type HiringPriorityLabel = (typeof HIRING_PRIORITIES)[number];

export interface GoodToHaveSkill {
  name: string;
  weight: number;
}

export interface JobForm {
  /* 1. Basic information */
  title: string;
  functionCategory: string;
  department: string;
  type: JobTypeLabel;
  workMode: WorkModeLabel;
  location: string;
  workAuthorization: string;
  tags: string[];
  minYears: string;
  maxYears: string;
  currency: string;
  payMin: string;
  payMax: string;
  payPeriod: string;
  payType: 'FIXED' | 'NEGOTIABLE';
  bonus: boolean;
  equity: boolean;
  /* 2. Job description */
  summary: string;
  responsibilities: string;
  dayToDay: string;
  outcomes: string;
  /* 3. Skills */
  mustHave: SkillReq[];
  goodToHave: GoodToHaveSkill[];
  technicalSkills: string[];
  softSkills: string[];
  tools: string[];
  certifications: string[];
  languages: string[];
  /* 4. Education */
  minimumQualification: string;
  preferredDegree: string;
  specialization: string;
  /* 5. Experience */
  relevantExperience: string;
  industryExperience: string;
  /* 6. Assessment requirements */
  coding: boolean;
  technical: boolean;
  aptitude: boolean;
  communication: boolean;
  domainSpecific: boolean;
  domainSpecificNote: string;
  interviewRounds: string;
  /* 7. Hiring details */
  openings: string;
  deadline: string;
  joiningTimeline: string;
  status: JobStatusChoice;
  /* 8. Internal: never shown to candidates */
  atsReferenceId: string;
  hiringPriority: HiringPriorityLabel | '';
  hiringManager: string;
}

export const EMPTY_JOB_FORM: JobForm = {
  title: '',
  functionCategory: '',
  department: '',
  type: 'Full-time',
  workMode: 'On-site',
  location: '',
  workAuthorization: '',
  tags: [],
  minYears: '0',
  maxYears: '3',
  currency: 'INR',
  payMin: '',
  payMax: '',
  payPeriod: 'LPA',
  payType: 'FIXED',
  bonus: false,
  equity: false,
  summary: '',
  responsibilities: '',
  dayToDay: '',
  outcomes: '',
  mustHave: [],
  goodToHave: [],
  technicalSkills: [],
  softSkills: [],
  tools: [],
  certifications: [],
  languages: [],
  minimumQualification: '',
  preferredDegree: '',
  specialization: '',
  relevantExperience: '',
  industryExperience: '',
  coding: false,
  technical: false,
  aptitude: false,
  communication: false,
  domainSpecific: false,
  domainSpecificNote: '',
  interviewRounds: '',
  openings: '1',
  deadline: '',
  joiningTimeline: '',
  status: 'Open',
  atsReferenceId: '',
  hiringPriority: '',
  hiringManager: '',
};

const num = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const text = (value: string): string | undefined => value.trim() || undefined;
const list = (value: string[]): string[] | undefined => (value.length > 0 ? value : undefined);

export interface JobFormProblem {
  /** The 1-based section the problem belongs to. */
  step: number;
  message: string;
}

/** Every problem, in section order, so a step can check only its own fields. */
export function jobFormProblems(form: JobForm, today = new Date()): JobFormProblem[] {
  const problems: JobFormProblem[] = [];
  const add = (step: number, message: string) => problems.push({ step, message });

  if (!form.title.trim()) add(1, 'Job title is required.');
  if (!form.location.trim() && form.workMode !== 'Remote') add(1, 'Location is required.');
  const minYears = num(form.minYears) ?? 0;
  const maxYears = num(form.maxYears) ?? minYears;
  if (minYears < 0 || maxYears < 0) add(1, 'Experience cannot be negative.');
  else if (minYears > maxYears) add(1, 'Maximum experience must be at least the minimum.');
  const payMin = num(form.payMin);
  const payMax = num(form.payMax);
  if (payMin !== undefined && payMax !== undefined && payMin > payMax) {
    add(1, 'Maximum pay must be at least the minimum.');
  }
  if (form.mustHave.length === 0) add(3, 'Add at least one must-have skill.');
  const rounds = num(form.interviewRounds);
  if (rounds !== undefined && (!Number.isInteger(rounds) || rounds < 0 || rounds > 10)) {
    add(6, 'Interview rounds must be a whole number from 0 to 10.');
  }
  const openings = num(form.openings);
  if (openings !== undefined && (!Number.isInteger(openings) || openings < 1)) {
    add(7, 'Number of openings must be a whole number of at least 1.');
  }
  if (form.deadline) {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (new Date(`${form.deadline}T00:00:00`) < startOfToday) {
      add(7, 'The application deadline cannot be in the past.');
    }
  }
  return problems;
}

/** A friendly message for the first problem, or null when the form can be submitted. */
export function validateJobForm(form: JobForm, today = new Date()): string | null {
  return jobFormProblems(form, today)[0]?.message ?? null;
}

function salaryText(form: JobForm): string | undefined {
  const min = num(form.payMin);
  const max = num(form.payMax);
  if (min === undefined && max === undefined) {
    return form.payType === 'NEGOTIABLE' ? 'Negotiable' : undefined;
  }
  const symbol = CURRENCY_SYMBOL[form.currency] ?? `${form.currency} `;
  const range =
    min !== undefined && max !== undefined && min !== max
      ? `${symbol}${min.toLocaleString('en-IN')}–${max.toLocaleString('en-IN')}`
      : `${symbol}${(min ?? max ?? 0).toLocaleString('en-IN')}`;
  const extras = [
    form.payType === 'NEGOTIABLE' ? 'negotiable' : null,
    form.bonus ? 'bonus' : null,
    form.equity ? 'equity' : null,
  ].filter(Boolean);
  return `${range} ${form.payPeriod}${extras.length > 0 ? ` (${extras.join(', ')})` : ''}`;
}

function roundsText(form: JobForm): string | undefined {
  const parts = [
    form.coding ? 'Coding assessment' : null,
    form.technical ? 'Technical assessment' : null,
    form.aptitude ? 'Aptitude' : null,
    form.communication ? 'Communication' : null,
    form.domainSpecific
      ? `Domain-specific test${form.domainSpecificNote.trim() ? ` (${form.domainSpecificNote.trim()})` : ''}`
      : null,
  ].filter(Boolean) as string[];
  const rounds = num(form.interviewRounds);
  if (rounds) parts.push(`${rounds} interview round${rounds === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function buildJobDetails(form: JobForm): JobDetails {
  const payMin = num(form.payMin);
  const payMax = num(form.payMax);
  const details: JobDetails = {
    functionCategory: text(form.functionCategory),
    department: text(form.department),
    workAuthorization: text(form.workAuthorization),
    tags: list(form.tags),
    compensation: {
      currency: form.currency,
      min: payMin,
      max: payMax,
      period: form.payPeriod,
      type: form.payType,
      bonus: form.bonus || undefined,
      equity: form.equity || undefined,
    },
    summary: text(form.summary),
    responsibilities: text(form.responsibilities),
    dayToDay: text(form.dayToDay),
    outcomes: text(form.outcomes),
    goodToHaveSkills: form.goodToHave.length > 0 ? form.goodToHave : undefined,
    technicalSkills: list(form.technicalSkills),
    softSkills: list(form.softSkills),
    tools: list(form.tools),
    certifications: list(form.certifications),
    languages: list(form.languages),
    minimumQualification: text(form.minimumQualification),
    preferredDegree: text(form.preferredDegree),
    specialization: text(form.specialization),
    relevantExperience: text(form.relevantExperience),
    industryExperience: text(form.industryExperience),
    assessment: {
      coding: form.coding || undefined,
      technical: form.technical || undefined,
      aptitude: form.aptitude || undefined,
      communication: form.communication || undefined,
      domainSpecific: form.domainSpecific || undefined,
      domainSpecificNote: text(form.domainSpecificNote),
      interviewRounds: num(form.interviewRounds),
    },
    joiningTimeline: text(form.joiningTimeline),
    onHold: form.status === 'On hold' || undefined,
  };
  return details;
}

export function buildJobInternal(form: JobForm): JobInternal {
  return {
    atsReferenceId: text(form.atsReferenceId),
    hiringPriority: form.hiringPriority
      ? (form.hiringPriority.toUpperCase() as JobInternal['hiringPriority'])
      : undefined,
    hiringManager: text(form.hiringManager),
  };
}

/** The request body for create and update. `undefined` keys are dropped when serialised. */
export function toJobPayload(form: JobForm) {
  const minYears = num(form.minYears) ?? 0;
  const maxYears = num(form.maxYears) ?? Math.max(minYears, 3);
  return {
    roleTitle: form.title.trim(),
    domain: 'SOFTWARE_IT' as const,
    employmentType: TYPE_TO_API[form.type] as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP',
    workMode: MODE_TO_API[form.workMode],
    location: form.location.trim() || 'Remote',
    minYearsExperience: minYears,
    maxYearsExperience: maxYears,
    headcount: num(form.openings),
    lastDateToApply: form.deadline || undefined,
    salaryDetails: salaryText(form),
    roleDetails:
      [form.summary.trim(), form.responsibilities.trim()].filter(Boolean).join('\n\n') || undefined,
    roundDetails: roundsText(form),
    requiredSkills: toRequiredSkills(form.mustHave),
    details: buildJobDetails(form),
    internal: buildJobInternal(form),
  };
}

const API_TO_TYPE: Record<string, JobTypeLabel> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};
const API_TO_MODE: Record<string, WorkModeLabel> = {
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
};
const PRIORITY_FROM_API: Record<string, HiringPriorityLabel> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

/** Fills the form from a saved job (edit page). Missing sections fall back to the defaults. */
export function jobToForm(job: EmployerJobDto): JobForm {
  const d = job.details ?? {};
  const i = job.internal ?? {};
  const assessment = d.assessment ?? {};
  const pay = d.compensation ?? {};
  return {
    ...EMPTY_JOB_FORM,
    title: job.roleTitle,
    functionCategory: d.functionCategory ?? '',
    department: d.department ?? '',
    type: API_TO_TYPE[job.employmentType ?? ''] ?? 'Full-time',
    workMode: API_TO_MODE[job.workMode ?? ''] ?? 'On-site',
    location: job.location ?? '',
    workAuthorization: d.workAuthorization ?? '',
    tags: d.tags ?? [],
    minYears: String(job.minYearsExperience ?? 0),
    maxYears: String(job.maxYearsExperience ?? 0),
    currency: pay.currency ?? 'INR',
    payMin: pay.min !== undefined ? String(pay.min) : '',
    payMax: pay.max !== undefined ? String(pay.max) : '',
    payPeriod: pay.period ?? 'LPA',
    payType: pay.type ?? 'FIXED',
    bonus: pay.bonus ?? false,
    equity: pay.equity ?? false,
    summary: d.summary ?? job.roleDetails ?? '',
    responsibilities: d.responsibilities ?? '',
    dayToDay: d.dayToDay ?? '',
    outcomes: d.outcomes ?? '',
    mustHave: fromRequiredSkills(job.requiredSkills ?? []),
    goodToHave: d.goodToHaveSkills ?? [],
    technicalSkills: d.technicalSkills ?? [],
    softSkills: d.softSkills ?? [],
    tools: d.tools ?? [],
    certifications: d.certifications ?? [],
    languages: d.languages ?? [],
    minimumQualification: d.minimumQualification ?? '',
    preferredDegree: d.preferredDegree ?? '',
    specialization: d.specialization ?? '',
    relevantExperience: d.relevantExperience ?? '',
    industryExperience: d.industryExperience ?? '',
    coding: assessment.coding ?? false,
    technical: assessment.technical ?? false,
    aptitude: assessment.aptitude ?? false,
    communication: assessment.communication ?? false,
    domainSpecific: assessment.domainSpecific ?? false,
    domainSpecificNote: assessment.domainSpecificNote ?? '',
    interviewRounds:
      assessment.interviewRounds !== undefined ? String(assessment.interviewRounds) : '',
    openings: job.headcount !== undefined && job.headcount !== null ? String(job.headcount) : '1',
    deadline: job.lastDateToApply ?? '',
    joiningTimeline: d.joiningTimeline ?? '',
    status: d.onHold ? 'On hold' : 'Open',
    atsReferenceId: i.atsReferenceId ?? '',
    hiringPriority: i.hiringPriority ? (PRIORITY_FROM_API[i.hiringPriority] ?? '') : '',
    hiringManager: i.hiringManager ?? '',
  };
}

/**
 * A complete sample job for trying the posting flow end to end. Every section is filled, the title
 * says TEST so it is easy to spot and delete, and the must-have skill is a real catalog skill.
 */
export function sampleJobForm(now: Date = new Date()): JobForm {
  const firstSkill = SKILL_CATALOG_GROUPS[0]?.skills[0];
  const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const stamp = now.toISOString().slice(11, 16);
  return {
    ...EMPTY_JOB_FORM,
    title: `[TEST] Sample Software Engineer ${stamp}`,
    functionCategory: 'Software engineering',
    department: 'Platform engineering',
    type: 'Full-time',
    workMode: 'Hybrid',
    location: 'Bengaluru',
    workAuthorization: 'No restriction',
    tags: ['Fresher friendly', 'Immediate joiner'],
    minYears: '0',
    maxYears: '2',
    currency: 'INR',
    payMin: '6',
    payMax: '10',
    payPeriod: 'LPA',
    payType: 'FIXED',
    bonus: true,
    summary: 'Sample job created by the test button. Safe to delete.',
    responsibilities: 'Build and test small features.\nReview code with the team.',
    dayToDay: 'Pair with a mentor, ship small changes, join stand-ups.',
    outcomes: 'Ship your first feature within 30 days.',
    mustHave: firstSkill
      ? [{ code: firstSkill.code, name: firstSkill.name, level: 'Intermediate' }]
      : [],
    goodToHave: [{ name: 'Docker', weight: 3 }],
    technicalSkills: ['REST APIs'],
    softSkills: ['Communication'],
    tools: ['Git'],
    languages: ['English'],
    minimumQualification: "Bachelor's degree",
    preferredDegree: 'B.E. / B.Tech',
    specialization: 'Computer Science',
    relevantExperience: 'Any internship or project work.',
    industryExperience: 'Any',
    coding: true,
    technical: true,
    communication: true,
    interviewRounds: '2',
    openings: '2',
    deadline,
    joiningTimeline: 'Within 30 days',
    status: 'Open',
    atsReferenceId: 'TEST-0001',
    hiringPriority: 'Low',
    hiringManager: 'Test manager',
  };
}
