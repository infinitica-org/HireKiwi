'use client';

import {
  AlertCircle,
  Briefcase,
  CalendarCheck,
  Check,
  ClipboardCheck,
  FileText,
  GraduationCap,
  History,
  ListChecks,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { JOB_SECTIONS, JobPostingForm } from './job-posting-form';
import type { JobForm, JobFormProblem } from '../lib/job-form';

const STEP_ICONS: Record<number, LucideIcon> = {
  1: Briefcase,
  2: FileText,
  3: ListChecks,
  4: GraduationCap,
  5: History,
  6: ClipboardCheck,
  7: CalendarCheck,
  8: Lock,
};

/** Horizontal step bar: an icon and a name per section. */
function Stepper({
  step,
  onStep,
  problems,
  visited,
}: {
  step: number;
  onStep: (next: number) => void;
  problems: JobFormProblem[];
  visited: ReadonlySet<number>;
}) {
  const withProblems = new Set(problems.map((problem) => problem.step));

  return (
    <nav
      aria-label="Job sections"
      className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-[#161616]"
    >
      <ol className="flex min-w-max items-center gap-1">
        {JOB_SECTIONS.map((section) => {
          const active = section.step === step;
          const hasProblem = visited.has(section.step) && withProblems.has(section.step);
          const done = visited.has(section.step) && !hasProblem && !active;
          const Icon = STEP_ICONS[section.step] ?? Briefcase;
          return (
            <li key={section.step} className="flex-1">
              <button
                type="button"
                onClick={() => onStep(section.step)}
                aria-current={active ? 'step' : undefined}
                title={section.description}
                className={`flex w-full items-center justify-center gap-2 rounded-md px-3.5 py-2.5 text-[13px] whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-zinc-950 font-semibold text-white dark:bg-white dark:text-zinc-950'
                    : hasProblem
                      ? 'font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40'
                      : 'font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'
                }`}
              >
                {hasProblem && !active ? (
                  <AlertCircle className="size-4 shrink-0" aria-hidden />
                ) : done ? (
                  <Check className="size-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                )}
                {section.title}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Step-by-step job form: the section bar on top, one section at a time below it, full width.
 * The pages own the step, the validation and the action buttons.
 */
export function JobWizard({
  step,
  onStep,
  form,
  onChange,
  companyName,
  titleInvalid,
  postedAt,
  problems,
  visited,
}: {
  step: number;
  onStep: (next: number) => void;
  form: JobForm;
  onChange: <K extends keyof JobForm>(key: K, value: JobForm[K]) => void;
  companyName: string;
  titleInvalid?: boolean;
  postedAt?: string;
  problems: JobFormProblem[];
  visited: ReadonlySet<number>;
}) {
  return (
    <div className="space-y-5">
      <Stepper step={step} onStep={onStep} problems={problems} visited={visited} />
      <JobPostingForm
        form={form}
        onChange={onChange}
        section={step}
        companyName={companyName}
        titleInvalid={titleInvalid}
        postedAt={postedAt}
      />
    </div>
  );
}
