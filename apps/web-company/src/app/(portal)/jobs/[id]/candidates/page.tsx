'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Award, Sparkles } from 'lucide-react';
import type { CandidateMatchDto, MatchRunDto } from '@hirekiwi/contracts';
import { companyJobsApi, formatApiError } from '../../../../../lib/api';
import { PageHeader } from '../../../../../components/ui';
import { card, pageStack, primaryButton } from '../../../../../lib/ui';

/**
 * JOB-03 — AI-suggested-candidates for a specific job, driven by the same PJF (person-job-fit)
 * scorer the TPO match-run pipeline already uses, instead of the 6-dim vector-only preview the
 * general `/students` browse page falls back to when nothing is scoped.
 */
export default function JobCandidatesPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const jobQuery = useQuery({
    queryKey: ['company-job', jobId],
    queryFn: () => companyJobsApi.get(jobId),
  });

  const runQuery = useQuery<MatchRunDto | null>({
    queryKey: ['company-job-match-run', jobId, runId],
    queryFn: () => (runId ? companyJobsApi.getMatchRun(jobId, runId) : Promise.resolve(null)),
    enabled: Boolean(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PENDING' || status === 'RUNNING' ? 1500 : false;
    },
  });

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleFindCandidates() {
    setError(null);
    setTriggering(true);
    try {
      const res = await companyJobsApi.createMatchRun(jobId);
      setRunId(res.runId);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setTriggering(false);
    }
  }

  const run = runQuery.data;
  const isRunning = run?.status === 'PENDING' || run?.status === 'RUNNING';
  const candidates: CandidateMatchDto[] = run?.shortlist?.candidates ?? [];

  return (
    <div className={pageStack}>
      <PageHeader
        title={`AI Suggested Candidates${jobQuery.data ? `: ${jobQuery.data.roleTitle}` : ''}`}
        description="Run the same structured skill-fit scoring TPOs use, to find the best verified candidates for this job."
        actions={
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="size-3.5" />
            Back to jobs
          </Link>
        }
      />

      {!run ? (
        <div className={`${card} flex flex-col items-center gap-3 py-12 text-center`}>
          <Sparkles className="size-8 text-violet-500" />
          <p className="max-w-sm text-sm text-zinc-600">
            No run yet. Trigger an AI-suggested-candidates run to rank verified students against
            this job&apos;s required skills.
          </p>
          <button
            type="button"
            onClick={handleFindCandidates}
            disabled={triggering}
            className={`${primaryButton} !w-auto px-5`}
          >
            {triggering ? 'Starting…' : 'Find AI Suggested Candidates'}
          </button>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        </div>
      ) : isRunning ? (
        <div className={`${card} flex flex-col items-center gap-2 py-12 text-center`}>
          <div className="size-6 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
          <p className="text-sm text-zinc-600">Scoring candidates against this job…</p>
        </div>
      ) : run.status === 'FAILED' ? (
        <div className={`${card} py-10 text-center`}>
          <p className="text-sm font-semibold text-rose-700">Run failed</p>
          <p className="mt-1 text-xs text-zinc-500">{run.errorMessage ?? 'Unknown error.'}</p>
          <button
            type="button"
            onClick={handleFindCandidates}
            className={`${primaryButton} !w-auto mt-4 px-5`}
          >
            Retry
          </button>
        </div>
      ) : candidates.length === 0 ? (
        <div className={`${card} py-10 text-center`}>
          <p className="text-sm font-semibold text-zinc-800">No candidates matched</p>
          <p className="mt-1 text-xs text-zinc-500">
            Eligible pool: {run.eligiblePoolCount ?? 0} verified students. None scored above the
            minimum skill-coverage threshold for this job.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            {candidates.length} candidate{candidates.length === 1 ? '' : 's'} ·{' '}
            {run.eligiblePoolCount ?? 0} in eligible pool
          </p>
          {candidates.map((candidate) => (
            <article
              key={candidate.studentId}
              className={`${card} flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between`}
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading text-base font-bold text-zinc-900">
                    {candidate.studentName}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    {candidate.headlineTier} Tier
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span>
                    Track: <strong className="text-zinc-700">{candidate.trackCode}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="size-3.5 text-zinc-400" />
                    Match Score:{' '}
                    <strong className="text-zinc-800">
                      {Math.round(candidate.matchScore * 100)}%
                    </strong>
                  </span>
                </div>
                {candidate.explanation?.why ? (
                  <p className="text-xs text-zinc-500">{candidate.explanation.why}</p>
                ) : null}
              </div>
              <Link
                href={`/students/${candidate.studentId}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                View Profile
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
