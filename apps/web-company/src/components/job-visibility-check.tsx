'use client';

import { useState } from 'react';
import { CheckCircle2, Eye, Loader2, XCircle } from 'lucide-react';
import type { EmployerJobVisibility } from '@hirekiwi/contracts';
import { Modal } from './ui';
import { companyJobsApi, formatApiError } from '../lib/api';

type CheckState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; result: EmployerJobVisibility };

/**
 * "Is my job live?" The answer comes from the API, which applies the same rules students are shown
 * jobs by, so it always matches what candidates actually see.
 */
export function JobVisibilityCheck({
  jobId,
  jobTitle,
  className,
}: {
  jobId: string;
  jobTitle: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CheckState>({ status: 'loading' });

  async function run() {
    setOpen(true);
    setState({ status: 'loading' });
    try {
      setState({ status: 'done', result: await companyJobsApi.checkVisibility(jobId) });
    } catch (err) {
      setState({ status: 'error', message: formatApiError(err, 'Could not check this job.') });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void run()}
        aria-label={`Check if ${jobTitle} is visible to students`}
        className={
          className ??
          'inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
        }
      >
        <Eye className="size-3.5" />
        Check visibility
      </button>

      <Modal open={open} title="Is this job live?" onClose={() => setOpen(false)}>
        {state.status === 'loading' ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" /> Checking what students can see…
          </p>
        ) : null}

        {state.status === 'error' ? (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-rose-700">
              {state.message}
            </p>
            <button
              type="button"
              onClick={() => void run()}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Try again
            </button>
          </div>
        ) : null}

        {state.status === 'done' ? (
          <div className="space-y-4">
            <div
              role="status"
              className={`flex items-start gap-3 rounded-md border p-3 ${
                state.result.visible
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              {state.result.visible ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
              ) : (
                <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {state.result.visible
                    ? 'Yes, every student can see this job and apply.'
                    : 'No, students cannot see this job yet.'}
                </p>
                <p className="mt-0.5 text-xs opacity-80">{jobTitle}</p>
              </div>
            </div>

            <ul className="space-y-2">
              {state.result.checks.map((check) => (
                <li key={check.id} className="flex items-start gap-2.5 text-sm">
                  {check.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden />
                  )}
                  <div>
                    <p className="font-medium text-zinc-900">{check.label}</p>
                    {check.message ? (
                      <p className="mt-0.5 text-xs text-zinc-500">{check.message}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
