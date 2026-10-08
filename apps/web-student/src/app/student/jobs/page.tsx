'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Briefcase, Bookmark } from 'lucide-react';
import type { StudentJobCard } from '@hirekiwi/contracts';
import { Alert, Button, EmptyState, ErrorState, LoadingState } from '@hirekiwi/ui';
import { api } from '@/lib/api';
import {
  activeFilters,
  clearFilters,
  parseJobsUrl,
  toJobsSearch,
  type JobsUrlState,
} from '@/lib/jobs-url-state';
import { HideJobDialog } from '@/components/jobs/HideJobDialog';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import { ReportJobDialog } from '@/components/jobs/ReportJobDialog';
import { STUDENT_JOBS_KEY, savedJobsKey } from '@/components/jobs/job-cache';
import { useJobActions } from '@/components/jobs/use-job-actions';

interface Notice {
  text: string;
  undoJobId?: string;
}

const NOTICE_MS = 8000;

function JobsContent() {
  const router = useRouter();
  const state = parseJobsUrl(useSearchParams());
  const setState = (next: JobsUrlState) =>
    router.replace(`/student/jobs${toJobsSearch(next)}`, { scroll: false });

  const [notice, setNotice] = useState<Notice | null>(null);
  const [hideTarget, setHideTarget] = useState<StudentJobCard | null>(null);
  const [reportTarget, setReportTarget] = useState<StudentJobCard | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const actions = useJobActions((hidden) =>
    setNotice({ text: `“${hidden.title}” hidden.`, undoJobId: hidden.jobId }),
  );

  const browse = useInfiniteQuery({
    queryKey: [...STUDENT_JOBS_KEY, 'list', state.type, state.mode, state.location],
    queryFn: ({ pageParam }) =>
      api.studentJobs.list({
        fit: 'ALL',
        type: state.type,
        mode: state.mode,
        location: state.location,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: state.view !== 'saved',
    retry: false,
  });
  const saved = useQuery({
    queryKey: savedJobsKey,
    queryFn: () => api.studentJobs.listSaved(),
    enabled: state.view === 'saved',
    retry: false,
  });

  const active = state.view === 'saved' ? saved : browse;
  const browsed = browse.data?.pages.flatMap((page) => page.jobs) ?? [];
  const jobs: StudentJobCard[] =
    state.view === 'saved'
      ? (saved.data?.jobs ?? [])
      : state.view === 'applied'
        ? browsed.filter((job) => job.applied)
        : browsed;
  const filtered = activeFilters(state).length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-12">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Jobs
        </h1>
        <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm dark:text-zinc-400">
          Openings from your university and verified companies.
        </p>
      </header>

      <nav
        aria-label="Jobs sections"
        className="flex items-center gap-1 overflow-x-auto border-b border-zinc-200 [scrollbar-width:none] dark:border-zinc-800 [&::-webkit-scrollbar]:hidden"
      >
        <div role="tablist" aria-label="View" className="flex items-center gap-1">
          {(['browse', 'saved', 'applied'] as const).map((view) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={state.view === view}
              onClick={() => setState({ ...state, view })}
              className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                state.view === view
                  ? 'border-zinc-900 text-zinc-950 dark:border-white dark:text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {view === 'browse' ? 'Browse' : view === 'saved' ? 'Saved jobs' : 'Applied'}
            </button>
          ))}
        </div>
      </nav>

      {state.view === 'browse' ? (
        <>
          <JobFilters state={state} onChange={setState} />
        </>
      ) : null}

      {actions.error ? (
        <Alert tone="danger" role="alert">
          {actions.error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert tone="info" role="status">
          <span className="flex flex-wrap items-center gap-3">
            {notice.text}
            {notice.undoJobId ? (
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => {
                  actions.undoHide(notice.undoJobId as string);
                  setNotice(null);
                }}
              >
                Undo
              </button>
            ) : null}
          </span>
        </Alert>
      ) : null}

      {active.isPending ? (
        <LoadingState
          message={state.view === 'saved' ? 'Loading saved jobs…' : 'Finding jobs for you…'}
        />
      ) : active.isError ? (
        <ErrorState
          title="Could not load jobs"
          message="Check your connection and try again."
          onRetry={() => void active.refetch()}
        />
      ) : jobs.length === 0 ? (
        state.view === 'saved' ? (
          <EmptyState
            icon={Bookmark}
            title="No saved jobs yet"
            description="Tap Save on a job to keep it here for later."
          />
        ) : state.view === 'applied' ? (
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            description="Jobs you apply to will show up here."
          />
        ) : (
          <EmptyState
            icon={Briefcase}
            title={filtered ? 'No jobs match these filters' : 'No jobs to show yet'}
            description={
              filtered
                ? 'Try removing a filter to see more openings.'
                : 'New openings from your university and verified companies will appear here.'
            }
            action={
              filtered ? (
                <Button variant="outline" onClick={() => setState(clearFilters(state))}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )
      ) : (
        <>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onToggleSave={(target, next) => actions.toggleSave(target, next)}
                onHide={setHideTarget}
                onReport={setReportTarget}
              />
            ))}
          </ul>
          {state.view !== 'saved' && browse.hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                disabled={browse.isFetchingNextPage}
                onClick={() => void browse.fetchNextPage()}
              >
                {browse.isFetchingNextPage ? 'Loading…' : 'Load more jobs'}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <HideJobDialog
        open={hideTarget !== null}
        jobTitle={hideTarget?.roleTitle ?? ''}
        onClose={() => setHideTarget(null)}
        onConfirm={(reason) => {
          if (hideTarget) actions.hide(hideTarget, reason);
          setHideTarget(null);
        }}
      />
      {reportTarget ? (
        <ReportJobDialog
          open
          jobId={reportTarget.id}
          jobTitle={reportTarget.roleTitle}
          onClose={() => setReportTarget(null)}
          onReported={(_jobId, already) => {
            setReportTarget(null);
            setNotice({
              text: already
                ? 'You already reported this job. It stays hidden for you.'
                : 'Thanks. We hid this job for you and will review it.',
            });
          }}
        />
      ) : null}
    </div>
  );
}

export default function JobsPage() {
  // useSearchParams needs a Suspense boundary during static rendering.
  return (
    <Suspense fallback={<LoadingState message="Finding jobs for you…" />}>
      <JobsContent />
    </Suspense>
  );
}
