'use client';

import { useState, type ReactNode } from 'react';
import { Lock, Plus, X } from 'lucide-react';
import { ChipGroup, SkillsEditor } from './ui';
import { LocationInput } from './location-input';
import {
  CURRENCIES,
  FUNCTION_CATEGORIES,
  HIRING_PRIORITIES,
  JOB_STATUS_CHOICES,
  JOB_TYPES,
  JOINING_TIMELINES,
  PAY_PERIODS,
  QUALIFICATIONS,
  WORK_AUTHORIZATION,
  WORK_MODES,
  type GoodToHaveSkill,
  type JobForm,
} from '../lib/job-form';
import { input as baseInput, label, textarea } from '../lib/ui';

/** A little slimmer than the shared input so a wide form stays calm. */
const input = baseInput.replace('h-10', 'h-9');

const sectionCard =
  'rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#161616]';
const hintClass = 'mt-1.5 text-xs text-zinc-500 dark:text-zinc-400';
const sectionGrid = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

/** The eight sections in order; the wizard shows one at a time. */
export const JOB_SECTIONS = [
  { step: 1, title: 'Basic information', description: 'Role, location and pay' },
  { step: 2, title: 'Job description', description: 'Summary and responsibilities' },
  { step: 3, title: 'Skills', description: 'Must-have and good-to-have' },
  { step: 4, title: 'Education', description: 'Qualification you expect' },
  { step: 5, title: 'Experience', description: 'Relevant and industry experience' },
  { step: 6, title: 'Assessments', description: 'Tests and interview rounds' },
  { step: 7, title: 'Hiring details', description: 'Openings, deadline, timeline' },
  { step: 8, title: 'Internal', description: 'For your team only' },
] as const;

function SectionHeading({
  step,
  title,
  description,
  internal = false,
}: {
  step: number;
  title: string;
  description: string;
  internal?: boolean;
}) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950">
        {step}
      </span>
      <div>
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
          {title}
          {internal ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Lock className="size-3" aria-hidden />
              Never shown to candidates
            </span>
          ) : null}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

function Field({
  id,
  text,
  required,
  hint,
  className,
  children,
}: {
  id: string;
  text: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={label}>
        {text} {required ? <span className="text-rose-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

function TextField({
  id,
  text,
  value,
  onChange,
  placeholder,
  required,
  hint,
  type = 'text',
  min,
  className,
}: {
  id: string;
  text: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  type?: 'text' | 'number' | 'date';
  min?: number | string;
  className?: string;
}) {
  return (
    <Field id={id} text={text} required={required} hint={hint} className={className}>
      <input
        id={id}
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={input}
      />
    </Field>
  );
}

function SelectField({
  id,
  text,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  hint,
  className,
}: {
  id: string;
  text: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Field id={id} text={text} hint={hint} className={className}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={input}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

function AreaField({
  id,
  text,
  value,
  onChange,
  placeholder,
  rows = 4,
  hint,
  className,
}: {
  id: string;
  text: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
  className?: string;
}) {
  return (
    <Field id={id} text={text} hint={hint} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={textarea}
      />
    </Field>
  );
}

function CheckField({
  id,
  text,
  checked,
  onChange,
}: {
  id: string;
  text: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2.5 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/50"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-zinc-300 accent-zinc-900"
      />
      {text}
    </label>
  );
}

/** Type a value and press Enter or comma to add it; click the x to remove it. */
function TagField({
  id,
  text,
  values,
  onChange,
  placeholder,
  hint,
  className,
}: {
  id: string;
  text: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hint?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim().replace(/,$/u, '').trim();
    setDraft('');
    if (!value || values.some((existing) => existing.toLowerCase() === value.toLowerCase())) return;
    onChange([...values, value]);
  };

  return (
    <Field id={id} text={text} hint={hint ?? 'Press Enter to add.'} className={className}>
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          className={input}
        />
      </div>
      {values.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 py-0.5 pr-1 pl-2 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((existing) => existing !== value))}
                className="flex size-4 items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Field>
  );
}

/** Good-to-have skills: a name plus how much it counts (1 = nice, 5 = almost required). */
function WeightedSkillsField({
  skills,
  onChange,
}: {
  skills: GoodToHaveSkill[];
  onChange: (next: GoodToHaveSkill[]) => void;
}) {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState(3);

  const add = () => {
    const value = name.trim();
    if (!value || skills.some((skill) => skill.name.toLowerCase() === value.toLowerCase())) return;
    onChange([...skills, { name: value, weight }]);
    setName('');
  };

  return (
    <div>
      <span className={label}>Good-to-have skills</span>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Good-to-have skill name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder="e.g. GraphQL"
          className={input}
        />
        <select
          aria-label="Weight"
          value={weight}
          onChange={(event) => setWeight(Number(event.target.value))}
          className={`${input} sm:w-44`}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              Weight {value}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <Plus className="size-4" />
          Add
        </button>
      </div>
      <p className={hintClass}>Weight 1 is a small plus; 5 is close to required.</p>
      {skills.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <li
              key={skill.name}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 py-0.5 pr-1 pl-2 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {skill.name}
              <span className="rounded bg-white px-1 text-[10px] text-zinc-500 dark:bg-zinc-900">
                {skill.weight}
              </span>
              <button
                type="button"
                aria-label={`Remove ${skill.name}`}
                onClick={() => onChange(skills.filter((existing) => existing.name !== skill.name))}
                className="flex size-4 items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function JobPostingForm({
  form,
  onChange,
  section,
  companyName,
  titleInvalid = false,
  postedAt,
}: {
  form: JobForm;
  onChange: <K extends keyof JobForm>(key: K, value: JobForm[K]) => void;
  /** Which section (1-8) to show. */
  section: number;
  companyName: string;
  titleInvalid?: boolean;
  /** Shown read-only on saved jobs; new jobs get it automatically on save. */
  postedAt?: string;
}) {
  const set =
    <K extends keyof JobForm>(key: K) =>
    (value: JobForm[K]) =>
      onChange(key, value);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-w-0 space-y-6">
      {section === 1 ? (
        <section className={sectionCard}>
          <SectionHeading
            step={1}
            title="Basic information"
            description="What the job is, where it is, and what it pays."
          />
          <div className="space-y-6">
            <Field id="job-title" text="Job title" required>
              <input
                id="job-title"
                value={form.title}
                onChange={(event) => onChange('title', event.target.value)}
                aria-invalid={titleInvalid}
                placeholder="e.g. Frontend Engineer Intern"
                className={`${input} ${titleInvalid ? 'border-rose-500!' : ''}`}
              />
              {titleInvalid ? (
                <p className="mt-1.5 text-xs text-rose-600">Job title is required.</p>
              ) : null}
            </Field>

            <div className={sectionGrid}>
              <SelectField
                id="job-function"
                text="Job function / role category"
                value={form.functionCategory}
                onChange={set('functionCategory')}
                options={FUNCTION_CATEGORIES}
              />
              <TextField
                id="job-department"
                text="Department / team"
                value={form.department}
                onChange={set('department')}
                placeholder="e.g. Platform engineering"
              />
              <Field id="job-company" text="Company">
                <input
                  id="job-company"
                  value={companyName}
                  readOnly
                  className={`${input} bg-zinc-50 text-zinc-500 dark:bg-zinc-900/40`}
                />
              </Field>

              <SelectField
                id="job-type"
                text="Job type"
                value={form.type}
                onChange={(value) => {
                  const match = JOB_TYPES.find((option) => option === value);
                  if (match) onChange('type', match);
                }}
                options={JOB_TYPES}
                placeholder="Select job type"
              />
              <SelectField
                id="job-work-mode"
                text="Work mode"
                value={form.workMode}
                onChange={(value) => {
                  const match = WORK_MODES.find((option) => option === value);
                  if (match) onChange('workMode', match);
                }}
                options={WORK_MODES}
                placeholder="Select work mode"
              />
              <SelectField
                id="job-work-auth"
                text="Work authorization requirement"
                value={form.workAuthorization}
                onChange={set('workAuthorization')}
                options={WORK_AUTHORIZATION}
              />

              <Field id="job-location" text="Location" required={form.workMode !== 'Remote'}>
                <LocationInput
                  id="job-location"
                  value={form.location}
                  onChange={set('location')}
                  placeholder="e.g. Bengaluru"
                  className={input}
                />
              </Field>
              <TextField
                id="job-min-years"
                text="Minimum experience (years)"
                type="number"
                min={0}
                value={form.minYears}
                onChange={set('minYears')}
              />
              <TextField
                id="job-max-years"
                text="Maximum experience (years)"
                type="number"
                min={0}
                value={form.maxYears}
                onChange={set('maxYears')}
              />
            </div>

            <fieldset className="space-y-3">
              <legend className={label}>Compensation</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <SelectField
                  id="job-currency"
                  text="Currency"
                  value={form.currency}
                  onChange={set('currency')}
                  options={CURRENCIES}
                  placeholder="Currency"
                />
                <TextField
                  id="job-pay-min"
                  text="Minimum"
                  type="number"
                  min={0}
                  value={form.payMin}
                  onChange={set('payMin')}
                  placeholder="8"
                />
                <TextField
                  id="job-pay-max"
                  text="Maximum"
                  type="number"
                  min={0}
                  value={form.payMax}
                  onChange={set('payMax')}
                  placeholder="12"
                />
                <SelectField
                  id="job-pay-period"
                  text="Per"
                  value={form.payPeriod}
                  onChange={set('payPeriod')}
                  options={PAY_PERIODS}
                  placeholder="Period"
                />
                <SelectField
                  id="job-pay-type"
                  text="Pay type"
                  value={form.payType}
                  onChange={(value) =>
                    onChange('payType', value === 'NEGOTIABLE' ? 'NEGOTIABLE' : 'FIXED')
                  }
                  options={['FIXED', 'NEGOTIABLE']}
                  placeholder="Type"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <CheckField
                  id="job-bonus"
                  text="Includes bonus"
                  checked={form.bonus}
                  onChange={set('bonus')}
                />
                <CheckField
                  id="job-equity"
                  text="Includes equity"
                  checked={form.equity}
                  onChange={set('equity')}
                />
              </div>
            </fieldset>
          </div>
        </section>
      ) : null}

      {section === 2 ? (
        <section className={sectionCard}>
          <SectionHeading
            step={2}
            title="Job description"
            description="Help candidates picture the role."
          />
          <div className="space-y-5">
            <AreaField
              id="job-summary"
              text="Short job summary"
              rows={3}
              value={form.summary}
              onChange={set('summary')}
              placeholder="Two or three lines on what this role is about."
            />
            <AreaField
              id="job-responsibilities"
              text="Responsibilities"
              value={form.responsibilities}
              onChange={set('responsibilities')}
              placeholder="One responsibility per line."
            />
            <AreaField
              id="job-day-to-day"
              text="Day-to-day activities"
              rows={3}
              value={form.dayToDay}
              onChange={set('dayToDay')}
            />
            <AreaField
              id="job-outcomes"
              text="Expected outcomes / KPIs"
              rows={3}
              value={form.outcomes}
              onChange={set('outcomes')}
              placeholder="What success looks like in the first 6–12 months."
            />
          </div>
        </section>
      ) : null}

      {section === 3 ? (
        <section className={sectionCard}>
          <SectionHeading
            step={3}
            title="Skills"
            description="Candidates are matched on verified results for the must-have skills."
          />
          <div className="space-y-5">
            <div>
              <span className={label}>
                Must-have skills <span className="text-rose-500">*</span>
              </span>
              <SkillsEditor skills={form.mustHave} onChange={set('mustHave')} />
            </div>
            <WeightedSkillsField skills={form.goodToHave} onChange={set('goodToHave')} />
            <div className={sectionGrid}>
              <TagField
                id="job-technical"
                text="Technical skills"
                values={form.technicalSkills}
                onChange={set('technicalSkills')}
                placeholder="e.g. REST APIs"
              />
              <TagField
                id="job-soft"
                text="Soft skills"
                values={form.softSkills}
                onChange={set('softSkills')}
                placeholder="e.g. Communication"
              />
              <TagField
                id="job-tools"
                text="Tools / technologies"
                values={form.tools}
                onChange={set('tools')}
                placeholder="e.g. Docker, Jira"
              />
              <TagField
                id="job-certifications"
                text="Certifications, if required"
                values={form.certifications}
                onChange={set('certifications')}
                placeholder="e.g. AWS Cloud Practitioner"
              />
              <TagField
                id="job-languages"
                text="Language requirements"
                values={form.languages}
                onChange={set('languages')}
                placeholder="e.g. English, Hindi"
                className="sm:col-span-2"
              />
            </div>
          </div>
        </section>
      ) : null}

      {section === 4 ? (
        <section className={sectionCard}>
          <SectionHeading
            step={4}
            title="Education"
            description="Academic background you expect."
          />
          <div className={sectionGrid}>
            <SelectField
              id="job-min-qualification"
              text="Minimum qualification"
              value={form.minimumQualification}
              onChange={set('minimumQualification')}
              options={QUALIFICATIONS}
            />
            <TextField
              id="job-preferred-degree"
              text="Preferred degree"
              value={form.preferredDegree}
              onChange={set('preferredDegree')}
              placeholder="e.g. B.E. / B.Tech"
            />
            <TextField
              id="job-specialization"
              text="Specialization (optional)"
              value={form.specialization}
              onChange={set('specialization')}
              placeholder="e.g. Computer Science"
            />
          </div>
        </section>
      ) : null}

      {section === 5 ? (
        <section className={sectionCard}>
          <SectionHeading
            step={5}
            title="Experience"
            description="The years range is set in Basic information."
          />
          <div className="space-y-5">
            <AreaField
              id="job-relevant-experience"
              text="Relevant experience"
              rows={3}
              value={form.relevantExperience}
              onChange={set('relevantExperience')}
              placeholder="e.g. Built and shipped production web apps."
            />
            <TextField
              id="job-industry-experience"
              text="Industry / domain experience"
              value={form.industryExperience}
              onChange={set('industryExperience')}
              placeholder="e.g. Fintech, e-commerce"
            />
          </div>
        </section>
      ) : null}

      {section === 6 ? (
        <section className={sectionCard}>
          <SectionHeading
            step={6}
            title="Assessment requirements"
            description="Which checks candidates go through."
          />
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CheckField
                id="job-assess-coding"
                text="Coding assessment"
                checked={form.coding}
                onChange={set('coding')}
              />
              <CheckField
                id="job-assess-technical"
                text="Technical assessment"
                checked={form.technical}
                onChange={set('technical')}
              />
              <CheckField
                id="job-assess-aptitude"
                text="Aptitude"
                checked={form.aptitude}
                onChange={set('aptitude')}
              />
              <CheckField
                id="job-assess-communication"
                text="Communication"
                checked={form.communication}
                onChange={set('communication')}
              />
              <CheckField
                id="job-assess-domain"
                text="Domain-specific test"
                checked={form.domainSpecific}
                onChange={set('domainSpecific')}
              />
            </div>
            {form.domainSpecific ? (
              <TextField
                id="job-assess-domain-note"
                text="Which domain?"
                value={form.domainSpecificNote}
                onChange={set('domainSpecificNote')}
                placeholder="e.g. Payments, healthcare data"
              />
            ) : null}
            <TextField
              id="job-interview-rounds"
              text="Interview rounds"
              type="number"
              min={0}
              value={form.interviewRounds}
              onChange={set('interviewRounds')}
              placeholder="e.g. 3"
            />
          </div>
        </section>
      ) : null}

      {section === 7 ? (
        <section className={sectionCard}>
          <SectionHeading
            step={7}
            title="Hiring details"
            description="How many people, by when, and the status of this opening."
          />
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TextField
                id="job-openings"
                text="Number of openings"
                type="number"
                min={1}
                value={form.openings}
                onChange={set('openings')}
              />
              <TextField
                id="job-deadline"
                text="Application deadline"
                type="date"
                min={today}
                value={form.deadline}
                onChange={set('deadline')}
              />
              <SelectField
                id="job-joining"
                text="Joining timeline"
                value={form.joiningTimeline}
                onChange={set('joiningTimeline')}
                options={JOINING_TIMELINES}
              />
              <div>
                <span className={label}>Job status</span>
                <ChipGroup
                  options={JOB_STATUS_CHOICES}
                  value={[form.status]}
                  onChange={(next) => next[0] && onChange('status', next[0])}
                />
                <p className={hintClass}>
                  &ldquo;On hold&rdquo; saves the job as a draft that students cannot see yet.
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Posted date and last updated:{' '}
              {postedAt
                ? new Date(postedAt).toLocaleDateString()
                : 'set automatically when you save'}
              .
            </p>
          </div>
        </section>
      ) : null}

      {section === 8 ? (
        <section
          className={`${sectionCard} border-amber-200/70 bg-amber-50/30 dark:border-amber-900/40`}
        >
          <SectionHeading
            step={8}
            title="Internal"
            description="For your team only. Candidates never see these."
            internal
          />
          <div className={sectionGrid}>
            <TextField
              id="job-ats-ref"
              text="ATS / internal reference ID"
              value={form.atsReferenceId}
              onChange={set('atsReferenceId')}
              placeholder="e.g. REQ-2041"
            />
            <SelectField
              id="job-priority"
              text="Hiring priority"
              value={form.hiringPriority}
              onChange={(value) =>
                onChange(
                  'hiringPriority',
                  (HIRING_PRIORITIES as readonly string[]).includes(value)
                    ? (value as JobForm['hiringPriority'])
                    : '',
                )
              }
              options={HIRING_PRIORITIES}
            />
            <TextField
              id="job-hiring-manager"
              text="Hiring manager / internal point of contact (optional)"
              value={form.hiringManager}
              onChange={set('hiringManager')}
              placeholder="Name or email"
              className="sm:col-span-2"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
