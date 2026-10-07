'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { ChipGroup, SkillsEditor, type SkillReq } from '../../../../components/ui';
import { LocationInput } from '../../../../components/location-input';
import { toRequiredSkills } from '../../../../lib/skill-catalog';
import { api, companyJobsApi, formatApiError } from '../../../../lib/api';
import { getCurrentUser } from '../../../../lib/auth';
import { input, label, textarea } from '../../../../lib/ui';

const EMPLOYMENT_TYPES = ['Full-time', 'Internship', 'Part-time'] as const;
const VERIFICATIONS = ['Endorsed experience', 'Certification', 'Project defended'] as const;

const sectionCard =
  'rounded-md border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]';

function SectionHeading({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950">
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

export default function PostJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<(typeof EMPLOYMENT_TYPES)[number][]>(['Full-time']);
  const [location, setLocation] = useState('');
  const [pay, setPay] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<SkillReq[]>([]);
  const [verifications, setVerifications] = useState<(typeof VERIFICATIONS)[number][]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const titleInvalid = attempted && title.trim().length === 0;

  async function submit(kind: 'publish' | 'draft') {
    setAttempted(true);
    if (!title.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { universities: campuses } = await api.campus.employerCampusAccess();
      const homeCampus = campuses[0];
      if (!homeCampus) {
        setError('No campuses are available to post this job to yet.');
        return;
      }
      const me = await getCurrentUser();
      const domainName = me?.email?.split('@')[1]?.split('.')[0];
      const companyName = domainName
        ? domainName.charAt(0).toUpperCase() + domainName.slice(1)
        : 'Employer Partner';

      const empType =
        type[0] === 'Internship'
          ? 'INTERNSHIP'
          : type[0] === 'Part-time'
            ? 'PART_TIME'
            : 'FULL_TIME';

      // Students of every university can apply; the row only needs one home campus.
      const created = await companyJobsApi.create({
        institutionId: homeCampus.institutionId,
        companyName,
        roleTitle: title.trim(),
        domain: 'SOFTWARE_IT',
        employmentType: empType,
        minYearsExperience: 0,
        maxYearsExperience: 3,
        location: location.trim() || 'Remote',
        salaryDetails: pay.trim() || undefined,
        roleDetails: description.trim() || undefined,
        requiredSkills: toRequiredSkills(skills),
      });
      if (kind === 'publish') await companyJobsApi.publish(created.openingId);

      router.push('/jobs');
    } catch (err) {
      setError(formatApiError(err, 'Failed to publish job opening.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl pt-2 pb-28 font-sans">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Back to jobs
      </Link>
      <header className="mt-3 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Post a job
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Describe the role, set the skills you need, and choose the proof candidates must show.
        </p>
      </header>

      {error ? (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <form
        id="post-job-form"
        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
        onSubmit={(event) => {
          event.preventDefault();
          void submit('publish');
        }}
      >
        <div className="min-w-0 space-y-6">
          <section className={sectionCard}>
            <SectionHeading
              step={1}
              title="Role basics"
              description="What the job is, where it is, and what it pays."
            />
            <div className="space-y-5">
              <div>
                <label htmlFor="job-title" className={label}>
                  Job title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="job-title"
                  value={title}
                  required
                  onChange={(e) => setTitle(e.target.value)}
                  aria-invalid={titleInvalid}
                  placeholder="e.g. Frontend Engineer Intern"
                  className={`${input} ${titleInvalid ? 'border-rose-500!' : ''}`}
                />
                {titleInvalid ? (
                  <p className="mt-1.5 text-xs text-rose-600">Job title is required.</p>
                ) : null}
              </div>

              <div>
                <span className={label}>Employment type</span>
                <ChipGroup options={EMPLOYMENT_TYPES} value={type} onChange={setType} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="job-location" className={label}>
                    Location / work mode
                  </label>
                  <LocationInput
                    id="job-location"
                    value={location}
                    onChange={setLocation}
                    placeholder="e.g. Bengaluru, Remote, or Hybrid"
                    className={input}
                  />
                </div>
                <div>
                  <label htmlFor="job-pay" className={label}>
                    Salary / compensation
                  </label>
                  <input
                    id="job-pay"
                    value={pay}
                    onChange={(e) => setPay(e.target.value)}
                    placeholder="e.g. ₹40,000 / month or ₹8–12 LPA"
                    className={input}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="job-description" className={label}>
                  Role scope &amp; responsibilities
                </label>
                <textarea
                  id="job-description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the projects and technical challenges the candidate will work on…"
                  className={textarea}
                />
              </div>
            </div>
          </section>

          <section className={sectionCard}>
            <SectionHeading
              step={2}
              title="Required skills"
              description="Candidates are matched on verified benchmark results for these skills."
            />
            <SkillsEditor skills={skills} onChange={setSkills} />
          </section>

          <section className={sectionCard}>
            <SectionHeading
              step={3}
              title="Proof of competency"
              description="Validation badges a candidate must have before applying."
            />
            <ChipGroup
              multiple
              options={VERIFICATIONS}
              value={verifications}
              onChange={setVerifications}
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className={sectionCard}>
            <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
              Preview
            </p>
            <div className="mt-3 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800">
                <Briefcase className="size-4.5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                  {title.trim() || 'Job title'}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {location.trim() || 'Remote'} · {type[0] ?? 'Full-time'}
                </p>
                {pay.trim() ? (
                  <p className="mt-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {pay.trim()}
                  </p>
                ) : null}
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60">
                <dt className="text-zinc-500">Skills</dt>
                <dd className="text-base font-semibold tabular-nums text-zinc-950 dark:text-white">
                  {skills.length}
                </dd>
              </div>
              <div className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60">
                <dt className="text-zinc-500">Proof required</dt>
                <dd className="text-base font-semibold tabular-nums text-zinc-950 dark:text-white">
                  {verifications.length}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border border-zinc-200/80 bg-zinc-50/70 p-5 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
              <Sparkles className="size-3.5" />
              Tips for a strong post
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Use a specific title, e.g. &ldquo;Backend Engineer Intern&rdquo;.</li>
              <li>Add 3–6 core skills with a realistic minimum level.</li>
              <li>Share the pay range — posts with pay get more applicants.</li>
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-zinc-500">
              <ShieldCheck className="size-3.5" />
              Only verified students can apply.
            </p>
          </div>
        </aside>
      </form>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-[#111111]/90">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-2 px-4 py-3 md:px-8 lg:pl-24">
          <Link
            href="/jobs"
            className="mr-auto text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit('draft')}
            className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Save as draft
          </button>
          <button
            type="submit"
            form="post-job-form"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-2xs transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Publishing…
              </>
            ) : (
              'Publish job'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
