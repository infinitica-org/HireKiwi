'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Clock, MapPin, Pencil, Plus, Search, Users } from 'lucide-react';
import { companyJobsApi, formatApiError } from '../../../lib/api';
import type { JobOpeningDto, JobOpeningStatus } from '@hirekiwi/contracts';

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

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobOpeningDto[]>([]);
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

      <div className="overflow-hidden rounded-md border border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-[#161616]">
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
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visible.map((job) => {
              const status = STATUS_STYLE[job.status];
              return (
                <li
                  key={job.openingId}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-zinc-50/60 sm:flex-row sm:items-center dark:hover:bg-zinc-800/30"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <Briefcase className="size-4.5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                          {job.roleTitle}
                        </p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
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
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                    <Link
                      href={`/jobs/${job.openingId}/applicants`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      <Users className="size-3.5" />
                      Applicants
                    </Link>
                    <Link
                      href={`/jobs/${job.openingId}/edit`}
                      aria-label={`Edit ${job.roleTitle}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Link>
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
