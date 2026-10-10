'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EducationCatalogResponse } from '@hirekiwi/contracts';
import { ArrowLeft, ArrowRight, Calendar, Plus, X } from 'lucide-react';
import {
  CUSTOM_OPTION,
  EDUCATION_TYPE_OPTIONS,
  SCHOOL_STANDARDS,
  levelOfProgram,
  type EducationFormValues,
  type EducationLevelId,
  emptyEducationFormValues,
} from '@/lib/education-form';
import {
  programLevelForDegree,
  programScoreUiConfig,
  resolveProgramDegree,
} from '@/lib/education-form-program';
import {
  boardGroupsForLevel,
  buildEducationLevels,
  buildSpecializationGroups,
} from '@/lib/education-catalog';
import { computeTotalSemesters, syncSemesterRows } from '@/lib/education-degree-details';
import { EducationDegreeDetailsSection } from '@/components/profile/education/EducationDegreeDetailsSection';
import {
  EDUCATION_MODAL_FIELD,
  EDUCATION_MODAL_SCORE_INPUT,
  EducationFormField,
} from '@/components/profile/education/education-details-modal-ui';
import { StyledSelect } from '@/components/ui/styled-select';

interface EducationDetailsModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: EducationFormValues;
  submitting: boolean;
  formError: string | null;
  /** Degrees and specializations from the catalog; the built-in lists are used until it loads. */
  catalog?: EducationCatalogResponse;
  onClose: () => void;
  onSubmit: (values: EducationFormValues) => void;
}

function yearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 1; y >= current - 40; y -= 1) years.push(y);
  return years;
}

const YEARS = yearOptions();

type StepId = 'level' | 'where' | 'program' | 'when' | 'score';

/** Each visible step shows one or more of these panels, so related questions sit together. */
const PANELS_OF: Record<StepId, StepId[]> = {
  level: ['level', 'where'],
  where: ['where'],
  program: ['program', 'when'],
  when: ['when'],
  score: ['score'],
};

const STEP_LABEL: Record<StepId, string> = {
  level: 'Level',
  where: 'Where',
  program: 'Program',
  when: 'When',
  score: 'Score',
};

export function EducationDetailsModal({
  open,
  mode,
  initialValues,
  submitting,
  formError,
  catalog,
  onClose,
  onSubmit,
}: EducationDetailsModalProps) {
  const [values, setValues] = useState<EducationFormValues>(
    initialValues ?? emptyEducationFormValues(),
  );
  const [showCustomProgram, setShowCustomProgram] = useState(
    initialValues?.programDegree === CUSTOM_OPTION,
  );
  const [showCustomBoard, setShowCustomBoard] = useState(
    initialValues?.boardUniversity === CUSTOM_OPTION,
  );
  const [showCustomBranch, setShowCustomBranch] = useState(
    initialValues?.branchSpecialization === CUSTOM_OPTION,
  );
  const [levelChoice, setLevelChoice] = useState<EducationLevelId | null>(null);
  const [step, setStep] = useState<StepId>('level');
  const [stepError, setStepError] = useState<string | null>(null);
  // Friendly, per-field messages shown in red under the box that needs attention.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const levels = useMemo(() => buildEducationLevels(catalog), [catalog]);
  const resolvedProgram = useMemo(
    () => resolveProgramDegree(values.programDegree, values.customProgramDegree),
    [values.programDegree, values.customProgramDegree],
  );
  const specializationGroups = useMemo(
    () => buildSpecializationGroups(catalog, resolvedProgram),
    [catalog, resolvedProgram],
  );

  // The level is what was picked, or what the chosen program belongs to (editing, or picked below).
  const level: EducationLevelId | null =
    levelChoice ?? levelOfProgram(resolvedProgram, levels) ?? (showCustomProgram ? 'other' : null);
  const isSchool = level === 'school';

  const scoreConfig = useMemo(
    () => (resolvedProgram ? programScoreUiConfig(resolvedProgram) : null),
    [resolvedProgram],
  );

  useEffect(() => {
    if (!open) return;
    const base = initialValues ?? emptyEducationFormValues();
    setValues(base);
    setShowCustomProgram(base.programDegree === CUSTOM_OPTION);
    setShowCustomBoard(base.boardUniversity === CUSTOM_OPTION);
    setShowCustomBranch(base.branchSpecialization === CUSTOM_OPTION);
    setLevelChoice(null);
    setStep('level');
    setStepError(null);
    setFieldErrors({});
  }, [open, initialValues, mode]);

  useEffect(() => {
    if (!scoreConfig || scoreConfig.allowUnitChoice) return;
    setValues((prev) =>
      prev.scoreUnit === scoreConfig.defaultUnit
        ? prev
        : { ...prev, scoreUnit: scoreConfig.defaultUnit },
    );
  }, [scoreConfig?.defaultUnit, scoreConfig?.allowUnitChoice]);

  useEffect(() => {
    if (!resolvedProgram || programLevelForDegree(resolvedProgram) !== 'degree') return;
    const perYear = Number.parseInt(values.degreeDetails.semestersPerYear, 10) || 2;
    const total = computeTotalSemesters({
      program: resolvedProgram,
      startYear: values.startYear,
      endYear: values.endYear,
      currentlyStudying: values.currentlyStudying,
      semestersPerYear: perYear,
      lateralEntry: values.degreeDetails.lateralEntry,
    });
    setValues((prev) => {
      const nextRows = syncSemesterRows(total, prev.degreeDetails.semesterRows);
      if (nextRows.length === prev.degreeDetails.semesterRows.length) return prev;
      return {
        ...prev,
        degreeDetails: { ...prev.degreeDetails, semesterRows: nextRows },
      };
    });
  }, [
    resolvedProgram,
    values.startYear,
    values.endYear,
    values.currentlyStudying,
    values.degreeDetails.semestersPerYear,
    values.degreeDetails.lateralEntry,
  ]);

  if (!open) return null;

  const title = mode === 'edit' ? 'Edit Education Details' : 'Add Education Details';

  function patch(partial: Partial<EducationFormValues>) {
    setFieldErrors({});
    setValues((prev) => ({ ...prev, ...partial }));
  }

  /** Picking a level starts the question list over for that level. */
  function chooseLevel(next: EducationLevelId) {
    setLevelChoice(next);
    setStepError(null);
    setFieldErrors({});
    // A board or university picked for another level no longer applies.
    const stillListed = boardGroupsForLevel(next).some((group) =>
      group.names.includes(values.boardUniversity),
    );
    if (values.boardUniversity !== CUSTOM_OPTION && !stillListed) {
      patch({ boardUniversity: '' });
    }
    const first = levels.find((item) => item.id === next)?.programs;
    // "Other" with nothing listed is a free-text program; with catalog entries it is a pick-list.
    if (next === 'other' && !first?.length) {
      patch({ programDegree: CUSTOM_OPTION });
      setShowCustomProgram(true);
      return;
    }
    setShowCustomProgram(false);
    // School waits for the standard; the others wait for the program step.
    const keep = first?.includes(values.programDegree) ? values.programDegree : '';
    patch({ programDegree: next === 'school' ? '' : keep, customProgramDegree: '' });
  }

  const programChoices = levels.find((item) => item.id === level)?.programs ?? [];
  const programOptions = (
    programChoices.length > 0 ? programChoices : levels.flatMap((item) => item.programs)
  ).filter((name, at, all) => all.indexOf(name) === at);
  // A saved program that is not in the list (an older entry) still shows as chosen.
  if (
    values.programDegree &&
    values.programDegree !== CUSTOM_OPTION &&
    !programOptions.includes(values.programDegree)
  ) {
    programOptions.push(values.programDegree);
  }
  const boardGroups = boardGroupsForLevel(level);
  const boardKnown = boardGroups.some((group) => group.names.includes(values.boardUniversity));
  if (values.boardUniversity && values.boardUniversity !== CUSTOM_OPTION && !boardKnown) {
    boardGroups.unshift({ label: 'Saved', names: [values.boardUniversity] });
  }
  const branchNames = specializationGroups.flatMap((group) => group.names);
  const extraBranch =
    values.branchSpecialization &&
    values.branchSpecialization !== CUSTOM_OPTION &&
    !branchNames.includes(values.branchSpecialization)
      ? values.branchSpecialization
      : null;

  const steps: StepId[] = isSchool ? ['level', 'when', 'score'] : ['level', 'program', 'score'];
  const stepIndex = Math.max(0, steps.indexOf(step));
  const isLast = stepIndex === steps.length - 1;

  /** What is missing on one panel, as friendly messages keyed by field. */
  const panelProblems = (panel: StepId): Record<string, string> => {
    const found: Record<string, string> = {};
    switch (panel) {
      case 'level':
        if (!level)
          found.level = 'Please choose what you are adding, for example School or Undergraduate.';
        else if (isSchool && !resolvedProgram) {
          found.standard = 'Please pick the class you studied: 10th, 11th or 12th.';
        }
        break;
      case 'where': {
        if (!values.schoolInstitutionName.trim()) {
          found.school = isSchool
            ? 'Please type the name of your school.'
            : 'Please type the name of your college or institute.';
        }
        const board =
          values.boardUniversity === CUSTOM_OPTION
            ? values.customBoardUniversity.trim()
            : values.boardUniversity;
        if (!board) {
          found.board =
            values.boardUniversity === CUSTOM_OPTION
              ? 'Please type the name of your board or university.'
              : 'Please choose your board or university from the list.';
        }
        break;
      }
      case 'program':
        if (!resolvedProgram) {
          found.program = showCustomProgram
            ? 'Please type the name of your degree or program.'
            : 'Please choose your degree or program.';
        }
        break;
      case 'when':
        if (!values.educationType) {
          found.studyMode = 'Please tell us how you studied, for example full-time.';
        }
        if (!values.startYear) found.startYear = 'Please choose the year you started.';
        if (!values.currentlyStudying && !values.endYear) {
          found.endYear =
            'Please choose the year you finished, or tick that you are still studying.';
        }
        break;
      case 'score':
        if (!values.score.trim()) {
          found.score = 'Please enter your score so we can add this entry.';
        }
        break;
      default:
        break;
    }
    return found;
  };

  /** Everything missing across the panels the current step shows. */
  const stepProblems = (id: StepId): Record<string, string> =>
    PANELS_OF[id].reduce<Record<string, string>>(
      (all, panel) => ({ ...all, ...panelProblems(panel) }),
      {},
    );

  const goTo = (id: StepId) => {
    setStepError(null);
    setFieldErrors({});
    setStep(id);
  };
  const next = () => {
    const problems = stepProblems(step);
    if (Object.keys(problems).length > 0) {
      setFieldErrors(problems);
      return;
    }
    const target = steps[stepIndex + 1];
    if (target) goTo(target);
  };
  const back = () => {
    const target = steps[stepIndex - 1];
    if (target) goTo(target);
  };

  const headings: Record<StepId, [string, string]> = {
    level: ['Where did you study?', 'Pick the level, then the school or college and its board.'],
    where: isSchool
      ? ['Which school?', 'The name of the school and its board.']
      : [
          'Where did you study?',
          'The name of the college or institute, and its board or university.',
        ],
    program: [
      'What did you study, and when?',
      'Your degree, branch, how you studied and the years.',
    ],
    when: ['When did you study?', 'How you studied and the years.'],
    score: ['How did you score?', 'Add the result for this entry.'],
  };

  const primaryButton =
    'min-w-[120px] rounded-md  bg-[var(--ds-green)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--ds-green-hover)] disabled:opacity-60';
  const ghostButton =
    'inline-flex items-center gap-1.5 rounded-md border border-[var(--ds-border)] px-5 py-2 text-sm font-medium text-[var(--ds-text-secondary)] transition hover:bg-[var(--ds-surface-hover)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 p-4 font-sans">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="education-details-title"
        className="font-sans flex h-[min(94vh,620px)] w-full max-w-[720px] flex-col overflow-hidden rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-[0_18px_48px_rgba(15,23,42,0.12)]"
      >
        <div className="relative shrink-0 border-b border-[var(--ds-border)] px-6 py-4">
          <h3
            id="education-details-title"
            className="text-center text-[17px] font-semibold tracking-[-0.02em] text-[var(--ds-text)]"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[var(--ds-text-muted)] transition hover:bg-[var(--ds-surface-hover)]"
          >
            <X className="size-5" />
          </button>
        </div>

        <div
          className="h-1 w-full shrink-0 "
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={stepIndex + 1}
          aria-label={`${STEP_LABEL[step]}: step ${String(stepIndex + 1)} of ${String(steps.length)}`}
        >
          <div
            className="h-full bg-[var(--ds-green)] transition-all duration-300"
            style={{ width: `${String(((stepIndex + 1) / steps.length) * 100)}%` }}
          />
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!isLast) {
              next();
              return;
            }
            const problems = stepProblems(step);
            if (Object.keys(problems).length > 0) {
              setFieldErrors(problems);
              return;
            }
            onSubmit(values);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5">
            {formError ? (
              <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {formError}
              </p>
            ) : null}
            {stepError ? (
              <p
                role="alert"
                className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              >
                {stepError}
              </p>
            ) : null}

            <div className="mb-5">
              <h4 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--ds-text)]">
                {headings[step][0]}
              </h4>
              <p className="mt-1 text-sm text-[var(--ds-text-muted)]">{headings[step][1]}</p>
            </div>

            <div className="space-y-6">
              {/* Every step stays mounted (only hidden), so nothing typed or picked is lost. */}
              <div hidden={!PANELS_OF[step].includes('level')} className="space-y-5">
                <EducationFormField
                  id="edu-level"
                  label="What are you adding?"
                  required
                  error={fieldErrors.level}
                >
                  <StyledSelect
                    id="edu-level"
                    value={level ?? ''}
                    onChange={(e) => {
                      if (e.target.value) chooseLevel(e.target.value as EducationLevelId);
                    }}
                    className={EDUCATION_MODAL_FIELD}
                  >
                    <option value="">Select level</option>
                    {levels.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </StyledSelect>
                </EducationFormField>

                {isSchool ? (
                  <EducationFormField
                    id="edu-standard"
                    label="Which standard?"
                    required
                    error={fieldErrors.standard}
                  >
                    <StyledSelect
                      id="edu-standard"
                      value={values.programDegree}
                      onChange={(e) =>
                        patch({ programDegree: e.target.value, customProgramDegree: '' })
                      }
                      className={EDUCATION_MODAL_FIELD}
                    >
                      <option value="">Select standard</option>
                      {SCHOOL_STANDARDS.map((standard) => (
                        <option key={standard} value={standard}>
                          {standard.replace(' Standard', '')}
                        </option>
                      ))}
                    </StyledSelect>
                  </EducationFormField>
                ) : null}
              </div>

              <div hidden={!PANELS_OF[step].includes('where')} className="space-y-5">
                <EducationFormField
                  id="edu-school"
                  error={fieldErrors.school}
                  label={isSchool ? 'School name' : 'School / Institution name'}
                  required
                >
                  <input
                    id="edu-school"
                    type="text"
                    required
                    value={values.schoolInstitutionName}
                    onChange={(e) => patch({ schoolInstitutionName: e.target.value })}
                    placeholder={
                      isSchool
                        ? 'e.g. St. Mary’s Higher Secondary School'
                        : 'e.g. RV College of Engineering'
                    }
                    className={EDUCATION_MODAL_FIELD}
                  />
                </EducationFormField>

                <EducationFormField
                  id="edu-board"
                  label="Board / University"
                  required
                  error={fieldErrors.board}
                >
                  <StyledSelect
                    id="edu-board"
                    required
                    searchable
                    pinnedValues={[CUSTOM_OPTION]}
                    value={values.boardUniversity}
                    onChange={(e) => {
                      const nextBoard = e.target.value;
                      patch({ boardUniversity: nextBoard });
                      setShowCustomBoard(nextBoard === CUSTOM_OPTION);
                    }}
                    className={EDUCATION_MODAL_FIELD}
                  >
                    <option value="">Select board or university</option>
                    {boardGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.names.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value={CUSTOM_OPTION}>Other</option>
                  </StyledSelect>
                  <button
                    type="button"
                    onClick={() => {
                      patch({ boardUniversity: CUSTOM_OPTION });
                      setShowCustomBoard(true);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[var(--ds-link)] hover:underline"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Add board / university
                  </button>
                </EducationFormField>

                {showCustomBoard ? (
                  <EducationFormField label="Board / University (other)" required>
                    <input
                      type="text"
                      value={values.customBoardUniversity}
                      onChange={(e) => patch({ customBoardUniversity: e.target.value })}
                      placeholder="Enter board or university"
                      className={EDUCATION_MODAL_FIELD}
                    />
                  </EducationFormField>
                ) : null}
              </div>

              <div hidden={!PANELS_OF[step].includes('program')} className="space-y-5">
                <EducationFormField
                  id="edu-program"
                  label="Program / Degree"
                  required
                  error={fieldErrors.program}
                >
                  <StyledSelect
                    id="edu-program"
                    required
                    searchable
                    pinnedValues={[CUSTOM_OPTION]}
                    value={values.programDegree}
                    onChange={(e) => {
                      const nextProgram = e.target.value;
                      patch({ programDegree: nextProgram });
                      setShowCustomProgram(nextProgram === CUSTOM_OPTION);
                    }}
                    className={EDUCATION_MODAL_FIELD}
                  >
                    <option value="">Select program</option>
                    {programOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value={CUSTOM_OPTION}>Other</option>
                  </StyledSelect>
                </EducationFormField>

                {showCustomProgram ? (
                  <EducationFormField label="Program / Degree (other)" required>
                    <input
                      type="text"
                      value={values.customProgramDegree}
                      onChange={(e) => patch({ customProgramDegree: e.target.value })}
                      placeholder="Enter program or degree"
                      className={EDUCATION_MODAL_FIELD}
                    />
                  </EducationFormField>
                ) : null}

                <EducationFormField id="edu-branch" label="Branch / Specialization" optional>
                  <StyledSelect
                    id="edu-branch"
                    searchable
                    pinnedValues={[CUSTOM_OPTION]}
                    value={values.branchSpecialization}
                    onChange={(e) => {
                      const nextBranch = e.target.value;
                      patch({ branchSpecialization: nextBranch });
                      setShowCustomBranch(nextBranch === CUSTOM_OPTION);
                    }}
                    className={EDUCATION_MODAL_FIELD}
                  >
                    <option value="">Select branch</option>
                    {extraBranch ? <option value={extraBranch}>{extraBranch}</option> : null}
                    {specializationGroups.map((group) =>
                      group.label ? (
                        <optgroup key={group.label} label={group.label}>
                          {group.names.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        group.names.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))
                      ),
                    )}
                    <option value={CUSTOM_OPTION}>Other</option>
                  </StyledSelect>
                  <button
                    type="button"
                    onClick={() => {
                      patch({ branchSpecialization: CUSTOM_OPTION });
                      setShowCustomBranch(true);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[var(--ds-link)] hover:underline"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Add branch / specialization
                  </button>
                </EducationFormField>

                {showCustomBranch ? (
                  <EducationFormField label="Branch / Specialization (other)" optional>
                    <input
                      type="text"
                      value={values.customBranchSpecialization}
                      onChange={(e) => patch({ customBranchSpecialization: e.target.value })}
                      placeholder="Enter branch or specialization"
                      className={EDUCATION_MODAL_FIELD}
                    />
                  </EducationFormField>
                ) : null}
              </div>

              <div hidden={!PANELS_OF[step].includes('when')} className="space-y-5">
                <EducationFormField
                  id="edu-study-mode"
                  error={fieldErrors.studyMode}
                  label="Study mode"
                  required
                  helper="How you attended this program (stored with your record)."
                >
                  <StyledSelect
                    id="edu-study-mode"
                    required
                    value={values.educationType}
                    onChange={(e) => patch({ educationType: e.target.value })}
                    className={EDUCATION_MODAL_FIELD}
                  >
                    <option value="">Select study mode</option>
                    {EDUCATION_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </StyledSelect>
                </EducationFormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <EducationFormField
                    id="edu-start-year"
                    label="Start year"
                    required
                    error={fieldErrors.startYear}
                  >
                    <div className="relative">
                      <StyledSelect
                        id="edu-start-year"
                        required
                        value={values.startYear}
                        onChange={(e) => patch({ startYear: e.target.value })}
                        className={`${EDUCATION_MODAL_FIELD} appearance-none pr-10`}
                      >
                        <option value="">Select year</option>
                        {YEARS.map((year) => (
                          <option key={year} value={String(year)}>
                            {year}
                          </option>
                        ))}
                      </StyledSelect>
                      <Calendar
                        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ds-text-subtle)]"
                        aria-hidden="true"
                      />
                    </div>
                  </EducationFormField>

                  <EducationFormField
                    id="edu-end-year"
                    error={fieldErrors.endYear}
                    label="End year"
                    required={!values.currentlyStudying}
                    optional={values.currentlyStudying}
                  >
                    <div className="relative">
                      <StyledSelect
                        id="edu-end-year"
                        required={!values.currentlyStudying}
                        disabled={values.currentlyStudying}
                        value={values.endYear}
                        onChange={(e) => patch({ endYear: e.target.value })}
                        className={`${EDUCATION_MODAL_FIELD} appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <option value="">Select year</option>
                        {YEARS.map((year) => (
                          <option key={year} value={String(year)}>
                            {year}
                          </option>
                        ))}
                      </StyledSelect>
                      <Calendar
                        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ds-text-subtle)]"
                        aria-hidden="true"
                      />
                    </div>
                  </EducationFormField>
                </div>

                <label className="flex items-center gap-2.5 text-[13px] font-medium text-[var(--ds-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={values.currentlyStudying}
                    onChange={(e) =>
                      patch({
                        currentlyStudying: e.target.checked,
                        endYear: e.target.checked ? '' : values.endYear,
                      })
                    }
                    className="size-4 rounded border-[var(--ds-border)]"
                  />
                  I am currently studying here
                </label>
              </div>

              <div hidden={!PANELS_OF[step].includes('score')} className="space-y-5">
                {scoreConfig ? (
                  <div className="space-y-4 rounded-md border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-muted)]/60 p-4">
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--ds-text)]">
                        Academic scores
                      </p>
                      <p className="mt-0.5 text-[12px] text-[var(--ds-text-muted)]">
                        Add the academic result relevant to this education entry.
                      </p>
                    </div>

                    <EducationFormField
                      id="edu-score"
                      error={fieldErrors.score}
                      label={scoreConfig.scoreLabel}
                      required
                      helper={scoreConfig.scoreHelper}
                    >
                      <div
                        className={
                          scoreConfig.allowUnitChoice
                            ? 'grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_9.5rem]'
                            : 'grid grid-cols-1'
                        }
                      >
                        <input
                          id="edu-score"
                          type="text"
                          inputMode="decimal"
                          required
                          value={values.score}
                          onChange={(e) => patch({ score: e.target.value })}
                          placeholder={
                            scoreConfig.level === 'degree' ? 'e.g. 8.5 or 92.4' : 'e.g. 92.4'
                          }
                          className={`${EDUCATION_MODAL_SCORE_INPUT} min-w-0 flex-1`}
                          data-testid="education-score-input"
                        />
                        {scoreConfig.allowUnitChoice ? (
                          <div
                            className="flex h-12 items-stretch overflow-hidden rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-1 shadow-sm"
                            role="group"
                            aria-label="Score unit"
                          >
                            {(
                              [
                                { value: 'percentage', label: '%' },
                                { value: 'cgpa', label: 'CGPA' },
                              ] as const
                            ).map((option) => {
                              const active = values.scoreUnit === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() => patch({ scoreUnit: option.value })}
                                  className={`flex-1 rounded-md text-sm font-semibold transition ${
                                    active
                                      ? 'bg-[var(--ds-green-soft)] text-[var(--ds-text)] shadow-sm'
                                      : 'text-[var(--ds-text-muted)] hover:bg-[var(--ds-surface-hover)]'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="flex h-12 items-center justify-center rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm font-semibold text-[var(--ds-text-muted)] sm:hidden">
                            %
                          </span>
                        )}
                      </div>
                      {!scoreConfig.allowUnitChoice ? (
                        <p className="mt-1.5 text-[11px] font-medium text-[var(--ds-text-muted)]">
                          Enter percentage as shown on your marksheet (0–100).
                        </p>
                      ) : null}
                    </EducationFormField>

                    {scoreConfig.showBacklogCheckbox &&
                    (!resolvedProgram || programLevelForDegree(resolvedProgram) !== 'degree') ? (
                      <label className="flex items-start gap-2.5 text-[13px] font-medium text-[var(--ds-text-secondary)]">
                        <input
                          type="checkbox"
                          checked={values.hasActiveBacklog}
                          onChange={(e) => patch({ hasActiveBacklog: e.target.checked })}
                          className="mt-0.5 size-4 rounded border-[var(--ds-border)]"
                        />
                        I currently have active academic backlogs (standing arrears).
                      </label>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[12px] text-[var(--ds-text-muted)]">
                    Select a program to enter the academic score for this entry.
                  </p>
                )}

                {resolvedProgram && programLevelForDegree(resolvedProgram) === 'degree' ? (
                  <EducationDegreeDetailsSection
                    program={resolvedProgram}
                    values={values}
                    onPatchDegreeDetails={(partial) =>
                      patch({
                        degreeDetails: { ...values.degreeDetails, ...partial },
                      })
                    }
                    onProofFile={(file) => patch({ courseProofFile: file })}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--ds-border)] bg-[var(--ds-surface)] px-6 py-4">
            {stepIndex === 0 ? (
              <button type="button" onClick={onClose} className={ghostButton}>
                Cancel
              </button>
            ) : (
              <button type="button" onClick={back} className={ghostButton}>
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </button>
            )}
            {isLast ? (
              <button type="submit" disabled={submitting} className={primaryButton}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className={`${primaryButton} inline-flex items-center justify-center gap-1.5`}
              >
                Continue
                <ArrowRight className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
