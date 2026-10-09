'use client';

import type { FormEvent, ReactNode } from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Upload, X } from 'lucide-react';
import {
  SKILL_DEFINITIONS,
  companyRequiresPublicIdentity,
  validateWorkExperienceLetterRules,
  type WorkExperienceDocumentDto,
  type WorkExperienceDto,
} from '@hirekiwi/contracts';

import {
  DOCUMENT_TYPE_LABELS,
  experienceInputClass,
  experienceLabelClass,
  experienceTextareaClass,
} from '@/components/profile/work-experience/work-experience-ui';
import { profileSecondaryButtonSmClass } from '@/lib/profile-ui-classes';
import { nativeOptionClass, nativeSelectClass } from '@/lib/native-select';
import { CATEGORY_OPTIONS, skillsForCategory } from '@/lib/skills-catalog';
import { EVIDENCE_ACCEPT } from '@/lib/evidence-upload';
import { ViviVerificationShell } from '@/components/vivi-verification/ViviVerificationShell';
import { useViviReady } from '@/components/vivi-verification/useViviReady';
import { StyledSelect } from '@/components/ui/styled-select';

export type ModalPendingDocument = {
  localId: string;
  documentType: WorkExperienceDocumentDto['documentType'];
  file: File;
};

const SKILL_NAME_BY_CODE = new Map(SKILL_DEFINITIONS.map((skill) => [skill.code, skill.name]));

const FormSection = forwardRef<
  HTMLElement,
  { title: string; description?: string; required?: boolean; children: ReactNode }
>(function FormSection({ title, description, required, children }, ref) {
  return (
    <section
      ref={ref}
      className="space-y-4 border-t border-[var(--ds-border)] pt-5 first:border-t-0 first:pt-0"
    >
      <div>
        <h4 className="sr-only">
          {title}
          {required ? <span className="text-red-600"> *</span> : null}
        </h4>
        {description ? <p className="sr-only">{description}</p> : null}
      </div>
      {children}
    </section>
  );
});

export interface ExperienceBuilderModalProps {
  editingId: string | null;
  focusVerification?: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  submitting: boolean;
  error: string | null;
  experiences: WorkExperienceDto[];
  companyName: string;
  setCompanyName: (value: string) => void;
  role: string;
  setRole: (value: string) => void;
  employmentType: string;
  setEmploymentType: (value: string) => void;
  workLocation: string;
  setWorkLocation: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  isCurrent: boolean;
  setIsCurrent: (value: boolean) => void;
  companyWebsite: string;
  setCompanyWebsite: (value: string) => void;
  companyLinkedinUrl: string;
  setCompanyLinkedinUrl: (value: string) => void;
  domain: string;
  setDomain: (value: string) => void;
  responsibilities: string;
  setResponsibilities: (value: string) => void;
  skillQuery: string;
  setSkillQuery: (value: string) => void;
  selectedSkillCodes: string[];
  setSelectedSkillCodes: (value: string[] | ((current: string[]) => string[])) => void;
  verifierName: string;
  setVerifierName: (value: string) => void;
  verifierEmail: string;
  setVerifierEmail: (value: string) => void;
  verifierDesignation: string;
  setVerifierDesignation: (value: string) => void;
  modalPendingDocs: ModalPendingDocument[];
  setModalPendingDocs: (
    value: ModalPendingDocument[] | ((current: ModalPendingDocument[]) => ModalPendingDocument[]),
  ) => void;
  modalNewDocType: WorkExperienceDocumentDto['documentType'];
  setModalNewDocType: (value: WorkExperienceDocumentDto['documentType']) => void;
  modalNewProofFile: File | null;
  setModalNewProofFile: (file: File | null) => void;
  onAddPendingDocument: () => void;
}

export function ExperienceBuilderModal(props: ExperienceBuilderModalProps) {
  const {
    editingId,
    focusVerification = false,
    onClose,
    onSubmit,
    submitting,
    error,
    experiences,
    companyName,
    setCompanyName,
    role,
    setRole,
    employmentType,
    setEmploymentType,
    workLocation,
    setWorkLocation,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isCurrent,
    setIsCurrent,
    companyWebsite,
    setCompanyWebsite,
    companyLinkedinUrl,
    setCompanyLinkedinUrl,
    domain,
    setDomain,
    responsibilities,
    setResponsibilities,
    skillQuery,
    setSkillQuery,
    selectedSkillCodes,
    setSelectedSkillCodes,
    verifierName,
    setVerifierName,
    verifierEmail,
    setVerifierEmail,
    verifierDesignation,
    setVerifierDesignation,
    modalPendingDocs,
    setModalPendingDocs,
    modalNewDocType,
    setModalNewDocType,
    setModalNewProofFile,
    onAddPendingDocument,
  } = props;

  const editingExp = editingId ? experiences.find((exp) => exp.id === editingId) : undefined;
  const savedModalDocs = editingExp?.documents ?? [];
  const modalLetterCheck = validateWorkExperienceLetterRules({
    isCurrent,
    endDate: !isCurrent && endDate ? new Date(endDate).toISOString() : null,
    documents: [
      ...savedModalDocs.map((doc) => ({ documentType: doc.documentType })),
      ...modalPendingDocs.map((doc) => ({ documentType: doc.documentType })),
    ],
  });

  const requiresPublicIdentity = companyRequiresPublicIdentity({
    companyId: editingExp?.companyId ?? null,
    companyWebsite,
  });

  type StepId = 'role' | 'dates' | 'links' | 'work' | 'proof' | 'verify';
  const steps: { id: StepId; label: string }[] = [
    { id: 'role', label: 'Company' },
    { id: 'dates', label: 'Dates' },
    ...(requiresPublicIdentity ? [{ id: 'links' as const, label: 'Links' }] : []),
    { id: 'work', label: 'Work' },
    { id: 'proof', label: 'Proof' },
    { id: 'verify', label: 'Verify' },
  ];
  const [step, setStep] = useState<StepId>(focusVerification ? 'verify' : 'role');
  const [stepError, setStepError] = useState<string | null>(null);
  const stepIndex = Math.max(
    0,
    steps.findIndex((item) => item.id === step),
  );
  const isLastStep = stepIndex === steps.length - 1;

  /** What is missing on a step, in plain words; null when the step is done. */
  const stepProblem = (id: StepId): string | null => {
    switch (id) {
      case 'role':
        if (!companyName.trim()) return 'Enter the company name.';
        if (!role.trim()) return 'Enter your role or designation.';
        return null;
      case 'dates':
        if (!startDate) return 'Pick a start date.';
        if (!isCurrent && !endDate) return 'Pick an end date, or tick that you work here now.';
        return null;
      case 'links':
        return companyWebsite.trim() && companyLinkedinUrl.trim()
          ? null
          : 'Add the company website and LinkedIn page.';
      case 'work':
        if (!domain.trim()) return 'Enter your professional domain.';
        if (!responsibilities.trim()) return 'Describe what you did.';
        if (selectedSkillCodes.length === 0) return 'Pick at least one skill.';
        return null;
      // Proof can be added later: the notice on this step says what is still needed.
      case 'proof':
        return null;
      default:
        return null;
    }
  };

  const goTo = (id: StepId) => {
    setStepError(null);
    setStep(id);
  };
  const next = () => {
    const problem = stepProblem(step);
    if (problem) {
      setStepError(problem);
      return;
    }
    const target = steps[stepIndex + 1];
    if (target) goTo(target.id);
  };
  const back = () => {
    const target = steps[stepIndex - 1];
    if (target) goTo(target.id);
  };
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isLastStep) {
      next();
      return;
    }
    // Last step: make sure no earlier step was left incomplete before saving.
    for (const item of steps) {
      const problem = stepProblem(item.id);
      if (problem) {
        setStep(item.id);
        setStepError(problem);
        return;
      }
    }
    onSubmit(event);
  };
  const verifierSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!focusVerification) return;
    const node = verifierSectionRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusVerification]);

  const proofHint = isCurrent
    ? 'Upload your offer letter (PDF or PNG, max 10 MB).'
    : 'Upload offer letter and relieving or experience letter.';

  // Placeholders first; the real form once a moment has passed.
  const ready = useViviReady(true);

  const stepCopy: Record<StepId, [string, string]> = {
    role: ['Where did you work?', 'Tell us the company and your role there.'],
    dates: ['When did you work there?', 'Roughly is fine. You can edit this later.'],
    links: ['Company links', 'Required when a company website is listed.'],
    work: ['What did you do there?', 'Pick catalog skills only. Free-text tags are not accepted.'],
    proof: ['Add proof of your work', proofHint],
    verify: [
      'Who can verify it? (optional)',
      'Save first, then we can email your manager or HR a secure verification link.',
    ],
  };

  const primaryButton =
    'inline-flex items-center gap-1.5 rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400';
  const ghostButton =
    'inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50';

  const actions = (
    <>
      {stepIndex === 0 ? (
        <button type="button" onClick={onClose} className={ghostButton}>
          Cancel
        </button>
      ) : (
        <button type="button" onClick={back} className={ghostButton}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}
      {isLastStep ? (
        <button
          type="submit"
          form="experience-builder-form"
          disabled={submitting}
          className={primaryButton}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {editingId
            ? verifierEmail.trim()
              ? 'Save & send verification'
              : 'Save changes'
            : verifierEmail.trim()
              ? 'Submit & send verification'
              : 'Submit experience'}
        </button>
      ) : (
        <button type="button" onClick={next} className={primaryButton}>
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </>
  );

  return (
    <ViviVerificationShell
      open
      loading={!ready}
      onClose={onClose}
      titleId="experience-builder-title"
      title="Experience Verification"
      steps={steps.map((item) => item.label)}
      stepIndex={stepIndex}
      selectedHeading="Skills selected for this role"
      selectedHint="Skills you pick appear here. Review or remove them before continuing."
      selectedEmpty={
        <p>
          No skills selected yet.
          <br />
          You can add them in the Work step.
        </p>
      }
      selected={selectedSkillCodes.map((code) => ({
        code,
        label: SKILL_NAME_BY_CODE.get(code) ?? code,
      }))}
      onRemoveSelected={(code) =>
        setSelectedSkillCodes((current) => current.filter((item) => item !== code))
      }
      heading={stepCopy[step][0]}
      description={stepCopy[step][1]}
      actions={actions}
    >
      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {stepError ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{stepError}</span>
        </div>
      ) : null}

      <form id="experience-builder-form" noValidate onSubmit={handleSubmit} className="space-y-5">
        <div hidden={step !== 'role'}>
          <FormSection
            title="Where did you work?"
            description="Tell us the company and your role there."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={experienceLabelClass}>
                  Company name<span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className={experienceInputClass}
                />
              </div>
              <div>
                <label className={experienceLabelClass}>
                  Role / designation<span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="e.g. Software Engineer Intern"
                  className={experienceInputClass}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={experienceLabelClass}>
                  Employment type<span className="text-red-600"> *</span>
                </label>
                <StyledSelect
                  value={employmentType}
                  onChange={(event) => setEmploymentType(event.target.value)}
                  className={`${nativeSelectClass} ${experienceInputClass} py-2`}
                >
                  <option value="FULL_TIME" className={nativeOptionClass}>
                    Full-time
                  </option>
                  <option value="PART_TIME" className={nativeOptionClass}>
                    Part-time
                  </option>
                  <option value="CONTRACT" className={nativeOptionClass}>
                    Contract
                  </option>
                  <option value="INTERNSHIP" className={nativeOptionClass}>
                    Internship
                  </option>
                  <option value="FREELANCE" className={nativeOptionClass}>
                    Freelance
                  </option>
                </StyledSelect>
              </div>
              <div>
                <label className={experienceLabelClass}>Work location</label>
                <input
                  type="text"
                  value={workLocation}
                  onChange={(event) => setWorkLocation(event.target.value)}
                  placeholder="e.g. Bengaluru or Remote"
                  className={experienceInputClass}
                />
              </div>
            </div>
          </FormSection>
        </div>
        <div hidden={step !== 'dates'}>
          <FormSection
            title="When did you work there?"
            description="Roughly is fine. You can edit this later."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={experienceLabelClass}>
                  Start date<span className="text-red-600"> *</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className={experienceInputClass}
                />
              </div>
              <div>
                <label className={experienceLabelClass}>
                  End date{!isCurrent ? <span className="text-red-600"> *</span> : null}
                </label>
                <input
                  type="date"
                  disabled={isCurrent}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className={`${experienceInputClass} disabled:opacity-50`}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--ds-text-secondary)]">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(event) => setIsCurrent(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--ds-border)]"
              />
              I currently work in this role
            </label>
          </FormSection>
        </div>

        {requiresPublicIdentity ? (
          <div hidden={step !== 'links'}>
            <FormSection
              title="Company links"
              description="Required when a company website is listed."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={experienceLabelClass}>
                    Company website<span className="text-red-600"> *</span>
                  </label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(event) => setCompanyWebsite(event.target.value)}
                    placeholder="https://company.com"
                    className={experienceInputClass}
                  />
                </div>
                <div>
                  <label className={experienceLabelClass}>
                    Company LinkedIn<span className="text-red-600"> *</span>
                  </label>
                  <input
                    type="url"
                    value={companyLinkedinUrl}
                    onChange={(event) => setCompanyLinkedinUrl(event.target.value)}
                    placeholder="https://linkedin.com/company/acme"
                    className={experienceInputClass}
                  />
                </div>
              </div>
            </FormSection>
          </div>
        ) : null}

        <div hidden={step !== 'work'}>
          <FormSection
            title="What did you do there?"
            description="Pick catalog skills only — free-text tags are not accepted."
          >
            <div>
              <label className={experienceLabelClass}>
                Professional domain<span className="text-red-600"> *</span>
              </label>
              <input
                type="text"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="e.g. Software Engineering"
                className={experienceInputClass}
              />
            </div>
            <div>
              <label className={experienceLabelClass}>
                Responsibilities & accomplishments<span className="text-red-600"> *</span>
              </label>
              <textarea
                rows={4}
                value={responsibilities}
                onChange={(event) => setResponsibilities(event.target.value)}
                placeholder="Key responsibilities, projects, and impact…"
                className={experienceTextareaClass}
              />
            </div>
            <div>
              <label htmlFor="experience-skill-picker" className={experienceLabelClass}>
                Skills from catalog<span className="text-red-600"> *</span>
              </label>
              <StyledSelect
                id="experience-skill-picker"
                value=""
                aria-label="Select skill from catalog"
                onChange={(event) => {
                  const code = event.target.value;
                  if (!code) return;
                  setSelectedSkillCodes((current) =>
                    current.includes(code) ? current : [...current, code],
                  );
                }}
                className={`${nativeSelectClass} ${experienceInputClass} py-2`}
              >
                <option value="">Browse skills — choose from list…</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <optgroup key={category.id} label={category.name}>
                    {skillsForCategory(category.id).map((skill) => (
                      <option
                        key={skill.code}
                        value={skill.code}
                        disabled={selectedSkillCodes.includes(skill.code)}
                        className={nativeOptionClass}
                      >
                        {skill.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </StyledSelect>
              <input
                id="experience-skill-search"
                type="search"
                value={skillQuery}
                onChange={(event) => setSkillQuery(event.target.value)}
                placeholder="Or search skills…"
                aria-label="Search skills from catalog"
                className={`${experienceInputClass} mt-2`}
              />
              {selectedSkillCodes.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSkillCodes.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() =>
                        setSelectedSkillCodes((current) => current.filter((item) => item !== code))
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--ds-border)] bg-[var(--ds-surface-muted)] px-2.5 py-1 text-xs text-[var(--ds-text-secondary)]"
                    >
                      {SKILL_NAME_BY_CODE.get(code) ?? code}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              ) : null}
              {skillQuery.trim().length >= 2 ? (
                <ul className="mt-1 max-h-36 overflow-y-auto rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)]">
                  {SKILL_DEFINITIONS.filter((skill) => {
                    const q = skillQuery.trim().toLowerCase();
                    return (
                      (skill.name.toLowerCase().includes(q) ||
                        skill.code.toLowerCase().includes(q)) &&
                      !selectedSkillCodes.includes(skill.code)
                    );
                  })
                    .slice(0, 8)
                    .map((skill) => (
                      <li key={skill.code}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSkillCodes((current) => [...current, skill.code]);
                            setSkillQuery('');
                          }}
                          className="block w-full px-3 py-2 text-left text-sm text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface-hover)]"
                        >
                          {skill.name}
                        </button>
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
          </FormSection>
        </div>

        <div hidden={step !== 'proof'}>
          <FormSection title="Add proof of your work" required description={proofHint}>
            <div className="rounded-md border border-[var(--ds-border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--ds-text-muted)]">
                  {isCurrent
                    ? 'Current role: offer letter required.'
                    : 'Past role: offer letter and relieving or experience letter required.'}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    modalLetterCheck.valid
                      ? 'bg-[var(--ds-green-soft)] text-[var(--ds-green)]'
                      : 'bg-amber-50 text-amber-900'
                  }`}
                >
                  {modalLetterCheck.valid ? 'Requirements met' : 'Upload required'}
                </span>
              </div>

              {(savedModalDocs.length > 0 || modalPendingDocs.length > 0) && (
                <div className="mt-3 space-y-2">
                  {savedModalDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-[var(--ds-border)] px-3 py-2 text-xs"
                    >
                      <span className="truncate font-medium text-[var(--ds-text)]">
                        {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}: {doc.fileName}
                      </span>
                      <span className="text-[var(--ds-text-muted)]">Saved</span>
                    </div>
                  ))}
                  {modalPendingDocs.map((doc) => (
                    <div
                      key={doc.localId}
                      className="flex items-center justify-between gap-2 rounded-md border border-[var(--ds-green)]/30 bg-[var(--ds-green-soft)]/40 px-3 py-2 text-xs"
                    >
                      <span className="truncate font-medium text-[var(--ds-text)]">
                        {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}:{' '}
                        {doc.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setModalPendingDocs((current) =>
                            current.filter((item) => item.localId !== doc.localId),
                          )
                        }
                        className="text-[var(--ds-text-muted)] hover:text-red-600"
                        aria-label={`Remove ${doc.file.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!modalLetterCheck.valid ? (
                <p className="mt-3 text-xs text-amber-900">{modalLetterCheck.message}</p>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-end">
                <div>
                  <label htmlFor="modal-proof-document-type" className={experienceLabelClass}>
                    Document type
                  </label>
                  <StyledSelect
                    id="modal-proof-document-type"
                    value={modalNewDocType}
                    onChange={(event) =>
                      setModalNewDocType(
                        event.target.value as WorkExperienceDocumentDto['documentType'],
                      )
                    }
                    className={`${nativeSelectClass} ${experienceInputClass} py-2`}
                  >
                    <option value="OFFER_LETTER">Offer Letter</option>
                    <option value="RELIEVING_LETTER">Relieving Letter</option>
                    <option value="EXPERIENCE_LETTER">Experience Letter</option>
                    <option value="PAYSLIP">Payslip</option>
                    <option value="FORM_16">Form 16</option>
                    <option value="OTHER">Other Proof Document</option>
                  </StyledSelect>
                </div>
                <div>
                  <label htmlFor="modal-proof-document-file" className={experienceLabelClass}>
                    Proof document
                  </label>
                  <input
                    id="modal-proof-document-file"
                    type="file"
                    accept={EVIDENCE_ACCEPT}
                    onChange={(event) => setModalNewProofFile(event.target.files?.[0] ?? null)}
                    className="mt-1.5 block w-full text-xs text-[var(--ds-text-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--ds-green-soft)] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[var(--ds-green)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={onAddPendingDocument}
                  className={`${profileSecondaryButtonSmClass} h-11`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Add file
                </button>
              </div>
            </div>
          </FormSection>
        </div>

        <div hidden={step !== 'verify'}>
          <FormSection
            ref={verifierSectionRef}
            title="Who can verify it? (optional)"
            description="Save first, then we can email your manager or HR a secure verification link."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={experienceLabelClass}>
                  Verifier name<span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  value={verifierName}
                  onChange={(event) => setVerifierName(event.target.value)}
                  placeholder="Jane Manager"
                  className={experienceInputClass}
                />
              </div>
              <div>
                <label className={experienceLabelClass}>
                  Designation <span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  value={verifierDesignation}
                  onChange={(event) => setVerifierDesignation(event.target.value)}
                  placeholder="Engineering Lead"
                  className={experienceInputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="verifier-official-email" className={experienceLabelClass}>
                  Official work email<span className="text-red-600"> *</span>
                </label>
                <input
                  id="verifier-official-email"
                  type="email"
                  value={verifierEmail}
                  onChange={(event) => setVerifierEmail(event.target.value)}
                  placeholder="jane.manager@yourcompany.com"
                  autoComplete="email"
                  className={`${experienceInputClass} min-w-0 text-base sm:text-sm`}
                />
              </div>
            </div>
          </FormSection>
        </div>
      </form>
    </ViviVerificationShell>
  );
}
