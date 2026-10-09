'use client';

import { use, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import { HireKiwiLogo, TierBadge } from '@hirekiwi/ui';
import type { PublicCandidateProfileDto } from '@hirekiwi/contracts';
import { api } from '@/lib/api';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3005';

/** The public profile is always light, whatever the visitor's theme, like a printed résumé. */
const LIGHT_VARS = {
  '--surface': '#ffffff',
  '--surface-muted': '#ffffff',
  '--surface-border': '#e4e4e7',
  '--text-primary': '#18181b',
  '--text-muted': '#71717a',
} as CSSProperties;

/** web-verify has no icon library dependency — small inline SVGs match its existing pages. */
function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}
const ICON_PATH = {
  checkCircle: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  code: 'M10 20l4-16M6 8l-4 4 4 4M18 8l4 4-4 4',
  briefcase:
    'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-4 6a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2H4a2 2 0 00-2 2v4z',
  folderGit: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  link: 'M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5',
  externalLink: 'M14 5h5m0 0v5m0-5L10 14M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-5',
  award: 'M12 15a5 5 0 100-10 5 5 0 000 10zm-3.5 3.5L7 22l5-3 5 3-1.5-3.5M8.5 18.5L12 15l3.5 3.5',
  spinner:
    'M12 4V2m0 20v-2m8-8h2M2 12h2m14.14 6.14l1.42 1.42M4.44 4.44l1.42 1.42m0 12.28l-1.42 1.42M19.56 4.44l-1.42 1.42',
  searchX: 'M21 21l-4.35-4.35M10 17a7 7 0 100-14 7 7 0 000 14zM8 8l4 4m0-4l-4 4',
};

const VERIFICATION_METHOD_LABELS: Record<string, string> = {
  ENDORSEMENT: 'Endorsed',
  LLM: 'AI-verified',
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/u).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || '—';
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicCandidateProfilePage({ params }: PageProps) {
  const { slug } = use(params);
  const [profile, setProfile] = useState<PublicCandidateProfileDto | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'skills' | 'career' | 'projects' | 'certificates'>('skills');

  useEffect(() => {
    let cancelled = false;
    api.public
      .getCandidateProfile(slug)
      .then((res) => {
        if (!cancelled) setProfile(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isHireKiwiApiError(err) && err.statusCode === 404) {
          setNotFound(true);
        } else {
          setError('Could not load this profile right now.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 py-24 text-center">
        <Icon path={ICON_PATH.searchX} className="h-10 w-10 text-[var(--text-muted)]" />
        <h1 className="text-lg font-semibold">No profile at this link</h1>
        <p className="text-sm text-[var(--text-muted)]">
          This share link doesn&apos;t match a HireKiwi candidate profile. Double-check the link
          with whoever sent it to you.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center text-sm text-[var(--text-muted)]">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-[var(--text-muted)]">
        <Icon path={ICON_PATH.spinner} className="h-4 w-4 animate-spin" /> Loading profile…
      </div>
    );
  }

  const trackLabel = [profile.trackCategory === 'MBA' ? 'MBA' : null, profile.trackName]
    .filter(Boolean)
    .join(' · ');
  const headline = profile.headline ?? (trackLabel ? `${trackLabel} candidate` : null);
  const decodedSlug = decodeURIComponent(slug);
  const handle = decodedSlug.startsWith('@') ? decodedSlug : null;
  const verified = profile.skills.length > 0;
  const tabs = [
    { id: 'skills', label: 'Skills' },
    { id: 'career', label: 'Career' },
    { id: 'projects', label: 'Projects' },
    { id: 'certificates', label: 'Certificates' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white text-zinc-900" style={LIGHT_VARS}>
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <HireKiwiLogo kind="wordmark" className="h-8" />
          <div className="flex items-center gap-2">
            <a
              href={`${AUTH_URL}/login`}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Sign in
            </a>
            <a
              href={`${AUTH_URL}/register`}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Create account
            </a>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 pb-16 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Left: who this is. */}
        <aside className="lg:pt-2">
          <div className="mb-5 h-28 w-28 overflow-hidden rounded-full border border-[var(--surface-border)] bg-[var(--surface)] shadow-sm">
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={profile.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-3xl font-bold text-zinc-700">
                {initialsOf(profile.fullName)}
              </div>
            )}
          </div>

          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {profile.fullName}
            {verified ? (
              <span title="HireKiwi Verified" className="text-emerald-600">
                <Icon path={ICON_PATH.checkCircle} className="h-6 w-6" />
              </span>
            ) : null}
          </h1>
          {handle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{handle}</p> : null}
          {headline ? (
            <p className="mt-3 text-base leading-relaxed text-[var(--text-primary)]">
              “{headline}”
            </p>
          ) : null}
          {profile.certificate ? (
            <div className="mt-4">
              <TierBadge tier={profile.certificate.tier} showLabel />
            </div>
          ) : null}

          <h2 className="mt-8 text-lg font-semibold text-[var(--text-primary)]">At a glance</h2>
          <dl className="mt-3 divide-y divide-[var(--surface-border)] rounded-xl border border-[var(--surface-border)] bg-[var(--surface)]">
            {[
              ['Skills', profile.skills.length],
              ['Projects', profile.projects.length],
              ['Certificates', profile.externalCertificates.length],
              ['Work experience', profile.workExperience.length],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
                <dt className="text-[var(--text-muted)]">{label}</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{value}</dd>
              </div>
            ))}
          </dl>

          {profile.education.length > 0 ? (
            <>
              <h2 className="mt-8 text-lg font-semibold text-[var(--text-primary)]">Education</h2>
              <ul className="mt-3 space-y-3">
                {profile.education.map((entry, idx) => (
                  <li key={`${entry.institutionName}-${String(idx)}`} className="text-sm">
                    <p className="font-medium text-[var(--text-primary)]">
                      {entry.institutionName}
                    </p>
                    <p className="text-[var(--text-muted)]">
                      {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>

        {/* Right: the proof, in tabs. */}
        <section className="min-w-0">
          <div
            role="tablist"
            className="mt-6 flex flex-wrap gap-1 border-b border-[var(--surface-border)]"
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === item.id
                    ? 'border-zinc-900 text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-6" role="tabpanel">
            {tab === 'skills' ? (
              <Card
                title="Skills"
                hint="Verified skills are marked proven; the rest are still being verified."
              >
                {profile.skills.length === 0 ? (
                  <Empty>No verified skills yet.</Empty>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <SkillChip
                        key={skill.skillCode}
                        name={skill.skillName}
                        level={skill.proficiency}
                        inProgress={skill.inProgress}
                      />
                    ))}
                  </div>
                )}
              </Card>
            ) : null}

            {tab === 'career' ? (
              <Card title="Work experience" hint="Confirmed by the employer.">
                {profile.workExperience.length === 0 ? (
                  <Empty>No employer-verified work experience yet.</Empty>
                ) : (
                  <ul className="flex flex-col divide-y divide-[var(--surface-border)]">
                    {profile.workExperience.map((entry, idx) => (
                      <li
                        key={`${entry.companyName}-${String(idx)}`}
                        className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                          <Icon path={ICON_PATH.briefcase} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text-primary)]">
                            {entry.role} · {entry.companyName}{' '}
                            {entry.inProgress ? <InProgress /> : null}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {EMPLOYMENT_TYPE_LABELS[entry.employmentType] ?? entry.employmentType}
                            {' · '}
                            {formatDate(entry.startDate)} –{' '}
                            {entry.isCurrent
                              ? 'Present'
                              : entry.endDate
                                ? formatDate(entry.endDate)
                                : '—'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ) : null}

            {tab === 'projects' ? (
              <div className="flex flex-col gap-4">
                {profile.projects.length === 0 ? (
                  <Card title="Projects">
                    <Empty>No projects submitted yet.</Empty>
                  </Card>
                ) : (
                  profile.projects.map((project) => (
                    <div
                      key={project.projectId}
                      className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                          {project.title}
                        </h3>
                        {project.status === 'VERIFIED' ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <Icon path={ICON_PATH.checkCircle} className="h-3.5 w-3.5" />
                            {project.score !== null
                              ? `Verified · ${String(Math.round(project.score))}/100`
                              : 'Verified'}
                          </span>
                        ) : null}
                        <div className="ml-auto flex items-center gap-3">
                          {project.githubUrl ? (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                              aria-label="GitHub repository"
                            >
                              <Icon path={ICON_PATH.link} className="h-4 w-4" />
                            </a>
                          ) : null}
                          {project.liveUrl ? (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                              aria-label="Live demo"
                            >
                              <Icon path={ICON_PATH.externalLink} className="h-4 w-4" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-[var(--text-muted)]">
                        {project.outcome}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.stack
                          .split(',')
                          .map((tech) => tech.trim())
                          .filter(Boolean)
                          .map((tech) => (
                            <span
                              key={tech}
                              className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
                            >
                              {tech}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {tab === 'certificates' ? (
              <div className="flex flex-col gap-4">
                {profile.externalCertificates.length === 0 ? (
                  <Card title="Certificates">
                    <Empty>No verified certifications yet.</Empty>
                  </Card>
                ) : (
                  profile.externalCertificates.map((cert, idx) => (
                    <div
                      key={`${cert.title}-${String(idx)}`}
                      className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon path={ICON_PATH.award} className="h-4 w-4 text-[var(--text-muted)]" />
                        <p className="font-semibold text-[var(--text-primary)]">{cert.title}</p>
                        {cert.inProgress ? <InProgress /> : null}
                        {cert.verificationMethod ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <Icon path={ICON_PATH.checkCircle} className="h-3.5 w-3.5" />
                            {VERIFICATION_METHOD_LABELS[cert.verificationMethod] ??
                              cert.verificationMethod}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{cert.issuer}</p>
                      {cert.skills.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {cert.skills.map((skill) => (
                            <SkillChip
                              key={skill.skillName}
                              name={skill.skillName}
                              level={skill.proficiency}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      {hint ? <p className="mt-0.5 text-sm text-[var(--text-muted)]">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--text-muted)]">{children}</p>;
}

function InProgress() {
  return (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
      In progress
    </span>
  );
}

function SkillChip({
  name,
  level,
  inProgress = false,
}: {
  name: string;
  level: string;
  inProgress?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-1.5 text-sm">
      <span className="font-medium text-[var(--text-primary)]">{name}</span>
      <span className="h-3 w-px bg-[var(--surface-border)]" />
      <span className="text-xs font-semibold text-emerald-700">
        {level.charAt(0) + level.slice(1).toLowerCase()}
      </span>
      {inProgress ? <InProgress /> : null}
    </span>
  );
}
