'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import type { JobOpeningStatus } from '@hirekiwi/contracts';
import { Modal, PageHeader } from '../../../../../components/ui';
import { JOB_SECTIONS } from '../../../../../components/job-posting-form';
import { JobVisibilityCheck } from '../../../../../components/job-visibility-check';
import { JobWizard } from '../../../../../components/job-wizard';
import { api, companyJobsApi, formatApiError } from '../../../../../lib/api';
import {
  EMPTY_JOB_FORM,
  jobFormProblems,
  jobToForm,
  toJobPayload,
  type JobForm,
} from '../../../../../lib/job-form';
import { dangerButton, pageStack, primaryButton, secondaryButton } from '../../../../../lib/ui';

export default function EditJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<JobForm>(EMPTY_JOB_FORM);
  const [step, setStep] = useState(1);
  const visited = useMemo(() => new Set(JOB_SECTIONS.map((section) => section.step)), []);
  const problems = useMemo(() => jobFormProblems(form), [form]);
  const [status, setStatus] = useState<JobOpeningStatus>('DRAFT');
  const [postedAt, setPostedAt] = useState<string | undefined>();
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!params.id) return;
      try {
        const job = await companyJobsApi.get(params.id);
        if (cancelled) return;
        if (!job) {
          setError('This job could not be found.');
        } else {
          setForm(jobToForm(job));
          setStatus(job.status);
          setPostedAt(job.createdAt);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    api.employer
      .getCompany()
      .then((company) => {
        if (!cancelled) setCompanyName(company.displayName);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const update = <K extends keyof JobForm>(key: K, value: JobForm[K]) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const first = problems[0];
    if (first) {
      setAttempted(true);
      setStep(first.step);
      setError(first.message);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await companyJobsApi.update(params.id, toJobPayload(form));
      setSaved(true);
    } catch (err) {
      setError(formatApiError(err, 'Failed to save changes.'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    setError(null);
    try {
      await companyJobsApi.update(params.id, toJobPayload(form));
      const published = await companyJobsApi.publish(params.id);
      setStatus(published.status);
      setSaved(true);
    } catch (err) {
      setError(formatApiError(err, 'Failed to publish the job.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await companyJobsApi.delete(params.id);
      router.push('/jobs');
    } catch (err) {
      setDeleteOpen(false);
      setError(formatApiError(err, 'Failed to delete the job.'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    setSaving(true);
    try {
      await companyJobsApi.create({
        ...toJobPayload(form),
        roleTitle: `${form.title.trim()} (Copy)`,
      });
      setDeleteOpen(false);
      router.push('/jobs');
    } catch (err) {
      setDeleteOpen(false);
      setError(formatApiError(err, 'Failed to duplicate job.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={pageStack}>
        <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-200 bg-white">
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" /> Loading job opening...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStack}>
      <PageHeader
        title={form.title ? `Edit — ${form.title}` : 'Edit job'}
        description="Update the role, skills, assessments and hiring details."
      />

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
        >
          {error}
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={handleSave} noValidate>
        <JobWizard
          step={step}
          onStep={setStep}
          form={form}
          onChange={update}
          companyName={companyName}
          postedAt={postedAt}
          attempted={attempted}
          problems={problems}
          visited={visited}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/jobs" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
            Back to jobs
          </Link>
          {saved ? (
            <span
              role="status"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"
            >
              <Check className="size-3.5" /> Saved
            </span>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <JobVisibilityCheck jobId={params.id} jobTitle={form.title || 'this job'} />
            <button type="button" onClick={() => setDeleteOpen(true)} className={dangerButton}>
              Delete job
            </button>
            {status === 'DRAFT' ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handlePublish()}
                className={secondaryButton}
              >
                Publish
              </button>
            ) : null}
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>

      <Modal open={deleteOpen} title="Delete this job?" onClose={() => setDeleteOpen(false)}>
        <p className="text-sm text-zinc-600">
          Deleting removes the job and its details for good. You can keep a copy of it instead.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setDeleteOpen(false)} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleDuplicate()}
            className={secondaryButton}
          >
            Duplicate instead
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className={dangerButton}
          >
            {deleting ? 'Deleting…' : 'Delete job'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
