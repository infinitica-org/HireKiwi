'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  FilePlus2,
  Inbox,
  Plus,
  Search,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { EmployerApplicantCard } from '@hirekiwi/contracts';
import { useCompanyAccount } from '@/lib/use-company-account';
import { api, companyJobsApi } from '@/lib/api';
import { AccountErrorPanel, AccountLoadingPanel } from '@/components/account-state-panel';

/** Applicant lists are fetched per open job; cap the fan-out on the home page. */
const MAX_JOBS_FOR_STATS = 10;

type Activity = {
  id: string;
  icon: LucideIcon;
  tile: string;
  text: string;
  at: string;
  href: string;
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${String(minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${String(hours)}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${String(days)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  loading,
}: {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  href: string;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-zinc-200/80  p-5 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-[#161616]"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
      {loading ? (
        <div className="mt-3 h-9 w-14 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-zinc-950 dark:text-white">
          {value}
        </p>
      )}
      <p className="mt-1 text-xs text-zinc-400">{hint}</p>
    </Link>
  );
}

export default function CompanyHomePage() {
  const { data: account, isLoading: accountLoading, isError, error } = useCompanyAccount();

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['company', 'jobs'],
    queryFn: () => companyJobsApi.list(),
  });

  const jobs = useMemo(() => jobsData?.openings ?? [], [jobsData]);
  const openJobs = useMemo(
    () => jobs.filter((j) => j.status === 'OPEN').slice(0, MAX_JOBS_FOR_STATS),
    [jobs],
  );

  const applicantQueries = useQueries({
    queries: openJobs.map((job) => ({
      queryKey: ['company', 'jobs', job.openingId, 'applicants', 'home'],
      queryFn: () => api.employer.listApplicants(job.openingId, { limit: 50 }),
      staleTime: 30_000,
    })),
  });
  const applicantsLoading = jobsLoading || applicantQueries.some((q) => q.isLoading);

  const applicants = useMemo(() => {
    const rows: (EmployerApplicantCard & { roleTitle: string; jobId: string })[] = [];
    for (const q of applicantQueries) {
      if (!q.data) continue;
      for (const a of q.data.applicants) {
        rows.push({ ...a, roleTitle: q.data.job.roleTitle, jobId: q.data.job.id });
      }
    }
    return rows.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  }, [applicantQueries]);

  const newApplicants = applicants.filter((a) => a.status === 'APPLIED').length;
  const interviewing = applicants.filter((a) => a.status === 'INTERVIEWING').length;

  const activity = useMemo<Activity[]>(() => {
    const items: Activity[] = applicants.slice(0, 6).map((a) => ({
      id: a.applicationId,
      icon: UserPlus,
      tile: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40',
      text: `${a.candidateName} applied to ${a.roleTitle}`,
      at: a.appliedAt,
      href: `/jobs/${a.jobId}/applicants`,
    }));
    for (const job of jobs.slice(0, 4)) {
      items.push({
        id: `job-${job.openingId}`,
        icon: FilePlus2,
        tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40',
        text: `${job.roleTitle} ${job.status === 'DRAFT' ? 'saved as a draft' : 'posted'}`,
        at: job.createdAt,
        href: `/jobs/${job.openingId}/edit`,
      });
    }
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [applicants, jobs]);

  if (accountLoading) return <AccountLoadingPanel />;
  if (isError || !account) {
    return (
      <AccountErrorPanel
        message={
          error instanceof Error
            ? error.message
            : 'Something went wrong while loading your account.'
        }
      />
    );
  }

  const companyName = account.companyName || 'Your company';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pt-2 pb-16 font-sans">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
            {companyName} · Recruiting home
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your open roles, new applicants and latest activity in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-2xs transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <Plus className="size-4" />
            Post a job
          </Link>
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <Search className="size-4" />
            Search students
          </Link>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active jobs"
          value={jobs.filter((j) => j.status === 'OPEN').length}
          hint={`${String(jobs.length)} total, including drafts and closed`}
          icon={Briefcase}
          href="/jobs"
          loading={jobsLoading}
        />
        <StatCard
          label="New applicants"
          value={newApplicants}
          hint="Applied and waiting for your review"
          icon={Users}
          href="/applicants"
          loading={applicantsLoading}
        />
        <StatCard
          label="In interview"
          value={interviewing}
          hint="Candidates in the interview stage"
          icon={CalendarClock}
          href="/applicants"
          loading={applicantsLoading}
        />
      </div>

      {/* Recent activity */}
      <section className="rounded-lg border border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-[#161616]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">Recent activity</h2>
          <Link
            href="/applicants"
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            View applicants
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {jobsLoading || applicantsLoading ? (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="size-9 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </li>
            ))}
          </ul>
        ) : activity.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Inbox className="mx-auto size-6 text-zinc-300" />
            <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">
              No activity yet
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Post a job to start receiving applications from verified students.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {activity.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${item.tile}`}
                    >
                      <Icon className="size-4" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">
                      {item.text}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400">{timeAgo(item.at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
