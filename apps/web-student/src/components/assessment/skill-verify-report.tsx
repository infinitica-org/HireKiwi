'use client';

import Link from 'next/link';
import type { GradeSdeSkillFormResponse } from '@smart/contracts';
import { Button } from '@smart/ui';
import { skillNameForCode } from '@/lib/skill-declarations';
import { type AssessmentResultView } from '@/lib/competency-display';

export function SkillVerifyReport({
  grade,
  assessmentResult: _assessmentResult,
  catalogSkillCode,
  onDone,
}: {
  grade?: GradeSdeSkillFormResponse | null;
  assessmentResult?: AssessmentResultView | null;
  catalogSkillCode?: string;
  onDone: () => void;
}) {
  const skillLabel = catalogSkillCode
    ? skillNameForCode(catalogSkillCode)
    : (grade?.skillCode ?? 'Skill verification');

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6 text-[var(--text-primary)]">
      <header className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Assessment complete</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{skillLabel}</p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            ⏳ This skill is under verification
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-200 mt-2 leading-relaxed">
            We're reviewing your assessment results and will notify you as soon as your skill is
            verified and added to your profile.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="primary" className="flex-1" onClick={onDone}>
          Back to Skills
        </Button>
        <Link
          href="/student/assessments"
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground hover:bg-background"
        >
          View assessments
        </Link>
      </div>
    </div>
  );
}
