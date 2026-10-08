'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
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
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import { Alert, AppliedBadge, Button, ErrorState, LoadingState, VerifiedBadge } from '@hirekiwi/ui';
import { api } from '@/lib/api';
import { EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from '@/lib/jobs-url-state';
import { tintFor } from '@/components/dashboard/OpportunityFeed';
import { ApplyJobDialog } from '@/components/applications/ApplyJobDialog';
import { HideJobDialog } from '@/components/jobs/HideJobDialog';
import { JobMoreDetails, jobDetailSections } from '@/components/jobs/JobMoreDetails';
import { JobSectionNav } from '@/components/jobs/JobSectionNav';
import { JobRequirements } from '@/components/jobs/JobRequirements';
import { ReportJobDialog } from '@/components/jobs/ReportJobDialog';
import { jobDetailKey } from '@/components/jobs/job-cache';
import { useJobActions } from '@/components/jobs/use-job-actions';

const CARD =
  'rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]';
const CARD_TITLE = 'font-heading text-base font-bold';

const VERIFY_BASE_URL = process.env.NEXT_PUBLIC_VERIFY_URL ?? 'http://localhost:3004';

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  // A job card's Apply button opens this page with ?apply=1 so the dialog is already open.
  const [applyOpen, setApplyOpen] = useState(useSearchParams().get('apply') === '1');
  const [hideOpen, setHideOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const actions = useJobActions(() => router.push('/student/jobs'));

  const query = useQuery({
    queryKey: jobDetailKey(id),
    queryFn: () => api.studentJobs.detail(id),
    retry: false,
  });

  if (query.isPending) {
    return <LoadingState message="Loading job…" />;
  }
  if (query.isError) {
    const missing = isHireKiwiApiError(query.error) && query.error.statusCode === 404;
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/student/jobs"
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to jobs
        </Link>
        {missing ? (
          <Alert tone="info" title="This job is not available">
            It may have been removed, or it is not open to you.
          </Alert>
        ) : (
          <ErrorState
            title="Could not load this job"
            message="Check your connection and try again."
            onRetry={() => void query.refetch()}
          />
        )}
      </div>
    );
  }

  const job = query.data;
  const employment = job.employmentType
    ? (EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType)
    : null;
  const workMode = job.workMode ? WORK_MODE_LABELS[job.workMode] : null;
  const experience =
    job.minYearsExperience === null && job.maxYearsExperience === null
      ? null
      : (job.maxYearsExperience ?? job.minYearsExperience) === 0
        ? 'Fresher'
        : `${job.minYearsExperience ?? 0}–${job.maxYearsExperience ?? job.minYearsExperience} years`;
  const overview: { icon: LucideIcon; label: string; value: string | null }[] = [
    { icon: Briefcase, label: 'Job type', value: employment },
    { icon: Monitor, label: 'Work mode', value: workMode },
    { icon: MapPin, label: 'Location', value: job.location },
    { icon: Banknote, label: 'Pay', value: job.salary },
    { icon: GraduationCap, label: 'Experience', value: experience },
    {
      icon: Users,
      label: 'Openings',
      value: job.openings ? String(job.openings) : null,
    },
    { icon: CalendarDays, label: 'Apply by', value: job.lastDateToApply },
  ];

  const sections = [
    ...(job.whyItMatches.length > 0 ? [{ id: 'sec-match', title: 'Why it matches' }] : []),
    ...(job.description ? [{ id: 'sec-description', title: 'About the role' }] : []),
    ...jobDetailSections(job.details, job.description),
    { id: 'sec-requirements', title: 'Required skills' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-12">
      <Link
        href="/student/jobs"
        className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to jobs
      </Link>

      {actions.error ? (
        <Alert tone="danger" role="alert">
          {actions.error}
        </Alert>
      ) : null}
      {!job.acceptingApplications ? (
        <Alert tone="warning" title="No longer accepting applications">
          This job is closed. You can still see it because you applied to it or saved it.
        </Alert>
      ) : null}

      <header className="rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs sm:p-6 dark:border-zinc-800 dark:bg-[#161616]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            {job.logoUrl ? (
              // Signed storage URL; not routed through next/image.
              <img
                src={job.logoUrl}
                alt=""
                className="size-14 shrink-0 rounded-xl border border-zinc-200 object-cover"
              />
            ) : (
              <span
                aria-hidden
                className={`flex size-14 shrink-0 items-center justify-center rounded-xl text-2xl font-bold ${tintFor(job.companyName)}`}
              >
                {job.companyName.trim().charAt(0).toUpperCase() || '?'}
              </span>
            )}
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-bold tracking-tight">{job.roleTitle}</h1>
                <AppliedBadge applied={job.applied} />
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
                  {job.companyName}
                  <VerifiedBadge
                    verified={job.companyVerified}
                    verifiedAt={job.companyVerifiedAt}
                    variant="icon"
                  />
                </span>
                {job.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden />
                    {job.location}
                  </span>
                ) : null}
              </p>
              {job.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5 pt-1">
                  {job.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
              {job.fit ? (
                <p className="pt-1 text-sm font-semibold" data-testid="detail-fit">
                  {job.fit.band === 'STRONG'
                    ? 'Strong fit'
                    : job.fit.band === 'MODERATE'
                      ? 'Good fit'
                      : 'Stretch'}{' '}
                  · {job.fit.matchPercent}% match
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {job.applied ? (
              <Link
                href="/student/applications"
                className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white"
              >
                View application
              </Link>
            ) : (
              <Button
                disabled={!job.acceptingApplications}
                title={
                  job.acceptingApplications
                    ? undefined
                    : 'This job is no longer accepting applications'
                }
                onClick={() => setApplyOpen(true)}
              >
                Apply
              </Button>
            )}
            <Button
              variant="outline"
              aria-pressed={job.saved}
              onClick={() => actions.toggleSave(job, !job.saved)}
            >
              {job.saved ? (
                <BookmarkCheck className="mr-1.5 size-4 text-emerald-600" aria-hidden />
              ) : (
                <Bookmark className="mr-1.5 size-4" aria-hidden />
              )}
              {job.saved ? 'Saved' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => setHideOpen(true)}>
              <EyeOff className="mr-1.5 size-4" aria-hidden /> Hide
            </Button>
            <Button variant="ghost" onClick={() => setReportOpen(true)}>
              <Flag className="mr-1.5 size-4" aria-hidden /> Report
            </Button>
          </div>
        </div>
      </header>

      <JobSectionNav sections={sections} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {job.whyItMatches.length > 0 ? (
            <section
              id="sec-match"
              aria-label="Why it matches"
              className={CARD}
              style={{ scrollMarginTop: '5.5rem' }}
            >
              <h2 className={CARD_TITLE}>Why it matches</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {job.whyItMatches.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {job.description ? (
            <section
              id="sec-description"
              aria-label="About the role"
              className={CARD}
              style={{ scrollMarginTop: '5.5rem' }}
            >
              <h2 className={CARD_TITLE}>About the role</h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
            </section>
          ) : null}

          <JobMoreDetails details={job.details} description={job.description} />

          <section
            id="sec-requirements"
            aria-label="Requirements"
            className={CARD}
            style={{ scrollMarginTop: '5.5rem' }}
          >
            <h2 className={CARD_TITLE}>Required skills and evidence</h2>
            <div className="mt-3">
              <JobRequirements requirements={job.requirements} />
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section aria-label="Overview" className={CARD}>
            <h2 className={CARD_TITLE}>Overview</h2>
            <dl className="mt-3 space-y-3" data-testid="detail-facts">
              {overview
                .filter((row) => row.value)
                .map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs text-zinc-500">{label}</dt>
                      <dd className="text-sm font-semibold">{value}</dd>
                    </div>
                  </div>
                ))}
            </dl>
          </section>

          <section aria-label="Company" className={CARD}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={CARD_TITLE}>{job.companyName}</h2>
              <VerifiedBadge verified={job.companyVerified} verifiedAt={job.companyVerifiedAt} />
            </div>
            {job.aboutCompany ? <p className="mt-2 text-sm">{job.aboutCompany}</p> : null}
            {job.companyVerified && job.companyId ? (
              <a
                href={`${VERIFY_BASE_URL}/companies/${job.companyId}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
              >
                View company page
              </a>
            ) : null}
          </section>
        </aside>
      </div>

      {applyOpen ? (
        <ApplyJobDialog open jobId={job.id} onClose={() => setApplyOpen(false)} />
      ) : null}
      <HideJobDialog
        open={hideOpen}
        jobTitle={job.roleTitle}
        onClose={() => setHideOpen(false)}
        onConfirm={(reason) => {
          setHideOpen(false);
          actions.hide(job, reason);
        }}
      />
      {reportOpen ? (
        <ReportJobDialog
          open
          jobId={job.id}
          jobTitle={job.roleTitle}
          onClose={() => setReportOpen(false)}
          onReported={() => router.push('/student/jobs')}
        />
      ) : null}
    </div>
  );
}
