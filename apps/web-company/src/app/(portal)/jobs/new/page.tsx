'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  Loader2,
  XCircle,
} from 'lucide-react';
import type { EmployerJobVisibility } from '@hirekiwi/contracts';
import { JobWizard } from '../../../../components/job-wizard';
import { JOB_SECTIONS } from '../../../../components/job-posting-form';
import { api, companyJobsApi, formatApiError } from '../../../../lib/api';
import {
  EMPTY_JOB_FORM,
  jobFormProblems,
  sampleJobForm,
  toJobPayload,
  type JobForm,
} from '../../../../lib/job-form';

const LAST_STEP = JOB_SECTIONS.length;

/** The test button only exists outside production. */
const SHOW_TEST_BUTTON = process.env.NODE_ENV !== 'production';

export default function PostJobPage() {
  const router = useRouter();
  const [form, setForm] = useState<JobForm>(EMPTY_JOB_FORM);
  const [step, setStep] = useState(1);
  const [visited, setVisited] = useState<ReadonlySet<number>>(new Set());
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    title: string;
    visibility: EmployerJobVisibility;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.employer
      .getCompany()
      .then((company) => {
        if (!cancelled) setCompanyName(company.displayName);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const problems = useMemo(() => jobFormProblems(form), [form]);
  const titleInvalid = attempted && form.title.trim().length === 0;

  const update = <K extends keyof JobForm>(key: K, value: JobForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const goTo = (next: number) => {
    setVisited((current) => new Set([...current, step, next]));
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => {
    const here = problems.find((problem) => problem.step === step);
    if (here) {
      setAttempted(true);
      setVisited((current) => new Set([...current, step]));
      setError(here.message);
      return;
    }
    goTo(Math.min(LAST_STEP, step + 1));
  };

  /** Posts a complete sample job, publishes it, then asks the API if students can see it. */
  async function postTestJob() {
    setTesting(true);
    setError(null);
    setTestResult(null);
    try {
      const sample = sampleJobForm();
      const created = await companyJobsApi.create(toJobPayload(sample));
      try {
        await companyJobsApi.publish(created.openingId);
      } catch (publishError) {
        // Do not leave a half-posted test draft behind (for example when the plan limit is reached).
        await companyJobsApi.delete(created.openingId).catch(() => undefined);
        throw publishError;
      }
      const visibility = await companyJobsApi.checkVisibility(created.openingId);
      setTestResult({ title: sample.title, visibility });
    } catch (err) {
      setError(formatApiError(err, 'The test job could not be posted.'));
    } finally {
      setTesting(false);
    }
  }

  async function submit(kind: 'publish' | 'draft') {
    setAttempted(true);
    const first = problems[0];
    if (first) {
      setVisited((current) => new Set([...current, step, first.step]));
      setStep(first.step);
      setError(first.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const created = await companyJobsApi.create(toJobPayload(form));
      // A job put on hold stays a draft until the company opens it.
      if (kind === 'publish' && form.status === 'Open') {
        await companyJobsApi.publish(created.openingId);
      }
      router.push('/jobs');
    } catch (err) {
      setError(formatApiError(err, 'Failed to save the job.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl pt-2 pb-28 font-sans">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Back to jobs
      </Link>
      <header className="mt-3 mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Post a job
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Step {step} of {LAST_STEP}: {JOB_SECTIONS[step - 1]?.title}. Describe the role, set the
          skills you need, and choose the proof candidates must show.
        </p>
      </header>

      {SHOW_TEST_BUTTON ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50/60 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/30">
          <button
            type="button"
            disabled={testing || submitting}
            onClick={() => void postTestJob()}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {testing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FlaskConical className="size-3.5" />
            )}
            {testing ? 'Posting test job…' : 'Post test job'}
          </button>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Development only: posts a sample job with dummy data, then checks that students can see
            it. Delete it from Jobs afterwards.
          </p>
        </div>
      ) : null}

      {testResult ? (
        <div
          role="status"
          className={`mb-5 flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${
            testResult.visibility.visible
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {testResult.visibility.visible ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          ) : (
            <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="font-semibold">
              {testResult.visibility.visible
                ? 'Test job posted. Every student can see it.'
                : 'Test job posted, but students cannot see it yet.'}
            </p>
            <p className="mt-0.5 text-xs opacity-80">{testResult.title}</p>
            <ul className="mt-2 space-y-1">
              {testResult.visibility.checks
                .filter((check) => !check.ok)
                .map((check) => (
                  <li key={check.id} className="text-xs">
                    {check.message ?? check.label}
                  </li>
                ))}
            </ul>
            <Link href="/jobs" className="mt-2 inline-block text-xs font-medium underline">
              See it in your jobs
            </Link>
          </div>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      ) : null}

      <JobWizard
        step={step}
        onStep={goTo}
        form={form}
        onChange={update}
        companyName={companyName}
        titleInvalid={titleInvalid}
        problems={problems}
        visited={visited}
      />

      {/* Action bar pinned to the bottom of the window */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-[#111111]/90">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-2 px-4 py-3 md:px-8 lg:pl-24">
          <Link
            href="/jobs"
            className="mr-auto text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            Cancel
          </Link>
          {step > 1 ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() => goTo(step - 1)}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          ) : null}
          {step < LAST_STEP ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() => goTo(LAST_STEP)}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <ClipboardCheck className="size-4" />
              Review details
            </button>
          ) : null}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit('draft')}
            className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Save as draft
          </button>
          {step < LAST_STEP ? (
            <button
              type="button"
              disabled={submitting}
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Next
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit('publish')}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : form.status === 'On hold' ? (
                'Save job on hold'
              ) : (
                'Publish job'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
