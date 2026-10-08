import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { JobRequirementRow, JobRequirementStatus } from '@hirekiwi/contracts';

const STATUS_LABEL: Record<JobRequirementStatus, string> = {
  MET: 'Met',
  PARTIAL: 'Partly met',
  MISSING: 'Missing',
};
const STATUS_STYLE: Record<JobRequirementStatus, string> = {
  MET: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PARTIAL: 'bg-amber-50 text-amber-800 border-amber-200',
  MISSING: 'bg-red-50 text-red-800 border-red-200',
};

function level(value: string | null): string {
  return value ? value.charAt(0) + value.slice(1).toLowerCase() : 'Not verified';
}

/** Required skills against the student's current level, with a next step for every gap (Th6-383). */
export function JobRequirements({ requirements }: { requirements: JobRequirementRow[] }) {
  if (requirements.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        This job does not list required skills yet, so we cannot compare them with yours.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {requirements.map((row) => {
        const mandatoryGap = row.importance === 'MANDATORY' && row.status !== 'MET';
        return (
          <li
            key={row.skillCode}
            data-testid={`requirement-${row.skillCode}`}
            data-mandatory-gap={mandatoryGap}
            className={`rounded-lg border p-4 ${
              mandatoryGap
                ? 'border-red-200 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/20'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{row.skillName}</span>
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {row.importance === 'MANDATORY' ? 'Mandatory' : 'Preferred'}
                </span>
              </div>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[row.status]}`}
              >
                {STATUS_LABEL[row.status]}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-zinc-500">Required level</dt>
                <dd className="font-medium">{level(row.requiredProficiency)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Your level</dt>
                <dd className="font-medium">{level(row.studentProficiency)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Evidence</dt>
                <dd className="font-medium">
                  {row.evidenceRequired === 0
                    ? 'None required'
                    : `${row.evidenceMet} of ${row.evidenceRequired}`}
                </dd>
              </div>
            </dl>

            {row.action ? (
              <Link
                href={row.action.href}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"
              >
                {row.action.label}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
