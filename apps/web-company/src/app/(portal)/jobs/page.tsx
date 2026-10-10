'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Clock, MapPin, Pencil, Plus, Search, Sparkles, Users } from 'lucide-react';
import { JobVisibilityCheck } from '../../../components/job-visibility-check';
import { companyJobsApi, formatApiError } from '../../../lib/api';
import type { EmployerJobDto, JobOpeningStatus } from '@hirekiwi/contracts';

type Filter = 'ALL' | JobOpeningStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'OPEN', label: 'Open' },
  { id: 'DRAFT', label: 'Drafts' },
  { id: 'CLOSED', label: 'Closed' },
];

const STATUS_STYLE: Record<JobOpeningStatus, { label: string; className: string }> = {
  OPEN: {
    label: 'Open',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  DRAFT: {
    label: 'Draft',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  CLOSED: {
    label: 'Closed',
    className:
      'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  },
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
};

function postedOn(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function initials(title: string): string {
  const letters = title
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
  return letters || 'JB';
}

function skillLabel(code: string): string {
  return code
    .split('_')
    .map((word) => (word ? word[0] + word.slice(1).toLowerCase() : word))
    .join(' ');
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<EmployerJobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      try {
        const res = await companyJobsApi.list();
        setJobs(res.openings ?? []);
      } catch (err) {
        setError(formatApiError(err, 'Failed to load job postings.'));
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    loadJobs().catch(() => {});
  }, []);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ALL: jobs.length, OPEN: 0, DRAFT: 0, CLOSED: 0 };
    for (const job of jobs) c[job.status] += 1;
    return c;
  }, [jobs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs
      .filter((job) => filter === 'ALL' || job.status === filter)
      .filter((job) => !q || `${job.roleTitle} ${job.location ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [jobs, filter, query]);

  const showCards = !loading && visible.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pt-2 pb-16 font-sans">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
            Job openings
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your roles, required skills and applicants.
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-2xs transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <Plus className="size-4" />
          Post a job
        </Link>
      </header>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter jobs"
          className="inline-flex gap-1 rounded-md border border-zinc-200/80 bg-white p-1 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {f.label}
              <span
                className={`rounded px-1.5 text-[11px] tabular-nums ${
                  filter === f.id ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-800'
                }`}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>

        <label className="relative block w-full sm:w-64">
          <span className="sr-only">Search jobs</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles or locations…"
            className="w-full rounded-md border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </label>
      </div>

      <div
        className={
          showCards
            ? undefined
            : 'overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#161616]'
        }
      >
        {loading ? (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="size-10 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
              <Briefcase className="size-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
              {jobs.length === 0 ? 'No job openings yet' : 'No jobs match your filter'}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {jobs.length === 0
                ? 'Post your first role to start receiving applications from verified students.'
                : 'Try another status or search term.'}
            </p>
            {jobs.length === 0 ? (
              <Link
                href="/jobs/new"
                className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
              >
                <Plus className="size-4" />
                Post a job
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-3">
            {visible.map((job) => {
              const status = STATUS_STYLE[job.status];
              const skills = (job.requiredSkills ?? []).slice(0, 4);
              const hiddenSkills = Math.max(0, (job.requiredSkills?.length ?? 0) - skills.length);
              return (
                <li
                  key={job.openingId}
                  className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-[#161616] dark:hover:border-zinc-700"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {initials(job.roleTitle)}
                      </span>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-heading truncate text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
                              {job.roleTitle}
                            </h3>
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3.5" />
                              {job.location ?? 'Remote'}
                            </span>
                            <span>
                              {EMPLOYMENT_LABELS[job.employmentType ?? ''] ??
                                job.employmentType ??
                                'Full-time'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3.5" />
                              Posted {postedOn(job.createdAt)}
                            </span>
                          </p>
                        </div>

                        {(job.details?.tags?.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {job.details?.tags?.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {job.salaryDetails || skills.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {job.salaryDetails ? (
                              <span className="font-semibold text-zinc-900 dark:text-white">
                                {job.salaryDetails}
                              </span>
                            ) : null}
                            {job.salaryDetails && skills.length > 0 ? (
                              <span className="text-zinc-300 dark:text-zinc-600">·</span>
                            ) : null}
                            {skills.map((skill) => (
                              <span
                                key={skill.skillCode}
                                className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                              >
                                {skillLabel(skill.skillCode)}
                              </span>
                            ))}
                            {hiddenSkills > 0 ? (
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                +{hiddenSkills}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <JobVisibilityCheck jobId={job.openingId} jobTitle={job.roleTitle} />
                      <Link
                        href={`/jobs/${job.openingId}/edit`}
                        aria-label={`Edit ${job.roleTitle}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Link>
                      <Link
                        href={`/jobs/${job.openingId}/candidates`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300"
                      >
                        <Sparkles className="size-3.5" />
                        AI Candidates
                      </Link>
                      <Link
                        href={`/jobs/${job.openingId}/applicants`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                      >
                        <Users className="size-3.5" />
                        Applicants
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
