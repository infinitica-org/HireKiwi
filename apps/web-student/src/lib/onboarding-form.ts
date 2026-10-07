import type {
  CandidateAcademicProgram,
  CandidateAcademicScores,
  CandidateOnboardingDraft,
  CandidateOnboardingJobPreferences,
  CompleteCandidateOnboardingRequest,
  OnboardingStepId,
  ResumeParseDraft,
  SaveCandidateOnboardingDraftRequest,
  SkillDiscovery,
  SocialVerification,
  WorkMode,
} from '@hirekiwi/contracts';
import { OnboardingStepIdSchema } from '@hirekiwi/contracts';
import { SKILL_CODE_TO_NAME } from './skills-catalog';

/** Narrows a free-form persisted string to a valid wizard step id, or undefined. */
function parseOnboardingStep(value: string): OnboardingStepId | undefined {
  const result = OnboardingStepIdSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

const NAME_TO_SKILL_CODE = new Map(
  Array.from(SKILL_CODE_TO_NAME.entries()).map(([code, name]) => [name.toLowerCase(), code]),
);

export interface OnboardingProfileForm {
  firstName: string;
  lastName: string;
  gender: string;
  dobMonth: string;
  dobDay: string;
  dobYear: string;
  phoneCountryCode: string;
  phoneNumber: string;
  linkedinUrl: string;
  githubUrl: string;
  languages: { id: string; language: string; proficiency: string }[];
  /** Mandatory Core + straightforward Niche catalog skills, one proficiency each. Keyed by catalog skill code. */
  catalogSkills: Record<string, string>;
  /** Programming languages with proficiency. */
  codingProficiencies: { id: string; language: string; proficiency: string }[];
  /** Frontend frameworks with proficiency. */
  frontendFrameworks: { id: string; framework: string; proficiency: string }[];
  /** Backend frameworks with proficiency. */
  backendFrameworks: { id: string; framework: string; proficiency: string }[];
  /** Legacy alias for backward compatibility. */
  frameworkProficiencies: { id: string; framework: string; proficiency: string }[];
  education: CompleteCandidateOnboardingRequest['education'];
  experiences: CompleteCandidateOnboardingRequest['experiences'];
  socialVerification: SocialVerification;
  skillDiscovery: SkillDiscovery;
  jobPreferences: {
    expectedCtcLakhs: string;
    currentLocation: string;
    preferredLocations: string[];
  };
  /** CGPA (0-10) and 10th/12th percentages (0-100) — all optional, string inputs. */
  academicScores: {
    cgpa: string;
    sscPercentage: string;
    hscPercentage: string;
  };
  /** Study program (e.g. "B.Tech CSE") + graduation year — optional, string inputs. */
  academicProgram: {
    studyProgram: string;
    graduationYear: string;
  };
  dpdpConsent: boolean;
  /** Signed profile photo URL after upload; optional during onboarding. */
  profilePhotoUrl: string;
  /** I212 — last wizard step reached, persisted server-side so onboarding resumes correctly. */
  onboardingStep: string;
}

export const emptySocialVerification = (): SocialVerification => ({ linkedin: null, github: null });

export const emptySkillDiscovery = (): SkillDiscovery => ({
  suggestedFromGithub: [],
  selectedSkillNames: [],
  customSkillNames: [],
});

export const emptyJobPreferences = (): OnboardingProfileForm['jobPreferences'] => ({
  expectedCtcLakhs: '',
  currentLocation: '',
  preferredLocations: [],
});

export const emptyAcademicScores = (): OnboardingProfileForm['academicScores'] => ({
  cgpa: '',
  sscPercentage: '',
  hscPercentage: '',
});

export const emptyAcademicProgram = (): OnboardingProfileForm['academicProgram'] => ({
  studyProgram: '',
  graduationYear: '',
});

export const ONBOARDING_DRAFT_STORAGE_KEY = 'hirekiwi.candidate.onboarding.draft';

export function emptyOnboardingForm(): OnboardingProfileForm {
  return {
    firstName: '',
    lastName: '',
    gender: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    phoneCountryCode: '+91',
    phoneNumber: '',
    linkedinUrl: '',
    githubUrl: '',
    languages: [],
    catalogSkills: {},
    codingProficiencies: [],
    frontendFrameworks: [],
    backendFrameworks: [],
    frameworkProficiencies: [],
    education: [],
    experiences: [],
    socialVerification: emptySocialVerification(),
    skillDiscovery: emptySkillDiscovery(),
    jobPreferences: emptyJobPreferences(),
    academicScores: emptyAcademicScores(),
    academicProgram: emptyAcademicProgram(),
    dpdpConsent: false,
    profilePhotoUrl: '',
    onboardingStep: '',
  };
}

export function loadOnboardingDraft(): OnboardingProfileForm {
  if (typeof window === 'undefined') return emptyOnboardingForm();
  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    if (!raw) return emptyOnboardingForm();
    return { ...emptyOnboardingForm(), ...(JSON.parse(raw) as Partial<OnboardingProfileForm>) };
  } catch {
    return emptyOnboardingForm();
  }
}

export function saveOnboardingDraft(form: OnboardingProfileForm): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(form));
}

export function clearOnboardingDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
}

export function applyResumeDraft(
  form: OnboardingProfileForm,
  draft: ResumeParseDraft,
): OnboardingProfileForm {
  const basic = draft.basicInfo;
  const languages = draft.skills
    .filter((s) => s.type === 'language')
    .map((s) => ({
      id: crypto.randomUUID(),
      language: s.name,
      proficiency: s.proficiency,
    }));
  // Resume-parsed technical skills seed the Skills step's "programming
  // languages" picker — a starting point the candidate reviews and edits there.
  const codingProficiencies = draft.skills
    .filter((s) => s.type === 'technical')
    .map((s) => ({
      id: crypto.randomUUID(),
      language: s.name,
      proficiency: s.proficiency,
    }));

  return {
    ...form,
    firstName: basic?.firstName?.trim() || form.firstName,
    lastName: basic?.lastName?.trim() || form.lastName,
    phoneNumber: basic?.phoneNumber?.trim() || form.phoneNumber,
    phoneCountryCode: basic?.phoneCountryCode?.trim() || form.phoneCountryCode,
    linkedinUrl: basic?.linkedinUrl?.trim() || form.linkedinUrl,
    languages: languages.length > 0 ? languages : form.languages,
    codingProficiencies:
      codingProficiencies.length > 0 ? codingProficiencies : form.codingProficiencies,
    education: draft.education.length > 0 ? draft.education : form.education,
    experiences: draft.experiences.length > 0 ? draft.experiences : form.experiences,
  };
}

/**
 * Hydrate the wizard from a draft the server already persisted (CN-T01 draft
 * save). Used on mount so progress survives a lost session or a different
 * device/browser, not just a localStorage cache on the same machine.
 */
export function applyServerDraft(
  form: OnboardingProfileForm,
  draft: CandidateOnboardingDraft | null | undefined,
): OnboardingProfileForm {
  if (!draft) return form;

  const draftSkills = draft.skills ?? [];
  const languages = draftSkills
    .filter(
      (s): s is { type: 'language'; name: string; proficiency: string } =>
        s.type === 'language' && Boolean(s.name?.trim() && s.proficiency?.trim()),
    )
    .map((s) => ({ id: crypto.randomUUID(), language: s.name, proficiency: s.proficiency }));

  // Split technical entries back into the mandatory catalog-skill map (exact
  // name match) vs. the free-form language/framework picks bucket. The two
  // multi-item skill families can't be told apart once flattened server-side,
  // so both land in `codingProficiencies` on reload.
  // Th6-600 — technical skills are catalog codes. Drafts saved before that carry a free-text
  // name + self-rating: names that match the catalog become codes; the rest stay in
  // `codingProficiencies` (kept, not deleted) but are no longer submitted as skills.
  const technical = draftSkills.filter((s) => s.type === 'technical' && (s.code || s.name?.trim()));
  const catalogSkills: Record<string, string> = {};
  const codingProficiencies: { id: string; language: string; proficiency: string }[] = [];
  for (const entry of technical) {
    const code =
      (entry.code && SKILL_CODE_TO_NAME.has(entry.code) ? entry.code : undefined) ??
      NAME_TO_SKILL_CODE.get((entry.name ?? '').toLowerCase());
    if (code) {
      catalogSkills[code] = '';
    } else if (entry.name?.trim()) {
      codingProficiencies.push({
        id: crypto.randomUUID(),
        language: entry.name,
        proficiency: entry.proficiency ?? '',
      });
    }
  }

  const jobPreferences = draft.jobPreferences;

  return {
    ...form,
    firstName: draft.firstName ?? form.firstName,
    lastName: draft.lastName ?? form.lastName,
    gender: draft.gender ?? form.gender,
    phoneCountryCode: draft.phoneCountryCode ?? form.phoneCountryCode,
    phoneNumber: draft.phoneNumber ?? form.phoneNumber,
    linkedinUrl: draft.linkedinUrl ?? form.linkedinUrl,
    githubUrl: draft.githubUrl ?? form.githubUrl,
    languages: languages.length > 0 ? languages : form.languages,
    catalogSkills: technical.length > 0 ? catalogSkills : form.catalogSkills,
    codingProficiencies:
      codingProficiencies.length > 0 ? codingProficiencies : form.codingProficiencies,
    jobPreferences: jobPreferences
      ? {
          expectedCtcLakhs:
            jobPreferences.expectedCtcLakhs?.toString() ?? form.jobPreferences.expectedCtcLakhs,
          currentLocation: jobPreferences.currentLocation ?? form.jobPreferences.currentLocation,
          preferredLocations:
            jobPreferences.preferredLocations ?? form.jobPreferences.preferredLocations,
        }
      : form.jobPreferences,
    academicScores: draft.academicScores
      ? {
          cgpa: draft.academicScores.cgpa?.toString() ?? form.academicScores.cgpa,
          sscPercentage:
            draft.academicScores.sscPercentage?.toString() ?? form.academicScores.sscPercentage,
          hscPercentage:
            draft.academicScores.hscPercentage?.toString() ?? form.academicScores.hscPercentage,
        }
      : form.academicScores,
    academicProgram: draft.academicProgram
      ? {
          studyProgram: draft.academicProgram.studyProgram ?? form.academicProgram.studyProgram,
          graduationYear:
            draft.academicProgram.graduationYear?.toString() ?? form.academicProgram.graduationYear,
        }
      : form.academicProgram,
    onboardingStep: draft.onboardingStep ?? form.onboardingStep,
    socialVerification: draft.socialVerification
      ? { ...emptySocialVerification(), ...draft.socialVerification }
      : form.socialVerification,
    skillDiscovery: draft.skillDiscovery
      ? { ...emptySkillDiscovery(), ...draft.skillDiscovery }
      : form.skillDiscovery,
    dpdpConsent: draft.dpdpConsent ?? form.dpdpConsent,
    education: [],
    experiences: [],
  };
}

/**
 * Builds the `skills[]` array sent to the server. Spoken languages keep their stated level.
 * Th6-600 — technical skills are catalog codes only (no free text, no self-rating): explicit
 * catalog picks, plus any typed/resume-parsed name that matches a catalog skill.
 */
function buildSkillsPayload(
  form: OnboardingProfileForm,
): CompleteCandidateOnboardingRequest['skills'] {
  const languages = form.languages
    .filter((l) => l.language.trim() && l.proficiency.trim())
    .map((l) => ({
      type: 'language' as const,
      name: l.language.trim(),
      proficiency: l.proficiency.trim(),
    }));

  const codes = new Set(
    Object.keys(form.catalogSkills).filter((code) => SKILL_CODE_TO_NAME.has(code)),
  );
  const typedNames = [
    ...form.codingProficiencies.map((l) => l.language),
    ...form.frontendFrameworks.map((f) => f.framework),
    ...form.backendFrameworks.map((f) => f.framework),
    ...form.frameworkProficiencies.map((f) => f.framework),
  ];
  for (const name of typedNames) {
    const code = NAME_TO_SKILL_CODE.get(name.trim().toLowerCase());
    if (code) codes.add(code);
  }
  const technical = [...codes].map((code) => ({
    type: 'technical' as const,
    code,
    name: SKILL_CODE_TO_NAME.get(code) ?? code,
  }));

  return [...languages, ...technical];
}

/** All three fields are optional — omit any that were left blank or don't parse as numbers. */
function buildAcademicScoresPayload(
  form: OnboardingProfileForm,
): CandidateAcademicScores | undefined {
  const cgpa = form.academicScores.cgpa.trim() ? Number(form.academicScores.cgpa) : undefined;
  const sscPercentage = form.academicScores.sscPercentage.trim()
    ? Number(form.academicScores.sscPercentage)
    : undefined;
  const hscPercentage = form.academicScores.hscPercentage.trim()
    ? Number(form.academicScores.hscPercentage)
    : undefined;
  const result: CandidateAcademicScores = {
    ...(cgpa !== undefined && !Number.isNaN(cgpa) ? { cgpa } : {}),
    ...(sscPercentage !== undefined && !Number.isNaN(sscPercentage) ? { sscPercentage } : {}),
    ...(hscPercentage !== undefined && !Number.isNaN(hscPercentage) ? { hscPercentage } : {}),
  };
  return Object.keys(result).length > 0 ? result : undefined;
}

/** Both fields are optional — omit any left blank or that don't parse as a valid year. */
function buildAcademicProgramPayload(
  form: OnboardingProfileForm,
): CandidateAcademicProgram | undefined {
  const studyProgram = form.academicProgram.studyProgram.trim() || undefined;
  const graduationYearRaw = form.academicProgram.graduationYear.trim();
  const graduationYear = graduationYearRaw ? Number(graduationYearRaw) : undefined;
  const result: CandidateAcademicProgram = {
    ...(studyProgram !== undefined ? { studyProgram } : {}),
    ...(graduationYear !== undefined && !Number.isNaN(graduationYear) ? { graduationYear } : {}),
  };
  return Object.keys(result).length > 0 ? result : undefined;
}

function buildJobPreferencesPayload(
  form: OnboardingProfileForm,
): CandidateOnboardingJobPreferences | undefined {
  const expected = Number(form.jobPreferences.expectedCtcLakhs);
  if (!form.jobPreferences.expectedCtcLakhs.trim() || Number.isNaN(expected)) return undefined;
  return {
    expectedCtcLakhs: expected,
    currentLocation: form.jobPreferences.currentLocation.trim(),
    preferredLocations: form.jobPreferences.preferredLocations,
    preferredWorkModes: ['FULL_TIME', 'HYBRID'],
  };
}

function normalizeOptionalUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Professional links tab — normalized URLs + optional social verification snapshot. */
export function buildProfessionalLinksSavePayload(
  form: OnboardingProfileForm,
  /**
   * Links the student is removing. An empty link is normally left out of the request (so a stale
   * form can never wipe a saved link), but the server only keeps what it is sent; to actually
   * remove one, the request must carry an explicit empty string.
   */
  clear: ReadonlyArray<'linkedinUrl' | 'githubUrl'> = [],
): Pick<SaveCandidateOnboardingDraftRequest, 'linkedinUrl' | 'githubUrl' | 'socialVerification'> {
  return {
    linkedinUrl:
      normalizeOptionalUrl(form.linkedinUrl) ?? (clear.includes('linkedinUrl') ? '' : undefined),
    githubUrl:
      normalizeOptionalUrl(form.githubUrl) ?? (clear.includes('githubUrl') ? '' : undefined),
    socialVerification: form.socialVerification,
  };
}

/** Best-effort snapshot of the in-progress form, sent to the server as a draft. */
export function buildOnboardingDraftPayload(
  form: OnboardingProfileForm,
): SaveCandidateOnboardingDraftRequest {
  const dateOfBirth =
    form.dobYear && form.dobMonth && form.dobDay
      ? `${form.dobYear}-${String(MONTHS.indexOf(form.dobMonth) + 1).padStart(2, '0')}-${form.dobDay.padStart(2, '0')}`
      : undefined;

  return {
    firstName: form.firstName.trim() || undefined,
    lastName: form.lastName.trim() || undefined,
    gender: form.gender.trim() || undefined,
    dateOfBirth,
    phoneCountryCode: form.phoneCountryCode.trim() || undefined,
    phoneNumber: form.phoneNumber.trim() || undefined,
    linkedinUrl: normalizeOptionalUrl(form.linkedinUrl),
    githubUrl: normalizeOptionalUrl(form.githubUrl),
    education: [],
    experiences: [],
    skills: buildSkillsPayload(form),
    jobPreferences: buildJobPreferencesPayload(form),
    academicScores: buildAcademicScoresPayload(form),
    academicProgram: buildAcademicProgramPayload(form),
    onboardingStep: parseOnboardingStep(form.onboardingStep),
    socialVerification: form.socialVerification,
    skillDiscovery: form.skillDiscovery,
    dpdpConsent: form.dpdpConsent,
  };
}

export function validateEducationItems(): string | null {
  return null;
}

export function validateExperienceItems(): string | null {
  return null;
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function buildCompleteOnboardingRequest(
  form: OnboardingProfileForm,
): CompleteCandidateOnboardingRequest | { error: string } {
  if (!form.firstName.trim() || !form.lastName.trim()) {
    return { error: 'First and last name are required.' };
  }
  if (!form.phoneNumber.trim()) {
    return { error: 'Phone number is required.' };
  }

  const jobPreferences = buildJobPreferencesPayload(form) ?? {
    expectedCtcLakhs: 6,
    currentLocation: 'Bengaluru',
    preferredLocations: ['Bengaluru', 'Remote / Anywhere'],
    preferredWorkModes: ['FULL_TIME', 'HYBRID'],
  };
  if (!form.dpdpConsent) {
    return { error: 'You must agree to the DPDP consent terms to complete your profile.' };
  }

  const dateOfBirth =
    form.dobYear && form.dobMonth && form.dobDay
      ? `${form.dobYear}-${String(MONTHS.indexOf(form.dobMonth) + 1).padStart(2, '0')}-${form.dobDay.padStart(2, '0')}`
      : undefined;

  let linkedinUrl = form.linkedinUrl.trim();
  if (linkedinUrl && !/^https?:\/\//i.test(linkedinUrl)) {
    linkedinUrl = `https://${linkedinUrl}`;
  }

  let githubUrl = form.githubUrl.trim();
  if (githubUrl && !/^https?:\/\//i.test(githubUrl)) {
    githubUrl = `https://${githubUrl}`;
  }

  return {
    // Stream step currently enrolls TECH_FULLSTACK only; broad domain stays CS & IT.
    interestDomain: 'CS_IT',
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    gender: form.gender.trim() || undefined,
    dateOfBirth,
    phoneCountryCode: form.phoneCountryCode.trim() || '+91',
    phoneNumber: form.phoneNumber.trim(),
    linkedinUrl,
    githubUrl: githubUrl || undefined,
    education: [],
    experiences: [],
    skills: buildSkillsPayload(form),
    jobPreferences,
    academicScores: buildAcademicScoresPayload(form),
    academicProgram: buildAcademicProgramPayload(form),
    socialVerification: form.socialVerification,
    skillDiscovery: form.skillDiscovery,
    dpdpConsent: true,
  };
}

export const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Mandarin',
  'Japanese',
  'Tamil',
  'Telugu',
  'Kannada',
  'Marathi',
  'Bengali',
  'Arabic',
  'Portuguese',
  'Russian',
];

export const FLUENCY_OPTIONS = ['Native', 'Fluent', 'Conversational', 'Beginner'];

export const CITY_OPTIONS = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Mumbai',
  'Delhi NCR',
  'Kolkata',
  'Ahmedabad',
  'Kochi',
  'Remote / Anywhere',
];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  FULL_TIME: 'Full-Time',
  PART_TIME: 'Part-Time',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};
