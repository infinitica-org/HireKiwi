'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CalendarDays,
  EyeOff,
  Flag,
  GraduationCap,
  MapPin,
  Monitor,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { StudentJobCard } from '@hirekiwi/contracts';
import { AppliedBadge, VerifiedBadge } from '@hirekiwi/ui';
import { tintFor } from '@/components/dashboard/OpportunityFeed';
import { EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from '@/lib/jobs-url-state';

interface JobCardProps {
  job: StudentJobCard;
  onToggleSave: (job: StudentJobCard, saved: boolean) => void;
  onHide: (job: StudentJobCard) => void;
  onReport: (job: StudentJobCard) => void;
}

function experienceText(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  const low = min ?? 0;
  const high = max ?? low;
  if (high === 0) return 'Fresher';
  return low === high ? `${low} years` : `${low}–${high} years`;
}

const ICON_BUTTON =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white';

/** One job in the list: what it is, who posted it, how well it fits, and quick actions. */
export function JobCard({ job, onToggleSave, onHide, onReport }: JobCardProps) {
  const facts: { icon: LucideIcon; text: string }[] = [
    {
      icon: Briefcase,
      text: job.employmentType
        ? (EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType)
        : '',
    },
    { icon: Monitor, text: job.workMode ? (WORK_MODE_LABELS[job.workMode] ?? '') : '' },
    { icon: Banknote, text: job.salary ?? '' },
    {
      icon: GraduationCap,
      text: experienceText(job.minYearsExperience, job.maxYearsExperience) ?? '',
    },
    {
      icon: Users,
      text: job.openings ? `${job.openings} opening${job.openings === 1 ? '' : 's'}` : '',
    },
    { icon: CalendarDays, text: job.lastDateToApply ? `Apply by ${job.lastDateToApply}` : '' },
  ].filter((fact) => fact.text !== '');

  return (
    <li className="flex h-full flex-col rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-[#161616] dark:hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            aria-hidden
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${tintFor(job.companyName)}`}
          >
            {job.companyName.trim().charAt(0).toUpperCase() || '?'}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm text-zinc-900 dark:text-white">
              <span className="truncate font-semibold">{job.companyName}</span>
              <VerifiedBadge
                verified={job.companyVerified}
                verifiedAt={job.companyVerifiedAt}
                variant="icon"
              />
            </p>
            {job.location ? (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {job.location}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/student/jobs/${job.id}`}
          className="font-heading text-lg font-medium tracking-tight text-zinc-950 hover:underline dark:text-white"
        >
          {job.roleTitle}
        </Link>
        <AppliedBadge applied={job.applied} />
      </div>

      {job.tags.length > 0 || job.skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {job.tags.map((tag) => (
            <span
              key={`tag-${tag}`}
              className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              {tag}
            </span>
          ))}
          {job.skills.map((skill) => (
            <span
              key={`skill-${skill}`}
              className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      {job.fit?.topReason ? (
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{job.fit.topReason}</p>
      ) : null}

      <div className="mt-auto space-y-4 pt-4">
        {facts.length > 0 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {facts.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-1.5">
                <Icon className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-pressed={job.saved}
              aria-label={job.saved ? `Unsave ${job.roleTitle}` : `Save ${job.roleTitle}`}
              onClick={() => onToggleSave(job, !job.saved)}
              className={ICON_BUTTON}
            >
              {job.saved ? (
                <BookmarkCheck className="size-4 text-emerald-600" aria-hidden />
              ) : (
                <Bookmark className="size-4" aria-hidden />
              )}
              {job.saved ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              aria-label={`Hide ${job.roleTitle}`}
              onClick={() => onHide(job)}
              className={ICON_BUTTON}
            >
              <EyeOff className="size-4" aria-hidden /> Hide
            </button>
            <button
              type="button"
              aria-label={`Report ${job.roleTitle}`}
              onClick={() => onReport(job)}
              className={`${ICON_BUTTON} hover:text-red-600`}
            >
              <Flag className="size-4" aria-hidden /> Report
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/student/jobs/${job.id}`}
              className="inline-flex items-center whitespace-nowrap rounded-md border border-zinc-200 px-3.5 py-2 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              View more
            </Link>
            {job.applied ? null : (
              <Link
                href={`/student/jobs/${job.id}?apply=1`}
                aria-label={`Apply to ${job.roleTitle}`}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-zinc-900 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Apply
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
