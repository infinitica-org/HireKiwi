'use client';

import { useEffect, useState } from 'react';
import type { GithubRepoSummary, ProjectDto } from '@hirekiwi/contracts';
import { Input } from '@hirekiwi/ui';
import { ArrowLeft, ArrowRight, ChevronRight, GitBranch, Loader2, PenLine } from 'lucide-react';
import { EvidenceFilesPicker } from '@/components/profile/EvidenceFilesPicker';
import { GithubImportPanel } from '@/components/profile/projects/GithubImportPanel';
import { parseStackTags } from '@/components/profile/projects/project-presenters';
import type { ProjectSkillOption } from '@/lib/project-form-skills';
import type { ProjectFormFields } from '@/lib/project-submission';
import { ViviSkillStep } from './ViviSkillStep';
import { useViviReady } from './useViviReady';
import { ViviVerificationShell } from './ViviVerificationShell';
import { ViviVerifyStep } from './ViviVerifyStep';

export type ProjectWizardStep =
  | 'choose'
  | 'github-list'
  | 'github-importing'
  | 'manual'
  /** The project was saved; the popup now shows its verification. */
  | 'submitted';

export type ViviProjectModalProps = {
  open: boolean;
  wizardStep: ProjectWizardStep;
  fields: ProjectFormFields;
  fieldErrors: Partial<Record<keyof ProjectFormFields, string>>;
  isPending: boolean;
  githubLogin: string | null;
  repos: GithubRepoSummary[] | null;
  reposLoading: boolean;
  reposError: string | null;
  importingRepo: string | null;
  skillOptions: readonly ProjectSkillOption[];
  skillsLoading: boolean;
  onClose: () => void;
  onFieldChange: (key: keyof ProjectFormFields, value: string) => void;
  onSkillCodesChange: (codes: string[]) => void;
  onSubmit: () => void;
  /** Th6-600 — PDF/PNG evidence files queued for upload after the project is created. */
  /** The project just submitted, kept up to date while it is being verified. */
  submittedProject?: ProjectDto | null;
  evidenceFiles?: File[];
  onEvidenceFilesChange?: (files: File[]) => void;
  onChooseGithub: () => void;
  onChooseManual: () => void;
  onBackToChoose: () => void;
  onRetryRepos: () => void;
  onSelectRepo: (repo: GithubRepoSummary) => void;
};

/** Six steps shown on the side panel: pick a source, then five for the project itself. */
const STEPS = ['Source', 'Skills', 'Project', 'Outcome', 'Links', 'Review', 'Verify'] as const;
type Stage = 'skills' | 'project' | 'outcome' | 'links' | 'review';
const STAGES: Stage[] = ['skills', 'project', 'outcome', 'links', 'review'];
const MIN_STORY_CHARS = 20;

/** Which step each field lives on, so a server-side error can take the student back to it. */
const STAGE_OF_FIELD: Partial<Record<keyof ProjectFormFields, Stage>> = {
  skillCodes: 'skills',
  title: 'project',
  problem: 'project',
  approach: 'project',
  outcome: 'outcome',
  githubUrl: 'links',
  liveUrl: 'links',
};

const textareaClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

const primaryButton =
  'inline-flex items-center gap-1.5 rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800';
const ghostButton =
  'inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-800';

function StoryField({
  id,
  label,
  value,
  error,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label className="font-medium text-zinc-900 dark:text-white" htmlFor={id}>
        {label}
        <span className="ml-1.5 text-xs font-normal text-zinc-500">
          (at least {MIN_STORY_CHARS} characters)
        </span>
      </label>
      <textarea
        id={id}
        name={id}
        rows={5}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={textareaClass}
        aria-invalid={error ? true : undefined}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

export function ViviProjectModal({
  open,
  wizardStep,
  fields,
  fieldErrors,
  isPending,
  githubLogin,
  repos,
  reposLoading,
  reposError,
  importingRepo,
  skillOptions,
  skillsLoading,
  onClose,
  onFieldChange,
  onSkillCodesChange,
  onSubmit,
  submittedProject = null,
  evidenceFiles = [],
  onEvidenceFilesChange,
  onChooseGithub,
  onChooseManual,
  onBackToChoose,
  onRetryRepos,
  onSelectRepo,
}: ViviProjectModalProps) {
  const [stage, setStage] = useState<Stage>('skills');
  const [stepError, setStepError] = useState<string | null>(null);
  // Placeholders first; real content once a moment has passed and the skills list has loaded.
  const ready = useViviReady(open, skillsLoading);

  // A fresh manual flow always starts at the skills step.
  useEffect(() => {
    if (!open || wizardStep !== 'manual') {
      setStage('skills');
      setStepError(null);
    }
  }, [open, wizardStep]);

  // After a failed submit, show the earliest step that has an error.
  useEffect(() => {
    const failing = STAGES.find((candidate) =>
      (Object.keys(fieldErrors) as (keyof ProjectFormFields)[]).some(
        (key) => fieldErrors[key] && STAGE_OF_FIELD[key] === candidate,
      ),
    );
    if (failing) setStage(failing);
  }, [fieldErrors]);

  const manual = wizardStep === 'manual';
  const stageIndex = STAGES.indexOf(stage);
  const submitted = wizardStep === 'submitted' && submittedProject !== null;
  const stepIndex = submitted ? STEPS.length - 1 : manual ? stageIndex + 1 : 0;
  const isLast = stage === 'review';

  const skillName = (code: string) =>
    skillOptions.find((option) => option.code === code)?.name ?? code;
  const selected = submitted
    ? parseStackTags(submittedProject.stack).map((tag) => ({ code: tag, label: tag }))
    : fields.skillCodes.map((code) => ({ code, label: skillName(code) }));

  /** What is missing on a step, in plain words; null when the step is done. */
  const problemOf = (candidate: Stage): string | null => {
    if (candidate === 'skills' && fields.skillCodes.length === 0)
      return 'Pick at least one skill you used.';
    if (candidate === 'project') {
      if (!fields.title.trim()) return 'Give your project a title.';
      if (fields.problem.trim().length < MIN_STORY_CHARS)
        return `Describe the problem in at least ${String(MIN_STORY_CHARS)} characters.`;
      if (fields.approach.trim().length < MIN_STORY_CHARS)
        return `Describe your approach in at least ${String(MIN_STORY_CHARS)} characters.`;
    }
    if (candidate === 'outcome' && fields.outcome.trim().length < MIN_STORY_CHARS)
      return `Describe the outcome in at least ${String(MIN_STORY_CHARS)} characters.`;
    return null;
  };

  const next = () => {
    const problem = problemOf(stage);
    if (problem) {
      setStepError(problem);
      return;
    }
    setStepError(null);
    const target = STAGES[stageIndex + 1];
    if (target) setStage(target);
  };
  const back = () => {
    setStepError(null);
    const target = STAGES[stageIndex - 1];
    if (target) setStage(target);
    else onBackToChoose();
  };
  const submitAll = () => {
    for (const candidate of STAGES) {
      const problem = problemOf(candidate);
      if (problem) {
        setStage(candidate);
        setStepError(problem);
        return;
      }
    }
    setStepError(null);
    onSubmit();
  };

  let heading = 'How do you want to add your project?';
  let description = 'Import from GitHub to fill in the details, or enter them yourself.';
  if (wizardStep === 'github-list') {
    heading = 'Pick a repository';
    description = 'Choose the repository to import details from.';
  } else if (wizardStep === 'github-importing') {
    heading = 'Importing from GitHub';
    description = 'Preparing your project draft…';
  } else if (submitted) {
    heading = 'Verify your project';
    description =
      'Vivi checks your project, then confirms you built it with a short voice interview.';
  } else if (manual) {
    const copy: Record<Stage, [string, string]> = {
      skills: [
        'Select the skills you used',
        'Pick the skills this project shows. Vivi verifies them against your work.',
      ],
      project: [
        'Tell us about your project',
        'The problem you set out to solve and how you went about it.',
      ],
      outcome: ['What came out of it?', 'Results, impact or what you learned.'],
      links: ['Add links and proof', 'Optional links and files that back up your work.'],
      review: [
        'Review and verify',
        'Check your answers. Vivi verifies that you built this project.',
      ],
    };
    [heading, description] = copy[stage];
  }

  const actions = submitted ? (
    <button type="button" onClick={onClose} className={primaryButton}>
      Done
    </button>
  ) : !manual ? (
    <>
      {wizardStep === 'choose' ? (
        <button type="button" onClick={onClose} className={ghostButton}>
          Cancel
        </button>
      ) : wizardStep === 'github-list' ? (
        <button type="button" onClick={onBackToChoose} className={ghostButton}>
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </button>
      ) : null}
      <button type="button" disabled className={primaryButton}>
        Continue
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </>
  ) : (
    <>
      <button type="button" onClick={back} disabled={isPending} className={ghostButton}>
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </button>
      {isLast ? (
        <button type="button" onClick={submitAll} disabled={isPending} className={primaryButton}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {isPending ? 'Submitting…' : 'Submit project'}
        </button>
      ) : (
        <button type="button" onClick={next} className={primaryButton}>
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </button>
      )}
    </>
  );

  return (
    <ViviVerificationShell
      loading={open && !ready}
      open={open}
      onClose={onClose}
      titleId="project-form-title"
      title="Project Verification"
      steps={STEPS}
      stepIndex={stepIndex}
      selectedHeading="Skills selected for verification"
      selectedHint="Selected skills will appear here. Review or remove them before continuing."
      selectedEmpty={
        <p>
          No skills selected yet.
          <br />
          Search and add skills from the right.
        </p>
      }
      selected={selected}
      onRemoveSelected={
        manual && !submitted
          ? (code) => onSkillCodesChange(fields.skillCodes.filter((c) => c !== code))
          : undefined
      }
      heading={heading}
      description={description}
      actions={actions}
    >
      {submitted ? <ViviVerifyStep project={submittedProject} /> : null}

      {wizardStep === 'choose' ? (
        <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {[
            {
              icon: GitBranch,
              title: 'Import from GitHub',
              body: 'Pull the repository details and README into the form automatically.',
              onClick: onChooseGithub,
            },
            {
              icon: PenLine,
              title: 'Add manually',
              body: 'Enter the project details yourself, without linking a repository.',
              onClick: onChooseManual,
            },
          ].map(({ icon: Icon, title, body, onClick }) => (
            <button
              key={title}
              type="button"
              onClick={onClick}
              className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900 dark:text-white">
                  {title}
                </span>
                <span className="mt-0.5 block text-[13px] text-zinc-500">{body}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}

      {wizardStep === 'github-list' ? (
        <GithubImportPanel
          githubLogin={githubLogin}
          showImport
          repos={repos}
          reposLoading={reposLoading}
          reposError={reposError}
          importingRepo={importingRepo}
          onToggle={onBackToChoose}
          onRetry={onRetryRepos}
          onSelectRepo={onSelectRepo}
          onManual={onChooseManual}
          wizardMode
        />
      ) : null}

      {wizardStep === 'github-importing' ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/50"
          aria-live="polite"
        >
          <Loader2 className="size-8 animate-spin text-pink-500" aria-hidden="true" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            Importing from GitHub
          </p>
          <p className="max-w-sm text-xs text-zinc-500">
            {importingRepo
              ? `Reading ${importingRepo} and preparing your project draft…`
              : 'Preparing your project draft…'}
          </p>
        </div>
      ) : null}

      {manual && !submitted ? (
        <>
          {stepError ? (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              {stepError}
            </p>
          ) : null}

          {/* Every step stays mounted (only hidden), so what was typed or chosen is kept. */}
          <div hidden={stage !== 'skills'} className="h-full">
            <ViviSkillStep
              options={skillOptions}
              selectedCodes={fields.skillCodes}
              onToggle={(code) =>
                onSkillCodesChange(
                  fields.skillCodes.includes(code)
                    ? fields.skillCodes.filter((c) => c !== code)
                    : [...fields.skillCodes, code],
                )
              }
              loading={skillsLoading}
              error={fieldErrors.skillCodes}
              disabled={isPending}
            />
          </div>

          <div hidden={stage !== 'project'} className="grid gap-4">
            <Input
              label="Title"
              name="title"
              value={fields.title}
              error={fieldErrors.title}
              disabled={isPending}
              onChange={(event) => onFieldChange('title', event.target.value)}
            />
            <StoryField
              id="problem"
              label="Problem"
              value={fields.problem}
              error={fieldErrors.problem}
              disabled={isPending}
              onChange={(value) => onFieldChange('problem', value)}
            />
            <StoryField
              id="approach"
              label="Approach"
              value={fields.approach}
              error={fieldErrors.approach}
              disabled={isPending}
              onChange={(value) => onFieldChange('approach', value)}
            />
          </div>

          <div hidden={stage !== 'outcome'}>
            <StoryField
              id="outcome"
              label="Outcome"
              value={fields.outcome}
              error={fieldErrors.outcome}
              disabled={isPending}
              onChange={(value) => onFieldChange('outcome', value)}
            />
          </div>

          <div hidden={stage !== 'links'} className="grid gap-4">
            <Input
              label="GitHub link (optional)"
              name="githubUrl"
              type="url"
              placeholder="https://github.com/org/repo"
              value={fields.githubUrl}
              error={fieldErrors.githubUrl}
              disabled={isPending}
              onChange={(event) => onFieldChange('githubUrl', event.target.value)}
            />
            <Input
              label="Live link (optional)"
              name="liveUrl"
              type="url"
              placeholder="https://your-project.example.com"
              value={fields.liveUrl}
              error={fieldErrors.liveUrl}
              disabled={isPending}
              onChange={(event) => onFieldChange('liveUrl', event.target.value)}
            />
            {onEvidenceFilesChange ? (
              <EvidenceFilesPicker
                files={evidenceFiles}
                onChange={onEvidenceFilesChange}
                disabled={isPending}
              />
            ) : null}
          </div>

          {stage === 'review' ? (
            <dl className="grid gap-4 text-sm">
              {(
                [
                  ['Title', fields.title],
                  ['Problem', fields.problem],
                  ['Approach', fields.approach],
                  ['Outcome', fields.outcome],
                  ['GitHub', fields.githubUrl],
                  ['Live link', fields.liveUrl],
                ] as const
              )
                .filter(([, value]) => value.trim() !== '')
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-zinc-500">{label}</dt>
                    <dd className="mt-0.5 line-clamp-3 break-words text-zinc-900 dark:text-white">
                      {value}
                    </dd>
                  </div>
                ))}
              <div>
                <dt className="text-xs font-medium text-zinc-500">Skills</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {selected.map((item) => (
                    <span
                      key={item.code}
                      className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {item.label}
                    </span>
                  ))}
                </dd>
              </div>
              {evidenceFiles.length > 0 ? (
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Files</dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-white">
                    {evidenceFiles.length} attached
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </>
      ) : null}
    </ViviVerificationShell>
  );
}
