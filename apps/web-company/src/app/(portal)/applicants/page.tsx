'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowRight, Briefcase, ChevronDown, Search, UserCheck } from 'lucide-react';
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type EmployerApplicantCard,
} from '@smart/contracts';
import { api, companyJobsApi } from '../../../lib/api';

/** Applicant lists are fetched per job; keep the fan-out bounded on this overview. */
const MAX_JOBS = 20;

type StatusFilter = 'ALL' | ApplicationStatus;

const STATUS_TABS: StatusFilter[] = [
  'ALL',
  'APPLIED',
  'REVIEWING',
  'INTERVIEWING',
  'OFFERED',
  'HIRED',
  'REJECTED',
];

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  APPLIED:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
  REVIEWING:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  INTERVIEWING:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300',
  OFFERED:
    'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300',
  HIRED:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  REJECTED:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
  WITHDRAWN:
    'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

type Row = EmployerApplicantCard & { jobId: string; roleTitle: string };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase() ||
    '?'
  );
}

function appliedOn(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function fitTone(percent: number): string {
  if (percent >= 75) return 'bg-emerald-500';
  if (percent >= 50) return 'bg-amber-500';
  return 'bg-zinc-400';
}

export default function ApplicantsPage() {
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [query, setQuery] = useState('');

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['company', 'jobs'],
    queryFn: () => companyJobsApi.list(),
  });
  const jobs = useMemo(
    () => (jobsData?.openings ?? []).filter((j) => j.status !== 'DRAFT').slice(0, MAX_JOBS),
    [jobsData],
  );

  const applicantQueries = useQueries({
    queries: jobs.map((job) => ({
      queryKey: ['company', 'jobs', job.openingId, 'applicants', 'overview'],
      queryFn: () => api.employer.listApplicants(job.openingId, { limit: 100 }),
      staleTime: 30_000,
    })),
  });
  const loading = jobsLoading || applicantQueries.some((q) => q.isLoading);
  const failed = applicantQueries.some((q) => q.isError);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const q of applicantQueries) {
      if (!q.data) continue;
      for (const a of q.data.applicants) {
        out.push({ ...a, jobId: q.data.job.id, roleTitle: q.data.job.roleTitle });
      }
    }
    return out.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  }, [applicantQueries]);

  const inJob = useMemo(
    () => (jobFilter === 'all' ? rows : rows.filter((r) => r.jobId === jobFilter)),
    [rows, jobFilter],
  );

  const counts = useMemo(() => {
    const c: Partial<Record<StatusFilter, number>> = { ALL: inJob.length };
    for (const r of inJob) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [inJob]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inJob
      .filter((r) => status === 'ALL' || r.status === status)
      .filter((r) => !q || `${r.candidateName} ${r.roleTitle}`.toLowerCase().includes(q));
  }, [inJob, status, query]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pt-2 pb-16 font-sans">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
            Applicants
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Everyone who applied to your jobs, newest first.
          </p>
        </div>
        <div className="relative">
          <label htmlFor="job-filter" className="sr-only">
            Filter by job
          </label>
          <Briefcase className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <select
            id="job-filter"
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="w-full appearance-none rounded-md border border-zinc-200 bg-white py-2 pr-9 pl-9 text-sm font-medium text-zinc-800 shadow-2xs outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 sm:w-64 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          >
            <option value="all">All jobs</option>
            {jobs.map((job) => (
              <option key={job.openingId} value={job.openingId}>
                {job.roleTitle}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-400" />
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Filter by status"
          className="flex max-w-full gap-1 overflow-x-auto rounded-md border border-zinc-200/80 bg-white p-1 shadow-2xs [scrollbar-width:none] dark:border-zinc-800 dark:bg-[#161616]"
        >
          {STATUS_TABS.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(s)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                    : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'All' : EMPLOYER_APPLICATION_STATUS_LABELS[s]}
                <span
                  className={`rounded px-1.5 text-[11px] tabular-nums ${
                    active ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  {counts[s] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative block w-full lg:w-64">
          <span className="sr-only">Search applicants</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or role…"
            className="w-full rounded-md border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </label>
      </div>

      {failed ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Some jobs&apos; applicants couldn&apos;t be loaded. The list may be incomplete.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-[#161616]">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_140px_120px_96px] gap-4 border-b border-zinc-100 bg-zinc-50/70 px-5 py-2.5 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase md:grid dark:border-zinc-800 dark:bg-zinc-900/40">
          <span>Candidate</span>
          <span>Job</span>
          <span>Fit</span>
          <span>Status</span>
          <span className="text-right">Applied</span>
        </div>

        {loading ? (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="size-9 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
              <UserCheck className="size-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
              {rows.length === 0 ? 'No applicants yet' : 'No applicants match your filters'}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {rows.length === 0
                ? 'When verified students apply to your open jobs, they appear here.'
                : 'Try another job, status or search term.'}
            </p>
            {jobs.length === 0 ? (
              <Link
                href="/jobs/new"
                className="mt-5 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
              >
                Post a job
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visible.map((r) => (
              <li key={r.applicationId}>
                <Link
                  href={`/jobs/${r.jobId}/applicants`}
                  className="group grid grid-cols-1 gap-2 px-5 py-3.5 transition-colors hover:bg-zinc-50/70 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_140px_120px_96px] md:items-center md:gap-4 dark:hover:bg-zinc-800/40"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
                      {initials(r.candidateName)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-zinc-950 dark:text-white">
                        {r.candidateName}
                      </span>
                      {r.fit?.topReason ? (
                        <span className="block truncate text-xs text-zinc-500">
                          {r.fit.topReason}
                        </span>
                      ) : null}
                    </span>
                  </span>

                  <span className="truncate text-sm text-zinc-600 dark:text-zinc-300">
                    {r.roleTitle}
                  </span>

                  <span className="flex items-center gap-2">
                    {r.fit ? (
                      <>
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <span
                            className={`block h-full rounded-full ${fitTone(r.fit.matchPercent)}`}
                            style={{ width: `${String(r.fit.matchPercent)}%` }}
                          />
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                          {r.fit.matchPercent}%
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </span>

                  <span>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}
                    >
                      {r.statusLabel}
                    </span>
                  </span>

                  <span className="flex items-center justify-between gap-2 text-xs text-zinc-500 md:justify-end">
                    {appliedOn(r.appliedAt)}
                    <ArrowRight className="size-3.5 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-600" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
